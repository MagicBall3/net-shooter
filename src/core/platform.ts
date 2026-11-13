export function isTouchDevice(): boolean {
  if (new URLSearchParams(window.location.search).get('touch') === '1') return true;
  return window.matchMedia('(pointer: coarse)').matches;
}

export async function enterImmersive(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch {}
  try {
    const orientation = screen.orientation as unknown as { lock?: (o: string) => Promise<void> };
    await orientation.lock?.('landscape');
  } catch {}
}

export async function leaveImmersive(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {}
}
