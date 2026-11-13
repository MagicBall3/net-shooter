import { useCallback, useRef } from 'react';
import { TouchControls } from '../controls/TouchControls';
import { t } from './strings';

interface Props {
  controls: TouchControls;
  onPause: () => void;
}

/** Виртуальные кнопки для телефона: джойстик слева, обзор и стрельба справа. */
export function TouchOverlay({ controls, onPause }: Props) {
  const lookStart = useRef<{ x: number; y: number } | null>(null);

  // Джойстик (левая половина)
  const joyRef = useRef<HTMLDivElement>(null);
  const joyKnobRef = useRef<HTMLDivElement>(null);
  const joyCenter = useRef({ x: 0, y: 0 });
  const joyActive = useRef(false);
  const JOY_R = 40;

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
      return { dx, dy, cx, cy };
    },
    []
  );

  const onJoyStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      if (touch.clientX < window.innerWidth / 2) {
        joyActive.current = true;
        const { dx, dy, cx, cy } = getJoyPos(touch.clientX, touch.clientY);
        joyCenter.current = { x: cx, y: cy };
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

      const max = JOY_R;
      controls.moveForward = -dy / max;
      controls.moveRight = dx / max;
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

  const HALF = window.innerWidth / 2;

  const onLookStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch.clientX >= HALF) {
        lookStart.current = { x: touch.clientX, y: touch.clientY };
      }
    },
    [HALF]
  );

  const onLookMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch.clientX < HALF || !lookStart.current) return;
      const dx = touch.clientX - lookStart.current.x;
      const dy = touch.clientY - lookStart.current.y;
      controls.lookX += dx * 0.6;
      controls.lookY += dy * 0.6;
      lookStart.current = { x: touch.clientX, y: touch.clientY };
    },
    [HALF]
  );

  const onLookEnd = useCallback(() => {
    lookStart.current = null;
  }, []);

  const onShootStart = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    controls.shoot = true;
  }, []);

  const onShootEnd = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    controls.shoot = false;
  }, []);

  const onRunStart = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    controls.run = true;
  }, []);

  const onRunEnd = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    controls.run = false;
  }, []);

  return (
    <div
      className="touch-overlay"
      onTouchStart={onLookStart}
      onTouchMove={onLookMove}
      onTouchEnd={onLookEnd}
    >
      <div
        ref={joyRef}
        className="touch-joystick-base"
        onTouchStart={onJoyStart}
        onTouchMove={onJoyMove}
        onTouchEnd={onJoyEnd}
      >
        <div ref={joyKnobRef} className="touch-joystick-knob" />
      </div>

      <button
        className="touch-btn touch-shoot"
        onTouchStart={onShootStart}
        onTouchEnd={onShootEnd}
      >
        {t.game.shoot}
      </button>

      <button
        className="touch-btn touch-run"
        onTouchStart={onRunStart}
        onTouchEnd={onRunEnd}
      >
        {t.game.run}
      </button>

      <button className="touch-btn touch-pause" onClick={onPause}>
        {t.game.pause}
      </button>
    </div>
  );
}
