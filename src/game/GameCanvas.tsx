import { useEffect, useMemo, useRef, useState } from 'react';
import { TouchControls } from '../controls/TouchControls';
import type { Settings } from '../core/types';
import { HUD } from '../ui/HUD';
import { GameSession, type GameState } from './GameSession';

interface Props {
  settings: Settings;
  paused: boolean;
  isTouch: boolean;
  onPause: () => void;
  onBackToMenu: () => void;
  multiplayer: boolean;
  room?: string;
}

export default function GameCanvas({
  settings,
  paused,
  isTouch,
  onPause,
  onBackToMenu,
  multiplayer,
  room,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const touch = useMemo(() => new TouchControls(), []);
  const [health, setHealth] = useState<GameState['health'] | null>(null);

  const latest = useRef({ settings, onPause, onBackToMenu });
  latest.current = { settings, onPause, onBackToMenu };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    try {
      sessionRef.current = GameSession.create({
        container,
        settings: latest.current.settings,
        touch,
        isTouch,
        events: {
          onPrompt: () => {},
          onMessage: () => {},
          onLockLost: () => latest.current.onPause(),
        },
        multiplayer,
        room,
      });
    } catch (e) {
      console.error(e);
    }
    return () => {
      sessionRef.current?.dispose();
      sessionRef.current = null;
    };
  }, [touch, isTouch, multiplayer, room]);

  useEffect(() => {
    sessionRef.current?.applySettings(settings);
  }, [settings]);

  useEffect(() => {
    const session = sessionRef.current;
    if (!session) return;
    if (paused) session.pause();
    else session.resume();
  }, [paused]);

  useEffect(() => {
    const session = sessionRef.current;
    if (!session) return;
    const id = setInterval(() => {
      setHealth(session.state.health);
    }, 100);
    return () => clearInterval(id);
  }, []);

  const ammo = { current: 12, total: 36 };

  return (
    <div className="game-root">
      <div ref={containerRef} className="game-viewport" />
      {!paused && (
        <HUD health={health ? health.value : 100} maxHealth={health ? health.max : 100} ammo={ammo} />
      )}
    </div>
  );
}
