import * as THREE from 'three';
import { CONFIG, QUALITY_PRESETS } from './config';
import type { GameModule, QualityLevel } from './types';

/** Рендерер, сцена, камера и игровой цикл. Вызывает update() у модулей по порядку. */
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private readonly modules: GameModule[] = [];
  private quality: QualityLevel;
  private renderScale = 1;
  private width = 1;
  private height = 1;
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;

  constructor(canvas: HTMLCanvasElement, quality: QualityLevel) {
    this.quality = quality;
    this.renderScale = 1;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: QUALITY_PRESETS[quality].antialias,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = CONFIG.lighting.toneMappingExposure;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color(CONFIG.world.fogColor);
    this.scene.fog = new THREE.FogExp2(CONFIG.world.fogColor, CONFIG.world.fogDensity);

    this.camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, CONFIG.camera.near, CONFIG.camera.far);
    this.scene.add(this.camera);
    this.applyPixelRatio();
  }

  addModule(module: GameModule): void {
    this.modules.push(module);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  setQuality(quality: QualityLevel): void {
    this.quality = quality;
    this.applyPixelRatio();
  }

  dispose(): void {
    this.stop();
    for (const mod of this.modules) mod.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private applyPixelRatio(): void {
    const preset = QUALITY_PRESETS[this.quality];
    const ratio = Math.min(window.devicePixelRatio || 1, preset.maxPixelRatio) * this.renderScale;
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(this.width, this.height, false);
  }

  private readonly frame = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.frame);

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(Math.max(rawDt, 0), CONFIG.maxDelta);
    this.elapsed += dt;

    for (const mod of this.modules) mod.update(dt, this.elapsed);
    this.renderer.render(this.scene, this.camera);
  };
}
