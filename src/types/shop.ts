// ============================================================================
// OHCS E-Library Shop Types
// ============================================================================

// ============================================================================
// SELLER APPLICATION TYPES
// ============================================================================

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'request_info';
export type BusinessType = 'individual' | 'organization' | 'mda';
export type GovernmentIdType = 'national_id' | 'passport' | 'voter_id' | 'staff_id';
export type PayoutMethod = 'mobile_money' | 'bank_transfer';
export type MobileMoneyProvider = 'MTN' | 'Vodafone' | 'AirtelTigo';

export interface SellerApplication {
  id: string;
  userId: string;

  // Application Details
  storeName: string;
  storeDescription: string;
  businessType: BusinessType;

  // Applicant Information
  fullName: string;
  email: string;
  phone?: string;
  staffId?: string;
  mdaId?: string;
  department?: string;

  // Verification Documents
  governmentIdType?: GovernmentIdType;
  governmentIdNumber?: string;
  governmentIdImage?: string;
  proofOfEmployment?: string;

  // Author Information
  isAuthor: boolean;
  authorBio?: string;
  publishedWorks?: string[];

  // Payment Details
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  mobileMoneyProvider?: MobileMoneyProvider;
  mobileMoneyNumber?: string;
  preferredPayoutMethod: PayoutMethod;

  // Status
  status: ApplicationStatus;
  reviewNotes?: string;
  rejectionReason?: string;

  // Timestamps
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerApplicationFormData {
  storeName: string;
  storeDescription: string;
  businessType: BusinessType;
  fullName: string;
  email: string;
  phone?: string;
  staffId?: string;
  mdaId?: string;
  department?: string;
  governmentIdType?: GovernmentIdType;
  governmentIdNumber?: string;
  isAuthor: boolean;
  authorBio?: string;
  publishedWorks?: string[];
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  mobileMoneyProvider?: MobileMoneyProvider;
  mobileMoneyNumber?: string;
  preferredPayoutMethod: PayoutMethod;
}

export interface SellerReviewHistory {
  id: string;
  applicationId: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  action: string;
  notes?: string;
  createdAt: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: 'government_id' | 'proof_of_employment' | 'author_credentials' | 'sample_work';
  documentName: string;
  documentUrl: string;
  fileSize?: number;
  uploadedAt: string;
}

// ============================================================================
// SELLER PROFILE TYPES
// ============================================================================

export type SellerStatus = 'active' | 'suspended' | 'deactivated';
export type VerificationBadge = 'verified_author' | 'verified_civil_servant' | 'verified_mda';

export interface SellerProfile {
  id: string;
  userId: string;
  applicationId: string;

  // Store Information
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;

  // Verification
  isVerified: boolean;
  isGovernmentVerified: boolean;
  verificationBadge?: VerificationBadge;
  verifiedAt?: string;
  verifiedBy?: string;

  // Contact
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  linkedIn?: string;

  // Payment Info
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  mobileMoneyProvider?: MobileMoneyProvider;
  mobileMoneyNumber?: string;
  preferredPayoutMethod: PayoutMethod;

  // Commission
  commissionRate: number;

  // Statistics
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  totalPayouts: number;
  pendingBalance: number;
  rating: number;
  reviewCount: number;

  // Status
  status: SellerStatus;
  suspensionReason?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export type ProductType = 'physical' | 'digital' | 'bundle';
export type ProductStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'archived';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;

  // Basic Info
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;

  // Pricing
  price: number;
  compareAtPrice?: number;
  currency: string;

  // Product Type
  productType: ProductType;

  // Digital Product Fields
  digitalFileUrl?: string;
  digitalFileName?: string;
  digitalFileSize?: number;
  digitalFileType?: string;
  previewUrl?: string;
  downloadLimit?: number;

  // Physical Product Fields
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  requiresShipping?: boolean;

  // Inventory
  sku?: string;
  barcode?: string;
  stockQuantity: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold?: number;

  // Media
  coverImage: string;
  images?: string[];
  videoUrl?: string;

  // Book Metadata
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

  // Tags
  tags?: string[];
  searchKeywords?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Stats
  viewCount: number;
  salesCount: number;
  rating: number;
  reviewCount: number;
  wishlistCount: number;

  // Status
  status: ProductStatus;
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
  rejectionReason?: string;

  // Publishing
  publishedAt?: string;
  featuredUntil?: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations (populated)
  seller?: SellerProfile;
  category?: ProductCategory;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  digitalFileUrl?: string;
  digitalFileType?: string;
  weight?: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'mobile_money' | 'card' | 'bank_transfer';

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  country: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;

  // Totals
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  platformFee: number;
  total: number;
  currency: string;

  // Discount
  discountCodeId?: string;
  discountCodeUsed?: string;

  // Shipping
  hasPhysicalProducts: boolean;
  shippingMethod?: 'standard' | 'express' | 'pickup';
  shippingAddress?: ShippingAddress;

  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  // Notes
  customerNote?: string;
  internalNote?: string;

  // Timestamps
  confirmedAt?: string;
  paidAt?: string;
  processedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;

  // Cancellation/Refund
  cancellationReason?: string;
  refundReason?: string;
  refundAmount?: number;

  createdAt: string;
  updatedAt: string;

  // Relations
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  sellerId: string;

  // Snapshot
  title: string;
  sku?: string;
  coverImage?: string;

  // Pricing
  unitPrice: number;
  quantity: number;
  subtotal: number;

  // Commission
  commissionRate: number;
  commissionAmount: number;
  sellerAmount: number;

  // Type
  productType: ProductType;

  // Digital
  digitalFileUrl?: string;
  downloadCount: number;
  downloadLimit: number;
  downloadExpiry?: string;
  lastDownloadAt?: string;

  // Physical
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;

  // Payout
  payoutStatus: 'pending' | 'scheduled' | 'paid';
  payoutId?: string;

  createdAt: string;
}

// ============================================================================
// CART & WISHLIST TYPES
// ============================================================================

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  addedAt: string;

  // Populated
  product?: Product;
  variant?: ProductVariant;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  addedAt: string;

  // Populated
  product?: Product;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;

  rating: number;
  title?: string;
  content?: string;
  images?: string[];

  isVerifiedPurchase: boolean;
  helpfulCount: number;
  reportCount: number;

  sellerResponse?: string;
  sellerRespondedAt?: string;

  status: 'published' | 'hidden' | 'flagged' | 'removed';

  createdAt: string;
  updatedAt: string;

  // Populated
  user?: {
    id: string;
    displayName: string;
    avatar?: string;
  };
}

// ============================================================================
// DASHBOARD STATS TYPES
// ============================================================================

export interface SellerDashboardStats {
  products: {
    totalProducts: number;
    publishedProducts: number;
    pendingProducts: number;
    draftProducts: number;
  };
  orders: {
    totalOrders: number;
    totalItemsSold: number;
    totalRevenue: number;
    pendingFulfillment: number;
  };
  payouts: {
    totalPaidOut: number;
    pendingPayout: number;
  };
}

export interface AdminSellerStats {
  totalApplications: number;
  pendingApplications: number;
  approvedSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}
