/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface PokerChipProps {
  value: number;
  size?: number; // width and height in px
  className?: string;
  count?: number; // stack count indicator
  onClick?: () => void;
  interactive?: boolean;
}

export const PokerChip: React.FC<PokerChipProps> = ({
  value,
  size = 100,
  className = '',
  count = 1,
  onClick,
  interactive = true,
}) => {
  // Chip configuration mapping value to cities and details
  const getChipDetails = (val: number) => {
    switch (val) {
      case 20:
        return {
          city: 'SEOUL',
          chineseCity: '首尔',
          mainColor: '#8a2be2', // Violet
          accentColor: '#4b0082',
          bgColor: '#ffffff',
          skyline: (
            <>
              {/* Namsan / Seoul Tower & Lotte Tower */}
              <path d="M 30,73 L 35,50 L 37,50 L 38,30 L 39,30 L 40,50 L 42,50 L 47,73" fill="none" stroke="#222" strokeWidth="1" />
              <circle cx="38.5" cy="40" r="3" fill="none" stroke="#222" strokeWidth="1" />
              {/* Lotte World Tower */}
              <path d="M 70,73 L 73,35 L 75,35 L 78,73 Z" fill="none" stroke="#222" strokeWidth="1" />
              {/* Hanok traditional gate */}
              <path d="M 46,73 L 46,65 L 62,65 L 62,73" fill="none" stroke="#222" strokeWidth="1" />
              <path d="M 42,65 Q 54,58 66,65 L 63,63 Q 54,56 45,63 Z" fill="#222" />
              {/* Ground line */}
              <line x1="20" y1="73" x2="80" y2="73" stroke="#222" strokeWidth="1.5" />
              {/* Taegeuk symbol at the top */}
              <g transform="translate(50, 24) scale(0.6)">
                <circle cx="0" cy="0" r="8" fill="none" stroke="#222" strokeWidth="1" />
                <path d="M -8,0 A 4,4 0 0,1 0,0 A 4,4 0 0,0 8,0 A 8,8 0 0,1 -8,0" fill="#4b0082" />
                <path d="M -8,0 A 4,4 0 0,1 0,0 A 4,4 0 0,0 8,0 A 8,8 0 0,0 -8,0" fill="#8a2be2" opacity="0.5" />
              </g>
            </>
          ),
        };
      case 50:
        return {
          city: 'TOKYO',
          chineseCity: '东京',
          mainColor: '#1e90ff', // DodgerBlue
          accentColor: '#00008b',
          bgColor: '#ffffff',
          skyline: (
            <>
              {/* Mt Fuji Background */}
              <path d="M 22,73 L 40,50 Q 50,45 60,50 L 78,73 Z" fill="#f5f5f5" stroke="#ccc" strokeWidth="1" />
              <path d="M 45,56 L 50,50 Q 51,52 53,50 L 55,56 Z" fill="#fff" />
              {/* Tokyo Tower */}
              <path d="M 30,73 L 34,42 L 36,42 L 40,73 M 35,42 L 35,28 L 33,28 L 37,28" fill="none" stroke="#222" strokeWidth="1" />
              <line x1="31.5" y1="62" x2="38.5" y2="62" stroke="#222" strokeWidth="1" />
              <line x1="33" y1="50" x2="37" y2="50" stroke="#222" strokeWidth="1" />
              {/* Skyscrapers */}
              <rect x="58" y="48" width="10" height="25" fill="none" stroke="#222" strokeWidth="1" />
              <rect x="68" y="55" width="8" height="18" fill="none" stroke="#222" strokeWidth="1" />
              {/* Ground line */}
              <line x1="20" y1="73" x2="80" y2="73" stroke="#222" strokeWidth="1.5" />
              {/* Rising red/blue sun at the top */}
              <circle cx="50" cy="24" r="5" fill="#1e90ff" opacity="0.7" />
            </>
          ),
        };
      case 100:
        return {
          city: 'KUALA LUMPUR',
          chineseCity: '吉隆坡',
          mainColor: '#20b2aa', // LightSeaGreen
          accentColor: '#008080',
          bgColor: '#ffffff',
          skyline: (
            <>
              {/* Petronas Towers */}
              <g transform="translate(2,0)">
                {/* Tower 1 */}
                <path d="M 33,73 L 33,35 L 36,35 L 36,25 L 37,25 L 37,73" fill="none" stroke="#222" strokeWidth="1" />
                {/* Tower 2 */}
                <path d="M 45,73 L 45,35 L 48,35 L 48,25 L 49,25 L 49,73" fill="none" stroke="#222" strokeWidth="1" />
                {/* Bridge */}
                <rect x="36" y="48" width="9" height="3" fill="none" stroke="#222" strokeWidth="1" />
              </g>
              {/* KL Tower */}
              <path d="M 64,73 L 64,38 L 61,38 Q 61,33 64,33 L 64,22 L 65,22 L 65,33 Q 68,33 68,38 L 65,38 L 65,73" fill="none" stroke="#222" strokeWidth="1" />
              {/* Ground line */}
              <line x1="20" y1="73" x2="80" y2="73" stroke="#222" strokeWidth="1.5" />
              {/* Hibiscus flower representation at top */}
              <g transform="translate(50, 24) scale(0.6)">
                <circle cx="0" cy="0" r="5" fill="none" stroke="#20b2aa" strokeWidth="1.5" />
                <path d="M -5,-5 Q 0,-12 5,-5 Q 12,0 5,5 Q 0,12 -5,5 Q -12,0 -5,-5 Z" fill="none" stroke="#222" strokeWidth="1" />
              </g>
            </>
          ),
        };
      case 200:
        return {
          city: 'HONG KONG',
          chineseCity: '香港',
          mainColor: '#ff4500', // OrangeRed
          accentColor: '#8b0000',
          bgColor: '#ffffff',
          skyline: (
            <>
              {/* Bank of China Tower */}
              <path d="M 28,73 L 28,34 L 38,42 L 38,73 M 28,34 L 38,34 L 38,42" fill="none" stroke="#222" strokeWidth="1" />
              <line x1="28" y1="73" x2="38" y2="42" stroke="#222" strokeWidth="0.8" />
              <line x1="38" y1="73" x2="28" y2="42" stroke="#222" strokeWidth="0.8" />
              {/* IFC Tower */}
              <path d="M 45,73 L 45,28 L 53,28 L 53,73" fill="none" stroke="#222" strokeWidth="1" />
              <path d="M 45,28 Q 49,23 53,28" fill="none" stroke="#222" strokeWidth="1" />
              {/* Clock Tower / Standard highrises */}
              <rect x="60" y="45" width="8" height="28" fill="none" stroke="#222" strokeWidth="1" />
              <polygon points="60,45 64,38 68,45" fill="none" stroke="#222" strokeWidth="1" />
              <circle cx="64" cy="49" r="1.5" fill="none" stroke="#222" strokeWidth="1" />
              <rect x="70" y="52" width="8" height="21" fill="none" stroke="#222" strokeWidth="1" />
              {/* Ground line */}
              <line x1="20" y1="73" x2="80" y2="73" stroke="#222" strokeWidth="1.5" />
              {/* Bauhinia Flower at top */}
              <g transform="translate(50, 24) scale(0.7)">
                <path d="M0,-6 C2,-3 5,-3 4,0 C3,3 1,4 0,1 C-1,4 -3,3 -4,0 C-5,-3 -2,-3 0,-6" fill="none" stroke="#222" strokeWidth="1.2" />
                <path d="M0,0 L3,-4 M0,0 L4,2 M0,0 L-1,4 M0,0 L-4,2 M0,0 L-3,-4" stroke="#222" strokeWidth="0.8" />
              </g>
            </>
          ),
        };
      case 500:
        return {
          city: 'BEIJING',
          chineseCity: '北京',
          mainColor: '#ffd700', // Gold
          accentColor: '#b8860b',
          bgColor: '#ffffff',
          skyline: (
            <>
              {/* Temple of Heaven */}
              <path d="M 23,73 L 23,65 L 43,65 L 43,73" fill="none" stroke="#222" strokeWidth="1" />
              <path d="M 25,65 L 25,56 L 41,56 L 41,65" fill="none" stroke="#222" strokeWidth="1" />
              <path d="M 28,56 L 28,46 L 38,46 L 38,56" fill="none" stroke="#222" strokeWidth="1" />
              <path d="M 28,46 Q 33,39 38,46" fill="#222" />
              {/* CCTV Headquarters */}
              <path d="M 52,73 L 52,42 L 72,48 L 72,73" fill="none" stroke="#222" strokeWidth="1" />
              <polygon points="52,42 66,45 61,54 52,51" fill="#fff" stroke="#222" strokeWidth="1" />
              {/* Ground line */}
              <line x1="20" y1="73" x2="80" y2="73" stroke="#222" strokeWidth="1.5" />
              {/* China Gate Symbol at top */}
              <g transform="translate(50, 24) scale(0.6)">
                <path d="M -10,4 L 10,4 L 8,-4 L -8,-4 Z" fill="none" stroke="#222" strokeWidth="1" />
                <rect x="-4" y="-8" width="8" height="4" fill="none" stroke="#222" strokeWidth="1" />
              </g>
            </>
          ),
        };
      case 1000:
        return {
          city: 'SINGAPORE',
          chineseCity: '新加坡',
          mainColor: '#ba55d3', // MediumOrchid
          accentColor: '#8b008b',
          bgColor: '#ffffff',
          skyline: (
            <>
              {/* Marina Bay Sands */}
              <g transform="translate(-3,2)">
                <rect x="25" y="48" width="6" height="25" fill="none" stroke="#222" strokeWidth="1" />
                <rect x="36" y="48" width="6" height="25" fill="none" stroke="#222" strokeWidth="1" />
                <rect x="47" y="48" width="6" height="25" fill="none" stroke="#222" strokeWidth="1" />
                {/* Curved SkyPark */}
                <path d="M 20,48 Q 40,43 58,48 L 56,44 Q 38,39 22,44 Z" fill="#222" />
              </g>
              {/* Singapore Flyer */}
              <circle cx="68" cy="50" r="13" fill="none" stroke="#222" strokeWidth="1" />
              <line x1="68" y1="50" x2="68" y2="73" stroke="#222" strokeWidth="1" />
              <line x1="68" y1="50" x2="59" y2="73" stroke="#222" strokeWidth="1" />
              <line x1="68" y1="50" x2="77" y2="73" stroke="#222" strokeWidth="1" />
              {/* Ground line */}
              <line x1="20" y1="73" x2="80" y2="73" stroke="#222" strokeWidth="1.5" />
              {/* Merlion Lion Symbol at top */}
              <g transform="translate(50, 24) scale(0.7)">
                <path d="M -3,5 Q -5,0 0,-5 Q 5,0 3,5 Z" fill="none" stroke="#ba55d3" strokeWidth="1" />
                <circle cx="0" cy="-2" r="1.5" fill="#222" />
              </g>
            </>
          ),
        };
      case 5000:
      default:
        return {
          city: 'SINGAPORE FINAL',
          chineseCity: '新加坡终点站',
          mainColor: '#a855f7', // Purple-500
          accentColor: '#581c87', // Purple-900
          bgColor: '#ffffff',
          skyline: (
            <>
              {/* Marina Bay Sands */}
              <g transform="translate(-3,2)">
                <rect x="25" y="48" width="6" height="25" fill="none" stroke="#222" strokeWidth="1" />
                <rect x="36" y="48" width="6" height="25" fill="none" stroke="#222" strokeWidth="1" />
                <rect x="47" y="48" width="6" height="25" fill="none" stroke="#222" strokeWidth="1" />
                {/* Curved SkyPark */}
                <path d="M 20,48 Q 40,43 58,48 L 56,44 Q 38,39 22,44 Z" fill="#222" />
              </g>
              {/* Singapore Flyer */}
              <circle cx="68" cy="50" r="13" fill="none" stroke="#222" strokeWidth="1" />
              <line x1="68" y1="50" x2="68" y2="73" stroke="#222" strokeWidth="1" />
              <line x1="68" y1="50" x2="59" y2="73" stroke="#222" strokeWidth="1" />
              <line x1="68" y1="50" x2="77" y2="73" stroke="#222" strokeWidth="1" />
              {/* Ground line */}
              <line x1="20" y1="73" x2="80" y2="73" stroke="#222" strokeWidth="1.5" />
              {/* Merlion Lion Symbol at top */}
              <g transform="translate(50, 24) scale(0.7)">
                <path d="M -3,5 Q -5,0 0,-5 Q 5,0 3,5 Z" fill="none" stroke="#a855f7" strokeWidth="1" />
                <circle cx="0" cy="-2" r="1.5" fill="#222" />
              </g>
            </>
          ),
        };
    }
  };

  const details = getChipDetails(value);

  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <motion.div
        whileHover={interactive ? { scale: 1.08, y: -4, rotate: 2 } : {}}
        whileTap={interactive ? { scale: 0.95 } : {}}
        className={`w-full h-full rounded-full cursor-pointer relative shadow-2xl flex items-center justify-center`}
      >
        {/* SVG Chip Art */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
        >
          <defs>
            {/* Metallic rim gradient */}
            <linearGradient id="silver-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f3f4f6" />
              <stop offset="25%" stopColor="#d1d5db" />
              <stop offset="50%" stopColor="#9ca3af" />
              <stop offset="75%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>

            {/* Glowing active center gradient */}
            <radialGradient id="chip-center" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#ffffff" />
              <stop offset="90%" stopColor="#f3f4f6" />
              <stop offset="100%" stopColor="#e5e7eb" />
            </radialGradient>

            {/* Inner gold/silver border */}
            <linearGradient id="inner-gold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          {/* Outer Ring / Rim */}
          <circle cx="50" cy="50" r="48" fill="url(#silver-rim)" stroke="#111827" strokeWidth="1.5" />

          {/* Radial stripes on the rim (Purple, Accent, Black) */}
          {/* We place 8 striped blocks around the rim */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <g key={angle} transform={`rotate(${angle}, 50, 50)`}>
              {/* Central colored stripe */}
              <path
                d="M 45,2 L 55,2 L 54,14 L 46,14 Z"
                fill={details.mainColor}
                stroke="#111"
                strokeWidth="0.5"
              />
              {/* Secondary accent stripes */}
              <path
                d="M 42,2 L 45,2 L 46,14 L 43,14 Z"
                fill="#111827"
              />
              <path
                d="M 55,2 L 58,2 L 57,14 L 54,14 Z"
                fill="#e5e7eb"
              />
            </g>
          ))}

          {/* Outer Rim Text "FINAL SANCTUARY" */}
          {/* Placed at top and bottom of outer rim */}
          <path id={`textPath-top-${value}`} d="M 18,18 A 45,45 0 0,1 82,18" fill="none" />
          <text fill="#222" fontSize="5.5" fontWeight="900" letterSpacing="0.5">
            <textPath href={`#textPath-top-${value}`} startOffset="50%" textAnchor="middle">
              FINAL SANCTUARY
            </textPath>
          </text>

          {/* Inner Circle background */}
          <circle cx="50" cy="50" r="37" fill="url(#chip-center)" stroke="#374151" strokeWidth="1" />

          {/* Dashed ring inside inner circle */}
          <circle
            cx="50"
            cy="50"
            r="33"
            fill="none"
            stroke={details.mainColor}
            strokeWidth="1"
            strokeDasharray="2.5,1.5"
          />

          {/* City label at top-center */}
          <text
            x="50"
            y="32"
            fill="#111827"
            fontSize="4.5"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="0.6"
          >
            {details.city}
          </text>

          {/* Skyline Render */}
          <g opacity="0.85">
            {details.skyline}
          </g>

          {/* Large Italic Futuristic value in center */}
          <text
            x="50"
            y="56"
            fill={details.accentColor}
            fontSize="18"
            fontWeight="900"
            fontStyle="italic"
            textAnchor="middle"
            filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.15))"
            letterSpacing="-0.5"
          >
            {value}
          </text>

          {/* FINAL LAP logo under value */}
          <g transform="translate(50, 62) scale(0.6)">
            {/* Parallel action lines of logo */}
            <line x1="-20" y1="0" x2="20" y2="0" stroke="#111" strokeWidth="2.5" />
            <line x1="-15" y1="4" x2="15" y2="4" stroke="#111" strokeWidth="1.2" />
            <text
              x="0"
              y="-1"
              fill="#111"
              fontSize="6"
              fontWeight="900"
              fontStyle="italic"
              textAnchor="middle"
              letterSpacing="1.2"
            >
              FINAL LAP
            </text>
          </g>

          {/* WORLD TOUR at bottom */}
          <text
            x="50"
            y="79"
            fill="#4b5563"
            fontSize="3.2"
            fontWeight="600"
            textAnchor="middle"
            letterSpacing="1.5"
          >
            WORLD TOUR
          </text>
        </svg>

        {/* Multi-stack indicator */}
        {count > 1 && (
          <div className="absolute -top-1 -right-1 bg-purple-600 text-white font-mono text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-md z-10">
            x{count}
          </div>
        )}

        {/* Hover/active indicator */}
        <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity duration-200" />
      </motion.div>

      {/* Sublabel with city in Chinese */}
      <div className="text-center mt-1 text-[11px] font-medium text-purple-200/95 font-sans truncate drop-shadow">
        {details.chineseCity}
      </div>
    </div>
  );
};
