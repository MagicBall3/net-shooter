import type { InputFrame } from './InputTypes';
import { type InputSource } from './InputTypes';

/** Упрощённое тач-управление (обновляется из TouchOverlay). */
export class TouchControls implements InputSource {
  moveForward = 0;
  moveRight = 0;
  lookX = 0;
  lookY = 0;
  run = false;
  shoot = false;

  attach(): void {}
  detach(): void {}
  reset(): void {
    this.moveForward = 0;
    this.moveRight = 0;
    this.lookX = 0;
    this.lookY = 0;
    this.run = false;
    this.shoot = false;
  }

  poll(frame: InputFrame): void {
    frame.moveForward = this.moveForward;
    frame.moveRight = this.moveRight;
    frame.lookX = this.lookX;
    frame.lookY = this.lookY;
    frame.run = this.run;
    frame.shoot = this.shoot;
    this.lookX = 0;
    this.lookY = 0;
    this.shoot = false;
  }
}
