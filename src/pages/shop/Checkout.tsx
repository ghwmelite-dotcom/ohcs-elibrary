import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  MapPin,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Tag,
  X,
  Check,
  ChevronRight,
  BookOpen,
  FileText,
  Package,
  Lock,
  Truck,
  Download,
  Receipt,
  Sparkles,
  Store,
  Clock,
  CheckCircle2,
  Circle,
  Building2,
  Wallet
} from 'lucide-react';
import { useCartStore, useCheckoutStore } from '@/stores/shopStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { Button } from '@/components/shared/Button';

// Mobile Money provider configurations
const PAYMENT_METHODS = [
  {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    shortName: 'MTN MoMo',
    icon: '/images/mtn-momo.png',
    iconFallback: '🟡',
    color: 'from-yellow-400 to-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    selectedBorder: 'ring-2 ring-yellow-500 border-yellow-500',
    textColor: 'text-yellow-700 dark:text-yellow-400',
  },
  {
    id: 'vodafone_cash',
    name: 'Vodafone Cash',
    shortName: 'Vodafone',
    icon: '/images/vodafone-cash.png',
    iconFallback: '🔴',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    selectedBorder: 'ring-2 ring-red-500 border-red-500',
    textColor: 'text-red-700 dark:text-red-400',
  },
  {
    id: 'airteltigo_money',
    name: 'AirtelTigo Money',
    shortName: 'AirtelTigo',
    icon: '/images/airteltigo.png',
    iconFallback: '🔵',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    selectedBorder: 'ring-2 ring-blue-500 border-blue-500',
    textColor: 'text-blue-700 dark:text-blue-400',
  },
  {
    id: 'card',
    name: 'Debit/Credit Card',
    shortName: 'Card',
    icon: '/images/card.png',
    iconFallback: '💳',
    color: 'from-gray-600 to-gray-700',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50',
    borderColor: 'border-gray-200 dark:border-gray-700',
    selectedBorder: 'ring-2 ring-primary-500 border-primary-500',
    textColor: 'text-gray-700 dark:text-gray-300',
  },
];

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono',
  'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, summary, fetchCart } = useCartStore();
  const {
    checkoutData,
    appliedDiscount,
    fetchCheckoutSummary,
    applyDiscount,
    removeDiscount,
    processCheckout,
  } = useCheckoutStore();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [paymentMethod, setPaymentMethod] = useState('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Shipping state
  const [shippingDetails, setShippingDetails] = useState({
    fullName: user?.displayName || '',
    phone: '',
    address: '',
    city: '',
    region: '',
    notes: '',
  });

  const totalSteps = summary?.hasPhysicalProducts ? 3 : 2;

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/shop/checkout');
      return;
    }

    const loadCheckout = async () => {
      setIsLoading(true);
      try {
        await fetchCart();
        await fetchCheckoutSummary();
      } catch (err) {
        setError('Failed to load checkout data');
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckout();
  }, [user, navigate, fetchCart, fetchCheckoutSummary]);

  useEffect(() => {
    if (user?.displayName) {
      setShippingDetails(prev => ({
        ...prev,
        fullName: user.displayName || prev.fullName
      }));
    }
  }, [user]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    setIsApplyingDiscount(true);
    setDiscountError(null);

    try {
      const result = await applyDiscount(discountCode.trim());
      if (!result.valid) {
        setDiscountError(result.error || 'Invalid discount code');
      } else {
        setDiscountCode('');
      }
    } catch (err) {
      setDiscountError('Failed to apply discount');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    removeDiscount();
    setDiscountCode('');
  };

  const handleSubmit = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      if (paymentMethod !== 'card' && !phoneNumber) {
        setError('Please enter your mobile money phone number');
        setIsProcessing(false);
        return;
      }

      if (summary?.hasPhysicalProducts) {
        const { fullName, phone, address, city, region } = shippingDetails;
        if (!fullName || !phone || !address || !city || !region) {
          setError('Please complete all shipping details');
          setIsProcessing(false);
          return;
        }
      }

      // Map payment method to API format
      const apiPaymentMethod = paymentMethod === 'card' ? 'card' : 'mobile_money';
      const mobileProvider = paymentMethod === 'mtn_momo' ? 'MTN'
        : paymentMethod === 'vodafone_cash' ? 'Vodafone'
        : paymentMethod === 'airteltigo_money' ? 'AirtelTigo'
        : undefined;

      const result = await processCheckout({
        paymentMethod: apiPaymentMethod,
        mobileMoneyProvider: mobileProvider,
        mobileMoneyNumber: apiPaymentMethod === 'mobile_money' ? phoneNumber : undefined,
        shippingAddress: summary?.hasPhysicalProducts ? {
          name: shippingDetails.fullName,
          phone: shippingDetails.phone,
          address: shippingDetails.address,
          city: shippingDetails.city,
          region: shippingDetails.region,
          notes: shippingDetails.notes,
        } : undefined,
        customerNote: shippingDetails.notes,
      });

      if (result.success && result.orderNumber) {
        // For card payments, redirect to Paystack
        if (paymentMethod === 'card') {
          if (result.paystackData?.authorization_url) {
            window.location.href = result.paystackData.authorization_url;
          } else {
            // Paystack initialization failed
            setError('Payment gateway initialization failed. Please try again or choose a different payment method.');
          }
        } else {
          // For mobile money, go to confirmation page
          navigate(`/shop/orders/${result.orderNumber}/confirmation`);
        }
      } else {
        setError('Failed to process checkout');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const getProductIcon = (productType: string) => {
    switch (productType) {
      case 'digital':
      case 'ebook':
        return <Download className="h-4 w-4 text-blue-600" />;
      case 'document':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'physical':
        return <Package className="h-4 w-4 text-amber-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-primary-600" />;
    }
  };

  const canProceedToNextStep = () => {
    if (step === 1) {
      return paymentMethod === 'card' || phoneNumber.length >= 10;
    }
    if (step === 2 && summary?.hasPhysicalProducts) {
      const { fullName, phone, address, city, region } = shippingDetails;
      return fullName && phone && address && city && region;
    }
    return true;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
          <p className="text-surface-600 dark:text-surface-400">Preparing checkout...</p>
        </motion.div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <Receipt className="h-10 w-10 text-surface-400" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
            Your Cart is Empty
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            Add some items to your cart before checking out.
          </p>
          <Link to="/shop">
            <Button size="lg">
              <Store className="w-5 h-5 mr-2" />
              Browse Products
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/shop/cart"
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-surface-600 dark:text-surface-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-white">Secure Checkout</h1>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Complete your purchase
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-500">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">256-bit SSL Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            {[
              { num: 1, label: 'Payment', icon: Wallet },
              ...(summary?.hasPhysicalProducts ? [{ num: 2, label: 'Shipping', icon: Truck }] : []),
              { num: totalSteps, label: 'Review', icon: CheckCircle2 },
            ].map((s, i, arr) => (
              <div key={s.num} className="flex items-center">
                <motion.button
                  onClick={() => s.num <= step && setStep(s.num)}
                  disabled={s.num > step}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all',
                    step === s.num
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : step > s.num
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-400'
                  )}
                  whileHover={s.num <= step ? { scale: 1.02 } : {}}
                  whileTap={s.num <= step ? { scale: 0.98 } : {}}
                >
                  {step > s.num ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <s.icon className="h-5 w-5" />
                  )}
                  <span className="font-medium hidden sm:inline">{s.label}</span>
                </motion.button>
                {i < arr.length - 1 && (
                  <div className={cn(
                    'w-8 sm:w-16 h-1 mx-2 rounded-full transition-colors',
                    step > s.num ? 'bg-emerald-500' : 'bg-surface-200 dark:bg-surface-700'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto px-4 mt-6"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Payment Method */}
              {step === 1 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                        Payment Method
                      </h2>
                      <p className="text-sm text-surface-500">Choose how you'd like to pay</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {PAYMENT_METHODS.map((method) => (
                      <motion.button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          'relative p-4 rounded-xl border-2 text-left transition-all',
                          method.bgColor,
                          paymentMethod === method.id
                            ? method.selectedBorder
                            : method.borderColor
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {paymentMethod === method.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl',
                            method.color
                          )}>
                            {method.iconFallback}
                          </div>
                          <div>
                            <p className={cn('font-semibold', method.textColor)}>
                              {method.name}
                            </p>
                            <p className="text-xs text-surface-500">
                              {method.id === 'card' ? 'Visa, Mastercard' : 'Instant payment'}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {paymentMethod !== 'card' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      <label className="block">
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2 block">
                          Mobile Money Number
                        </span>
                        <div className="relative">
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="0XX XXX XXXX"
                            className="w-full pl-12 pr-4 py-3.5 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                          />
                        </div>
                        <p className="text-xs text-surface-500 mt-2">
                          Enter the phone number registered with your {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.shortName} account
                        </p>
                      </label>
                    </motion.div>
                  )}

                  <div className="flex justify-end mt-8">
                    <Button
                      onClick={() => setStep(summary?.hasPhysicalProducts ? 2 : 2)}
                      disabled={!canProceedToNextStep()}
                      size="lg"
                      className="px-8"
                    >
                      Continue
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Shipping (for physical products) */}
              {step === 2 && summary?.hasPhysicalProducts && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                        Shipping Details
                      </h2>
                      <p className="text-sm text-surface-500">Where should we deliver?</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.fullName}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={shippingDetails.phone}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="0XX XXX XXXX"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.address}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="123 Independence Ave, East Legon"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.city}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="Accra"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Region *
                      </label>
                      <select
                        value={shippingDetails.region}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, region: e.target.value }))}
                        className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      >
                        <option value="">Select Region</option>
                        {GHANA_REGIONS.map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Delivery Notes (optional)
                      </label>
                      <textarea
                        value={shippingDetails.notes}
                        onChange={(e) => setShippingDetails(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                        placeholder="Landmark, gate color, best time for delivery..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button
                      variant="secondary"
                      onClick={() => setStep(1)}
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!canProceedToNextStep()}
                      size="lg"
                      className="px-8"
                    >
                      Continue
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Final Step: Review Order */}
              {((step === 2 && !summary?.hasPhysicalProducts) || step === 3) && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Order Items */}
                  <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                          Order Items
                        </h2>
                        <p className="text-sm text-surface-500">{summary?.itemCount} items</p>
                      </div>
                    </div>

                    <div className="divide-y divide-surface-100 dark:divide-surface-700">
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="py-4 flex items-center gap-4"
                        >
                          <div className="w-16 h-20 bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden flex-shrink-0">
                            {item.coverImage ? (
                              <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {getProductIcon(item.productType)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-surface-900 dark:text-white line-clamp-1">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getProductIcon(item.productType)}
                              <span className="text-xs text-surface-500 capitalize">
                                {item.productType === 'digital' ? 'Digital Download' : item.productType}
                              </span>
                            </div>
                            <p className="text-sm text-surface-500 mt-1">
                              Qty: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <p className="font-semibold text-surface-900 dark:text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Payment Method</h3>
                    <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                      <div className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl',
                        PAYMENT_METHODS.find(m => m.id === paymentMethod)?.color
                      )}>
                        {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.iconFallback}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 dark:text-white">
                          {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name}
                        </p>
                        {phoneNumber && (
                          <p className="text-sm text-surface-500">{phoneNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Summary */}
                  {summary?.hasPhysicalProducts && (
                    <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
                      <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Shipping Address</h3>
                      <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                        <p className="font-medium text-surface-900 dark:text-white">{shippingDetails.fullName}</p>
                        <p className="text-surface-600 dark:text-surface-400">{shippingDetails.phone}</p>
                        <p className="text-surface-600 dark:text-surface-400">{shippingDetails.address}</p>
                        <p className="text-surface-600 dark:text-surface-400">{shippingDetails.city}, {shippingDetails.region}</p>
                        {shippingDetails.notes && (
                          <p className="text-sm text-surface-500 mt-2 italic">"{shippingDetails.notes}"</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="secondary"
                      onClick={() => setStep(summary?.hasPhysicalProducts ? 2 : 1)}
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Back
                    </Button>
                    <motion.button
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className="relative px-8 py-3.5 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-5 w-5" />
                          Place Order
                          <span className="text-white/80">•</span>
                          <span>{formatCurrency((checkoutData?.total || summary?.subtotal || 0) - (appliedDiscount?.amount || 0))}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 sticky top-32">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">Order Summary</h2>

              {/* Discount Code */}
              <div className="mb-6">
                {appliedDiscount ? (
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                        {appliedDiscount.code}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Discount code"
                        className="flex-1 px-4 py-2.5 border border-surface-200 dark:border-surface-700 rounded-xl text-sm bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                      <Button
                        variant="secondary"
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount || !discountCode}
                        className="px-4"
                      >
                        {isApplyingDiscount ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>
                    {discountError && (
                      <p className="text-xs text-red-600 mt-2">{discountError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-surface-600 dark:text-surface-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(checkoutData?.subtotal || summary?.subtotal || 0)}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(appliedDiscount.amount)}</span>
                  </div>
                )}

                {checkoutData?.platformFee > 0 && (
                  <div className="flex justify-between text-surface-600 dark:text-surface-400">
                    <span>Platform Fee</span>
                    <span>{formatCurrency(checkoutData.platformFee)}</span>
                  </div>
                )}

                {checkoutData?.shipping > 0 && (
                  <div className="flex justify-between text-surface-600 dark:text-surface-400">
                    <span>Shipping</span>
                    <span>{formatCurrency(checkoutData.shipping)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold text-surface-900 dark:text-white">
                  <span>Total</span>
                  <span className="text-primary-600">
                    {formatCurrency(
                      (checkoutData?.total || summary?.subtotal || 0) -
                      (appliedDiscount?.amount || 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-400">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-400">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Download className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>Instant digital delivery</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-400">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <span>24/7 support available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
