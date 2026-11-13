import * as THREE from 'three';
import type { NetworkManager } from '../network/NetworkManager';
import type { RemotePlayerManager } from '../network/RemotePlayerManager';

export interface WeaponConfig {
  /** Дальность выстрела, м. */
  range: number;
  /** Урон за выстрел. */
  damage: number;
  /** Кадров в секунду (огневая скорость). */
  fireRate: number;
}

/** Hitscan-оружие: мгновенный луч от камеры, урон по удалённым игрокам. */
export class Weapon {
  private readonly raycaster = new THREE.Raycaster();
  private readonly direction = new THREE.Vector3();
  private readonly origin = new THREE.Vector3();

  private lastFire = 0;
  private shooting = false;

  constructor(
    private readonly camera: THREE.Camera,
    private readonly config: WeaponConfig,
    private readonly network: NetworkManager,
    private readonly remotePlayers: RemotePlayerManager,
    public myId: string,
  ) {}

  startShooting(): void {
    this.shooting = true;
  }

  stopShooting(): void {
    this.shooting = false;
  }

  /** Вызывается каждый кадр. Автоматически регулирует частоту огня. */
  update(now: number): void {
    if (!this.shooting) return;
    const interval = 1000 / this.config.fireRate;
    if (now - this.lastFire < interval) return;
    this.lastFire = now;
    this.fire();
  }

  private fire(): void {
    this.origin.copy(this.camera.position);
    this.camera.getWorldDirection(this.direction);
    this.raycaster.set(this.origin, this.direction);
    this.raycaster.far = this.config.range;

    const targets: THREE.Object3D[] = [];
    for (const player of this.remotePlayers.all) {
      targets.push(player.mesh());
    }

    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length > 0) {
      // Находим ближайшего игрока, чей меш был struck
      let hitPlayer: ReturnType<typeof this.remotePlayers.get> | null = null;
      for (const hit of hits) {
        const player = this.findPlayerByMesh(hit.object);
        if (player && player.id !== this.myId) {
          hitPlayer = player;
          break;
        }
      }

      if (hitPlayer) {
        const hitPoint = hits[0].point;
        this.network.sendDamage(hitPlayer.id, this.myId, this.config.damage, hitPoint.x, hitPoint.y, hitPoint.z);
      }
    }
  }

  private findPlayerByMesh(mesh: THREE.Object3D): ReturnType<typeof this.remotePlayers.get> | null {
    let node: THREE.Object3D | null = mesh;
    while (node) {
      for (const player of this.remotePlayers.all) {
        if (player.mesh() === node) return player;
      }
      node = node.parent;
    }
    return null;
  }

  dispose(): void {}
}
