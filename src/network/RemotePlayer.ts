import * as THREE from 'three';
import type { RemotePlayerState } from './protocol';

/** Один удалённый игрок: меш, нейнтэг над головой, интерполяция позиции. */
export class RemotePlayer {
  readonly id: string;
  readonly name: string;

  private readonly group = new THREE.Group();
  private readonly body: THREE.Mesh;
  private readonly head: THREE.Mesh;
  private readonly nameSprite: THREE.Sprite;

  /** Целевое состояние, полученное от сервера (для интерполяции). */
  private target: RemotePlayerState | null = null;
  /** Текущее интерполированное состояние. */
  readonly state: RemotePlayerState;

  constructor(id: string, name: string, spawn: RemotePlayerState, color: number) {
    this.id = id;
    this.name = name;
    this.state = { ...spawn };

    // Тело игрока (капсула упрощённо — коробка)
    this.body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.6, 0.5),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2 }),
    );
    this.body.position.y = 0.8;
    this.body.castShadow = true;
    this.group.add(this.body);

    // Голова
    this.head = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xddaa88, roughness: 0.8, metalness: 0 }),
    );
    this.head.position.y = 1.8;
    this.head.castShadow = true;
    this.group.add(this.head);

    // Нейнтэг над головой
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 256;
    nameCanvas.height = 64;
    const ctx = nameCanvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 20, 256, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, 128, 46);

    const texture = new THREE.CanvasTexture(nameCanvas);
    this.nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    this.nameSprite.scale.set(2.4, 0.6, 1);
    this.nameSprite.position.set(0, 2.3, 0);
    this.group.add(this.nameSprite);

    this.applyTransform(spawn);
  }

  readonly mesh = (): THREE.Group => this.group;

  /** Сервер прислал новое целевое состояние. */
  setTarget(state: RemotePlayerState): void {
    this.target = state;
  }

  /** Интерполяция к целевому состоянию. */
  interpolate(dt: number): void {
    if (!this.target) return;
    const k = Math.min(1, dt * 12); // скорость сближения
    this.state.x += (this.target.x - this.state.x) * k;
    this.state.y += (this.target.y - this.state.y) * k;
    this.state.z += (this.target.z - this.state.z) * k;
    this.state.yaw += this.shortestAngleDiff(this.state.yaw, this.target.yaw) * k;
    this.state.health = this.target.health;
    this.applyTransform(this.state);
  }

  private shortestAngleDiff(from: number, to: number): number {
    let d = to - from;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  private applyTransform(s: RemotePlayerState): void {
    this.group.position.set(s.x, s.y, s.z);
    this.group.rotation.y = s.yaw;
    // нейнтэг всегда смотрит на камеру
    this.nameSprite.rotation.y = 0;
  }

  /** Поворачивает нейнтэг к каждым кадру к камере (billboard). */
  lookAtCamera(camera: THREE.Camera): void {
    this.nameSprite.lookAt(camera.position);
  }

  dispose(): void {
    this.group.remove(this.body);
    this.group.remove(this.head);
    this.group.remove(this.nameSprite);
    (this.body.material as THREE.Material).dispose();
    (this.head.material as THREE.Material).dispose();
    (this.nameSprite.material as THREE.SpriteMaterial).map?.dispose();
    (this.nameSprite.material as THREE.Material).dispose();
    this.body.geometry.dispose();
    this.head.geometry.dispose();
  }
}
