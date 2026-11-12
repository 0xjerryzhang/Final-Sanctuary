import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { Card, Round } from './src/types';
import { evaluate7CardHand } from './src/utils/pokerEvaluator';
import { JJ_ALBUM_STAGES } from './src/data/albumStages';

// Use process.cwd() for CJS & ESM cross-compatibility (fixes dist/server.cjs startup crash)
const ROOT_DIR = process.cwd();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Ensure data directory exists for database file persistence
const DATA_DIR = path.join(ROOT_DIR, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'users_db.json');
const SECRET_FILE = path.join(DATA_DIR, '.server_secret');

function getOrCreateServerSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  try {
    if (fs.existsSync(SECRET_FILE)) {
      return fs.readFileSync(SECRET_FILE, 'utf-8').trim();
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, generated, 'utf-8');
    return generated;
  } catch {
    return 'final_sanctuary_fallback_hmac_secret_2026';
  }
}

const SERVER_SECRET = getOrCreateServerSecret();

/**
 * Hashes a plaintext password using scrypt with a 16-byte random salt.
 */
function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

/**
 * Verifies a password against a stored scrypt hash (or legacy plaintext for automatic migration).
 */
function verifyPassword(plain: string, stored?: string): { valid: boolean; needsMigration: boolean } {
  if (!stored) return { valid: false, needsMigration: false };
  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return { valid: false, needsMigration: false };
    const [, salt, hashHex] = parts;
    try {
      const derivedKey = crypto.scryptSync(plain, salt, 64);
      const storedBuf = Buffer.from(hashHex, 'hex');
      if (derivedKey.length !== storedBuf.length) return { valid: false, needsMigration: false };
      return { valid: crypto.timingSafeEqual(derivedKey, storedBuf), needsMigration: false };
    } catch {
      return { valid: false, needsMigration: false };
    }
  }
  // Legacy plaintext compatibility -> immediately flagged for migration
  return { valid: plain === stored, needsMigration: plain === stored };
}

function signUserToken(userId: string): string {
  const sig = crypto.createHmac('sha256', SERVER_SECRET).update(userId).digest('hex');
  return `${userId}.${sig}`;
}

export interface UserAccount {
  id: string;
  email?: string;
  password?: string; // Stored strictly as scrypt$salt$hash
  username: string;
  nickname: string;
  avatar: string;
  chips: number;
  level: number;
  exp: number;
  wins: number;
  losses: number;
  handsPlayed: number;
  lastCheckinDate?: string;
  createdAt: number;
  updatedAt: number;
}

function sanitizeUser(user: UserAccount): Omit<UserAccount, 'password'> {
  const { password: _removed, ...safeUser } = user;
  return safeUser;
}

// In-Memory Database Store backed by JSON file
const userStore = new Map<string, UserAccount>();

function saveDatabase() {
  try {
    const list = Array.from(userStore.values());
    fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server DB] Error saving database to disk:', err);
  }
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: UserAccount[] = JSON.parse(data);
      let migratedCount = 0;
      parsed.forEach(user => {
        // Automatically hash any legacy plaintext passwords on startup
        if (user.password && !user.password.startsWith('scrypt$')) {
          user.password = hashPassword(user.password);
          migratedCount++;
        }
        userStore.set(user.id, user);
      });
      if (migratedCount > 0) {
        saveDatabase();
        console.log(`[Server DB] Migrated ${migratedCount} legacy plaintext password(s) to scrypt hashes.`);
      }
      console.log(`[Server DB] Successfully loaded ${userStore.size} user account(s) from disk.`);
    }
  } catch (err) {
    console.error('[Server DB] Error reading users database file:', err);
  }
}

// Initial load
loadDatabase();

interface PlayerSession {
  id: string;
  userId?: string;
  name: string;
  avatar: string;
  chips: number;
  ws: WebSocket;
  roomId?: string;
  isReady?: boolean;
  preferredStageId?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface RoomSeat {
  id: string; // Matches session.id or bot id
  userId?: string;
  name: string;
  avatar: string;
  chips: number;
  currentBet: number;
  totalBetInHand: number;
  cards: Card[];
  isFolded: boolean;
  isAllIn: boolean;
  isBot: boolean;
  hasActedThisRound: boolean;
  lastAction: string;
  handDescription?: string;
  isReady: boolean;
  isOnline: boolean;
  ws?: WebSocket;
  disconnectedAt?: number;
}

interface Room {
  id: string;
  name: string;
  stageId: string;
  maxPlayers: number;
  players: RoomSeat[];
  messages: ChatMessage[];
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  createdAt: number;
  // Server-authoritative Texas Hold'em state
  deck: Card[];
  communityCards: Card[];
  pot: number;
  currentMaxBet: number;
  round: Round;
  activePlayerIndex: number;
  dealerIndex: number;
  sbIndex: number;
  bbIndex: number;
  smallBlind: number;
  bigBlind: number;
  startChips: number;
  handCount: number;
  winnerIds: string[];
  winningDescription: string;
  toastMsg: string;
  turnDeadline: number;
  turnTimer?: ReturnType<typeof setTimeout> | null;
  botTimer?: ReturnType<typeof setTimeout> | null;
}

const SERVER_BOT_POOL = [
  { id: 'bot_jiangnan', name: '江南小过客 (AI)', avatar: '🌂' },
  { id: 'bot_caocao', name: '枭雄曹操 (AI)', avatar: '⚔️' },
  { id: 'bot_years', name: '千年时光旅人 (AI)', avatar: '⏳' },
  { id: 'bot_love', name: '修炼爱情大师 (AI)', avatar: '🌸' },
];

const app = express();

// Enable CORS for iOS Capacitor (capacitor://localhost) and external web clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '6mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const host = request.headers.host || 'localhost';
    const url = new URL(request.url || '', `http://${host}`);
    if (url.pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch {
    socket.destroy();
  }
});

// In-memory WebSocket Game Engine State
const sessions = new Map<WebSocket, PlayerSession>();
const rooms = new Map<string, Room>();
const waitingQueue: PlayerSession[] = [];

function getStageConfig(stageId?: string) {
  const found = JJ_ALBUM_STAGES.find(s => s.id === stageId);
  return found || JJ_ALBUM_STAGES[0];
}

function createShuffledDeck(): Card[] {
  const suits: Card['suit'][] = ['S', 'H', 'D', 'C'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let value = 2; value <= 14; value++) {
      deck.push({ suit, value });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function clearRoomTimers(room: Room) {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }
  if (room.botTimer) {
    clearTimeout(room.botTimer);
    room.botTimer = null;
  }
}

function serializeRoomLobbyData(room: Room) {
  return {
    roomId: room.id,
    roomName: room.name,
    stageId: room.stageId,
    status: room.status,
    players: room.players.map(p => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      avatar: p.avatar,
      chips: p.chips,
      isReady: p.isReady,
      isBot: p.isBot,
      isOnline: p.isOnline,
    })),
  };
}

