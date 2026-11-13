import type { QualityLevel } from './types';

export interface QualityPreset {
  maxPixelRatio: number;
  antialias: boolean;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: { maxPixelRatio: 1, antialias: false },
  medium: { maxPixelRatio: 1.5, antialias: true },
  high: { maxPixelRatio: 2, antialias: true },
};

export const CONFIG = {
  maxDelta: 0.05,
  camera: { fov: 75, near: 0.05, far: 200 },
  world: {
    fogColor: 0x111811,
    fogDensity: 0.015,
    height: 3,
  },
  lighting: {
    hemisphereIntensity: 0.4,
    toneMappingExposure: 1.1,
    pool: { low: 2, medium: 3, high: 4 },
  },
  player: {
    eyeHeight: 1.65,
    radius: 0.3,
    walkSpeed: 3.0,
    runSpeed: 5.5,
    acceleration: 12,
    gravity: 25,
    lookRadPerPixel: 0.0022,
    touchLookScale: 1.6,
    maxPitch: 1.4,
    stepLength: 0.75,
    bobAmplitude: 0.04,
  },
  weapon: {
    range: 60,
    damage: 34,
    fireRate: 9, // выстрелов в секунду
  },
  perf: { slowFrameMs: 24, slowFrameLimit: 60, renderScaleStep: 0.15, minRenderScale: 0.55 },
  save: { key: 'net-shooter:save', version: 1 },
} as const;
