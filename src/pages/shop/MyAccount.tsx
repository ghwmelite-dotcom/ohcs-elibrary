import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Package,
  MapPin,
  Heart,
  CreditCard,
  Settings,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  Edit3,
  Plus,
  Trash2,
  Star,
  Sparkles,
  ArrowRight,
  Home,
  Phone,
  Globe,
  Shield,
  Award,
  TrendingUp,
  Download,
  Loader2,
  AlertCircle,
  X,
  BadgeCheck,
  Gift,
  Zap,
  Crown,
  Target,
  BookOpen,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useOrdersStore, useWishlistStore, type ShippingAddress } from '@/stores/shopStore';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/shared/Avatar';

// Types for saved addresses
interface SavedAddress extends ShippingAddress {
  id: string;
  label: string;
  isDefault: boolean;
}

const ORDER_STATUS_CONFIG = {
  pending_payment: {
    label: 'Pending Payment',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    gradient: 'from-yellow-500 to-amber-500',
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    gradient: 'from-blue-500 to-indigo-500',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    gradient: 'from-purple-500 to-violet-500',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    gradient: 'from-green-500 to-emerald-500',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    gradient: 'from-emerald-500 to-teal-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    gradient: 'from-red-500 to-rose-500',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    gradient: 'from-green-500 to-emerald-500',
  },
};

// Quick action cards
const quickActions = [
  {
    id: 'orders',
    title: 'My Orders',
    description: 'Track and manage purchases',
    icon: Package,
    link: '/shop/orders',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: 'wishlist',
    title: 'Wishlist',
    description: 'Saved for later',
    icon: Heart,
    link: '/shop/wishlist',
    gradient: 'from-rose-500 to-pink-600',
    lightBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    id: 'shop',
    title: 'Browse Shop',
    description: 'Discover new products',
    icon: ShoppingBag,
    link: '/shop',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Profile & preferences',
    icon: Settings,
    link: '/settings',
    gradient: 'from-slate-500 to-gray-600',
    lightBg: 'bg-slate-50',
    iconColor: 'text-slate-600',
  },
];

// Achievement badges
const achievements = [
  { icon: Crown, label: 'VIP Member', color: 'from-yellow-400 to-amber-500' },
  { icon: Zap, label: 'Quick Buyer', color: 'from-blue-400 to-cyan-500' },
  { icon: Target, label: 'Goal Setter', color: 'from-purple-400 to-pink-500' },
];