/**
 * Sends personalized GAME_STATE to each human player in the room.
 * Hole cards of other players remain hidden until Showdown!
 */
function broadcastGameState(room: Room) {
  const revealAllActiveCards = room.round === 'Showdown';

  room.players.forEach((recipientSeat) => {
    if (recipientSeat.isBot || !recipientSeat.ws || recipientSeat.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const personalizedPlayers = room.players.map((p) => {
      const isSelf = p.id === recipientSeat.id || (p.userId && p.userId === recipientSeat.userId);
      const shouldShowCards =
        isSelf || (revealAllActiveCards && !p.isFolded) || room.winnerIds.includes(p.id);

      const safeCards: Card[] = shouldShowCards
        ? p.cards
        : p.cards.map(() => ({ suit: 'S', value: 14 })); // Masked placeholder for card backs

      return {
        id: p.id,
        userId: p.userId,
        name: p.name,
        avatar: p.avatar,
        chips: p.chips,
        currentBet: p.currentBet,
        cards: safeCards,
        hasCards: p.cards.length > 0,
        isFolded: p.isFolded,
        isAllIn: p.isAllIn,
        isBot: p.isBot,
        lastAction: p.lastAction,
        handDescription: p.handDescription,
        isOnline: p.isOnline,
      };
    });

    const payload = {
      type: 'GAME_STATE',
      data: {
        roomId: room.id,
        roomName: room.name,
        stageId: room.stageId,
        status: room.status,
        round: room.round,
        pot: room.pot,
        currentMaxBet: room.currentMaxBet,
        communityCards: room.communityCards,
        activePlayerIndex: room.activePlayerIndex,
        dealerIndex: room.dealerIndex,
        sbIndex: room.sbIndex,
        bbIndex: room.bbIndex,
        smallBlind: room.smallBlind,
        bigBlind: room.bigBlind,
        startChips: room.startChips,
        handCount: room.handCount,
        winnerIds: room.winnerIds,
        winningDescription: room.winningDescription,
        toastMsg: room.toastMsg,
        turnDeadline: room.turnDeadline,
        mySeatId: recipientSeat.id,
        players: personalizedPlayers,
      },
    };

    recipientSeat.ws.send(JSON.stringify(payload));
  });
}

function broadcastToRoom(roomId: string, message: object, excludeWs?: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);

  room.players.forEach(p => {
    if (!p.isBot && p.ws && p.ws !== excludeWs && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(payload);
    }
  });
}

function broadcastOnlineStats() {
  const payload = JSON.stringify({
    type: 'STATS_UPDATE',
    data: {
      onlinePlayers: sessions.size,
      activeRooms: rooms.size,
      queueLength: waitingQueue.length,
    },
  });

  sessions.forEach((session) => {
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(payload);
    }
  });
}

/**
 * Starts a new hand on the server for a given room.
 */
function startServerHand(room: Room) {
  clearRoomTimers(room);

  // Remove any disconnected non-bot players who have been gone > 60s
  const now = Date.now();
  room.players = room.players.filter(p => p.isBot || p.isOnline || (p.disconnectedAt && now - p.disconnectedAt < 60000));

  const humanCount = room.players.filter(p => !p.isBot).length;
  if (humanCount === 0) {
    rooms.delete(room.id);
    broadcastOnlineStats();
    return;
  }

  // Ensure at least 2 players on the table; if only 1 human is left, add 1 bot opponent
  if (room.players.length < 2) {
    const botTemplate = SERVER_BOT_POOL[0];
    room.players.push({
      id: `${botTemplate.id}_${Date.now().toString(36)}`,
      name: botTemplate.name,
      avatar: botTemplate.avatar,
      chips: room.startChips,
      currentBet: 0,
      totalBetInHand: 0,
      cards: [],
      isFolded: false,
      isAllIn: false,
      isBot: true,
      hasActedThisRound: false,
      lastAction: '',
      isReady: true,
      isOnline: true,
    });
  }

  room.status = 'PLAYING';
  room.deck = createShuffledDeck();
  room.communityCards = [];
  room.winnerIds = [];
  room.winningDescription = '';
  room.handCount += 1;

  const numPlayers = room.players.length;
  const newDealerIdx = room.handCount === 1 ? 0 : (room.dealerIndex + 1) % numPlayers;
  // Standard Heads-Up (2 players): Dealer is Small Blind, other player is Big Blind
  const newSbIdx = numPlayers === 2 ? newDealerIdx : (newDealerIdx + 1) % numPlayers;
  const newBbIdx = numPlayers === 2 ? (newDealerIdx + 1) % 2 : (newSbIdx + 1) % numPlayers;

  room.dealerIndex = newDealerIdx;
  room.sbIndex = newSbIdx;
  room.bbIndex = newBbIdx;

  let initialPot = 0;

  room.players.forEach((p, idx) => {
    // Auto top-up if bankrupt
    if (p.chips <= room.bigBlind) {
      p.chips = room.startChips;
      if (!p.isBot && p.userId && userStore.has(p.userId)) {
        const acc = userStore.get(p.userId)!;
        if (acc.chips <= room.bigBlind) {
          acc.chips = room.startChips;
          saveDatabase();
        }
      }
    }

    const c1 = room.deck.pop()!;
    const c2 = room.deck.pop()!;
    p.cards = [c1, c2];
    p.currentBet = 0;
    p.totalBetInHand = 0;
    p.isFolded = false;
    p.isAllIn = false;
    p.hasActedThisRound = false;
    p.handDescription = undefined;
    p.lastAction = '';

    if (idx === newSbIdx) {
      const sbAmt = Math.min(p.chips, room.smallBlind);
      p.chips -= sbAmt;
      p.currentBet = sbAmt;
      p.totalBetInHand = sbAmt;
      p.isAllIn = p.chips === 0;
      p.lastAction = 'SB (小盲)';
      initialPot += sbAmt;
    } else if (idx === newBbIdx) {
      const bbAmt = Math.min(p.chips, room.bigBlind);
      p.chips -= bbAmt;
      p.currentBet = bbAmt;
      p.totalBetInHand = bbAmt;
      p.isAllIn = p.chips === 0;
      p.lastAction = 'BB (大盲)';
      initialPot += bbAmt;
    }
  });

  room.pot = initialPot;
  room.currentMaxBet = room.bigBlind;
  room.round = 'PreFlop';

  const firstToAct = (newBbIdx + 1) % numPlayers;
  room.activePlayerIndex = firstToAct;
  room.toastMsg = `🎟️ 第 ${room.handCount} 局开始！庄家【${room.players[newDealerIdx].name}】，请轮流行动！`;

  scheduleCurrentTurn(room);
  broadcastGameState(room);
}

