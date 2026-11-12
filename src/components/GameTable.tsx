/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Player, Card, Round, StageLightMode, ConcertSong } from '../types';
import { AlbumStage, formatCompactChips } from '../data/albumStages';
import { evaluate7CardHand, isCardInHand } from '../utils/pokerEvaluator';
import { triggerHaptic } from '../utils/haptics';
import { iosAudio } from '../utils/iosAudio';
import { PlayingCard } from './PlayingCard';
import { FlippableCard } from './FlippableCard';
import { FloatingStageBar } from './StageControls';
import { MetallicPokerChip } from './MetallicPokerChip';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  RotateCcw,
  Play,
  HelpCircle,
  Disc,
  ChevronUp,
  ChevronDown,
  LogOut,
  ArrowRight,
  Award,
  ClipboardList,
  Menu,
  Eye,
  EyeOff,
  Sparkles,
  MessageSquare,
  Send,
  X,
  Globe,
  Clock,
} from 'lucide-react';
import { wsService } from '../services/websocket';

interface ChatMessage {
  id: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: string;
  isUser?: boolean;
  isSystem?: boolean;
}

interface GameTableProps {
  currentSong: ConcertSong;
  setCurrentSong: (song: ConcertSong) => void;
  lightMode: StageLightMode;
  setLightMode: (v: StageLightMode) => void;
  laserActive: boolean;
  setLaserActive: (v: boolean) => void;
  audienceSingActive: boolean;
  setAudienceSingActive: (v: boolean) => void;
  encoreActive: boolean;
  setEncoreActive: (v: boolean) => void;
  selectedStage?: AlbumStage;
  isOnlineMode?: boolean;
  onlineRoomData?: any;
  onReturnToLauncher?: () => void;
}

const DEFAULT_START_CHIPS = 100000;
const DEFAULT_BIG_BLIND = 1000;
const DEFAULT_SMALL_BLIND = 500;

const ROUND_LABELS: Record<Round, string> = {
  Waiting: '等待开局',
  PreFlop: '翻牌前',
  Flop: '翻牌圈',
  Turn: '转牌圈',
  River: '河牌圈',
  Showdown: '摊牌结算',
};

