/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Card, Suit } from '../types';
import { Music, Zap, Guitar, Disc, Sparkles } from 'lucide-react';

interface PlayingCardProps {
  card?: Card; // if undefined, represents card back
  isFaceUp?: boolean;
  isHighlighted?: boolean;
  isGlowing?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isFaceUp = true,
  isHighlighted = false,
  isGlowing = false,
  size = 'md',
  className = '',
}) => {
  const getSuitSymbol = (suit: Suit) => {
    switch (suit) {
      case 'H': return '♥';
      case 'D': return '♦';
      case 'C': return '♣';
      case 'S': return '♠';
    }
  };

  const getCardValueLabel = (value: number) => {
    if (value <= 10) return value.toString();
    switch (value) {
      case 11: return 'J';
      case 12: return 'Q';
      case 13: return 'K';
      case 14: return 'A';
      default: return '';
    }
  };

  const getSuitColor = (suit: Suit) => {
    return suit === 'H' || suit === 'D' 
      ? 'text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]' 
      : 'text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]';
  };

  // Size specific layout styles
  const sizeConfig = {
    xs: {
      box: 'w-5 sm:w-6 h-8 sm:h-9 rounded p-0.5',
      topVal: 'text-[8px] sm:text-[9px] font-black',
      topSuit: 'text-[7px] sm:text-[8px]',
      centerSuit: 'text-[9px] sm:text-[10px]',
      centerIcon: 'w-2 h-2',
      showCenterIllustration: false,
    },
    sm: {
      box: 'w-7 sm:w-9 h-11 sm:h-13 rounded-md p-0.5 sm:p-1',
      topVal: 'text-[9px] sm:text-xs font-black',
      topSuit: 'text-[8px] sm:text-[10px]',
      centerSuit: 'text-xs sm:text-sm',
      centerIcon: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
      showCenterIllustration: false,
    },
    md: {
      box: 'w-9 sm:w-11 h-13 sm:h-16 rounded-md sm:rounded-lg p-1 sm:p-1.5',
      topVal: 'text-[10px] sm:text-xs font-black',
      topSuit: 'text-[8px] sm:text-[10px]',
      centerSuit: 'text-xs sm:text-base',
      centerIcon: 'w-3 h-3 sm:w-4 sm:h-4',
      showCenterIllustration: true,
    },
    lg: {
      box: 'w-14 sm:w-16 h-20 sm:h-22 rounded-xl p-1.5 sm:p-2',
      topVal: 'text-xs sm:text-sm font-black',
      topSuit: 'text-[10px] sm:text-xs',
      centerSuit: 'text-xl sm:text-2xl',
      centerIcon: 'w-5 h-5 sm:w-6 sm:h-6',
      showCenterIllustration: true,
    },
    xl: {
      box: 'w-18 sm:w-20 h-25 sm:h-28 rounded-2xl p-2 sm:p-2.5',
      topVal: 'text-sm sm:text-base font-black',
      topSuit: 'text-xs sm:text-sm',
      centerSuit: 'text-2xl sm:text-3xl',
      centerIcon: 'w-7 h-7 sm:w-8 sm:h-8',
      showCenterIllustration: true,
    },
    '2xl': {
      box: 'w-24 sm:w-32 h-34 sm:h-46 rounded-2xl p-2 sm:p-3 shadow-2xl',
      topVal: 'text-base sm:text-2xl font-black',
      topSuit: 'text-xs sm:text-lg',
      centerSuit: 'text-3xl sm:text-5xl',
      centerIcon: 'w-8 h-8 sm:w-12 sm:h-12',
      showCenterIllustration: true,
    },
  };

  const cfg = sizeConfig[size];

  if (!isFaceUp || !card) {
    // Card Back Design (JJ Lin Sanctuary / Concert World Tour theme)
    return (
      <motion.div
        layout
        whileHover={{ y: -3, scale: 1.05 }}
        className={`relative ${cfg.box} select-none cursor-pointer flex-shrink-0 border overflow-hidden shadow-xl transition-all duration-300 ${className}
          bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 border-amber-400/70 shadow-[0_0_15px_rgba(245,158,11,0.3)] backdrop-blur-md`}
        id="card-back"
      >
        {/* Cyber laser glow background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.3),transparent_75%)]" />
        <div className="absolute w-[180%] h-[1.5px] bg-amber-400/70 rotate-[35deg] -top-1/4 -left-1/2 blur-[0.5px]" />
        <div className="absolute w-[180%] h-[1.5px] bg-fuchsia-500/70 -rotate-[35deg] -bottom-1/4 -left-1/2 blur-[0.5px]" />

        {/* Outer Gold Ornamental Border */}
        <div className="absolute inset-0.5 border-2 border-amber-500/50 rounded-sm sm:rounded-md flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-0.5">
          <div className="w-full h-full border border-fuchsia-400/40 rounded flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-purple-950/60 via-slate-950 to-purple-950/60">
            {/* Top Corner Mini Emblem */}
            <span className="absolute top-0.5 left-1 text-[6px] sm:text-[7px] font-black font-mono text-amber-300">F</span>
            <span className="absolute bottom-0.5 right-1 text-[6px] sm:text-[7px] font-black font-mono text-fuchsia-300">S</span>

            <Disc className={`${cfg.centerIcon} text-amber-300 animate-spin-slow drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]`} />
            <span className="font-mono text-[7px] sm:text-[9px] font-black text-amber-200 tracking-wider leading-none mt-0.5 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]">
              SANCTUARY
            </span>
            <span className="text-[5px] sm:text-[6px] font-bold text-fuchsia-300/90 tracking-widest uppercase">
              林俊杰 · 圣所
            </span>
          </div>
        </div>

        {/* Gloss overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/20 pointer-events-none" />
      </motion.div>
    );
  }

  // Card Front Design
  const suit = card.suit;
  const valLabel = getCardValueLabel(card.value);
  const colorClass = getSuitColor(suit);

  const renderCenterIllustration = () => {
    if (!cfg.showCenterIllustration) return null;
    switch (suit) {
      case 'S':
        return <Guitar className={`${cfg.centerIcon} text-cyan-400/20 stroke-[1.2]`} />;
      case 'H':
        return <Music className={`${cfg.centerIcon} text-rose-400/20 stroke-[1.2]`} />;
      case 'D':
        return <Disc className={`${cfg.centerIcon} text-rose-400/20 stroke-[1.2]`} />;
      case 'C':
        return <Zap className={`${cfg.centerIcon} text-cyan-400/20 stroke-[1.2]`} />;
    }
  };

  const hasGlow = isHighlighted || isGlowing;

  return (
    <motion.div
      layout
      whileHover={{ y: -3, scale: 1.05 }}
      className={`relative ${cfg.box} select-none cursor-default flex-shrink-0 border flex flex-col justify-between shadow-md transition-all duration-300 ${className}
        ${hasGlow 
          ? 'bg-purple-950/80 border-cyan-400/90 scale-105 card-glowing-stream z-20' 
          : 'bg-slate-900/90 border-white/25 hover:border-white/50 backdrop-blur-md'
        }`}
      id={`card-${suit}-${card.value}`}
    >
      {/* Top Left Value & Suit */}
      <div className="flex flex-col items-start leading-none z-10">
        <span className={`${cfg.topVal} ${colorClass} tracking-tighter`}>
          {valLabel}
        </span>
        <span className={`${cfg.topSuit} ${colorClass}`}>
          {getSuitSymbol(suit)}
        </span>
      </div>

      {/* Center Themed Illustration / Suit */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {renderCenterIllustration()}
        <span className={`${cfg.centerSuit} ${colorClass} opacity-90`}>
          {getSuitSymbol(suit)}
        </span>
      </div>

      {/* Bottom Right Reversed Value & Suit */}
      <div className="flex flex-col items-end leading-none rotate-180 z-10">
        <span className={`${cfg.topVal} ${colorClass} tracking-tighter`}>
          {valLabel}
        </span>
        <span className={`${cfg.topSuit} ${colorClass}`}>
          {getSuitSymbol(suit)}
        </span>
      </div>

      {/* Glossy sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
    </motion.div>
  );
};
