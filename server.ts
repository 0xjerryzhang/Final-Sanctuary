import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';

// Ensure data directory exists for database file persistence
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'users_db.json');

export interface UserAccount {
  id: string;
  email?: string;
  password?: string;
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

// In-Memory Database Store backed by JSON file
const userStore = new Map<string, UserAccount>();

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: UserAccount[] = JSON.parse(data);
      parsed.forEach(user => userStore.set(user.id, user));
      console.log(`[Server DB] Successfully loaded ${userStore.size} user account(s) from disk.`);
    }
  } catch (err) {
    console.error('[Server DB] Error reading users database file:', err);
  }
}

function saveDatabase() {
  try {
    const list = Array.from(userStore.values());
    fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server DB] Error saving database to disk:', err);
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
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface Room {
  id: string;
  name: string;
  stageId: string;
  maxPlayers: number;
  players: PlayerSession[];
  messages: ChatMessage[];
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  createdAt: number;
}

const app = express();
app.use(express.json());

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
  } catch (err) {
    socket.destroy();
  }
});

// In-memory WebSocket Game Engine State
const sessions = new Map<WebSocket, PlayerSession>();
const rooms = new Map<string, Room>();
const waitingQueue: PlayerSession[] = [];

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
    if (email) user.email = email;
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
  res.json({ success: true, user });
});

// Email Registration Endpoint
app.post('/api/user/register', (req, res) => {
  const { email, password, nickname, avatar, currentUserId } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: '请提供有效的电子邮箱地址' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度至少需为6位字符' });
  }

  // Check if email already registered
  const existingWithEmail = Array.from(userStore.values()).find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingWithEmail) {
    return res.status(400).json({ success: false, message: '该邮箱已被注册，请直接使用密码登录' });
  }

  let user: UserAccount;
  if (currentUserId && userStore.has(currentUserId)) {
    // Bind current anonymous user account with email
    user = userStore.get(currentUserId)!;
    user.email = email.toLowerCase();
    user.password = password;
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    user.updatedAt = Date.now();
  } else {
    // Create brand new account with email
    const newId = `jj_user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    user = {
      id: newId,
      email: email.toLowerCase(),
      password,
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
  res.json({ success: true, message: '注册成功，赠送 130,700 圣所音符！账号已绑定。', user });
});

// Daily Check-in Endpoint (+3270 Sanctuary Notes)
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
      user,
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
    user,
  });
});

// Email Login Endpoint
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

  if (user.password !== password) {
    return res.status(401).json({ success: false, message: '登录密码不正确，请重新输入' });
  }

  res.json({ success: true, message: '登录成功！已载入您的云端账号', user });
});

// Update User Chips & Game Stats
app.post('/api/user/chips', (req, res) => {
  const { userId, chipChange, winsChange, lossesChange } = req.body;
  if (!userId || !userStore.has(userId)) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const user = userStore.get(userId)!;
  if (typeof chipChange === 'number') {
    user.chips = Math.max(0, user.chips + chipChange);
  }
  if (winsChange) user.wins += winsChange;
  if (lossesChange) user.losses += lossesChange;
  if (winsChange || lossesChange) user.handsPlayed += 1;

  user.updatedAt = Date.now();
  saveDatabase();

  res.json({ success: true, user });
});

// Get Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const sorted = Array.from(userStore.values())
    .sort((a, b) => b.chips - a.chips)
    .slice(0, 20);
  res.json({ success: true, leaderboard: sorted });
});

// Broadcast state to room members
function broadcastToRoom(roomId: string, message: object, excludeWs?: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);

  room.players.forEach(p => {
    if (p.ws !== excludeWs && p.ws.readyState === WebSocket.OPEN) {
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

function matchmakePlayers() {
  while (waitingQueue.length >= 2) {
    const matched = waitingQueue.splice(0, 4); // Group up to 4 players per room
    const roomId = `sanctuary-arena-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    
    const newRoom: Room = {
      id: roomId,
      name: 'Final Sanctuary Table',
      stageId: 'sanctuary_final',
      maxPlayers: 4,
      players: matched,
      messages: [],
      status: 'WAITING',
      createdAt: Date.now(),
    };

    rooms.set(roomId, newRoom);

    matched.forEach(p => {
      p.roomId = roomId;
      p.ws.send(JSON.stringify({
        type: 'MATCH_FOUND',
        data: {
          roomId,
          roomName: newRoom.name,
          stageId: newRoom.stageId,
          players: newRoom.players.map(pl => ({
            id: pl.id,
            name: pl.name,
            avatar: pl.avatar,
            chips: pl.chips,
            isReady: !!pl.isReady,
          })),
        }
      }));
    });
  }
}

