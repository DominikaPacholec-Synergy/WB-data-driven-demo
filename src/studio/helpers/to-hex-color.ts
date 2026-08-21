/** `<input type="color">` accepts only `#rrggbb`, so normalise whatever CSS gave us. */
export const toHexColor = (value: string): string => {
  const raw = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${[...raw.slice(1)].map((c) => c + c).join('')}`.toLowerCase();
  }
  const channels = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (channels) {
    const [r, g, b] = channels[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number);
    if ([r, g, b].every(Number.isFinite)) {
      const hex = (n: number) =>
        Math.max(0, Math.min(255, Math.round(n)))
          .toString(16)
          .padStart(2, '0');
      return `#${hex(r)}${hex(g)}${hex(b)}`;
    }
  }
  return '#000000';
};
