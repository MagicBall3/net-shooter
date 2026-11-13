/** Протокол общения клиента с вебсокет-сервером. */

export type MsgType =
  | 'join'
  | 'join_accept'
  | 'join_reject'
  | 'player_join'
  | 'player_leave'
  | 'input'
  | 'state'
  | 'spawn'
  | 'damage'
  | 'pong';

export interface BaseMessage { t: MsgType; ts: number; }

export interface JoinRequest extends BaseMessage {
  t: 'join';
  room: string;
  name: string;
}

export interface JoinAccept extends BaseMessage {
  t: 'join_accept';
  id: string;
  me: RemotePlayerState;
  players: RemotePlayerState[];
}

export interface JoinReject extends BaseMessage {
  t: 'join_reject';
  reason: string;
}

export interface PlayerJoin extends BaseMessage {
  t: 'player_join';
  id: string;
  name: string;
  x: number; y: number; z: number; yaw: number; health: number;
}

export interface PlayerLeave extends BaseMessage {
  t: 'player_leave';
  id: string;
}

export interface InputState extends BaseMessage {
  t: 'input';
  id: string;
  seq: number;
  moveForward: number;
  moveRight: number;
  lookX: number;
  lookY: number;
  run: boolean;
  shoot: boolean;
}

export interface StateSnapshot extends BaseMessage {
  t: 'state';
  players: RemotePlayerState[];
}

export interface DamageEvent extends BaseMessage {
  t: 'damage';
  target: string;
  attacker: string;
  damage: number;
  x: number; y: number; z: number;
}

export interface SpawnMessage extends BaseMessage {
  t: 'spawn';
  id: string;
  name: string;
  x: number; y: number; z: number; yaw: number; health: number;
}

export interface RemotePlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  health: number;
}

export type NetworkMessage =
  | JoinRequest
  | JoinAccept
  | JoinReject
  | PlayerJoin
  | PlayerLeave
  | InputState
  | StateSnapshot
  | DamageEvent
  | SpawnMessage;
