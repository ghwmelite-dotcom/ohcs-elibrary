import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Store, Search, BookOpen, FileText, GraduationCap,
  TrendingUp, Star, ShoppingBag, ArrowRight, Filter,
  Grid3X3, List, ChevronRight, Loader2, Package,
  Download, BadgeCheck, Flame, Sparkles, Users,
  Shield, Clock, Heart, Award
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatters';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

// Featured categories for the civil service marketplace
const categories = [
  {
    id: 'books',
    name: 'Books & Publications',
    icon: BookOpen,
    description: 'Professional guides, textbooks, and reference materials',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'training',
    name: 'Training Materials',
    icon: GraduationCap,
    description: 'Course materials, workbooks, and learning resources',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: 'templates',
    name: 'Templates & Forms',
    icon: FileText,
    description: 'Document templates, forms, and official formats',
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    id: 'research',
    name: 'Research Papers',
    icon: TrendingUp,
    description: 'Academic research and policy documents',
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
];

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
  categoryName?: string;
  categorySlug?: string;
  storeName?: string;
  storeSlug?: string;
  sellerVerified?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
}

interface FeaturedData {
  featured: Product[];
  bestsellers: Product[];
  newArrivals: Product[];
}

export default function Shop() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // API state
  const [featuredData, setFeaturedData] = useState<FeaturedData>({
    featured: [],
    bestsellers: [],
    newArrivals: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'featured' | 'bestsellers' | 'new'>('featured');

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/shop/products/catalog/featured`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setFeaturedData({
        featured: data.featured || [],
        bestsellers: data.bestsellers || [],
        newArrivals: data.newArrivals || [],
      });
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Unable to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getDisplayProducts = () => {
    switch (activeSection) {
      case 'bestsellers':
        return featuredData.bestsellers;
      case 'new':
        return featuredData.newArrivals;
      default:
        return featuredData.featured.length > 0
          ? featuredData.featured
          : featuredData.newArrivals;
    }
  };

  const displayProducts = getDisplayProducts();
  const hasAnyProducts = featuredData.featured.length > 0 ||
                         featuredData.bestsellers.length > 0 ||
                         featuredData.newArrivals.length > 0;

  // Compute hero stats from fetched products
  const heroStats = (() => {
    const allProducts = [
      ...featuredData.featured,
      ...featuredData.bestsellers,
      ...featuredData.newArrivals,
    ];
    // Deduplicate by id
    const uniqueProducts = Array.from(
      new Map(allProducts.map((p) => [p.id, p])).values()
    );
    const totalProducts = uniqueProducts.length;
    const uniqueSellers = new Set(
      uniqueProducts.map((p) => p.storeName || p.author).filter(Boolean)
    ).size;
    const ratedProducts = uniqueProducts.filter((p) => p.rating && p.rating > 0);
    const avgRating =
      ratedProducts.length > 0
        ? ratedProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedProducts.length
        : 0;
    return { totalProducts, uniqueSellers, avgRating };
  })();

  const ProductCard = ({ product, index }: { product: Product; index: number }) => {
    const isDigital = product.productType === 'digital';
    const discount = product.compareAtPrice
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Link
          to={`/shop/product/${product.slug}`}
          className="group block bg-white dark:bg-surface-800 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300"
        >
          {/* Product Image */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center overflow-hidden">
            {product.coverImage ? (
              <img
                src={product.coverImage}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-primary-400" />
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
                : 'bg-amber-500/90 text-white'
            )}>
              {isDigital ? (
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  Digital
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

          <div className="p-5">
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

            {product.storeName && !product.author && (
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                by {product.storeName}
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

  const ProductSkeleton = () => (
    <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 animate-pulse">
      <div className="aspect-[4/3] bg-surface-200 dark:bg-surface-700" />
      <div className="p-5">
        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded-full w-3/4 mb-3" />
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full w-1/2 mb-4" />
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full w-1/3 mb-4" />
        <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded-full w-1/4 mt-4 pt-4" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-emerald-800" />

        {/* Animated background pattern */}
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          animate={{ x: [0, 60], y: [0, 60] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />

        {/* Floating elements */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full bg-white/5"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 2) * 30}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-5 py-2.5 mb-6"
            >
              <Store className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">OHCS Marketplace</span>
              <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">NEW</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Resources for Ghana's
              <span className="block text-yellow-400 mt-2">Civil Servants</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
              Discover books, training materials, and resources authored by your fellow
              public servants. Support government authors while advancing your career.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl" />
                <div className="relative flex items-center">
                  <Search className="absolute left-5 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search for books, authors, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-14 pr-32 text-lg bg-transparent text-surface-900 placeholder-surface-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button
                    type="submit"
                    className="absolute right-2 h-10 px-6"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </form>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-10">
              <div className="flex items-center gap-2 text-white/90">
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold">
                  {heroStats.totalProducts > 0 ? `${heroStats.totalProducts}+ Publications` : 'Publications'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Users className="w-5 h-5" />
                <span className="font-semibold">
                  {heroStats.uniqueSellers > 0 ? `${heroStats.uniqueSellers}+ Authors` : 'Authors'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">
                  {heroStats.avgRating > 0 ? `${heroStats.avgRating.toFixed(1)} Avg Rating` : 'Top Rated'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
              Browse Categories
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mt-2">
              Find what you need for your professional development
            </p>
          </div>
          <Link
            to="/shop/browse"
            className="hidden md:flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            View All Categories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/shop/browse?category=${category.id}`}
                className="group block bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300"
              >
                <motion.div
                  className={cn('w-14 h-14 rounded-xl flex items-center justify-center mb-4', category.lightBg, 'dark:bg-surface-700')}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <category.icon className={cn('w-7 h-7', category.iconColor, 'dark:text-primary-400')} />
                </motion.div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">
                  {category.description}
                </p>
                <div className="flex items-center gap-1 mt-4 text-primary-600 dark:text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Browse <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="bg-white dark:bg-surface-800/50 border-y border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10"
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white">
                Discover Resources
              </h2>
              <p className="text-surface-600 dark:text-surface-400 mt-2">
                Popular materials from verified government authors
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-all',
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-surface-600 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-all',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-surface-600 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              <Link
                to="/shop/browse"
                className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Section Tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'featured', label: 'Featured', icon: Star },
              { id: 'bestsellers', label: 'Bestsellers', icon: Flame },
              { id: 'new', label: 'New Arrivals', icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all whitespace-nowrap',
                  activeSection === tab.id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : error && !hasAnyProducts ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-surface-400" />
              </div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                Coming Soon!
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
                We're preparing amazing resources from government authors. Be the first to publish!
              </p>
              <Link to="/shop/become-seller">
                <Button size="lg" className="shadow-lg">
                  <Store className="w-5 h-5 mr-2" />
                  Become a Seller
                </Button>
              </Link>
            </motion.div>
          ) : displayProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-surface-400" />
              </div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                No Products in This Category
              </h3>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                Check out other categories or become a seller to add yours!
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="secondary" onClick={() => setActiveSection('new')}>
                  View New Arrivals
                </Button>
                <Link to="/shop/become-seller">
                  <Button>
                    <Store className="w-4 h-4 mr-2" />
                    Become a Seller
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Become a Seller CTA */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-700 to-emerald-700" />

          {/* Pattern overlay */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
            animate={{ x: [0, 24], y: [0, 24] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />

          <div className="relative p-8 md:p-12 lg:p-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ scale: 0.9 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
                >
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Earn While You Share</span>
                </motion.div>

                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Share Your Expertise
                </h2>
                <p className="text-lg text-white/90 mb-6">
                  Are you a civil servant with valuable knowledge to share? Join our
                  marketplace and help empower your fellow public servants while earning
                  from your publications.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 text-white/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <span>Keep up to 92% of sales</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <BadgeCheck className="w-5 h-5 text-white" />
                    </div>
                    <span>Get verified author badge</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <span>Reach thousands of servants</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span>Secure payment processing</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <motion.button
                  onClick={() => navigate('/shop/become-seller')}
                  className="group relative overflow-hidden px-8 py-4 rounded-2xl bg-white text-primary-700 font-semibold text-lg shadow-2xl shadow-black/20 transition-all duration-300 hover:shadow-yellow-500/30"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent -translate-x-full"
                    animate={{ x: ['0%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  <span className="relative flex items-center justify-center gap-3">
                    <motion.span
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-600 text-white shadow-lg"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Store className="w-5 h-5" />
                    </motion.span>
                    <span className="flex flex-col items-start">
                      <span className="text-lg font-bold">Become a Seller</span>
                      <span className="text-xs text-primary-500 font-medium">Start earning today</span>
                    </span>
                    <ArrowRight className="w-5 h-5 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </span>
                </motion.button>

                {isAuthenticated && (
                  <motion.button
                    onClick={() => navigate('/shop/seller/dashboard')}
                    className="group relative overflow-hidden px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold text-lg transition-all duration-300 hover:bg-white/20 hover:border-white/50"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative flex items-center justify-center gap-3">
                      <motion.span
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <TrendingUp className="w-5 h-5" />
                      </motion.span>
                      <span className="flex flex-col items-start">
                        <span className="text-lg font-bold">Seller Dashboard</span>
                        <span className="text-xs text-white/70 font-medium">Manage your products</span>
                      </span>
                      <ChevronRight className="w-5 h-5 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Secure Payments', desc: 'Mobile Money & Card', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-900/30' },
              { icon: Download, title: 'Instant Access', desc: 'Download digital products', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
              { icon: BadgeCheck, title: 'Verified Authors', desc: 'Quality guaranteed', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
              { icon: Heart, title: 'Support Authors', desc: '92% goes to creators', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30' },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <motion.div
                  className={cn('w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4', item.bg)}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <item.icon className={cn('w-7 h-7', item.color)} />
                </motion.div>
                <h3 className="font-semibold text-surface-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
