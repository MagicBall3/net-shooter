import { useCallback, useMemo, useState } from 'react';
import { audio } from './audio/AudioManager';
import { enterImmersive, isTouchDevice, leaveImmersive } from './core/platform';
import type { GamePhase, Settings } from './core/types';
import { MainMenu } from './ui/MainMenu';
import { MultiplayerMenu } from './ui/MultiplayerMenu';
import GameCanvas from './game/GameCanvas';
import { PauseMenu } from './ui/PauseMenu';
import { SettingsPanel } from './ui/SettingsPanel';

const DEFAULT_SETTINGS: Settings = {
  sensitivity: 1,
  masterVolume: 0.7,
  quality: 'medium',
  invertY: false,
  headBob: true,
};

export default function App() {
  const isTouch = useMemo(() => isTouchDevice(), []);
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [multiplayer, setMultiplayer] = useState(false);
  const [room, setRoom] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const startSingle = useCallback(async () => {
    void audio.start();
    if (isTouch) await enterImmersive();
    setMultiplayer(false);
    setRoom('');
    setPhase('playing');
  }, [isTouch]);

  const startMultiplayer = useCallback(
    async (r: string) => {
      void audio.start();
      if (isTouch) await enterImmersive();
      setMultiplayer(true);
      setRoom(r);
      setPhase('playing');
    },
    [isTouch]
  );

  const exitToMenu = useCallback(() => {
    audio.suspend();
    if (isTouch) void leaveImmersive();
    setShowSettings(false);
    setPhase('menu');
  }, [isTouch]);

  const togglePause = useCallback(() => {
    setPhase((p) => (p === 'playing' ? 'paused' : 'playing'));
  }, []);

  const inGame = phase === 'playing' || phase === 'paused';

  return (
    <>
      {phase === 'menu' && (
        <MainMenu
          onSingle={startSingle}
          onMultiplayer={() => setPhase('multiplayer')}
          onSettings={() => setShowSettings(true)}
        />
      )}
      {phase === 'multiplayer' && (
        <MultiplayerMenu
          onStart={() => startMultiplayer(room)}
          onBack={() => setPhase('menu')}
        />
      )}
      {inGame && (
        <GameCanvas
          settings={settings}
          paused={phase === 'paused'}
          isTouch={isTouch}
          onPause={togglePause}
          onBackToMenu={exitToMenu}
          multiplayer={multiplayer}
          room={room}
        />
      )}
      {phase === 'paused' && !showSettings && (
        <PauseMenu
          onResume={() => setPhase('playing')}
          onSettings={() => setShowSettings(true)}
          onExit={exitToMenu}
        />
      )}
      {showSettings && (
        <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
