import type { ReactNode } from 'react';

type Props = {
  /**
   * The line the bubble always shows. The control's name where the visible label
   * collapses; the whole hint where it does not — Run keeps its label at every
   * width, so a bubble repeating the word "Run" would say nothing.
   */
  label: string;
  /** What the control does, set as a second, dimmer line under the name. */
  description?: string;
  /**
   * Which edge the bubble hangs from.
   *
   * Not a cosmetic choice. The app bar pushes its two clusters to opposite ends,
   * so a bubble centred on an outermost control reaches past the shell — the
   * first nav item's would start ~56px outside it — and `.shell`'s
   * `overflow: hidden` cuts that off rather than scrolling to it. Anchoring each
   * cluster's bubbles to its own outer edge cannot overflow.
   */
  align?: 'start' | 'center' | 'end';
  children: ReactNode;
};

/**
 * The hover tooltip, rebuilt in our own markup for the third time in this
 * codebase — same reason as `ThemeSwitch` and `Dropdown`. The design system does
 * ship one (`@synergycodes/overflow-ui`, on Floating UI), but
 * `@workflowbuilder/sdk` does not re-export it and overflow-ui reaches us only as
 * a hoisted transitive dependency, so importing it would mean depending on a
 * package our own `package.json` never asked for. Every value in `.tooltip*`
 * comes from the SDK's `--ax-public-tooltip-*` tokens instead, so the bubble
 * still follows both themes and any brand override made in Config Studio.
 *
 * Every measurement is taken from the SDK's own tooltip, so the two read as one
 * control: the `ax-public-p11` type ramp, an identical 8px/12px padding and 8px
 * radius, a 10px gap from the trigger, a 10x4 arrow centred on it, `33vw` of
 * width and the same 500ms hover delay. The one thing ours adds is a second line
 * — the SDK's tooltip is always a single string — so `.tooltip__name` is set at
 * 600 to keep the name apart from the sentence under it.
 *
 * There is no state here at all: `:hover` and `:has(:focus-visible)` on the
 * wrapper do the whole job (see `components.css`). That is deliberate — the app
 * bar collapses by container query and React never learns how wide it is, so a
 * tooltip that needed to know would have to invent a `ResizeObserver` that
 * nothing else in the shell wants.
 *
 * The bubble is `aria-hidden`: it is decoration. The label it stands in for is
 * hidden VISUALLY when the bar collapses, not removed, so the accessible name
 * comes from the markup as it always did.
 *
 * Known gap: WCAG 1.4.13 also asks that hover content be dismissible with
 * Escape, which CSS alone cannot do. The other two halves are met — `visibility`
 * keeps the bubble out of hit-testing until it is drawn, and nothing times it
 * out. Closing the gap means a keydown listener and a suppression flag; worth
 * doing if these tooltips ever cover something a reader needs to see past.
 */
export function Tooltip({ label, description, align = 'center', children }: Props) {
  return (
    // A `div`, not a `span`: `Dropdown` renders a `div`, and phrasing content
    // cannot contain flow content.
    <div className={`tooltip tooltip--${align}`}>
      {children}
      {/*
       * Two siblings rather than an arrow nested in the bubble: the arrow has to
       * be centred on the TRIGGER, and the bubble is anchored to one of its own
       * edges, so an arrow inside it could not find the trigger's middle. Both
       * carry `tooltip__pop`, which is the class every show/hide rule keys on so
       * the pair can never come apart.
       */}
      <span className="tooltip__pop tooltip__arrow" aria-hidden="true" />
      {/* `ax-public-p11` is the SDK's own tooltip type ramp — the same class its
          Tooltip puts on its bubble, so ours tracks the design system rather than
          restating 10px/400/140% and drifting from it. */}
      <span className="tooltip__pop tooltip__bubble ax-public-p11" aria-hidden="true">
        <span className="tooltip__name">{label}</span>
        {description ? <span className="tooltip__detail">{description}</span> : null}
      </span>
    </div>
  );
}
