import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SellerApplication,
  SellerApplicationFormData,
  SellerProfile,
  SellerReviewHistory,
  SellerDashboardStats,
  CartItem,
  WishlistItem,
  Product,
  ProductCategory,
  ProductStatus,
} from '@/types/shop';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

// ============================================================================
// SELLER STORE
// ============================================================================

interface SellerState {
  // Application
  application: SellerApplication | null;
  applicationHistory: SellerReviewHistory[];
  isLoadingApplication: boolean;
  applicationError: string | null;

  // Profile
  profile: SellerProfile | null;
  isLoadingSeller: boolean;
  sellerError: string | null;

  // Dashboard
  dashboardStats: SellerDashboardStats | null;
  recentOrders: any[];
  isLoadingDashboard: boolean;

  // Eligibility
  eligibility: {
    eligible: boolean;
    reason: string;
  } | null;
}

interface SellerActions {
  // Eligibility
  checkEligibility: () => Promise<{ eligible: boolean; reason: string }>;

  // Application
  submitApplication: (data: SellerApplicationFormData) => Promise<void>;
  fetchApplication: () => Promise<void>;

  // Profile
  fetchSellerProfile: () => Promise<void>;
  updateSellerProfile: (data: Partial<SellerProfile>) => Promise<void>;

  // Dashboard
  fetchDashboard: () => Promise<void>;

  // Reset
  resetSellerState: () => void;
}

