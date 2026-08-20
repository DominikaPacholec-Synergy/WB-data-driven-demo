import { useEffect, useRef } from 'react';
import { useFitView } from '@workflowbuilder/sdk';

/** Long enough for xyflow to have measured the un-parked canvas — see below. */
const SETTLE_MS = 250;

/**
 * Frames the diagram whenever the builder is the visible view.
 *
 * While parked, the canvas container is stretched to the viewport rather than
 * hidden with `display: none` — xyflow would otherwise measure zero and come
 * back mis-laid-out. The parked size differs from the docked size, so fitting
 * once the builder is back on screen is what keeps the diagram framed.
 *
 * Three traps, each of which made an earlier version a silent no-op:
 *
 * 1. `useFitView()` returns a NEW function identity every render, so it must not
 *    be an effect dependency — the effect would re-run on the next render and its
 *    cleanup would cancel the queued call. Hence the ref.
 * 2. The effect must be IDEMPOTENT. A version that tracked the false→true edge in
 *    a ref and mutated it before the call fired lost the fit entirely under
 *    StrictMode's run → cleanup → run: the first run consumed the edge, the
 *    cleanup cancelled the pending call, and the second run saw no edge left.
 *    Keying purely off `active` means every invocation schedules its own call.
 * 3. `requestAnimationFrame` is TOO EARLY. On the next frame xyflow has not
 *    re-measured the container yet and `fitView()` silently does nothing; a short
 *    timeout does work. This is why the delay is a constant and not a frame.
 *
 * Fitting on first mount as well is deliberate — the diagram arrives framed. The
 * cost is that returning from Tasks re-frames rather than restoring a manual
 * pan; for a demo that is the better default.
 *
 * Renders nothing; `useFitView` just has to be called inside `<Root>`.
 */
export const BuilderFocus = ({ active }: { active: boolean }) => {
  const fitView = useFitView();
  const latestFitView = useRef(fitView);
  latestFitView.current = fitView;

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => latestFitView.current(), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  return null;
};
