import type { Variants } from 'framer-motion';

export const EASE_CINEMATIC: [number, number, number, number] = [0.76, 0, 0.24, 1];
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Glass auth card: blur + opacity + translate entrance, staggered children. */
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 46,
    scale: 0.97,
    filter: 'blur(16px)',
    transition: { duration: 0.4, ease: 'easeIn' },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: EASE_OUT, staggerChildren: 0.09, delayChildren: 0.3 },
  },
};

/** Wrapper around each form panel; staggers its fields, exits upward. */
export const panelVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  exit: { opacity: 0, y: -14, filter: 'blur(8px)', transition: { duration: 0.26, ease: 'easeIn' } },
};

export const item: Variants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
};

/** Variant for buttons — adds the scale(0.96) → 1 press of the spec. */
export const itemPress: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export const staggerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.1, delay: 0.5 } },
};
