/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ConcertSong, StageLightMode } from '../types';
import { Music, Play, Pause, SkipForward, Volume2, Sparkles, Wand2, Disc, Eye, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Hardcoded JJ Lin classic track data with lyrics
export const JJ_SONGS: ConcertSong[] = [
  {
    id: 'jiangnan',
    title: '江南',
    album: '第二天堂 (2004)',
    duration: '04:15',
    lyrics: [
      '风到这里就是粘，粘住过客的思念',
      '雨到了这里缠成线，缠着我们留恋人世间',
      '你在身边就是缘，缘分写在三生石上面',
      '爱恨两茫茫，问君何时归，谁在痴痴等',
      '相信爱一天，抵过永远，在这一刹那冻结了时间'
    ]
  },
  {
    id: 'caocao',
    title: '曹操',
    album: '曹操 (2006)',
    duration: '04:02',
    lyrics: [
      '东汉末年分三国，烽火连天不休',
      '儿女情长，被乱世左右，谁来煮酒',
      '尔虞我诈是三国，说不清对与错',
      '纷纷扰扰，千百年以后，一切又从头',
      '独自面对，这命运的锁，英雄有何求'
    ]
  },
  {
    id: 'love',
    title: '修炼爱情',
    album: '因你而在 (2013)',
    duration: '04:47',
    lyrics: [
      '修炼爱情的心酸，学会放手后怎样度过难关',
      '向昨天单身告别，那料到那是最后的相见',
      '我们曾相爱，想到就心酸，那些记忆不肯轻易消散',
      '快乐或伤心，都有你陪伴，修炼爱情的悲欢'
    ]
  },
  {
    id: 'years',
    title: '一千年以后',
    album: '编号89757 (2005)',
    duration: '04:20',
    lyrics: [
      '心跳乱了节奏，梦也不自由',
      '爱是个绝对承诺，不说撑到最后',
      '放任寂寞，染红天空，无法承受',
      '一千年以后，世界早已无我',
      '无法深情挽着你的手，浅吻着你的额头'
    ]
  },
  {
    id: 'dream',
    title: '那些你很冒险的梦',
    album: '学不会 (2011)',
    duration: '04:05',
    lyrics: [
      '那些你很冒险的梦，我陪你去疯',
      '折纸飞机，碰到雨天，终究会坠落',
      '太多的伤口，怎么到最后，你却孤单单地',
      '一个人执着，在记忆里摸索，谁来温暖这寂寞'
    ]
  }
];

interface FloatingStageBarProps {
  currentSong: ConcertSong;
  setCurrentSong: (song: ConcertSong) => void;
  lightMode: StageLightMode;
  setLightMode: (mode: StageLightMode) => void;
  onTriggerLaserShow: () => void;
  onTriggerAudienceSing: () => void;
  onTriggerEncore: () => void;
  onOpenRules: () => void;
}

export const FloatingStageBar: React.FC<FloatingStageBarProps> = ({
  currentSong,
  setCurrentSong,
  lightMode,
  setLightMode,
  onTriggerLaserShow,
  onTriggerAudienceSing,
  onTriggerEncore,
  onOpenRules,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [lyricIndex, setLyricIndex] = useState(0);
  const [showLightMenu, setShowLightMenu] = useState(false);

  // Automatically cycle lyrics
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setLyricIndex((prev) => (prev + 1) % currentSong.lyrics.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [currentSong, isPlaying]);

  useEffect(() => {
    setLyricIndex(0);
  }, [currentSong]);

  const handleNextSong = () => {
    const currentIndex = JJ_SONGS.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % JJ_SONGS.length;
    setCurrentSong(JJ_SONGS[nextIndex]);
  };

  return (
    <div className="absolute top-1.5 left-2 right-2 z-40 flex items-center justify-between pointer-events-auto gap-2">
      
      {/* LEFT: Final Sanctuary Logo & Live Lyrics Ticker */}
      <div className="flex items-center gap-1.5 bg-slate-950/85 border border-purple-500/40 px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg max-w-[45%] sm:max-w-[55%] truncate">
        <Disc className="w-3.5 h-3.5 text-purple-400 animate-spin-slow flex-shrink-0" />
        <span className="text-[9px] sm:text-[11px] font-black text-purple-300 font-mono flex-shrink-0">
          Final Sanctuary
        </span>
        <span className="text-purple-500/40 text-xs flex-shrink-0">|</span>
        
        {/* Dynamic Lyric line */}
        <AnimatePresence mode="wait">
          <motion.span
            key={`${currentSong.id}-${lyricIndex}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-[9.5px] sm:text-xs text-white font-medium truncate italic text-shadow-glow"
          >
            " {currentSong.lyrics[lyricIndex]} "
          </motion.span>
        </AnimatePresence>
      </div>

      {/* RIGHT: Music, FX, Cheat, Rules & Light Presets */}
      <div className="flex items-center gap-1 bg-slate-950/85 border border-white/20 p-1 rounded-full backdrop-blur-md shadow-lg">
        
        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all cursor-pointer"
          title={isPlaying ? '暂停音乐' : '播放音乐'}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-white ml-0.5" />}
        </button>

        {/* Current Song Title & Skip */}
        <button
          onClick={handleNextSong}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 border border-white/10 transition-all cursor-pointer"
          title="点击切换歌曲"
        >
          <Music className="w-3 h-3 text-purple-400" />
          <span className="text-[10px] sm:text-[11px] max-w-[60px] sm:max-w-[100px] truncate">
            {currentSong.title}
          </span>
          <SkipForward className="w-2.5 h-2.5 text-slate-400" />
        </button>

        {/* Poker Rules Modal Button (规则) */}
        <button
          onClick={onOpenRules}
          className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title="德州扑克规则"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Concert FX Triggers */}
        <div className="hidden md:flex items-center gap-0.5 pl-1 border-l border-white/10">
          <button
            onClick={onTriggerLaserShow}
            className="p-1 rounded-full hover:bg-indigo-500/20 text-indigo-300 transition-all cursor-pointer"
            title="触发全场激光"
          >
            <Wand2 className="w-3 h-3" />
          </button>
          <button
            onClick={onTriggerAudienceSing}
            className="p-1 rounded-full hover:bg-fuchsia-500/20 text-fuchsia-300 transition-all cursor-pointer"
            title="触发紫海合唱"
          >
            <Sparkles className="w-3 h-3" />
          </button>
          <button
            onClick={onTriggerEncore}
            className="p-1 rounded-full hover:bg-amber-500/20 text-amber-300 transition-all cursor-pointer"
            title="触发 Encore 安可"
          >
            <Volume2 className="w-3 h-3" />
          </button>
        </div>

        {/* Lighting preset dropdown toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLightMenu(!showLightMenu)}
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              lightMode === 'purple' ? 'bg-purple-900/60 border-purple-400 text-purple-300' :
              lightMode === 'blue' ? 'bg-cyan-900/60 border-cyan-400 text-cyan-300' :
              lightMode === 'red' ? 'bg-amber-900/60 border-amber-400 text-amber-300' :
              'bg-pink-900/60 border-pink-400 text-pink-300'
            }`}
            title="切换舞美灯光色调"
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          </button>

          {/* Light selector menu */}
          <AnimatePresence>
            {showLightMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="absolute right-0 top-8 bg-slate-900/95 border border-purple-500/40 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-28 z-50 text-left font-sans text-xs"
              >
                <div className="text-[8px] font-mono font-bold text-slate-400 px-1 py-0.5 uppercase">
                  舞美灯光
                </div>
                <button
                  onClick={() => { setLightMode('purple'); setShowLightMenu(false); }}
                  className={`px-2 py-1 rounded text-left flex items-center gap-1.5 cursor-pointer text-[11px] ${lightMode === 'purple' ? 'bg-purple-600/30 text-purple-200 font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> 紫海巡演
                </button>
                <button
                  onClick={() => { setLightMode('blue'); setShowLightMenu(false); }}
                  className={`px-2 py-1 rounded text-left flex items-center gap-1.5 cursor-pointer text-[11px] ${lightMode === 'blue' ? 'bg-cyan-600/30 text-cyan-200 font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> 江南国风
                </button>
                <button
                  onClick={() => { setLightMode('red'); setShowLightMenu(false); }}
                  className={`px-2 py-1 rounded text-left flex items-center gap-1.5 cursor-pointer text-[11px] ${lightMode === 'red' ? 'bg-amber-600/30 text-amber-200 font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 曹操烈焰
                </button>
                <button
                  onClick={() => { setLightMode('rainbow'); setShowLightMenu(false); }}
                  className={`px-2 py-1 rounded text-left flex items-center gap-1.5 cursor-pointer text-[11px] ${lightMode === 'rainbow' ? 'bg-pink-600/30 text-pink-200 font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> 终点霓虹
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
