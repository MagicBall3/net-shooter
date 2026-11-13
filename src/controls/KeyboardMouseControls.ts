import type { InputFrame } from './InputTypes';
import { type InputSource } from './InputTypes';

/** Управление на ПК: WASD + мышь (pointer lock), ЛКМ — стрельба. */
export class KeyboardMouseControls implements InputSource {
  private readonly keys = new Set<string>();
  private run = false;
  private shoot = false;
  private pointerLocked = false;

  private readonly onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.run = true;
  };

  private readonly onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.run = false;
  };

  private readonly onMouseMove = (e: MouseEvent) => {
    if (!this.pointerLocked) return;
    this.lookX = e.movementX;
    this.lookY = e.movementY;
  };

  private lookX = 0;
  private lookY = 0;

  private readonly onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) this.shoot = true;
  };

  private readonly onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.shoot = false;
  };

  private readonly onPointerChange = () => {
    this.pointerLocked = document.pointerLockElement === document.body;
  };

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('pointerlockchange', this.onPointerChange);
    document.addEventListener('pointerlockerror', () => {});
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('pointerlockchange', this.onPointerChange);
    document.removeEventListener('pointerlockerror', () => {});
    if (document.pointerLockElement === document.body) {
      document.exitPointerLock();
    }
  }

  reset(): void {
    this.keys.clear();
    this.run = false;
    this.shoot = false;
    this.lookX = 0;
    this.lookY = 0;
  }

  requestLock(): void {
    document.body.requestPointerLock();
  }

  exitLock(): void {
    document.exitPointerLock();
  }

  poll(frame: InputFrame): void {
    frame.moveForward = 0;
    frame.moveRight = 0;
    frame.run = this.run;
    frame.shoot = this.shoot;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) frame.moveForward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) frame.moveForward -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) frame.moveRight -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) frame.moveRight += 1;

    frame.lookX = this.lookX;
    frame.lookY = this.lookY;
    this.lookX = 0;
    this.lookY = 0;
  }
}
