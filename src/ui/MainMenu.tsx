import { t } from './strings';

interface Props {
  onSingle: () => void;
  onMultiplayer: () => void;
  onSettings: () => void;
}

export function MainMenu({ onSingle, onMultiplayer, onSettings }: Props) {
  return (
    <main className="screen screen--menu">
      <header>
        <h1 className="title title--flicker">{t.title}</h1>
        <p className="tagline">{t.tagline}</p>
      </header>
      <nav className="menu-list">
        <button className="menu-item" onClick={onSingle}>
          {t.menu.playSingle}
        </button>
        <button className="menu-item" onClick={onMultiplayer}>
          {t.menu.playMultiplayer}
        </button>
        <button className="menu-item" onClick={onSettings}>
          {t.menu.settings}
        </button>
      </nav>
      <p className="version">Версия 0.1, сетевой этап</p>
    </main>
  );
}
