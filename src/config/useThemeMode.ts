import { useSyncExternalStore } from 'react';

import { readMode, watchThemeMode } from './theme';

/**
 * The active light/dark mode, as a React value.
 *
 * `watchThemeMode` observes the `data-theme` attribute rather than a store,
 * because the SDK keeps its mode in a hand-rolled subscriber Set — there is
 * nothing to select. Wrapping it in `useSyncExternalStore` means the app bar's
 * switch and the Studio both follow our toggle and the SDK's own.
 */
export const useThemeMode = () => {
  return useSyncExternalStore(
    (onChange) => watchThemeMode(() => onChange()),
    () => readMode(),
  );
};
