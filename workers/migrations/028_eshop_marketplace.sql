-- ============================================================================
-- OHCS E-Library Marketplace (E-Shop) Schema
-- Migration 028: E-Shop with Seller Vetting System
--
-- Key Features:
-- - Seller application and vetting workflow
-- - Product management (physical & digital)
-- - Shopping cart and wishlist
-- - Order management
-- - Payment processing
-- - Review system
-- - Discount codes
-- ============================================================================

-- ============================================================================
-- SELLER APPLICATION & VETTING SYSTEM
-- All sellers must apply and be vetted before listing products
-- ============================================================================

-- Seller Applications (submitted by users wanting to become sellers)
CREATE TABLE IF NOT EXISTS seller_applications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL UNIQUE,

    -- Application Details
    storeName TEXT NOT NULL,
    storeDescription TEXT NOT NULL,
    businessType TEXT NOT NULL DEFAULT 'individual', -- individual, organization, mda

    -- Applicant Information
    fullName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    staffId TEXT,
    mdaId TEXT,
    department TEXT,

    -- Verification Documents
    governmentIdType TEXT, -- national_id, passport, voter_id, staff_id
    governmentIdNumber TEXT,
    governmentIdImage TEXT, -- R2 URL
    proofOfEmployment TEXT, -- R2 URL (pay slip, appointment letter, etc.)

    -- Author Information (if selling books)
    isAuthor INTEGER DEFAULT 0,
    authorBio TEXT,
    publishedWorks TEXT, -- JSON array of previous publications

    -- Bank/Payment Details
    bankName TEXT,
    bankAccountNumber TEXT,
    bankAccountName TEXT,
    mobileMoneyProvider TEXT, -- MTN, Vodafone, AirtelTigo
    mobileMoneyNumber TEXT,
    preferredPayoutMethod TEXT DEFAULT 'mobile_money', -- mobile_money, bank_transfer

    -- Application Status
    status TEXT DEFAULT 'pending', -- pending, under_review, approved, rejected, suspended
    reviewNotes TEXT,
    rejectionReason TEXT,

    -- Review Workflow
    submittedAt TEXT DEFAULT (datetime('now')),
    reviewedAt TEXT,
    reviewedBy TEXT,
    approvedAt TEXT,
    approvedBy TEXT,

    -- Audit
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewedBy) REFERENCES users(id),
    FOREIGN KEY (approvedBy) REFERENCES users(id)
);

-- Seller Profiles (created after application approval)
CREATE TABLE IF NOT EXISTS seller_profiles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL UNIQUE,
    applicationId TEXT NOT NULL UNIQUE,

    -- Store Information
    storeName TEXT NOT NULL,
    storeSlug TEXT UNIQUE NOT NULL,
    storeDescription TEXT,
    storeLogo TEXT, -- R2 URL
    storeBanner TEXT, -- R2 URL

    -- Verification Status
    isVerified INTEGER DEFAULT 0,
    isGovernmentVerified INTEGER DEFAULT 0, -- Verified government employee
    verificationBadge TEXT, -- verified_author, verified_civil_servant, verified_mda
    verifiedAt TEXT,
    verifiedBy TEXT,

    -- Contact & Social
    contactEmail TEXT,
    contactPhone TEXT,
    website TEXT,
    linkedIn TEXT,

    -- Payment Information (encrypted/hashed in production)
    bankName TEXT,
    bankAccountNumber TEXT,
    bankAccountName TEXT,
    mobileMoneyProvider TEXT,
    mobileMoneyNumber TEXT,
    preferredPayoutMethod TEXT DEFAULT 'mobile_money',

    -- Commission Rate (can be customized per seller)
    commissionRate REAL DEFAULT 0.12, -- 12% default

    -- Statistics
    totalProducts INTEGER DEFAULT 0,
    totalSales INTEGER DEFAULT 0,
    totalRevenue REAL DEFAULT 0,
    totalPayouts REAL DEFAULT 0,
    pendingBalance REAL DEFAULT 0,
    rating REAL DEFAULT 0,
    reviewCount INTEGER DEFAULT 0,

    -- Status
    status TEXT DEFAULT 'active', -- active, suspended, deactivated
    suspensionReason TEXT,

    -- Audit
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (applicationId) REFERENCES seller_applications(id),
    FOREIGN KEY (verifiedBy) REFERENCES users(id)
);

