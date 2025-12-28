import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Bookmark, Share2, ExternalLink, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;
const CLICK_THRESHOLD = 5; // Pixels moved before considered a drag

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: <Share2 className="w-5 h-5" />,
    color: 'bg-secondary-500',
    label: 'Share',
  },
  rightAction = {
    icon: <Bookmark className="w-5 h-5" />,
    color: 'bg-primary-500',
    label: 'Bookmark',
  },
  disabled = false,
}: SwipeableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Background opacity based on swipe distance
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);
  const rightOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);

  // Scale for the action icons
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD * 1.5, -SWIPE_THRESHOLD], [1.2, 1]);
  const rightScale = useTransform(x, [SWIPE_THRESHOLD, SWIPE_THRESHOLD * 1.5], [1, 1.2]);

  const handleDragStart = useCallback((_: any, info: PanInfo) => {
    startPosRef.current = { x: info.point.x, y: info.point.y };
    setIsDragging(true);
    setHasDragged(false);
  }, []);

  const handleDrag = useCallback((_: any, info: PanInfo) => {
    const deltaX = Math.abs(info.point.x - startPosRef.current.x);
    const deltaY = Math.abs(info.point.y - startPosRef.current.y);

    // Only mark as dragged if moved significantly horizontally
    if (deltaX > CLICK_THRESHOLD && deltaX > deltaY) {
      setHasDragged(true);
    }
  }, []);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    setIsDragging(false);
    const xValue = x.get();
    const velocity = info.velocity.x;

    // Only process swipe if user actually dragged
    if (!hasDragged) {
      animate(x, 0, { duration: 0.1 });
      setHasDragged(false);
      return;
    }

    // Check if swipe was strong enough (either distance or velocity)
    const isLeftSwipe = xValue < -SWIPE_THRESHOLD || (xValue < -50 && velocity < -SWIPE_VELOCITY_THRESHOLD);
    const isRightSwipe = xValue > SWIPE_THRESHOLD || (xValue > 50 && velocity > SWIPE_VELOCITY_THRESHOLD);

    if (isLeftSwipe && onSwipeLeft) {
      // Animate off screen, then call action and reset
      await animate(x, -300, { duration: 0.2 });
      onSwipeLeft();
      await animate(x, 0, { duration: 0.3, ease: 'easeOut' });
    } else if (isRightSwipe && onSwipeRight) {
      await animate(x, 300, { duration: 0.2 });
      onSwipeRight();
      await animate(x, 0, { duration: 0.3, ease: 'easeOut' });
    } else {
      // Snap back
      animate(x, 0, { duration: 0.3, ease: 'easeOut' });
    }

    setHasDragged(false);
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl">
      {/* Left action background (swipe left reveals this) */}
      <motion.div
        className={cn(
          'absolute inset-0 flex items-center justify-end pr-6 rounded-xl',
          leftAction.color
        )}
        style={{ opacity: leftOpacity }}
      >
        <motion.div
          className="flex flex-col items-center text-white"
          style={{ scale: leftScale }}
        >
          {leftAction.icon}
          <span className="text-xs mt-1 font-medium">{leftAction.label}</span>
        </motion.div>
      </motion.div>

      {/* Right action background (swipe right reveals this) */}
      <motion.div
        className={cn(
          'absolute inset-0 flex items-center justify-start pl-6 rounded-xl',
          rightAction.color
        )}
        style={{ opacity: rightOpacity }}
      >
        <motion.div
          className="flex flex-col items-center text-white"
          style={{ scale: rightScale }}
        >
          {rightAction.icon}
          <span className="text-xs mt-1 font-medium">{rightAction.label}</span>
        </motion.div>
      </motion.div>

      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        dragDirectionLock
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          'relative bg-white dark:bg-surface-800 rounded-xl touch-pan-y',
          isDragging && hasDragged && 'cursor-grabbing'
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Hook for detecting touch devices
export function useIsTouchDevice() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
