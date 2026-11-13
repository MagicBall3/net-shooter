import { useState, useEffect, useRef, useCallback } from 'react';
import { NetworkManager } from '../network/NetworkManager';
import type { RemotePlayerState } from '../network/protocol';
import { t } from './strings';

const WS_URL = (import.meta as any).env?.VITE_WS_URL ?? 'ws://localhost:8787';

export function MultiplayerMenu({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const [name, setName] = useState(localStorage.getItem('ns:name') ?? 'Игрок');
  const [room, setRoom] = useState('');
  const [mode, setMode] = useState<'choice' | 'room'>('choice');
  const [players, setPlayers] = useState<RemotePlayerState[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const networkRef = useRef<NetworkManager | null>(null);
  const myIdRef = useRef<string>('');

  useEffect(() => {
    return () => {
      networkRef.current?.disconnect();
    };
  }, []);

  const handleConnect = useCallback(async (isHost: boolean) => {
    setError('');
    setStatus(t.multiplayer.connecting);
    const net = new NetworkManager();
    networkRef.current = net;

    net.onMessage((msg) => {
      switch (msg.t) {
        case 'join_accept': {
          myIdRef.current = msg.id;
          setPlayers(msg.players);
          setStatus(t.multiplayer.connected);
          setMode('room');
          break;
        }
        case 'player_join': {
          setPlayers((prev) => (prev.find((p) => p.id === msg.id) ? prev : [...prev, msg]));
          break;
        }
        case 'player_leave': {
          setPlayers((prev) => prev.filter((p) => p.id !== msg.id));
          break;
        }
        case 'join_reject': {
          setError(msg.reason);
          setStatus('');
          net.disconnect();
          break;
        }
      }
    });

    try {
      await net.connect(WS_URL);
      if (isHost) {
        net.join(room || 'LOBBY', name);
      } else {
        net.join(room, name);
      }
      localStorage.setItem('ns:name', name);
    } catch {
      setError(t.multiplayer.error);
      setStatus('');
    }
  }, [name, room]);

  const handleStart = useCallback(() => {
    networkRef.current?.disconnect();
    onStart();
  }, [onStart]);

  return (
    <main className="screen screen--menu mp-menu">
      <header className="mp-header">
        <h1 className="title">{t.multiplayer.title}</h1>
        <button className="menu-item mp-back" onClick={onBack}>
          {t.multiplayer.back}
        </button>
      </header>

      {mode === 'choice' ? (
        <section className="mp-choice">
          <div className="mp-field">
            <label>{t.multiplayer.nameLabel}</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.multiplayer.namePlaceholder}
            />
          </div>
          <div className="mp-actions">
            <button className="menu-item mp-btn" onClick={() => handleConnect(true)}>
              {t.multiplayer.host}
            </button>
            <button className="menu-item mp-btn" onClick={() => setMode('room')}>
              {t.multiplayer.join}
            </button>
          </div>
        </section>
      ) : (
        <section className="mp-room">
          <div className="mp-field">
            <label>{t.multiplayer.roomLabel}</label>
            <input
              autoFocus
              value={room}
              onChange={(e) => setRoom(e.target.value.toUpperCase())}
              placeholder={t.multiplayer.roomPlaceholder}
            />
          </div>
          <button
            className="menu-item mp-btn mp-join"
            disabled={room.length < 4}
            onClick={() => handleConnect(false)}
          >
            {t.multiplayer.join}
          </button>
          <div className="mp-players">
            <div className="mp-players-title">{t.multiplayer.players} {players.length}</div>
            <ul className="mp-players-list">
              {players.map((p) => (
                <li key={p.id} className={`mp-player ${p.id === myIdRef.current ? 'me' : ''}`}>
                  {p.name} {p.id === myIdRef.current ? ' (вы)' : ''} — {p.health} HP
                </li>
              ))}
            </ul>
          </div>
          <div className="mp-status">{status}</div>
          {error && <div className="mp-error">{error}</div>}
          <div className="mp-actions">
            {status === t.multiplayer.connected && (
              <button className="menu-item mp-btn mp-start" onClick={handleStart}>
                {t.multiplayer.start}
              </button>
            )}
            <button className="menu-item mp-btn mp-back" onClick={() => {
              networkRef.current?.disconnect();
              setMode('choice');
              setPlayers([]);
              setStatus('');
              setError('');
            }}>
              {t.multiplayer.back}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
