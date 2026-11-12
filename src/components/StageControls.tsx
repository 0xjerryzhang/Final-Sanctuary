/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ConcertSong, StageLightMode } from '../types';
import { Sparkles, Wand2, Zap } from 'lucide-react';

export const JJ_SONGS: ConcertSong[] = [
  {
    id: 'jiangnan',
    title: '江南',
    album: '第二天堂 (2004)',
    duration: '04:15',
    lyrics: [],
  },
];

interface FloatingStageBarProps {
  currentSong?: ConcertSong;
  setCurrentSong?: (song: ConcertSong) => void;
  lightMode: StageLightMode;
  setLightMode: (mode: StageLightMode) => void;
  onTriggerLaserShow: () => void;
  onTriggerAudienceSing: () => void;
  onTriggerEncore: () => void;
  onOpenRules?: () => void;
}

export const FloatingStageBar: React.FC<FloatingStageBarProps> = ({
  lightMode,
  setLightMode,
  onTriggerLaserShow,
  onTriggerAudienceSing,
  onTriggerEncore,
}) => {
  return (
    <div className="w-full flex flex-col gap-2.5 bg-slate-900/90 border border-slate-700/60 p-3 rounded-2xl">
      {/* Stage Light Mode Selector */}
      <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold whitespace-nowrap">
        {[
          { id: 'purple' as StageLightMode, label: '紫海主题', color: 'border-purple-400 text-purple-200 bg-purple-950/70' },
          { id: 'blue' as StageLightMode, label: '冰蓝主题', color: 'border-cyan-400 text-cyan-200 bg-cyan-950/70' },
          { id: 'red' as StageLightMode, label: '曜金主题', color: 'border-amber-400 text-amber-200 bg-amber-950/70' },
          { id: 'rainbow' as StageLightMode, label: '翡翠主题', color: 'border-emerald-400 text-emerald-200 bg-emerald-950/70' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setLightMode(item.id)}
            className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
              lightMode === item.id ? item.color : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Stage FX Triggers */}
      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold whitespace-nowrap">
        <button
          onClick={onTriggerLaserShow}
          className="py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5 shrink-0" />
          <span>激光灯效</span>
        </button>
        <button
          onClick={onTriggerAudienceSing}
          className="py-1.5 rounded-lg bg-fuchsia-950/70 hover:bg-fuchsia-900 border border-fuchsia-500/40 text-fuchsia-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>星海灯效</span>
        </button>
        <button
          onClick={onTriggerEncore}
          className="py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>聚光灯效</span>
        </button>
      </div>
    </div>
  );
};
