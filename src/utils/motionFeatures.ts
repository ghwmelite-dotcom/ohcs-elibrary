// Lazy load only the motion features we need for smaller bundle size
// Instead of loading all framer-motion features upfront

import { domAnimation } from 'framer-motion';

// Export domAnimation for basic DOM animations (smaller than domMax)
// This includes: animate, exit, variants, whileHover, whileTap, whileFocus
// Excludes: layout animations, drag, pan gestures
export const loadMotionFeatures = () => domAnimation;

// Use this for components that need full features including layout
export { domMax } from 'framer-motion';
