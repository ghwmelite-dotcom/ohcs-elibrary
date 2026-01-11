import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  AlertCircle,
  Loader2,
  BookOpen,
  FileText,
  Package,
  Download,
  Shield,
  Clock,
  BadgeCheck,
  ArrowRight,
  Sparkles,
  Tag
} from 'lucide-react';
import { useCartStore } from '@/stores/shopStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    items,
    summary,
    isLoading,
    isUpdating,
    fetchCart,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCartStore();

  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await updateQuantity(itemId, newQuantity);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItems(prev => new Set(prev).add(itemId));
    try {
      await removeFromCart(itemId);
    } finally {
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  const getProductIcon = (productType: string) => {
    switch (productType) {
      case 'ebook':
      case 'digital':
        return <Download className="h-5 w-5 text-blue-600" />;
      case 'document':
        return <FileText className="h-5 w-5 text-purple-600" />;
      case 'physical':
        return <Package className="h-5 w-5 text-amber-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-primary-600" />;
    }
  };

  const getProductTypeBadge = (productType: string) => {
    const isDigital = productType === 'ebook' || productType === 'digital' || productType === 'document';
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        isDigital
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      )}>
        {getProductIcon(productType)}
        <span>{isDigital ? 'Digital' : 'Physical'}</span>
      </span>
    );
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-surface-400" />
            </div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">Your Cart</h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto">
              Please sign in to view your cart and complete your purchase.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40"
            >
              Sign In to Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-400">Loading your cart...</p>
        </motion.div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center"
            >
              <ShoppingBag className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">Your Cart is Empty</h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Discover amazing resources from our marketplace!
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Browse Products
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/shop"
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-primary-600" />
                  Shopping Cart
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-1">
                  {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cart
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-5 transition-all hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800',
                    removingItems.has(item.id) && 'opacity-50'
                  )}
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link
                      to={`/shop/product/${item.slug}`}
                      className="w-24 h-32 bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 rounded-xl overflow-hidden flex-shrink-0 group"
                    >
                      {item.coverImage ? (
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-primary-400" />
                        </div>
                      )}
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/shop/product/${item.slug}`}
                            className="font-semibold text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 transition-colors"
                          >
                            {item.title}
                          </Link>
                          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                            by {item.storeName}
                          </p>
                          <div className="mt-2">
                            {getProductTypeBadge(item.productType)}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removingItems.has(item.id)}
                          className="p-2 text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          {removingItems.has(item.id) ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-surface-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </motion.button>
                          <span className="w-10 text-center font-semibold text-surface-900 dark:text-white">
                            {updatingItems.has(item.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItems.has(item.id)}
                            className="p-2 rounded-md hover:bg-white dark:hover:bg-surface-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </motion.button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-bold text-xl text-primary-600 dark:text-primary-400">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-surface-500 dark:text-surface-400">
                              {formatCurrency(item.price)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 sticky top-24"
            >
              <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-6 flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary-600" />
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                  <span>Subtotal ({summary.itemCount} items)</span>
                  <span className="font-medium text-surface-900 dark:text-white">{formatCurrency(summary.subtotal)}</span>
                </div>
                {summary.hasPhysicalProducts && (
                  <div className="flex justify-between text-surface-600 dark:text-surface-400">
                    <span>Shipping</span>
                    <span className="text-sm italic">Calculated at checkout</span>
                  </div>
                )}
              </div>

              <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold text-surface-900 dark:text-white">
                  <span>Total</span>
                  <span className="text-primary-600 dark:text-primary-400">{formatCurrency(summary.subtotal)}</span>
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  Excluding applicable fees
                </p>
              </div>

              {summary.hasPhysicalProducts && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6"
                >
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Your cart contains physical items. Shipping details will be collected at checkout.
                    </p>
                  </div>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/shop/checkout')}
                disabled={isUpdating}
                className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </motion.button>

              <Link
                to="/shop"
                className="block w-full text-center py-3 mt-4 text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Continue Shopping
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Shield, label: 'Secure', color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
                    { icon: Clock, label: '24/7 Support', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { icon: BadgeCheck, label: 'Verified', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  ].map((badge) => (
                    <motion.div
                      key={badge.label}
                      whileHover={{ scale: 1.05 }}
                      className="text-center"
                    >
                      <div className={cn('w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-1', badge.bg)}>
                        <badge.icon className={cn('w-5 h-5', badge.color)} />
                      </div>
                      <p className="text-xs text-surface-600 dark:text-surface-400">{badge.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
