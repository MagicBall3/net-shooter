import type { InputFrame, InputSource } from '../core/types';

export function createInputFrame(): InputFrame {
  return {
    moveForward: 0,
    moveRight: 0,
    lookX: 0,
    lookY: 0,
    run: false,
    interact: false,
    shoot: false,
  };
}

export { InputFrame, InputSource };