type SellerStore = SellerState & SellerActions;

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const useSellerStore = create<SellerStore>()((set, get) => ({
  // Initial State
  application: null,
  applicationHistory: [],
  isLoadingApplication: false,
  applicationError: null,
  profile: null,
  isLoadingSeller: false,
  sellerError: null,
  dashboardStats: null,
  recentOrders: [],
  isLoadingDashboard: false,
  eligibility: null,

  // Check Eligibility
  checkEligibility: async () => {
    try {
      const response = await fetch(`${API_BASE}/shop/seller/eligibility`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to check eligibility');
      }

      const data = await response.json();
      set({ eligibility: data });
      return data;
    } catch (error) {
      console.error('Eligibility check error:', error);
      throw error;
    }
  },

  // Submit Application
  submitApplication: async (data: SellerApplicationFormData) => {
    set({ isLoadingApplication: true, applicationError: null });

    try {
      const response = await fetch(`${API_BASE}/shop/seller/apply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit application');
      }

      // Refresh application data
      await get().fetchApplication();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Application failed';
      set({ applicationError: message });
      throw error;
    } finally {
      set({ isLoadingApplication: false });
    }
  },

  // Fetch Application
  fetchApplication: async () => {
    set({ isLoadingApplication: true, applicationError: null });

    try {
      const response = await fetch(`${API_BASE}/shop/seller/application`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch application');
      }

      const data = await response.json();
      set({
        application: data.application,
        applicationHistory: data.history || [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load application';
      set({ applicationError: message });
    } finally {
      set({ isLoadingApplication: false });
    }
  },

  // Fetch Seller Profile
  fetchSellerProfile: async () => {
    set({ isLoadingSeller: true, sellerError: null });

    try {
      const response = await fetch(`${API_BASE}/shop/seller/profile`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      set({ profile: data.profile });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load profile';
      set({ sellerError: message });
    } finally {
      set({ isLoadingSeller: false });
    }
  },

  // Update Seller Profile
  updateSellerProfile: async (data: Partial<SellerProfile>) => {
    set({ isLoadingSeller: true, sellerError: null });

    try {
      const response = await fetch(`${API_BASE}/shop/seller/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Refresh profile
      await get().fetchSellerProfile();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      set({ sellerError: message });
      throw error;
    } finally {
      set({ isLoadingSeller: false });
    }
  },

  // Fetch Dashboard
  fetchDashboard: async () => {
    set({ isLoadingDashboard: true });

    try {
      const response = await fetch(`${API_BASE}/shop/seller/dashboard`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const data = await response.json();
      set({
        profile: data.profile,
        dashboardStats: data.stats,
        recentOrders: data.recentOrders || [],
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      set({ isLoadingDashboard: false });
    }
  },

  // Reset State
  resetSellerState: () => {
    set({
      application: null,
      applicationHistory: [],
      isLoadingApplication: false,
      applicationError: null,
      profile: null,
      isLoadingSeller: false,
      sellerError: null,
      dashboardStats: null,
      recentOrders: [],
      isLoadingDashboard: false,
      eligibility: null,
    });
  },
}));

// ============================================================================
// CART STORE
// ============================================================================

export interface CartItemWithProduct {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  addedAt: string;
  title: string;
  slug: string;
  coverImage?: string;
  price: number;
  compareAtPrice?: number;
  productType: string;
  stockQuantity?: number;
  trackInventory?: boolean;
  storeName: string;
  sellerSlug: string;
}

interface CartSummary {
  itemCount: number;
  uniqueItems: number;
  subtotal: number;
  hasPhysicalProducts: boolean;
}

interface CartState {
  items: CartItemWithProduct[];
  summary: CartSummary;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

interface CartActions {
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  getCartCount: () => number;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  summary: {
    itemCount: 0,
    uniqueItems: 0,
    subtotal: 0,
    hasPhysicalProducts: false,
  },
  isLoading: false,
  isUpdating: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/shop/cart`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch cart');

      const data = await response.json();
      set({
        items: data.items || [],
        summary: data.summary || {
          itemCount: 0,
          uniqueItems: 0,
          subtotal: 0,
          hasPhysicalProducts: false,
        },
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load cart' });
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, variantId, quantity = 1) => {
    set({ isUpdating: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/shop/cart`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId, variantId, quantity }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add to cart');
      }

      // Refresh cart
      await get().fetchCart();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add to cart' });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  updateQuantity: async (itemId, quantity) => {
    set({ isUpdating: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/shop/cart/${itemId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update cart');
      }

      // Refresh cart
      await get().fetchCart();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update cart' });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  removeFromCart: async (itemId) => {
    set({ isUpdating: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/shop/cart/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to remove item');

      // Refresh cart
      await get().fetchCart();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove item' });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  clearCart: async () => {
    set({ isUpdating: true, error: null });
    try {
      await fetch(`${API_BASE}/shop/cart`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      set({
        items: [],
        summary: { itemCount: 0, uniqueItems: 0, subtotal: 0, hasPhysicalProducts: false },
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to clear cart' });
    } finally {
      set({ isUpdating: false });
    }
  },

  getCartCount: () => {
    return get().summary.itemCount;
  },
}));

// ============================================================================
// CHECKOUT STORE
// ============================================================================

export interface CheckoutSummary {
  items: CartItemWithProduct[];
  summary: {
    subtotal: number;
    platformFee: number;
    shippingCost: number;
    discount: number;
    total: number;
  };
  hasPhysicalProducts: boolean;
  shippingOptions: { method: string; label: string; cost: number }[];
  paymentMethods: { id: string; label: string; providers?: string[] }[];
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  country: string;
  notes?: string;
}

export interface CheckoutData {
  paymentMethod: 'mobile_money' | 'card' | 'bank_transfer';
  mobileMoneyProvider?: 'MTN' | 'Vodafone' | 'AirtelTigo';
  mobileMoneyNumber?: string;
  shippingAddress?: ShippingAddress;
  shippingMethod?: 'standard' | 'express' | 'pickup';
  customerNote?: string;
  discountCode?: string;
}

interface CheckoutState {
  checkoutData: CheckoutSummary | null;
  appliedDiscount: {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
  } | null;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
  } | null;
  paymentInstructions: any | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
}

interface CheckoutActions {
  fetchCheckoutSummary: () => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
  removeDiscount: () => void;
  processCheckout: (data: CheckoutData) => Promise<{ orderNumber: string }>;
  verifyPayment: (transactionId: string, reference: string) => Promise<void>;
  clearCheckout: () => void;
}

type CheckoutStore = CheckoutState & CheckoutActions;

export const useCheckoutStore = create<CheckoutStore>()((set, get) => ({
  checkoutData: null,
  appliedDiscount: null,
  order: null,
  paymentInstructions: null,
  isLoading: false,
  isProcessing: false,
  error: null,

  fetchCheckoutSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/shop/orders/checkout/summary`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to load checkout');
      }

      const data = await response.json();
      set({ checkoutData: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load checkout' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  applyDiscount: async (code: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/shop/orders/checkout/discount`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid discount code');
      }

      set({ appliedDiscount: result.discount });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Invalid discount code' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeDiscount: () => {
    set({ appliedDiscount: null });
  },

  processCheckout: async (data: CheckoutData) => {
    set({ isProcessing: true, error: null });
    try {
      const { appliedDiscount } = get();
      const checkoutPayload = {
        ...data,
        discountCode: appliedDiscount?.code,
      };

      const response = await fetch(`${API_BASE}/shop/orders/checkout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(checkoutPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Checkout failed');
      }

      set({
        order: result.order,
        paymentInstructions: result.paymentInstructions,
      });

      return { orderNumber: result.order.orderNumber };
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Checkout failed' });
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },

  verifyPayment: async (transactionId: string, reference: string) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/shop/orders/checkout/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ transactionId, reference }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment verification failed');
      }

      set({ order: result.order });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Payment verification failed' });
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },

  clearCheckout: () => {
    set({
      checkoutData: null,
      appliedDiscount: null,
      order: null,
      paymentInstructions: null,
      error: null,
    });
  },
}));

// ============================================================================
// ORDERS STORE
// ============================================================================

export interface OrderSummary {
  id: string;
  orderNumber: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  hasPhysicalProducts: boolean;
  createdAt: string;
  itemCount: number;
}

interface OrdersState {
  orders: OrderSummary[];
  selectedOrder: any | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface OrdersActions {
  fetchOrders: (page?: number) => Promise<void>;
  fetchOrder: (orderNumber: string) => Promise<void>;
  downloadDigitalProduct: (orderNumber: string, itemId: string) => Promise<string>;
}

type OrdersStore = OrdersState & OrdersActions;

export const useOrdersStore = create<OrdersStore>()((set, get) => ({
  orders: [],
  selectedOrder: null,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
  isLoading: false,
  error: null,

  fetchOrders: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/shop/orders?page=${page}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      set({
        orders: data.orders,
        pagination: data.pagination,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load orders' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrder: async (orderNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/shop/orders/${orderNumber}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch order');

      const data = await response.json();
      set({ selectedOrder: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load order' });
    } finally {
      set({ isLoading: false });
    }
  },

  downloadDigitalProduct: async (orderNumber: string, itemId: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/shop/orders/${orderNumber}/download/${itemId}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Download failed');
      }

      const data = await response.json();
      return data.downloadUrl;
    } catch (error) {
      throw error;
    }
  },
}))

// ============================================================================
// WISHLIST STORE
// ============================================================================

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
}

interface WishlistActions {
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  fetchWishlist: () => Promise<void>;
}

type WishlistStore = WishlistState & WishlistActions;

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addToWishlist: async (productId) => {
        const { items, isInWishlist } = get();
        if (isInWishlist(productId)) return;

        set({
          items: [...items, {
            id: crypto.randomUUID(),
            userId: '',
            productId,
            addedAt: new Date().toISOString(),
          }],
        });
      },

      removeFromWishlist: async (productId) => {
        const { items } = get();
        set({ items: items.filter(item => item.productId !== productId) });
      },

      isInWishlist: (productId) => {
        const { items } = get();
        return items.some(item => item.productId === productId);
      },

      fetchWishlist: async () => {
        // Will implement API sync later
      },
    }),
    {
      name: 'ohcs-shop-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// ============================================================================
// ADMIN SELLER MANAGEMENT STORE
// ============================================================================

interface AdminSellerState {
  applications: SellerApplication[];
  sellers: SellerProfile[];
  selectedApplication: SellerApplication | null;
  applicationDocuments: any[];
  applicationHistory: SellerReviewHistory[];
  statusCounts: Record<string, number>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface AdminSellerActions {
  fetchApplications: (status?: string, page?: number) => Promise<void>;
  fetchApplicationDetails: (id: string) => Promise<void>;
  updateApplicationStatus: (id: string, status: string, notes?: string, rejectionReason?: string) => Promise<void>;
  fetchSellers: (status?: string, page?: number) => Promise<void>;
  updateSellerStatus: (id: string, status: string, reason?: string) => Promise<void>;
}

type AdminSellerStore = AdminSellerState & AdminSellerActions;

export const useAdminSellerStore = create<AdminSellerStore>()((set, get) => ({
  applications: [],
  sellers: [],
  selectedApplication: null,
  applicationDocuments: [],
  applicationHistory: [],
  statusCounts: {},
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  isLoading: false,
  error: null,

  fetchApplications: async (status = 'all', page = 1) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE}/shop/seller/admin/applications?status=${status}&page=${page}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Failed to fetch applications');

      const data = await response.json();
      set({
        applications: data.applications,
        statusCounts: data.statusCounts,
        pagination: data.pagination,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load applications' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchApplicationDetails: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE}/shop/seller/admin/applications/${id}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Failed to fetch application details');

      const data = await response.json();
      set({
        selectedApplication: data.application,
        applicationDocuments: data.documents,
        applicationHistory: data.history,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load details' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateApplicationStatus: async (id, status, notes, rejectionReason) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE}/shop/seller/admin/applications/${id}/status`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status, notes, rejectionReason }),
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      // Refresh applications
      await get().fetchApplications();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Update failed' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSellers: async (status = 'all', page = 1) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE}/shop/seller/admin/sellers?status=${status}&page=${page}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Failed to fetch sellers');

      const data = await response.json();
      set({
        sellers: data.sellers,
        pagination: data.pagination,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load sellers' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSellerStatus: async (id, status, reason) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE}/shop/seller/admin/sellers/${id}/status`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status, reason }),
        }
      );

      if (!response.ok) throw new Error('Failed to update seller status');

      // Refresh sellers
      await get().fetchSellers();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Update failed' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

// ============================================================================
// SELLER PRODUCTS STORE
// ============================================================================

export interface ProductFormData {
  title: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  price: number;
  compareAtPrice?: number;
  productType: 'physical' | 'digital' | 'bundle';
  digitalFileUrl?: string;
  digitalFileName?: string;
  digitalFileSize?: number;
  digitalFileType?: string;
  previewUrl?: string;
  downloadLimit?: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  requiresShipping?: boolean;
  sku?: string;
  barcode?: string;
  stockQuantity: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold?: number;
  coverImage?: string;
  images?: string[];
  videoUrl?: string;
  author?: string;
  coAuthors?: string[];
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  edition?: string;
  language: string;
  pages?: number;
  format?: string;
  tableOfContents?: string[];
  tags?: string[];
  searchKeywords?: string;
  metaTitle?: string;
  metaDescription?: string;
  status: 'draft' | 'pending_review';
}

interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  categories: ProductCategory[];
  statusCounts: Record<string, number>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status: string;
    categoryId: string;
    search: string;
    sortBy: string;
  };
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

interface ProductsActions {
  fetchProducts: (params?: Partial<ProductsState['filters'] & { page: number }>) => Promise<void>;
  fetchProduct: (id: string) => Promise<Product>;
  createProduct: (data: ProductFormData) => Promise<{ id: string; slug: string }>;
  updateProduct: (id: string, data: Partial<ProductFormData>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  duplicateProduct: (id: string) => Promise<{ id: string; slug: string; title: string }>;
  submitForReview: (id: string) => Promise<void>;
  publishProduct: (id: string) => Promise<void>;
  unpublishProduct: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  setFilters: (filters: Partial<ProductsState['filters']>) => void;
  clearSelectedProduct: () => void;
}

type ProductsStore = ProductsState & ProductsActions;

export const useProductsStore = create<ProductsStore>()((set, get) => ({
  products: [],
  selectedProduct: null,
  categories: [],
  statusCounts: {
    all: 0,
    draft: 0,
    pending_review: 0,
    approved: 0,
    published: 0,
    rejected: 0,
    archived: 0,
  },
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  filters: {
    status: 'all',
    categoryId: '',
    search: '',
    sortBy: 'newest',
  },
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchProducts: async (params = {}) => {
    set({ isLoading: true, error: null });

    const { filters, pagination } = get();
    const queryParams = new URLSearchParams({
      page: String(params.page || pagination.page),
      limit: String(pagination.limit),
      status: params.status || filters.status,
      sortBy: params.sortBy || filters.sortBy,
    });

    if (params.categoryId || filters.categoryId) {
      queryParams.append('categoryId', params.categoryId || filters.categoryId);
    }
    if (params.search || filters.search) {
      queryParams.append('search', params.search || filters.search);
    }

    try {
      const response = await fetch(
        `${API_BASE}/shop/products?${queryParams}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      set({
        products: data.products,
        statusCounts: data.statusCounts,
        pagination: data.pagination,
        filters: {
          ...filters,
          ...params,
        },
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load products' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProduct: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE}/shop/products/${id}`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Failed to fetch product');

      const data = await response.json();
      set({ selectedProduct: data.product });
      return data.product;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load product' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createProduct: async (data: ProductFormData) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/shop/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create product');
      }

      const result = await response.json();
      // Refresh products list
      await get().fetchProducts();
      return result.product;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create product' });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateProduct: async (id: string, data: Partial<ProductFormData>) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/shop/products/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update product');
      }

      // Refresh products list
      await get().fetchProducts();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update product' });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  deleteProduct: async (id: string) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/shop/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete product');

      // Refresh products list
      await get().fetchProducts();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete product' });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  duplicateProduct: async (id: string) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/shop/products/${id}/duplicate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to duplicate product');

      const result = await response.json();
      // Refresh products list
      await get().fetchProducts();
      return result.product;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to duplicate product' });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  submitForReview: async (id: string) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/shop/products/${id}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to submit for review');
      }

      // Refresh products list
      await get().fetchProducts();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to submit product' });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  publishProduct: async (id: string) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/shop/products/${id}/publish`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to publish product');
      }

      // Refresh products list
      await get().fetchProducts();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to publish product' });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  unpublishProduct: async (id: string) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/shop/products/${id}/unpublish`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to unpublish product');

      // Refresh products list
      await get().fetchProducts();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to unpublish product' });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  fetchCategories: async () => {
    try {
      const response = await fetch(`${API_BASE}/shop/products/categories/all`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      set({ categories: data.categories });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
  },

  clearSelectedProduct: () => {
    set({ selectedProduct: null });
  },
}));
