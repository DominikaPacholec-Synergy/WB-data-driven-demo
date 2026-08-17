import { useSyncExternalStore } from 'react';

/**
 * A ~20-line hash router.
 *
 * Three views do not justify `react-router-dom`, and a hash needs no server
 * rewrite rules — which matters because the demo is also served by
 * `vite preview`. It still gives linkable URLs for the article's screenshots.
 *
 * Route ids come from `profile.chrome.nav`, so even the navigation is config.
 */

function read(): string {
  return window.location.hash.replace(/^#\/?/, '') || 'builder';
}

/** Module scope: `useSyncExternalStore` re-subscribes when this identity changes. */
function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function navigate(route: string): void {
  window.location.hash = `#/${route}`;
}

export function useHashRoute(): string {
  return useSyncExternalStore(subscribe, read, () => 'builder');
}
