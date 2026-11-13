let ctx: AudioContext | null = null;
let gain: GainNode | null = null;

export const audio = {
  start(): void {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      gain = ctx.createGain();
      gain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
  },
  setVolume(v: number): void {
    if (gain) gain.gain.value = Math.max(0, Math.min(1, v));
  },
  resume(): void {
    if (ctx?.state === 'suspended') void ctx.resume();
  },
  suspend(): void {
    if (ctx?.state === 'running') void ctx.suspend();
  },
};
