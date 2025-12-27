import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

// Tenor API key (free tier)
const TENOR_API_KEY = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';
const TENOR_CLIENT_KEY = 'ohcs_elibrary';

interface GifResult {
  id: string;
  title: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (gif: { url: string; preview: string; title: string }) => void;
  position?: 'top' | 'bottom';
}

// Trending categories
const TRENDING_CATEGORIES = [
  { name: 'Reactions', query: 'reaction' },
  { name: 'Celebrate', query: 'celebrate' },
  { name: 'Agree', query: 'agree nod' },
  { name: 'Applause', query: 'clapping' },
  { name: 'Dance', query: 'dance' },
  { name: 'Sad', query: 'sad crying' },
  { name: 'Shocked', query: 'shocked surprised' },
  { name: 'Love', query: 'love heart' },
  { name: 'LOL', query: 'laughing lol' },
  { name: 'Thinking', query: 'thinking hmm' },
  { name: 'Bye', query: 'bye wave' },
  { name: 'Hi', query: 'hello hi wave' },
];

export function GifPicker({ isOpen, onClose, onSelect, position = 'top' }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch GIFs from Tenor
  const fetchGifs = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const endpoint = query
        ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&limit=30&media_filter=gif,tinygif`
        : `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&client_key=${TENOR_CLIENT_KEY}&limit=30&media_filter=gif,tinygif`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.results) {
        const formattedGifs: GifResult[] = data.results.map((gif: any) => ({
          id: gif.id,
          title: gif.title || gif.content_description || 'GIF',
          url: gif.media_formats?.gif?.url || gif.media_formats?.mediumgif?.url,
          preview: gif.media_formats?.tinygif?.url || gif.media_formats?.nanogif?.url,
          width: gif.media_formats?.gif?.dims?.[0] || 200,
          height: gif.media_formats?.gif?.dims?.[1] || 200,
        }));
        setGifs(formattedGifs);
      }
    } catch (error) {
      console.error('Failed to fetch GIFs:', error);
      setGifs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch trending GIFs on open
  useEffect(() => {
    if (isOpen && gifs.length === 0) {
      fetchGifs('');
    }
  }, [isOpen, fetchGifs, gifs.length]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        setSelectedCategory(null);
        fetchGifs(searchQuery);
      }, 300);
    } else if (isOpen) {
      fetchGifs('');
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isOpen, fetchGifs]);

  // Handle category click
  const handleCategoryClick = (category: { name: string; query: string }) => {
    setSelectedCategory(category.name);
    setSearchQuery('');
    fetchGifs(category.query);
  };

  // Handle GIF selection
  const handleSelect = (gif: GifResult) => {
    onSelect({
      url: gif.url,
      preview: gif.preview,
      title: gif.title,
    });
    onClose();
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedCategory(null);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
            onClick={onClose}
          />
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'fixed sm:absolute z-50 bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden',
              // Mobile: centered fixed positioning
              'inset-x-4 bottom-4 sm:inset-auto',
              // Desktop: absolute positioning relative to parent
              'sm:w-[380px] sm:max-w-[400px]',
              position === 'top' ? 'sm:bottom-full sm:mb-2' : 'sm:top-full sm:mt-2',
              'sm:left-0 sm:right-auto'
            )}
          >
          {/* Header */}
          <div className="p-3 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-surface-900 dark:text-surface-50">GIFs</span>
              </div>
              <span className="text-xs text-surface-400">Powered by Tenor</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search GIFs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-4 py-2.5 bg-surface-100 dark:bg-surface-700 rounded-xl',
                  'text-sm text-surface-900 dark:text-surface-50',
                  'placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          {!searchQuery && (
            <div className="px-3 py-2 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    fetchGifs('');
                  }}
                  className={cn(
                    'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1',
                    !selectedCategory
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                  )}
                >
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </button>
                {TRENDING_CATEGORIES.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category)}
                    className={cn(
                      'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      selectedCategory === category.name
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GIF Grid */}
          <div className="h-[40vh] sm:h-[300px] max-h-[400px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : gifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-surface-500">
                <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">No GIFs found</p>
              </div>
            ) : (
              <div className="columns-2 gap-2">
                {gifs.map((gif) => (
                  <motion.button
                    key={gif.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(gif)}
                    className="w-full mb-2 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-700 break-inside-avoid"
                  >
                    <img
                      src={gif.preview}
                      alt={gif.title}
                      loading="lazy"
                      className="w-full h-auto object-cover"
                      style={{ minHeight: '80px' }}
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