export default function MyAccount() {
  const { user } = useAuthStore();
  const { orders, fetchOrders, isLoading: ordersLoading } = useOrdersStore();
  const { items: wishlistItems } = useWishlistStore();
  const navigate = useNavigate();

  // Active section state
  const [activeSection, setActiveSection] = useState<'overview' | 'orders' | 'addresses'>('overview');

  // Address management state
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addressForm, setAddressForm] = useState<Partial<SavedAddress>>({
    label: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    country: 'Ghana',
    isDefault: false,
  });

  // Load saved addresses from localStorage
  useEffect(() => {
    const savedAddresses = localStorage.getItem('ohcs_saved_addresses');
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    }
  }, []);

  // Save addresses to localStorage
  const saveAddresses = (newAddresses: SavedAddress[]) => {
    localStorage.setItem('ohcs_saved_addresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  // Load orders on mount
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  // Handle address form submission
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressForm.label || !addressForm.name || !addressForm.phone || !addressForm.address || !addressForm.city || !addressForm.region) {
      return;
    }

    if (editingAddress) {
      const updatedAddresses = addresses.map(addr =>
        addr.id === editingAddress.id
          ? { ...addr, ...addressForm } as SavedAddress
          : addressForm.isDefault ? { ...addr, isDefault: false } : addr
      );
      saveAddresses(updatedAddresses);
      setEditingAddress(null);
    } else {
      const newAddress: SavedAddress = {
        id: crypto.randomUUID(),
        label: addressForm.label || 'Home',
        name: addressForm.name || '',
        phone: addressForm.phone || '',
        address: addressForm.address || '',
        city: addressForm.city || '',
        region: addressForm.region || '',
        country: addressForm.country || 'Ghana',
        isDefault: addresses.length === 0 || addressForm.isDefault || false,
      };

      let newAddresses = [...addresses, newAddress];
      if (newAddress.isDefault) {
        newAddresses = newAddresses.map(addr =>
          addr.id === newAddress.id ? addr : { ...addr, isDefault: false }
        );
      }
      saveAddresses(newAddresses);
    }

    setIsAddingAddress(false);
    setAddressForm({
      label: '',
      name: '',
      phone: '',
      address: '',
      city: '',
      region: '',
      country: 'Ghana',
      isDefault: false,
    });
  };

  const deleteAddress = (id: string) => {
    const filtered = addresses.filter(addr => addr.id !== id);
    if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
      filtered[0].isDefault = true;
    }
    saveAddresses(filtered);
  };

  const setDefaultAddress = (id: string) => {
    const updated = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    }));
    saveAddresses(updated);
  };

  const startEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setAddressForm(address);
    setIsAddingAddress(true);
  };

  // Stats
  const recentOrders = orders.slice(0, 5);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered' || o.status === 'confirmed').length;
  const totalSpent = orders
    .filter(o => o.paymentStatus === 'completed' || o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0);

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
              <User className="h-12 w-12 text-surface-400" />
            </div>
            <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">My Account</h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto">
              Please sign in to view your account details, orders, and saved addresses.
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

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Hero Section - Matching Shop Page Design */}
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

        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row items-center gap-8"
          >
            {/* User Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-6"
            >
              <div className="relative">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Avatar
                    src={user.avatar}
                    name={user.displayName}
                    size="2xl"
                    className="ring-4 ring-white/30 shadow-2xl"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-full flex items-center justify-center ring-4 ring-primary-700 shadow-lg"
                  >
                    <BadgeCheck className="h-5 w-5 text-primary-900" />
                  </motion.div>
                </motion.div>
              </div>

              <div className="text-white">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl md:text-3xl font-bold mb-1"
                >
                  {user.displayName}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-primary-100"
                >
                  {user.email}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 mt-3"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium">
                    <Award className="h-4 w-4" />
                    {user.role?.replace('_', ' ') || 'Member'}
                  </span>
                  {user.department && (
                    <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-sm">
                      {user.department}
                    </span>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1 grid grid-cols-3 gap-4 lg:gap-6"
            >
              {[
                { value: totalOrders, label: 'Total Orders', icon: Package },
                { value: completedOrders, label: 'Completed', icon: CheckCircle },
                { value: formatCurrency(totalSpent), label: 'Total Spent', icon: TrendingUp },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10"
                >
                  <stat.icon className="h-6 w-6 text-secondary-400 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-primary-200 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex justify-center lg:justify-start"
          >
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all font-medium border border-white/10"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions - Category Style */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-secondary-500" />
              Quick Actions
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              Navigate to your favorite sections
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={action.link}
                className="group block bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300"
              >
                <motion.div
                  className={cn('w-14 h-14 rounded-xl flex items-center justify-center mb-4', action.lightBg, 'dark:bg-surface-700')}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <action.icon className={cn('w-7 h-7', action.iconColor, 'dark:text-primary-400')} />
                </motion.div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                  {action.description}
                </p>
                <div className="flex items-center gap-1 mt-4 text-primary-600 dark:text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Go <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white dark:bg-surface-800/50 border-y border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Section Tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'orders', label: 'Recent Orders', icon: Package },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap',
                  activeSection === tab.id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Content Based on Active Section */}
          <AnimatePresence mode="wait">
            {activeSection === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid lg:grid-cols-2 gap-8"
              >
                {/* Recent Orders Summary */}
                <div className="bg-surface-50 dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Recent Orders
                    </h3>
                    <Link
                      to="/shop/orders"
                      className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"
                    >
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {ordersLoading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="py-8 text-center">
                      <ShoppingBag className="h-12 w-12 text-surface-300 mx-auto mb-3" />
                      <p className="text-surface-500">No orders yet</p>
                      <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.slice(0, 3).map((order) => {
                        const config = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.processing;
                        const StatusIcon = config.icon;
                        return (
                          <Link
                            key={order.id}
                            to={`/shop/orders/${order.orderNumber}`}
                            className="flex items-center justify-between p-4 bg-white dark:bg-surface-700 rounded-xl hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn('p-2 rounded-lg', config.bg)}>
                                <StatusIcon className={cn('h-4 w-4', config.color)} />
                              </div>
                              <div>
                                <p className="font-mono font-semibold text-surface-900 dark:text-white group-hover:text-primary-600">
                                  {order.orderNumber}
                                </p>
                                <p className="text-xs text-surface-500">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary-600">{formatCurrency(order.total)}</p>
                              <p className={cn('text-xs font-medium', config.color)}>{config.label}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Wishlist & Stats */}
                <div className="space-y-6">
                  {/* Wishlist Preview */}
                  <div className="bg-surface-50 dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                        Wishlist
                      </h3>
                      <Link
                        to="/shop/wishlist"
                        className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
                      >
                        View All
                      </Link>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center">
                        <Heart className="h-8 w-8 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-surface-900 dark:text-white">{wishlistItems.length}</p>
                        <p className="text-surface-500">items saved</p>
                      </div>
                    </div>
                  </div>

                  {/* Member Benefits */}
                  <div className="bg-gradient-to-br from-primary-600 to-emerald-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Gift className="h-5 w-5" />
                      <h3 className="text-lg font-bold">Member Benefits</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-secondary-400" />
                        <span>Free digital downloads</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-secondary-400" />
                        <span>Priority customer support</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-secondary-400" />
                        <span>Exclusive discounts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {ordersLoading ? (
                  <div className="py-16 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-surface-500">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-16 text-center">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center"
                    >
                      <ShoppingBag className="h-10 w-10 text-primary-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">No Orders Yet</h3>
                    <p className="text-surface-500 mb-6">Start shopping to see your orders here</p>
                    <Link to="/shop">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold rounded-xl"
                      >
                        <Sparkles className="h-5 w-5" />
                        Browse Products
                      </motion.button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {orders.map((order, index) => {
                      const config = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.processing;
                      const StatusIcon = config.icon;
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            to={`/shop/orders/${order.orderNumber}`}
                            className="block bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className={cn('p-3 rounded-xl', config.bg)}>
                                  <StatusIcon className={cn('h-6 w-6', config.color)} />
                                </div>
                                <div>
                                  <p className="font-mono font-bold text-lg text-surface-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                    {order.orderNumber}
                                  </p>
                                  <p className="text-sm text-surface-500">
                                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xl font-bold text-primary-600">{formatCurrency(order.total)}</p>
                                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.color)}>
                                    {config.label}
                                  </span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-surface-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === 'addresses' && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white">Saved Addresses</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsAddingAddress(true);
                      setEditingAddress(null);
                      setAddressForm({
                        label: '',
                        name: user?.displayName || '',
                        phone: '',
                        address: '',
                        city: '',
                        region: '',
                        country: 'Ghana',
                        isDefault: addresses.length === 0,
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add New
                  </motion.button>
                </div>

                {/* Address Form */}
                <AnimatePresence>
                  {isAddingAddress && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 overflow-hidden"
                    >
                      <form onSubmit={handleAddressSubmit} className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-semibold text-surface-900 dark:text-white">
                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingAddress(false);
                              setEditingAddress(null);
                            }}
                            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                          >
                            <X className="h-5 w-5 text-surface-400" />
                          </button>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Label</label>
                            <input
                              type="text"
                              value={addressForm.label}
                              onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                              placeholder="Home, Office, etc."
                              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Full Name</label>
                            <input
                              type="text"
                              value={addressForm.name}
                              onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Phone</label>
                            <input
                              type="tel"
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                              placeholder="+233 XX XXX XXXX"
                              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">City/Town</label>
                            <input
                              type="text"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                              required
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Street Address</label>
                            <input
                              type="text"
                              value={addressForm.address}
                              onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Region</label>
                            <select
                              value={addressForm.region}
                              onChange={(e) => setAddressForm({ ...addressForm, region: e.target.value })}
                              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                              required
                            >
                              <option value="">Select Region</option>
                              <option value="Greater Accra">Greater Accra</option>
                              <option value="Ashanti">Ashanti</option>
                              <option value="Western">Western</option>
                              <option value="Eastern">Eastern</option>
                              <option value="Central">Central</option>
                              <option value="Northern">Northern</option>
                              <option value="Volta">Volta</option>
                              <option value="Upper East">Upper East</option>
                              <option value="Upper West">Upper West</option>
                              <option value="Bono">Bono</option>
                              <option value="Bono East">Bono East</option>
                              <option value="Ahafo">Ahafo</option>
                              <option value="Savannah">Savannah</option>
                              <option value="North East">North East</option>
                              <option value="Oti">Oti</option>
                              <option value="Western North">Western North</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Country</label>
                            <input
                              type="text"
                              value={addressForm.country}
                              onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={addressForm.isDefault}
                              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                              className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-surface-600 dark:text-surface-400">Set as default address</span>
                          </label>
                        </div>

                        <div className="mt-6 flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingAddress(false);
                              setEditingAddress(null);
                            }}
                            className="flex-1 px-4 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium"
                          >
                            {editingAddress ? 'Save Changes' : 'Add Address'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Address List */}
                {addresses.length === 0 && !isAddingAddress ? (
                  <div className="py-16 text-center bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-rose-600" />
                    </div>
                    <p className="text-surface-600 dark:text-surface-400 mb-4">No saved addresses</p>
                    <button
                      onClick={() => {
                        setIsAddingAddress(true);
                        setAddressForm({
                          label: 'Home',
                          name: user?.displayName || '',
                          phone: '',
                          address: '',
                          city: '',
                          region: '',
                          country: 'Ghana',
                          isDefault: true,
                        });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <motion.div
                        key={address.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          'bg-white dark:bg-surface-800 rounded-2xl p-5 border-2 transition-all',
                          address.isDefault
                            ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                            : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'px-2.5 py-1 rounded-lg text-xs font-bold',
                              address.isDefault
                                ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                            )}>
                              {address.label}
                            </span>
                            {address.isDefault && (
                              <span className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-medium">
                                <Star className="h-3 w-3 fill-current" />
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditAddress(address)}
                              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                            >
                              <Edit3 className="h-4 w-4 text-surface-400 hover:text-surface-600" />
                            </button>
                            <button
                              onClick={() => deleteAddress(address.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4 text-surface-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="font-semibold text-surface-900 dark:text-white">{address.name}</p>
                          <p className="text-surface-600 dark:text-surface-400 text-sm">{address.address}</p>
                          <p className="text-surface-600 dark:text-surface-400 text-sm">{address.city}, {address.region}</p>
                          <p className="text-surface-500 text-sm flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {address.phone}
                          </p>
                        </div>

                        {!address.isDefault && (
                          <button
                            onClick={() => setDefaultAddress(address.id)}
                            className="mt-4 text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
                          >
                            Set as default
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Help Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-surface-100 to-surface-50 dark:from-surface-800 dark:to-surface-700/50 rounded-2xl p-8 text-center"
        >
          <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Need Help?</h3>
          <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
            Have questions about your orders or account? We're here to help.
          </p>
          <Link
            to="/help"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-lg shadow-primary-600/30"
          >
            Contact Support
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
