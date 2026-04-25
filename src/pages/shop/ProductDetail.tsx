import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Check,
  BookOpen,
  FileText,
  Package,
  Download,
  Shield,
  Truck,
  Clock,
  ChevronRight,
  Minus,
  Plus,
  AlertCircle,
  Loader2,
  BadgeCheck,
  Eye,
  ShoppingBag,
  User,
  MessageSquare,
  ThumbsUp,
  Edit3,
  Trash2,
  Send,
  Sparkles,
  Copy,
  CheckCircle,
  Award,
  Zap
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { useToast } from '@/components/shared/Toast';
import { useCartStore, useWishlistStore } from '@/stores/shopStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';

// API base URL
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

interface ProductData {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  productType: 'physical' | 'digital' | 'bundle';
  coverImage?: string;
  images?: string[];
  author?: string;
  coAuthors?: string[];
  publisher?: string;
  publishYear?: number;
  isbn?: string;
  pages?: number;
  language?: string;
  format?: string;
  edition?: string;
  tableOfContents?: string[];
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  viewCount?: number;
  stockQuantity?: number;
  trackInventory?: boolean;
  categoryName?: string;
  categorySlug?: string;
  tags?: string[];
  previewUrl?: string;
}

interface SellerData {
  id: string;
  name: string;
  storeName: string;
  storeSlug: string;
  storeLogo?: string;
  storeDescription?: string;
  avatar?: string;
  isVerified: boolean;
  totalSales?: number;
  rating?: number;
  reviewCount?: number;
  otherProducts: any[];
}

