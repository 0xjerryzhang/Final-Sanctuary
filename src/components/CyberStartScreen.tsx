/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Disc,
  Music,
  Zap,
  Shield,
  Volume2,
  VolumeX,
  Radio,
  Cpu,
  Trophy,
  Flame,
  ChevronRight,
  Bot,
  User,
  Mail,
  Sparkles,
  Layers,
  HelpCircle,
  Globe,
  Disc3,
  Calendar,
  Coins,
  Swords,
  GraduationCap,
  BookOpen,
  Gift,
  AlertTriangle,
  Ban,
  ShieldCheck,
  ShieldAlert,
  X,
} from 'lucide-react';
import { ConcertSong } from '../types';
import { JJ_SONGS } from './StageControls';
import { JJ_ALBUM_STAGES, AlbumStage } from '../data/albumStages';
import { PokerAcademy } from './PokerAcademy';
import { MatchmakingLobbyModal } from './MatchmakingLobbyModal';
import { UserProfileModal } from './UserProfileModal';
import { wsService } from '../services/websocket';

interface CyberStartScreenProps {
  onStartGame: (stage: AlbumStage) => void;
  currentSong: ConcertSong;
  setCurrentSong: (song: ConcertSong) => void;
}

export const CyberStartScreen: React.FC<CyberStartScreenProps> = ({
  onStartGame,
  currentSong,
  setCurrentSong,
}) => {
  const [selectedStage, setSelectedStage] = useState<AlbumStage>(JJ_ALBUM_STAGES[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  const [mainCategory, setMainCategory] = useState<'battle' | 'academy'>('battle');
  const [audioBars, setAudioBars] = useState<number[]>([40, 75, 25, 90, 60, 85, 30, 95, 50, 70, 45, 80]);
  
  // Real-time Matchmaking Lobby State
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAntiGamblingModalOpen, setIsAntiGamblingModalOpen] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState(1);

  useEffect(() => {
    wsService.connect();
    const unsub = wsService.subscribe((event) => {
      if (event.type === 'STATS_UPDATE' && event.data) {
        setOnlinePlayers(event.data.onlinePlayers || 1);
      }
    });
    return () => unsub();
  }, []);

  // Dynamic cyber equalizer effect
  useEffect(() => {
    if (!isPlayingAudio) return;
    const interval = setInterval(() => {
      setAudioBars(Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 15));
    }, 150);
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  return (
    <div className="w-full h-full bg-[#0a021a] text-white font-sans relative overflow-hidden flex flex-col justify-between items-center select-none p-3 sm:p-6 no-scrollbar touch-none">
      {/* 1. CYBER BACKGROUND GRID & PURPLE NEON LIGHTING */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2a084f,#0a021a,#03000a)] pointer-events-none" />
      
      {/* Cyber Grid Lines */}
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

      {/* Cyber Beam Flares */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-[500px] h-[250px] bg-fuchsia-600/15 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40 pointer-events-none z-10" />

      {/* 2. TOP HUD HEADER BAR */}
      <div className="w-full max-w-5xl flex items-center justify-between z-20 pt-1 pb-2 border-b border-purple-500/40 flex-shrink-0">
        {/* Left HUD Label */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-400 animate-ping" />
          <span className="text-xs font-mono font-black tracking-widest text-purple-300 uppercase drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
            Final Sanctuary
          </span>
        </div>

        {/* Center Live Equalizer */}
        <div className="hidden sm:flex items-center gap-1 bg-black/60 border border-purple-500/40 px-3 py-1 rounded-full backdrop-blur-md">
          <Radio className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse mr-1" />
          <div className="flex items-end gap-0.5 h-4">
            {audioBars.map((height, i) => (
              <span
                key={i}
                className="w-1 bg-gradient-to-t from-purple-500 to-fuchsia-400 rounded-t transition-all duration-150"
                style={{ height: `${isPlayingAudio ? height : 15}%` }}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-purple-200 ml-1.5 font-bold">
            {currentSong.title}
          </span>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Daily Sign-In Button */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-900/60 to-fuchsia-950/80 border border-amber-500/50 hover:border-amber-400 text-amber-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="hidden xs:inline">每日签到</span>
            <span className="text-[9px] bg-amber-500 text-black px-1 rounded font-black">+3270</span>
          </button>

          {/* User Profile / My Center Button */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50 hover:border-fuchsia-400 text-purple-200 hover:text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center"
            title="个人中心"
          >
            <User className="w-3.5 h-3.5 text-amber-300" />
          </button>

          {/* Green Gaming (No Recharge) Badge */}
          <button
            onClick={() => setIsAntiGamblingModalOpen(true)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold text-[10px] hover:bg-rose-900 transition-all cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            <span>绿色游戏 (暂无充值)</span>
          </button>

          {/* Online Players Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 bg-purple-950/80 border border-purple-500/40 px-2.5 py-1.5 rounded-xl text-[10px] font-mono text-purple-200">
            <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>全服在线: <strong className="text-amber-300">{onlinePlayers}</strong>人</span>
          </div>

          <button
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className="p-1.5 rounded-lg bg-purple-950 border border-purple-500/40 hover:border-purple-300 text-purple-300 transition-all cursor-pointer"
            title={isPlayingAudio ? '静音' : '开启音效'}
          >
            {isPlayingAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* 3. CENTER HERO LAUNCHER CARD */}
      <div className="w-full max-w-5xl my-auto z-30 flex flex-col items-center justify-center gap-5 py-4">
        
        {/* Main Category Pillars */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 bg-slate-950/95 border-2 border-purple-500/60 p-2 rounded-2xl backdrop-blur-xl shadow-[0_0_35px_rgba(168,85,247,0.4)]">
          <button
            onClick={() => setMainCategory('battle')}
            className={`px-6 sm:px-8 py-3 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center gap-2.5 ${
              mainCategory === 'battle'
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.9)] scale-105 border border-purple-300'
                : 'text-purple-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Swords className="w-5 h-5 text-amber-300" />
            <div className="flex flex-col items-start text-left">
              <span className="leading-none text-sm sm:text-base font-black">巡演实战</span>
              <span className="text-[9px] font-mono font-normal opacity-80 mt-0.5">15大专辑巡演竞技</span>
            </div>
          </button>

          <div className="h-8 w-[1px] bg-purple-500/40"></div>

          <button
            onClick={() => setMainCategory('academy')}
            className={`px-6 sm:px-8 py-3 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center gap-2.5 ${
              mainCategory === 'academy'
                ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(232,121,249,0.9)] scale-105 border border-fuchsia-300'
                : 'text-purple-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-5 h-5 text-fuchsia-300" />
            <div className="flex flex-col items-start text-left">
              <span className="leading-none text-sm sm:text-base font-black">德州教学</span>
              <span className="text-[9px] font-mono font-normal opacity-80 mt-0.5">德州规则与JJ秘籍</span>
            </div>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="w-full max-w-5xl min-h-[300px]">
          {mainCategory === 'academy' && <PokerAcademy />}

          {mainCategory === 'battle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto allow-scroll pr-1 no-scrollbar p-1"
            >
              {JJ_ALBUM_STAGES.map((stage) => {
                const isSelected = selectedStage.id === stage.id;
                return (
                  <div
                    key={stage.id}
                    onClick={() => setSelectedStage(stage)}
                    onDoubleClick={() => onStartGame(stage)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden backdrop-blur-xl flex flex-col justify-between ${
                      isSelected
                        ? `bg-gradient-to-b ${stage.themeGradient} ${stage.borderColor} ${stage.borderGlow} scale-[1.02]`
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Year & Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{stage.icon}</span>
                          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${stage.badgeColor}`}>
                            {stage.badgeText}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[9px] font-mono font-black text-fuchsia-300 bg-purple-950/90 border border-fuchsia-400 px-2 py-0.5 rounded-full uppercase animate-pulse">
                            SELECTED
                          </span>
                        )}
                      </div>

                      {/* Album Title & Subtitle */}
                      <h3 className="font-black text-sm text-white mb-0.5 flex items-center gap-1">
                        <span>{stage.name}</span>
                      </h3>
                      <p className={`text-[10px] font-mono font-bold ${stage.textColor} mb-2`}>
                        {stage.subtitle}
                      </p>

                      {/* Album Description */}
                      <p className="text-[11px] text-purple-200/90 leading-relaxed mb-3 line-clamp-2">
                        {stage.description}
                      </p>
                    </div>

                    <div>
                      {/* Blinds and Initial Chips */}
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold bg-black/50 border border-purple-500/30 px-2.5 py-1.5 rounded-xl mb-2.5">
                        <div className="flex items-center gap-1 text-purple-200">
                          <Coins className="w-3 h-3 text-amber-400" />
                          <span>盲注: <strong className="text-white">{stage.smallBlind}/{stage.bigBlind}</strong></span>
                        </div>
                        <div className="text-fuchsia-300">
                          带入: <strong className="text-white">{stage.startChips.toLocaleString()}</strong>
                        </div>
                      </div>

                      {/* Integrated Action Buttons: Real-time Online Match vs AI Practice */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Real-time Matchmaking for this stage */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStage(stage);
                            setIsLobbyOpen(true);
                          }}
                          className="py-2 px-2 rounded-xl font-black text-xs bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-500 hover:brightness-110 active:scale-95 text-white shadow-[0_0_15px_rgba(168,85,247,0.7)] transition-all cursor-pointer flex items-center justify-center gap-1"
                          title={`进入 ${stage.name} 真人匹配大厅`}
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span>真人匹配</span>
                        </button>

                        {/* Single Player Practice for this stage */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartGame(stage);
                          }}
                          className="py-2 px-2 rounded-xl font-black text-xs bg-purple-950/90 border border-purple-600/70 hover:border-fuchsia-400 text-purple-200 hover:text-white active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                          title={`开启 ${stage.name} 单人练习`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current shrink-0 text-purple-300" />
                          <span>单人练习</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>



      </div>

      {/* 4. BOTTOM FOOTER HUD */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2 z-20 text-[10px] font-mono text-purple-300/80 border-t border-purple-500/30 pt-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>FAIR PLAY ENGINE: ENCRYPTED // NO-CHEAT VERIFIED</span>
        </div>
        <div>
          <span>JJ LIN CONCERT DISCOGRAPHY ARENA v2.0 // CYBERPOKER</span>
        </div>
      </div>

      {/* MATCHMAKING LOBBY MODAL */}
      <MatchmakingLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        defaultStage={selectedStage}
        onStartOnlineGame={(stage) => {
          setIsLobbyOpen(false);
          onStartGame(stage);
        }}
      />

      {/* USER PROFILE & LEADERBOARD MODAL */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* ANTI-GAMBLING & GREEN GAMING DISCLAIMER MODAL */}
      <AnimatePresence>
        {isAntiGamblingModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#0e0422] border-2 border-rose-500/60 rounded-3xl p-6 text-white shadow-[0_0_50px_rgba(225,29,72,0.4)] relative flex flex-col gap-4 overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsAntiGamblingModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-purple-950/80 hover:bg-rose-900 border border-purple-500/40 text-purple-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-rose-500/30 pb-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-7 h-7 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-rose-200">绿色健康游戏与反赌博公约</h3>
                  <p className="text-xs text-rose-300/80 font-mono">林俊杰音乐巡演主题竞技 // 纯属交流娱乐</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-xs text-purple-200 leading-relaxed font-sans max-h-[320px] overflow-y-auto pr-1">
                <div className="p-3 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex items-start gap-2.5">
                  <Gift className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-200 font-bold block text-sm">一、 虚拟积分与奖励说明</strong>
                    <p className="mt-1 text-purple-300/90">
                      本应用内所有积分统一命名为<strong>【圣所音符】</strong>（Sanctuary Notes）。
                      <strong>注册即送 130,700 圣所音符</strong>，<strong>每日签到再送 3,270 圣所音符</strong>。音符仅用于体验德州扑克策略与歌迷试炼等玩法，不具备任何实际货币价值。
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/90 border border-rose-500/40 flex items-start gap-2.5">
                  <Ban className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-300 font-bold block text-sm">二、 严禁赌博与私下交易</strong>
                    <p className="mt-1 text-purple-300/90">
                      严禁任何利用本平台进行真实货币赌博、线下对冲、反向兑现或账号/积分私下买卖行为。一经查实将对相关账号执行封禁处理。
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/90 border border-purple-500/40 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-300 font-bold block text-sm">三、 暂不开放充值功能</strong>
                    <p className="mt-1 text-purple-300/90">
                      为保障绿色的文化娱乐氛围，本平台<strong>暂不开设任何形式的真实货币充值或购买入口</strong>。所有玩家均可通过每日登录与游戏胜场免费享受游戏乐趣！
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsAntiGamblingModalOpen(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-fuchsia-600 text-white font-black text-sm shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
              >
                我已知晓并遵守公约
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
