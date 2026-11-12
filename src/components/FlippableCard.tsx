import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../types';
import { PlayingCard } from './PlayingCard';
import { Eye } from 'lucide-react';

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
  size = 'xl',
  isGlowing = false,
  rotationAngle = 0,
}) => {
  return (
    <div
      className="relative group cursor-pointer select-none flex flex-col items-center justify-center"
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
          duration: 0.45,
          type: 'spring',
          stiffness: 260,
          damping: 24,
        }}
      >
        {/* FACE DOWN (Card Back) */}
        <div
          className="backface-hidden relative"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <PlayingCard card={undefined} isFaceUp={false} size={size} />

          <div className="absolute inset-x-1 bottom-1.5 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-950/90 border border-amber-400/80 px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-200 flex items-center gap-1 shadow-md">
              <Eye className="w-2.5 h-2.5 text-amber-300" />
              <span>看牌</span>
            </div>
          </div>
        </div>

        {/* FACE UP (Crisp White Card Front — Unobstructed) */}
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
        </div>
      </motion.div>
    </div>
  );
};
