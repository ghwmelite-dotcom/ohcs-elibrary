import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, BookOpen, Star, Download, Package, BadgeCheck,
  Flame, Loader2, ShoppingCart, Trash2, ShoppingBag,
  AlertCircle, Grid3X3, List, Sparkles, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { useWishlistStore, useCartStore } from '@/stores/shopStore';
import { useAuthStore } from '@/stores/authStore';
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
  storeName?: string;
  storeSlug?: string;
  sellerVerified?: boolean;
  isBestseller?: boolean;
  stockQuantity?: number;
  trackInventory?: boolean;
}

export default function Wishlist() {
  const { user, isAuthenticated } = useAuthStore();
  const { items: wishlistItems, removeFromWishlist } = useWishlistStore();
  const { addToCart, isUpdating: isAddingToCart } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlistProducts();
  }, [wishlistItems]);

  const fetchWishlistProducts = async () => {
    if (wishlistItems.length === 0) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const productIds = wishlistItems.map((item) => item.productId);
      const productPromises = productIds.map(async (productId) => {
        try {
          const response = await fetch(`${API_BASE}/shop/products/catalog/id/${productId}`);
          if (response.ok) {
            const data = await response.json();
            return data.product;
          }
          return null;
        } catch {
          return null;
        }
      });

      const fetchedProducts = await Promise.all(productPromises);
      setProducts(fetchedProducts.filter(Boolean) as Product[]);
    } catch (err) {
      console.error('Error fetching wishlist products:', err);
      setError('Unable to load wishlist products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/shop/wishlist';
      return;
    }

    setAddingToCartId(product.id);
    try {
      await addToCart(product.id, undefined, 1);
    } catch (err) {
      console.error('Add to cart error:', err);
    } finally {
      setAddingToCartId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveAllToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/shop/wishlist';
      return;
    }

    for (const product of products) {
      try {
        await addToCart(product.id, undefined, 1);
      } catch (err) {
        console.error(`Failed to add ${product.title} to cart:`, err);
      }
    }
  };

  const handleClearWishlist = () => {
    if (confirm('Are you sure you want to clear your wishlist?')) {
      wishlistItems.forEach((item) => {
        removeFromWishlist(item.productId);
      });
    }
  };

  // Product Card Component
  const ProductCard = ({ product, viewMode, index }: { product: Product; viewMode: 'grid' | 'list'; index: number }) => {
    const isDigital = product.productType === 'digital';
    const discount = product.compareAtPrice
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;
    const isOutOfStock = product.trackInventory && (product.stockQuantity || 0) === 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'group bg-white dark:bg-surface-800 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300',
          viewMode === 'list' && 'flex'
        )}
      >
        {/* Product Image */}
        <Link
          to={`/shop/product/${product.slug}`}
          className={cn(
            'relative bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center overflow-hidden block',
            viewMode === 'grid' ? 'aspect-[4/3]' : 'w-40 h-36 flex-shrink-0'
          )}
        >
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

          {/* Wishlist Heart */}
          <div className="absolute bottom-3 right-3">
            <motion.div
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
            >
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            </motion.div>
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <span className="bg-white px-4 py-2 rounded-full text-sm font-medium text-surface-900 shadow-lg">
                Out of Stock
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

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

          <Link to={`/shop/product/${product.slug}`}>
            <h3 className="font-semibold text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2">
              {product.title}
            </h3>
          </Link>

          {product.author && (
            <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
              by {product.author}
            </p>
          )}

          {product.storeName && (
            <Link
              to={`/shop/store/${product.storeSlug}`}
              className="text-sm text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 mt-1 block transition-colors"
            >
              {product.author ? product.storeName : `by ${product.storeName}`}
            </Link>
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
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-surface-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAddToCart(product)}
              disabled={isOutOfStock || addingToCartId === product.id}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-medium rounded-xl hover:from-primary-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/20"
            >
              {addingToCartId === product.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleRemove(product.id)}
              disabled={removingId === product.id}
              className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              {removingId === product.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-400">Loading your wishlist...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Heart className="w-7 h-7 text-red-500 fill-red-500" />
                </motion.div>
                My Wishlist
              </h1>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                {wishlistItems.length === 0
                  ? 'No items saved yet'
                  : `${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} saved for later`}
              </p>
            </motion.div>

            {products.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClearWishlist}
                  className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMoveAllToCart}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-emerald-700 transition-all shadow-lg shadow-primary-600/30"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add All to Cart
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {wishlistItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/20 flex items-center justify-center"
            >
              <Heart className="w-12 h-12 text-red-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">
              Your Wishlist is Empty
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto">
              Save products you love by clicking the heart icon on product pages. Your saved items will appear here.
            </p>
            <Link to="/shop/browse">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-emerald-700 transition-all shadow-lg shadow-primary-600/30"
              >
                <Sparkles className="w-5 h-5" />
                Browse Products
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-6"
            >
              <p className="text-surface-600 dark:text-surface-400">
                {products.length} of {wishlistItems.length} products available
              </p>

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
            {products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700"
              >
                <AlertCircle className="w-16 h-16 text-surface-300 mx-auto mb-4" />
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  Some of your saved products may no longer be available.
                </p>
                <Button
                  variant="outline"
                  onClick={handleClearWishlist}
                >
                  Clear Unavailable Items
                </Button>
              </motion.div>
            ) : (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              )}>
                <AnimatePresence mode="popLayout">
                  {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} viewMode={viewMode} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* Continue Shopping Section */}
        {wishlistItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-700"
          >
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4">
              Continue Shopping
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop/browse">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 font-medium hover:border-primary-300 dark:hover:border-primary-600 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Browse All Products
                </motion.button>
              </Link>
              <Link to="/shop/browse?sort=bestselling">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 font-medium hover:border-primary-300 dark:hover:border-primary-600 transition-all"
                >
                  <Flame className="w-4 h-4 text-orange-500" />
                  Bestsellers
                </motion.button>
              </Link>
              <Link to="/shop/browse?sort=newest">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-700 dark:text-surface-300 font-medium hover:border-primary-300 dark:hover:border-primary-600 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  New Arrivals
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
