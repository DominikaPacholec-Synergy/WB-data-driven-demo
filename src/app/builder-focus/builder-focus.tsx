import { useFitView } from '@workflowbuilder/sdk';
import { useEffect, useRef } from 'react';

/** Long enough for xyflow to have measured the un-parked canvas — see below. */
const SETTLE_MS = 250;

/**
 * Frames the diagram whenever the builder is the visible view.
 *
 * WHY THIS EXISTS, in plain words:
 *
 * The app has three views (builder, tasks, executions) but only one canvas. When
 * you leave the builder we do NOT hide the canvas with `display: none`, because
 * a hidden element has a size of zero, xyflow would remember that zero, and on
 * the way back the diagram would come back broken. So instead of hiding it, we
 * "park" it: the canvas stays on screen, just stretched to the whole viewport
 * and behind the other views.
 *
 * The catch is that the parked canvas is a different size than the normal one
 * sitting between the palette and the properties panel. So when you come back to
 * the builder, the diagram is still framed for the old, wrong size — off-centre,
 * too small or half out of view. This component simply says: "builder is visible
 * again → fit the diagram to the canvas one more time". That is all it does; it
 * renders nothing.
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
