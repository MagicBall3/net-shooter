interface Props {
  health: number;
  maxHealth: number;
  ammo?: { current: number; total: number };
}

export function HUD({ health, maxHealth, ammo }: Props) {
  const ratio = Math.max(0, Math.min(1, health / maxHealth));
  return (
    <div className="hud" aria-live="polite">
      <div className="crosshair" />
      <div className="health-panel">
        <div className="health-label">Здоровье</div>
        <div className="health-bar">
          <div className="health-fill" style={{ width: `${ratio * 100}%` }} />
        </div>
        <div className="health-value">{Math.max(0, Math.round(health))} / {maxHealth} HP</div>
      </div>
      {ammo && (
        <div className="ammo-panel">
          <span>{ammo.current}</span> <span className="ammo-sep">/</span> <span>{ammo.total}</span>
        </div>
      )}
    </div>
  );
}