// WebSocket Connection Handler
wss.on('connection', (ws: WebSocket) => {
  const playerId = `player_${Math.random().toString(36).substr(2, 9)}`;
  const session: PlayerSession = {
    id: playerId,
    name: `JM_${Math.floor(1000 + Math.random() * 9000)}`,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    chips: 10000,
    ws,
  };

  sessions.set(ws, session);

  // Send initial WELCOME event
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
              chips: typeof payload?.chips === 'number' ? payload.chips : session.chips,
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
            if (typeof payload?.chips === 'number') account.chips = payload.chips;
            account.updatedAt = Date.now();
          }

          saveDatabase();

          session.name = account.nickname;
          session.avatar = account.avatar;
          session.chips = account.chips;

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
          break;
        }

        case 'SYNC_CHIPS': {
          if (session.userId && userStore.has(session.userId)) {
            const acc = userStore.get(session.userId)!;
            if (typeof payload?.chips === 'number') {
              acc.chips = payload.chips;
              session.chips = payload.chips;
            }
            if (payload?.winsChange) acc.wins += payload.winsChange;
            if (payload?.lossesChange) acc.losses += payload.lossesChange;
            acc.updatedAt = Date.now();
            saveDatabase();

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
          if (!waitingQueue.find(p => p.id === session.id)) {
            waitingQueue.push(session);
            ws.send(JSON.stringify({
              type: 'QUEUE_STATUS',
              data: { inQueue: true, position: waitingQueue.length }
            }));
            matchmakePlayers();
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
          }
          break;
        }

        case 'CREATE_ROOM': {
          const customRoomId = `room_${Date.now().toString(36)}`;
          const newRoom: Room = {
            id: customRoomId,
            name: payload?.name || `${session.name}'s Table`,
            stageId: payload?.stageId || 'sanctuary_final',
            maxPlayers: payload?.maxPlayers || 4,
            players: [session],
            messages: [],
            status: 'WAITING',
            createdAt: Date.now(),
          };

          session.roomId = customRoomId;
          rooms.set(customRoomId, newRoom);

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            data: {
              roomId: customRoomId,
              roomName: newRoom.name,
              stageId: newRoom.stageId,
              players: newRoom.players.map(p => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                chips: p.chips,
                isReady: !!p.isReady,
              })),
            }
          }));

          broadcastOnlineStats();
          break;
        }

        case 'JOIN_ROOM': {
          const targetRoom = rooms.get(payload?.roomId);
          if (!targetRoom) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
            break;
          }

          if (targetRoom.players.length >= targetRoom.maxPlayers) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full' }));
            break;
          }

          session.roomId = targetRoom.id;
          if (!targetRoom.players.find(p => p.id === session.id)) {
            targetRoom.players.push(session);
          }

          const roomData = {
            type: 'ROOM_UPDATED',
            data: {
              roomId: targetRoom.id,
              roomName: targetRoom.name,
              stageId: targetRoom.stageId,
              players: targetRoom.players.map(p => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                chips: p.chips,
                isReady: !!p.isReady,
              })),
            }
          };

          broadcastToRoom(targetRoom.id, roomData);
          break;
        }

        case 'SEND_CHAT': {
          if (!session.roomId) break;
          const room = rooms.get(session.roomId);
          if (!room) break;

          const msg: ChatMessage = {
            id: `msg_${Date.now()}`,
            senderId: session.id,
            senderName: session.name,
            text: payload?.text || '',
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

          broadcastToRoom(room.id, {
            type: 'PLAYER_READY_CHANGED',
            data: {
              playerId: session.id,
              isReady: session.isReady,
              allReady: room.players.length >= 2 && room.players.every(p => p.isReady),
            }
          });
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
    // Cleanup player from queue and room
    const idx = waitingQueue.findIndex(p => p.id === session.id);
    if (idx !== -1) waitingQueue.splice(idx, 1);

    if (session.roomId) {
      const room = rooms.get(session.roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== session.id);
        if (room.players.length === 0) {
          rooms.delete(session.roomId);
        } else {
          broadcastToRoom(room.id, {
            type: 'PLAYER_LEFT',
            data: {
              playerId: session.id,
              remainingPlayers: room.players.map(p => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
              })),
            }
          });
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
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`[Final Sanctuary Server] Running on http://${HOST}:${PORT}`);
    console.log(`[WebSocket] Listening for real-time player connections...`);
  });
}

setupServer().catch(err => {
  console.error('Failed to start server:', err);
});