-- Seller Application Documents (for multiple document uploads)
CREATE TABLE IF NOT EXISTS seller_application_documents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    applicationId TEXT NOT NULL,
    documentType TEXT NOT NULL, -- government_id, proof_of_employment, author_credentials, sample_work
    documentName TEXT NOT NULL,
    documentUrl TEXT NOT NULL, -- R2 URL
    fileSize INTEGER,
    uploadedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (applicationId) REFERENCES seller_applications(id) ON DELETE CASCADE
);

-- Seller Review History (audit trail of vetting decisions)
CREATE TABLE IF NOT EXISTS seller_review_history (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    applicationId TEXT NOT NULL,
    reviewerId TEXT NOT NULL,
    action TEXT NOT NULL, -- submitted, under_review, request_info, approved, rejected, suspended
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (applicationId) REFERENCES seller_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewerId) REFERENCES users(id)
);

-- ============================================================================
-- PRODUCT CATALOG
-- ============================================================================

-- Product Categories
CREATE TABLE IF NOT EXISTS shop_categories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    image TEXT,
    parentId TEXT,
    sortOrder INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    productCount INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (parentId) REFERENCES shop_categories(id)
);

-- Seed default categories
INSERT OR IGNORE INTO shop_categories (id, name, slug, description, icon, sortOrder) VALUES
    ('cat-books-physical', 'Physical Books', 'physical-books', 'Printed books and publications', 'Book', 1),
    ('cat-books-digital', 'E-Books & PDFs', 'ebooks', 'Digital books and electronic publications', 'FileText', 2),
    ('cat-audiobooks', 'Audiobooks', 'audiobooks', 'Audio versions of books and publications', 'Headphones', 3),
    ('cat-guides', 'Guides & Manuals', 'guides', 'Professional guides, handbooks, and manuals', 'BookMarked', 4),
    ('cat-training', 'Training Materials', 'training', 'Training resources and course materials', 'GraduationCap', 5),
    ('cat-templates', 'Templates & Forms', 'templates', 'Document templates and official forms', 'FileCheck', 6),
    ('cat-research', 'Research Papers', 'research', 'Academic and policy research publications', 'Search', 7),
    ('cat-merchandise', 'Merchandise', 'merchandise', 'Branded items and memorabilia', 'ShoppingBag', 8);

