import { t } from './strings';

interface Props {
  onResume: () => void;
  onSettings: () => void;
  onExit: () => void;
}

export function PauseMenu({ onResume, onSettings, onExit }: Props) {
  return (
    <div className="screen screen--menu" style={{ zIndex: 60 }}>
      <div style={{ background: 'rgba(0,0,0,0.7)', padding: 32, borderRadius: 10, textAlign: 'center', minWidth: 260 }}>
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
