export type GamePhase = 'loading' | 'menu' | 'multiplayer' | 'playing' | 'paused';
export type QualityLevel = 'low' | 'medium' | 'high';

export interface Settings {
  sensitivity: number;
  masterVolume: number;
  quality: QualityLevel;
  invertY: boolean;
  headBob: boolean;
}

export interface GameEvents {
  onPrompt(text: string | null): void;
  onMessage(text: string): void;
  onLockLost(): void;
}

export interface CollisionQuery {
  isBlocked(x: number, z: number, radius: number): boolean;
  getBounds(y: number): { floor: number; ceiling: number };
}

export interface InputFrame {
  moveForward: number;
  moveRight: number;
  lookX: number;
  lookY: number;
  run: boolean;
  interact: boolean;
  shoot: boolean;
}

export interface InputSource {
  attach(): void;
  detach(): void;
  reset(): void;
  poll(frame: InputFrame): void;
}

export interface GameModule {
  update(dt: number, elapsed: number): void;
  dispose(): void;
}

export interface InputFrame {
  moveForward: number;
  moveRight: number;
  lookX: number;
  lookY: number;
  run: boolean;
  interact: boolean;
  shoot: boolean;
}

export interface InputSource {
  attach(): void;
  detach(): void;
  reset(): void;
  poll(frame: InputFrame): void;
}