-- Products
CREATE TABLE IF NOT EXISTS shop_products (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sellerId TEXT NOT NULL,
    categoryId TEXT NOT NULL,

    -- Basic Info
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    shortDescription TEXT,

    -- Pricing
    price REAL NOT NULL,
    compareAtPrice REAL, -- Original price for showing discounts
    currency TEXT DEFAULT 'GHS',

    -- Product Type
    productType TEXT NOT NULL DEFAULT 'physical', -- physical, digital, bundle

    -- Digital Product Fields
    digitalFileUrl TEXT, -- R2 URL for digital products
    digitalFileName TEXT,
    digitalFileSize INTEGER,
    digitalFileType TEXT, -- pdf, epub, mp3, mp4
    previewUrl TEXT, -- Sample/preview for digital products
    downloadLimit INTEGER DEFAULT 5, -- Max downloads per purchase

    -- Physical Product Fields
    weight REAL, -- in grams
    dimensions TEXT, -- JSON: {length, width, height} in cm
    requiresShipping INTEGER DEFAULT 1,

    -- Inventory
    sku TEXT,
    barcode TEXT,
    stockQuantity INTEGER DEFAULT 0,
    trackInventory INTEGER DEFAULT 1,
    allowBackorder INTEGER DEFAULT 0,
    lowStockThreshold INTEGER DEFAULT 5,

    -- Media
    coverImage TEXT NOT NULL, -- Primary image
    images TEXT, -- JSON array of additional image URLs
    videoUrl TEXT,

    -- Book-specific Metadata
    author TEXT,
    coAuthors TEXT, -- JSON array
    isbn TEXT,
    publisher TEXT,
    publishYear INTEGER,
    edition TEXT,
    language TEXT DEFAULT 'English',
    pages INTEGER,
    format TEXT, -- Hardcover, Paperback, PDF, EPUB, MP3
    tableOfContents TEXT, -- JSON array of chapters

    -- Tags & Search
    tags TEXT, -- JSON array
    searchKeywords TEXT,

    -- SEO
    metaTitle TEXT,
    metaDescription TEXT,

    -- Stats
    viewCount INTEGER DEFAULT 0,
    salesCount INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    reviewCount INTEGER DEFAULT 0,
    wishlistCount INTEGER DEFAULT 0,

    -- Status & Moderation
    status TEXT DEFAULT 'draft', -- draft, pending_review, approved, published, rejected, archived
    moderationStatus TEXT DEFAULT 'pending', -- pending, approved, rejected
    moderationNotes TEXT,
    rejectionReason TEXT,

    -- Publishing
    publishedAt TEXT,
    featuredUntil TEXT,
    isFeatured INTEGER DEFAULT 0,
    isNewArrival INTEGER DEFAULT 0,
    isBestseller INTEGER DEFAULT 0,

    -- Audit
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (sellerId) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES shop_categories(id)
);

-- Product Variants (different formats, editions)
CREATE TABLE IF NOT EXISTS shop_product_variants (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    productId TEXT NOT NULL,

    name TEXT NOT NULL, -- e.g., "Paperback", "Hardcover", "PDF", "EPUB"
    sku TEXT,
    price REAL NOT NULL,
    compareAtPrice REAL,

    stockQuantity INTEGER DEFAULT 0,

    -- For digital variants
    digitalFileUrl TEXT,
    digitalFileType TEXT,

    -- For physical variants
    weight REAL,

    isDefault INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    sortOrder INTEGER DEFAULT 0,

    createdAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (productId) REFERENCES shop_products(id) ON DELETE CASCADE
);

-- Product Moderation Queue
CREATE TABLE IF NOT EXISTS shop_product_moderation (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    productId TEXT NOT NULL,
    moderatorId TEXT,

    action TEXT NOT NULL, -- submitted, approved, rejected, request_changes
    notes TEXT,

    createdAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (productId) REFERENCES shop_products(id) ON DELETE CASCADE,
    FOREIGN KEY (moderatorId) REFERENCES users(id)
);

-- ============================================================================
-- SHOPPING CART & WISHLIST
-- ============================================================================

-- Shopping Cart
CREATE TABLE IF NOT EXISTS shop_cart_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,
    variantId TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,

    addedAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    UNIQUE(userId, productId, variantId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES shop_products(id) ON DELETE CASCADE,
    FOREIGN KEY (variantId) REFERENCES shop_product_variants(id) ON DELETE SET NULL
);

-- Wishlist
CREATE TABLE IF NOT EXISTS shop_wishlist_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,

    addedAt TEXT DEFAULT (datetime('now')),

    UNIQUE(userId, productId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES shop_products(id) ON DELETE CASCADE
);

-- ============================================================================
-- ORDERS & PAYMENTS
-- ============================================================================

