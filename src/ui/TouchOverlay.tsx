import { useCallback, useRef } from 'react';
import { TouchControls } from '../controls/TouchControls';
import { t } from './strings';

interface Props {
  controls: TouchControls;
  onPause: () => void;
}

/** Виртуальные кнопки для телефона: джойстик слева-снизу, обзор справа, acción-кнопки справа-снизу. */
export function TouchOverlay({ controls, onPause }: Props) {
  const lookStart = useRef<{ x: number; y: number } | null>(null);

  // Джойстик (левая нижняя часть)
  const joyRef = useRef<HTMLDivElement>(null);
  const joyKnobRef = useRef<HTMLDivElement>(null);
  const joyActive = useRef(false);
  const JOY_R = 44;

  const getJoyPos = useCallback(
    (clientX: number, clientY: number) => {
      const rect = joyRef.current!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > JOY_R) {
        dx = (dx / dist) * JOY_R;
        dy = (dy / dist) * JOY_R;
      }
      return { dx, dy };
    },
    []
  );

  const onJoyStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      // Джойстик только в левой половине экрана
      if (touch.clientX < window.innerWidth * 0.45) {
        joyActive.current = true;
        const { dx, dy } = getJoyPos(touch.clientX, touch.clientY);
        joyKnobRef.current!.style.transform = `translate(${dx}px, ${dy}px)`;
        controls.moveForward = 0;
        controls.moveRight = 0;
      }
    },
    [getJoyPos]
  );

  const onJoyMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!joyActive.current) return;
      const touch = e.touches[0];
      const { dx, dy } = getJoyPos(touch.clientX, touch.clientY);
      joyKnobRef.current!.style.transform = `translate(${dx}px, ${dy}px)`;
      controls.moveForward = -dy / JOY_R;
      controls.moveRight = dx / JOY_R;
    },
    [getJoyPos]
  );

  const onJoyEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    joyActive.current = false;
    joyKnobRef.current!.style.transform = `translate(0px, 0px)`;
    controls.moveForward = 0;
    controls.moveRight = 0;
  }, []);

  // Обзор — правая половина экрана (кроме кнопок)
  const onLookStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch.clientX > window.innerWidth * 0.5) {
        lookStart.current = { x: touch.clientX, y: touch.clientY };
      }
    },
    []
  );

  const onLookMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!lookStart.current || touch.clientX < window.innerWidth * 0.5) return;
      const dx = touch.clientX - lookStart.current.x;
      const dy = touch.clientY - lookStart.current.y;
      controls.lookX += dx * 0.7;
      controls.lookY += dy * 0.7;
      lookStart.current = { x: touch.clientX, y: touch.clientY };
    },
    []
  );

  const onLookEnd = useCallback(() => {
    lookStart.current = null;
  }, []);

  const buttonHandlers = (set: (v: boolean) => void) => ({
    onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      set(true);
    },
    onTouchEnd: (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      set(false);
    },
  });

  const shootHandlers = buttonHandlers((v) => (controls.shoot = v));
  const runHandlers = buttonHandlers((v) => (controls.run = v));

  return (
    <div
      className="touch-overlay"
      onTouchStart={onLookStart}
      onTouchMove={onLookMove}
      onTouchEnd={onLookEnd}
    >
      {/* Джойстик слева-снизу */}
      <div
        ref={joyRef}
        className="touch-joystick-base"
        onTouchStart={onJoyStart}
        onTouchMove={onJoyMove}
        onTouchEnd={onJoyEnd}
      >
        <div ref={joyKnobRef} className="touch-joystick-knob" />
      </div>

      {/* Кнопки справа-снизу */}
      <div className="touch-buttons">
        <button className="touch-btn touch-shoot" {...shootHandlers}>
          {t.game.shoot}
        </button>
        <button className="touch-btn touch-run" {...runHandlers}>
          {t.game.run}
        </button>
        <button className="touch-btn touch-pause" onClick={onPause}>
          {t.game.pause}
        </button>
      </div>
    </div>
  );
}
