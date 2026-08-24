const POPUP_GAP = 4;
const POPUP_MAX_HEIGHT = 200;

export type Anchor = { left: number; width: number; maxHeight: number } & (
  { top: number; bottom?: never } | { bottom: number; top?: never }
);

export const anchorTo = (trigger: HTMLElement): Anchor => {
  const rect = trigger.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - POPUP_GAP;
  const above = rect.top - POPUP_GAP;
  const box = { left: rect.left, width: rect.width };

  if (below < POPUP_MAX_HEIGHT && above > below) {
    return {
      ...box,
      bottom: window.innerHeight - rect.top + POPUP_GAP,
      maxHeight: Math.min(POPUP_MAX_HEIGHT, above),
    };
  }

  return { ...box, top: rect.bottom + POPUP_GAP, maxHeight: Math.min(POPUP_MAX_HEIGHT, below) };
};
