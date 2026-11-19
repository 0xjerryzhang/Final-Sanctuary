/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Card, Suit } from '../types';
import { Disc } from 'lucide-react';

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
      case 'H':
        return '♥';
      case 'D':
        return '♦';
      case 'C':
        return '♣';
      case 'S':
        return '♠';
    }
  };

  const getCardValueLabel = (value: number) => {
    if (value <= 10) return value.toString();
    switch (value) {
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      case 14:
        return 'A';
      default:
        return '';
    }
  };

  const isRedSuit = (suit: Suit) => suit === 'H' || suit === 'D';

  const sizeConfig = {
    xs: {
      box: 'w-7 h-10 sm:w-8 sm:h-11 rounded-md p-1',
      topVal: 'text-[11px] sm:text-xs font-black leading-none',
      centerSuit: 'text-base sm:text-lg leading-none',
      centerIcon: 'w-3 h-3',
      showBottomRank: false,
    },
    sm: {
      box: 'w-9 h-13 sm:w-11 sm:h-16 rounded-lg p-1 sm:p-1.5',
      topVal: 'text-xs sm:text-sm font-black leading-none',
      centerSuit: 'text-lg sm:text-2xl leading-none',
      centerIcon: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
      showBottomRank: false,
    },
    md: {
      box: 'w-9 h-13 sm:w-14 sm:h-20 rounded-lg sm:rounded-xl p-1 sm:p-2',
      topVal: 'text-sm sm:text-base font-black leading-none',
      centerSuit: 'text-2xl sm:text-3xl leading-none',
      centerIcon: 'w-4 h-4 sm:w-5 sm:h-5',
      showBottomRank: false,
    },
    lg: {
      box: 'w-14 h-20 sm:w-16 sm:h-24 rounded-xl p-1.5 sm:p-2',
      topVal: 'text-base sm:text-lg font-black leading-none',
      centerSuit: 'text-3xl sm:text-4xl leading-none',
      centerIcon: 'w-5 h-5 sm:w-6 sm:h-6',
      showBottomRank: false,
    },
    xl: {
      box: 'w-18 h-26 sm:w-20 sm:h-28 rounded-xl p-2 sm:p-2.5',
      topVal: 'text-lg sm:text-xl font-black leading-none',
      centerSuit: 'text-4xl sm:text-5xl leading-none',
      centerIcon: 'w-6 h-6 sm:w-7 sm:h-7',
      showBottomRank: false,
    },
    '2xl': {
      box: 'w-22 h-32 sm:w-26 sm:h-38 rounded-2xl p-2.5 sm:p-3',
      topVal: 'text-xl sm:text-2xl font-black leading-none',
      centerSuit: 'text-5xl sm:text-6xl leading-none',
      centerIcon: 'w-8 h-8 sm:w-10 sm:h-10',
      showBottomRank: false,
    },
  };

  const cfg = sizeConfig[size];

  if (!isFaceUp || !card) {
    // High-Precision Sanctuary Tour Card Back
    return (
      <motion.div
        layout
        className={`relative ${cfg.box} select-none cursor-pointer flex-shrink-0 border-2 overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.65)] transition-transform duration-200 ${className}
          bg-gradient-to-br from-[#1b0938] via-[#0f0521] to-[#1b0938] border-amber-400/80`}
        id="card-back"
      >
        <div className="w-full h-full border border-amber-400/35 rounded-[inherit] flex flex-col items-center justify-center relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.28),transparent_75%)]">
          <Disc className={`${cfg.centerIcon} text-amber-300/90`} />
          {size !== 'xs' && size !== 'sm' && (
            <span className="font-mono text-[7px] sm:text-[8px] font-black text-amber-200/90 tracking-widest uppercase mt-1">
              SANCTUARY
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Clean Minimalist Poker Card Face: Top-Left Rank ONLY + Single Large Center Suit
  const suit = card.suit;
  const valLabel = getCardValueLabel(card.value);
  const red = isRedSuit(suit);
  const colorClass = red ? 'text-[#DC2626]' : 'text-[#0F172A]';
  const hasGlow = isHighlighted || isGlowing;

  return (
    <motion.div
      layout
      className={`relative ${cfg.box} select-none cursor-default flex-shrink-0 flex flex-col justify-between transition-transform duration-200 ${className}
        ${
          hasGlow
            ? 'bg-white border-2 border-amber-400 ring-3 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.9)] -translate-y-1 z-20'
            : 'bg-white border border-slate-300 shadow-[0_6px_16px_rgba(0,0,0,0.55)]'
        }`}
      id={`card-${suit}-${card.value}`}
    >
      {/* Top-Left Rank Only (No corner suit symbol) */}
      <div className="flex items-start leading-none z-10">
        <span className={`${cfg.topVal} ${colorClass} font-mono tracking-tighter tabular-nums`}>
          {valLabel}
        </span>
      </div>

      {/* Single Main Suit in Center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 pt-2">
        <span className={`${cfg.centerSuit} ${colorClass} font-sans select-none`}>
          {getSuitSymbol(suit)}
        </span>
      </div>
    </motion.div>
  );
};
