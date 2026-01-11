import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store, Package, ShoppingCart, DollarSign, TrendingUp,
  Plus, Eye, BarChart3, Clock, CheckCircle2, AlertCircle,
  ArrowRight, Loader2, Settings
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { useSellerStore } from '@/stores/shopStore';
import { useAuthStore } from '@/stores/authStore';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    profile,
    dashboardStats,
    recentOrders,
    isLoadingDashboard,
    fetchDashboard,
  } = useSellerStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, fetchDashboard]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 mx-auto text-surface-300 mb-4" />
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
            Seller Dashboard
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            Please sign in to access your seller dashboard
          </p>
          <Button onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingDashboard) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Store className="w-16 h-16 mx-auto text-surface-300 mb-4" />
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
            Not a Seller Yet
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            You need to be an approved seller to access this dashboard.
          </p>
          <Button onClick={() => navigate('/shop/become-seller')}>
            Become a Seller
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  const stats = dashboardStats || {
    products: { totalProducts: 0, publishedProducts: 0, pendingProducts: 0, draftProducts: 0 },
    orders: { totalOrders: 0, totalItemsSold: 0, totalRevenue: 0, pendingFulfillment: 0 },
    payouts: { totalPaidOut: 0, pendingPayout: 0 },
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              Seller Dashboard
            </h1>
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              Welcome back, {profile.storeName}
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button variant="outline" onClick={() => navigate('/shop/seller/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button onClick={() => navigate('/shop/seller/products/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {stats.products.totalProducts}
                </p>
                <p className="text-sm text-surface-500">Total Products</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="text-success-600">{stats.products.publishedProducts} published</span>
              <span className="text-surface-400">|</span>
              <span className="text-warning-600">{stats.products.pendingProducts} pending</span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success-100 dark:bg-success-900/30">
                <ShoppingCart className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {stats.orders.totalOrders}
                </p>
                <p className="text-sm text-surface-500">Total Orders</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="text-surface-600">{stats.orders.totalItemsSold} items sold</span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-ghana-yellow/20">
                <DollarSign className="w-6 h-6 text-ghana-yellow" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  GHS {stats.orders.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-surface-500">Total Revenue</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info-100 dark:bg-info-900/30">
                <TrendingUp className="w-6 h-6 text-info-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  GHS {stats.payouts.pendingPayout.toLocaleString()}
                </p>
                <p className="text-sm text-surface-500">Pending Payout</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-surface-500">
              GHS {stats.payouts.totalPaidOut.toLocaleString()} paid out
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Orders */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                to="/shop/seller/products"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
              >
                <Package className="w-5 h-5 text-primary-600" />
                <span className="text-surface-700 dark:text-surface-300">Manage Products</span>
                <ArrowRight className="w-4 h-4 ml-auto text-surface-400" />
              </Link>
              <Link
                to="/shop/seller/orders"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-success-600" />
                <span className="text-surface-700 dark:text-surface-300">View Orders</span>
                {stats.orders.pendingFulfillment > 0 && (
                  <span className="ml-auto bg-warning-100 text-warning-700 text-xs px-2 py-0.5 rounded-full">
                    {stats.orders.pendingFulfillment} pending
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-surface-400" />
              </Link>
              <Link
                to="/shop/seller/payouts"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
              >
                <DollarSign className="w-5 h-5 text-ghana-yellow" />
                <span className="text-surface-700 dark:text-surface-300">Payouts & Earnings</span>
                <ArrowRight className="w-4 h-4 ml-auto text-surface-400" />
              </Link>
              <Link
                to="/shop/seller/analytics"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-info-600" />
                <span className="text-surface-700 dark:text-surface-300">Analytics</span>
                <ArrowRight className="w-4 h-4 ml-auto text-surface-400" />
              </Link>
              <Link
                to={`/shop/store/${profile.storeSlug}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
              >
                <Eye className="w-5 h-5 text-surface-500" />
                <span className="text-surface-700 dark:text-surface-300">View My Store</span>
                <ArrowRight className="w-4 h-4 ml-auto text-surface-400" />
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <div className="p-6 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  Recent Orders
                </h2>
                <Link
                  to="/shop/seller/orders"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 mx-auto text-surface-300 mb-3" />
                <p className="text-surface-500">No orders yet</p>
                <p className="text-sm text-surface-400 mt-1">
                  Orders will appear here once customers start buying
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-200 dark:divide-surface-700">
                {recentOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="p-4 hover:bg-surface-50 dark:hover:bg-surface-900/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-surface-900 dark:text-surface-50">
                          {order.title}
                        </p>
                        <p className="text-sm text-surface-500">
                          Order #{order.orderNumber} &bull; {order.quantity} item(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-surface-900 dark:text-surface-50">
                          GHS {order.sellerAmount?.toLocaleString() || '0'}
                        </p>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                          order.fulfillmentStatus === 'fulfilled'
                            ? 'bg-success-100 text-success-700'
                            : order.fulfillmentStatus === 'pending'
                              ? 'bg-warning-100 text-warning-700'
                              : 'bg-surface-100 text-surface-600'
                        )}>
                          {order.fulfillmentStatus === 'fulfilled' && <CheckCircle2 className="w-3 h-3" />}
                          {order.fulfillmentStatus === 'pending' && <Clock className="w-3 h-3" />}
                          {order.fulfillmentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Store Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{profile.storeName}</h3>
              <p className="text-primary-100 mt-1">
                {profile.isVerified && (
                  <span className="inline-flex items-center gap-1 mr-3">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified Seller
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  {profile.rating > 0 ? `${profile.rating.toFixed(1)} rating` : 'No ratings yet'}
                </span>
              </p>
            </div>
            <Link
              to={`/shop/store/${profile.storeSlug}`}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <Eye className="w-5 h-5" />
              View Public Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
