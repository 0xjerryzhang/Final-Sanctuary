/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Shield,
  User,
  Globe,
  Home,
  Calendar,
  Coins,
  Swords,
  GraduationCap,
  Gift,
  Ban,
  ShieldCheck,
  ShieldAlert,
  X,
} from 'lucide-react';
import { ConcertSong } from '../types';
import { JJ_ALBUM_STAGES, AlbumStage, formatCompactChips } from '../data/albumStages';
import { PokerAcademy } from './PokerAcademy';
import { MatchmakingLobbyModal } from './MatchmakingLobbyModal';
import { UserProfileModal } from './UserProfileModal';
import { wsService } from '../services/websocket';

interface CyberStartScreenProps {
  onStartGame: (stage: AlbumStage, isOnline?: boolean, roomData?: any) => void;
  currentSong?: ConcertSong;
  setCurrentSong?: (song: ConcertSong) => void;
  /** Incremented by App after a successful OAuth login; opens the profile once. */
  profileOpenRequest?: number;
  /** Called after the open request is handled, so it does not fire again. */
  onProfileOpenRequestHandled?: () => void;
}

export const CyberStartScreen: React.FC<CyberStartScreenProps> = ({
  onStartGame,
  profileOpenRequest = 0,
  onProfileOpenRequestHandled,
}) => {
  const [selectedStage, setSelectedStage] = useState<AlbumStage>(JJ_ALBUM_STAGES[0]);
  const [mainCategory, setMainCategory] = useState<'battle' | 'academy'>('battle');

  // Real-time Matchmaking Lobby State
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAntiGamblingModalOpen, setIsAntiGamblingModalOpen] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState(1);

  // 登录门禁：未注册/未登录时点“玩”先弹登录/注册，登录成功后自动继续进场
  const [pendingGame, setPendingGame] = useState<{ stage: AlbumStage; online: boolean } | null>(null);

  const isLoggedIn = () => {
    try {
      return !!localStorage.getItem('jj_user_email');
    } catch {
      return false;
    }
  };

  const resumePendingGame = () => {
    if (!pendingGame || !isLoggedIn()) {
      setPendingGame(null);
      return;
    }
    const { stage, online } = pendingGame;
    setPendingGame(null);
    if (online) {
      setIsLobbyOpen(true);
    } else {
      onStartGame(stage);
    }
  };

  const handlePlayClick = (stage: AlbumStage, online: boolean) => {
    setSelectedStage(stage);
    if (isLoggedIn()) {
      if (online) setIsLobbyOpen(true);
      else onStartGame(stage);
      return;
    }
    setPendingGame({ stage, online });
    setIsProfileOpen(true);
  };

  const handleProfileClose = () => {
    setIsProfileOpen(false);
    resumePendingGame();
  };

  const handleLoginSuccess = () => {
    if (!pendingGame) return;
    setIsProfileOpen(false);
    resumePendingGame();
  };

  useEffect(() => {
    wsService.connect();
    const unsub = wsService.subscribe((event) => {
      if (event.type === 'STATS_UPDATE' && event.data) {
        setOnlinePlayers(event.data.onlinePlayers || 1);
      }
    });
    return () => unsub();
  }, []);

  // After an OAuth login (Google / Apple) completes, App asks the launcher
  // to open the profile (with the new Sui address). The request is a
  // counter so it fires once; it is cleared after handling so returning to
  // the launcher later does not reopen the profile.
  useEffect(() => {
    if (profileOpenRequest > 0) {
      setIsProfileOpen(true);
      onProfileOpenRequestHandled?.();
    }
  }, [profileOpenRequest]);

  return (
    <div className="w-full h-full bg-[#0a021a] text-white font-sans relative overflow-hidden flex flex-col justify-between items-center select-none p-3 sm:p-5 no-scrollbar">
      {/* 1. CYBER BACKGROUND GRID & PURPLE NEON LIGHTING */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2a084f,#0a021a,#03000a)] pointer-events-none" />

      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(168,85,247,0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168,85,247,0.18) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-[500px] h-[250px] bg-fuchsia-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40 pointer-events-none z-10" />

      {/* 2. TOP HUD HEADER BAR */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-2 z-20 pt-0.5 pb-2 border-b border-purple-500/40 shrink-0">
        {/* Left HUD Label */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <span className="text-xs sm:text-sm font-mono font-black tracking-wider text-purple-200 uppercase drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
            FINAL SANCTUARY
          </span>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <a
            href="https://0xsanctuary.xyz"
            className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50 hover:border-fuchsia-400 text-purple-200 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
            title="返回主页"
          >
            <Home className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>返回主页</span>
          </a>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-900/60 to-fuchsia-950/80 border border-amber-500/50 hover:border-amber-400 text-amber-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.25)] whitespace-nowrap shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>签到</span>
            <span className="text-[10px] bg-amber-500 text-black px-1 rounded font-black">+3.2K</span>
          </button>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50 hover:border-fuchsia-400 text-purple-200 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
            title="个人中心"
          >
            <User className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">个人中心</span>
          </button>

          <button
            onClick={() => setIsAntiGamblingModalOpen(true)}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold text-xs hover:bg-rose-900 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>绿色公约</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 bg-purple-950/80 border border-purple-500/40 px-2.5 py-1.5 rounded-xl text-xs font-mono text-purple-200 whitespace-nowrap shrink-0">
            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>在线 <strong className="text-amber-300">{onlinePlayers}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. CENTER HERO LAUNCHER CARD */}
      <div className="w-full max-w-5xl flex-1 min-h-0 z-30 flex flex-col items-center gap-3 py-2">
        {/* Main Category Switcher (Streamlined Single-Line Proportional Tabs) */}
        <div className="flex items-center justify-center gap-2 bg-slate-950/95 border border-purple-500/60 p-1.5 rounded-2xl backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.35)] shrink-0">
          <button
            onClick={() => setMainCategory('battle')}
            className={`px-5 sm:px-7 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              mainCategory === 'battle'
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.8)] border border-purple-300'
                : 'text-purple-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Swords className="w-4 h-4 text-amber-300 shrink-0" />
            <span>巡演实战 · 15专辑场</span>
          </button>

          <button
            onClick={() => setMainCategory('academy')}
            className={`px-5 sm:px-7 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              mainCategory === 'academy'
                ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(232,121,249,0.8)] border border-fuchsia-300'
                : 'text-purple-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-fuchsia-300 shrink-0" />
            <span>德州学院 · 牌型规则</span>
          </button>
        </div>

        {/* TAB CONTENTS (Dedicated block scroll wrapper so CSS Grid rows keep 100% natural height) */}
        <div className="w-full max-w-5xl flex-1 min-h-0 overflow-y-auto allow-scroll px-1 pb-3 no-scrollbar">
          {mainCategory === 'academy' && <PokerAcademy />}

          {mainCategory === 'battle' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max gap-3 py-1"
            >
              {JJ_ALBUM_STAGES.map((stage) => {
                const isSelected = selectedStage.id === stage.id;
                return (
                  <div
                    key={stage.id}
                    onClick={() => setSelectedStage(stage)}
                    onDoubleClick={() => handlePlayClick(stage, false)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative backdrop-blur-xl flex flex-col justify-between gap-2.5 shrink-0 ${
                      isSelected
                        ? `bg-gradient-to-b ${stage.themeGradient} ${stage.borderColor} ${stage.borderGlow}`
                        : 'bg-slate-950/75 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    {/* Row 1: Album Icon, Title & Year Badge */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{stage.icon}</span>
                        <div className="min-w-0">
                          <h3 className="font-black text-sm text-white truncate whitespace-nowrap leading-tight">
                            {stage.name}
                          </h3>
                          <p className={`text-[10px] font-mono font-bold ${stage.textColor} truncate whitespace-nowrap leading-tight mt-0.5`}>
                            {stage.subtitle}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${stage.badgeColor}`}>
                        {stage.badgeText}
                      </span>
                    </div>

                    {/* Row 2: Blinds & Buy-In Bar (No Wrapping) */}
                    <div className="flex items-center justify-between gap-2 text-xs font-mono font-bold bg-black/60 border border-purple-500/30 px-3 py-1.5 rounded-xl whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-purple-200">
                        <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>盲注 <strong className="text-amber-300 font-black">{stage.blindLabel}</strong></span>
                      </div>
                      <div className="text-fuchsia-300">
                        带入 <strong className="text-white font-black">{formatCompactChips(stage.startChips)}</strong>
                      </div>
                    </div>

                    {/* Row 3: Action Buttons (Equal Width, Single Line) */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayClick(stage, true);
                        }}
                        className="py-2 px-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-500 hover:brightness-110 active:scale-95 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span>真人匹配</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayClick(stage, false);
                        }}
                        className="py-2 px-2.5 rounded-xl font-black text-xs bg-purple-950/90 border border-purple-600/70 hover:border-fuchsia-400 text-purple-200 hover:text-white active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5 fill-current shrink-0 text-purple-300" />
                        <span>单人练习</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM FOOTER HUD */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-2 z-20 text-[10px] font-mono text-purple-300/70 border-t border-purple-500/30 pt-1.5 shrink-0 whitespace-nowrap">
        <div className="flex items-center gap-1.5 truncate">
          <Shield className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
          <span className="truncate">FAIR PLAY ENGINE · SERVER AUTHORITATIVE</span>
        </div>
        <span className="hidden sm:inline shrink-0">JJ LIN 15 ALBUMS TOUR ARENA</span>
      </div>

      {/* MATCHMAKING LOBBY MODAL */}
      <MatchmakingLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        defaultStage={selectedStage}
        onStartOnlineGame={(stage, roomData) => {
          setIsLobbyOpen(false);
          onStartGame(stage, true, roomData);
        }}
      />

      {/* USER PROFILE MODAL */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={handleProfileClose}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* GREEN GAMING DISCLAIMER MODAL */}
      <AnimatePresence>
        {isAntiGamblingModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#0e0422] border-2 border-rose-500/60 rounded-3xl p-5 text-white shadow-[0_0_50px_rgba(225,29,72,0.4)] relative flex flex-col gap-3.5 overflow-hidden"
            >
              <button
                onClick={() => setIsAntiGamblingModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-purple-950/80 hover:bg-rose-900 border border-purple-500/40 text-purple-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-rose-500/30 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-rose-200 whitespace-nowrap">绿色游戏公约</h3>
                  <p className="text-[11px] text-rose-300/80 font-mono whitespace-nowrap">纯娱乐竞技 · 无充值变现</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 text-xs text-purple-200 leading-relaxed">
                <div className="p-3 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex items-center gap-2.5">
                  <Gift className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>注册赠 <strong>130.7K</strong> 圣所音符，每日签到领 <strong>3,270</strong> 音符。</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/90 border border-rose-500/40 flex items-center gap-2.5">
                  <Ban className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>严禁任何货币赌博、线下对冲或积分交易行为。</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/90 border border-purple-500/40 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>本平台不开放任何充值入口，仅供歌迷竞技交流。</span>
                </div>
              </div>

              <button
                onClick={() => setIsAntiGamblingModalOpen(false)}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-fuchsia-600 text-white font-black text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer whitespace-nowrap"
              >
                我已知晓
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
