const SERVICE_WORKER_PATH = '/sw.js';

export function isPwaRegistrationAllowed(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;

  const { protocol, hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  return protocol === 'https:' || isLocalhost;
}

export function registerPwa(): void {
  if (!isPwaRegistrationAllowed()) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .getRegistration(SERVICE_WORKER_PATH)
      .then((existingRegistration) => {
        if (existingRegistration) return;
        return navigator.serviceWorker.register(SERVICE_WORKER_PATH);
      })
      .catch((error: unknown) => {
        console.warn(
          'VELYQUA offline shell is unavailable:',
          error instanceof Error ? error.message : String(error),
        );
      });
  }, { once: true });
}
