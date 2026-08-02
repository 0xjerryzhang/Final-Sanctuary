/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GameTable } from './components/GameTable';
import { CyberStartScreen } from './components/CyberStartScreen';
import { SpaceBoardingSplash } from './components/SpaceBoardingSplash';
import { NetworkNotifier } from './components/NetworkNotifier';
import { JJ_SONGS } from './components/StageControls';
import { ConcertSong, StageLightMode } from './types';
import { JJ_ALBUM_STAGES, AlbumStage } from './data/albumStages';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [viewState, setViewState] = useState<'splash' | 'launcher' | 'game'>('splash');
  const [selectedStage, setSelectedStage] = useState<AlbumStage>(JJ_ALBUM_STAGES[0]);
  const [currentSong, setCurrentSong] = useState<ConcertSong>(JJ_SONGS[0]);
  const [lightMode, setLightMode] = useState<StageLightMode>('purple');
  const [laserActive, setLaserActive] = useState(false);
  const [audienceSingActive, setAudienceSingActive] = useState(false);
  const [encoreActive, setEncoreActive] = useState(false);

  const handleEnterLobby = () => {
    setViewState('launcher');
  };

  const handleStartGame = (stage: AlbumStage) => {
    setSelectedStage(stage);
    setViewState('game');
  };

  const handleReturnToLauncher = () => {
    setViewState('launcher');
  };

  return (
    <div className="w-screen h-screen bg-[#070212] text-white font-sans relative overflow-hidden select-none">
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
              onReturnToLauncher={handleReturnToLauncher}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
