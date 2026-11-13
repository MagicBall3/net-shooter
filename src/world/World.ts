import * as THREE from 'three';
import type { GameModule } from '../core/types';

/** Процедуральные текстуры без внешних файлов (рисуются на canvas). */
function makeGridTexture(size = 256, cell = 32, color1 = 0x222222, color2 = 0x333333): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c1 = `#${color1.toString(16).padStart(6, '0')}`;
  const c2 = `#${color2.toString(16).padStart(6, '0')}`;
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = c2;
  for (let i = 0; i < size; i += cell) {
    ctx.fillRect(i, 0, 2, size);
    ctx.fillRect(0, i, size, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeBrickTexture(size = 256): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#4a3f35';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#5a4e44';
  const brickH = size / 4;
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 === 0 ? 0 : size / 4;
    for (let x = offset; x < size; x += size / 2) {
      ctx.fillRect(x, row * brickH, size / 2 - 4, brickH - 4);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Простой уровень для шутера: пол и несколько коробок-укрытий.
 * Все объекты имеют коллизию (простая проверка по AABB).
 */
export class World implements GameModule {
  readonly group = new THREE.Group();
  readonly colliders: THREE.Box3[] = [];

  constructor() {
    // Пол с текстурой сетки
    const floorTex = makeGridTexture(256, 32, 0x2a2a2a, 0x3a3a3a);
    floorTex.repeat.set(15, 15);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, metalness: 0.1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Стены/укрытия с кирпичной текстурой
    const coverMaterial = new THREE.MeshStandardMaterial({ map: makeBrickTexture(), roughness: 0.9, metalness: 0.1 });
    const covers: [number, number, number][] = [
      [0, 0, 0],
      [7, 0, 4],
      [-7, 0, -4],
      [11, 0, -8],
      [-11, 0, 8],
      [0, 0, -12],
      [9, 0, 2],
      [-9, 0, -6],
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
      [-30, 1.5, 0, 1, 3, 30],
      [30, 1.5, 0, 1, 3, 30],
      [0, 1.5, -30, 60, 3, 1],
      [0, 1.5, 30, 60, 3, 1],
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

  /** Простое оружие от первого лица (куб в нижнем углу экрана). */
  addWeapon(mesh: THREE.Mesh): void {
    this.group.add(mesh);
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
