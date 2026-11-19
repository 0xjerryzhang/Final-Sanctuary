/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GameTable } from './components/GameTable';
import { CyberStartScreen } from './components/CyberStartScreen';
import { SpaceBoardingSplash } from './components/SpaceBoardingSplash';
import { NetworkNotifier } from './components/NetworkNotifier';
import { JJ_SONGS } from './components/StageControls';
import { ConcertSong, StageLightMode } from './types';
import { JJ_ALBUM_STAGES, AlbumStage } from './data/albumStages';
import { wsService } from './services/websocket';
import { completeOAuthLoginIfPresent } from './services/zklogin';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [viewState, setViewState] = useState<'splash' | 'launcher' | 'game'>('splash');
  const [selectedStage, setSelectedStage] = useState<AlbumStage>(JJ_ALBUM_STAGES[0]);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [onlineRoomData, setOnlineRoomData] = useState<any>(null);
  const [currentSong, setCurrentSong] = useState<ConcertSong>(JJ_SONGS[0]);
  const [lightMode, setLightMode] = useState<StageLightMode>('purple');
  const [laserActive, setLaserActive] = useState(false);
  const [audienceSingActive, setAudienceSingActive] = useState(false);
  const [encoreActive, setEncoreActive] = useState(false);
  // Incremented once after a successful OAuth login so the launcher opens
  // the profile (with the new Sui address); cleared after it is handled.
  const [profileOpenRequest, setProfileOpenRequest] = useState(0);

  // Lock viewport scroll/pull-to-refresh on touch devices
  useEffect(() => {
    const preventTouchMove = (e: TouchEvent) => {
      let target = e.target as HTMLElement | null;
      let canScroll = false;
      while (target && target !== document.body) {
        if (
          target.classList &&
          (target.classList.contains('allow-scroll') ||
           target.classList.contains('overflow-y-auto') ||
           target.classList.contains('overflow-auto'))
        ) {
          if (target.scrollHeight > target.clientHeight) {
            canScroll = true;
            break;
          }
        }
        target = target.parentElement;
      }
      if (!canScroll) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventTouchMove);
    };
  }, []);

  // Sui zkLogin: finish an OAuth login (Google / Apple) if the URL carries
  // #id_token=... (the provider redirects back here after login; on success
  // On success App navigates to the launcher and opens the profile
  // (with the new Sui address) in place -- no page reload.)
  useEffect(() => {
    completeOAuthLoginIfPresent()
      .then((result) => {
        if (result) {
          // Land straight on the launcher and open the profile (with the
          // new Sui address) in place -- no page reload, so the game
          // does not restart.
          setViewState('launcher');
          setProfileOpenRequest((n) => n + 1);
        }
      })
      .catch((e) => {
        console.warn('[zkLogin] OAuth 登录回调处理失败', e);
        // Surface the failure to the user: without this the login silently
        // stays logged-out and there is no clue what went wrong.
        try {
          alert(`登录回调失败：${e instanceof Error ? e.message : '未知错误'}，请把这条信息发给 0xJerry`);
        } catch {
          // ignore
        }
      });
  }, []);

  const handleEnterLobby = () => {
    setViewState('launcher');
  };

  const handleStartGame = (stage: AlbumStage, isOnline: boolean = false, roomData?: any) => {
    setSelectedStage(stage);
    setIsOnlineMode(isOnline);
    setOnlineRoomData(roomData || null);
    setViewState('game');
  };

  const handleReturnToLauncher = () => {
    if (isOnlineMode) {
      wsService.leaveRoom();
    }
    setIsOnlineMode(false);
    setOnlineRoomData(null);
    setViewState('launcher');
  };

  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] bg-[#070212] text-white font-sans relative overflow-hidden select-none overscroll-none">
      {/* Global Network Status & iOS Reconnect Notifier */}
      <NetworkNotifier />

      <AnimatePresence mode="wait">
        {viewState === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <SpaceBoardingSplash onEnterLobby={handleEnterLobby} />
          </motion.div>
        )}

        {viewState === 'launcher' && (
          <motion.div
            key="launcher"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <CyberStartScreen
              onStartGame={handleStartGame}
              currentSong={currentSong}
              setCurrentSong={setCurrentSong}
              profileOpenRequest={profileOpenRequest}
              onProfileOpenRequestHandled={() => setProfileOpenRequest(0)}
            />
          </motion.div>
        )}

        {viewState === 'game' && (
          <motion.div
            key="game-table"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <GameTable
              currentSong={currentSong}
              setCurrentSong={setCurrentSong}
              lightMode={lightMode}
              setLightMode={setLightMode}
              laserActive={laserActive}
              setLaserActive={setLaserActive}
              audienceSingActive={audienceSingActive}
              setAudienceSingActive={setAudienceSingActive}
              encoreActive={encoreActive}
              setEncoreActive={setEncoreActive}
              selectedStage={selectedStage}
              isOnlineMode={isOnlineMode}
              onlineRoomData={onlineRoomData}
              onReturnToLauncher={handleReturnToLauncher}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
