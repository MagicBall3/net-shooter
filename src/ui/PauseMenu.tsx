import { t } from './strings';

interface Props {
  onResume: () => void;
  onSettings: () => void;
  onExit: () => void;
}

export function PauseMenu({ onResume, onSettings, onExit }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#1a1a1a',
          padding: 32,
          borderRadius: 12,
          textAlign: 'center',
          minWidth: 260,
          color: '#fff',
          border: '1px solid #444',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <h2 style={{ color: '#fff', marginBottom: 20 }}>{t.pause.title}</h2>
        <button className="menu-item" style={{ width: '100%', marginBottom: 10 }} onClick={onResume}>
          {t.pause.resume}
        </button>
        <button className="menu-item" style={{ width: '100%', marginBottom: 10 }} onClick={onSettings}>
          {t.pause.settings}
        </button>
        <button className="menu-item" style={{ width: '100%' }} onClick={onExit}>
          {t.pause.toMenu}
        </button>
      </div>
    </div>
  );
}