export const GameTable: React.FC<GameTableProps> = ({
  currentSong,
  setCurrentSong,
  lightMode,
  setLightMode,
  laserActive,
  setLaserActive,
  audienceSingActive,
  setAudienceSingActive,
  setEncoreActive,
  selectedStage,
  isOnlineMode = false,
  onlineRoomData,
  onReturnToLauncher,
}) => {
  const START_CHIPS = selectedStage?.startChips ?? DEFAULT_START_CHIPS;
  const BIG_BLIND = selectedStage?.bigBlind ?? DEFAULT_BIG_BLIND;
  const SMALL_BLIND = selectedStage?.smallBlind ?? DEFAULT_SMALL_BLIND;
  const [turnDeadline, setTurnDeadline] = useState<number>(0);
  const [turnSecondsLeft, setTurnSecondsLeft] = useState<number>(0);
  const prevHandCountRef = useRef<number>(0);
  const prevRoundRef = useRef<Round>('Waiting');

  // Game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [currentMaxBet, setCurrentMaxBet] = useState(0);
  const [round, setRound] = useState<Round>('Waiting');
  const [activePlayerIndex, setActivePlayerIndex] = useState(-1);
  const [dealerIndex, setDealerIndex] = useState(0);
  const [, setSbIndex] = useState(1);
  const [, setBbIndex] = useState(2);
  const [winnerIds, setWinnerIds] = useState<string[]>([]);
  const [winningDescription, setWinningDescription] = useState('');

  // Multi-round statistics
  const [handCount, setHandCount] = useState(0);
  const [userWins, setUserWins] = useState(0);
  const [userBestHand, setUserBestHand] = useState('暂无');
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [showTourExitModal, setShowTourExitModal] = useState(false);

  // Notifications & Interactive Panels
  const [toastMsg, setToastMsg] = useState('点击下方发牌开局');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [raiseSliderVal, setRaiseSliderVal] = useState(BIG_BLIND * 2);
  const [showRaisePanel, setShowRaisePanel] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [isDealing, setIsDealing] = useState(false);
  // Default hole cards to face-up so the player clearly sees their cards immediately
  const [isCardsFlipped, setIsCardsFlipped] = useState(true);

  const handleToggleFlipCards = () => {
    setIsCardsFlipped((prev) => !prev);
    triggerHaptic('light');
    iosAudio.playClickSound();
  };

  // Table Interactive Chat State
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      senderName: '牌桌荷官',
      avatar: '🎵',
      text: '欢迎加入圣所牌桌！祝把把好运！',
      isSystem: true,
      timestamp: '12:00',
    },
  ]);

  const handleSendChat = (textToSend?: string) => {
    const content = (textToSend || chatInput).trim();
    if (!content) return;

    if (isOnlineMode) {
      wsService.sendChat(content);
      if (!textToSend) setChatInput('');
      triggerHaptic('light');
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderName: myPlayer?.name || '圣所乐迷',
      avatar: '🎤',
      text: content,
      isUser: true,
      timestamp: timeStr,
    };

    setChatMessages((prev) => [...prev.slice(-30), newMsg]);
    if (!textToSend) setChatInput('');
    triggerHaptic('light');

    setTimeout(() => {
      const activeBots = ['caocao', 'jiangnan', 'years', 'love'];
      const randomBot = activeBots[Math.floor(Math.random() * activeBots.length)];
      const botReplies: Record<string, string[]> = {
        caocao: ['有胆识！', '继续切磋！', '英雄所见略同！'],
        jiangnan: ['牌局正精彩～', '跟注玩玩看～', '这把要赢！'],
        years: ['看好你哦！', '好牌值得等待！'],
        love: ['保持好心情～', '手气不错！', '一起冲！'],
      };
      const botNameMap: Record<string, { name: string; avatar: string }> = {
        caocao: { name: '枭雄曹操', avatar: '⚔️' },
        jiangnan: { name: '江南过客', avatar: '🌂' },
        years: { name: '千年旅人', avatar: '⏳' },
        love: { name: '修炼爱情', avatar: '🌸' },
      };
      const replyList = botReplies[randomBot];
      const replyText = replyList[Math.floor(Math.random() * replyList.length)];
      const botInfo = botNameMap[randomBot];

      setChatMessages((prev) => [
        ...prev.slice(-30),
        {
          id: (Date.now() + 1).toString(),
          senderName: botInfo.name,
          avatar: botInfo.avatar,
          text: replyText,
          timestamp: timeStr,
        },
      ]);
    }, 900);
  };

  const botActionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Apply authoritative server state and rotate seats so local player is always Seat 0
  const applyServerGameState = (srv: any) => {
    if (!srv || !Array.isArray(srv.players) || srv.players.length === 0) return;

    const total = srv.players.length;
    const myIdx = srv.players.findIndex(
      (p: any) =>
        p.id === srv.mySeatId ||
        p.id === wsService.playerId ||
        (wsService.userId && p.userId === wsService.userId)
    );
    const offset = myIdx >= 0 ? myIdx : 0;

    const rotatedPlayers: Player[] = [];
    for (let i = 0; i < total; i++) {
      const origP = srv.players[(offset + i) % total];
      rotatedPlayers.push({
        id: origP.id,
        name: origP.name,
        avatar: origP.avatar || '🎤',
        chips: origP.chips,
        currentBet: origP.currentBet || 0,
        cards: origP.cards || [],
        isFolded: !!origP.isFolded,
        isAllIn: !!origP.isAllIn,
        isBot: !!origP.isBot,
        lastAction: origP.lastAction || '',
        handDescription: origP.handDescription,
      });
    }

    const rotIdx = (idx: number) => (idx >= 0 ? (idx - offset + total) % total : -1);

    setPlayers(rotatedPlayers);
    setCommunityCards(srv.communityCards || []);
    setPot(srv.pot || 0);
    setCurrentMaxBet(srv.currentMaxBet || 0);
    setRound(srv.round || 'Waiting');
    setActivePlayerIndex(rotIdx(srv.activePlayerIndex));
    setDealerIndex(rotIdx(srv.dealerIndex));
    setSbIndex(rotIdx(srv.sbIndex));
    setBbIndex(rotIdx(srv.bbIndex));
    setWinnerIds(srv.winnerIds || []);
    setWinningDescription(srv.winningDescription || '');
    setTurnDeadline(srv.turnDeadline || 0);

    if (srv.toastMsg) {
      setToastMsg(srv.toastMsg);
    }

    // Detect newly started hand
    if (typeof srv.handCount === 'number' && srv.handCount !== prevHandCountRef.current) {
      prevHandCountRef.current = srv.handCount;
      setHandCount(srv.handCount);
      setShowRoundModal(false);
      setShowRaisePanel(false);
      setIsCardsFlipped(true);
      setRaiseSliderVal((srv.bigBlind || BIG_BLIND) * 2);
      setIsDealing(true);
      setTimeout(() => setIsDealing(false), 350);
    }

    // Detect transition to Showdown
    if (srv.round === 'Showdown' && prevRoundRef.current !== 'Showdown') {
      const mySeat = rotatedPlayers[0];
      if (mySeat && Array.isArray(srv.winnerIds) && srv.winnerIds.includes(mySeat.id)) {
        setUserWins((prev) => prev + 1);
        triggerHaptic('win');
        iosAudio.playWinFanfare();
      } else {
        iosAudio.playChipSound();
      }
      if (mySeat?.handDescription) {
        setUserBestHand(mySeat.handDescription);
      }
      setShowRoundModal(true);
      setEncoreActive(true);
      setTimeout(() => setEncoreActive(false), 2500);
    }
    prevRoundRef.current = srv.round;
  };

  // Subscribe to online mode WebSocket updates
  useEffect(() => {
    if (!isOnlineMode) {
      resetWholeSession();
      return;
    }

    wsService.connect();
    setChatMessages([
      {
        id: 'sys_online',
        senderName: '圣所联机荷官',
        avatar: '🌐',
        text: `已进入实时联机房间【${onlineRoomData?.roomName || 'Final Sanctuary'}】，底牌由服务端加密派发！`,
        isSystem: true,
        timestamp: 'LIVE',
      },
    ]);

    if (wsService.lastGameState) {
      applyServerGameState(wsService.lastGameState);
    }
    wsService.requestGameState();

    const unsub = wsService.subscribe((event) => {
      if (event.type === 'GAME_STATE' && event.data) {
        applyServerGameState(event.data);
      } else if (event.type === 'NEW_CHAT_MESSAGE' && event.data) {
        const d = event.data;
        const now = new Date(d.timestamp || Date.now());
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        setChatMessages((prev) => [
          ...prev.slice(-30),
          {
            id: d.id || Date.now().toString(),
            senderName: d.senderName || '乐迷牌友',
            avatar: d.avatar || '🎤',
            text: d.text || '',
            isUser: d.senderId === wsService.playerId,
            timestamp: timeStr,
          },
        ]);
      }
    });

    return () => {
      unsub();
    };
  }, [isOnlineMode]);

  // Countdown ticker for online turn timer
  useEffect(() => {
    if (!isOnlineMode || !turnDeadline || round === 'Waiting' || round === 'Showdown') {
      setTurnSecondsLeft(0);
      return;
    }
    const updateTimer = () => {
      const rem = Math.max(0, Math.ceil((turnDeadline - Date.now()) / 1000));
      setTurnSecondsLeft(rem);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 500);
    return () => clearInterval(timer);
  }, [isOnlineMode, turnDeadline, round]);

  const resetWholeSession = () => {
    const initPlayers: Player[] = [
      { id: 'player', name: '圣所乐迷', avatar: '🎤', chips: START_CHIPS, currentBet: 0, cards: [], isFolded: false, isAllIn: false, isBot: false, lastAction: '' },
      { id: 'jiangnan', name: '江南过客', avatar: '🌂', chips: START_CHIPS, currentBet: 0, cards: [], isFolded: false, isAllIn: false, isBot: true, lastAction: '' },
      { id: 'caocao', name: '枭雄曹操', avatar: '⚔️', chips: START_CHIPS, currentBet: 0, cards: [], isFolded: false, isAllIn: false, isBot: true, lastAction: '' },
      { id: 'years', name: '千年旅人', avatar: '⏳', chips: START_CHIPS, currentBet: 0, cards: [], isFolded: false, isAllIn: false, isBot: true, lastAction: '' },
      { id: 'love', name: '修炼爱情', avatar: '🌸', chips: START_CHIPS, currentBet: 0, cards: [], isFolded: false, isAllIn: false, isBot: true, lastAction: '' },
    ];
    setPlayers(initPlayers);
    setDeck([]);
    setCommunityCards([]);
    setPot(0);
    setCurrentMaxBet(0);
    setRound('Waiting');
    setActivePlayerIndex(-1);
    setWinnerIds([]);
    setWinningDescription('');
    setIsCardsFlipped(true);
    setHandCount(0);
    setUserWins(0);
    setUserBestHand('暂无');
    setShowChatDrawer(false);
    setShowMenuDrawer(false);
    setShowRaisePanel(false);
    setShowRoundModal(false);
    setShowGuideModal(false);
    setShowTourExitModal(false);
    setToastMsg('点击下方发牌开局');
  };

  // Build deck
  const createDeck = (): Card[] => {
    const suits: Card['suit'][] = ['S', 'H', 'D', 'C'];
    const newDeck: Card[] = [];
    for (const suit of suits) {
      for (let val = 2; val <= 14; val++) {
        newDeck.push({ suit, value: val });
      }
    }
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  // Game loop (Single-player mode only; Online mode is server-authoritative)
  useEffect(() => {
    if (isOnlineMode) return;
    if (round === 'Waiting' || round === 'Showdown' || activePlayerIndex === -1) return;

    const activePlayers = players.filter((p) => !p.isFolded);

    if (activePlayers.length <= 1) {
      handleSinglePlayerLeftWins();
      return;
    }

    const allBetted = players.every(
      (p) =>
        p.isFolded ||
        p.isAllIn ||
        (p.lastAction !== '' && p.currentBet === currentMaxBet)
    );

    if (allBetted) {
      advanceRound();
      return;
    }

    const currentPlayer = players[activePlayerIndex];
    if (currentPlayer && currentPlayer.isBot) {
      if (botActionTimerRef.current) clearTimeout(botActionTimerRef.current);
      botActionTimerRef.current = setTimeout(() => {
        executeBotTurn(activePlayerIndex);
      }, 900);
    }

    return () => {
      if (botActionTimerRef.current) clearTimeout(botActionTimerRef.current);
    };
  }, [activePlayerIndex, players, round, currentMaxBet]);

  const executeBotTurn = (botIdx: number) => {
    const bot = players[botIdx];
    if (bot.isFolded || bot.isAllIn) {
      moveToNextPlayer(botIdx);
      return;
    }

    const fullHand = [...bot.cards, ...communityCards];
    const handStrength = evaluate7CardHand(fullHand);
    const toCall = currentMaxBet - bot.currentBet;
    const canRaise = bot.chips > toCall;
    const personality = bot.id;

    let action: 'Check' | 'Call' | 'Raise' | 'Fold' = 'Fold';

    if (toCall === 0) {
      if (handStrength.score > 20000000) {
        action = Math.random() > 0.4 && canRaise ? 'Raise' : 'Check';
      } else {
        if (personality === 'caocao' && Math.random() > 0.75 && canRaise) {
          action = 'Raise';
        } else {
          action = 'Check';
        }
      }
    } else {
      const potOdds = toCall / (pot + toCall);
      let winProb = 0.15;
      const rank = Math.floor(handStrength.score / 10000000);

      if (rank >= 4) winProb = 0.9;
      else if (rank === 3) winProb = 0.75;
      else if (rank === 2) winProb = 0.55;
      else if (rank === 1) winProb = 0.35;

      if (winProb > potOdds * 1.1) {
        if (winProb > 0.7 && canRaise && Math.random() > 0.5) {
          action = 'Raise';
        } else {
          action = 'Call';
        }
      } else if (toCall <= BIG_BLIND && Math.random() > 0.4) {
        action = 'Call';
      } else {
        action = 'Fold';
      }
    }

    if (action === 'Check') {
      handlePlayerCheck(botIdx);
    } else if (action === 'Call') {
      handlePlayerCall(botIdx);
    } else if (action === 'Raise') {
      const minRaise = currentMaxBet + BIG_BLIND;
      const raiseAmt = Math.min(bot.chips + bot.currentBet, minRaise);

      if (raiseAmt - bot.currentBet <= toCall) {
        if (bot.chips > toCall) handlePlayerCall(botIdx);
        else handlePlayerAllIn(botIdx);
      } else {
        handlePlayerRaise(botIdx, raiseAmt);
      }
    } else {
      handlePlayerFold(botIdx);
    }
  };

  // Start Next Round
  const startNextRound = () => {
    if (isOnlineMode) {
      setShowRoundModal(false);
      wsService.startNextHand();
      return;
    }

    const newDeck = createDeck();
    setCommunityCards([]);
    setWinnerIds([]);
    setWinningDescription('');
    setIsCardsFlipped(true);
    setShowChatDrawer(false);
    setShowMenuDrawer(false);
    setShowRaisePanel(false);
    setShowRoundModal(false);
    setShowGuideModal(false);
    setIsDealing(true);

    const activePlayersCount = players.length;
    const newDIdx = (dealerIndex + 1) % activePlayersCount;
    const newSbIdx = (newDIdx + 1) % activePlayersCount;
    const newBbIdx = (newSbIdx + 1) % activePlayersCount;

    setDealerIndex(newDIdx);
    setSbIndex(newSbIdx);
    setBbIndex(newBbIdx);

    const nextHandNum = handCount + 1;
    setHandCount(nextHandNum);

    const updatedPlayers = players.map((p, idx) => {
      let chips = p.chips;
      let currentBet = 0;

      if (chips < BIG_BLIND * 2) {
        chips = START_CHIPS;
      }

      const card1 = newDeck.pop()!;
      const card2 = newDeck.pop()!;

      if (idx === newSbIdx) {
        const sbAmt = Math.min(chips, SMALL_BLIND);
        chips -= sbAmt;
        currentBet = sbAmt;
      } else if (idx === newBbIdx) {
        const bbAmt = Math.min(chips, BIG_BLIND);
        chips -= bbAmt;
        currentBet = bbAmt;
      }

      return {
        ...p,
        chips,
        currentBet,
        cards: [card1, card2],
        isFolded: false,
        isAllIn: false,
        lastAction: idx === newSbIdx ? '小盲' : idx === newBbIdx ? '大盲' : '',
      };
    });

    const sbAmount = Math.min(players[newSbIdx].chips, SMALL_BLIND);
    const bbAmount = Math.min(players[newBbIdx].chips, BIG_BLIND);

    setPlayers(updatedPlayers);
    setDeck(newDeck);
    setPot(sbAmount + bbAmount);
    setCurrentMaxBet(BIG_BLIND);
    setRaiseSliderVal(BIG_BLIND * 2);
    setRound('PreFlop');

    const utgIdx = (newBbIdx + 1) % activePlayersCount;
    setActivePlayerIndex(utgIdx);

    setToastMsg(`第 ${nextHandNum} 局 · 翻牌前`);

    setTimeout(() => {
      setIsDealing(false);
    }, 350);
  };

  const moveToNextPlayer = (currentIdx: number) => {
    const activePlayersCount = players.length;
    let nextIdx = currentIdx;

    for (let i = 0; i < activePlayersCount; i++) {
      nextIdx = (nextIdx + 1) % activePlayersCount;
      const nextP = players[nextIdx];
      if (!nextP.isFolded && !nextP.isAllIn) {
        setActivePlayerIndex(nextIdx);
        return;
      }
    }

    advanceRound();
  };

  const handlePlayerCheck = (idx: number) => {
    if (isOnlineMode && idx === 0) {
      triggerHaptic('light');
      iosAudio.playClickSound();
      wsService.sendGameAction('check');
      return;
    }

    const p = players[idx];
    setToastMsg(`${p.name} · 过牌`);

    if (idx === 0) {
      triggerHaptic('light');
      iosAudio.playClickSound();
    }

    setPlayers((prev) =>
      prev.map((player, i) => (i === idx ? { ...player, lastAction: '过牌' } : player))
    );
    moveToNextPlayer(idx);
  };

  const handlePlayerCall = (idx: number) => {
    if (isOnlineMode && idx === 0) {
      triggerHaptic('medium');
      iosAudio.playChipSound();
      wsService.sendGameAction('call');
      return;
    }

    const p = players[idx];
    const toCall = currentMaxBet - p.currentBet;
    const actualCall = Math.min(p.chips, toCall);

    setToastMsg(`${p.name} 跟注 ${formatCompactChips(actualCall)}`);

    if (idx === 0) {
      triggerHaptic('medium');
    }
    iosAudio.playChipSound();

    setPlayers((prev) =>
      prev.map((player, i) => {
        if (i === idx) {
          const isNowAllIn = player.chips - actualCall === 0;
          return {
            ...player,
            chips: player.chips - actualCall,
            currentBet: player.currentBet + actualCall,
            lastAction: isNowAllIn ? '全押' : '跟注',
            isAllIn: isNowAllIn || player.isAllIn,
          };
        }
        return player;
      })
    );

    setPot((prev) => prev + actualCall);
    moveToNextPlayer(idx);
  };

  const handlePlayerRaise = (idx: number, raiseTotalAmount: number) => {
    if (isOnlineMode && idx === 0) {
      triggerHaptic('heavy');
      iosAudio.playChipSound();
      setShowRaisePanel(false);
      wsService.sendGameAction('raise', raiseTotalAmount);
      return;
    }

    const p = players[idx];
    const extraChipsNeeded = raiseTotalAmount - p.currentBet;
    const actualRaise = Math.min(p.chips, extraChipsNeeded);

    setToastMsg(`${p.name} 加注至 ${formatCompactChips(p.currentBet + actualRaise)}`);

    if (idx === 0) {
      triggerHaptic('heavy');
    }
    iosAudio.playChipSound();

    setPlayers((prev) =>
      prev.map((player, i) => {
        if (i === idx) {
          const isNowAllIn = player.chips - actualRaise === 0;
          return {
            ...player,
            chips: player.chips - actualRaise,
            currentBet: player.currentBet + actualRaise,
            lastAction: isNowAllIn ? '全押' : '加注',
            isAllIn: isNowAllIn || player.isAllIn,
          };
        }
        return player;
      })
    );

    setPot((prev) => prev + actualRaise);
    setCurrentMaxBet(p.currentBet + actualRaise);
    setShowRaisePanel(false);
    moveToNextPlayer(idx);
  };

  const handlePlayerFold = (idx: number) => {
    if (isOnlineMode && idx === 0) {
      triggerHaptic('light');
      iosAudio.playFoldSound();
      wsService.sendGameAction('fold');
      return;
    }

    const p = players[idx];
    setToastMsg(`${p.name} · 弃牌`);

    if (idx === 0) {
      triggerHaptic('light');
    }
    iosAudio.playFoldSound();

    setPlayers((prev) =>
      prev.map((player, i) =>
        i === idx ? { ...player, isFolded: true, lastAction: '弃牌' } : player
      )
    );
    moveToNextPlayer(idx);
  };

  const handlePlayerAllIn = (idx: number) => {
    if (isOnlineMode && idx === 0) {
      triggerHaptic('warning');
      iosAudio.playChipSound();
      wsService.sendGameAction('allin');
      return;
    }

    const p = players[idx];
    const allInAmt = p.chips;
    const totalBet = p.currentBet + allInAmt;

    setToastMsg(`${p.name} 全押 ${formatCompactChips(allInAmt)}`);

    if (idx === 0) {
      triggerHaptic('warning');
    }
    iosAudio.playChipSound();

    setPlayers((prev) =>
      prev.map((player, i) => {
        if (i === idx) {
          return {
            ...player,
            chips: 0,
            currentBet: totalBet,
            isAllIn: true,
            lastAction: '全押',
          };
        }
        return player;
      })
    );

    setPot((prev) => prev + allInAmt);
    if (totalBet > currentMaxBet) {
      setCurrentMaxBet(totalBet);
    }
    moveToNextPlayer(idx);
  };

  const handleSinglePlayerLeftWins = () => {
    const winner = players.find((p) => !p.isFolded);
    if (!winner) return;

    setToastMsg(`${winner.name} 赢 ${formatCompactChips(pot)}`);

    if (winner.id === 'player') {
      setUserWins((prev) => prev + 1);
    }

    setPlayers((prev) =>
      prev.map((p) => (p.id === winner.id ? { ...p, chips: p.chips + pot } : p))
    );
    setWinnerIds([winner.id]);
    setWinningDescription('对手弃牌');
    setRound('Showdown');
    setActivePlayerIndex(-1);
    setShowRoundModal(true);

    setEncoreActive(true);
    setTimeout(() => setEncoreActive(false), 2500);
  };

  const advanceRound = () => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        currentBet: 0,
        lastAction: p.isFolded ? '弃牌' : p.isAllIn ? '全押' : '',
      }))
    );
    setCurrentMaxBet(0);

    const canActCount = players.filter((p) => !p.isFolded && !p.isAllIn).length;

    if (round === 'PreFlop') {
      const nextCard1 = deck.pop()!;
      const nextCard2 = deck.pop()!;
      const nextCard3 = deck.pop()!;
      setCommunityCards([nextCard1, nextCard2, nextCard3]);
      setRound('Flop');
      setToastMsg('翻牌圈 · Flop');
      if (canActCount > 0) startBettingRoundFromDealerLeft();
      else setTimeout(advanceRound, 900);
    } else if (round === 'Flop') {
      const nextCard = deck.pop()!;
      setCommunityCards((prev) => [...prev, nextCard]);
      setRound('Turn');
      setToastMsg('转牌圈 · Turn');
      if (canActCount > 0) startBettingRoundFromDealerLeft();
      else setTimeout(advanceRound, 900);
    } else if (round === 'Turn') {
      const nextCard = deck.pop()!;
      setCommunityCards((prev) => [...prev, nextCard]);
      setRound('River');
      setToastMsg('河牌圈 · River');
      if (canActCount > 0) startBettingRoundFromDealerLeft();
      else setTimeout(advanceRound, 900);
    } else if (round === 'River') {
      setRound('Showdown');
      setActivePlayerIndex(-1);
      evaluateShowdown();
    }
  };

  const startBettingRoundFromDealerLeft = () => {
    const activePlayersCount = players.length;
    let idx = dealerIndex;
    for (let i = 0; i < activePlayersCount; i++) {
      idx = (idx + 1) % activePlayersCount;
      const p = players[idx];
      if (!p.isFolded && !p.isAllIn) {
        setActivePlayerIndex(idx);
        return;
      }
    }
  };

  const evaluateShowdown = () => {
    const activePlayerEvaluations = players.map((p) => {
      if (p.isFolded) return { player: p, score: -1, handType: '已弃牌', description: '无' };
      const fullCards = [...p.cards, ...communityCards];
      const evaluation = evaluate7CardHand(fullCards);
      return {
        player: p,
        score: evaluation.score,
        handType: evaluation.handType,
        description: evaluation.description,
      };
    });

    let highestScore = -1;
    activePlayerEvaluations.forEach((ev) => {
      if (ev.score > highestScore) highestScore = ev.score;
    });

    const winners = activePlayerEvaluations.filter(
      (ev) => ev.score === highestScore && ev.score !== -1
    );
    const winnerIdsList = winners.map((w) => w.player.id);
    const winningDesc = winners[0]?.description || '';

    const myEv = activePlayerEvaluations.find((e) => e.player.id === 'player');
    if (myEv && myEv.score > 0) {
      setUserBestHand(myEv.description);
    }

    if (winnerIdsList.includes('player')) {
      setUserWins((prev) => prev + 1);
      triggerHaptic('win');
      iosAudio.playWinFanfare();
    } else {
      iosAudio.playChipSound();
    }

    const splitShare = Math.floor(pot / winners.length);
    setPlayers((prev) =>
      prev.map((p) => {
        if (winnerIdsList.includes(p.id)) {
          return {
            ...p,
            chips: p.chips + splitShare,
            handDescription: winners.find((w) => w.player.id === p.id)?.description,
          };
        }
        return p;
      })
    );

    setWinnerIds(winnerIdsList);
    setWinningDescription(winningDesc);

    winners.forEach((w) => {
      setToastMsg(`${w.player.name} · ${w.handType} 赢 ${formatCompactChips(splitShare)}`);
    });

    setShowRoundModal(true);
    setEncoreActive(true);
    setTimeout(() => setEncoreActive(false), 2500);
  };

  const myPlayer = players[0];
  const isMyTurn = activePlayerIndex === 0 && round !== 'Waiting' && round !== 'Showdown';
  const userNetProfit = (myPlayer?.chips || START_CHIPS) - START_CHIPS;

  // Real-time Texas Hold'em hand evaluation for human player
  const myFullCards = myPlayer?.cards ? [...myPlayer.cards, ...communityCards] : [];
  const myCurrentEvaluation =
    round !== 'Waiting' && myFullCards.length >= 2 ? evaluate7CardHand(myFullCards) : null;

  const isRiverMatchedWithHole = (() => {
    if (
      communityCards.length < 5 ||
      !myPlayer?.cards ||
      myPlayer.cards.length === 0 ||
      !myCurrentEvaluation
    ) {
      return false;
    }
    const riverCard = communityCards[4];
    const bestHandCards = myCurrentEvaluation.cards;
    const riverInBestHand = isCardInHand(riverCard, bestHandCards);
    const holeInBestHand = myPlayer.cards.some((c) => isCardInHand(c, bestHandCards));
    const isValidCombo = myCurrentEvaluation.handType !== '高牌';
    return riverInBestHand && holeInBestHand && isValidCombo;
  })();

  const blindDisplay = selectedStage
    ? selectedStage.blindLabel
    : `${formatCompactChips(SMALL_BLIND)}/${formatCompactChips(BIG_BLIND)}`;

  // Felt Theme Styles
  const feltGradient =
    lightMode === 'blue'
      ? 'bg-[radial-gradient(ellipse_at_center,#0f335c_0%,#081c36_65%,#040c18_100%)] border-cyan-500/60'
      : lightMode === 'red'
      ? 'bg-[radial-gradient(ellipse_at_center,#421810_0%,#240b06_65%,#120503_100%)] border-amber-500/70'
      : lightMode === 'rainbow'
      ? 'bg-[radial-gradient(ellipse_at_center,#0f4c36_0%,#082b1e_65%,#041710_100%)] border-emerald-500/60'
      : 'bg-[radial-gradient(ellipse_at_center,#2c1054_0%,#15062b_65%,#090214_100%)] border-amber-400/75';

  return (
    <div
      className="w-full h-full bg-[#070312] text-white font-sans relative overflow-hidden flex flex-col justify-between items-center select-none"
      id="main-poker-stage"
    >
      {/* 1. TOP HUD BAR */}
      <header className="w-full max-w-4xl px-3 pt-2 pb-1.5 flex items-center justify-between gap-2 z-40 shrink-0">
        {/* Left: Exit Button */}
        <button
          onClick={onReturnToLauncher}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-purple-400 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer active:scale-95 transition-all shrink-0 whitespace-nowrap"
          title="返回大厅"
        >
          <LogOut className="w-3.5 h-3.5 text-purple-300 shrink-0" />
          <span>大厅</span>
        </button>

        {/* Center: Stage & Blinds Info */}
        <div className="bg-slate-900/95 border border-purple-500/50 px-3.5 py-1 rounded-xl shadow-md flex items-center justify-center gap-2 whitespace-nowrap min-w-0">
          {isOnlineMode && <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          <span className="text-xs sm:text-sm font-black text-white truncate">
            {selectedStage ? selectedStage.name : '《乐行者》'}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-xs font-mono font-black text-amber-300 tabular-nums shrink-0">
            盲注 {blindDisplay}
          </span>
        </div>

        {/* Right: Rules, Chat & Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowGuideModal(true)}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white cursor-pointer transition-all shrink-0"
            title="规则说明"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowChatDrawer(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-purple-500/50 hover:border-purple-300 text-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
            title="牌桌聊天"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">聊天</span>
          </button>

          <button
            onClick={() => setShowMenuDrawer(true)}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-fuchsia-400 text-slate-200 hover:text-white cursor-pointer active:scale-95 transition-all shrink-0"
            title="牌局菜单"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SPECIAL CONCERT LIGHTING FX (Optional toggle from menu) */}
      {laserActive && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <svg className="w-full h-full opacity-50">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="#a855f7" strokeWidth="2" className="animate-laser-beam" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="#e879f9" strokeWidth="2" className="animate-laser-beam-delayed" />
          </svg>
        </div>
      )}

      {audienceSingActive && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="absolute w-2 h-2 rounded-full bg-white animate-twinkle top-[15%] left-[25%] shadow-[0_0_12px_#fff]" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-purple-400 animate-twinkle-delayed top-[30%] left-[75%] shadow-[0_0_15px_#c084fc]" />
        </div>
      )}

      <AnimatePresence>
        {isDealing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs z-40 flex flex-col items-center justify-center pointer-events-none"
          >
            <Disc className="w-7 h-7 text-amber-400 animate-spin-slow mb-1" />
            <p className="text-xs font-bold text-amber-200 tracking-wider">发牌中...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. UNIFIED PRO TEXAS HOLD'EM 5-MAX RING ARENA */}
      <div
        className="relative w-full max-w-3xl flex-1 min-h-0 flex flex-col justify-between px-2 sm:px-5 py-1"
        id="top-arena"
      >
        {/* Main Oval Poker Table Felt */}
        <div
          className={`relative w-full flex-1 min-h-0 rounded-[44px] sm:rounded-[80px] border-[4px] ${feltGradient} shadow-[inset_0_0_70px_rgba(0,0,0,0.88),0_10px_36px_rgba(0,0,0,0.8)] flex flex-col justify-between px-2.5 sm:px-6 py-2 sm:py-3.5 overflow-hidden`}
        >
          {/* Outer & Inner Felt Trim Rings */}
          <div className="absolute inset-2 sm:inset-3 rounded-[36px] sm:rounded-[68px] border border-amber-300/20 pointer-events-none" />
          <div className="absolute inset-x-6 sm:inset-x-14 top-[18%] bottom-[20%] rounded-full border border-white/[0.06] pointer-events-none" />

          {/* TOP RAIL STATUS PILL */}
          <div className="relative z-20 flex items-center justify-center w-full shrink-0">
            <div className="bg-slate-950/85 border border-white/15 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono text-slate-200 whitespace-nowrap shadow-md flex items-center gap-1.5">
              <span className="text-amber-300 font-bold shrink-0">{ROUND_LABELS[round]}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">{toastMsg}</span>
            </div>
          </div>

          {/* CENTER ARENA: 4 CORNERS AROUND COMMUNITY CARDS + PROMINENT POT ABOVE BOARD */}
          <div className="relative z-20 flex-1 min-h-0 flex flex-col justify-center gap-1.5 sm:gap-2.5 w-full max-w-2xl mx-auto my-auto">
            {/* UPPER CORNERS OF COMMUNITY CARDS: Top-Left (Seat 2) & Top-Right (Seat 3) */}
            <div className="flex items-end justify-between w-full px-0.5 sm:px-4">
              {players[2] ? (
                <TablePlayerSeat
                  player={players[2]}
                  playerIdx={2}
                  dealerIndex={dealerIndex}
                  totalPlayers={players.length}
                  isActive={activePlayerIndex === 2}
                  isWinner={winnerIds.includes(players[2].id)}
                  isDealer={dealerIndex === 2}
                  round={round}
                  position="top-left"
                  communityCards={communityCards}
                  selectedStage={selectedStage}
                />
              ) : (
                <div className="w-28" />
              )}

              {players[3] ? (
                <TablePlayerSeat
                  player={players[3]}
                  playerIdx={3}
                  dealerIndex={dealerIndex}
                  totalPlayers={players.length}
                  isActive={activePlayerIndex === 3}
                  isWinner={winnerIds.includes(players[3].id)}
                  isDealer={dealerIndex === 3}
                  round={round}
                  position="top-right"
                  communityCards={communityCards}
                  selectedStage={selectedStage}
                />
              ) : (
                <div className="w-28" />
              )}
            </div>

            {/* CENTER CORE: HIGHLIGHTED POT MODULE DIRECTLY ABOVE COMMUNITY CARDS */}
            <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 my-0.5">
              {/* Highlighted Pot Module Above Community Cards */}
              <div className="relative flex flex-col items-center justify-center">
                {/* Ambient Golden Backlight Glow */}
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-300/40 to-amber-500/25 blur-md pointer-events-none" />

                <div className="relative bg-gradient-to-r from-slate-950 via-[#2d1805] to-slate-950 border-2 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.55),inset_0_0_14px_rgba(251,191,36,0.3)] px-4 sm:px-6 py-1 sm:py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
                  <MetallicPokerChip
                    size="sm"
                    selectedStage={selectedStage}
                    showStack={true}
                    isFloating={false}
                  />
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-300/50 text-[10px] sm:text-xs font-black text-amber-200 tracking-wider">
                    底池
                  </span>
                  <span className="text-sm sm:text-lg font-mono font-black text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.85)] tabular-nums">
                    {formatCompactChips(pot)}
                  </span>
                </div>

                {round === 'Showdown' && winningDescription && (
                  <div className="mt-1 bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-[0_0_14px_rgba(251,191,36,0.7)] whitespace-nowrap">
                    <Trophy className="w-3 h-3 text-slate-950 shrink-0" />
                    <span>{winningDescription}</span>
                  </div>
                )}
              </div>

              {/* 5 Community Cards Board */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 rounded-2xl bg-black/45 border border-amber-400/25 shadow-[inset_0_2px_12px_rgba(0,0,0,0.85)]">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const card = communityCards[slotIdx];
                  if (!card) {
                    return (
                      <div
                        key={slotIdx}
                        className="w-11 h-16 sm:w-14 sm:h-20 rounded-lg sm:rounded-xl border border-dashed border-white/20 bg-white/[0.03] flex items-center justify-center shrink-0"
                      >
                        <span className="text-[9px] font-mono text-white/25 select-none">
                          {slotIdx < 3 ? 'FLOP' : slotIdx === 3 ? 'TURN' : 'RIVER'}
                        </span>
                      </div>
                    );
                  }

                  const isCardGlowing = myCurrentEvaluation
                    ? isCardInHand(card, myCurrentEvaluation.cards)
                    : false;
                  const isRiverCard = slotIdx === 4;
                  const isRiverHighlight = isRiverCard && isRiverMatchedWithHole;

                  return (
                    <div key={slotIdx} className="relative shrink-0">
                      <PlayingCard
                        card={card}
                        isFaceUp={true}
                        size="md"
                        isGlowing={isCardGlowing || isRiverHighlight}
                      />
                      {isRiverHighlight && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full whitespace-nowrap shadow z-30">
                          河牌成牌
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LOWER CORNERS OF COMMUNITY CARDS: Bottom-Left (Seat 1) & Bottom-Right (Seat 4) */}
            <div className="flex items-start justify-between w-full px-0.5 sm:px-4">
              {players[1] ? (
                <TablePlayerSeat
                  player={players[1]}
                  playerIdx={1}
                  dealerIndex={dealerIndex}
                  totalPlayers={players.length}
                  isActive={activePlayerIndex === 1}
                  isWinner={winnerIds.includes(players[1].id)}
                  isDealer={dealerIndex === 1}
                  round={round}
                  position="bottom-left"
                  communityCards={communityCards}
                  selectedStage={selectedStage}
                />
              ) : (
                <div className="w-28" />
              )}

              {players[4] ? (
                <TablePlayerSeat
                  player={players[4]}
                  playerIdx={4}
                  dealerIndex={dealerIndex}
                  totalPlayers={players.length}
                  isActive={activePlayerIndex === 4}
                  isWinner={winnerIds.includes(players[4].id)}
                  isDealer={dealerIndex === 4}
                  round={round}
                  position="bottom-right"
                  communityCards={communityCards}
                  selectedStage={selectedStage}
                />
              ) : (
                <div className="w-28" />
              )}
            </div>
          </div>

          {/* ZONE 4: 6 O'CLOCK HERO STATION (HOLE CARDS + UNIFIED PLAYER DOCK) */}
          <div className="relative z-20 flex flex-col items-center justify-end gap-1.5 shrink-0">
            {round === 'Waiting' ? (
              <div className="my-1 flex flex-col items-center">
                <button
                  onClick={startNextRound}
                  className="px-8 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_24px_rgba(245,158,11,0.6)] border border-amber-200 flex items-center gap-2 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-slate-950 shrink-0" />
                  <span>开始发牌</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2.5">
                {/* Player's 2 Hole Cards */}
                <div className="flex items-center gap-1.5">
                  <FlippableCard
                    card={myPlayer?.cards[0]}
                    isFlipped={isCardsFlipped || round === 'Showdown'}
                    onFlipToggle={handleToggleFlipCards}
                    size="md"
                    isGlowing={
                      (myCurrentEvaluation
                        ? isCardInHand(myPlayer?.cards[0], myCurrentEvaluation.cards)
                        : false) || isRiverMatchedWithHole
                    }
                    rotationAngle={-3}
                  />
                  <FlippableCard
                    card={myPlayer?.cards[1]}
                    isFlipped={isCardsFlipped || round === 'Showdown'}
                    onFlipToggle={handleToggleFlipCards}
                    size="md"
                    isGlowing={
                      (myCurrentEvaluation
                        ? isCardInHand(myPlayer?.cards[1], myCurrentEvaluation.cards)
                        : false) || isRiverMatchedWithHole
                    }
                    rotationAngle={3}
                  />
                </div>

                {/* Made Hand Pill & Peek Toggle */}
                <div className="flex flex-col items-start gap-1">
                  {myCurrentEvaluation && (
                    <div className="bg-slate-950/95 border border-amber-400/80 px-2 py-0.5 rounded-xl flex items-center gap-1 shadow-md whitespace-nowrap">
                      <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                      <span className="text-xs font-black text-amber-300">
                        {myCurrentEvaluation.handType}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleFlipCards}
                    className="px-2 py-0.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                  >
                    {isCardsFlipped ? (
                      <>
                        <EyeOff className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>盖牌</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 text-amber-300 shrink-0" />
                        <span>看牌</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Hero Unified Single-Box Seat */}
            {myPlayer &&
              (() => {
                const myPosInfo = getTexasPosition(0, dealerIndex, players.length || 5);
                const isAvatarImage =
                  myPlayer.avatar &&
                  (myPlayer.avatar.startsWith('http') ||
                    myPlayer.avatar.startsWith('data:image'));
                return (
                  <div
                    className={`px-3 py-1.5 rounded-xl border shadow-xl flex items-center gap-2 backdrop-blur-md transition-all whitespace-nowrap ${
                      isMyTurn
                        ? 'bg-slate-900/95 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_18px_rgba(245,158,11,0.35)]'
                        : 'bg-slate-950/90 border-slate-700/80'
                    }`}
                  >
                    {/* Avatar Frame Inside Box */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border border-amber-400/70 flex items-center justify-center text-xs sm:text-sm shrink-0 overflow-hidden shadow-inner">
                      {isAvatarImage ? (
                        <img
                          src={myPlayer.avatar}
                          alt={myPlayer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{myPlayer.avatar || '🎤'}</span>
                      )}
                    </div>

                    {/* Position + Name & Chips Integrated Column (Full Display, No Truncation) */}
                    <div className="flex flex-col justify-center leading-none gap-1">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-black leading-none shrink-0 ${myPosInfo.badgeStyle}`}
                        >
                          {myPosInfo.code}
                        </span>
                        <span className="text-xs font-black text-white whitespace-nowrap">
                          {myPlayer.name}
                        </span>
                        {myPlayer.lastAction && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-900/80 border border-purple-400/40 text-[9px] font-bold text-purple-200 leading-none shrink-0">
                            {myPlayer.lastAction}
                          </span>
                        )}
                        {isOnlineMode && turnSecondsLeft > 0 && isMyTurn && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-mono font-black flex items-center gap-0.5 leading-none tabular-nums shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            {turnSecondsLeft}s
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-xs font-mono font-black text-amber-300 tabular-nums">
                          💰 {formatCompactChips(myPlayer.chips)}
                        </span>
                        {myPlayer.currentBet > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/50 text-[9px] font-mono font-bold text-emerald-300 leading-none tabular-nums">
                            下注 {formatCompactChips(myPlayer.currentBet)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ACTION BAR */}
      <div className="w-full max-w-3xl px-3 pt-1.5 pb-2.5 relative z-30 shrink-0">
        {/* Raise Slider Panel Drawer */}
        <AnimatePresence>
          {showRaisePanel && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="absolute bottom-16 right-3 left-3 bg-slate-950/95 border-2 border-amber-400/80 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5 z-50 text-xs"
            >
              <div className="flex justify-between text-xs font-mono text-amber-300 font-bold whitespace-nowrap tabular-nums">
                <span>加注至 {formatCompactChips(raiseSliderVal)}</span>
                <span>
                  上限 {formatCompactChips((myPlayer?.chips || 0) + (myPlayer?.currentBet || 0))}
                </span>
              </div>

              <input
                type="range"
                min={Math.min(
                  (myPlayer?.chips || 0) + (myPlayer?.currentBet || 0),
                  currentMaxBet === 0 ? BIG_BLIND : currentMaxBet + BIG_BLIND
                )}
                max={(myPlayer?.chips || 0) + (myPlayer?.currentBet || 0)}
                step={SMALL_BLIND}
                value={raiseSliderVal}
                onChange={(e) => setRaiseSliderVal(Number(e.target.value))}
                className="w-full accent-amber-400 h-2 rounded bg-slate-800 cursor-pointer"
              />

              <div className="grid grid-cols-4 gap-2 font-bold whitespace-nowrap">
                <button
                  onClick={() =>
                    setRaiseSliderVal(
                      Math.min(
                        (myPlayer?.chips || 0) + (myPlayer?.currentBet || 0),
                        (currentMaxBet || BIG_BLIND) + BIG_BLIND * 2
                      )
                    )
                  }
                  className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 cursor-pointer"
                >
                  2x大盲
                </button>
                <button
                  onClick={() =>
                    setRaiseSliderVal(
                      Math.min(
                        (myPlayer?.chips || 0) + (myPlayer?.currentBet || 0),
                        (currentMaxBet || BIG_BLIND) + BIG_BLIND * 4
                      )
                    )
                  }
                  className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 cursor-pointer"
                >
                  4x大盲
                </button>
                <button
                  onClick={() =>
                    setRaiseSliderVal(
                      Math.min(
                        (myPlayer?.chips || 0) + (myPlayer?.currentBet || 0),
                        pot > 0 ? pot : BIG_BLIND * 4
                      )
                    )
                  }
                  className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 cursor-pointer"
                >
                  1x底池
                </button>
                <button
                  onClick={() =>
                    setRaiseSliderVal((myPlayer?.chips || 0) + (myPlayer?.currentBet || 0))
                  }
                  className="py-1.5 rounded-lg bg-amber-500/25 text-amber-300 border border-amber-400 cursor-pointer"
                >
                  全押
                </button>
              </div>

              <button
                onClick={() => handlePlayerRaise(0, raiseSliderVal)}
                disabled={!isMyTurn}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap"
              >
                确认加注 {formatCompactChips(raiseSliderVal)}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3 Main Tactile Action Buttons */}
        <div className="flex items-center justify-between gap-2.5">
          {/* FOLD */}
          <button
            onClick={() => handlePlayerFold(0)}
            disabled={!isMyTurn || round === 'Waiting'}
            className="flex-1 py-3 px-3 rounded-xl bg-rose-950/90 hover:bg-rose-900 border-2 border-rose-500/70 text-rose-100 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap"
          >
            弃牌
          </button>

          {/* CHECK / CALL */}
          {currentMaxBet === myPlayer?.currentBet ? (
            <button
              onClick={() => handlePlayerCheck(0)}
              disabled={!isMyTurn || round === 'Waiting'}
              className="flex-1 py-3 px-3 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border-2 border-emerald-400/80 text-emerald-100 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap"
            >
              过牌
            </button>
          ) : (
            <button
              onClick={() => handlePlayerCall(0)}
              disabled={!isMyTurn || round === 'Waiting'}
              className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 text-white font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap tabular-nums"
            >
              跟注 {formatCompactChips(currentMaxBet - (myPlayer?.currentBet || 0))}
            </button>
          )}

          {/* RAISE */}
          <button
            onClick={() => setShowRaisePanel(!showRaisePanel)}
            disabled={!isMyTurn || round === 'Waiting'}
            className="flex-1 py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 border-2 border-amber-200 text-slate-950 font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-1 whitespace-nowrap"
          >
            <span>加注</span>
            {showRaisePanel ? (
              <ChevronDown className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronUp className="w-4 h-4 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* MENU DRAWER MODAL */}
      <AnimatePresence>
        {showMenuDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowMenuDrawer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-950 border-2 border-amber-500/60 rounded-3xl p-5 max-w-sm w-full text-left space-y-3.5 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 whitespace-nowrap">
                  <Menu className="w-4 h-4 shrink-0" />
                  <span>牌桌主题与设置</span>
                </h3>
                <button
                  onClick={() => setShowMenuDrawer(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Table Theme & Stage Lighting Switcher */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-purple-300 block whitespace-nowrap">
                  桌面配色与舞台灯效
                </span>
                <FloatingStageBar
                  currentSong={currentSong}
                  setCurrentSong={setCurrentSong}
                  lightMode={lightMode}
                  setLightMode={setLightMode}
                  onTriggerLaserShow={() => setLaserActive(!laserActive)}
                  onTriggerAudienceSing={() => setAudienceSingActive(!audienceSingActive)}
                  onTriggerEncore={() => setEncoreActive(true)}
                  onOpenRules={() => {
                    setShowMenuDrawer(false);
                    setShowGuideModal(true);
                  }}
                />
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowGuideModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>德州规则说明</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowTourExitModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>查看本场战绩</span>
                </button>

                {onReturnToLauncher && (
                  <button
                    onClick={() => {
                      setShowMenuDrawer(false);
                      onReturnToLauncher();
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-500/40 font-black text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>返回选场大厅</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTLEMENT MODAL */}
      <AnimatePresence>
        {showRoundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 15 }}
              className="bg-slate-900 border border-amber-500/50 rounded-3xl p-5 max-w-sm w-full text-center space-y-3 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-white whitespace-nowrap">本局结算</h3>
                <p className="text-xs text-amber-300 mt-0.5 whitespace-nowrap truncate">
                  {winningDescription ? `获胜牌型：${winningDescription}` : '对局结束'}
                </p>
              </div>

              <div className="bg-slate-950 border border-white/10 rounded-2xl p-3 text-left space-y-1.5 text-xs whitespace-nowrap">
                <div className="flex justify-between items-center text-slate-300">
                  <span>已进行局数</span>
                  <span className="font-mono font-bold text-white tabular-nums">{handCount} 局</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>个人胜场</span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">{userWins} 胜</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>当前音符</span>
                  <span className="font-mono font-bold text-purple-300 tabular-nums">
                    🎵 {formatCompactChips(myPlayer?.chips || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>本场盈亏</span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      userNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {userNetProfit >= 0
                      ? `+${formatCompactChips(userNetProfit)}`
                      : formatCompactChips(userNetProfit)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={startNextRound}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
                >
                  <span>下一局</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  onClick={() => {
                    setShowRoundModal(false);
                    setShowTourExitModal(true);
                  }}
                  className="w-full py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>离场结算</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOUR EXIT SUMMARY MODAL */}
      <AnimatePresence>
        {showTourExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-slate-900 border border-amber-500/50 rounded-3xl p-5 max-w-sm w-full text-center space-y-3 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-400">
                <Award className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-white whitespace-nowrap">本场巡演战绩</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left text-xs whitespace-nowrap">
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-0.5">总对局</span>
                  <span className="text-sm font-black font-mono text-white tabular-nums">
                    {handCount} 局
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-0.5">胜场</span>
                  <span className="text-sm font-black font-mono text-amber-400 tabular-nums">
                    {userWins} 胜
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-0.5">当前音符</span>
                  <span className="text-sm font-black font-mono text-purple-300 tabular-nums">
                    🎵 {formatCompactChips(myPlayer?.chips || 0)}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-0.5">净盈亏</span>
                  <span
                    className={`text-sm font-black font-mono tabular-nums ${
                      userNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {userNetProfit >= 0
                      ? `+${formatCompactChips(userNetProfit)}`
                      : formatCompactChips(userNetProfit)}
                  </span>
                </div>
              </div>

              <div className="bg-purple-950/40 border border-purple-500/30 p-2 rounded-xl text-xs text-purple-200 flex justify-between items-center whitespace-nowrap">
                <span>最佳牌型</span>
                <span className="font-bold text-amber-300 truncate ml-2">{userBestHand}</span>
              </div>

              <div className="flex gap-2 pt-1 whitespace-nowrap">
                <button
                  onClick={() => setShowTourExitModal(false)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  继续对局
                </button>
                <button
                  onClick={resetWholeSession}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>重置牌局</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RULES MODAL */}
      <AnimatePresence>
        {showGuideModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowGuideModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 max-w-md w-full text-left font-sans space-y-3 max-h-[85vh] overflow-y-auto allow-scroll"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>德州扑克规则简述</span>
                </h3>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-amber-300 mb-0.5">牌型大小（由高到低）：</h4>
                  <p className="text-[11px]">
                    皇家同花顺 &gt; 同花顺 &gt; 四条 &gt; 葫芦 &gt; 同花 &gt; 顺子 &gt; 三条 &gt; 两对 &gt; 一对 &gt; 高牌
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-amber-300 mb-0.5">对局流程：</h4>
                  <p className="text-[11px]">
                    每位玩家发 2 张底牌，桌面依次发出 5 张公共牌（翻牌 3 张、转牌 1 张、河牌 1 张），从 7 张牌中任选 5 张组成最大牌型赢取底池。
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 font-black text-xs rounded-xl text-slate-950 cursor-pointer"
              >
                我知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTERACTIVE TABLE CHAT DRAWER */}
      <AnimatePresence>
        {showChatDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowChatDrawer(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-950 border-t-2 sm:border-2 border-purple-400/80 rounded-t-3xl sm:rounded-3xl p-4 max-w-md w-full font-sans space-y-3 max-h-[80vh] sm:max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-purple-500/30 pb-2.5 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-900/80 border border-purple-400 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">牌桌互动聊天</h3>
                    <p className="text-[10px] text-purple-300">与同桌牌友实时交流</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatDrawer(false)}
                  className="w-7 h-7 rounded-full bg-slate-900 border border-purple-500/40 text-purple-300 hover:text-white font-bold text-sm flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 allow-scroll my-1 min-h-[200px] max-h-[320px]">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.isUser ? 'items-end' : msg.isSystem ? 'items-center' : 'items-start'
                    }`}
                  >
                    {msg.isSystem ? (
                      <div className="bg-purple-950/60 border border-purple-500/30 text-purple-200 text-[10px] px-3 py-1 rounded-full my-1 text-center font-mono">
                        {msg.text}
                      </div>
                    ) : (
                      <div
                        className={`flex gap-2 max-w-[85%] ${
                          msg.isUser ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-900 border border-amber-400/60 flex items-center justify-center text-xs shrink-0 shadow overflow-hidden">
                          {msg.avatar &&
                          (msg.avatar.startsWith('http') || msg.avatar.startsWith('data:image')) ? (
                            <img
                              src={msg.avatar}
                              alt={msg.senderName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            msg.avatar
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div
                            className={`flex items-center gap-1.5 mb-0.5 ${
                              msg.isUser ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-amber-200/90">
                              {msg.senderName}
                            </span>
                            <span className="text-[8px] font-mono text-purple-300/60">
                              {msg.timestamp}
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                              msg.isUser
                                ? 'bg-purple-700 text-white rounded-tr-none border border-fuchsia-400/60'
                                : 'bg-slate-900 text-purple-100 rounded-tl-none border border-purple-500/40'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 allow-scroll shrink-0 pt-1 border-t border-purple-500/20">
                {[
                  '🔥 牌面很硬，谁敢跟？',
                  '🎴 全押（All-in）走起！',
                  '👏 打得漂亮！',
                  '🤝 下把继续切磋！',
                ].map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(phrase)}
                    className="px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 hover:border-purple-300 text-purple-200 text-[10px] font-bold whitespace-nowrap active:scale-95 cursor-pointer transition-all shrink-0"
                  >
                    {phrase}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1 shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="输入消息..."
                  className="flex-1 bg-slate-900 border border-purple-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/60 focus:outline-none focus:border-amber-400 font-sans"
                />
                <button
                  onClick={() => handleSendChat()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5 fill-slate-950" />
                  <span>发送</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component for clean Table Player Seat rendering
export const getTexasPosition = (
  playerIdx: number,
  dealerIndex: number,
  totalPlayers: number = 5
) => {
  const safeTotal = Math.max(2, totalPlayers);
  const offset = (playerIdx - dealerIndex + safeTotal) % safeTotal;
  if (safeTotal === 2) {
    return offset === 0
      ? {
          code: 'BTN',
          label: '庄位',
          badgeStyle: 'bg-amber-500 text-slate-950 font-black border border-amber-300',
        }
      : {
          code: 'BB',
          label: '大盲',
          badgeStyle: 'bg-cyan-600 text-white font-bold border border-cyan-300',
        };
  }
  switch (offset) {
    case 0:
      return {
        code: 'BTN',
        label: '庄位',
        badgeStyle: 'bg-amber-500 text-slate-950 font-black border border-amber-300',
      };
    case 1:
      return {
        code: 'SB',
        label: '小盲',
        badgeStyle: 'bg-indigo-600 text-white font-bold border border-indigo-300',
      };
    case 2:
      return {
        code: 'BB',
        label: '大盲',
        badgeStyle: 'bg-cyan-600 text-white font-bold border border-cyan-300',
      };
    case 3:
      return {
        code: 'UTG',
        label: '枪口',
        badgeStyle: 'bg-rose-600 text-white font-bold border border-rose-300',
      };
    case 4:
      return {
        code: 'CO',
        label: '切牌',
        badgeStyle: 'bg-fuchsia-600 text-white font-bold border border-fuchsia-300',
      };
    default:
      return {
        code: 'MP',
        label: '中位',
        badgeStyle: 'bg-purple-600 text-white font-bold border border-purple-300',
      };
  }
};

interface TablePlayerSeatProps {
  player: Player;
  playerIdx: number;
  dealerIndex: number;
  totalPlayers?: number;
  isActive: boolean;
  isWinner: boolean;
  isDealer: boolean;
  round: Round;
  position: string;
  communityCards?: Card[];
  selectedStage?: AlbumStage;
}

const TablePlayerSeat: React.FC<TablePlayerSeatProps> = ({
  player,
  playerIdx,
  dealerIndex,
  totalPlayers = 5,
  isActive,
  isWinner,
  round,
  communityCards = [],
}) => {
  const isFolded = player.isFolded;
  const fullCards = [...player.cards, ...communityCards];
  const seatEval =
    player.cards.length >= 2 && (round === 'Showdown' || isWinner) && !isFolded
      ? evaluate7CardHand(fullCards)
      : null;

  const posInfo = getTexasPosition(playerIdx, dealerIndex, totalPlayers);
  const isAvatarImg =
    player.avatar &&
    (player.avatar.startsWith('http') || player.avatar.startsWith('data:image'));
  const showFaceUpCards =
    round !== 'Waiting' &&
    !isFolded &&
    player.cards &&
    player.cards.length > 0 &&
    (round === 'Showdown' || isWinner);

  return (
    <div
      className={`relative select-none shrink-0 z-20 w-auto min-w-[126px] sm:min-w-[152px] rounded-xl border px-2.5 py-1.5 backdrop-blur-md shadow-lg transition-all flex flex-col gap-1 ${
        isFolded
          ? 'bg-slate-950/60 border-slate-800/80 opacity-45'
          : isWinner
          ? 'bg-amber-950/95 border-amber-400 ring-2 ring-amber-400/70 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
          : isActive
          ? 'bg-slate-900/95 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.45)]'
          : 'bg-slate-950/90 border-slate-700/80'
      }`}
    >
      {/* Main Unified Row: Avatar Frame + Position/Name + Chip Stack (All Fully Visible) */}
      <div className="flex items-center gap-2">
        {/* Avatar Frame Inside Box */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border flex items-center justify-center text-xs sm:text-sm shrink-0 overflow-hidden ${
            isFolded
              ? 'border-slate-700 grayscale'
              : isWinner || isActive
              ? 'border-amber-400'
              : 'border-slate-600'
          }`}
        >
          {isAvatarImg ? (
            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            player.avatar
          )}
        </div>

        {/* Position, Name, and Chip Stack Column (No Truncation) */}
        <div className="flex flex-col flex-1 leading-none gap-1">
          {/* Row 1: Position Badge + Full Player Name */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase leading-none shrink-0 ${posInfo.badgeStyle}`}
            >
              {posInfo.code}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap">
              {player.name}
            </span>
          </div>

          {/* Row 2: Full Chip Stack + Full Action/Bet Status */}
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[11px] sm:text-xs font-mono font-black text-amber-300 tabular-nums whitespace-nowrap">
              💰 {formatCompactChips(player.chips)}
            </span>

            {seatEval ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[8px] font-black leading-none shrink-0 whitespace-nowrap">
                {seatEval.handType}
              </span>
            ) : player.currentBet > 0 ? (
              <span className="px-1 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/50 text-[9px] font-mono font-bold text-emerald-300 leading-none tabular-nums shrink-0 whitespace-nowrap">
                +{formatCompactChips(player.currentBet)}
              </span>
            ) : player.lastAction ? (
              <span className="px-1 py-0.5 rounded bg-purple-900/80 border border-purple-400/40 text-[8px] font-bold text-purple-200 leading-none shrink-0 whitespace-nowrap">
                {player.lastAction}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Showdown Face-Up Cards Integrated Inside the Same Box */}
      {showFaceUpCards && (
        <div className="pt-1 border-t border-white/10 flex items-center justify-center gap-1">
          {player.cards.map((card, cIdx) => (
            <PlayingCard key={cIdx} card={card} isFaceUp={true} size="xs" />
          ))}
        </div>
      )}
    </div>
  );
};