-- Orders
CREATE TABLE IF NOT EXISTS shop_orders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    orderNumber TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,

    -- Order Totals
    subtotal REAL NOT NULL,
    shippingCost REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    platformFee REAL DEFAULT 0,
    total REAL NOT NULL,
    currency TEXT DEFAULT 'GHS',

    -- Discount Code Used
    discountCodeId TEXT,
    discountCodeUsed TEXT,

    -- Shipping Information (for physical products)
    hasPhysicalProducts INTEGER DEFAULT 0,
    shippingMethod TEXT, -- standard, express, pickup
    shippingAddress TEXT, -- JSON: {name, phone, address, city, region, country, notes}

    -- Order Status
    status TEXT DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled, refunded
    paymentStatus TEXT DEFAULT 'pending', -- pending, paid, failed, refunded, partial_refund
    fulfillmentStatus TEXT DEFAULT 'unfulfilled', -- unfulfilled, partial, fulfilled

    -- Notes
    customerNote TEXT,
    internalNote TEXT,

    -- Timestamps
    confirmedAt TEXT,
    paidAt TEXT,
    processedAt TEXT,
    shippedAt TEXT,
    deliveredAt TEXT,
    cancelledAt TEXT,
    refundedAt TEXT,

    -- Cancellation/Refund
    cancellationReason TEXT,
    refundReason TEXT,
    refundAmount REAL,

    -- Audit
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (discountCodeId) REFERENCES shop_discount_codes(id)
);

-- Order Items
CREATE TABLE IF NOT EXISTS shop_order_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    orderId TEXT NOT NULL,
    productId TEXT NOT NULL,
    variantId TEXT,
    sellerId TEXT NOT NULL,

    -- Product Snapshot (in case product changes later)
    title TEXT NOT NULL,
    sku TEXT,
    coverImage TEXT,

    -- Pricing
    unitPrice REAL NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal REAL NOT NULL,

    -- Commission
    commissionRate REAL NOT NULL,
    commissionAmount REAL NOT NULL,
    sellerAmount REAL NOT NULL, -- Amount seller receives

    -- Product Type
    productType TEXT NOT NULL, -- physical, digital

    -- Digital Delivery
    digitalFileUrl TEXT,
    downloadCount INTEGER DEFAULT 0,
    downloadLimit INTEGER DEFAULT 5,
    downloadExpiry TEXT,
    lastDownloadAt TEXT,

    -- Physical Fulfillment
    fulfillmentStatus TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    trackingNumber TEXT,
    trackingUrl TEXT,
    shippedAt TEXT,
    deliveredAt TEXT,

    -- Seller Payout
    payoutStatus TEXT DEFAULT 'pending', -- pending, scheduled, paid
    payoutId TEXT,

    createdAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (orderId) REFERENCES shop_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES shop_products(id),
    FOREIGN KEY (variantId) REFERENCES shop_product_variants(id),
    FOREIGN KEY (sellerId) REFERENCES seller_profiles(id)
);

-- Payments
CREATE TABLE IF NOT EXISTS shop_payments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    orderId TEXT NOT NULL,

    amount REAL NOT NULL,
    currency TEXT DEFAULT 'GHS',

    -- Payment Method
    paymentMethod TEXT NOT NULL, -- mobile_money, card, bank_transfer
    paymentProvider TEXT, -- paystack, hubtel, expresspay

    -- Mobile Money Details
    mobileMoneyProvider TEXT, -- MTN, Vodafone, AirtelTigo
    mobileMoneyNumber TEXT,

    -- Provider Response
    providerReference TEXT,
    providerTransactionId TEXT,
    providerResponse TEXT, -- JSON

    -- Status
    status TEXT DEFAULT 'pending', -- pending, processing, successful, failed, refunded
    failureReason TEXT,

    -- Refund
    refundedAmount REAL DEFAULT 0,
    refundReference TEXT,

    -- Timestamps
    initiatedAt TEXT DEFAULT (datetime('now')),
    completedAt TEXT,
    failedAt TEXT,
    refundedAt TEXT,

    -- Metadata
    metadata TEXT, -- JSON

    FOREIGN KEY (orderId) REFERENCES shop_orders(id) ON DELETE CASCADE
);

-- ============================================================================
-- SELLER PAYOUTS
-- ============================================================================

