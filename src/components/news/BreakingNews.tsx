import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';
import { decodeHTMLEntities } from '@/utils/formatters';

interface BreakingNewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  timestamp: string;
}

interface BreakingNewsProps {
  items: BreakingNewsItem[];
  autoRotate?: boolean;
  rotationInterval?: number;
  onDismiss?: () => void;
}

export function BreakingNews({
  items,
  autoRotate = true,
  rotationInterval = 5000,
  onDismiss,
}: BreakingNewsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!autoRotate || isPaused || items.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, rotationInterval);

    return () => clearInterval(timer);
  }, [autoRotate, isPaused, items.length, rotationInterval]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-accent-600 to-accent-700 text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-2">
          {/* Breaking Label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <AlertCircle className="w-4 h-4" />
            </motion.div>
            <span className="font-bold text-sm uppercase tracking-wide">Breaking</span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/30" />

          {/* News Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <Link
                  to={`/news/${currentItem.id}`}
                  className="text-sm font-medium hover:underline truncate flex-1"
                >
                  {decodeHTMLEntities(currentItem.title)}
                </Link>
                <span className="text-xs text-accent-200 flex-shrink-0">
                  — {currentItem.source}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {items.length > 1 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs px-2">
                {currentIndex + 1}/{items.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* External Link */}
          <a
            href={currentItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Dismiss */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface NewsTicker {
  items: { id: string; title: string; url: string }[];
  speed?: 'slow' | 'normal' | 'fast';
}

export function NewsTicker({ items, speed = 'normal' }: NewsTicker) {
  const speeds = {
    slow: 60,
    normal: 40,
    fast: 25,
  };

  const duration = items.length * speeds[speed];

  return (
    <div className="bg-surface-900 text-white py-2 overflow-hidden">
      <motion.div
        animate={{ x: [0, -50 * items.length + '%'] }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="flex whitespace-nowrap"
      >
        {/* Duplicate items for seamless loop */}
        {[...items, ...items].map((item, index) => (
          <Link
            key={`${item.id}-${index}`}
            to={`/news/${item.id}`}
            className="inline-flex items-center mx-8 hover:text-primary-400 transition-colors"
          >
            <span className="w-2 h-2 bg-accent-500 rounded-full mr-3" />
            <span className="text-sm">{decodeHTMLEntities(item.title)}</span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
