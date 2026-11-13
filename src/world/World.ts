import * as THREE from 'three';
import type { GameModule } from '../core/types';

/**
 * Простой уровень для шутера: пол и несколько коробок-укрытий.
 * Все объекты имеют коллизию (простая проверка по AABB).
 */
export class World implements GameModule {
  readonly group = new THREE.Group();
  readonly colliders: THREE.Box3[] = [];

  constructor() {
    // Пол
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.2 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Стены/укрытия
    const coverMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9, metalness: 0.1 });
    const covers: [number, number, number][] = [
      [0, 0, 0],
      [6, 0, 4],
      [-6, 0, -4],
      [10, 0, -8],
      [-10, 0, 8],
      [0, 0, -12],
    ];

    for (const [x, _y, z] of covers) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 2, 2.5),
        coverMaterial,
      );
      box.position.set(x, 1, z);
      box.castShadow = true;
      box.receiveShadow = true;
      this.group.add(box);

      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(x - 1.25, 0, z - 1.25),
        new THREE.Vector3(x + 1.25, 2, z + 1.25),
      ));
    }

    // Grenzen уровня (невидимые стены по краям)
    const wallBoxes: [number, number, number, number, number, number][] = [
      [-20, 1.5, 0, 1, 3, 20],
      [20, 1.5, 0, 1, 3, 20],
      [0, 1.5, -20, 40, 3, 1],
      [0, 1.5, 20, 40, 3, 1],
    ];
    for (const [x, y, z, w, h, d] of wallBoxes) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      wall.position.set(x, y, z);
      wall.receiveShadow = true;
      this.group.add(wall);
      this.colliders.push(new THREE.Box3(
        new THREE.Vector3(x - w / 2, 0, z - d / 2),
        new THREE.Vector3(x + w / 2, h, z + d / 2),
      ));
    }
  }

  isBlocked(x: number, z: number, radius: number): boolean {
    for (const box of this.colliders) {
      if (x >= box.min.x - radius && x <= box.max.x + radius &&
          z >= box.min.z - radius && z <= box.max.z + radius) {
        return true;
      }
    }
    return false;
  }

  getBounds(_y: number): { floor: number; ceiling: number } {
    return { floor: 0, ceiling: 100 };
  }

  update(): void {}

  dispose(): void {
    for (const child of this.group.children) {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
    }
  }
}
