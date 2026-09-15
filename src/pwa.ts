export function registerPwa(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('VELYQUA offline shell is unavailable:', error instanceof Error ? error.message : String(error));
    });
  }, { once: true });
}
