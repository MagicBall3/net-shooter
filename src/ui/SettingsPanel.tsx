import { t } from './strings';

interface Props {
  settings: any;
  onChange: (s: any) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onChange, onClose }: Props) {
  return (
    <div className="screen screen--menu" style={{ zIndex: 60 }}>
      <div style={{ background: 'rgba(0,0,0,0.85)', padding: 32, borderRadius: 10, textAlign: 'center', minWidth: 300 }}>
        <h2 style={{ color: '#fff', marginBottom: 20 }}>{t.settings.title}</h2>
        <div style={{ textAlign: 'left', marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#ccc' }}>{t.settings.sensitivity}</label>
          <input
            type="range" min="0.3" max="2.5" step="0.1"
            value={settings.sensitivity}
            onChange={(e) => onChange({ ...settings, sensitivity: parseFloat(e.target.value) })}
          />
        </div>
        <div style={{ textAlign: 'left', marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#ccc' }}>{t.settings.volume}</label>
          <input
            type="range" min="0" max="1" step="0.05"
            value={settings.masterVolume}
            onChange={(e) => onChange({ ...settings, masterVolume: parseFloat(e.target.value) })}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ccc', cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.invertY} onChange={(e) => onChange({ ...settings, invertY: e.target.checked })} />
            {t.settings.invertY}
          </label>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ccc', cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.headBob} onChange={(e) => onChange({ ...settings, headBob: e.target.checked })} />
            {t.settings.headBob}
          </label>
        </div>
        <div>
          <select
            value={settings.quality}
            onChange={(e) => onChange({ ...settings, quality: e.target.value })}
            style={{ padding: 8, background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: 6 }}
          >
            <option value="low">{t.settings.qualityOptions.low}</option>
            <option value="medium">{t.settings.qualityOptions.medium}</option>
            <option value="high">{t.settings.qualityOptions.high}</option>
          </select>
          <p style={{ fontSize: 0.85, color: '#888', marginTop: 6 }}>{t.settings.qualityNote}</p>
        </div>
        <button className="menu-item" style={{ width: '100%', marginTop: 12 }} onClick={onClose}>
          {t.settings.back}
        </button>
      </div>
    </div>
  );
}
