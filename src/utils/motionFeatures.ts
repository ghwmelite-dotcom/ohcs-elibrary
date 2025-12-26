// Lazy load only the motion features we need for smaller bundle size
// Instead of loading all framer-motion features upfront

// Async loader for LazyMotion - dynamically imports only what's needed
export const loadMotionFeatures = () =>
  import('framer-motion').then((mod) => mod.domAnimation);

// For components that need full features including layout animations
export const loadMotionFeaturesFull = () =>
  import('framer-motion').then((mod) => mod.domMax);