-- Seller Payouts
CREATE TABLE IF NOT EXISTS shop_seller_payouts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sellerId TEXT NOT NULL,

    -- Payout Details
    amount REAL NOT NULL,
    platformFee REAL NOT NULL,
    netAmount REAL NOT NULL,
    currency TEXT DEFAULT 'GHS',

    -- Period Covered
    periodStart TEXT NOT NULL,
    periodEnd TEXT NOT NULL,

    -- Orders Included
    orderItemIds TEXT, -- JSON array
    orderCount INTEGER DEFAULT 0,

    -- Payout Method
    payoutMethod TEXT NOT NULL, -- mobile_money, bank_transfer

    -- Mobile Money
    mobileMoneyProvider TEXT,
    mobileMoneyNumber TEXT,

    -- Bank Transfer
    bankName TEXT,
    bankAccountNumber TEXT,
    bankAccountName TEXT,

    -- Provider Details
    providerReference TEXT,
    providerResponse TEXT, -- JSON

    -- Status
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    failureReason TEXT,

    -- Processing
    processedAt TEXT,
    processedBy TEXT,
    completedAt TEXT,

    -- Audit
    createdAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (sellerId) REFERENCES seller_profiles(id),
    FOREIGN KEY (processedBy) REFERENCES users(id)
);

-- ============================================================================
-- REVIEWS
-- ============================================================================

-- Product Reviews
CREATE TABLE IF NOT EXISTS shop_product_reviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    productId TEXT NOT NULL,
    userId TEXT NOT NULL,
    orderId TEXT, -- Link to order for verified purchase badge

    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,

    -- Media
    images TEXT, -- JSON array of image URLs

    -- Verification
    isVerifiedPurchase INTEGER DEFAULT 0,

    -- Engagement
    helpfulCount INTEGER DEFAULT 0,
    reportCount INTEGER DEFAULT 0,

    -- Seller Response
    sellerResponse TEXT,
    sellerRespondedAt TEXT,

    -- Status
    status TEXT DEFAULT 'published', -- published, hidden, flagged, removed

    -- Audit
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),

    UNIQUE(productId, userId),
    FOREIGN KEY (productId) REFERENCES shop_products(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (orderId) REFERENCES shop_orders(id)
);

-- Review Helpfulness Votes
CREATE TABLE IF NOT EXISTS shop_review_votes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    reviewId TEXT NOT NULL,
    userId TEXT NOT NULL,
    isHelpful INTEGER NOT NULL, -- 1 = helpful, 0 = not helpful
    createdAt TEXT DEFAULT (datetime('now')),

    UNIQUE(reviewId, userId),
    FOREIGN KEY (reviewId) REFERENCES shop_product_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- DISCOUNT CODES
-- ============================================================================

-- Discount Codes
CREATE TABLE IF NOT EXISTS shop_discount_codes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    code TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Discount Type
    discountType TEXT NOT NULL, -- percentage, fixed_amount, free_shipping
    discountValue REAL NOT NULL,

    -- Limits
    minimumPurchase REAL DEFAULT 0,
    maximumDiscount REAL, -- Cap for percentage discounts

    -- Usage Limits
    usageLimit INTEGER, -- Total uses allowed
    usageCount INTEGER DEFAULT 0,
    perUserLimit INTEGER DEFAULT 1,

    -- Restrictions (JSON arrays, null = all)
    productIds TEXT, -- Specific products only
    categoryIds TEXT, -- Specific categories only
    sellerIds TEXT, -- Specific sellers only
    userIds TEXT, -- Specific users only (for targeted promos)

    -- Validity
    startsAt TEXT,
    expiresAt TEXT,
    isActive INTEGER DEFAULT 1,

    -- Created By
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Discount Code Usage
CREATE TABLE IF NOT EXISTS shop_discount_usage (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    discountCodeId TEXT NOT NULL,
    userId TEXT NOT NULL,
    orderId TEXT NOT NULL,

    discountAmount REAL NOT NULL,
    usedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (discountCodeId) REFERENCES shop_discount_codes(id),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (orderId) REFERENCES shop_orders(id)
);