function scheduleCurrentTurn(room: Room) {
  clearRoomTimers(room);

  if (room.round === 'Waiting' || room.round === 'Showdown' || room.activePlayerIndex < 0) {
    room.turnDeadline = 0;
    return;
  }

  const activeSeat = room.players[room.activePlayerIndex];
  if (!activeSeat || activeSeat.isFolded || activeSeat.isAllIn) {
    advanceTurnOrRound(room);
    return;
  }

  // 25-second action timer for human players; 1.1s thinking delay for server AI bots
  if (activeSeat.isBot) {
    room.turnDeadline = Date.now() + 2000;
    room.botTimer = setTimeout(() => {
      executeServerBotAction(room, room.activePlayerIndex);
    }, 1100);
  } else if (!activeSeat.isOnline) {
    // Disconnected human auto-acts after 2s
    room.turnDeadline = Date.now() + 2000;
    room.turnTimer = setTimeout(() => {
      const toCall = room.currentMaxBet - activeSeat.currentBet;
      processPlayerAction(room, activeSeat.id, toCall === 0 ? 'check' : 'fold');
    }, 2000);
  } else {
    room.turnDeadline = Date.now() + 25000;
    room.turnTimer = setTimeout(() => {
      const toCall = room.currentMaxBet - activeSeat.currentBet;
      processPlayerAction(room, activeSeat.id, toCall === 0 ? 'check' : 'fold');
    }, 25000);
  }
}

function executeServerBotAction(room: Room, botIdx: number) {
  const bot = room.players[botIdx];
  if (!bot || room.activePlayerIndex !== botIdx || room.round === 'Showdown' || room.round === 'Waiting') {
    return;
  }

  const fullHand = [...bot.cards, ...room.communityCards];
  const evalResult = evaluate7CardHand(fullHand);
  const toCall = room.currentMaxBet - bot.currentBet;
  const canRaise = bot.chips > toCall;
  const rank = Math.floor(evalResult.score / 10000000);

  if (toCall <= 0) {
    if (rank >= 2 && canRaise && Math.random() > 0.45) {
      const raiseTarget = Math.min(bot.chips + bot.currentBet, (room.currentMaxBet || room.bigBlind) + room.bigBlind);
      processPlayerAction(room, bot.id, 'raise', raiseTarget);
    } else {
      processPlayerAction(room, bot.id, 'check');
    }
  } else {
    const potOdds = toCall / Math.max(1, room.pot + toCall);
    let winProb = 0.18;
    if (rank >= 4) winProb = 0.92;
    else if (rank === 3) winProb = 0.78;
    else if (rank === 2) winProb = 0.58;
    else if (rank === 1) winProb = 0.38;

    if (winProb > potOdds) {
      if (rank >= 3 && canRaise && Math.random() > 0.55) {
        const raiseTarget = Math.min(bot.chips + bot.currentBet, room.currentMaxBet + room.bigBlind);
        processPlayerAction(room, bot.id, 'raise', raiseTarget);
      } else {
        processPlayerAction(room, bot.id, 'call');
      }
    } else if (toCall <= room.bigBlind && Math.random() > 0.35) {
      processPlayerAction(room, bot.id, 'call');
    } else {
      processPlayerAction(room, bot.id, 'fold');
    }
  }
}

function processPlayerAction(
  room: Room,
  seatId: string,
  action: 'fold' | 'check' | 'call' | 'raise' | 'allin',
  raiseAmount?: number
) {
  if (room.round === 'Waiting' || room.round === 'Showdown') return;

  const idx = room.players.findIndex(p => p.id === seatId);
  if (idx === -1 || idx !== room.activePlayerIndex) return;

  clearRoomTimers(room);

  const player = room.players[idx];
  const toCall = Math.max(0, room.currentMaxBet - player.currentBet);

  if (action === 'fold') {
    player.isFolded = true;
    player.hasActedThisRound = true;
    player.lastAction = '弃牌';
    room.toastMsg = `💨 [弃牌] ${player.name} 选择弃牌。`;
  } else if (action === 'check') {
    if (toCall > 0) {
      // Cannot check when facing a bet; fallback to call
      return processPlayerAction(room, seatId, 'call');
    }
    player.hasActedThisRound = true;
    player.lastAction = '过牌';
    room.toastMsg = `🎤 [过牌] ${player.name} 选择过牌。`;
  } else if (action === 'call') {
    const actualCall = Math.min(player.chips, toCall);
    player.chips -= actualCall;
    player.currentBet += actualCall;
    player.totalBetInHand += actualCall;
    room.pot += actualCall;
    player.hasActedThisRound = true;
    if (player.chips === 0) {
      player.isAllIn = true;
      player.lastAction = '全押';
      room.toastMsg = `🚀 [全押] ${player.name} 全押跟注 ${actualCall} 音符！`;
    } else {
      player.lastAction = '跟注';
      room.toastMsg = `🔊 [跟注] ${player.name} 跟注 ${actualCall} 圣所音符。`;
    }
  } else if (action === 'allin') {
    const allInAmt = player.chips;
    player.chips = 0;
    player.currentBet += allInAmt;
    player.totalBetInHand += allInAmt;
    room.pot += allInAmt;
    player.isAllIn = true;
    player.hasActedThisRound = true;
    player.lastAction = '全押';
    if (player.currentBet > room.currentMaxBet) {
      room.currentMaxBet = player.currentBet;
      // Other active players need to respond to the raise
      room.players.forEach((other, oIdx) => {
        if (oIdx !== idx && !other.isFolded && !other.isAllIn) {
          other.hasActedThisRound = false;
        }
      });
    }
    room.toastMsg = `🚀 [全押] ${player.name} 孤注一掷全押 ${allInAmt} 圣所音符！`;
  } else if (action === 'raise') {
    const minTarget = room.currentMaxBet === 0 ? room.bigBlind : room.currentMaxBet + room.bigBlind;
    const desiredTarget = typeof raiseAmount === 'number' ? raiseAmount : minTarget;
    const maxPossibleTarget = player.currentBet + player.chips;
    const clampedTarget = Math.min(maxPossibleTarget, Math.max(minTarget, desiredTarget));
    const addedChips = Math.max(0, clampedTarget - player.currentBet);

    if (addedChips <= toCall) {
      return processPlayerAction(room, seatId, player.chips <= toCall ? 'allin' : 'call');
    }

    player.chips -= addedChips;
    player.currentBet += addedChips;
    player.totalBetInHand += addedChips;
    room.pot += addedChips;
    player.hasActedThisRound = true;

    if (player.currentBet > room.currentMaxBet) {
      room.currentMaxBet = player.currentBet;
      room.players.forEach((other, oIdx) => {
        if (oIdx !== idx && !other.isFolded && !other.isAllIn) {
          other.hasActedThisRound = false;
        }
      });
    }

    if (player.chips === 0) {
      player.isAllIn = true;
      player.lastAction = '全押';
      room.toastMsg = `🚀 [全押] ${player.name} 全押加注至 ${player.currentBet} 音符！`;
    } else {
      player.lastAction = `加注(${player.currentBet})`;
      room.toastMsg = `🔥 [加注] ${player.name} 加注至 ${player.currentBet} 圣所音符！`;
    }
  }

  advanceTurnOrRound(room);
}

