/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Rocket,
  Zap,
  Sparkles,
  Lock,
  Unlock,
  Radio,
  Globe,
  Compass,
  Cpu,
  Eye,
  CheckCircle2,
  ChevronRight,
  Flame,
  MousePointerClick
} from 'lucide-react';

interface SpaceBoardingSplashProps {
  onEnterLobby: () => void;
}

export const SpaceBoardingSplash: React.FC<SpaceBoardingSplashProps> = ({ onEnterLobby }) => {
  const [isWarping, setIsWarping] = useState(false);
  const [warpStage, setWarpStage] = useState(0);

  const handleActivateMechanism = () => {
    if (isWarping) return;
    setIsWarping(true);

    // Sequence for space boarding warp drive animation
    setTimeout(() => setWarpStage(1), 600);   // Identity verification
    setTimeout(() => setWarpStage(2), 1400);  // Warp drive ignition
    setTimeout(() => setWarpStage(3), 2200);  // Portal opening & entering metaverse
    setTimeout(() => {
      onEnterLobby();
    }, 3200);
  };

  return (
    <div className="w-full h-full bg-[#070212] text-white font-sans relative overflow-hidden flex flex-col justify-between items-center select-none p-3 sm:p-6">
      
      {/* BACKGROUND DEEP METAVERSE & WARP NEBULA */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2e0854,#0d011d,#030008)] pointer-events-none" />

      {/* Cyber Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(168,85,247,0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168,85,247,0.2) 1px, transparent 1px)
          `,
          backgroundSize: '45px 45px',
        }}
      />

      {/* Cosmic Purple Glow Orbs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[300px] bg-fuchsia-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* TOP BAR: GAMING LABS CERTIFIED RNG BADGE & STATUS */}
      <div className="w-full max-w-4xl flex items-center justify-between z-20 pt-1 pb-2">
        {/* Left: Cyber Agent Badge */}
        <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-500/50 px-3 py-1 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] sm:text-xs font-mono font-bold text-purple-200 tracking-wider">
            Final Sanctuary
          </span>
        </div>

        {/* Right: Certified RNG Badge matching reference image */}
        <div className="bg-white text-slate-900 px-2.5 py-1 rounded shadow-lg flex items-center gap-2 border border-slate-300">
          <div className="bg-blue-900 text-white p-0.5 rounded">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-blue-900" />
          </div>
          <div className="flex flex-col text-left leading-none">
            <span className="text-[10px] font-black tracking-tight text-blue-950">Gaming Labs</span>
            <span className="text-[8px] font-extrabold text-red-600 uppercase tracking-tighter">Certified RNG</span>
          </div>
        </div>
      </div>

      {/* SLEEK MINIMAL COSMIC METAVERSE EMBLEM */}
      <div className="relative w-full max-w-xl my-auto flex flex-col items-center justify-center z-20 py-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col items-center text-center p-4 w-full"
        >
          {/* Interactive Rocket Launch Button with Visual Click Cues (No text required) */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleActivateMechanism}
            disabled={isWarping}
            className="group relative my-2 cursor-pointer flex flex-col items-center justify-center focus:outline-none"
          >
            {/* 1. Continuous Expanding Radar Ripple Rings (Visual click invitation) */}
            <motion.div
              animate={{ scale: [1, 1.8, 2.2], opacity: [0.7, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-fuchsia-400/80 pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.6, 2], opacity: [0.8, 0.2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
              className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-purple-400/80 pointer-events-none"
            />

            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
              {/* Outer glowing purple aura */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />

              {/* Breathing Center Rocket Button */}
              <motion.div 
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-purple-800 via-fuchsia-900 to-slate-950 border-2 border-fuchsia-300 shadow-[0_0_40px_rgba(232,121,249,0.9)] group-hover:shadow-[0_0_60px_rgba(232,121,249,1)] flex flex-col items-center justify-center transition-all z-10 relative overflow-hidden"
              >
                {/* Internal shine sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-white group-hover:text-amber-300 animate-bounce transition-colors" />
              </motion.div>

              {/* Animated Finger Tap Cursor (Visual Indicator without words) */}
              <motion.div
                animate={{ y: [0, -6, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-2 -right-2 z-20 bg-gradient-to-r from-amber-400 to-fuchsia-500 p-2 rounded-full border-2 border-white shadow-[0_0_20px_rgba(251,191,36,0.9)] flex items-center justify-center text-slate-950"
              >
                <MousePointerClick className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 fill-amber-200 animate-pulse" />
              </motion.div>
            </div>
          </motion.button>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-fuchsia-300 mb-2 font-display">
            FINAL SANCTUARY
          </h1>

          <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-[10px] font-mono text-purple-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>QUANTUM ENGINE READY</span>
          </div>
        </motion.div>
      </div>

      {/* OVERLAY: COSMIC WARP DRIVE & METAVERSE BOARDING ANIMATION */}
      <AnimatePresence>
        {isWarping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#05010f] z-50 flex flex-col items-center justify-center p-6 overflow-hidden"
          >
            {/* Warp Speed Starfield Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#581c87,#1e053b,#000000)]" />
            
            {/* Rotating Cyber Quantum Portal Rings */}
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.3, 1.6, 2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full border-4 border-dashed border-purple-400/60 shadow-[0_0_80px_rgba(168,85,247,0.8)] pointer-events-none"
            />
            <motion.div
              animate={{ rotate: -360, scale: [1, 1.4, 1.8] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] rounded-full border-2 border-fuchsia-400/80 shadow-[0_0_60px_rgba(232,121,249,0.8)] pointer-events-none"
            />

            {/* Center Starship Airlock & HUD Status Display */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-md bg-slate-950/90 border-2 border-fuchsia-400/90 p-6 rounded-3xl backdrop-blur-2xl shadow-[0_0_50px_rgba(232,121,249,0.8)]">
              
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(232,121,249,1)]">
                <Rocket className="w-8 h-8 text-white animate-bounce" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-fuchsia-300 mb-2">
                🚀 宇宙登船引擎启动中
              </h2>

              {/* Dynamic Step Logs */}
              <div className="w-full bg-black/80 border border-purple-500/50 p-3 rounded-xl font-mono text-xs text-purple-300 space-y-1.5 my-3 text-left">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>[01] 代理人身份验证通过 (Agent Authenticated)</span>
                </div>
                {warpStage >= 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-cyan-300"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>[02] 正在对接圣所号飞船 (Docking Starship)</span>
                  </motion.div>
                )}
                {warpStage >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-fuchsia-300"
                  >
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>[03] 曲速引擎点火，穿梭元宇宙 (Warp Speed)</span>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-2 text-amber-300 text-xs font-mono font-bold animate-pulse">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>FINAL SANCTUARY ARENA READY...</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
