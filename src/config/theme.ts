import type { ThemeConfig, ThemeMode, TokenMap } from './types';

/**
 * Applying design tokens to the editor.
 *
 * Why inline style on `<html>` and nothing else:
 *
 * 1. The SDK's 174 semantic colour tokens are declared on
 *    `html[data-theme='dark'|'light']` — specificity (0,1,1). A plain `:root {}`
 *    rule in our own stylesheet is (0,1,0) and simply loses. Every token block
 *    in the SDK stylesheet is unlayered, so `@layer` cannot help either.
 *
 * 2. Custom properties are substituted at computed-value time ON THE ELEMENT
 *    THAT DECLARES THEM. The whole chain (`--ax-colors-*` -> `--ax-ui-*` ->
 *    `--ax-public-*` -> `--wb-*`) resolves on `<html>`, so setting a primitive
 *    on a wrapper `<div>` cannot retroactively change anything above it.
 *
 * 3. `body { background-color: var(--wb-background-color) }` and the ReactFlow
 *    pane is transparent — so the canvas background IS the body background, and
 *    body is an ANCESTOR of any wrapper. Unreachable from below.
 *
 * An inline declaration outranks every author rule, is exactly reversible via
 * `removeProperty`, and survives `<Root>` remounts because it lives outside React.
 */

/** The SDK's own localStorage key. Sharing it keeps us from ever disagreeing. */
const STORAGE_KEY = 'wb-theme';

/** Every property we have written, so revert never touches SDK-owned values. */
const owned = new Set<string>();

/** Live edits from the Config Studio, layered over the profile's maps. */
const overrides: Record<'base' | ThemeMode, TokenMap> = { base: {}, light: {}, dark: {} };

let current: { theme: ThemeConfig; mode: ThemeMode } | null = null;

export function readMode(): ThemeMode {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function resolve(theme: ThemeConfig, mode: ThemeMode): TokenMap {
  return {
    ...theme.base,
    ...theme[mode],
    ...overrides.base,
    ...overrides[mode],
  };
}

export function applyTheme(theme: ThemeConfig, mode: ThemeMode = readMode()): void {
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
}

/**
 * Single-token live edit. Writes straight to the DOM and deliberately bypasses
 * React: re-rendering the component that owns `<Root>` would hand the SDK a new
 * `nodeTypes` array identity on every slider frame, which overwrites its
 * module-level palette holder.
 */
export function setTokenOverride(token: string, value: string, bucket: 'base' | 'mode'): void {
  const target = bucket === 'base' ? overrides.base : overrides[readMode()];
  target[token] = value;
  document.documentElement.style.setProperty(token, value);
  owned.add(token);
}

export function clearTokenOverride(token: string, bucket: 'base' | 'mode'): void {
  const target = bucket === 'base' ? overrides.base : overrides[readMode()];
  delete target[token];
  if (current) applyTheme(current.theme, current.mode);
}

export function resetAllOverrides(): void {
  overrides.base = {};
  overrides.light = {};
  overrides.dark = {};
  if (current) applyTheme(current.theme, current.mode);
}

export function hasOverrides(): boolean {
  return (
    Object.keys(overrides.base).length +
      Object.keys(overrides.light).length +
      Object.keys(overrides.dark).length >
    0
  );
}

/** Reads the value actually in effect, so controls can show the live number. */
export function readToken(token: string): string {
  const inline = document.documentElement.style.getPropertyValue(token);
  if (inline) return inline.trim();
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

/**
 * The exact `theme.json` fragment the user just produced with the sliders.
 * Closes the loop: what you dragged is a file a backend can serve.
 */
export function exportThemePatch(): Pick<ThemeConfig, 'base' | 'light' | 'dark'> {
  const theme = current?.theme;
  return {
    base: { ...(theme?.base ?? {}), ...overrides.base },
    light: { ...(theme?.light ?? {}), ...overrides.light },
    dark: { ...(theme?.dark ?? {}), ...overrides.dark },
  };
}

/**
 * Theme mode lives in a hand-rolled subscription Set inside the SDK, not in its
 * zustand store — there is nothing to select. Observing the attribute is the
 * only reliable sync point; without it, toggling dark mode through the SDK's own
 * control would leave our mode-scoped tokens stale.
 */
export function watchThemeMode(onChange: (mode: ThemeMode) => void): () => void {
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
}

/**
 * Mirrors the SDK's own `setTheme` side effects.
 *
 * The first paint is primed by an inline script in `index.html`, because the SDK
 * only writes `data-theme` in a useEffect INSIDE `<Root>` — before that runs,
 * `<html>` carries no attribute and all 174 semantic tokens are undefined.
 */
export function setMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.theme = mode;
}
