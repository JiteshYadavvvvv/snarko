# Animations

## Tools

- **CSS transitions** for simple hover/focus state changes (color, border,
  background, opacity). Use Tailwind's `transition-*` utilities with the
  duration tokens in `globals.css` (`--duration-fast`, `--duration-base`,
  `--duration-slow`).
- **Motion for React** (`motion` package, imported from `motion/react`) for
  anything more meaningful: enter/exit, layout changes, interactive
  transitions that CSS alone can't express well.

Don't reach for Motion for something a CSS transition already covers — it's
extra client JS for no benefit.

## Reduced motion

Two layers, both required:

1. **Global CSS safety net** (`globals.css`): a `prefers-reduced-motion:
reduce` media query collapses all CSS animation/transition durations to
   near-zero and disables smooth scrolling. This covers any CSS-driven
   motion automatically, with no per-component opt-in.
2. **Motion-level opt-out for JS-driven animation**: components using
   `motion.div` (or similar) call `useReducedMotion()` from `motion/react`
   and skip the _initial_ animated state when it's `true`, rather than just
   shortening the transition. See `src/components/shared/animated-reveal.tsx`
   for the pattern:

   ```tsx
   const shouldReduceMotion = useReducedMotion();
   <motion.div
     initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
     animate={{ opacity: 1, y: 0 }}
   />;
   ```

   A shorter animation still moves something on screen; `initial={false}`
   means nothing does.

## Performance rules

- Animate `transform` and `opacity` wherever possible — they don't trigger
  layout/paint the way `width`, `height`, `top`, or `left` do.
- No continuous/decorative animation (looping background effects, idle
  pulsing, etc.). Every animation should be triggered by something — mount,
  route change, user interaction.
- Keep Motion usage in Client Components that specifically need it
  (`src/components/shared`, not `src/components/ui`). Don't mark a whole page
  or layout `"use client"` just to animate one element inside it — wrap only
  that element.

## Current usage

`AnimatedReveal` (`src/components/shared/animated-reveal.tsx`) is the only
animated component so far: a fade + slide-up on mount, used once on the
homepage. It's the reference implementation for the reduced-motion pattern
above — follow it rather than re-deriving the pattern per component.
