import type { ThemeConfig, ThemeMode, TokenMap } from './types/theme';

/**
 * Applying design tokens to the editor.
 */

/** The SDK's own localStorage key. Sharing it keeps us from ever disagreeing. */
const STORAGE_KEY = 'wb-theme';

/** Every property we have written, so revert never touches SDK-owned values. */
const owned = new Set<string>();

/** Live edits from the Config Studio, layered over the profile's maps. */
const overrides: Record<'base' | ThemeMode, TokenMap> = { base: {}, light: {}, dark: {} };

let current: { theme: ThemeConfig; mode: ThemeMode } | null = null;

export const readMode = (): ThemeMode => {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
};

const resolve = (theme: ThemeConfig, mode: ThemeMode): TokenMap => {
  return {
    ...theme.base,
    ...theme[mode],
    ...overrides.base,
    ...overrides[mode],
  };
};

export const applyTheme = (theme: ThemeConfig, mode: ThemeMode = readMode()): void => {
  current = { theme, mode };
  const root = document.documentElement;
  const next = resolve(theme, mode);

  // Drop tokens we own that the incoming map no longer sets (profile/mode swap).
  for (const name of [...owned]) {
    if (!(name in next)) {
      root.style.removeProperty(name);
      owned.delete(name);
    }
  }
  for (const [name, value] of Object.entries(next)) {
    root.style.setProperty(name, value);
    owned.add(name);
  }
};

export const setTokenOverride = (token: string, value: string, bucket: 'base' | 'mode'): void => {
  const target = bucket === 'base' ? overrides.base : overrides[readMode()];
  target[token] = value;
  document.documentElement.style.setProperty(token, value);
  owned.add(token);
};

export const clearTokenOverride = (token: string, bucket: 'base' | 'mode'): void => {
  const target = bucket === 'base' ? overrides.base : overrides[readMode()];
  delete target[token];
  if (current) applyTheme(current.theme, current.mode);
};

export const resetAllOverrides = (): void => {
  overrides.base = {};
  overrides.light = {};
  overrides.dark = {};
  if (current) applyTheme(current.theme, current.mode);
};

export const hasOverrides = (): boolean => {
  return (
    Object.keys(overrides.base).length +
      Object.keys(overrides.light).length +
      Object.keys(overrides.dark).length >
    0
  );
};

/** Reads the value actually in effect, so controls can show the live number. */
export const readToken = (token: string): string => {
  const inline = document.documentElement.style.getPropertyValue(token);
  if (inline) return inline.trim();
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
};

export const exportThemePatch = (): Pick<ThemeConfig, 'base' | 'light' | 'dark'> => {
  const theme = current?.theme;
  return {
    base: { ...(theme?.base ?? {}), ...overrides.base },
    light: { ...(theme?.light ?? {}), ...overrides.light },
    dark: { ...(theme?.dark ?? {}), ...overrides.dark },
  };
};

export const watchThemeMode = (onChange: (mode: ThemeMode) => void): (() => void) => {
  let last = readMode();
  const observer = new MutationObserver(() => {
    const mode = readMode();
    if (mode !== last) {
      last = mode;
      onChange(mode);
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
};

export const setMode = (mode: ThemeMode): void => {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.theme = mode;
};