-- ============================================================================
-- DIGITAL DOWNLOAD TRACKING
-- ============================================================================

-- Download Log
CREATE TABLE IF NOT EXISTS shop_download_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    orderItemId TEXT NOT NULL,
    userId TEXT NOT NULL,

    ipAddress TEXT,
    userAgent TEXT,

    downloadedAt TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (orderItemId) REFERENCES shop_order_items(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_seller_applications_user ON seller_applications(userId);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user ON seller_profiles(userId);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_slug ON seller_profiles(storeSlug);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_status ON seller_profiles(status);

CREATE INDEX IF NOT EXISTS idx_products_seller ON shop_products(sellerId);
CREATE INDEX IF NOT EXISTS idx_products_category ON shop_products(categoryId);
CREATE INDEX IF NOT EXISTS idx_products_status ON shop_products(status);
CREATE INDEX IF NOT EXISTS idx_products_type ON shop_products(productType);
CREATE INDEX IF NOT EXISTS idx_products_featured ON shop_products(isFeatured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON shop_products(slug);

CREATE INDEX IF NOT EXISTS idx_cart_user ON shop_cart_items(userId);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON shop_wishlist_items(userId);

CREATE INDEX IF NOT EXISTS idx_orders_user ON shop_orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON shop_orders(orderNumber);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON shop_order_items(orderId);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON shop_order_items(sellerId);
CREATE INDEX IF NOT EXISTS idx_order_items_payout ON shop_order_items(payoutStatus);

CREATE INDEX IF NOT EXISTS idx_payments_order ON shop_payments(orderId);
CREATE INDEX IF NOT EXISTS idx_payments_status ON shop_payments(status);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON shop_product_reviews(productId);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON shop_product_reviews(userId);

CREATE INDEX IF NOT EXISTS idx_payouts_seller ON shop_seller_payouts(sellerId);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON shop_seller_payouts(status);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATES
-- ============================================================================

-- Update product stats on new review
CREATE TRIGGER IF NOT EXISTS update_product_rating_on_review
AFTER INSERT ON shop_product_reviews
BEGIN
    UPDATE shop_products
    SET
        rating = (SELECT AVG(rating) FROM shop_product_reviews WHERE productId = NEW.productId AND status = 'published'),
        reviewCount = (SELECT COUNT(*) FROM shop_product_reviews WHERE productId = NEW.productId AND status = 'published'),
        updatedAt = datetime('now')
    WHERE id = NEW.productId;
END;

-- Update seller stats on new review
CREATE TRIGGER IF NOT EXISTS update_seller_rating_on_review
AFTER INSERT ON shop_product_reviews
BEGIN
    UPDATE seller_profiles
    SET
        rating = (
            SELECT AVG(p.rating)
            FROM shop_products p
            WHERE p.sellerId = (SELECT sellerId FROM shop_products WHERE id = NEW.productId)
            AND p.reviewCount > 0
        ),
        reviewCount = (
            SELECT SUM(p.reviewCount)
            FROM shop_products p
            WHERE p.sellerId = (SELECT sellerId FROM shop_products WHERE id = NEW.productId)
        ),
        updatedAt = datetime('now')
    WHERE id = (SELECT sellerId FROM shop_products WHERE id = NEW.productId);
END;

-- Update category product count
CREATE TRIGGER IF NOT EXISTS update_category_count_on_product_insert
AFTER INSERT ON shop_products
WHEN NEW.status = 'published'
BEGIN
    UPDATE shop_categories
    SET productCount = productCount + 1
    WHERE id = NEW.categoryId;
END;

CREATE TRIGGER IF NOT EXISTS update_category_count_on_product_delete
AFTER DELETE ON shop_products
WHEN OLD.status = 'published'
BEGIN
    UPDATE shop_categories
    SET productCount = productCount - 1
    WHERE id = OLD.categoryId;
END;
