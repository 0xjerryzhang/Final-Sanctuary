/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlbumStage } from '../data/albumStages';

interface MetallicPokerChipProps {
  amount?: number | string;
  selectedStage?: AlbumStage;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isFloating?: boolean;
  className?: string;
  showStack?: boolean;
}

export const MetallicPokerChip: React.FC<MetallicPokerChipProps> = ({
  amount,
  selectedStage,
  size = 'md',
  isFloating = true,
  className = '',
  showStack = false,
}) => {
  // Determine Metallic Color Scheme based on Album Stage or Amount
  let metallicGradient = 'from-amber-600 via-yellow-200 to-amber-700';
  let innerRingBorder = 'border-amber-300/80';
  let textColor = 'text-amber-950';
  let shadowGlow = 'shadow-[0_0_12px_rgba(251,191,36,0.6)]';

  if (selectedStage) {
    const stageId = selectedStage.id;
    if (stageId.includes('music_voyager') || stageId.includes('haven_jiangnan')) {
      // Emerald Gold Metallic
      metallicGradient = 'from-emerald-700 via-teal-200 to-emerald-900';
      innerRingBorder = 'border-emerald-300';
      textColor = 'text-emerald-950';
      shadowGlow = 'shadow-[0_0_12px_rgba(52,211,153,0.6)]';
    } else if (stageId.includes('cao_cao') || stageId.includes('west_side')) {
      // Ruby Red Metallic
      metallicGradient = 'from-rose-700 via-amber-200 to-red-900';
      innerRingBorder = 'border-amber-300';
      textColor = 'text-amber-950';
      shadowGlow = 'shadow-[0_0_12px_rgba(244,63,94,0.6)]';
    } else if (stageId.includes('she_says') || stageId.includes('lost_n_found')) {
      // Silver Platinum Metallic
      metallicGradient = 'from-slate-400 via-slate-100 to-slate-600';
      innerRingBorder = 'border-slate-200';
      textColor = 'text-slate-950';
      shadowGlow = 'shadow-[0_0_12px_rgba(226,232,240,0.6)]';
    } else {
      // High-End Cyber Purple Gold Metallic
      metallicGradient = 'from-purple-700 via-fuchsia-200 to-indigo-900';
      innerRingBorder = 'border-fuchsia-300';
      textColor = 'text-purple-950';
      shadowGlow = 'shadow-[0_0_14px_rgba(168,85,247,0.7)]';
    }
  }

  // Size dimensions
  const sizeClasses = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-7 h-7 text-[9px]',
    md: 'w-9 h-9 text-[10px]',
    lg: 'w-11 h-11 text-xs',
  }[size];

  const chipContent = (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Optional Stack shadow underneath */}
      {showStack && (
        <>
          <div className={`absolute top-1 left-0.5 rounded-full ${sizeClasses} bg-slate-950/80 border border-amber-500/30 scale-95 opacity-60`} />
          <div className={`absolute top-0.5 left-0.25 rounded-full ${sizeClasses} bg-purple-950/80 border border-fuchsia-400/40 scale-98 opacity-80`} />
        </>
      )}

      {/* Main Metallic 3D Chip Body */}
      <div
        className={`relative rounded-full ${sizeClasses} bg-gradient-to-tr ${metallicGradient} border-2 border-white/80 shadow-lg ${shadowGlow} flex items-center justify-center p-0.5 select-none overflow-hidden transition-transform`}
      >
        {/* Outer Casino Precision Notch Rim Lines */}
        <div className="absolute inset-0.5 rounded-full border border-dashed border-black/30 pointer-events-none" />

        {/* Surface Metallic Light Sheen Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.7),transparent)] pointer-events-none" />

        {/* Center Metallic Coin Plate with Final Sanctuary Logo Engraving */}
        <div
          className={`w-full h-full rounded-full border ${innerRingBorder} bg-black/20 flex flex-col items-center justify-center leading-none text-center backdrop-blur-[1px] relative z-10`}
        >
          {/* Final Sanctuary Stamped Logo Engraving */}
          <span className={`text-[6px] font-black font-mono tracking-tighter ${textColor} drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]`}>
            SANCTUARY
          </span>

          {/* Amount Badge if provided */}
          {amount !== undefined && (
            <span className={`text-[7px] font-extrabold ${textColor} -mt-0.5 leading-none`}>
              {amount}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (!isFloating) {
    return chipContent;
  }

  // Micro-floating Levitation Motion Wrapper
  return (
    <motion.div
      animate={{
        y: [0, -3.5, 0],
        rotate: [0, 1.5, 0, -1.5, 0],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="inline-block"
    >
      {chipContent}
    </motion.div>
  );
};
