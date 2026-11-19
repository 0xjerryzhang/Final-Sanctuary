/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Rocket,
  Zap,
  CheckCircle2,
  MousePointerClick,
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

    setTimeout(() => setWarpStage(1), 500);
    setTimeout(() => setWarpStage(2), 1100);
    setTimeout(() => {
      onEnterLobby();
    }, 1800);
  };

  const warpStatusText =
    warpStage === 0
      ? '身份验证通过'
      : warpStage === 1
      ? '对接圣所星舰'
      : '曲速引擎就绪';

  return (
    <div className="w-full h-full bg-[#070212] text-white font-sans relative overflow-hidden flex flex-col justify-between items-center select-none p-4 sm:p-6">
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

      {/* TOP BAR */}
      <div className="w-full max-w-4xl flex items-center justify-between z-20 pt-1 pb-2 shrink-0">
        <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-500/50 px-3 py-1 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.3)] whitespace-nowrap shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="text-[11px] font-mono font-bold text-purple-200 tracking-wider">
            FINAL SANCTUARY
          </span>
        </div>

        <div className="bg-white text-slate-900 px-2.5 py-1 rounded-lg shadow-lg hidden min-[380px]:flex items-center gap-1.5 border border-slate-300 whitespace-nowrap shrink-0">
          <div className="bg-blue-900 text-white p-0.5 rounded shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-blue-900" />
          </div>
          <span className="text-[10px] font-black tracking-tight text-blue-950">RNG 公平认证</span>
        </div>
      </div>

      {/* SLEEK MINIMAL COSMIC METAVERSE EMBLEM */}
      <div className="relative w-full max-w-xl my-auto flex flex-col items-center justify-center z-20 py-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative flex flex-col items-center text-center p-4 w-full"
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleActivateMechanism}
            disabled={isWarping}
            className="group relative my-3 cursor-pointer flex flex-col items-center justify-center focus:outline-none"
          >
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
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />

              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-purple-800 via-fuchsia-900 to-slate-950 border-2 border-fuchsia-300 shadow-[0_0_40px_rgba(232,121,249,0.9)] group-hover:shadow-[0_0_60px_rgba(232,121,249,1)] flex flex-col items-center justify-center transition-all z-10 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-white group-hover:text-amber-300 animate-bounce transition-colors" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -5, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-2 -right-2 z-20 bg-gradient-to-r from-amber-400 to-fuchsia-500 p-2 rounded-full border-2 border-white shadow-[0_0_20px_rgba(251,191,36,0.9)] flex items-center justify-center text-slate-950"
              >
                <MousePointerClick className="w-5 h-5 text-slate-950 fill-amber-200 animate-pulse" />
              </motion.div>
            </div>
          </motion.button>

          <h1 className="text-xl min-[380px]:text-2xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-fuchsia-300 mb-2 font-display whitespace-nowrap">
            FINAL SANCTUARY
          </h1>

          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-xs font-mono font-bold text-purple-200 whitespace-nowrap">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>点击星舰进入圣所牌桌</span>
          </div>
        </motion.div>
      </div>

      {/* BOTTOM MINIMAL CAPTION */}
      <div className="z-20 text-[10px] font-mono text-purple-300/60 whitespace-nowrap shrink-0">
        SANCTUARY TOUR ARENA · 15 ALBUMS EDITION
      </div>

      {/* OVERLAY: STREAMLINED COSMIC WARP DRIVE */}
      <AnimatePresence>
        {isWarping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#05010f] z-50 flex flex-col items-center justify-center p-6 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#581c87,#1e053b,#000000)]" />

            <motion.div
              animate={{ rotate: 360, scale: [1, 1.3, 1.6, 2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[340px] h-[340px] sm:w-[520px] sm:h-[520px] rounded-full border-4 border-dashed border-purple-400/60 shadow-[0_0_80px_rgba(168,85,247,0.8)] pointer-events-none"
            />

            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xs bg-slate-950/90 border-2 border-fuchsia-400/90 px-6 py-5 rounded-3xl backdrop-blur-2xl shadow-[0_0_50px_rgba(232,121,249,0.8)] gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_25px_rgba(232,121,249,1)]">
                <Rocket className="w-7 h-7 text-white animate-bounce" />
              </div>

              <h2 className="text-lg font-black text-white whitespace-nowrap">
                正在进入圣所大厅
              </h2>

              <div className="w-full bg-purple-950/80 border border-purple-500/40 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-amber-300 flex items-center justify-center gap-1.5 whitespace-nowrap">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                <span>{warpStatusText}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
