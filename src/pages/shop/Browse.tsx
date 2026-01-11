import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, Filter, X, ChevronDown, ChevronUp,
  Grid3X3, List, Star, Download, Package, BadgeCheck,
  Flame, Loader2, SlidersHorizontal, ShoppingBag, Store,
  Sparkles, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  productType: 'physical' | 'digital' | 'bundle';
  coverImage?: string;
  author?: string;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  viewCount?: number;
  categoryName?: string;
  categorySlug?: string;
  storeName?: string;
  storeSlug?: string;
  sellerVerified?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  productCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'bestselling', label: 'Best Selling' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
];

const PRODUCT_TYPES = [
  { value: 'all', label: 'All Types', icon: ShoppingBag },
  { value: 'digital', label: 'Digital', icon: Download },
  { value: 'physical', label: 'Physical', icon: Package },
  { value: 'bundle', label: 'Bundle', icon: BookOpen },
];

const PRICE_RANGES = [
  { label: 'Any Price', min: undefined, max: undefined },
  { label: 'Under GH₵50', min: undefined, max: 50 },
  { label: 'GH₵50 - GH₵100', min: 50, max: 100 },
  { label: 'GH₵100 - GH₵200', min: 100, max: 200 },
  { label: 'GH₵200 - GH₵500', min: 200, max: 500 },
  { label: 'Over GH₵500', min: 500, max: undefined },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter state from URL params
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedType = searchParams.get('type') || 'all';
  const selectedSort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  // Expanded filter sections
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    type: true,
    price: true,
  });

  // Local search input state
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, selectedType, selectedSort, minPrice, maxPrice, currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/shop/products/categories/all`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '20');

      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedType && selectedType !== 'all') params.set('type', selectedType);
      if (selectedSort) params.set('sort', selectedSort);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);

      const response = await fetch(`${API_BASE}/shop/products/catalog/browse?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Unable to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = useCallback((updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    // Reset to page 1 when filters change (except when changing page)
    if (!('page' in updates)) {
      newParams.delete('page');
    }

    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: localSearch.trim() || undefined });
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedType !== 'all' || minPrice || maxPrice;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Product Card Component
  const ProductCard = ({ product, viewMode, index }: { product: Product; viewMode: 'grid' | 'list'; index: number }) => {
    const isDigital = product.productType === 'digital';
    const discount = product.compareAtPrice
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Link
          to={`/shop/product/${product.slug}`}
          className={cn(
            'group bg-white dark:bg-surface-800 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300',
            viewMode === 'list' && 'flex'
          )}
        >
          {/* Product Image */}
          <div className={cn(
            'relative bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center overflow-hidden',
            viewMode === 'grid' ? 'aspect-[4/3]' : 'w-40 h-32 flex-shrink-0'
          )}>
            {product.coverImage ? (
              <img
                src={product.coverImage}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-primary-400" />
              </div>
            )}

            {/* Discount Badge */}
            {discount > 0 && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                -{discount}%
              </div>
            )}

            {/* Product Type Badge */}
            <div className={cn(
              'absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm',
              isDigital
                ? 'bg-blue-500/90 text-white'
                : product.productType === 'bundle'
                ? 'bg-purple-500/90 text-white'
                : 'bg-amber-500/90 text-white'
            )}>
              {isDigital ? (
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  Digital
                </span>
              ) : product.productType === 'bundle' ? (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Bundle
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Physical
                </span>
              )}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className={cn('p-5', viewMode === 'list' && 'flex-1')}>
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.sellerVerified && (
                <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
              {product.isBestseller && (
                <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                  <Flame className="w-3 h-3" />
                  Bestseller
                </span>
              )}
            </div>

            <h3 className="font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 text-base">
              {product.title}
            </h3>

            {product.author && (
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                by {product.author}
              </p>
            )}

            {product.storeName && (
              <p className="text-sm text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 mt-1 transition-colors">
                {product.author ? product.storeName : `by ${product.storeName}`}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                  {(product.rating || 0).toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-surface-500 dark:text-surface-400">
                ({product.reviewCount || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-surface-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  // Product Skeleton
  const ProductSkeleton = ({ viewMode }: { viewMode: 'grid' | 'list' }) => (
    <div className={cn(
      'bg-white dark:bg-surface-800 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 animate-pulse',
      viewMode === 'list' && 'flex'
    )}>
      <div className={cn(
        'bg-surface-200 dark:bg-surface-700',
        viewMode === 'grid' ? 'aspect-[4/3]' : 'w-40 h-32 flex-shrink-0'
      )} />
      <div className={cn('p-5', viewMode === 'list' && 'flex-1')}>
        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded-full w-3/4 mb-3" />
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full w-1/2 mb-4" />
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full w-1/3 mb-4" />
        <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded-full w-1/4 mt-4 pt-4" />
      </div>
    </div>
  );

  // Filter Sidebar Content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-3"
        >
          Categories
          {expandedSections.categories ? (
            <ChevronUp className="w-4 h-4 text-surface-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-surface-400" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.categories && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              <button
                onClick={() => updateFilters({ category: undefined })}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all',
                  !selectedCategory
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
                )}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => updateFilters({ category: category.id })}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between',
                    selectedCategory === category.id
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium'
                      : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
                  )}
                >
                  <span>{category.name}</span>
                  <span className="text-xs bg-surface-200 dark:bg-surface-600 px-2 py-0.5 rounded-full">
                    {category.productCount}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Type */}
      <div>
        <button
          onClick={() => toggleSection('type')}
          className="flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-3"
        >
          Product Type
          {expandedSections.type ? (
            <ChevronUp className="w-4 h-4 text-surface-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-surface-400" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.type && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              {PRODUCT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateFilters({ type: type.value })}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3',
                    selectedType === type.value
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium'
                      : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
                  )}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Price Range */}
      <div>
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-3"
        >
          Price Range
          {expandedSections.price ? (
            <ChevronUp className="w-4 h-4 text-surface-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-surface-400" />
          )}
        </button>
        <AnimatePresence>
          {expandedSections.price && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              {PRICE_RANGES.map((range, index) => {
                const isSelected =
                  (range.min === undefined && range.max === undefined && !minPrice && !maxPrice) ||
                  (minPrice === String(range.min || '') && maxPrice === String(range.max || ''));

                return (
                  <button
                    key={index}
                    onClick={() =>
                      updateFilters({
                        minPrice: range.min !== undefined ? String(range.min) : undefined,
                        maxPrice: range.max !== undefined ? String(range.max) : undefined,
                      })
                    }
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all',
                      isSelected
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium'
                        : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
                    )}
                  >
                    {range.label}
                  </button>
                );
              })}

              {/* Custom Price Range */}
              <div className="pt-3 mt-3 border-t border-surface-200 dark:border-surface-700">
                <p className="text-xs text-surface-500 mb-2 font-medium">Custom Range</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => updateFilters({ minPrice: e.target.value || undefined })}
                    className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <span className="text-surface-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => updateFilters({ maxPrice: e.target.value || undefined })}
                    className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={clearAllFilters}
          className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <X className="w-4 h-4" />
          Clear All Filters
        </motion.button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary-600" />
                Browse Products
              </h1>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                {pagination.total > 0
                  ? `Showing ${products.length} of ${pagination.total} products`
                  : 'Find resources for your professional development'}
              </p>
            </motion.div>

            {/* Search */}
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSearch}
              className="flex-1 max-w-xl"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-50" />
                <div className="relative flex items-center bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm">
                  <Search className="absolute left-4 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full h-12 pl-12 pr-24 bg-transparent text-surface-900 dark:text-white placeholder-surface-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2 px-4"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </motion.form>
          </div>

          {/* Active Filters Display */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap items-center gap-2 mt-4"
              >
                <span className="text-sm text-surface-500">Active filters:</span>
                {searchQuery && (
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium"
                  >
                    Search: "{searchQuery}"
                    <button onClick={() => { setLocalSearch(''); updateFilters({ search: undefined }); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                {selectedCategory && (
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium"
                  >
                    {categories.find((c) => c.id === selectedCategory)?.name || 'Category'}
                    <button onClick={() => updateFilters({ category: undefined })}>
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                {selectedType !== 'all' && (
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium"
                  >
                    {PRODUCT_TYPES.find((t) => t.value === selectedType)?.label}
                    <button onClick={() => updateFilters({ type: undefined })}>
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
                {(minPrice || maxPrice) && (
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium"
                  >
                    Price: {minPrice ? `GH₵${minPrice}` : '0'} - {maxPrice ? `GH₵${maxPrice}` : '∞'}
                    <button onClick={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}>
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block w-64 flex-shrink-0"
          >
            <div className="sticky top-6 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 shadow-sm">
              <h2 className="font-bold text-surface-900 dark:text-white mb-5 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-600" />
                Filters
              </h2>
              <FilterContent />
            </div>
          </motion.aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-6 flex-wrap gap-4"
            >
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 shadow-sm hover:shadow transition-all"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-primary-600 rounded-full" />
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={selectedSort}
                    onChange={(e) => updateFilters({ sort: e.target.value })}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 focus:ring-2 focus:ring-primary-500 cursor-pointer shadow-sm"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-700 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-surface-600 text-primary-600 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-surface-600 text-primary-600 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* Products Grid */}
            {isLoading ? (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              )}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ProductSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-surface-500 mb-4">{error}</p>
                <Button onClick={fetchProducts}>Try Again</Button>
              </motion.div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-surface-400" />
                </div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                  No Products Found
                </h3>
                <p className="text-surface-500 dark:text-surface-400 mb-6 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search terms.'
                    : 'Be the first to publish your resources on the marketplace!'}
                </p>
                {hasActiveFilters ? (
                  <Button onClick={clearAllFilters} variant="outline">
                    Clear All Filters
                  </Button>
                ) : (
                  <Link to="/shop/become-seller">
                    <Button>
                      <Store className="w-4 h-4 mr-2" />
                      Become a Seller
                    </Button>
                  </Link>
                )}
              </motion.div>
            ) : (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              )}>
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} index={index} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 mt-10"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => updateFilters({ page: String(currentPage - 1) })}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateFilters({ page: String(pageNum) })}
                        className={cn(
                          'w-10 h-10 rounded-xl font-medium transition-all',
                          pageNum === currentPage
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                            : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700'
                        )}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => updateFilters({ page: String(currentPage + 1) })}
                >
                  Next
                </Button>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-surface-800 shadow-2xl overflow-y-auto z-50"
            >
              <div className="sticky top-0 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 p-4 flex items-center justify-between">
                <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-600" />
                  Filters
                </h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
              <div className="p-5">
                <FilterContent />
              </div>
              <div className="sticky bottom-0 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 p-4">
                <Button
                  className="w-full"
                  onClick={() => setShowMobileFilters(false)}
                >
                  Show {pagination.total} Results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
