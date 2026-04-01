import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, TrendingUp, Sparkles, Pause, Play } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRelativeTime, decodeHTMLEntities } from '@/utils/formatters';

interface FeaturedArticle {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  sourceIcon?: string;
  category: string;
  imageUrl?: string;
  publishedAt: string;
  url: string;
  aiSummary?: string | null;
  readingTimeMinutes?: number;
}

interface HeroCarouselProps {
  articles: FeaturedArticle[];
  autoPlayInterval?: number;
  className?: string;
}

export function HeroCarousel({
  articles,
  autoPlayInterval = 5000,
  className,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(1);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  }, [articles.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  }, [articles.length]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-play effect
  useEffect(() => {
    if (!isAutoPlaying || articles.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext, autoPlayInterval, articles.length]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  if (articles.length === 0) return null;

  const currentArticle = articles[currentIndex];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Carousel */}
      <div className="relative aspect-[16/9] md:aspect-[21/9]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: currentArticle.imageUrl
                  ? `url(${currentArticle.imageUrl})`
                  : 'linear-gradient(135deg, #006B3F 0%, #CE1126 100%)',
              }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="flex items-center gap-1 px-3 py-1 bg-accent-500 text-white rounded-full text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  Featured
                </span>
                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm capitalize">
                  {currentArticle.category}
                </span>
                {currentArticle.readingTimeMinutes && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                    <Clock className="w-4 h-4" />
                    {currentArticle.readingTimeMinutes} min read
                  </span>
                )}
              </div>

              {/* Title */}
              <Link to={`/news/${currentArticle.id}`}>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl md:text-4xl font-bold text-white mb-3 line-clamp-2 hover:underline max-w-4xl"
                >
                  {decodeHTMLEntities(currentArticle.title)}
                </motion.h2>
              </Link>

              {/* AI Summary or Excerpt */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-2xl mb-4"
              >
                {currentArticle.aiSummary?.trim() ? (
                  <div>
                    <div className="flex items-center gap-1 text-xs text-primary-300 font-medium mb-1">
                      <Sparkles className="w-3 h-3" />
                      AI Summary
                    </div>
                    <p className="text-surface-200 line-clamp-2">
                      {currentArticle.aiSummary}
                    </p>
                  </div>
                ) : (
                  <p className="text-surface-200 line-clamp-2">
                    {currentArticle.excerpt}
                  </p>
                )}
              </motion.div>

              {/* Source and Time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-3 text-surface-300"
              >
                {currentArticle.sourceIcon && (
                  <img
                    src={currentArticle.sourceIcon}
                    alt={currentArticle.source}
                    className="w-5 h-5 rounded"
                  />
                )}
                <span className="font-medium">{currentArticle.source}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatRelativeTime(currentArticle.publishedAt)}
                </span>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {articles.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots and Controls */}
      {articles.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors backdrop-blur-sm"
            aria-label={isAutoPlaying ? 'Pause' : 'Play'}
          >
            {isAutoPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {articles.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'transition-all duration-300',
                  index === currentIndex
                    ? 'w-8 h-2 bg-white rounded-full'
                    : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/70'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isAutoPlaying && articles.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <motion.div
            key={currentIndex}
            className="h-full bg-primary-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: autoPlayInterval / 1000, ease: 'linear' }}
          />
        </div>
      )}
    </div>
  );
}
