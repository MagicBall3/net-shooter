import * as THREE from 'three';
import type { RemotePlayerState } from './protocol';
import { RemotePlayer } from './RemotePlayer';

const COLORS = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];

/** Хранит всех удалённых игроков, применяет снимки состояний сервера. */
export class RemotePlayerManager {
  private players = new Map<string, RemotePlayer>();
  private colorIndex = 0;

  readonly group = new THREE.Group();

  get all(): RemotePlayer[] {
    return Array.from(this.players.values());
  }

  get size(): number {
    return this.players.size;
  }

  spawn(state: RemotePlayerState): RemotePlayer {
    if (this.players.has(state.id)) {
      this.players.get(state.id)!.setTarget(state);
      return this.players.get(state.id)!;
    }
    const color = COLORS[this.colorIndex % COLORS.length];
    this.colorIndex += 1;
    const player = new RemotePlayer(state.id, state.name, state, color);
    this.players.set(state.id, player);
    this.group.add(player.mesh());
    return player;
  }

  despawn(id: string): void {
    const player = this.players.get(id);
    if (!player) return;
    this.group.remove(player.mesh());
    player.dispose();
    this.players.delete(id);
  }

  get(id: string): RemotePlayer | undefined {
    return this.players.get(id);
  }

  /** Применяет снимок состояний от сервера. */
  applySnapshot(players: RemotePlayerState[], meId: string): void {
    const seen = new Set<string>();
    for (const state of players) {
      seen.add(state.id);
      if (state.id === meId) continue;
      const existing = this.players.get(state.id);
      if (existing) {
        existing.setTarget(state);
      } else {
        this.spawn(state);
      }
    }
    // Удаляем игроков, которых больше нет на сервере
    for (const id of this.players.keys()) {
      if (!seen.has(id)) {
        this.despawn(id);
      }
    }
  }

  update(dt: number, camera: THREE.Camera): void {
    for (const player of this.all) {
      player.interpolate(dt);
      player.lookAtCamera(camera);
    }
  }

  dispose(): void {
    for (const player of this.all) player.dispose();
    this.players.clear();
  }
}