interface ReviewData {
  id: string;
  rating: number;
  title?: string;
  content: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  reviewerName: string;
  reviewerAvatar?: string;
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAuthenticated } = useAuthStore();
  const { addToCart, isUpdating: isAddingToCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<{
    items: ReviewData[];
    totalCount: number;
    averageRating: number;
    distribution: Record<number, number>;
  }>({ items: [], totalCount: 0, averageRating: 0, distribution: {} });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description');
  const [addedToCart, setAddedToCart] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Review form state
  const [reviewEligibility, setReviewEligibility] = useState<{
    canReview: boolean;
    reason?: string;
    hasPurchased?: boolean;
    existingReview?: ReviewData;
  } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (product && isAuthenticated) {
      checkReviewEligibility();
    }
  }, [product, isAuthenticated]);

  const fetchProduct = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/shop/products/catalog/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Product not found');
        } else {
          throw new Error('Failed to load product');
        }
        return;
      }

      const data = await response.json();
      setProduct(data.product);
      setSeller(data.seller);
      setRelatedProducts(data.relatedProducts || []);
      setReviews(data.reviews || { items: [], totalCount: 0, averageRating: 0, distribution: {} });
    } catch (err) {
      setError('Failed to load product. Please try again.');
      console.error('Product fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in', 'You need to be logged in to add items to cart');
      navigate('/login?redirect=/shop/product/' + slug);
      return;
    }

    if (!product) return;

    try {
      await addToCart(product.id, undefined, quantity);
      setAddedToCart(true);
      toast.success('Added to Cart!', `${product.title} has been added to your cart`);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error('Add to cart error:', err);
      toast.error('Failed to add to cart', err instanceof Error ? err.message : 'Please try again');
    }
  };

  const handleToggleWishlist = () => {
    if (!product) return;

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const handleShare = async () => {
    if (!product) return;

    const shareData = {
      title: product.title,
      text: product.shortDescription || product.title,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const checkReviewEligibility = async () => {
    if (!product) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_BASE}/shop/products/reviews/can-review/${product.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReviewEligibility(data);

        if (data.existingReview) {
          setReviewForm({
            rating: data.existingReview.rating,
            title: data.existingReview.title || '',
            content: data.existingReview.content || '',
          });
        }
      }
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  const handleSubmitReview = async () => {
    if (!product) return;

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/shop/products/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewForm.rating,
          title: reviewForm.title || undefined,
          content: reviewForm.content || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      await fetchProduct();
      await checkReviewEligibility();
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', content: '' });
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleUpdateReview = async () => {
    if (!product || !reviewEligibility?.existingReview) return;

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_BASE}/shop/products/reviews/${reviewEligibility.existingReview.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: reviewForm.rating,
            title: reviewForm.title || undefined,
            content: reviewForm.content || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update review');
      }

      await fetchProduct();
      await checkReviewEligibility();
      setIsEditingReview(false);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to update review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewEligibility?.existingReview) return;

    if (!confirm('Are you sure you want to delete your review?')) return;

    setIsSubmittingReview(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${API_BASE}/shop/products/reviews/${reviewEligibility.existingReview.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      await fetchProduct();
      await checkReviewEligibility();
      setReviewForm({ rating: 5, title: '', content: '' });
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_BASE}/shop/products/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Error marking review as helpful:', err);
    }
  };

  const getProductTypeConfig = () => {
    if (!product) return { icon: BookOpen, label: '', color: '', bgColor: '' };
    switch (product.productType) {
      case 'digital':
        return {
          icon: Download,
          label: 'Digital Download',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30'
        };
      case 'physical':
        return {
          icon: Package,
          label: 'Physical Book',
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30'
        };
      case 'bundle':
        return {
          icon: BookOpen,
          label: 'Bundle',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30'
        };
      default:
        return {
          icon: BookOpen,
          label: product.productType,
          color: 'text-primary-600 dark:text-primary-400',
          bgColor: 'bg-primary-100 dark:bg-primary-900/30'
        };
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md', interactive = false) => {
    const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setReviewForm({ ...reviewForm, rating: star })}
            whileHover={interactive ? { scale: 1.2 } : {}}
            whileTap={interactive ? { scale: 0.9 } : {}}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
          >
            <Star
              className={cn(
                sizeClass,
                'transition-colors',
                star <= Math.round(rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-surface-300 dark:text-surface-600'
              )}
            />
          </motion.button>
        ))}
      </div>
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
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-400">Loading product...</p>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">
              {error || 'Product Not Found'}
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto">
              The product you're looking for doesn't exist or may have been removed.
            </p>
            <Link to="/shop">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Shop
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const isOutOfStock = product.trackInventory && (product.stockQuantity || 0) === 0;
  const allImages = [product.coverImage, ...(product.images || [])].filter(Boolean) as string[];
  const productTypeConfig = getProductTypeConfig();
  const ProductTypeIcon = productTypeConfig.icon;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm"
          >
            <Link to="/shop" className="text-surface-500 hover:text-primary-600 transition-colors">
              Shop
            </Link>
            <ChevronRight className="h-4 w-4 text-surface-400" />
            {product.categoryName && (
              <>
                <Link
                  to={`/shop/browse?category=${product.categorySlug}`}
                  className="text-surface-500 hover:text-primary-600 transition-colors"
                >
                  {product.categoryName}
                </Link>
                <ChevronRight className="h-4 w-4 text-surface-400" />
              </>
            )}
            <span className="text-surface-900 dark:text-white font-medium truncate max-w-[200px]">
              {product.title}
            </span>
          </motion.nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="relative aspect-[3/4] bg-white dark:bg-surface-800 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 shadow-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  {allImages[selectedImage] ? (
                    <img
                      src={allImages[selectedImage]}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/30">
                      <BookOpen className="h-24 w-24 text-primary-400" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Discount Badge */}
              {discount > 0 && (
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg"
                >
                  -{discount}% OFF
                </motion.div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      'flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition-all',
                      selectedImage === idx
                        ? 'border-primary-600 ring-2 ring-primary-200 dark:ring-primary-800'
                        : 'border-surface-200 dark:border-surface-700 hover:border-primary-400'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5',
                productTypeConfig.bgColor,
                productTypeConfig.color
              )}>
                <ProductTypeIcon className="h-3.5 w-3.5" />
                {productTypeConfig.label}
              </span>
              {seller?.isVerified && (
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified Author
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white mb-3">
                {product.title}
              </h1>

              {product.author && (
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  by <span className="text-primary-600 dark:text-primary-400 font-medium">{product.author}</span>
                  {product.coAuthors && product.coAuthors.length > 0 && (
                    <span className="text-surface-500">
                      {' '}and {product.coAuthors.join(', ')}
                    </span>
                  )}
                </p>
              )}

              {/* Rating & Stats */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  {renderStars(product.rating || 0, 'md')}
                  <span className="font-bold text-surface-900 dark:text-white">
                    {(product.rating || 0).toFixed(1)}
                  </span>
                </div>
                <span className="text-surface-500 dark:text-surface-400">
                  ({product.reviewCount || 0} reviews)
                </span>
                <span className="text-surface-400">|</span>
                <span className="text-surface-500 dark:text-surface-400 flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {product.viewCount || 0} views
                </span>
              </div>
            </div>

            {/* Price Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-900/20 rounded-2xl p-5 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <>
                    <span className="text-lg text-surface-400 line-through">
                      {formatCurrency(product.compareAtPrice)}
                    </span>
                    <span className="px-2.5 py-1 bg-red-500 text-white text-sm font-bold rounded-lg">
                      Save {formatCurrency(product.compareAtPrice - product.price)}
                    </span>
                  </>
                )}
              </div>
            </motion.div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-surface-600 dark:text-surface-400 leading-relaxed text-lg">
                {product.shortDescription}
              </p>
            )}

            {/* Stock Status */}
            {product.trackInventory && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium',
                  isOutOfStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                )}
              >
                {isOutOfStock ? (
                  <>
                    <AlertCircle className="h-5 w-5" />
                    <span>Out of Stock</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>In Stock ({product.stockQuantity} available)</span>
                  </>
                )}
              </motion.div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              {product.productType === 'physical' && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Quantity:
                  </span>
                  <div className="flex items-center bg-surface-100 dark:bg-surface-700 rounded-xl p-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 rounded-lg hover:bg-white dark:hover:bg-surface-600 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </motion.button>
                    <span className="w-12 text-center font-semibold text-surface-900 dark:text-white">{quantity}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 rounded-lg hover:bg-white dark:hover:bg-surface-600 transition-colors"
                      disabled={product.trackInventory && quantity >= (product.stockQuantity || 0)}
                    >
                      <Plus className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAddingToCart}
                  className={cn(
                    'flex-1 py-4 px-6 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg',
                    addedToCart
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-primary-600 to-emerald-600 text-white hover:from-primary-700 hover:to-emerald-700 shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isAddingToCart ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : addedToCart ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleToggleWishlist}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all',
                    isInWishlist(product.id)
                      ? 'bg-red-50 border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-800'
                      : 'border-surface-200 dark:border-surface-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                  )}
                >
                  <Heart className={cn('h-6 w-6', isInWishlist(product.id) && 'fill-current')} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-4 rounded-xl border-2 border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                >
                  {copiedLink ? (
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <Share2 className="h-6 w-6" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-surface-200 dark:border-surface-700">
              {[
                { icon: Shield, label: 'Secure Payment', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
                product.productType === 'digital'
                  ? { icon: Zap, label: 'Instant Download', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' }
                  : { icon: Truck, label: 'Fast Delivery', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                { icon: Award, label: '24/7 Support', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              ].map((badge, idx) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className={cn('w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2', badge.bg)}>
                    <badge.icon className={cn('h-6 w-6', badge.color)} />
                  </div>
                  <p className="text-xs font-medium text-surface-600 dark:text-surface-400">
                    {badge.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Seller Info */}
            {seller && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-200 dark:border-surface-700 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 overflow-hidden flex-shrink-0">
                    {seller.avatar || seller.storeLogo ? (
                      <img
                        src={seller.avatar || seller.storeLogo}
                        alt={seller.storeName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-7 w-7 text-primary-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-surface-900 dark:text-white">
                        {seller.storeName}
                      </p>
                      {seller.isVerified && (
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400 mt-1">
                      {seller.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          {seller.rating.toFixed(1)}
                        </span>
                      )}
                      <span>{seller.totalSales || 0} sales</span>
                    </div>
                  </div>
                  <Link to={`/shop/store/${seller.storeSlug}`}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors border border-primary-200 dark:border-primary-800"
                    >
                      View Store
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <div className="border-b border-surface-200 dark:border-surface-700">
            <div className="flex gap-2">
              {(['description', 'details', 'reviews'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  whileHover={{ y: -2 }}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'py-4 px-6 font-medium border-b-2 -mb-px transition-all capitalize rounded-t-lg',
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600 bg-primary-50/50 dark:bg-primary-900/20'
                      : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                >
                  {tab === 'reviews' ? `Reviews (${reviews.totalCount})` : tab}
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-8"
            >
              {/* Description Tab */}
              {activeTab === 'description' && (
                <div className="prose dark:prose-invert max-w-none">
                  <div
                    className={cn(
                      'text-surface-600 dark:text-surface-400 leading-relaxed',
                      !showFullDescription && 'line-clamp-6'
                    )}
                    dangerouslySetInnerHTML={{ __html: product.description || 'No description available.' }}
                  />
                  {product.description && product.description.length > 500 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-4 text-primary-600 dark:text-primary-400 font-medium hover:underline"
                    >
                      {showFullDescription ? 'Show Less' : 'Read More'}
                    </motion.button>
                  )}

                  {/* Table of Contents */}
                  {product.tableOfContents && product.tableOfContents.length > 0 && (
                    <div className="mt-8 bg-surface-100 dark:bg-surface-800 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
                        Table of Contents
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-surface-600 dark:text-surface-400">
                        {product.tableOfContents.map((item, idx) => (
                          <li key={idx} className="pl-2">{item}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
                      Product Details
                    </h3>
                    <dl className="space-y-4">
                      {[
                        { label: 'Author', value: product.author },
                        { label: 'Publisher', value: product.publisher },
                        { label: 'Year', value: product.publishYear },
                        { label: 'Edition', value: product.edition },
                        { label: 'Pages', value: product.pages },
                        { label: 'Language', value: product.language },
                        { label: 'Format', value: product.format },
                        { label: 'ISBN', value: product.isbn },
                      ].filter(item => item.value).map((item) => (
                        <div key={item.label} className="flex border-b border-surface-100 dark:border-surface-700 pb-3 last:border-0">
                          <dt className="w-32 text-surface-500 dark:text-surface-400">{item.label}</dt>
                          <dd className="text-surface-900 dark:text-white font-medium">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {product.tags && product.tags.length > 0 && (
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, idx) => (
                          <Link
                            key={idx}
                            to={`/shop/browse?search=${encodeURIComponent(tag)}`}
                          >
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className="px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 rounded-full text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400 transition-colors inline-block"
                            >
                              {tag}
                            </motion.span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-8">
                  {/* Rating Summary */}
                  <div className="bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-primary-200 dark:border-primary-800">
                    <div className="flex flex-col md:flex-row md:items-center gap-8">
                      <div className="text-center md:border-r md:pr-8 border-primary-200 dark:border-primary-700">
                        <div className="text-6xl font-bold text-primary-600 dark:text-primary-400">
                          {reviews.averageRating.toFixed(1)}
                        </div>
                        <div className="mt-2">
                          {renderStars(reviews.averageRating, 'lg')}
                        </div>
                        <p className="text-surface-500 dark:text-surface-400 mt-2">
                          {reviews.totalCount} reviews
                        </p>
                      </div>

                      <div className="flex-1 space-y-3">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviews.distribution[star] || 0;
                          const percentage = reviews.totalCount > 0
                            ? (count / reviews.totalCount) * 100
                            : 0;
                          return (
                            <div key={star} className="flex items-center gap-3">
                              <span className="text-sm text-surface-600 dark:text-surface-400 w-16 flex items-center gap-1">
                                {star} <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                              </span>
                              <div className="flex-1 h-3 bg-white dark:bg-surface-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.5, delay: 0.1 * (5 - star) }}
                                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                                />
                              </div>
                              <span className="text-sm text-surface-500 dark:text-surface-400 w-10 text-right">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Write Review Section */}
                  {isAuthenticated ? (
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                      {reviewEligibility?.existingReview && !isEditingReview ? (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                              Your Review
                            </h3>
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsEditingReview(true)}
                                className="p-2 text-surface-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <Edit3 className="h-5 w-5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleDeleteReview}
                                disabled={isSubmittingReview}
                                className="p-2 text-surface-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-5 w-5" />
                              </motion.button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            {renderStars(reviewEligibility.existingReview.rating, 'md')}
                            {reviewEligibility.existingReview.isVerifiedPurchase && (
                              <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                                <CheckCircle className="h-3 w-3" />
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          {reviewEligibility.existingReview.title && (
                            <h4 className="font-semibold text-surface-900 dark:text-white mb-2">
                              {reviewEligibility.existingReview.title}
                            </h4>
                          )}
                          <p className="text-surface-600 dark:text-surface-400">
                            {reviewEligibility.existingReview.content}
                          </p>
                        </div>
                      ) : (showReviewForm || isEditingReview) ? (
                        <div>
                          <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
                            {isEditingReview ? 'Edit Your Review' : 'Write a Review'}
                          </h3>

                          {reviewError && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                              {reviewError}
                            </div>
                          )}

                          {/* Star Rating Selector */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                              Rating *
                            </label>
                            <div className="flex items-center gap-2">
                              {renderStars(reviewForm.rating, 'lg', true)}
                              <span className="ml-3 text-surface-600 dark:text-surface-400 font-medium">
                                {reviewForm.rating} star{reviewForm.rating !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Title Input */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                              Review Title (optional)
                            </label>
                            <input
                              type="text"
                              value={reviewForm.title}
                              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                              placeholder="Summarize your experience"
                              className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                              maxLength={100}
                            />
                          </div>

                          {/* Content Textarea */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                              Your Review (optional)
                            </label>
                            <textarea
                              value={reviewForm.content}
                              onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                              placeholder="Share your thoughts about this product..."
                              rows={4}
                              className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                              maxLength={2000}
                            />
                            <p className="text-xs text-surface-500 mt-2">
                              {reviewForm.content.length}/2000 characters
                            </p>
                          </div>

                          {/* Submit Buttons */}
                          <div className="flex gap-3">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={isEditingReview ? handleUpdateReview : handleSubmitReview}
                              disabled={isSubmittingReview}
                              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-600/30 flex items-center gap-2"
                            >
                              {isSubmittingReview ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Send className="h-5 w-5" />
                              )}
                              {isEditingReview ? 'Update Review' : 'Submit Review'}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setShowReviewForm(false);
                                setIsEditingReview(false);
                                setReviewError(null);
                                if (reviewEligibility?.existingReview) {
                                  setReviewForm({
                                    rating: reviewEligibility.existingReview.rating,
                                    title: reviewEligibility.existingReview.title || '',
                                    content: reviewEligibility.existingReview.content || '',
                                  });
                                } else {
                                  setReviewForm({ rating: 5, title: '', content: '' });
                                }
                              }}
                              className="px-6 py-3 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-semibold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 transition-all"
                            >
                              Cancel
                            </motion.button>
                          </div>
                        </div>
                      ) : reviewEligibility?.canReview ? (
                        <div className="text-center py-6">
                          <Sparkles className="h-12 w-12 text-primary-400 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                            Share Your Experience
                          </h3>
                          <p className="text-surface-500 dark:text-surface-400 mb-6">
                            {reviewEligibility.hasPurchased
                              ? 'You purchased this product. Your review will show a verified purchase badge!'
                              : 'Help others by sharing your thoughts about this product.'}
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowReviewForm(true)}
                            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-emerald-700 transition-all shadow-lg shadow-primary-600/30 flex items-center gap-2 mx-auto"
                          >
                            <Edit3 className="h-5 w-5" />
                            Write a Review
                          </motion.button>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <MessageSquare className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                          <p className="text-surface-500 dark:text-surface-400">
                            {reviewEligibility?.reason || 'You cannot review this product at this time.'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 text-center">
                      <MessageSquare className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                        Want to Leave a Review?
                      </h3>
                      <p className="text-surface-500 dark:text-surface-400 mb-6">
                        Sign in to share your thoughts about this product.
                      </p>
                      <Link to={`/login?redirect=/shop/product/${slug}`}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-emerald-700 transition-all shadow-lg shadow-primary-600/30"
                        >
                          Sign In to Review
                        </motion.button>
                      </Link>
                    </div>
                  )}

                  {/* Review List */}
                  {reviews.items.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.items.map((review, index) => {
                        const isOwnReview = reviewEligibility?.existingReview?.id === review.id;
                        return (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              'bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700',
                              isOwnReview && 'ring-2 ring-primary-200 dark:ring-primary-800'
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 overflow-hidden flex-shrink-0">
                                {review.reviewerAvatar ? (
                                  <img
                                    src={review.reviewerAvatar}
                                    alt={review.reviewerName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <span className="font-semibold text-surface-900 dark:text-white">
                                    {review.reviewerName}
                                  </span>
                                  {isOwnReview && (
                                    <span className="text-xs text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-full font-medium">
                                      Your Review
                                    </span>
                                  )}
                                  {review.isVerifiedPurchase && (
                                    <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                                      <CheckCircle className="h-3 w-3" />
                                      Verified Purchase
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                  {renderStars(review.rating, 'sm')}
                                  <span className="text-sm text-surface-500 dark:text-surface-400">
                                    {new Date(review.createdAt).toLocaleDateString('en-GB', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                {review.title && (
                                  <h4 className="font-semibold text-surface-900 dark:text-white mb-2">
                                    {review.title}
                                  </h4>
                                )}
                                <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                                  {review.content}
                                </p>

                                {!isOwnReview && isAuthenticated && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleMarkHelpful(review.id)}
                                    className="mt-4 flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 transition-colors"
                                  >
                                    <ThumbsUp className="h-4 w-4" />
                                    <span>Helpful</span>
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700">
                      <MessageSquare className="h-16 w-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                        No Reviews Yet
                      </h3>
                      <p className="text-surface-500 dark:text-surface-400">
                        Be the first to review this product!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 pt-12 border-t border-surface-200 dark:border-surface-700"
          >
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary-600" />
              You May Also Like
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {relatedProducts.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                >
                  <Link
                    to={`/shop/product/${item.slug}`}
                    className="group bg-white dark:bg-surface-800 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 block"
                  >
                    <div className="aspect-[3/4] bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-primary-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-surface-900 dark:text-white text-sm line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{item.author}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-surface-600 dark:text-surface-400 font-medium">{(item.rating || 0).toFixed(1)}</span>
                      </div>
                      <p className="font-bold text-primary-600 dark:text-primary-400 mt-2">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Seller's Other Products */}
        {seller?.otherProducts && seller.otherProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 pt-12 border-t border-surface-200 dark:border-surface-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
                More from {seller.storeName}
              </h2>
              <Link
                to={`/shop/store/${seller.storeSlug}`}
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium flex items-center gap-1"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {seller.otherProducts.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                >
                  <Link
                    to={`/shop/product/${item.slug}`}
                    className="group bg-white dark:bg-surface-800 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 block"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-primary-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-surface-900 dark:text-white text-sm line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="font-bold text-primary-600 dark:text-primary-400 mt-2">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
