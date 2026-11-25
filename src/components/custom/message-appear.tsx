"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The entrance a message bubble makes.
 *
 * Springy rather than timed: the slight overshoot is what gives a bubble
 * the sense of being pushed out of the composer, the way iMessage does it.
 *
 * Shared so the live chat and the Facebook and Instagram inboxes animate
 * identically — the same event should not look like a different event
 * depending on which channel the customer used.
 *
 * Wrap the list in `<AnimatePresence>` and key each child by message id, so
 * it can tell a new message from a re-render of an existing one.
 */
export function MessageAppear({
  outgoing,
  index,
  total,
  className,
  children,
}: {
  /** Decides which corner the bubble grows out of. */
  outgoing: boolean;
  index: number;
  /** Length of the list, used to stagger from its end. */
  total: number;
  className?: string;
  children: React.ReactNode;
}) {
  // A spring that overshoots is exactly what "reduce motion" asks us not
  // to do, so that setting gets a plain fade.
  const reduceMotion = useReducedMotion();

  return (
    // No `layout` prop on purpose. Layout animation measures an element's
    // box and animates the difference, and inside a scroll container those
    // measurements race the container's own scrollTop — which broke
    // auto-scroll in the inboxes. It buys nothing here anyway: messages
    // are appended at the end and never reorder, and the entrance below is
    // pure transform, so the list's real height is correct the moment it
    // renders and the scroll-to-bottom lands on the first frame.
    <motion.div
      initial={
        reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.86, y: 16 }
      }
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0.15 }
          : {
              type: "spring",
              stiffness: 520,
              damping: 32,
              mass: 0.8,
              // Staggered from the end of the list, not the start. On mount
              // that cascades upward from the newest message — where the
              // eye already is — and capped, so a long history settles in
              // about a third of a second. On append the new message is
              // last, so its delay is zero and it springs immediately.
              delay: Math.min(total - 1 - index, 8) * 0.035,
            }
      }
      // Grows out of the corner it sits in — the composer's end of the
      // screen — instead of scaling from its middle.
      style={{ transformOrigin: outgoing ? "bottom right" : "bottom left" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
