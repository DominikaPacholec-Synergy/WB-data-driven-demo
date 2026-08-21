/**
 * The font token in `base` reads `"Poppins", system-ui, -apple-system, sans-serif`
 * while the inspector option offers a shorter stack — same font, different string.
 * Matching on the first family keeps the dropdown in sync without forcing the
 * config author to keep two strings byte-identical.
 */
export const matchOption = (current: string, options: { value: string }[]): string | undefined => {
  const exact = options.find((option) => option.value === current);
  if (exact) return exact.value;
  const head = (value: string) => value.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
  return options.find((option) => head(option.value) === head(current))?.value;
};
