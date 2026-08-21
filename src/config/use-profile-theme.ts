import { useEffect } from 'react';

import { applyTheme, setMode, watchThemeMode } from './theme';
import type { ThemeConfig } from './types/theme';

/*
 *  Applies a profile's tokens and keeps them in sync with whoever flips
 * `data-theme` — our own toggle or the SDK's.
 */

export const useProfileTheme = (theme: ThemeConfig | undefined): void => {
  useEffect(() => {
    if (!theme) return;
    setMode(theme.defaultMode);
    applyTheme(theme, theme.defaultMode);
    return watchThemeMode((mode) => applyTheme(theme, mode));
  }, [theme]);
};
