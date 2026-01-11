import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ShoppingBag,
  Loader2,
  Search,
  Filter,
  BookOpen,
  FileText,
  Download,
  AlertCircle,
  Truck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useOrdersStore } from '@/stores/shopStore';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const ORDER_STATUSES = {
  pending_payment: {
    label: 'Pending Payment',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  refunded: {
    label: 'Refunded',
    icon: XCircle,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-200 dark:border-gray-800',
  },
};

const PAYMENT_STATUSES = {
  pending: { label: 'Pending', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  completed: { label: 'Paid', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  failed: { label: 'Failed', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  refunded: { label: 'Refunded', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
};

export default function Orders() {
  const { user } = useAuthStore();
  const { orders, fetchOrders, downloadDigitalProduct } = useOrdersStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      await fetchOrders();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (orderNumber: string, itemId: string) => {
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
        return <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'document':
        return <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'physical':
        return <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <BookOpen className="h-4 w-4 text-primary-600" />;
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some((item: any) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Not logged in
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
              <ShoppingBag className="h-12 w-12 text-surface-400" />
            </div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">Your Orders</h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto">
              Please sign in to view your order history.
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

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-400">Loading your orders...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Package className="h-6 w-6 text-primary-600" />
              My Orders
            </h1>
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              View and manage your order history
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-12 pr-10 py-3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none min-w-[180px] cursor-pointer"
            >
              <option value="all">All Orders</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            {orders.length === 0 ? (
              <>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center"
                >
                  <ShoppingBag className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">No Orders Yet</h2>
                <p className="text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto">
                  You haven't placed any orders yet. Start shopping to see your orders here.
                </p>
                <Link to="/shop">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-emerald-700 transition-all shadow-lg shadow-primary-600/30"
                  >
                    <Sparkles className="h-5 w-5" />
                    Browse Products
                  </motion.button>
                </Link>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-surface-400" />
                </div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">No Results</h2>
                <p className="text-surface-600 dark:text-surface-400">
                  No orders match your search criteria.
                </p>
              </>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, index) => {
                const statusConfig = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES.processing;
                const paymentConfig = PAYMENT_STATUSES[order.paymentStatus as keyof typeof PAYMENT_STATUSES] || PAYMENT_STATUSES.pending;
                const StatusIcon = statusConfig.icon;

                const hasDigitalProducts = order.items?.some(
                  (item: any) => (item.productType === 'ebook' || item.productType === 'document' || item.productType === 'digital') && order.paymentStatus === 'completed'
                );

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'bg-white dark:bg-surface-800 rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300',
                      statusConfig.borderColor
                    )}
                  >
                    {/* Order Header */}
                    <div className="p-5 border-b border-surface-100 dark:border-surface-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-surface-500 dark:text-surface-400">Order Number</p>
                          <p className="font-mono font-bold text-xl text-surface-900 dark:text-white">
                            {order.orderNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                            statusConfig.bgColor,
                            statusConfig.color
                          )}>
                            <StatusIcon className="h-4 w-4" />
                            {statusConfig.label}
                          </span>
                          <span className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium',
                            paymentConfig.bgColor,
                            paymentConfig.color
                          )}>
                            {paymentConfig.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-surface-500 dark:text-surface-400 mt-3">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Order Items */}
                    <div className="p-5">
                      <div className="divide-y divide-surface-100 dark:divide-surface-700">
                        {order.items?.slice(0, 3).map((item: any) => (
                          <div key={item.id} className="py-3 flex items-center gap-4">
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
                            <div className="text-right">
                              <p className="font-bold text-primary-600 dark:text-primary-400">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                              {/* Download button for digital products */}
                              {(item.productType === 'ebook' || item.productType === 'document' || item.productType === 'digital') &&
                                order.paymentStatus === 'completed' && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDownload(order.orderNumber, item.id);
                                    }}
                                    disabled={downloadingItem === item.id}
                                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 font-medium"
                                  >
                                    {downloadingItem === item.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Download className="h-3.5 w-3.5" />
                                    )}
                                    Download
                                  </motion.button>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.items && order.items.length > 3 && (
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-3">
                          + {order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Order Footer */}
                    <div className="px-5 py-4 bg-surface-50 dark:bg-surface-700/50 flex items-center justify-between">
                      <div>
                        <span className="text-surface-500 dark:text-surface-400">Total: </span>
                        <span className="font-bold text-xl text-surface-900 dark:text-white">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                      <Link
                        to={`/shop/orders/${order.orderNumber}`}
                        className="group"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02, x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-2 px-5 py-2.5 text-primary-600 dark:text-primary-400 font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
                        >
                          View Details
                          <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
