/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { wsService } from '../services/websocket';
import { iosAudio } from '../utils/iosAudio';

export const NetworkNotifier: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      // Auto-reconnect WebSocket and unlock audio
      wsService.connect();
      iosAudio.playClickSound();

      setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    // iOS Page Visibility handler (Resume audio & check connection on app foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (navigator.onLine) {
          wsService.connect();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleManualRetry = () => {
    if (navigator.onLine) {
      setIsOffline(false);
      wsService.connect();
    } else {
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md bg-rose-950/95 border border-rose-500/80 rounded-2xl p-3 shadow-[0_0_30px_rgba(244,63,94,0.4)] backdrop-blur-md flex items-center justify-between text-white"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-xs text-rose-200">当前网络连接断开</div>
              <div className="text-[10px] text-rose-300/80 font-mono">已切至单人练习，联网后自动重连</div>
            </div>
          </div>

          <button
            onClick={handleManualRetry}
            className="px-3 py-1.5 rounded-xl bg-rose-800 hover:bg-rose-700 border border-rose-400 text-white font-bold text-xs flex items-center gap-1 transition-all shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重连</span>
          </button>
        </motion.div>
      )}

      {showReconnected && !isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md bg-emerald-950/95 border border-emerald-500/80 rounded-2xl p-3 shadow-[0_0_30px_rgba(16,185,129,0.4)] backdrop-blur-md flex items-center gap-2.5 text-white"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-bold text-xs text-emerald-200">网络连接已恢复</div>
            <div className="text-[10px] text-emerald-300/80 font-mono">圣所服务器连线成功！</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
