import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  Download,
  Copy,
  Smartphone,
  ArrowRight,
  Package,
  BookOpen,
  FileText,
  Loader2,
  AlertCircle,
  Mail,
  Sparkles
} from 'lucide-react';
import { useOrdersStore, useCheckoutStore } from '@/stores/shopStore';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const { selectedOrder, fetchOrder, downloadDigitalProduct } = useOrdersStore();
  const { paymentInstructions, verifyPayment, clearCheckout } = useCheckoutStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;

    const loadOrder = async () => {
      setIsLoading(true);
      try {
        // Check for Paystack callback parameters
        const reference = searchParams.get('reference') || searchParams.get('trxref');

        if (reference && !paymentVerified) {
          setIsVerifying(true);
          try {
            // Pass the reference (which is the order number used with Paystack)
            // The reference returned by Paystack IS the order number we initialized with
            await verifyPayment(reference, reference);
            setPaymentVerified(true);
          } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            // Still load order even if verification fails
          } finally {
            setIsVerifying(false);
          }
        }

        await fetchOrder(orderNumber);
      } catch (err) {
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();

    return () => {
      clearCheckout();
    };
  }, [orderNumber, searchParams, fetchOrder, clearCheckout, verifyPayment, paymentVerified]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = async (itemId: string) => {
    if (!orderNumber) return;
    setDownloadingItem(itemId);
    try {
      await downloadDigitalProduct(orderNumber, itemId);
    } finally {
      setDownloadingItem(null);
    }
  };

  const getProductIcon = (productType: string) => {
    switch (productType) {
      case 'ebook':
      case 'digital':
        return <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'document':
        return <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'physical':
        return <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <BookOpen className="h-5 w-5 text-primary-600" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-400">
            {isVerifying ? 'Verifying payment...' : 'Loading order details...'}
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !selectedOrder) {
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
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">Order Not Found</h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto">
              {error || "We couldn't find this order. Please check the order number and try again."}
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30"
            >
              Back to Shop
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const isPending = selectedOrder.paymentStatus === 'pending';
  const isCompleted = selectedOrder.paymentStatus === 'completed';
  const hasDigitalProducts = selectedOrder.items?.some(
    (item: any) => item.productType === 'ebook' || item.productType === 'document' || item.productType === 'digital'
  );
  const hasPhysicalProducts = selectedOrder.items?.some(
    (item: any) => item.productType === 'physical'
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className={cn(
              'w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center',
              isCompleted
                ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30'
                : 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30'
            )}
          >
            {isCompleted ? (
              <CheckCircle className="h-14 w-14 text-white" />
            ) : (
              <Clock className="h-14 w-14 text-white" />
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-surface-900 dark:text-white mb-3"
          >
            {isCompleted ? 'Order Confirmed!' : 'Order Placed!'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-surface-600 dark:text-surface-400 text-lg"
          >
            {isCompleted
              ? 'Thank you for your purchase. Your order has been confirmed.'
              : 'Your order is awaiting payment confirmation.'}
          </motion.p>
        </motion.div>

        {/* Order Number Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 mb-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Order Number</p>
              <p className="text-2xl font-mono font-bold text-surface-900 dark:text-white">
                {selectedOrder.orderNumber}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleCopy(selectedOrder.orderNumber, 'orderNumber')}
              className="p-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
            >
              {copiedField === 'orderNumber' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </motion.button>
          </div>

          <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 flex items-center gap-4 flex-wrap">
            <span className={cn('px-3 py-1.5 rounded-full text-sm font-medium', getPaymentStatusColor(selectedOrder.paymentStatus))}>
              Payment: {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
            </span>
            <span className="text-surface-500 dark:text-surface-400 text-sm">
              Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </motion.div>

        {/* Payment Instructions (for pending mobile money) */}
        {isPending && paymentInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 mb-6"
          >
            <h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Complete Your Payment
            </h2>

            <div className="space-y-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                {paymentInstructions.message || 'Follow these steps to complete your payment:'}
              </p>

              <div className="bg-white dark:bg-surface-800 rounded-xl p-4 space-y-3 shadow-sm">
                {paymentInstructions.steps?.map((step: string, index: number) => (
                  <div key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-yellow-400 to-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                      {index + 1}
                    </span>
                    <p className="text-surface-700 dark:text-surface-300 pt-0.5">{step}</p>
                  </div>
                ))}
              </div>

              {paymentInstructions.merchantCode && (
                <div className="flex items-center justify-between p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm">
                  <div>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Merchant Code</p>
                    <p className="font-mono font-bold text-xl text-surface-900 dark:text-white">{paymentInstructions.merchantCode}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCopy(paymentInstructions.merchantCode, 'merchantCode')}
                    className="p-2.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                  >
                    {copiedField === 'merchantCode' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </motion.button>
                </div>
              )}

              {paymentInstructions.reference && (
                <div className="flex items-center justify-between p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm">
                  <div>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Payment Reference</p>
                    <p className="font-mono font-bold text-xl text-surface-900 dark:text-white">{paymentInstructions.reference}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCopy(paymentInstructions.reference, 'reference')}
                    className="p-2.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                  >
                    {copiedField === 'reference' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Digital Products - Download Section */}
        {isCompleted && hasDigitalProducts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-6"
          >
            <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Your Digital Products
            </h2>

            <div className="space-y-3">
              {selectedOrder.items
                ?.filter((item: any) => item.productType === 'ebook' || item.productType === 'document' || item.productType === 'digital')
                .map((item: any, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        {getProductIcon(item.productType)}
                      </div>
                      <div>
                        <p className="font-semibold text-surface-900 dark:text-white">{item.title}</p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 capitalize">
                          {item.productType === 'ebook' || item.productType === 'digital' ? 'Digital Product' : item.productType}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDownload(item.id)}
                      disabled={downloadingItem === item.id}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                    >
                      {downloadingItem === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Download
                    </motion.button>
                  </motion.div>
                ))}
            </div>

            <p className="text-sm text-blue-700 dark:text-blue-300 mt-4">
              You can also access your digital products anytime from your{' '}
              <Link to="/shop/orders" className="underline font-medium hover:text-blue-900 dark:hover:text-blue-100">
                order history
              </Link>.
            </p>
          </motion.div>
        )}

        {/* Physical Products - Shipping Info */}
        {hasPhysicalProducts && selectedOrder.shippingDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-6"
          >
            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipping Information
            </h2>

            <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-surface-900 dark:text-white">
                {selectedOrder.shippingDetails.fullName}
              </p>
              <p className="text-surface-600 dark:text-surface-400">{selectedOrder.shippingDetails.phone}</p>
              <p className="text-surface-600 dark:text-surface-400">{selectedOrder.shippingDetails.address}</p>
              <p className="text-surface-600 dark:text-surface-400">
                {selectedOrder.shippingDetails.city}, {selectedOrder.shippingDetails.region}
              </p>
            </div>

            <p className="text-sm text-amber-700 dark:text-amber-300 mt-4">
              You'll receive updates about your shipment via email and SMS.
            </p>
          </motion.div>
        )}

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 mb-6 shadow-lg"
        >
          <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4">Order Items</h2>

          <div className="divide-y divide-surface-100 dark:divide-surface-700">
            {selectedOrder.items?.map((item: any) => (
              <div key={item.id} className="py-4 flex items-center gap-4">
                <div className="w-14 h-18 bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 rounded-xl overflow-hidden flex-shrink-0">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getProductIcon(item.productType)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 dark:text-white truncate">{item.title}</p>
                  <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {getProductIcon(item.productType)}
                    <span className="capitalize">
                      {item.productType === 'ebook' || item.productType === 'digital' ? 'Digital' : item.productType}
                    </span>
                    <span className="text-surface-300 dark:text-surface-600">•</span>
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
                <p className="font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-surface-200 dark:border-surface-700 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-surface-600 dark:text-surface-400">
              <span>Subtotal</span>
              <span>{formatCurrency(selectedOrder.subtotal)}</span>
            </div>
            {selectedOrder.discount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>-{formatCurrency(selectedOrder.discount)}</span>
              </div>
            )}
            {selectedOrder.platformFee > 0 && (
              <div className="flex justify-between text-surface-600 dark:text-surface-400">
                <span>Platform Fee</span>
                <span>{formatCurrency(selectedOrder.platformFee)}</span>
              </div>
            )}
            {selectedOrder.shipping > 0 && (
              <div className="flex justify-between text-surface-600 dark:text-surface-400">
                <span>Shipping</span>
                <span>{formatCurrency(selectedOrder.shipping)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-surface-900 dark:text-white pt-3 border-t border-surface-200 dark:border-surface-700">
              <span>Total</span>
              <span className="text-primary-600 dark:text-primary-400">{formatCurrency(selectedOrder.total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Confirmation Email Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-surface-100 dark:bg-surface-800/50 rounded-2xl p-6 mb-8 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-surface-700 dark:text-surface-300 font-medium">
              A confirmation email has been sent to your registered email address with your order details.
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Please check your spam folder if you don't see it in your inbox.
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/shop/orders">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-emerald-700 transition-all shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2"
            >
              View All Orders
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </Link>
          <Link to="/shop">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 font-semibold rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Continue Shopping
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
