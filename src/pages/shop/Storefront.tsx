import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Store, Star, ShoppingBag, Package, BadgeCheck, MapPin,
  Building2, Calendar, ChevronDown, Grid3X3, List,
  BookOpen, Download, Flame, Loader2, AlertCircle,
  MessageSquare, Share2, Heart, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';

// API base URL
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

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
  isFeatured?: boolean;
  isBestseller?: boolean;
}

interface Seller {
  id: string;
  storeName: string;
  storeSlug: string;
  storeLogo?: string;
  storeBanner?: string;
  storeDescription?: string;
  isVerified: boolean;
  totalSales: number;
  rating: number;
  reviewCount: number;
  socialLinks: Record<string, string>;
  policies: Record<string, string>;
  createdAt: string;
  owner: {
    name: string;
    avatar?: string;
    bio?: string;
    department?: string;
    region?: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  reviewerName: string;
  reviewerAvatar?: string;
  productTitle: string;
  productSlug: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'bestselling', label: 'Best Selling' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function Storefront() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const currentPage = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sort') || 'newest';

  useEffect(() => {
    if (storeSlug) {
      fetchStoreData();
    }
  }, [storeSlug, currentPage, sortBy]);

  const fetchStoreData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '12');
      params.set('sort', sortBy);

      const response = await fetch(
        `${API_BASE}/shop/products/store/${storeSlug}?${params.toString()}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError('Store not found');
        } else {
          throw new Error('Failed to fetch store data');
        }
        return;
      }

      const data = await response.json();
      setSeller(data.seller);
      setProducts(data.products || []);
      setFeaturedProducts(data.featuredProducts || []);
      setCategories(data.categories || []);
      setReviews(data.recentReviews || []);
      setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
    } catch (err) {
      console.error('Error fetching store:', err);
      setError('Unable to load store. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSort = (newSort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const updatePage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: seller?.storeName || 'Store',
          text: `Check out ${seller?.storeName} on OHCS Marketplace`,
          url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  // Render star rating
  const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            className={cn(
              'fill-warning-500 text-warning-500',
              size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
            )}
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            className={cn(
              'fill-warning-500/50 text-warning-500',
              size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
            )}
          />
        );
      } else {
        stars.push(
          <Star
            key={i}
            className={cn(
              'text-surface-300',
              size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
            )}
          />
        );
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  // Product Card Component
  const ProductCard = ({ product, viewMode }: { product: Product; viewMode: 'grid' | 'list' }) => {
    const isDigital = product.productType === 'digital';
    const discount = product.compareAtPrice
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

    return (
      <Link
        to={`/shop/product/${product.slug}`}
        className={cn(
          'group bg-white dark:bg-surface-800 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 hover:shadow-lg hover:border-primary-300 transition-all',
          viewMode === 'list' && 'flex'
        )}
      >
        {/* Product Image */}
        <div className={cn(
          'relative bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-900 flex items-center justify-center overflow-hidden',
          viewMode === 'grid' ? 'aspect-[4/3]' : 'w-40 h-32 flex-shrink-0'
        )}>
          {product.coverImage ? (
            <img
              src={product.coverImage}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <BookOpen className="w-12 h-12 text-primary-400" />
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </div>
          )}

          {/* Product Type Badge */}
          <div className={cn(
            'absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium',
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
        </div>

        <div className={cn('p-4', viewMode === 'list' && 'flex-1')}>
          {/* Badges */}
          {product.isBestseller && (
            <span className="inline-flex items-center text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full gap-1 mb-2">
              <Flame className="w-3 h-3" />
              Bestseller
            </span>
          )}

          <h3 className="font-semibold text-surface-900 dark:text-surface-50 group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.title}
          </h3>

          {product.author && (
            <p className="text-sm text-surface-500 mt-1">
              by {product.author}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={product.rating || 0} />
            <span className="text-sm text-surface-400">
              ({product.reviewCount || 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-lg font-bold text-primary-600">
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
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
          <p className="mt-3 text-surface-600 dark:text-surface-400">Loading store...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !seller) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-surface-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
            {error === 'Store not found' ? 'Store Not Found' : 'Something Went Wrong'}
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            {error === 'Store not found'
              ? "The store you're looking for doesn't exist or has been deactivated."
              : error}
          </p>
          <Link to="/shop/browse">
            <Button>Browse All Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Store Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        {seller.storeBanner && (
          <img
            src={seller.storeBanner}
            alt={seller.storeName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Store Header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative -mt-16 md:-mt-20 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Store Logo */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center overflow-hidden border-4 border-white dark:border-surface-700 shadow-lg">
                {seller.storeLogo ? (
                  <img
                    src={seller.storeLogo}
                    alt={seller.storeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-12 h-12 md:w-16 md:h-16 text-primary-600" />
                )}
              </div>
            </div>

            {/* Store Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50">
                      {seller.storeName}
                    </h1>
                    {seller.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400 rounded-full text-sm font-medium">
                        <BadgeCheck className="w-4 h-4" />
                        Verified Seller
                      </span>
                    )}
                  </div>

                  {seller.storeDescription && (
                    <p className="mt-2 text-surface-600 dark:text-surface-400 line-clamp-2">
                      {seller.storeDescription}
                    </p>
                  )}

                  {/* Store Meta */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-surface-500">
                    {seller.owner.department && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {seller.owner.department}
                      </span>
                    )}
                    {seller.owner.region && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {seller.owner.region}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Seller since {new Date(seller.createdAt).toLocaleDateString('en-GB', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                <div className="flex items-center gap-2">
                  <StarRating rating={seller.rating} size="md" />
                  <span className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    {seller.rating.toFixed(1)}
                  </span>
                  <span className="text-surface-500">
                    ({seller.reviewCount} reviews)
                  </span>
                </div>
                <div className="text-surface-500">
                  <span className="font-semibold text-surface-900 dark:text-surface-50">
                    {seller.totalSales}
                  </span>{' '}
                  sales
                </div>
                <div className="text-surface-500">
                  <span className="font-semibold text-surface-900 dark:text-surface-50">
                    {pagination.total}
                  </span>{' '}
                  products
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            {/* About Seller */}
            {seller.owner.name && (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 mb-6">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-3">
                  About the Seller
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
                    {seller.owner.avatar ? (
                      <img
                        src={seller.owner.avatar}
                        alt={seller.owner.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-primary-600">
                        {seller.owner.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-50">
                      {seller.owner.name}
                    </p>
                    {seller.owner.department && (
                      <p className="text-sm text-surface-500">{seller.owner.department}</p>
                    )}
                  </div>
                </div>
                {seller.owner.bio && (
                  <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-4">
                    {seller.owner.bio}
                  </p>
                )}
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 mb-6">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-3">
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/shop/browse?category=${category.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                    >
                      <span className="text-surface-700 dark:text-surface-300">
                        {category.name}
                      </span>
                      <span className="text-xs text-surface-400">
                        ({category.productCount})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Store Policies */}
            {seller.policies && Object.keys(seller.policies).length > 0 && (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-3">
                  Store Policies
                </h3>
                <div className="space-y-2 text-sm">
                  {seller.policies.shipping && (
                    <div>
                      <p className="font-medium text-surface-700 dark:text-surface-300">
                        Shipping
                      </p>
                      <p className="text-surface-500">{seller.policies.shipping}</p>
                    </div>
                  )}
                  {seller.policies.returns && (
                    <div>
                      <p className="font-medium text-surface-700 dark:text-surface-300">
                        Returns
                      </p>
                      <p className="text-surface-500">{seller.policies.returns}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Products Section */}
          <main className="flex-1 min-w-0">
            {/* Featured Products */}
            {featuredProducts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4">
                  Featured Products
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} viewMode="grid" />
                  ))}
                </div>
              </div>
            )}

            {/* All Products */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">
                  All Products
                </h2>
                <div className="flex items-center gap-4">
                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => updateSort(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-700 dark:text-surface-300 focus:ring-2 focus:ring-primary-500 cursor-pointer text-sm"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                  </div>

                  {/* View Mode */}
                  <div className="hidden md:flex items-center gap-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        viewMode === 'grid'
                          ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30'
                          : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                      )}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        viewMode === 'list'
                          ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30'
                          : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                      )}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                  <ShoppingBag className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                  <p className="text-surface-600 dark:text-surface-400">
                    This seller hasn't published any products yet.
                  </p>
                </div>
              ) : (
                <>
                  <div className={cn(
                    viewMode === 'grid'
                      ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  )}>
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} viewMode={viewMode} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => updatePage(currentPage - 1)}
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
                            <button
                              key={pageNum}
                              onClick={() => updatePage(pageNum)}
                              className={cn(
                                'w-10 h-10 rounded-lg font-medium transition-colors',
                                pageNum === currentPage
                                  ? 'bg-primary-600 text-white'
                                  : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700'
                              )}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= pagination.totalPages}
                        onClick={() => updatePage(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Recent Reviews */}
            {reviews.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4">
                  Recent Reviews
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {review.reviewerAvatar ? (
                            <img
                              src={review.reviewerAvatar}
                              alt={review.reviewerName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-primary-600">
                              {review.reviewerName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-surface-900 dark:text-surface-50">
                              {review.reviewerName}
                            </span>
                            {review.isVerifiedPurchase && (
                              <span className="text-xs text-success-600 dark:text-success-400">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <StarRating rating={review.rating} />
                          <Link
                            to={`/shop/product/${review.productSlug}`}
                            className="text-sm text-primary-600 hover:underline mt-1 block"
                          >
                            {review.productTitle}
                          </Link>
                          <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 line-clamp-3">
                            {review.content}
                          </p>
                          <p className="text-xs text-surface-400 mt-2">
                            {new Date(review.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
