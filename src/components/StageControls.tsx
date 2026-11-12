/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ConcertSong, StageLightMode } from '../types';
import { Music, Play, Pause, SkipForward, Volume2, Sparkles, Wand2 } from 'lucide-react';

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
      '相信爱一天，抵过永远，在这一刹那冻结了时间',
    ],
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
    ],
  },
  {
    id: 'love',
    title: '修炼爱情',
    album: '因你而在 (2013)',
    duration: '04:47',
    lyrics: [
      '修炼爱情的心酸，学会放手后怎样度过难关',
      '向昨天单身告别，那料到那是最后的相见',
      '快乐或伤心，都有你陪伴，修炼爱情的悲欢',
    ],
  },
  {
    id: 'years',
    title: '一千年以后',
    album: '编号89757 (2005)',
    duration: '04:20',
    lyrics: [
      '心跳乱了节奏，梦也不自由',
      '爱是个绝对承诺，不说撑到最后',
      '一千年以后，世界早已无我',
    ],
  },
  {
    id: 'dream',
    title: '那些你很冒险的梦',
    album: '学不会 (2011)',
    duration: '04:05',
    lyrics: [
      '那些你很冒险的梦，我陪你去疯',
      '折纸飞机，碰到雨天，终究会坠落',
    ],
  },
];

interface FloatingStageBarProps {
  currentSong: ConcertSong;
  setCurrentSong: (song: ConcertSong) => void;
  lightMode: StageLightMode;
  setLightMode: (mode: StageLightMode) => void;
  onTriggerLaserShow: () => void;
  onTriggerAudienceSing: () => void;
  onTriggerEncore: () => void;
  onOpenRules?: () => void;
}

export const FloatingStageBar: React.FC<FloatingStageBarProps> = ({
  currentSong,
  setCurrentSong,
  lightMode,
  setLightMode,
  onTriggerLaserShow,
  onTriggerAudienceSing,
  onTriggerEncore,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);

  const handleNextSong = () => {
    const currentIndex = JJ_SONGS.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % JJ_SONGS.length;
    setCurrentSong(JJ_SONGS[nextIndex]);
  };

  return (
    <div className="w-full flex flex-col gap-2.5 bg-slate-900/90 border border-purple-500/30 p-3 rounded-2xl">
      {/* Track Control Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
          </button>
          <div className="min-w-0">
            <div className="text-xs font-black text-white truncate whitespace-nowrap flex items-center gap-1">
              <Music className="w-3 h-3 text-purple-400 shrink-0" />
              <span>《{currentSong.title}》</span>
            </div>
            <div className="text-[10px] font-mono text-purple-300/80 truncate whitespace-nowrap">
              {currentSong.album}
            </div>
          </div>
        </div>

        <button
          onClick={handleNextSong}
          className="px-2.5 py-1 rounded-xl bg-purple-950 border border-purple-500/40 hover:border-purple-300 text-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>切歌</span>
          <SkipForward className="w-3 h-3" />
        </button>
      </div>

      {/* Stage Light Mode Selector */}
      <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold whitespace-nowrap">
        {[
          { id: 'purple' as StageLightMode, label: '紫海', color: 'border-purple-400 text-purple-200 bg-purple-950/70' },
          { id: 'blue' as StageLightMode, label: '江南', color: 'border-cyan-400 text-cyan-200 bg-cyan-950/70' },
          { id: 'red' as StageLightMode, label: '烈焰', color: 'border-amber-400 text-amber-200 bg-amber-950/70' },
          { id: 'rainbow' as StageLightMode, label: '霓虹', color: 'border-pink-400 text-pink-200 bg-pink-950/70' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setLightMode(item.id)}
            className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
              lightMode === item.id ? item.color : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Stage FX Triggers */}
      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold whitespace-nowrap">
        <button
          onClick={onTriggerLaserShow}
          className="py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Wand2 className="w-3 h-3 shrink-0" />
          <span>激光</span>
        </button>
        <button
          onClick={onTriggerAudienceSing}
          className="py-1.5 rounded-lg bg-fuchsia-950/70 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-fuchsia-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>星海</span>
        </button>
        <button
          onClick={onTriggerEncore}
          className="py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Volume2 className="w-3 h-3 shrink-0" />
          <span>安可</span>
        </button>
      </div>
    </div>
  );
};