function advanceTurnOrRound(room: Room) {
  const nonFolded = room.players.filter(p => !p.isFolded);

  // Check if everyone else folded
  if (nonFolded.length === 1) {
    const soleWinner = nonFolded[0];
    soleWinner.chips += room.pot;
    room.winnerIds = [soleWinner.id];
    room.winningDescription = '对手全场弃牌';
    room.round = 'Showdown';
    room.activePlayerIndex = -1;
    room.turnDeadline = 0;
    room.toastMsg = `🏆 [本局结束] 其他玩家弃牌，${soleWinner.name} 赢下底池 ${room.pot} 圣所音符！`;

    syncRoomAccountsToStore(room, [soleWinner.id]);
    broadcastGameState(room);
    return;
  }

  // Check if betting round is complete
  const allMatchedAndActed = room.players.every(
    p => p.isFolded || p.isAllIn || (p.hasActedThisRound && p.currentBet === room.currentMaxBet)
  );

  if (allMatchedAndActed) {
    advanceServerStreet(room);
    return;
  }

  // Find next player who can act
  const total = room.players.length;
  let nextIdx = room.activePlayerIndex;
  for (let i = 0; i < total; i++) {
    nextIdx = (nextIdx + 1) % total;
    const candidate = room.players[nextIdx];
    if (!candidate.isFolded && !candidate.isAllIn) {
      room.activePlayerIndex = nextIdx;
      scheduleCurrentTurn(room);
      broadcastGameState(room);
      return;
    }
  }

  // No one left who can act -> advance street
  advanceServerStreet(room);
}

function advanceServerStreet(room: Room) {
  clearRoomTimers(room);

  room.players.forEach(p => {
    p.currentBet = 0;
    p.hasActedThisRound = false;
    if (!p.isFolded && !p.isAllIn) {
      p.lastAction = '';
    }
  });
  room.currentMaxBet = 0;

  if (room.round === 'PreFlop') {
    room.communityCards.push(room.deck.pop()!, room.deck.pop()!, room.deck.pop()!);
    room.round = 'Flop';
    room.toastMsg = '🌈 [翻牌圈] 揭开前 3 张公共牌！';
  } else if (room.round === 'Flop') {
    room.communityCards.push(room.deck.pop()!);
    room.round = 'Turn';
    room.toastMsg = '✨ [转牌圈] 揭开第 4 张公共牌！';
  } else if (room.round === 'Turn') {
    room.communityCards.push(room.deck.pop()!);
    room.round = 'River';
    room.toastMsg = '🎭 [河牌圈] 揭开最后 1 张公共牌！';
  } else if (room.round === 'River') {
    evaluateServerShowdown(room);
    return;
  }

  const playersAbleToAct = room.players.filter(p => !p.isFolded && !p.isAllIn);
  if (playersAbleToAct.length <= 1) {
    // Everyone is All-In (or only 1 has chips left), deal remaining streets automatically
    broadcastGameState(room);
    room.botTimer = setTimeout(() => {
      advanceServerStreet(room);
    }, 1200);
    return;
  }

  // First active player to the left of dealer acts first post-flop
  const total = room.players.length;
  let firstIdx = room.dealerIndex;
  for (let i = 0; i < total; i++) {
    firstIdx = (firstIdx + 1) % total;
    if (!room.players[firstIdx].isFolded && !room.players[firstIdx].isAllIn) {
      room.activePlayerIndex = firstIdx;
      break;
    }
  }

  scheduleCurrentTurn(room);
  broadcastGameState(room);
}

/**
 * Evaluates Showdown with full Main Pot + Side Pots calculation.
 */
function evaluateServerShowdown(room: Room) {
  clearRoomTimers(room);
  room.round = 'Showdown';
  room.activePlayerIndex = -1;
  room.turnDeadline = 0;

  // Evaluate hands for all non-folded players
  const evalMap = new Map<string, ReturnType<typeof evaluate7CardHand>>();
  room.players.forEach(p => {
    if (!p.isFolded) {
      const ev = evaluate7CardHand([...p.cards, ...room.communityCards]);
      evalMap.set(p.id, ev);
      p.handDescription = ev.description;
    }
  });

  // Calculate Main Pot & Side Pots based on totalBetInHand of non-folded players
  const nonFoldedBets = room.players
    .filter(p => !p.isFolded && p.totalBetInHand > 0)
    .map(p => p.totalBetInHand);

  const uniqueLevels = Array.from(new Set(nonFoldedBets)).sort((a, b) => a - b);
  const allWinnerIds = new Set<string>();
  const payouts = new Map<string, number>();

  if (uniqueLevels.length === 0) {
    // Edge case: 0 bets
    const active = room.players.filter(p => !p.isFolded);
    let bestScore = -1;
    active.forEach(p => {
      const sc = evalMap.get(p.id)?.score ?? 0;
      if (sc > bestScore) bestScore = sc;
    });
    const winners = active.filter(p => (evalMap.get(p.id)?.score ?? 0) === bestScore);
    const share = winners.length > 0 ? Math.floor(room.pot / winners.length) : 0;
    winners.forEach(w => {
      w.chips += share;
      allWinnerIds.add(w.id);
      payouts.set(w.id, (payouts.get(w.id) || 0) + share);
    });
  } else {
    for (let idx = 0; idx < uniqueLevels.length; idx++) {
      const prevLevel = idx === 0 ? 0 : uniqueLevels[idx - 1];
      const currLevel = uniqueLevels[idx];
      let subPot = 0;

      room.players.forEach(p => {
        const contribution = Math.max(0, Math.min(p.totalBetInHand, currLevel) - prevLevel);
        subPot += contribution;
        // Include any excess folded bets above highest non-folded level into the top pot
        if (idx === uniqueLevels.length - 1 && p.isFolded && p.totalBetInHand > currLevel) {
          subPot += p.totalBetInHand - currLevel;
        }
      });

      if (subPot <= 0) continue;

      const eligible = room.players.filter(p => !p.isFolded && p.totalBetInHand >= currLevel);
      let maxScore = -1;
      eligible.forEach(p => {
        const sc = evalMap.get(p.id)?.score ?? -1;
        if (sc > maxScore) maxScore = sc;
      });

      const subWinners = eligible.filter(p => (evalMap.get(p.id)?.score ?? -1) === maxScore);
      if (subWinners.length > 0) {
        const baseShare = Math.floor(subPot / subWinners.length);
        let remainder = subPot - baseShare * subWinners.length;
        subWinners.forEach(w => {
          const extra = remainder > 0 ? 1 : 0;
          if (remainder > 0) remainder -= 1;
          const totalWon = baseShare + extra;
          w.chips += totalWon;
          allWinnerIds.add(w.id);
          payouts.set(w.id, (payouts.get(w.id) || 0) + totalWon);
        });
      }
    }
  }

  const winnerList = Array.from(allWinnerIds);
  room.winnerIds = winnerList;

  const primaryWinner = room.players.find(p => p.id === winnerList[0]);
  const primaryDesc = primaryWinner ? evalMap.get(primaryWinner.id)?.description || '' : '';
  const primaryWonAmt = primaryWinner ? payouts.get(primaryWinner.id) || room.pot : room.pot;

  room.winningDescription = primaryDesc;
  room.toastMsg = primaryWinner
    ? `👑 [摊牌结算] ${primaryWinner.name} 凭借【${primaryDesc}】赢取 ${primaryWonAmt} 圣所音符！`
    : '👑 [摊牌结算] 本局结束！';

  syncRoomAccountsToStore(room, winnerList);
  broadcastGameState(room);
}

