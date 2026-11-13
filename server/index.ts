import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type {
  NetworkMessage,
  JoinRequest,
  JoinAccept,
  JoinReject,
  PlayerJoin,
  PlayerLeave,
  InputState,
  StateSnapshot,
  DamageEvent,
  SpawnMessage,
  RemotePlayerState,
} from '../src/network/protocol';

const PORT = Number(process.env.PORT ?? 8787);
const STATE_INTERVAL = 1000 / 20; // 20 Гц рассылка состояний
const SPAWN_POINTS: { x: number; y: number; z: number; yaw: number }[] = [
  { x: 0, y: 1.65, z: 0, yaw: 0 },
  { x: 8, y: 1.65, z: 4, yaw: Math.PI },
  { x: -8, y: 1.65, z: -4, yaw: 0 },
  { x: 0, y: 1.65, z: -10, yaw: Math.PI / 2 },
];

interface Player {
  id: string;
  name: string;
  ws: WebSocket;
  room: string;
  state: RemotePlayerState;
  lastInput: number;
}

const rooms = new Map<string, Map<string, Player>>();
const players = new Map<WebSocket, Player>();

function getRoom(room: string): Map<string, Player> {
  let r = rooms.get(room);
  if (!r) {
    r = new Map();
    rooms.set(room, r);
  }
  return r;
}

function broadcast(room: string, msg: NetworkMessage, except?: WebSocket): void {
  const data = JSON.stringify(msg);
  for (const [ws] of players) {
    if (ws === except) continue;
    const p = players.get(ws)!;
    if (p.room !== room) continue;
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

function snapshot(room: string): StateSnapshot {
  const r = getRoom(room);
  return {
    t: 'state',
    ts: Date.now(),
    players: Array.from(r.values()).map((p) => p.state),
  };
}

function handleJoin(ws: WebSocket, msg: JoinRequest): void {
  const p: Player = {
    id: crypto.randomUUID(),
    name: msg.name,
    ws,
    room: msg.room,
    state: {
      id: crypto.randomUUID(),
      name: msg.name,
      ...SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)],
      health: 100,
    },
    lastInput: Date.now(),
  };
  // Перезапишем id на тот, который мы назначили (в профиле clientside id совпадает)
  p.state.id = p.id;
  players.set(ws, p);
  getRoom(msg.room).set(p.id, p);

  const others = Array.from(getRoom(msg.room).values()).filter((x) => x.id !== p.id);
  const accept: JoinAccept = {
    t: 'join_accept',
    ts: Date.now(),
    id: p.id,
    me: p.state,
    players: [p.state, ...others.map((o) => o.state)],
  };
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(accept));

  // Сообщаем остальным о новом игроке
  const join: PlayerJoin = {
    t: 'player_join',
    ts: Date.now(),
    id: p.id,
    name: p.name,
    ...p.state,
  };
  broadcast(msg.room, join, ws);
}

function handleLeave(ws: WebSocket): void {
  const p = players.get(ws);
  if (!p) return;
  getRoom(p.room).delete(p.id);
  if (getRoom(p.room).size === 0) rooms.delete(p.room);
  players.delete(ws);

  const leave: PlayerLeave = { t: 'player_leave', ts: Date.now(), id: p.id };
  broadcast(p.room, leave);
}

function handleInput(ws: WebSocket, msg: InputState): void {
  const p = players.get(ws);
  if (!p) return;
  const now = Date.now();
  const dt = Math.max(now - p.lastInput, 0) / 1000;
  p.lastInput = now;

  const cfg = { walkSpeed: 3, runSpeed: 5.5 };
  const speed = msg.run ? cfg.runSpeed : cfg.walkSpeed;
  const f = msg.moveForward;
  const r = msg.moveRight;
  const sin = Math.sin(p.state.yaw);
  const cos = Math.cos(p.state.yaw);
  const dx = (-sin * f + cos * r) * speed * dt;
  const dz = (-cos * f - sin * r) * speed * dt;

  // Ограничим движение área уровня (±20)
  p.state.x = Math.max(-19, Math.min(19, p.state.x + dx));
  p.state.z = Math.max(-19, Math.min(19, p.state.z + dz));
  p.state.yaw += msg.lookX * 0.0022;
  p.state.health = Math.max(0, p.state.health);
}

function handleDamage(ws: WebSocket, msg: DamageEvent): void {
  const attacker = players.get(ws);
  if (!attacker) return;
  const room = getRoom(attacker.room);
  const target = room.get(msg.target);
  if (!target) return;

  const actual = target.health.take(msg.damage);
  target.state.health = target.health.value;

  // Рассылаем урон всем в комнате
  const dmg: DamageEvent = {
    t: 'damage',
    ts: Date.now(),
    target: msg.target,
    attacker: attacker.id,
    damage: actual,
    x: target.state.x,
    y: target.state.y,
    z: target.state.z,
  };
  broadcast(attacker.room, dmg);

  // Если мёртв — респаун
  if (target.health.isDead()) {
    target.health.value = 100;
    target.state.health = 100;
    const sp = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
    target.state.x = sp.x;
    target.state.y = sp.y;
    target.state.z = sp.z;
    target.state.yaw = sp.yaw;

    const spawn: SpawnMessage = {
      t: 'spawn',
      ts: Date.now(),
      id: target.id,
      name: target.name,
      ...sp,
      health: 100,
    };
    broadcast(attacker.room, spawn);
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as NetworkMessage;
      switch (msg.t) {
        case 'join':
          handleJoin(ws, msg as JoinRequest);
          break;
        case 'input':
          handleInput(ws, msg as InputState);
          break;
        case 'damage':
          handleDamage(ws, msg as DamageEvent);
          break;
        default:
          break;
      }
    } catch {
      // игнорируем битые сообщения
    }
  });

  ws.on('close', () => handleLeave(ws));
  ws.on('error', () => handleLeave(ws));
});

// Рассылка состояний 20 Гц
setInterval(() => {
  for (const [room, r] of rooms) {
    if (r.size === 0) continue;
    const snap = snapshot(room);
    const data = JSON.stringify(snap);
    for (const [ws, p] of players) {
      if (p.room !== room) continue;
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    }
  }
}, STATE_INTERVAL);

console.log(`Net Shooter server listening on ws://localhost:${PORT}`);
