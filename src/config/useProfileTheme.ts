import { useEffect } from 'react';
import { applyTheme, setMode, watchThemeMode } from './theme';
import type { ThemeConfig } from './types';

/**
 * Applies a profile's tokens and keeps them in sync with whoever flips
 * `data-theme` — our own toggle or the SDK's.
 *
 * The profile's `defaultMode` deliberately wins over the stored preference: a
 * profile describes a complete look, and light-vs-dark is part of it. A manual
 * toggle still overrides for as long as that profile stays loaded.
 *
 * We do not clear tokens on unmount: `applyTheme` already diffs and removes
 * stale keys, and clearing would flash the SDK's default palette for one frame
 * during a swap.
 */
export const useProfileTheme = (theme: ThemeConfig | undefined): void => {
  useEffect(() => {
    if (!theme) return;
    setMode(theme.defaultMode);
    applyTheme(theme, theme.defaultMode);
    return watchThemeMode((mode) => applyTheme(theme, mode));
  }, [theme]);
};