function syncRoomAccountsToStore(room: Room, winnerIds: string[]) {
  let changed = false;
  room.players.forEach(p => {
    if (!p.isBot && p.userId && userStore.has(p.userId)) {
      const acc = userStore.get(p.userId)!;
      acc.chips = p.chips;
      acc.handsPlayed = (acc.handsPlayed || 0) + 1;
      if (winnerIds.includes(p.id)) {
        acc.wins = (acc.wins || 0) + 1;
      } else {
        acc.losses = (acc.losses || 0) + 1;
      }
      acc.updatedAt = Date.now();
      changed = true;
    }
  });
  if (changed) {
    saveDatabase();
  }
}

function createRoomInstance(name: string, stageId: string, maxPlayers: number, initialSeats: RoomSeat[]): Room {
  const stage = getStageConfig(stageId);
  const roomId = `sanctuary-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  return {
    id: roomId,
    name,
    stageId: stage.id,
    maxPlayers: Math.min(5, Math.max(2, maxPlayers || 5)),
    players: initialSeats,
    messages: [],
    status: 'WAITING',
    createdAt: Date.now(),
    deck: [],
    communityCards: [],
    pot: 0,
    currentMaxBet: 0,
    round: 'Waiting',
    activePlayerIndex: -1,
    dealerIndex: 0,
    sbIndex: 0,
    bbIndex: 1,
    smallBlind: stage.smallBlind,
    bigBlind: stage.bigBlind,
    startChips: stage.startChips,
    handCount: 0,
    winnerIds: [],
    winningDescription: '',
    toastMsg: '🎵 欢迎进入圣所实时联机牌桌！',
    turnDeadline: 0,
  };
}

function createSeatFromSession(session: PlayerSession, defaultChips: number): RoomSeat {
  const chips = session.chips > 100 ? session.chips : defaultChips;
  return {
    id: session.id,
    userId: session.userId,
    name: session.name,
    avatar: session.avatar,
    chips,
    currentBet: 0,
    totalBetInHand: 0,
    cards: [],
    isFolded: false,
    isAllIn: false,
    isBot: false,
    hasActedThisRound: false,
    lastAction: '',
    isReady: !!session.isReady,
    isOnline: true,
    ws: session.ws,
  };
}

function launchRoomOnlineGame(room: Room, fillWithBots: boolean) {
  if (fillWithBots) {
    let botIndex = 0;
    while (room.players.length < room.maxPlayers && botIndex < SERVER_BOT_POOL.length) {
      const botInfo = SERVER_BOT_POOL[botIndex++];
      if (!room.players.some(p => p.name === botInfo.name)) {
        room.players.push({
          id: `${botInfo.id}_${Math.random().toString(36).substring(2, 5)}`,
          name: botInfo.name,
          avatar: botInfo.avatar,
          chips: room.startChips,
          currentBet: 0,
          totalBetInHand: 0,
          cards: [],
          isFolded: false,
          isAllIn: false,
          isBot: true,
          hasActedThisRound: false,
          lastAction: '',
          isReady: true,
          isOnline: true,
        });
      }
    }
  } else if (room.players.length < 2) {
    // Minimum 2 players required for a poker hand; add 1 server AI if solo
    const botInfo = SERVER_BOT_POOL[0];
    room.players.push({
      id: `${botInfo.id}_${Math.random().toString(36).substring(2, 5)}`,
      name: botInfo.name,
      avatar: botInfo.avatar,
      chips: room.startChips,
      currentBet: 0,
      totalBetInHand: 0,
      cards: [],
      isFolded: false,
      isAllIn: false,
      isBot: true,
      hasActedThisRound: false,
      lastAction: '',
      isReady: true,
      isOnline: true,
    });
  }

  startServerHand(room);

  // Notify all room members that the game has started so their UI switches to GameTable
  broadcastToRoom(room.id, {
    type: 'GAME_STARTED',
    data: {
      roomId: room.id,
      roomName: room.name,
      stageId: room.stageId,
    },
  });

  // Follow immediately with personalized GAME_STATE
  broadcastGameState(room);
  broadcastOnlineStats();
}

function matchmakePlayers() {
  // First check if any waiting player can join an existing WAITING room
  for (let i = waitingQueue.length - 1; i >= 0; i--) {
    const candidate = waitingQueue[i];
    const openRoom = Array.from(rooms.values()).find(
      r => r.status === 'WAITING' && r.players.length < r.maxPlayers
    );
    if (openRoom && waitingQueue.length === 1) {
      waitingQueue.splice(i, 1);
      candidate.roomId = openRoom.id;
      candidate.isReady = true;
      openRoom.players.push(createSeatFromSession(candidate, openRoom.startChips));

      const lobbyPayload = serializeRoomLobbyData(openRoom);
      broadcastToRoom(openRoom.id, {
        type: 'MATCH_FOUND',
        data: lobbyPayload,
      });
      broadcastOnlineStats();
      return;
    }
  }

  while (waitingQueue.length >= 2) {
    const matchedSessions = waitingQueue.splice(0, 5);
    const preferredStageId = matchedSessions[0]?.preferredStageId || 'music_voyager';
    const stage = getStageConfig(preferredStageId);
    const seats = matchedSessions.map(s => {
      s.isReady = false;
      return createSeatFromSession(s, stage.startChips);
    });

    const newRoom = createRoomInstance(`${stage.shortTitle} · 圣所匹配桌`, stage.id, 5, seats);
    rooms.set(newRoom.id, newRoom);

    const lobbyData = serializeRoomLobbyData(newRoom);
    matchedSessions.forEach(s => {
      s.roomId = newRoom.id;
      if (s.ws.readyState === WebSocket.OPEN) {
        s.ws.send(JSON.stringify({
          type: 'MATCH_FOUND',
          data: lobbyData,
        }));
      }
    });
    broadcastOnlineStats();
  }
}

// REST API Health Check & Online Stats
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    onlinePlayers: sessions.size,
    activeRooms: rooms.size,
    queueLength: waitingQueue.length,
    registeredUsers: userStore.size,
    timestamp: Date.now(),
  });
});

app.get('/api/online-stats', (req, res) => {
  res.json({
    onlinePlayers: sessions.size,
    activeRooms: rooms.size,
    queueLength: waitingQueue.length,
    rooms: Array.from(rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      stageId: r.stageId,
      playerCount: r.players.length,
      maxPlayers: r.maxPlayers,
      status: r.status,
    })),
  });
});

// REST API Cloud User Account Authentication & Persistence
app.post('/api/user/auth', (req, res) => {
  const { userId, nickname, avatar, email } = req.body;
  let user: UserAccount | undefined;

  if (userId && userStore.has(userId)) {
    user = userStore.get(userId)!;
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    if (email && !user.email) user.email = email;
    user.updatedAt = Date.now();
  } else {
    const newId = userId || `jj_user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    user = {
      id: newId,
      email: email || undefined,
      username: nickname || `JM_${Math.floor(1000 + Math.random() * 9000)}`,
      nickname: nickname || `圣所乐迷_${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      chips: 130700,
      level: 1,
      exp: 0,
      wins: 0,
      losses: 0,
      handsPlayed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    userStore.set(user.id, user);
  }

  saveDatabase();
  res.json({ success: true, user: sanitizeUser(user), authToken: signUserToken(user.id) });
});

// Email Registration Endpoint (Salted scrypt password hash)
app.post('/api/user/register', (req, res) => {
  const { email, password, nickname, avatar, currentUserId } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: '请提供有效的电子邮箱地址' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度至少需为6位字符' });
  }

  const existingWithEmail = Array.from(userStore.values()).find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingWithEmail) {
    return res.status(400).json({ success: false, message: '该邮箱已被注册，请直接使用密码登录' });
  }

  const hashedPassword = hashPassword(password);

  let user: UserAccount;
  if (currentUserId && userStore.has(currentUserId)) {
    user = userStore.get(currentUserId)!;
    user.email = email.toLowerCase();
    user.password = hashedPassword;
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    user.updatedAt = Date.now();
  } else {
    const newId = `jj_user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    user = {
      id: newId,
      email: email.toLowerCase(),
      password: hashedPassword,
      username: nickname || email.split('@')[0],
      nickname: nickname || `圣所乐迷_${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      chips: 130700,
      level: 1,
      exp: 0,
      wins: 0,
      losses: 0,
      handsPlayed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    userStore.set(user.id, user);
  }

  saveDatabase();
  res.json({
    success: true,
    message: '注册成功，赠送 130,700 圣所音符！账号已加密绑定。',
    user: sanitizeUser(user),
    authToken: signUserToken(user.id),
  });
});

// Daily Check-in Endpoint (+3270 Sanctuary Notes, strictly server-controlled once per day)
app.post('/api/user/checkin', (req, res) => {
  const { userId } = req.body;
  if (!userId || !userStore.has(userId)) {
    return res.status(404).json({ success: false, message: '账号未找到，请先登录账号' });
  }

  const user = userStore.get(userId)!;
  const todayStr = new Date().toISOString().split('T')[0];

  if (user.lastCheckinDate === todayStr) {
    return res.json({
      success: false,
      alreadyCheckedIn: true,
      message: '您今天已经签过到啦！明日再来领取 3,270 圣所音符吧！',
      user: sanitizeUser(user),
    });
  }

  user.chips = (user.chips || 0) + 3270;
  user.lastCheckinDate = todayStr;
  user.updatedAt = Date.now();
  saveDatabase();

  return res.json({
    success: true,
    alreadyCheckedIn: false,
    reward: 3270,
    message: '🎉 每日签到成功！增发 3,270 圣所音符！',
    user: sanitizeUser(user),
  });
});

// Email Login Endpoint (Timing-safe scrypt hash verification)
app.post('/api/user/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: '请输入邮箱和密码' });
  }

  const user = Array.from(userStore.values()).find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({ success: false, message: '该邮箱尚未注册，请先注册账号' });
  }

  const { valid, needsMigration } = verifyPassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: '登录密码不正确，请重新输入' });
  }

  if (needsMigration) {
    user.password = hashPassword(password);
    user.updatedAt = Date.now();
    saveDatabase();
  }

  res.json({
    success: true,
    message: '登录成功！已载入您的云端账号',
    user: sanitizeUser(user),
    authToken: signUserToken(user.id),
  });
});

// Account Deletion Endpoint (Mandatory for Apple App Store / iOS TestFlight Guideline 5.1.1(v))
app.post('/api/user/delete', (req, res) => {
  const { userId, email } = req.body;
  let deleted = false;

  if (userId && userStore.has(userId)) {
    userStore.delete(userId);
    deleted = true;
  } else if (email) {
    const found = Array.from(userStore.values()).find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      userStore.delete(found.id);
      deleted = true;
    }
  }

  if (deleted) {
    saveDatabase();
  }

  res.json({
    success: true,
    message: '您的账号及云端关联数据已彻底注销并删除。',
  });
});

// Query Authoritative User Chips & Stats (Server is sole source of truth for chips; client cannot set arbitrary chips)
app.post('/api/user/chips', (req, res) => {
  const { userId } = req.body;
  if (!userId || !userStore.has(userId)) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const user = userStore.get(userId)!;
  res.json({ success: true, user: sanitizeUser(user) });
});

// Get Leaderboard (Sanitized - never leaks password hashes or emails)
app.get('/api/leaderboard', (req, res) => {
  const sorted = Array.from(userStore.values())
    .sort((a, b) => b.chips - a.chips)
    .slice(0, 20)
    .map(u => ({
      id: u.id,
      nickname: u.nickname,
      avatar: u.avatar,
      chips: u.chips,
      wins: u.wins,
      losses: u.losses,
      level: u.level,
    }));
  res.json({ success: true, leaderboard: sorted });
});

// WebSocket Connection Handler
wss.on('connection', (ws: WebSocket) => {
  const playerId = `player_${Math.random().toString(36).substring(2, 9)}`;
  const session: PlayerSession = {
    id: playerId,
    name: `JM_${Math.floor(1000 + Math.random() * 9000)}`,
    avatar: '🎤',
    chips: 130700,
    ws,
  };

  sessions.set(ws, session);

  ws.send(JSON.stringify({
    type: 'CONNECTED',
    data: {
      playerId,
      name: session.name,
      chips: session.chips,
      onlinePlayers: sessions.size,
      activeRooms: rooms.size,
    }
  }));

  broadcastOnlineStats();

  ws.on('message', (rawMessage: string) => {
    try {
      const parsed = JSON.parse(rawMessage.toString());
      const { type, payload } = parsed;

      switch (type) {
        case 'INIT_USER': {
          const uId = payload?.userId || session.id;
          session.userId = uId;

          let account = userStore.get(uId);
          if (!account) {
            account = {
              id: uId,
              username: payload?.name || session.name,
              nickname: payload?.name || session.name,
              avatar: payload?.avatar || session.avatar,
              chips: 130700, // Server-authoritative initial grant; ignores any client-passed chips
              level: 1,
              exp: 0,
              wins: 0,
              losses: 0,
              handsPlayed: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            userStore.set(uId, account);
          } else {
            if (payload?.name) account.nickname = payload.name;
            if (payload?.avatar) account.avatar = payload.avatar;
            // Authoritative chips: never allow client INIT_USER payload to overwrite server account.chips
            account.updatedAt = Date.now();
          }

          saveDatabase();

          session.name = account.nickname;
          session.avatar = account.avatar;
          session.chips = account.chips;

          // Check if user is reconnecting to an active room
          const targetReconnectRoomId = payload?.reconnectRoomId;
          let reconnectedRoom: Room | undefined;

          if (targetReconnectRoomId && rooms.has(targetReconnectRoomId)) {
            reconnectedRoom = rooms.get(targetReconnectRoomId);
          } else {
            reconnectedRoom = Array.from(rooms.values()).find(r =>
              r.players.some(p => !p.isBot && p.userId === uId)
            );
          }

          if (reconnectedRoom) {
            const existingSeat = reconnectedRoom.players.find(
              p => !p.isBot && (p.userId === uId || p.id === session.id)
            );
            if (existingSeat) {
              session.id = existingSeat.id;
              session.roomId = reconnectedRoom.id;
              existingSeat.ws = ws;
              existingSeat.isOnline = true;
              existingSeat.disconnectedAt = undefined;
              existingSeat.name = session.name;
              existingSeat.avatar = session.avatar;
            }
          }

          ws.send(JSON.stringify({
            type: 'USER_UPDATED',
            data: {
              id: session.id,
              userId: account.id,
              name: account.nickname,
              avatar: account.avatar,
              chips: account.chips,
              wins: account.wins,
              losses: account.losses,
              level: account.level,
            }
          }));

          if (reconnectedRoom && reconnectedRoom.status === 'PLAYING') {
            broadcastGameState(reconnectedRoom);
          }
          break;
        }

        case 'SYNC_CHIPS': {
          // Server is authoritative for chips: return current server balance without accepting client chip overrides
          if (session.userId && userStore.has(session.userId)) {
            const acc = userStore.get(session.userId)!;
            session.chips = acc.chips;
            ws.send(JSON.stringify({
              type: 'USER_UPDATED',
              data: {
                id: session.id,
                userId: acc.id,
                name: acc.nickname,
                avatar: acc.avatar,
                chips: acc.chips,
                wins: acc.wins,
                losses: acc.losses,
              }
            }));
          }
          break;
        }

        case 'JOIN_MATCHMAKING': {
          if (payload?.stageId) {
            session.preferredStageId = payload.stageId;
          }
          if (!waitingQueue.find(p => p.id === session.id)) {
            waitingQueue.push(session);
            ws.send(JSON.stringify({
              type: 'QUEUE_STATUS',
              data: { inQueue: true, position: waitingQueue.length }
            }));
            matchmakePlayers();
            broadcastOnlineStats();
          }
          break;
        }

        case 'LEAVE_MATCHMAKING': {
          const idx = waitingQueue.findIndex(p => p.id === session.id);
          if (idx !== -1) {
            waitingQueue.splice(idx, 1);
            ws.send(JSON.stringify({
              type: 'QUEUE_STATUS',
              data: { inQueue: false, position: 0 }
            }));
            broadcastOnlineStats();
          }
          break;
        }

        case 'CREATE_ROOM': {
          const stage = getStageConfig(payload?.stageId);
          session.isReady = false;
          const initialSeat = createSeatFromSession(session, stage.startChips);
          const newRoom = createRoomInstance(
            payload?.name || `${session.name}的圣所牌桌`,
            stage.id,
            payload?.maxPlayers || 5,
            [initialSeat]
          );

          session.roomId = newRoom.id;
          rooms.set(newRoom.id, newRoom);

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            data: serializeRoomLobbyData(newRoom),
          }));

          broadcastOnlineStats();
          break;
        }

        case 'JOIN_ROOM': {
          const targetRoom = rooms.get(payload?.roomId);
          if (!targetRoom) {
            ws.send(JSON.stringify({ type: 'ERROR', message: '未找到该房间或房间已解散' }));
            break;
          }

          const existingSeat = targetRoom.players.find(
            p => p.id === session.id || (session.userId && p.userId === session.userId)
          );

          if (!existingSeat) {
            const nonBotSeats = targetRoom.players.filter(p => !p.isBot);
            if (nonBotSeats.length >= targetRoom.maxPlayers) {
              ws.send(JSON.stringify({ type: 'ERROR', message: '该房间座位已满' }));
              break;
            }
            // If room has bots and a real player joins, replace a bot if full
            if (targetRoom.players.length >= targetRoom.maxPlayers) {
              const botIdx = targetRoom.players.findIndex(p => p.isBot);
              if (botIdx !== -1) {
                targetRoom.players.splice(botIdx, 1);
              }
            }
            session.isReady = false;
            targetRoom.players.push(createSeatFromSession(session, targetRoom.startChips));
          } else {
            existingSeat.ws = ws;
            existingSeat.isOnline = true;
            existingSeat.disconnectedAt = undefined;
            session.id = existingSeat.id;
          }

          session.roomId = targetRoom.id;

          broadcastToRoom(targetRoom.id, {
            type: 'ROOM_UPDATED',
            data: serializeRoomLobbyData(targetRoom),
          });

          if (targetRoom.status === 'PLAYING') {
            ws.send(JSON.stringify({
              type: 'GAME_STARTED',
              data: {
                roomId: targetRoom.id,
                roomName: targetRoom.name,
                stageId: targetRoom.stageId,
              },
            }));
            broadcastGameState(targetRoom);
          }

          broadcastOnlineStats();
          break;
        }

        case 'LEAVE_ROOM': {
          const rId = payload?.roomId || session.roomId;
          if (rId && rooms.has(rId)) {
            const room = rooms.get(rId)!;
            const seatIdx = room.players.findIndex(p => p.id === session.id);
            if (seatIdx !== -1) {
              if (room.status === 'PLAYING' && room.round !== 'Waiting' && room.round !== 'Showdown') {
                // Fold player first if it was their turn
                room.players[seatIdx].isFolded = true;
                if (room.activePlayerIndex === seatIdx) {
                  advanceTurnOrRound(room);
                }
              }
              room.players.splice(seatIdx, 1);
              if (room.dealerIndex >= room.players.length) {
                room.dealerIndex = 0;
              }
            }

            const remainingHumans = room.players.filter(p => !p.isBot);
            if (remainingHumans.length === 0) {
              clearRoomTimers(room);
              rooms.delete(room.id);
            } else {
              broadcastToRoom(room.id, {
                type: 'ROOM_UPDATED',
                data: serializeRoomLobbyData(room),
              });
              if (room.status === 'PLAYING') {
                broadcastGameState(room);
              }
            }
          }
          session.roomId = undefined;
          session.isReady = false;
          ws.send(JSON.stringify({ type: 'LEFT_ROOM' }));
          broadcastOnlineStats();
          break;
        }

        case 'SEND_CHAT': {
          if (!session.roomId) break;
          const room = rooms.get(session.roomId);
          if (!room) break;

          const msg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            senderId: session.id,
            senderName: session.name,
            avatar: session.avatar || '🎤',
            text: (payload?.text || '').slice(0, 200),
            timestamp: Date.now(),
          };

          room.messages.push(msg);
          if (room.messages.length > 50) room.messages.shift();

          broadcastToRoom(room.id, {
            type: 'NEW_CHAT_MESSAGE',
            data: msg
          });
          break;
        }

        case 'TOGGLE_READY': {
          if (!session.roomId) break;
          const room = rooms.get(session.roomId);
          if (!room) break;

          session.isReady = !session.isReady;
          const seat = room.players.find(p => p.id === session.id);
          if (seat) {
            seat.isReady = session.isReady;
          }

          const humanSeats = room.players.filter(p => !p.isBot);
          const allReady = humanSeats.length >= 2 && humanSeats.every(p => p.isReady);

          broadcastToRoom(room.id, {
            type: 'PLAYER_READY_CHANGED',
            data: {
              playerId: session.id,
              isReady: session.isReady,
              allReady,
              players: serializeRoomLobbyData(room).players,
            }
          });

          // Automatically launch the real-time game when all (>=2) human players are ready!
          if (allReady && room.status === 'WAITING') {
            setTimeout(() => {
              if (rooms.has(room.id) && room.status === 'WAITING') {
                launchRoomOnlineGame(room, false);
              }
            }, 600);
          }
          break;
        }

        case 'START_ONLINE_GAME': {
          const rId = payload?.roomId || session.roomId;
          if (!rId) break;
          const room = rooms.get(rId);
          if (!room) break;

          const fillWithBots = !!payload?.fillWithBots;
          launchRoomOnlineGame(room, fillWithBots);
          break;
        }

        case 'PLAYER_ACTION': {
          const rId = payload?.roomId || session.roomId;
          if (!rId) break;
          const room = rooms.get(rId);
          if (!room) break;

          const action = payload?.action;
          const raiseAmount = payload?.raiseAmount;
          if (['fold', 'check', 'call', 'raise', 'allin'].includes(action)) {
            processPlayerAction(room, session.id, action, raiseAmount);
          }
          break;
        }

        case 'NEXT_HAND': {
          const rId = payload?.roomId || session.roomId;
          if (!rId) break;
          const room = rooms.get(rId);
          if (!room) break;

          if (room.round === 'Showdown' || room.round === 'Waiting') {
            startServerHand(room);
          }
          break;
        }

        case 'GET_GAME_STATE': {
          const rId = payload?.roomId || session.roomId;
          if (!rId) break;
          const room = rooms.get(rId);
          if (!room) break;

          broadcastGameState(room);
          break;
        }

        case 'PING': {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('WebSocket Error processing message:', err);
    }
  });

  ws.on('close', () => {
    const idx = waitingQueue.findIndex(p => p.id === session.id);
    if (idx !== -1) waitingQueue.splice(idx, 1);

    if (session.roomId) {
      const room = rooms.get(session.roomId);
      if (room) {
        const seat = room.players.find(p => p.id === session.id);
        if (room.status === 'PLAYING' && seat) {
          // Mark player temporarily offline for reconnect grace period
          seat.isOnline = false;
          seat.disconnectedAt = Date.now();
          const anyOnlineHumans = room.players.some(p => !p.isBot && p.isOnline);
          if (!anyOnlineHumans) {
            // Keep room alive briefly for 30s in case of page refresh, then clean up
            setTimeout(() => {
              const currentRoom = rooms.get(room.id);
              if (currentRoom && !currentRoom.players.some(p => !p.isBot && p.isOnline)) {
                clearRoomTimers(currentRoom);
                rooms.delete(room.id);
                broadcastOnlineStats();
              }
            }, 30000);
          } else {
            broadcastGameState(room);
          }
        } else {
          // In WAITING lobby, remove player immediately
          room.players = room.players.filter(p => p.id !== session.id);
          const remainingHumans = room.players.filter(p => !p.isBot);
          if (remainingHumans.length === 0) {
            clearRoomTimers(room);
            rooms.delete(session.roomId);
          } else {
            broadcastToRoom(room.id, {
              type: 'ROOM_UPDATED',
              data: serializeRoomLobbyData(room),
            });
          }
        }
      }
    }

    sessions.delete(ws);
    broadcastOnlineStats();
  });
});

// Configure Vite or Static Production middleware
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`[Final Sanctuary Server] Running on http://${HOST}:${PORT}`);
    console.log(`[WebSocket] Authoritative Texas Hold'em Engine listening on /ws`);
  });
}

setupServer().catch(err => {
  console.error('Failed to start server:', err);
});
