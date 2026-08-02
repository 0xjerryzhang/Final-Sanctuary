import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../types';
import { PlayingCard } from './PlayingCard';
import { Eye, EyeOff } from 'lucide-react';

interface FlippableCardProps {
  card?: Card;
  isFlipped: boolean; // true = face up (front shown), false = face down (card back shown)
  onFlipToggle: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isGlowing?: boolean;
  rotationAngle?: number;
  label?: string;
}

export const FlippableCard: React.FC<FlippableCardProps> = ({
  card,
  isFlipped,
  onFlipToggle,
  size = '2xl',
  isGlowing = false,
  rotationAngle = 0,
}) => {
  return (
    <div 
      className="relative group cursor-pointer select-none perspective-1000 flex flex-col items-center justify-center"
      onClick={onFlipToggle}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative transform-gpu"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{
          rotateY: isFlipped ? 180 : 0,
          rotate: rotationAngle,
        }}
        transition={{
          duration: 0.6,
          type: 'spring',
          stiffness: 240,
          damping: 22,
        }}
      >
        {/* FACE DOWN (Card Back with JJ Sanctuary theme) */}
        <div 
          className="backface-hidden relative"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <PlayingCard 
            card={undefined} 
            isFaceUp={false} 
            size={size} 
          />

          {/* Click to Peek / Flip Hint Overlay Badge */}
          <div className="absolute inset-x-1 bottom-2 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-950/90 border border-amber-400/80 px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-200 flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform">
              <Eye className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>翻牌</span>
            </div>
          </div>
        </div>

        {/* FACE UP (Card Front) */}
        <div 
          className="backface-hidden absolute inset-0"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <PlayingCard 
            card={card} 
            isFaceUp={true} 
            size={size} 
            isGlowing={isGlowing} 
          />

          {/* Hide/Mask Badge */}
          <div className="absolute inset-x-1 bottom-2 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-slate-950/90 border border-purple-400/80 px-2 py-0.5 rounded-full text-[9px] font-bold text-purple-200 flex items-center gap-1 shadow-md">
              <EyeOff className="w-3 h-3 text-purple-300" />
              <span>盖牌</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
