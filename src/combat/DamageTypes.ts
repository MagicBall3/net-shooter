export interface DamageEvent {
  target: string;
  attacker: string;
  damage: number;
  position: { x: number; y: number; z: number };
  timestamp: number;
}
