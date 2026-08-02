/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Player, Card, Round, StageLightMode, ConcertSong } from '../types';
import { AlbumStage } from '../data/albumStages';
import { evaluate7CardHand, isCardInHand } from '../utils/pokerEvaluator';
import { triggerHaptic } from '../utils/haptics';
import { iosAudio } from '../utils/iosAudio';
import { PlayingCard } from './PlayingCard';
import { FlippableCard } from './FlippableCard';
import { FloatingStageBar } from './StageControls';
import { MetallicPokerChip } from './MetallicPokerChip';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, HelpCircle, Disc, ChevronUp, ChevronDown, LogOut, ArrowRight, Award, ClipboardList, Menu, Eye, EyeOff, Music, Pause, SkipForward, Sparkles, Wand2 } from 'lucide-react';

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
  onReturnToLauncher?: () => void;
}

const DEFAULT_START_CHIPS = 2000;
const DEFAULT_BIG_BLIND = 20;
const DEFAULT_SMALL_BLIND = 10;

// Bot lyric responses for Immersion
const BOT_DIALOGS: Record<string, {
  check: string[];
  call: string[];
  raise: string[];
  fold: string[];
  win: string[];
}> = {
  jiangnan: {
    check: ['风到这里就是粘，我静观其变。', '你在身边就是缘，我也过牌。'],
    call: ['粘住过客的思念，我跟注！', '缘分写在三生石上面，我陪你。'],
    raise: ['缠着我们留恋人世间，加个注！', '相信爱一天，抵过永远，大加注！'],
    fold: ['雨成了线，有些冷，我先退了。', '江南的雨有些迷离，弃牌。'],
    win: ['相信爱一天抵过永远，江南一曲，承让！', '你在身边就是缘，这局缘分在我这。'],
  },
  caocao: {
    check: ['煮酒论英雄，暂时按兵不动。', '尔虞我诈是三国，我且观察。'],
    call: ['独自面对这命运的锁，我跟！', '谁来煮酒？我跟，看你的牌。'],
    raise: ['烽火连天不休，我加注！煮酒论豪杰！', '乱世左右，霸气加注！你敢跟吗？'],
    fold: ['说不清对与错，不作无谓牺牲，弃牌！', '这阵风不妙，本英雄先撤。'],
    win: ['东汉末年分三国，最后依然是我一统天下！', '千百年以后一切又从头，这局我赢了！'],
  },
  years: {
    check: ['心跳乱了节奏，先过牌平复一下。', '梦也不自由，我先看看。'],
    call: ['爱是个绝对承诺，我说跟就跟。', '浅吻着你的额头，我跟注。'],
    raise: ['放任寂寞染红天空，加个猛的！', '一千年以后，我依然要加注！'],
    fold: ['世界早已无我...我无法承受，弃牌。', '无法深情挽着你的手，先走一步。'],
    win: ['一千年以后，世界早已无我，但现在的赢家是我！', '心跳乱了节奏，赢下这局感觉太美妙。'],
  },
  love: {
    check: ['修炼爱情的心酸，我们先缓一缓。', '学会放手后怎样度过难关，我过。'],
    call: ['我们曾相爱，想到就心酸，我跟。', '修炼爱情的悲欢，我决定跟注。'],
    raise: ['那些记忆不肯轻易消散，强力加注！', '快乐或伤心都有你陪伴，来个大加注！'],
    fold: ['学会放手后怎样度过难关...我放手，弃牌。', '为了长久的爱情，退一步海阔天空。'],
    win: ['修炼爱情终于圆满，这局承让啦！', '快乐或伤心都有你陪伴，赢的感觉最快乐！'],
  },
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
  encoreActive,
  setEncoreActive,
  selectedStage,
  onReturnToLauncher,
}) => {
  const START_CHIPS = selectedStage?.startChips ?? DEFAULT_START_CHIPS;
  const BIG_BLIND = selectedStage?.bigBlind ?? DEFAULT_BIG_BLIND;
  const SMALL_BLIND = selectedStage?.smallBlind ?? DEFAULT_SMALL_BLIND;

  // Game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [currentMaxBet, setCurrentMaxBet] = useState(0);
  const [round, setRound] = useState<Round>('Waiting');
  const [activePlayerIndex, setActivePlayerIndex] = useState(-1);
  const [dealerIndex, setDealerIndex] = useState(0);
  const [sbIndex, setSbIndex] = useState(1);
  const [bbIndex, setBbIndex] = useState(2);
  const [winnerIds, setWinnerIds] = useState<string[]>([]);
  const [winningDescription, setWinningDescription] = useState('');
  
  // Multi-round statistics
  const [handCount, setHandCount] = useState(0);
  const [userWins, setUserWins] = useState(0);
  const [userBestHand, setUserBestHand] = useState('暂无');
  const [showRoundModal, setShowRoundModal] = useState(false);
  const [showTourExitModal, setShowTourExitModal] = useState(false);

  // Notifications & Interactive Panels
  const [toastMsg, setToastMsg] = useState('🎵 欢迎来到 Final Sanctuary 德州扑克演唱会！点击下方【开始第一局】发牌！');
  const [botSpeech, setBotSpeech] = useState<Record<string, string>>({});
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [raiseSliderVal, setRaiseSliderVal] = useState(BIG_BLIND * 2);
  const [showRaisePanel, setShowRaisePanel] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [isDealing, setIsDealing] = useState(false);
  const [isCardsFlipped, setIsCardsFlipped] = useState(false);

  const handleToggleFlipCards = () => {
    setIsCardsFlipped(prev => !prev);
    triggerHaptic('light');
    iosAudio.playClickSound();
  };

  const botActionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Players
  useEffect(() => {
    resetWholeSession();
  }, []);

  const resetWholeSession = () => {
    const initPlayers: Player[] = [
      { id: 'player', name: '林俊杰歌迷 (你)', avatar: '🎤', chips: START_CHIPS, currentBet: 0, cards: [], isFolded: false, isAllIn: false, isBot: false, lastAction: '' },
      { id: 'jiangnan', name: '江南小过客', avatar: '🌂', chips: START_CHIPS, currentBet: 0, cards: [], isFolded: false, isAllIn: false, isBot: true, lastAction: '' },
      { id: 'caocao', name: '枭雄曹操', avatar: '⚔️', chips: START_CHIPS, currentBet: 0, cards: [], isFolded: false, isAllIn: false, isBot: true, lastAction: '' },
      { id: 'years', name: '千年时光旅人', avatar: '⏳', chips: START_CHIPS, currentBet: 0, cards: [], isFolded: false, isAllIn: false, isBot: true, lastAction: '' },
      { id: 'love', name: '修炼爱情大师', avatar: '🌸', chips: START_CHIPS, currentBet: 0, cards: [], isFolded: false, isAllIn: false, isBot: true, lastAction: '' },
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
    setBotSpeech({});
    setIsCardsFlipped(false);
    setHandCount(0);
    setUserWins(0);
    setUserBestHand('暂无');
    setShowRoundModal(false);
    setShowTourExitModal(false);
    setToastMsg('🎵 音乐会巡演桌就绪！点击【开始第一局】拉开帷幕！');
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

  // Speech bubble
  const triggerBotSpeech = (botId: string, type: 'check' | 'call' | 'raise' | 'fold' | 'win') => {
    const dialogs = BOT_DIALOGS[botId]?.[type];
    if (dialogs && dialogs.length > 0) {
      const randomLine = dialogs[Math.floor(Math.random() * dialogs.length)];
      setBotSpeech(prev => ({ ...prev, [botId]: randomLine }));
      setTimeout(() => {
        setBotSpeech(prev => {
          const updated = { ...prev };
          delete updated[botId];
          return updated;
        });
      }, 3500);
    }
  };

  // Game loop
  useEffect(() => {
    if (round === 'Waiting' || round === 'Showdown' || activePlayerIndex === -1) return;

    const activePlayers = players.filter(p => !p.isFolded);

    if (activePlayers.length <= 1) {
      handleSinglePlayerLeftWins();
      return;
    }

    const allBetted = players.every(p => 
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
      }, 1000);
    }

    return () => {
      if (botActionTimerRef.current) clearTimeout(botActionTimerRef.current);
    };
  }, [activePlayerIndex, players, round, currentMaxBet]);

  // Execute Bot Action
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
        action = (Math.random() > 0.4 && canRaise) ? 'Raise' : 'Check';
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

  // Start Next Round (Multi-round Support)
  const startNextRound = () => {
    const newDeck = createDeck();
    setCommunityCards([]);
    setWinnerIds([]);
    setWinningDescription('');
    setBotSpeech({});
    setIsCardsFlipped(false);
    setShowRaisePanel(false);
    setShowRoundModal(false);
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

      // Top up bankrupt players automatically with minimum chips
      if (chips <= 50) {
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
        lastAction: idx === newSbIdx ? 'SB (小盲)' : (idx === newBbIdx ? 'BB (大盲)' : ''),
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

    setToastMsg(`🎟️ 第 ${nextHandNum} 局开始！庄家为【${players[newDIdx].name}】，底牌已发好！`);

    setTimeout(() => {
      setIsDealing(false);
    }, 500);
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
    const p = players[idx];
    setToastMsg(`🎤 [过牌] ${p.name} 选择过牌。`);
    if (p.isBot) triggerBotSpeech(p.id, 'check');

    if (idx === 0) {
      triggerHaptic('light');
      iosAudio.playClickSound();
    }

    setPlayers(prev => prev.map((player, i) => i === idx ? { ...player, lastAction: '过牌' } : player));
    moveToNextPlayer(idx);
  };

  const handlePlayerCall = (idx: number) => {
    const p = players[idx];
    const toCall = currentMaxBet - p.currentBet;
    const actualCall = Math.min(p.chips, toCall);

    setToastMsg(`🔊 [跟注] ${p.name} 跟注 ${actualCall} 圣所音符。`);
    if (p.isBot) triggerBotSpeech(p.id, 'call');

    if (idx === 0) {
      triggerHaptic('medium');
    }
    iosAudio.playChipSound();

    setPlayers(prev => prev.map((player, i) => {
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
    }));

    setPot(prev => prev + actualCall);
    moveToNextPlayer(idx);
  };

  const handlePlayerRaise = (idx: number, raiseTotalAmount: number) => {
    const p = players[idx];
    const extraChipsNeeded = raiseTotalAmount - p.currentBet;
    const actualRaise = Math.min(p.chips, extraChipsNeeded);

    setToastMsg(`🔥 [加注] ${p.name} 加注至 ${p.currentBet + actualRaise} 圣所音符！`);
    if (p.isBot) triggerBotSpeech(p.id, 'raise');

    if (idx === 0) {
      triggerHaptic('heavy');
    }
    iosAudio.playChipSound();

    setPlayers(prev => prev.map((player, i) => {
      if (i === idx) {
        const isNowAllIn = player.chips - actualRaise === 0;
        return {
          ...player,
          chips: player.chips - actualRaise,
          currentBet: player.currentBet + actualRaise,
          lastAction: isNowAllIn ? '全押' : `加注(${player.currentBet + actualRaise})`,
          isAllIn: isNowAllIn || player.isAllIn,
        };
      }
      return player;
    }));

    setPot(prev => prev + actualRaise);
    setCurrentMaxBet(p.currentBet + actualRaise);
    setShowRaisePanel(false);
    moveToNextPlayer(idx);
  };

  const handlePlayerFold = (idx: number) => {
    const p = players[idx];
    setToastMsg(`💨 [弃牌] ${p.name} 弃牌。`);
    if (p.isBot) triggerBotSpeech(p.id, 'fold');

    if (idx === 0) {
      triggerHaptic('light');
    }
    iosAudio.playFoldSound();

    setPlayers(prev => prev.map((player, i) => i === idx ? { ...player, isFolded: true, lastAction: '弃牌' } : player));
    moveToNextPlayer(idx);
  };

  const handlePlayerAllIn = (idx: number) => {
    const p = players[idx];
    const allInAmt = p.chips;
    const totalBet = p.currentBet + allInAmt;

    setToastMsg(`🚀 [全押] ${p.name} 孤注一掷 全押 ${allInAmt} 圣所音符！`);
    if (p.isBot) triggerBotSpeech(p.id, 'raise');

    if (idx === 0) {
      triggerHaptic('warning');
    }
    iosAudio.playChipSound();

    setPlayers(prev => prev.map((player, i) => {
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
    }));

    setPot(prev => prev + allInAmt);
    if (totalBet > currentMaxBet) {
      setCurrentMaxBet(totalBet);
    }
    moveToNextPlayer(idx);
  };

  const handleSinglePlayerLeftWins = () => {
    const winner = players.find(p => !p.isFolded);
    if (!winner) return;

    setToastMsg(`🏆 [本局结束] 其他玩家弃牌，${winner.name} 赢下底池 ${pot} 圣所音符！`);
    if (winner.isBot) triggerBotSpeech(winner.id, 'win');

    if (winner.id === 'player') {
      setUserWins(prev => prev + 1);
    }

    setPlayers(prev => prev.map(p => p.id === winner.id ? { ...p, chips: p.chips + pot } : p));
    setWinnerIds([winner.id]);
    setWinningDescription('对手全场弃牌');
    setRound('Showdown');
    setActivePlayerIndex(-1);
    setShowRoundModal(true);
    
    setEncoreActive(true);
    setTimeout(() => setEncoreActive(false), 2500);
  };

  const advanceRound = () => {
    setPlayers(prev => prev.map(p => ({ ...p, currentBet: 0, lastAction: p.isFolded ? '弃牌' : (p.isAllIn ? '全押' : '') })));
    setCurrentMaxBet(0);

    const canActCount = players.filter(p => !p.isFolded && !p.isAllIn).length;

    if (round === 'PreFlop') {
      const nextCard1 = deck.pop()!;
      const nextCard2 = deck.pop()!;
      const nextCard3 = deck.pop()!;
      setCommunityCards([nextCard1, nextCard2, nextCard3]);
      setRound('Flop');
      setToastMsg(`🌈 [翻牌圈] 揭开前 3 张公共牌！`);
      if (canActCount > 0) startBettingRoundFromDealerLeft();
      else setTimeout(advanceRound, 1000);
    } else if (round === 'Flop') {
      const nextCard = deck.pop()!;
      setCommunityCards(prev => [...prev, nextCard]);
      setRound('Turn');
      setToastMsg(`✨ [转牌圈] 揭开第 4 张公共牌！`);
      if (canActCount > 0) startBettingRoundFromDealerLeft();
      else setTimeout(advanceRound, 1000);
    } else if (round === 'Turn') {
      const nextCard = deck.pop()!;
      setCommunityCards(prev => [...prev, nextCard]);
      setRound('River');
      setToastMsg(`🎭 [河牌圈] 揭开最后 1 张公共牌！`);
      if (canActCount > 0) startBettingRoundFromDealerLeft();
      else setTimeout(advanceRound, 1000);
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
    const activePlayerEvaluations = players.map(p => {
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
    activePlayerEvaluations.forEach(ev => {
      if (ev.score > highestScore) highestScore = ev.score;
    });

    const winners = activePlayerEvaluations.filter(ev => ev.score === highestScore && ev.score !== -1);
    const winnerIdsList = winners.map(w => w.player.id);
    const winningDesc = winners[0]?.description || '';

    // Update user best hand
    const myEv = activePlayerEvaluations.find(e => e.player.id === 'player');
    if (myEv && myEv.score > 0) {
      setUserBestHand(prev => {
        if (prev === '暂无') return myEv.description;
        return myEv.description;
      });
    }

    if (winnerIdsList.includes('player')) {
      setUserWins(prev => prev + 1);
      triggerHaptic('win');
      iosAudio.playWinFanfare();
    } else {
      iosAudio.playChipSound();
    }

    const splitShare = Math.floor(pot / winners.length);
    setPlayers(prev => prev.map(p => {
      if (winnerIdsList.includes(p.id)) {
        return {
          ...p,
          chips: p.chips + splitShare,
          handDescription: winners.find(w => w.player.id === p.id)?.description,
        };
      }
      return p;
    }));

    setWinnerIds(winnerIdsList);
    setWinningDescription(winningDesc);

    winners.forEach(w => {
      setToastMsg(`👑 [摊牌比牌] ${w.player.name} 凭借【${w.description}】独享 ${splitShare} 圣所音符！`);
      if (w.player.isBot) triggerBotSpeech(w.player.id, 'win');
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
  const myCurrentEvaluation = (round !== 'Waiting' && myFullCards.length >= 2) 
    ? evaluate7CardHand(myFullCards) 
    : null;

  return (
    <div className="w-full h-full bg-[#090118] text-white font-sans relative overflow-hidden flex flex-col justify-between items-center select-none" id="main-poker-stage">
      
      {/* 1. TOP HEADER BAR */}
      <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl px-3 pt-2 pb-1 flex items-center justify-between z-40 flex-shrink-0">
        {/* Left: Return to Launcher button */}
        <button
          onClick={onReturnToLauncher}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-purple-950 to-slate-950 border border-purple-400/80 text-purple-300 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.4)] hover:border-purple-300 active:scale-95 cursor-pointer transition-all"
          title="返回启动大厅"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
        </button>

        {/* Center: Cyber Neon Pill Badge */}
        <div className="bg-gradient-to-r from-slate-950 via-purple-950/90 to-slate-950 border-2 border-purple-400/90 px-3.5 sm:px-5 py-1 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)] flex flex-col items-center justify-center">
          <span className="text-xs sm:text-sm font-black text-white font-mono tracking-wider text-shadow-glow-cyan">
            {selectedStage ? `${selectedStage.smallBlind}/${selectedStage.bigBlind} ${selectedStage.name}` : '10/20 FINAL SANCTUARY GLOBAL POKER'}
          </span>
          <span className="text-[8px] sm:text-[9px] font-mono font-bold text-fuchsia-300 uppercase tracking-widest -mt-0.5">
            {selectedStage?.badgeText || 'FINAL SANCTUARY STADIUM'}
          </span>
        </div>

        {/* Right: Round button for Hamburger Menu */}
        <button
          onClick={() => setShowMenuDrawer(true)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-fuchsia-950 to-slate-950 border border-fuchsia-400/80 text-fuchsia-300 flex items-center justify-center shadow-[0_0_12px_rgba(236,72,153,0.4)] hover:border-fuchsia-300 active:scale-95 cursor-pointer transition-all"
          title="主菜单与设置"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* DYNAMIC CONCERT STAGE SPOTLIGHTS (动态舞台灯光光束扫描) */}
      <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
        {/* Top-Left Scanning Spotlight Cone */}
        <motion.div
          animate={{
            rotate: [-35, 15, -35],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: 'top left' }}
          className="absolute -top-10 -left-10 w-[240px] h-[120vh] bg-gradient-to-b from-purple-500/40 via-fuchsia-500/20 to-transparent blur-md mix-blend-screen"
        />

        {/* Top-Right Scanning Spotlight Cone */}
        <motion.div
          animate={{
            rotate: [35, -15, 35],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ transformOrigin: 'top right' }}
          className="absolute -top-10 -right-10 w-[240px] h-[120vh] bg-gradient-to-b from-fuchsia-500/40 via-purple-500/20 to-transparent blur-md mix-blend-screen"
        />

        {/* Center Stage Sweeping Searchlight Beam */}
        <motion.div
          animate={{
            rotate: [-25, 25, -25],
            opacity: [0.25, 0.55, 0.25],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{ transformOrigin: 'top center' }}
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[180px] h-[110vh] bg-gradient-to-b from-amber-400/35 via-purple-500/15 to-transparent blur-lg mix-blend-screen"
        />

        {/* Bottom Stage Upward Spotlight Cones */}
        <motion.div
          animate={{
            rotate: [15, -30, 15],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: 'bottom left' }}
          className="absolute -bottom-10 -left-10 w-[200px] h-[100vh] bg-gradient-to-t from-cyan-400/35 via-fuchsia-500/15 to-transparent blur-md mix-blend-screen"
        />

        <motion.div
          animate={{
            rotate: [-15, 30, -15],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          style={{ transformOrigin: 'bottom right' }}
          className="absolute -bottom-10 -right-10 w-[200px] h-[100vh] bg-gradient-to-t from-purple-500/35 via-amber-400/15 to-transparent blur-md mix-blend-screen"
        />

        {/* Stage Floor Light Pool Reflection (Table Hit Point Glow) */}
        <motion.div
          animate={{
            x: ['-25%', '25%', '-25%'],
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[240px] h-[100px] bg-purple-400/30 blur-2xl rounded-full pointer-events-none mix-blend-screen"
        />
      </div>

      {/* SPECIAL CONCERT LIGHTING FX */}
      {laserActive && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <svg className="w-full h-full opacity-70">
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center pointer-events-none"
          >
            <Disc className="w-8 h-8 text-amber-400 animate-spin-slow mb-1" />
            <p className="text-xs font-bold text-amber-200 tracking-widest uppercase animate-pulse">
              🎤 Final Sanctuary 德州发牌中...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. TOP HALF: PERSPECTIVE 3D POKER FELT TABLE (Reflects reference image) */}
      <div className="relative w-full max-w-lg md:max-w-xl lg:max-w-2xl h-[46vh] min-h-[310px] flex flex-col justify-between items-center px-2 py-1 my-auto flex-shrink-0" id="top-arena">
        
        {/* Oval Felt Backdrop - RICH PURPLE VELVET */}
        <div className="absolute inset-x-2 inset-y-1 rounded-[100px] border-4 border-purple-500/80 bg-[radial-gradient(ellipse_at_center,#3b0764,#210042,#0a0017)] shadow-[inset_0_0_40px_rgba(0,0,0,0.85),0_0_35px_rgba(168,85,247,0.4)] pointer-events-none overflow-hidden">
          {/* Outer wood/rim ring line */}
          <div className="absolute inset-2 rounded-[92px] border border-fuchsia-400/40" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center opacity-15">
            <span className="font-display font-black text-3xl sm:text-4xl tracking-wider text-purple-200">FINAL SANCTUARY</span>
            <span className="text-[9px] font-mono font-bold text-fuchsia-300 uppercase tracking-widest">PURPLE SANCTUARY ARENA</span>
          </div>
        </div>

        {/* Live announcement ticker */}
        <div className="z-30 w-full px-4 pt-1">
          <div className="bg-black/70 border border-amber-500/30 px-3 py-0.5 rounded-full text-[10px] font-bold text-amber-200 backdrop-blur-md text-center truncate shadow">
            {toastMsg}
          </div>
        </div>

        {/* TOP ROW BOT PLAYERS (Caocao & 1000Years) */}
        <div className="w-full flex justify-between items-center z-20 px-3 pt-0.5">
          {players[2] && (
            <TablePlayerSeat
              player={players[2]}
              playerIdx={2}
              dealerIndex={dealerIndex}
              isActive={activePlayerIndex === 2}
              isWinner={winnerIds.includes(players[2].id)}
              isDealer={dealerIndex === 2}
              round={round}
              botSpeech={botSpeech[players[2].id]}
              position="top-left"
              communityCards={communityCards}
              selectedStage={selectedStage}
            />
          )}

          {players[3] && (
            <TablePlayerSeat
              player={players[3]}
              playerIdx={3}
              dealerIndex={dealerIndex}
              isActive={activePlayerIndex === 3}
              isWinner={winnerIds.includes(players[3].id)}
              isDealer={dealerIndex === 3}
              round={round}
              botSpeech={botSpeech[players[3].id]}
              position="top-right"
              communityCards={communityCards}
              selectedStage={selectedStage}
            />
          )}
        </div>

        {/* MIDDLE ROW BOT PLAYERS & CENTER POT / COMMUNITY CARDS */}
        <div className="w-full flex items-center justify-between z-20 px-1 my-auto gap-1">
          {players[1] && (
            <TablePlayerSeat
              player={players[1]}
              playerIdx={1}
              dealerIndex={dealerIndex}
              isActive={activePlayerIndex === 1}
              isWinner={winnerIds.includes(players[1].id)}
              isDealer={dealerIndex === 1}
              round={round}
              botSpeech={botSpeech[players[1].id]}
              position="middle-left"
              communityCards={communityCards}
              selectedStage={selectedStage}
            />
          )}

          {/* CENTER TABLE FELT: Pot + Community Cards */}
          <div className="flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl bg-black/60 border border-amber-500/30 backdrop-blur-md mx-1 shadow-2xl">
            {/* Pot Badge with Floating Metallic Final Sanctuary Chips */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-400/60 px-3 py-1 rounded-lg shadow-lg flex items-center gap-2">
              <MetallicPokerChip size="sm" selectedStage={selectedStage} showStack={true} isFloating={true} />
              <span className="text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1">
                Pot : <span className="text-white font-black text-sm">{pot}</span>
              </span>
            </div>

            {/* Community Cards */}
            <div className="flex gap-1 items-center justify-center p-1 rounded-lg bg-emerald-950/60 border border-emerald-500/20 max-w-full">
              {communityCards.length === 0 ? (
                <span className="text-[10px] text-emerald-300/60 font-mono italic px-2 py-0.5">
                  Waiting...
                </span>
              ) : (
                communityCards.map((card, cIdx) => {
                  const isCardGlowing = myCurrentEvaluation ? isCardInHand(card, myCurrentEvaluation.cards) : false;
                  return (
                    <PlayingCard 
                      key={cIdx} 
                      card={card} 
                      isFaceUp={true} 
                      size="sm" 
                      isGlowing={isCardGlowing}
                    />
                  );
                })
              )}
            </div>

            {round === 'Showdown' && winningDescription && (
              <div className="bg-yellow-500/20 border border-yellow-400/50 text-yellow-200 px-2 py-0.5 rounded-md text-[9px] font-bold text-center flex items-center gap-1 shadow max-w-full truncate">
                <Trophy className="w-3 h-3 text-yellow-400 animate-bounce flex-shrink-0" />
                <span className="truncate">{winningDescription}</span>
              </div>
            )}
          </div>

          {players[4] && (
            <TablePlayerSeat
              player={players[4]}
              playerIdx={4}
              dealerIndex={dealerIndex}
              isActive={activePlayerIndex === 4}
              isWinner={winnerIds.includes(players[4].id)}
              isDealer={dealerIndex === 4}
              round={round}
              botSpeech={botSpeech[players[4].id]}
              position="middle-right"
              communityCards={communityCards}
            />
          )}
        </div>

        {/* BOTTOM OF FELT: Human Player's Table Badge & Edge Hand Type Prompt */}
        <div className="w-full flex flex-col items-center justify-center z-20 pb-0.5 gap-1">
          {/* Table Edge Hand Type Badge */}
          {round !== 'Waiting' && myPlayer?.cards && myPlayer.cards.length > 0 && myCurrentEvaluation && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="badge-glowing-stream p-[1.5px] rounded-full shadow-[0_0_18px_rgba(34,211,238,0.7)]"
            >
              <div className="bg-slate-950/95 border border-amber-300/90 px-3 py-0.5 sm:px-4 sm:py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-amber-200 tracking-wider">
                  牌桌边缘提示：
                </span>
                <span className="text-xs sm:text-sm font-black text-white font-mono tracking-wider text-shadow-glow-cyan">
                  {myCurrentEvaluation.description}
                </span>
                {myCurrentEvaluation.handType !== '高牌' && (
                  <span className="bg-gradient-to-r from-amber-400 via-fuchsia-500 to-rose-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow tracking-wider animate-bounce">
                    {myCurrentEvaluation.handType}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {myPlayer && (() => {
            const myPosInfo = getTexasPosition(0, dealerIndex, 5);
            return (
              <div className="relative flex flex-col items-center">
                {/* Table Badge */}
                <div className={`px-3 py-1 rounded-xl border-2 shadow-xl flex items-center gap-2 backdrop-blur-md transition-all ${
                  isMyTurn ? 'bg-blue-600/90 border-cyan-300 ring-2 ring-cyan-400 animate-pulse' : 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-amber-400/60'
                }`}>
                  {/* Texas Position Badge */}
                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-black tracking-wider ${myPosInfo.badgeStyle}`}>
                    {myPosInfo.code}
                  </span>

                  <div className="flex items-center gap-1">
                    <span className="text-xs">🎤</span>
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      {myPlayer.name} ({myPlayer.lastAction || '在圈'})
                    </span>
                  </div>

                  <span className="text-xs font-mono font-black text-amber-300">
                    💰 {myPlayer.chips}
                  </span>
                </div>

                {/* Chips on felt with micro levitation */}
                {myPlayer.currentBet > 0 && (
                  <div className="absolute -top-7 bg-black/85 border border-amber-400/60 px-2 py-0.5 rounded-full text-[9px] font-mono text-amber-300 font-bold shadow-lg flex items-center gap-1 z-30">
                    <MetallicPokerChip size="xs" amount={myPlayer.currentBet} selectedStage={selectedStage} isFloating={true} />
                  </div>
                )}
              </div>
            );
          })()}
        </div>

      </div>

      {/* 3. GOLD DIVIDER BAR */}
      <div className="w-full border-t-2 border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.5)] z-30 flex-shrink-0" />

      {/* 4. BOTTOM HALF: LARGE CARDS SQUEEZE & ACTION CONSOLE */}
      <div className="w-full flex-1 max-w-lg md:max-w-xl lg:max-w-2xl bg-[radial-gradient(ellipse_at_bottom,#114028,#061a10)] flex flex-col justify-between items-center p-2.5 relative z-20">
        
        {/* Hero Fanned Hole Cards Area */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative py-1">
          {round === 'Waiting' ? (
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <button
                onClick={startNextRound}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-2xl border-2 border-amber-300 flex items-center gap-2 cursor-pointer active:scale-95 transition-all animate-bounce"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>开始发牌 (Deal)</span>
              </button>
              <p className="text-xs font-bold text-amber-200/80">点击发牌拉开对局帷幕</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full">
              {/* Hole Cards Container with 3D Flip */}
              <div className="relative flex justify-center items-center h-38 sm:h-44 w-full">
                {/* Card 1 */}
                <div className="absolute left-[26%] sm:left-[30%] z-10 shadow-2xl hover:scale-105 transition-all">
                  <FlippableCard
                    card={myPlayer?.cards[0]}
                    isFlipped={isCardsFlipped || round === 'Showdown'}
                    onFlipToggle={handleToggleFlipCards}
                    size="2xl"
                    isGlowing={myCurrentEvaluation ? isCardInHand(myPlayer?.cards[0], myCurrentEvaluation.cards) : false}
                    rotationAngle={-8}
                  />
                </div>

                {/* Card 2 */}
                <div className="absolute right-[26%] sm:right-[30%] z-20 shadow-2xl hover:scale-105 transition-all">
                  <FlippableCard
                    card={myPlayer?.cards[1]}
                    isFlipped={isCardsFlipped || round === 'Showdown'}
                    onFlipToggle={handleToggleFlipCards}
                    size="2xl"
                    isGlowing={myCurrentEvaluation ? isCardInHand(myPlayer?.cards[1], myCurrentEvaluation.cards) : false}
                    rotationAngle={8}
                  />
                </div>
              </div>

              {/* Quick Flip Button & Peek Prompt */}
              <div className="mt-1 flex items-center gap-2 z-30">
                <button
                  type="button"
                  onClick={handleToggleFlipCards}
                  className={`px-3 py-1 rounded-full border text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    isCardsFlipped
                      ? 'bg-purple-950/90 border-purple-400/80 text-purple-200 hover:bg-purple-900'
                      : 'bg-gradient-to-r from-amber-500 via-fuchsia-500 to-purple-600 border-amber-300 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse'
                  }`}
                >
                  {isCardsFlipped ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-purple-300" />
                      <span>点击盖牌 (Hide)</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-amber-200" />
                      <span>点击看底牌 (Reveal Cards)</span>
                    </>
                  )}
                </button>

                <span className="text-[10px] font-mono text-purple-300/80">
                  {isCardsFlipped ? '底牌已揭开' : '默认背面对齐 (点击卡牌翻看)'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 5. METALLIC ACTION BUTTONS BAR */}
        <div className="w-full flex items-center justify-between gap-2 pt-1.5 pb-1 relative z-30 flex-shrink-0">
          
          {/* Raise Slider Panel Drawer */}
          <AnimatePresence>
            {showRaisePanel && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute bottom-16 right-0 left-0 bg-slate-950/95 border-2 border-amber-500/70 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 z-50 text-xs"
              >
                <div className="flex justify-between text-xs font-mono text-amber-300 font-bold">
                  <span>加注至: {raiseSliderVal} 圣所音符</span>
                  <span>可用: {myPlayer?.chips + myPlayer?.currentBet}</span>
                </div>

                <input
                  type="range"
                  min={Math.min(myPlayer?.chips + myPlayer?.currentBet, currentMaxBet === 0 ? BIG_BLIND : currentMaxBet + BIG_BLIND)}
                  max={myPlayer?.chips + myPlayer?.currentBet}
                  step={BIG_BLIND}
                  value={raiseSliderVal}
                  onChange={(e) => setRaiseSliderVal(Number(e.target.value))}
                  className="w-full accent-amber-400 h-2 rounded bg-slate-800 cursor-pointer"
                />

                <div className="grid grid-cols-4 gap-1.5 font-bold">
                  <button
                    onClick={() => setRaiseSliderVal(Math.min(myPlayer?.chips + myPlayer?.currentBet, (currentMaxBet || BIG_BLIND) + 50))}
                    className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 cursor-pointer"
                  >
                    +50
                  </button>
                  <button
                    onClick={() => setRaiseSliderVal(Math.min(myPlayer?.chips + myPlayer?.currentBet, (currentMaxBet || BIG_BLIND) + 100))}
                    className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 cursor-pointer"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => setRaiseSliderVal(Math.min(myPlayer?.chips + myPlayer?.currentBet, pot > 0 ? pot : BIG_BLIND * 4))}
                    className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 cursor-pointer"
                  >
                    1x底池
                  </button>
                  <button
                    onClick={() => setRaiseSliderVal(myPlayer?.chips + myPlayer?.currentBet)}
                    className="py-1.5 rounded-lg bg-amber-500/30 text-amber-300 border border-amber-400 cursor-pointer"
                  >
                    MAX
                  </button>
                </div>

                <button
                  onClick={() => handlePlayerRaise(0, raiseSliderVal)}
                  disabled={!isMyTurn}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  确认加注至 {raiseSliderVal}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3 Main Action Buttons */}
          {/* FOLD */}
          <button
            onClick={() => handlePlayerFold(0)}
            disabled={!isMyTurn || round === 'Waiting'}
            className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-b from-rose-900 via-rose-950 to-slate-950 border-2 border-rose-700/80 text-rose-100 font-black text-xs sm:text-sm shadow-xl hover:border-rose-500 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Fold (弃牌)
          </button>

          {/* CHECK / CALL */}
          {currentMaxBet === myPlayer?.currentBet ? (
            <button
              onClick={() => handlePlayerCheck(0)}
              disabled={!isMyTurn || round === 'Waiting'}
              className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-2 border-slate-500 text-white font-black text-xs sm:text-sm shadow-xl hover:border-slate-400 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Check (过牌)
            </button>
          ) : (
            <button
              onClick={() => handlePlayerCall(0)}
              disabled={!isMyTurn || round === 'Waiting'}
              className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-2 border-slate-400 text-white font-black text-xs sm:text-sm shadow-xl hover:border-white active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Call ({currentMaxBet - (myPlayer?.currentBet || 0)})
            </button>
          )}

          {/* RAISE / CALL ANY */}
          <button
            onClick={() => setShowRaisePanel(!showRaisePanel)}
            disabled={!isMyTurn || round === 'Waiting'}
            className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-b from-blue-700 via-blue-900 to-slate-950 border-2 border-blue-400 text-cyan-200 font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:border-cyan-300 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            <span>Raise</span>
            {showRaisePanel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
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
              className="bg-slate-950 border-2 border-amber-500/60 rounded-3xl p-5 max-w-sm w-full text-left space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Menu className="w-4 h-4" />
                  Final Sanctuary Poker 巡演功能菜单
                </h3>
                <button
                  onClick={() => setShowMenuDrawer(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Concert Music Switcher */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-purple-300 block">🎵 背景演唱会金曲:</span>
                <FloatingStageBar
                  currentSong={currentSong}
                  setCurrentSong={setCurrentSong}
                  lightMode={lightMode}
                  setLightMode={setLightMode}
                  onTriggerLaserShow={() => setLaserActive(true)}
                  onTriggerAudienceSing={() => setAudienceSingActive(true)}
                  onTriggerEncore={() => setEncoreActive(true)}
                  onOpenRules={() => {
                    setShowMenuDrawer(false);
                    setShowGuideModal(true);
                  }}
                />
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-cyan-500/30 space-y-2">
                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowGuideModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-500/50 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                >
                  <ClipboardList className="w-4 h-4 text-cyan-400" />
                  <span>规则与战绩 (Rules & Stats)</span>
                </button>

                {onReturnToLauncher && (
                  <button
                    onClick={() => {
                      setShowMenuDrawer(false);
                      onReturnToLauncher();
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>返回启动大厅 (Return to Launcher)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowTourExitModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>离开桌子 (结算战绩)</span>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SETTLEMENT MODAL */}
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
                <Trophy className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <h3 className="text-base font-black text-white">
                  本局游戏结算
                </h3>
                <p className="text-xs text-amber-300 mt-0.5">
                  {winningDescription ? `获胜牌型：${winningDescription}` : '一局完美落幕'}
                </p>
              </div>

              <div className="bg-slate-950 border border-white/10 rounded-2xl p-3 text-left space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>当前已进行局数:</span>
                  <span className="font-mono font-bold text-white">{handCount} 局</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>个人胜场记录:</span>
                  <span className="font-mono font-bold text-amber-300">{userWins} 胜</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>圣所音符余额:</span>
                  <span className="font-mono font-bold text-purple-300">🎵 {(myPlayer?.chips || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>累计净收益:</span>
                  <span className={`font-mono font-bold ${userNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {userNetProfit >= 0 ? `+${userNetProfit}` : userNetProfit} 音符
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={startNextRound}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>继续下一局 (Next Hand)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setShowRoundModal(false);
                    setShowTourExitModal(true);
                  }}
                  className="w-full py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>离场结算</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. TOUR EXIT SUMMARY MODAL */}
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
              className="bg-slate-900 border border-amber-500/50 rounded-3xl p-5 max-w-md w-full text-center space-y-3 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-400">
                <Award className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  Final Sanctuary 巡演扑克战绩榜
                </h3>
                <p className="text-xs text-amber-300 mt-0.5">
                  感谢参与 Final Sanctuary 德州扑克音乐会对决！
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-0.5">总对局数</span>
                  <span className="text-base font-black font-mono text-white">{handCount} 局</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-0.5">胜局数</span>
                  <span className="text-base font-black font-mono text-amber-400">{userWins} 胜</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-0.5">结余音符</span>
                  <span className="text-base font-black font-mono text-purple-300">🎵 {(myPlayer?.chips || 0).toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block mb-0.5">净盈亏音符</span>
                  <span className={`text-base font-black font-mono ${userNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {userNetProfit >= 0 ? `+${userNetProfit}` : userNetProfit}
                  </span>
                </div>
              </div>

              <div className="bg-purple-950/40 border border-purple-500/30 p-2 rounded-xl text-xs text-purple-200 flex justify-between items-center">
                <span>个人最强牌型纪录:</span>
                <span className="font-bold text-amber-300">{userBestHand}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowTourExitModal(false)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  返回继续游戏
                </button>
                <button
                  onClick={resetWholeSession}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重新开始巡演</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. RULES MODAL */}
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
              className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 max-w-md w-full text-left font-sans space-y-3 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  德州扑克规则 & 战绩榜
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
                  <h4 className="font-bold text-amber-300 mb-0.5">🎴 牌型大小比较:</h4>
                  <p className="text-[11px]">皇家同花顺 &gt; 同花顺 &gt; 四条 (金刚) &gt; 葫芦 &gt; 同花 &gt; 顺子 &gt; 三条 &gt; 两对 &gt; 一对 &gt; 高牌</p>
                </div>

                <div>
                  <h4 className="font-bold text-amber-300 mb-0.5">🎤 多局巡演:</h4>
                  <p className="text-[11px]">筹码累计，庄家和盲注按时针旋转。随时可以点击右侧菜单切换 JJ 林俊杰经典歌曲！</p>
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

    </div>
  );
};

// Sub-component for clean Table Player Seat rendering
export const getTexasPosition = (playerIdx: number, dealerIndex: number, totalPlayers: number = 5) => {
  const offset = (playerIdx - dealerIndex + totalPlayers) % totalPlayers;
  switch (offset) {
    case 0:
      return { code: 'BTN', label: '庄位 (Button)', badgeStyle: 'bg-amber-500 text-slate-950 font-black border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]' };
    case 1:
      return { code: 'SB', label: '小盲 (Small Blind)', badgeStyle: 'bg-indigo-600 text-white font-bold border border-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.8)]' };
    case 2:
      return { code: 'BB', label: '大盲 (Big Blind)', badgeStyle: 'bg-cyan-600 text-white font-bold border border-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]' };
    case 3:
      return { code: 'UTG', label: '枪口 (Under The Gun)', badgeStyle: 'bg-rose-600 text-white font-bold border border-rose-300 shadow-[0_0_8px_rgba(225,29,72,0.8)]' };
    case 4:
      return { code: 'CO', label: '切牌 (Cutoff)', badgeStyle: 'bg-fuchsia-600 text-white font-bold border border-fuchsia-300 shadow-[0_0_8px_rgba(217,70,239,0.8)]' };
    default:
      return { code: 'MP', label: '中位', badgeStyle: 'bg-purple-600 text-white font-bold border border-purple-300' };
  }
};

interface TablePlayerSeatProps {
  player: Player;
  playerIdx: number;
  dealerIndex: number;
  isActive: boolean;
  isWinner: boolean;
  isDealer: boolean;
  round: Round;
  botSpeech?: string;
  position: string;
  communityCards?: Card[];
  selectedStage?: AlbumStage;
}

const TablePlayerSeat: React.FC<TablePlayerSeatProps> = ({
  player,
  playerIdx,
  dealerIndex,
  isActive,
  isWinner,
  isDealer,
  round,
  botSpeech,
  communityCards = [],
  selectedStage,
}) => {
  const isFolded = player.isFolded;
  const fullCards = [...player.cards, ...communityCards];
  const seatEval = (player.cards.length >= 2 && round !== 'Waiting' && !isFolded) 
    ? evaluate7CardHand(fullCards) 
    : null;

  const posInfo = getTexasPosition(playerIdx, dealerIndex, 5);

  return (
    <div className="relative flex flex-col items-center select-none shrink-0">
      {/* Compact Seat Badge (Avatar + Position + Name + Chips + Action) */}
      <div className={`flex flex-col items-center p-1.5 rounded-2xl border-2 backdrop-blur-md transition-all w-[76px] sm:w-[86px] shadow-lg ${
        isFolded
          ? 'bg-black/60 border-gray-800 opacity-40 grayscale'
          : isActive
          ? 'bg-gradient-to-b from-purple-900 via-purple-950 to-slate-950 border-purple-400 ring-2 ring-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.7)] z-30 scale-105'
          : 'bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-black/90 border-purple-500/40 hover:border-purple-400'
      } ${isWinner ? 'ring-2 ring-amber-400 border-amber-300 bg-amber-950/80 shadow-[0_0_20px_rgba(245,158,11,0.8)] z-30' : ''}`}>
        
        {/* Header: Position Badge & Dealer Button */}
        <div className="flex items-center justify-between w-full mb-1 px-0.5">
          <span className={`px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider ${posInfo.badgeStyle}`}>
            {posInfo.code}
          </span>
          {isDealer && (
            <span className="bg-rose-600 text-white text-[7px] font-black px-1 rounded shadow-sm border border-rose-300">
              D
            </span>
          )}
        </div>

        {/* Center Avatar Circle with Active Pulse */}
        <div className="relative my-0.5">
          <div className={`w-8 h-8 rounded-full bg-slate-900 border-2 flex items-center justify-center text-sm shadow-inner ${
            isActive ? 'border-purple-300 bg-purple-950' : 'border-amber-400/60'
          }`}>
            {player.avatar}
          </div>
          {isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
          )}
        </div>

        {/* Player Name */}
        <span className="text-[10px] font-bold text-white truncate w-full text-center leading-tight">
          {player.name}
        </span>

        {/* Chips Count */}
        <span className="text-[9px] font-mono font-black text-amber-300 text-center truncate w-full mt-0.5">
          💰 {player.chips}
        </span>

        {/* Action Badge */}
        {player.lastAction && (
          <div className={`text-[8px] font-bold px-1 py-0.5 rounded text-center w-full mt-1 truncate ${
            player.isAllIn 
              ? 'bg-amber-500 text-slate-950 font-black animate-pulse' 
              : isFolded 
              ? 'bg-slate-800 text-slate-400' 
              : 'bg-purple-950 text-purple-200 border border-purple-500/40'
          }`}>
            {player.lastAction}
          </div>
        )}
      </div>

      {/* Showdown Text Summary */}
      {(round === 'Showdown' || isWinner) && seatEval && !isFolded && (
        <div className="mt-1 bg-slate-950/95 border border-amber-400/90 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold text-amber-200 shadow-[0_0_10px_rgba(250,204,21,0.5)] truncate max-w-[86px] text-center">
          ✨ {seatEval.handType}
        </div>
      )}

      {/* Floating Bet Chips */}
      {player.currentBet > 0 && (
        <div className="mt-1 bg-black/90 border border-amber-400/60 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold text-amber-300 shadow-md flex items-center gap-1">
          <MetallicPokerChip size="xs" amount={player.currentBet} selectedStage={selectedStage} isFloating={true} />
        </div>
      )}
    </div>
  );
};

// Sub-component for clean Player Seat rendering (supports left, right, center layout alignments)
interface PlayerSeatProps {
  player: Player;
  isActive: boolean;
  isWinner: boolean;
  isDealer: boolean;
  isSB: boolean;
  isBB: boolean;
  round: Round;
  botSpeech?: string;
  position?: 'left' | 'right' | 'center';
  isHuman?: boolean;
}

const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isActive,
  isWinner,
  isDealer,
  isSB,
  isBB,
  round,
  botSpeech,
  position = 'center',
  isHuman = false,
}) => {
  // Determine speech bubble positioning class based on table side
  let speechBubblePosClass = 'left-1/2 -translate-x-1/2';
  if (position === 'right') {
    speechBubblePosClass = 'right-0 translate-x-0';
  } else if (position === 'left') {
    speechBubblePosClass = 'left-0 translate-x-0';
  }

  // Determine scale origin class so active state ring doesn't extend off screen
  let scaleOriginClass = 'origin-center';
  if (position === 'right') {
    scaleOriginClass = 'origin-right';
  } else if (position === 'left') {
    scaleOriginClass = 'origin-left';
  }

  const isFolded = player.isFolded;
  const isAllIn = player.isAllIn;

  return (
    <div className={`relative flex flex-col ${position === 'right' ? 'items-end' : position === 'left' ? 'items-start' : 'items-center'} select-none max-w-full`}>
      
      {/* Seat Container */}
      <div
        className={`flex flex-col items-center p-1 sm:p-1.5 rounded-2xl backdrop-blur-md border transition-all duration-300 ${
          isHuman ? 'w-[110px] sm:w-[135px]' : 'w-[82px] sm:w-[102px] flex-shrink-0'
        } ${scaleOriginClass} ${
          isFolded
            ? 'bg-slate-950/40 border-white/5 opacity-50 grayscale'
            : isActive
            ? 'bg-purple-600/35 border-purple-400 ring-2 ring-purple-400/90 scale-105 shadow-[0_0_20px_rgba(168,85,247,0.5)] z-30'
            : 'bg-slate-950/85 border-white/15 hover:border-white/30'
        } ${isWinner ? 'ring-2 ring-yellow-400 bg-amber-500/20 shadow-[0_0_25px_rgba(250,204,21,0.7)] z-30' : ''}`}
      >
        {/* Name & Role Badges & Chips */}
        <div className="flex items-center gap-1.5 w-full justify-between mb-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs sm:text-sm flex-shrink-0">{player.avatar}</span>
            <span className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[55px] sm:max-w-[70px]">
              {player.name}
            </span>
          </div>

          {/* Blind & Dealer Badges */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {isDealer && <span className="bg-red-500 text-white text-[7px] font-black px-1 rounded-sm shadow">D</span>}
            {isSB && <span className="bg-indigo-500 text-white text-[7px] font-black px-1 rounded-sm shadow">SB</span>}
            {isBB && <span className="bg-cyan-500 text-white text-[7px] font-black px-1 rounded-sm shadow">BB</span>}
          </div>
        </div>

        {/* Chips Count */}
        <div className="text-[9px] sm:text-[10px] font-mono font-bold text-purple-300 bg-purple-950/80 border border-purple-500/30 px-1.5 py-0.5 rounded-full w-full text-center truncate mb-1">
          💰 {player.chips}
        </div>

        {/* Hole Cards */}
        <div className="flex -space-x-2 sm:-space-x-2.5 justify-center my-0.5 max-w-full">
          {player.cards.length === 0 ? (
            <div className="w-12 h-9 border border-dashed border-white/15 rounded-lg flex items-center justify-center text-[8px] text-slate-500 font-mono">
              WAIT
            </div>
          ) : (
            player.cards.map((card, cIdx) => (
              <PlayingCard
                key={cIdx}
                card={card}
                isFaceUp={isHuman || round === 'Showdown'}
                size={isHuman ? 'md' : 'sm'}
                isHighlighted={isWinner}
              />
            ))
          )}
        </div>

        {/* Current Bet Badge */}
        {player.currentBet > 0 && (
          <div className="mt-1 flex items-center gap-1 bg-black/90 border border-purple-400/40 px-2 py-0.5 rounded-full shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-purple-200 whitespace-nowrap">
              注: {player.currentBet}
            </span>
          </div>
        )}

        {/* Action Status Tag */}
        {player.lastAction && (
          <div className={`text-[8px] sm:text-[9px] text-center font-bold px-1.5 py-0.5 rounded-md mt-1 w-full truncate border shadow-sm ${
            isAllIn
              ? 'bg-amber-500/80 text-white border-amber-300 font-black animate-pulse'
              : isFolded
              ? 'bg-slate-800 text-slate-400 border-slate-700'
              : 'bg-purple-900/80 text-purple-100 border-purple-500/40'
          }`}>
            {player.lastAction}
          </div>
        )}

      </div>
    </div>
  );
};
