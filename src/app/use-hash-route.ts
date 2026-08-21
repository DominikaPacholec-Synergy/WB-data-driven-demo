import { useSyncExternalStore } from 'react';

/**
 * Route ids come from `profile.chrome.nav`, so even the navigation is config.
 */

const read = (): string => {
  return window.location.hash.replace(/^#\/?/, '') || 'builder';
};

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

export const navigate = (route: string): void => {
  window.location.hash = `#/${route}`;
};

export const useHashRoute = (): string => {
  return useSyncExternalStore(subscribe, read, () => 'builder');
};
