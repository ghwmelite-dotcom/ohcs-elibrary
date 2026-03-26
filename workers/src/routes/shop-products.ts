import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const productRoutes = new Hono();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters').max(10000),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().uuid(),

  // Pricing
  price: z.number().min(0.01, 'Price must be greater than zero'),
  compareAtPrice: z.number().min(0).optional(),
  currency: z.string().default('GHS'),

  // Product Type
  productType: z.enum(['physical', 'digital', 'bundle']),

  // Digital Product Fields
  digitalFileUrl: z.string().url().optional(),
  digitalFileName: z.string().optional(),
  digitalFileSize: z.number().optional(),
  digitalFileType: z.string().optional(),
  previewUrl: z.string().url().optional(),
  downloadLimit: z.number().min(0).optional(),

  // Physical Product Fields
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  requiresShipping: z.boolean().optional(),

  // Inventory
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stockQuantity: z.number().min(0).default(0),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  lowStockThreshold: z.number().min(0).optional(),

  // Media
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),

  // Book Metadata
  author: z.string().optional(),
  coAuthors: z.array(z.string()).optional(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  publishYear: z.number().optional(),
  edition: z.string().optional(),
  language: z.string().default('en'),
  pages: z.number().optional(),
  format: z.string().optional(),
  tableOfContents: z.array(z.string()).optional(),

  // Tags & SEO
  tags: z.array(z.string()).optional(),
  searchKeywords: z.string().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),

  // Status
  status: z.enum(['draft', 'pending_review']).default('draft'),
});

const updateProductSchema = createProductSchema.partial().extend({
  status: z.enum(['draft', 'pending_review', 'archived']).optional(),
});

const listProductsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['all', 'draft', 'pending_review', 'approved', 'published', 'rejected', 'archived']).optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'price_low', 'price_high', 'bestselling', 'rating']).default('newest'),
});

// Admin moderation schema
const moderateProductSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_changes']),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60) + '-' + Math.random().toString(36).substring(2, 8);
}

function getUserFromToken(c: any): { userId: string; role: string } | null {
  const user = c.get('user');
  if (!user) return null;
  return { userId: user.id, role: user.role };
}

async function getSellerProfile(c: any, userId: string) {
  return await c.env.DB.prepare(`
    SELECT id, userId, storeName, storeSlug, status, commissionRate
    FROM seller_profiles
    WHERE userId = ? AND status = 'active'
  `).bind(userId).first();
}

// ============================================================================
// SELLER PRODUCT ROUTES
// ============================================================================

// List seller's products
productRoutes.get('/', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const seller = await getSellerProfile(c, user.userId);
  if (!seller) {
    return c.json({ error: 'Seller profile not found' }, 404);
  }

  const query = c.req.query();
  const params = listProductsSchema.parse(query);
  const offset = (params.page - 1) * params.limit;

  let whereClause = 'WHERE p.sellerId = ?';
  const bindings: any[] = [seller.id];

  if (params.status && params.status !== 'all') {
    whereClause += ' AND p.status = ?';
    bindings.push(params.status);
  }

  if (params.categoryId) {
    whereClause += ' AND p.categoryId = ?';
    bindings.push(params.categoryId);
  }

  if (params.search) {
    whereClause += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.author LIKE ?)';
    const searchTerm = `%${params.search}%`;
    bindings.push(searchTerm, searchTerm, searchTerm);
  }

  let orderClause = 'ORDER BY p.createdAt DESC';
  switch (params.sortBy) {
    case 'oldest':
      orderClause = 'ORDER BY p.createdAt ASC';
      break;
    case 'price_low':
      orderClause = 'ORDER BY p.price ASC';
      break;
    case 'price_high':
      orderClause = 'ORDER BY p.price DESC';
      break;
    case 'bestselling':
      orderClause = 'ORDER BY p.salesCount DESC';
      break;
    case 'rating':
      orderClause = 'ORDER BY p.rating DESC';
      break;
  }

  try {
    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM shop_products p
      ${whereClause}
    `).bind(...bindings).first();

    // Get products
    const products = await c.env.DB.prepare(`
      SELECT
        p.*,
        c.name as categoryName,
        c.slug as categorySlug
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `).bind(...bindings, params.limit, offset).all();

    // Get status counts
    const statusCounts = await c.env.DB.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM shop_products
      WHERE sellerId = ?
      GROUP BY status
    `).bind(seller.id).all();

    const counts = statusCounts.results?.reduce((acc: any, row: any) => {
      acc[row.status] = row.count;
      return acc;
    }, {}) || {};

    return c.json({
      products: products.results || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / params.limit),
      },
      statusCounts: {
        all: Object.values(counts).reduce((a: number, b: any) => a + b, 0),
        draft: counts.draft || 0,
        pending_review: counts.pending_review || 0,
        approved: counts.approved || 0,
        published: counts.published || 0,
        rejected: counts.rejected || 0,
        archived: counts.archived || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Get single product
productRoutes.get('/:id', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const productId = c.req.param('id');

  try {
    const seller = await getSellerProfile(c, user.userId);
    if (!seller) {
      return c.json({ error: 'Seller profile not found' }, 404);
    }

    const product = await c.env.DB.prepare(`
      SELECT
        p.*,
        c.name as categoryName,
        c.slug as categorySlug
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      WHERE p.id = ? AND p.sellerId = ?
    `).bind(productId, seller.id).first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Parse JSON fields
    if (product.images) {
      try {
        product.images = JSON.parse(product.images as string);
      } catch {
        product.images = [];
      }
    }
    if (product.coAuthors) {
      try {
        product.coAuthors = JSON.parse(product.coAuthors as string);
      } catch {
        product.coAuthors = [];
      }
    }
    if (product.tableOfContents) {
      try {
        product.tableOfContents = JSON.parse(product.tableOfContents as string);
      } catch {
        product.tableOfContents = [];
      }
    }
    if (product.tags) {
      try {
        product.tags = JSON.parse(product.tags as string);
      } catch {
        product.tags = [];
      }
    }
    if (product.dimensions) {
      try {
        product.dimensions = JSON.parse(product.dimensions as string);
      } catch {
        product.dimensions = null;
      }
    }

    return c.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

// Create new product
productRoutes.post('/', zValidator('json', createProductSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const seller = await getSellerProfile(c, user.userId);
  if (!seller) {
    return c.json({ error: 'Seller profile not found' }, 404);
  }

  const data = c.req.valid('json');
  const productId = crypto.randomUUID();
  const slug = generateSlug(data.title);
  const now = new Date().toISOString();

  try {
    await c.env.DB.prepare(`
      INSERT INTO shop_products (
        id, sellerId, categoryId, title, slug, description, shortDescription,
        price, compareAtPrice, currency, productType,
        digitalFileUrl, digitalFileName, digitalFileSize, digitalFileType,
        previewUrl, downloadLimit, weight, dimensions, requiresShipping,
        sku, barcode, stockQuantity, trackInventory, allowBackorder, lowStockThreshold,
        coverImage, images, videoUrl,
        author, coAuthors, isbn, publisher, publishYear, edition,
        language, pages, format, tableOfContents,
        tags, searchKeywords, metaTitle, metaDescription,
        status, moderationStatus, viewCount, salesCount, rating, reviewCount, wishlistCount,
        isFeatured, isNewArrival, isBestseller,
        createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, 'pending', 0, 0, 0, 0, 0,
        0, 1, 0,
        ?, ?
      )
    `).bind(
      productId,
      seller.id,
      data.categoryId,
      data.title,
      slug,
      data.description,
      data.shortDescription || null,
      data.price,
      data.compareAtPrice || null,
      data.currency,
      data.productType,
      data.digitalFileUrl || null,
      data.digitalFileName || null,
      data.digitalFileSize || null,
      data.digitalFileType || null,
      data.previewUrl || null,
      data.downloadLimit || null,
      data.weight || null,
      data.dimensions ? JSON.stringify(data.dimensions) : null,
      data.requiresShipping ? 1 : 0,
      data.sku || null,
      data.barcode || null,
      data.stockQuantity,
      data.trackInventory ? 1 : 0,
      data.allowBackorder ? 1 : 0,
      data.lowStockThreshold || null,
      data.coverImage || null,
      data.images ? JSON.stringify(data.images) : null,
      data.videoUrl || null,
      data.author || null,
      data.coAuthors ? JSON.stringify(data.coAuthors) : null,
      data.isbn || null,
      data.publisher || null,
      data.publishYear || null,
      data.edition || null,
      data.language,
      data.pages || null,
      data.format || null,
      data.tableOfContents ? JSON.stringify(data.tableOfContents) : null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.searchKeywords || null,
      data.metaTitle || null,
      data.metaDescription || null,
      data.status,
      now,
      now
    ).run();

    return c.json({
      success: true,
      product: {
        id: productId,
        slug,
        status: data.status,
      },
    }, 201);
  } catch (error) {
    console.error('Error creating product:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

// Update product
productRoutes.patch('/:id', zValidator('json', updateProductSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const productId = c.req.param('id');
  const seller = await getSellerProfile(c, user.userId);
  if (!seller) {
    return c.json({ error: 'Seller profile not found' }, 404);
  }

  // Check product exists and belongs to seller
  const existingProduct = await c.env.DB.prepare(`
    SELECT id, status FROM shop_products WHERE id = ? AND sellerId = ?
  `).bind(productId, seller.id).first();

  if (!existingProduct) {
    return c.json({ error: 'Product not found' }, 404);
  }

  const data = c.req.valid('json');
  const now = new Date().toISOString();

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];

  const fieldMap: Record<string, string> = {
    title: 'title',
    description: 'description',
    shortDescription: 'shortDescription',
    categoryId: 'categoryId',
    price: 'price',
    compareAtPrice: 'compareAtPrice',
    productType: 'productType',
    digitalFileUrl: 'digitalFileUrl',
    digitalFileName: 'digitalFileName',
    digitalFileSize: 'digitalFileSize',
    digitalFileType: 'digitalFileType',
    previewUrl: 'previewUrl',
    downloadLimit: 'downloadLimit',
    weight: 'weight',
    requiresShipping: 'requiresShipping',
    sku: 'sku',
    barcode: 'barcode',
    stockQuantity: 'stockQuantity',
    trackInventory: 'trackInventory',
    allowBackorder: 'allowBackorder',
    lowStockThreshold: 'lowStockThreshold',
    coverImage: 'coverImage',
    videoUrl: 'videoUrl',
    author: 'author',
    isbn: 'isbn',
    publisher: 'publisher',
    publishYear: 'publishYear',
    edition: 'edition',
    language: 'language',
    pages: 'pages',
    format: 'format',
    searchKeywords: 'searchKeywords',
    metaTitle: 'metaTitle',
    metaDescription: 'metaDescription',
    status: 'status',
  };

  // Handle simple fields
  for (const [key, column] of Object.entries(fieldMap)) {
    if (data[key as keyof typeof data] !== undefined) {
      updates.push(`${column} = ?`);
      let value = data[key as keyof typeof data];

      // Convert booleans to integers
      if (typeof value === 'boolean') {
        value = value ? 1 : 0;
      }

      values.push(value);
    }
  }

  // Handle JSON fields
  const jsonFields = ['images', 'coAuthors', 'tableOfContents', 'tags', 'dimensions'];
  for (const field of jsonFields) {
    if (data[field as keyof typeof data] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(JSON.stringify(data[field as keyof typeof data]));
    }
  }

  // Update slug if title changed
  if (data.title) {
    updates.push('slug = ?');
    values.push(generateSlug(data.title));
  }

  // If status changed to pending_review, reset moderation status
  if (data.status === 'pending_review') {
    updates.push('moderationStatus = ?');
    values.push('pending');
  }

  updates.push('updatedAt = ?');
  values.push(now);

  values.push(productId, seller.id);

  try {
    await c.env.DB.prepare(`
      UPDATE shop_products
      SET ${updates.join(', ')}
      WHERE id = ? AND sellerId = ?
    `).bind(...values).run();

    return c.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

// Delete product (soft delete by archiving)
productRoutes.delete('/:id', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const productId = c.req.param('id');
  const seller = await getSellerProfile(c, user.userId);
  if (!seller) {
    return c.json({ error: 'Seller profile not found' }, 404);
  }

  try {
    const result = await c.env.DB.prepare(`
      UPDATE shop_products
      SET status = 'archived', updatedAt = ?
      WHERE id = ? AND sellerId = ?
    `).bind(new Date().toISOString(), productId, seller.id).run();

    if (!result.changes) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Product archived successfully',
    });
  } catch (error) {
    console.error('Error archiving product:', error);
    return c.json({ error: 'Failed to archive product' }, 500);
  }
});

// Submit product for review
productRoutes.post('/:id/submit', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const productId = c.req.param('id');
  const seller = await getSellerProfile(c, user.userId);
  if (!seller) {
    return c.json({ error: 'Seller profile not found' }, 404);
  }

  try {
    // Check product exists, belongs to seller, and is in draft status
    const product = await c.env.DB.prepare(`
      SELECT id, status, title, coverImage, price
      FROM shop_products
      WHERE id = ? AND sellerId = ?
    `).bind(productId, seller.id).first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    if (product.status !== 'draft' && product.status !== 'rejected') {
      return c.json({ error: 'Only draft or rejected products can be submitted for review' }, 400);
    }

    // Validate required fields
    if (!product.coverImage) {
      return c.json({ error: 'Product must have a cover image before submission' }, 400);
    }

    if (!product.price || product.price <= 0) {
      return c.json({ error: 'Product must have a valid price' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE shop_products
      SET status = 'pending_review', moderationStatus = 'pending', updatedAt = ?
      WHERE id = ? AND sellerId = ?
    `).bind(new Date().toISOString(), productId, seller.id).run();

    return c.json({
      success: true,
      message: 'Product submitted for review',
    });
  } catch (error) {
    console.error('Error submitting product:', error);
    return c.json({ error: 'Failed to submit product' }, 500);
  }
});

// Duplicate product
productRoutes.post('/:id/duplicate', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const productId = c.req.param('id');
  const seller = await getSellerProfile(c, user.userId);
  if (!seller) {
    return c.json({ error: 'Seller profile not found' }, 404);
  }

  try {
    const product = await c.env.DB.prepare(`
      SELECT * FROM shop_products WHERE id = ? AND sellerId = ?
    `).bind(productId, seller.id).first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const newProductId = crypto.randomUUID();
    const newTitle = `${product.title} (Copy)`;
    const newSlug = generateSlug(newTitle);
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO shop_products (
        id, sellerId, categoryId, title, slug, description, shortDescription,
        price, compareAtPrice, currency, productType,
        digitalFileUrl, digitalFileName, digitalFileSize, digitalFileType,
        previewUrl, downloadLimit, weight, dimensions, requiresShipping,
        sku, barcode, stockQuantity, trackInventory, allowBackorder, lowStockThreshold,
        coverImage, images, videoUrl,
        author, coAuthors, isbn, publisher, publishYear, edition,
        language, pages, format, tableOfContents,
        tags, searchKeywords, metaTitle, metaDescription,
        status, moderationStatus, viewCount, salesCount, rating, reviewCount, wishlistCount,
        isFeatured, isNewArrival, isBestseller,
        createdAt, updatedAt
      )
      SELECT
        ?, sellerId, categoryId, ?, ?, description, shortDescription,
        price, compareAtPrice, currency, productType,
        digitalFileUrl, digitalFileName, digitalFileSize, digitalFileType,
        previewUrl, downloadLimit, weight, dimensions, requiresShipping,
        NULL, NULL, stockQuantity, trackInventory, allowBackorder, lowStockThreshold,
        coverImage, images, videoUrl,
        author, coAuthors, NULL, publisher, publishYear, edition,
        language, pages, format, tableOfContents,
        tags, searchKeywords, metaTitle, metaDescription,
        'draft', 'pending', 0, 0, 0, 0, 0,
        0, 0, 0,
        ?, ?
      FROM shop_products WHERE id = ?
    `).bind(newProductId, newTitle, newSlug, now, now, productId).run();

    return c.json({
      success: true,
      product: {
        id: newProductId,
        slug: newSlug,
        title: newTitle,
      },
    }, 201);
  } catch (error) {
    console.error('Error duplicating product:', error);
    return c.json({ error: 'Failed to duplicate product' }, 500);
  }
});

// ============================================================================
// CATEGORY ROUTES (Public)
// ============================================================================

productRoutes.get('/categories/all', async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT
        id, name, slug, description, icon, image, parentId, sortOrder,
        (SELECT COUNT(*) FROM shop_products WHERE categoryId = shop_categories.id AND status = 'published') as productCount
      FROM shop_categories
      WHERE isActive = 1
      ORDER BY sortOrder ASC, name ASC
    `).all();

    return c.json({ categories: categories.results || [] });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// ============================================================================
// ADMIN MODERATION ROUTES
// ============================================================================

// List products for moderation
productRoutes.get('/admin/pending', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check admin role
  const adminRoles = ['admin', 'director', 'super_admin'];
  if (!adminRoles.includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const query = c.req.query();
  const page = parseInt(query.page || '1');
  const limit = Math.min(parseInt(query.limit || '20'), 100);
  const offset = (page - 1) * limit;
  const status = query.status || 'pending_review';

  try {
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM shop_products
      WHERE status = ?
    `).bind(status).first();

    const products = await c.env.DB.prepare(`
      SELECT
        p.*,
        c.name as categoryName,
        s.storeName, s.storeSlug, s.isVerified as sellerVerified,
        u.displayName as sellerName, u.email as sellerEmail
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      LEFT JOIN seller_profiles s ON p.sellerId = s.id
      LEFT JOIN users u ON s.userId = u.id
      WHERE p.status = ?
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(status, limit, offset).all();

    // Get counts by moderation status
    const statusCounts = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM shop_products
      WHERE status IN ('pending_review', 'approved', 'rejected')
      GROUP BY status
    `).all();

    const counts = statusCounts.results?.reduce((acc: any, row: any) => {
      acc[row.status] = row.count;
      return acc;
    }, {}) || {};

    return c.json({
      products: products.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
      statusCounts: {
        pending_review: counts.pending_review || 0,
        approved: counts.approved || 0,
        rejected: counts.rejected || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching products for moderation:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Moderate product (approve/reject)
productRoutes.post('/admin/:id/moderate', zValidator('json', moderateProductSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check admin role
  const adminRoles = ['admin', 'director', 'super_admin'];
  if (!adminRoles.includes(user.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const productId = c.req.param('id');
  const data = c.req.valid('json');
  const now = new Date().toISOString();

  try {
    // Get the product
    const product = await c.env.DB.prepare(`
      SELECT id, sellerId, title, status FROM shop_products WHERE id = ?
    `).bind(productId).first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    let newStatus: string;
    let moderationStatus: string;

    switch (data.action) {
      case 'approve':
        newStatus = 'approved';
        moderationStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        moderationStatus = 'rejected';
        if (!data.rejectionReason) {
          return c.json({ error: 'Rejection reason is required' }, 400);
        }
        break;
      case 'request_changes':
        newStatus = 'draft';
        moderationStatus = 'pending';
        break;
      default:
        return c.json({ error: 'Invalid action' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE shop_products
      SET
        status = ?,
        moderationStatus = ?,
        moderationNotes = ?,
        rejectionReason = ?,
        updatedAt = ?
      WHERE id = ?
    `).bind(
      newStatus,
      moderationStatus,
      data.notes || null,
      data.rejectionReason || null,
      now,
      productId
    ).run();

    return c.json({
      success: true,
      message: `Product ${data.action === 'approve' ? 'approved' : data.action === 'reject' ? 'rejected' : 'returned for changes'}`,
    });
  } catch (error) {
    console.error('Error moderating product:', error);
    return c.json({ error: 'Failed to moderate product' }, 500);
  }
});

// Publish approved product
productRoutes.post('/:id/publish', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const productId = c.req.param('id');
  const seller = await getSellerProfile(c, user.userId);
  if (!seller) {
    return c.json({ error: 'Seller profile not found' }, 404);
  }

  try {
    // Check product is approved
    const product = await c.env.DB.prepare(`
      SELECT id, status FROM shop_products WHERE id = ? AND sellerId = ?
    `).bind(productId, seller.id).first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    if (product.status !== 'approved') {
      return c.json({ error: 'Only approved products can be published' }, 400);
    }

    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE shop_products
      SET status = 'published', publishedAt = ?, updatedAt = ?
      WHERE id = ? AND sellerId = ?
    `).bind(now, now, productId, seller.id).run();

    return c.json({
      success: true,
      message: 'Product published successfully',
    });
  } catch (error) {
    console.error('Error publishing product:', error);
    return c.json({ error: 'Failed to publish product' }, 500);
  }
});

// Unpublish product
productRoutes.post('/:id/unpublish', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const productId = c.req.param('id');
  const seller = await getSellerProfile(c, user.userId);
  if (!seller) {
    return c.json({ error: 'Seller profile not found' }, 404);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE shop_products
      SET status = 'approved', publishedAt = NULL, updatedAt = ?
      WHERE id = ? AND sellerId = ? AND status = 'published'
    `).bind(new Date().toISOString(), productId, seller.id).run();

    return c.json({
      success: true,
      message: 'Product unpublished successfully',
    });
  } catch (error) {
    console.error('Error unpublishing product:', error);
    return c.json({ error: 'Failed to unpublish product' }, 500);
  }
});

// ============================================================================
// PUBLIC CATALOG ROUTES (No authentication required)
// ============================================================================

// Browse published products (public catalog)
productRoutes.get('/catalog/browse', async (c) => {
  const query = c.req.query();
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(Math.max(1, parseInt(query.limit || '20')), 50);
  const offset = (page - 1) * limit;
  const categoryId = query.category;
  const search = query.search;
  const sortBy = query.sort || 'newest';
  const minPrice = query.minPrice ? parseFloat(query.minPrice) : undefined;
  const maxPrice = query.maxPrice ? parseFloat(query.maxPrice) : undefined;
  const productType = query.type; // physical, digital, bundle

  let whereClause = "WHERE p.status = 'published'";
  const bindings: any[] = [];

  if (categoryId) {
    whereClause += ' AND p.categoryId = ?';
    bindings.push(categoryId);
  }

  if (search) {
    whereClause += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.author LIKE ? OR p.searchKeywords LIKE ?)';
    const searchTerm = `%${search}%`;
    bindings.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (productType) {
    whereClause += ' AND p.productType = ?';
    bindings.push(productType);
  }

  if (minPrice !== undefined) {
    whereClause += ' AND p.price >= ?';
    bindings.push(minPrice);
  }

  if (maxPrice !== undefined) {
    whereClause += ' AND p.price <= ?';
    bindings.push(maxPrice);
  }

  let orderClause = 'ORDER BY p.publishedAt DESC';
  switch (sortBy) {
    case 'oldest':
      orderClause = 'ORDER BY p.publishedAt ASC';
      break;
    case 'price_low':
      orderClause = 'ORDER BY p.price ASC';
      break;
    case 'price_high':
      orderClause = 'ORDER BY p.price DESC';
      break;
    case 'bestselling':
      orderClause = 'ORDER BY p.salesCount DESC';
      break;
    case 'rating':
      orderClause = 'ORDER BY p.rating DESC, p.reviewCount DESC';
      break;
    case 'popular':
      orderClause = 'ORDER BY p.viewCount DESC';
      break;
  }

  try {
    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM shop_products p
      ${whereClause}
    `).bind(...bindings).first();

    // Get products
    const products = await c.env.DB.prepare(`
      SELECT
        p.id, p.title, p.slug, p.shortDescription, p.price, p.compareAtPrice,
        p.currency, p.productType, p.coverImage, p.author,
        p.rating, p.reviewCount, p.salesCount, p.viewCount,
        p.isFeatured, p.isNewArrival, p.isBestseller,
        p.publishedAt, p.createdAt,
        c.name as categoryName, c.slug as categorySlug,
        s.storeName, s.storeSlug, s.isVerified as sellerVerified
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      LEFT JOIN seller_profiles s ON p.sellerId = s.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all();

    return c.json({
      products: products.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Get featured/homepage products
productRoutes.get('/catalog/featured', async (c) => {
  try {
    // Get featured products
    const featured = await c.env.DB.prepare(`
      SELECT
        p.id, p.title, p.slug, p.shortDescription, p.price, p.compareAtPrice,
        p.currency, p.productType, p.coverImage, p.author,
        p.rating, p.reviewCount, p.isFeatured, p.isNewArrival, p.isBestseller,
        c.name as categoryName, c.slug as categorySlug,
        s.storeName, s.storeSlug, s.isVerified as sellerVerified
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      LEFT JOIN seller_profiles s ON p.sellerId = s.id
      WHERE p.status = 'published' AND p.isFeatured = 1
      ORDER BY p.publishedAt DESC
      LIMIT 8
    `).all();

    // Get bestsellers
    const bestsellers = await c.env.DB.prepare(`
      SELECT
        p.id, p.title, p.slug, p.shortDescription, p.price, p.compareAtPrice,
        p.currency, p.productType, p.coverImage, p.author,
        p.rating, p.reviewCount, p.salesCount,
        c.name as categoryName, c.slug as categorySlug,
        s.storeName, s.storeSlug, s.isVerified as sellerVerified
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      LEFT JOIN seller_profiles s ON p.sellerId = s.id
      WHERE p.status = 'published' AND p.salesCount > 0
      ORDER BY p.salesCount DESC
      LIMIT 8
    `).all();

    // Get new arrivals
    const newArrivals = await c.env.DB.prepare(`
      SELECT
        p.id, p.title, p.slug, p.shortDescription, p.price, p.compareAtPrice,
        p.currency, p.productType, p.coverImage, p.author,
        p.rating, p.reviewCount,
        c.name as categoryName, c.slug as categorySlug,
        s.storeName, s.storeSlug, s.isVerified as sellerVerified
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      LEFT JOIN seller_profiles s ON p.sellerId = s.id
      WHERE p.status = 'published'
      ORDER BY p.publishedAt DESC
      LIMIT 8
    `).all();

    return c.json({
      featured: featured.results || [],
      bestsellers: bestsellers.results || [],
      newArrivals: newArrivals.results || [],
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Get single product by ID (public view - for wishlist)
productRoutes.get('/catalog/id/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const product = await c.env.DB.prepare(`
      SELECT
        p.id, p.title, p.slug, p.shortDescription, p.price, p.compareAtPrice,
        p.currency, p.productType, p.coverImage, p.author,
        p.rating, p.reviewCount, p.stockQuantity, p.trackInventory,
        c.name as categoryName, c.slug as categorySlug,
        s.storeName, s.storeSlug, s.isVerified as sellerVerified,
        CASE WHEN p.salesCount > 50 THEN 1 ELSE 0 END as isBestseller
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      LEFT JOIN seller_profiles s ON p.sellerId = s.id
      WHERE p.id = ? AND p.status = 'published'
    `).bind(id).first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({ product });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

// Get single product by slug (public view)
productRoutes.get('/catalog/:slug', async (c) => {
  const slug = c.req.param('slug');

  try {
    // Fetch product
    const product = await c.env.DB.prepare(`
      SELECT
        p.*,
        c.name as categoryName, c.slug as categorySlug,
        s.id as sellerId, s.storeName, s.storeSlug, s.storeLogo, s.storeDescription,
        s.isVerified as sellerVerified, s.totalSales as sellerTotalSales,
        s.rating as sellerRating, s.reviewCount as sellerReviewCount,
        u.displayName as sellerName, u.avatar as sellerAvatar
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      LEFT JOIN seller_profiles s ON p.sellerId = s.id
      LEFT JOIN users u ON s.userId = u.id
      WHERE (p.slug = ? OR p.id = ?) AND p.status = 'published'
    `).bind(slug, slug).first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Increment view count (async, don't wait)
    c.env.DB.prepare(`
      UPDATE shop_products SET viewCount = viewCount + 1 WHERE id = ?
    `).bind(product.id).run().catch(() => {});

    // Parse JSON fields
    const jsonFields = ['images', 'coAuthors', 'tableOfContents', 'tags', 'dimensions'];
    for (const field of jsonFields) {
      if (product[field]) {
        try {
          product[field] = JSON.parse(product[field] as string);
        } catch {
          product[field] = field === 'dimensions' ? null : [];
        }
      }
    }

    // Get seller's other products
    const sellerProducts = await c.env.DB.prepare(`
      SELECT id, title, slug, coverImage, price, compareAtPrice, rating, reviewCount
      FROM shop_products
      WHERE sellerId = ? AND status = 'published' AND id != ?
      ORDER BY salesCount DESC
      LIMIT 4
    `).bind(product.sellerId, product.id).all();

    // Get related products (same category)
    const relatedProducts = await c.env.DB.prepare(`
      SELECT
        p.id, p.title, p.slug, p.coverImage, p.price, p.compareAtPrice,
        p.rating, p.reviewCount, p.productType, p.author,
        s.storeName, s.isVerified as sellerVerified
      FROM shop_products p
      LEFT JOIN seller_profiles s ON p.sellerId = s.id
      WHERE p.categoryId = ? AND p.status = 'published' AND p.id != ?
      ORDER BY p.salesCount DESC
      LIMIT 6
    `).bind(product.categoryId, product.id).all();

    // Get product reviews
    const reviews = await c.env.DB.prepare(`
      SELECT
        r.id, r.rating, r.title, r.content, r.isVerifiedPurchase, r.createdAt,
        u.displayName as reviewerName, u.avatar as reviewerAvatar
      FROM shop_product_reviews r
      LEFT JOIN users u ON r.userId = u.id
      WHERE r.productId = ? AND r.status = 'published'
      ORDER BY r.createdAt DESC
      LIMIT 10
    `).bind(product.id).all();

    // Get rating distribution
    const ratingStats = await c.env.DB.prepare(`
      SELECT
        rating,
        COUNT(*) as count
      FROM shop_product_reviews
      WHERE productId = ? AND status = 'published'
      GROUP BY rating
    `).bind(product.id).all();

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of ratingStats.results || []) {
      ratingDistribution[row.rating as keyof typeof ratingDistribution] = row.count as number;
    }

    return c.json({
      product,
      seller: {
        id: product.sellerId,
        name: product.sellerName,
        storeName: product.storeName,
        storeSlug: product.storeSlug,
        storeLogo: product.storeLogo,
        storeDescription: product.storeDescription,
        avatar: product.sellerAvatar,
        isVerified: product.sellerVerified,
        totalSales: product.sellerTotalSales,
        rating: product.sellerRating,
        reviewCount: product.sellerReviewCount,
        otherProducts: sellerProducts.results || [],
      },
      relatedProducts: relatedProducts.results || [],
      reviews: {
        items: reviews.results || [],
        totalCount: product.reviewCount || 0,
        averageRating: product.rating || 0,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

// Get seller storefront by store slug (public)
productRoutes.get('/store/:storeSlug', async (c) => {
  const storeSlug = c.req.param('storeSlug');
  const query = c.req.query();
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(Math.max(1, parseInt(query.limit || '12')), 50);
  const offset = (page - 1) * limit;
  const sortBy = query.sort || 'newest';

  try {
    // Get seller profile
    const seller = await c.env.DB.prepare(`
      SELECT
        s.id, s.storeName, s.storeSlug, s.storeLogo, s.storeBanner,
        s.storeDescription, s.isVerified, s.totalSales, s.rating, s.reviewCount,
        s.socialLinks, s.policies, s.createdAt,
        u.displayName as ownerName, u.avatar as ownerAvatar, u.bio as ownerBio,
        u.department, u.region
      FROM seller_profiles s
      LEFT JOIN users u ON s.userId = u.id
      WHERE s.storeSlug = ? AND s.status = 'active'
    `).bind(storeSlug).first();

    if (!seller) {
      return c.json({ error: 'Store not found' }, 404);
    }

    // Parse JSON fields
    if (seller.socialLinks) {
      try {
        seller.socialLinks = JSON.parse(seller.socialLinks as string);
      } catch {
        seller.socialLinks = {};
      }
    }
    if (seller.policies) {
      try {
        seller.policies = JSON.parse(seller.policies as string);
      } catch {
        seller.policies = {};
      }
    }

    // Build sort clause
    let orderClause = 'ORDER BY p.publishedAt DESC';
    switch (sortBy) {
      case 'oldest':
        orderClause = 'ORDER BY p.publishedAt ASC';
        break;
      case 'price_low':
        orderClause = 'ORDER BY p.price ASC';
        break;
      case 'price_high':
        orderClause = 'ORDER BY p.price DESC';
        break;
      case 'bestselling':
        orderClause = 'ORDER BY p.salesCount DESC';
        break;
      case 'rating':
        orderClause = 'ORDER BY p.rating DESC';
        break;
    }

    // Get product count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM shop_products
      WHERE sellerId = ? AND status = 'published'
    `).bind(seller.id).first();

    // Get seller's products
    const products = await c.env.DB.prepare(`
      SELECT
        p.id, p.title, p.slug, p.shortDescription, p.price, p.compareAtPrice,
        p.currency, p.productType, p.coverImage, p.author,
        p.rating, p.reviewCount, p.salesCount,
        p.isFeatured, p.isBestseller,
        c.name as categoryName, c.slug as categorySlug
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      WHERE p.sellerId = ? AND p.status = 'published'
      ${orderClause}
      LIMIT ? OFFSET ?
    `).bind(seller.id, limit, offset).all();

    // Get featured products from this seller
    const featuredProducts = await c.env.DB.prepare(`
      SELECT
        id, title, slug, coverImage, price, compareAtPrice, rating, reviewCount
      FROM shop_products
      WHERE sellerId = ? AND status = 'published' AND isFeatured = 1
      ORDER BY salesCount DESC
      LIMIT 4
    `).bind(seller.id).all();

    // Get category breakdown for this seller
    const categoryStats = await c.env.DB.prepare(`
      SELECT
        c.id, c.name, c.slug,
        COUNT(*) as productCount
      FROM shop_products p
      LEFT JOIN shop_categories c ON p.categoryId = c.id
      WHERE p.sellerId = ? AND p.status = 'published'
      GROUP BY c.id
      ORDER BY productCount DESC
    `).bind(seller.id).all();

    // Get seller reviews
    const reviews = await c.env.DB.prepare(`
      SELECT
        r.id, r.rating, r.title, r.content, r.isVerifiedPurchase, r.createdAt,
        u.displayName as reviewerName, u.avatar as reviewerAvatar,
        p.title as productTitle, p.slug as productSlug
      FROM shop_product_reviews r
      LEFT JOIN users u ON r.userId = u.id
      LEFT JOIN shop_products p ON r.productId = p.id
      WHERE p.sellerId = ? AND r.status = 'published'
      ORDER BY r.createdAt DESC
      LIMIT 6
    `).bind(seller.id).all();

    return c.json({
      seller: {
        id: seller.id,
        storeName: seller.storeName,
        storeSlug: seller.storeSlug,
        storeLogo: seller.storeLogo,
        storeBanner: seller.storeBanner,
        storeDescription: seller.storeDescription,
        isVerified: seller.isVerified,
        totalSales: seller.totalSales || 0,
        rating: seller.rating || 0,
        reviewCount: seller.reviewCount || 0,
        socialLinks: seller.socialLinks || {},
        policies: seller.policies || {},
        createdAt: seller.createdAt,
        owner: {
          name: seller.ownerName,
          avatar: seller.ownerAvatar,
          bio: seller.ownerBio,
          department: seller.department,
          region: seller.region,
        },
      },
      products: products.results || [],
      featuredProducts: featuredProducts.results || [],
      categories: categoryStats.results || [],
      recentReviews: reviews.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    return c.json({ error: 'Failed to fetch store' }, 500);
  }
});

// ============================================================================
// PRODUCT REVIEWS
// ============================================================================

// Submit a product review (authenticated)
productRoutes.post('/reviews', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const body = await c.req.json();
    const { productId, rating, title, content } = body;

    // Validate input
    if (!productId || !rating) {
      return c.json({ error: 'Product ID and rating are required' }, 400);
    }

    if (rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }

    if (content && content.length > 2000) {
      return c.json({ error: 'Review content must be under 2000 characters' }, 400);
    }

    // Check if product exists and is published
    const product = await c.env.DB.prepare(`
      SELECT id, title, sellerId FROM shop_products WHERE id = ? AND status = 'published'
    `).bind(productId).first();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Check if user already reviewed this product
    const existingReview = await c.env.DB.prepare(`
      SELECT id FROM shop_product_reviews WHERE productId = ? AND userId = ?
    `).bind(productId, user.id).first();

    if (existingReview) {
      return c.json({ error: 'You have already reviewed this product' }, 400);
    }

    // Check if user has purchased this product (verified purchase)
    const purchase = await c.env.DB.prepare(`
      SELECT oi.id
      FROM shop_order_items oi
      JOIN shop_orders o ON oi.orderId = o.id
      WHERE oi.productId = ? AND o.userId = ? AND o.paymentStatus = 'paid'
      LIMIT 1
    `).bind(productId, user.id).first();

    const isVerifiedPurchase = !!purchase;

    // Create review
    const reviewId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO shop_product_reviews (
        id, productId, userId, rating, title, content,
        isVerifiedPurchase, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)
    `).bind(
      reviewId,
      productId,
      user.id,
      rating,
      title || null,
      content || null,
      isVerifiedPurchase ? 1 : 0,
      now,
      now
    ).run();

    // Update product rating and review count
    const ratingStats = await c.env.DB.prepare(`
      SELECT AVG(rating) as avgRating, COUNT(*) as count
      FROM shop_product_reviews
      WHERE productId = ? AND status = 'published'
    `).bind(productId).first();

    await c.env.DB.prepare(`
      UPDATE shop_products
      SET rating = ?, reviewCount = ?, updatedAt = ?
      WHERE id = ?
    `).bind(
      ratingStats?.avgRating || rating,
      ratingStats?.count || 1,
      now,
      productId
    ).run();

    // Update seller rating
    const sellerStats = await c.env.DB.prepare(`
      SELECT AVG(r.rating) as avgRating, COUNT(*) as count
      FROM shop_product_reviews r
      JOIN shop_products p ON r.productId = p.id
      WHERE p.sellerId = ? AND r.status = 'published'
    `).bind(product.sellerId).first();

    await c.env.DB.prepare(`
      UPDATE seller_profiles
      SET rating = ?, reviewCount = ?, updatedAt = ?
      WHERE id = ?
    `).bind(
      sellerStats?.avgRating || rating,
      sellerStats?.count || 1,
      now,
      product.sellerId
    ).run();

    return c.json({
      message: 'Review submitted successfully',
      review: {
        id: reviewId,
        rating,
        title,
        content,
        isVerifiedPurchase,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return c.json({ error: 'Failed to submit review' }, 500);
  }
});

// Update a review (authenticated)
productRoutes.patch('/reviews/:reviewId', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const reviewId = c.req.param('reviewId');

  try {
    const body = await c.req.json();
    const { rating, title, content } = body;

    // Verify review ownership
    const review = await c.env.DB.prepare(`
      SELECT id, productId FROM shop_product_reviews WHERE id = ? AND userId = ?
    `).bind(reviewId, user.id).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400);
    }

    if (content && content.length > 2000) {
      return c.json({ error: 'Review content must be under 2000 characters' }, 400);
    }

    const now = new Date().toISOString();

    // Update review
    await c.env.DB.prepare(`
      UPDATE shop_product_reviews
      SET rating = COALESCE(?, rating),
          title = COALESCE(?, title),
          content = COALESCE(?, content),
          updatedAt = ?
      WHERE id = ?
    `).bind(
      rating || null,
      title || null,
      content || null,
      now,
      reviewId
    ).run();

    // Update product rating
    const ratingStats = await c.env.DB.prepare(`
      SELECT AVG(rating) as avgRating, COUNT(*) as count
      FROM shop_product_reviews
      WHERE productId = ? AND status = 'published'
    `).bind(review.productId).first();

    await c.env.DB.prepare(`
      UPDATE shop_products
      SET rating = ?, updatedAt = ?
      WHERE id = ?
    `).bind(ratingStats?.avgRating || 0, now, review.productId).run();

    return c.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    return c.json({ error: 'Failed to update review' }, 500);
  }
});

// Delete a review (authenticated)
productRoutes.delete('/reviews/:reviewId', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const reviewId = c.req.param('reviewId');

  try {
    // Verify review ownership
    const review = await c.env.DB.prepare(`
      SELECT id, productId FROM shop_product_reviews WHERE id = ? AND userId = ?
    `).bind(reviewId, user.id).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Delete review
    await c.env.DB.prepare(`
      DELETE FROM shop_product_reviews WHERE id = ?
    `).bind(reviewId).run();

    const now = new Date().toISOString();

    // Update product rating and count
    const ratingStats = await c.env.DB.prepare(`
      SELECT AVG(rating) as avgRating, COUNT(*) as count
      FROM shop_product_reviews
      WHERE productId = ? AND status = 'published'
    `).bind(review.productId).first();

    await c.env.DB.prepare(`
      UPDATE shop_products
      SET rating = ?, reviewCount = ?, updatedAt = ?
      WHERE id = ?
    `).bind(
      ratingStats?.avgRating || 0,
      ratingStats?.count || 0,
      now,
      review.productId
    ).run();

    return c.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return c.json({ error: 'Failed to delete review' }, 500);
  }
});

// Get reviews for a product (public)
productRoutes.get('/reviews/product/:productId', async (c) => {
  const productId = c.req.param('productId');
  const query = c.req.query();
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(Math.max(1, parseInt(query.limit || '10')), 50);
  const offset = (page - 1) * limit;
  const sortBy = query.sort || 'newest';

  try {
    // Build sort clause
    let orderClause = 'ORDER BY r.createdAt DESC';
    switch (sortBy) {
      case 'oldest':
        orderClause = 'ORDER BY r.createdAt ASC';
        break;
      case 'highest':
        orderClause = 'ORDER BY r.rating DESC, r.createdAt DESC';
        break;
      case 'lowest':
        orderClause = 'ORDER BY r.rating ASC, r.createdAt DESC';
        break;
      case 'helpful':
        orderClause = 'ORDER BY r.helpfulCount DESC, r.createdAt DESC';
        break;
    }

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM shop_product_reviews
      WHERE productId = ? AND status = 'published'
    `).bind(productId).first();

    // Get reviews
    const reviews = await c.env.DB.prepare(`
      SELECT
        r.id, r.rating, r.title, r.content, r.isVerifiedPurchase,
        r.helpfulCount, r.createdAt, r.updatedAt,
        u.id as reviewerId, u.displayName as reviewerName, u.avatar as reviewerAvatar
      FROM shop_product_reviews r
      LEFT JOIN users u ON r.userId = u.id
      WHERE r.productId = ? AND r.status = 'published'
      ${orderClause}
      LIMIT ? OFFSET ?
    `).bind(productId, limit, offset).all();

    // Get rating distribution
    const distribution = await c.env.DB.prepare(`
      SELECT rating, COUNT(*) as count
      FROM shop_product_reviews
      WHERE productId = ? AND status = 'published'
      GROUP BY rating
    `).bind(productId).all();

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distribution.results || []) {
      ratingDistribution[row.rating as number] = row.count as number;
    }

    // Get average rating
    const avgResult = await c.env.DB.prepare(`
      SELECT AVG(rating) as avgRating
      FROM shop_product_reviews
      WHERE productId = ? AND status = 'published'
    `).bind(productId).first();

    return c.json({
      reviews: reviews.results || [],
      summary: {
        averageRating: avgResult?.avgRating || 0,
        totalCount: countResult?.total || 0,
        distribution: ratingDistribution,
      },
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// Check if user can review a product (authenticated)
productRoutes.get('/reviews/can-review/:productId', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ canReview: false, reason: 'not_authenticated' });
  }

  const productId = c.req.param('productId');

  try {
    // Check if user already reviewed this product
    const existingReview = await c.env.DB.prepare(`
      SELECT id, rating, title, content, createdAt
      FROM shop_product_reviews
      WHERE productId = ? AND userId = ?
    `).bind(productId, user.id).first();

    if (existingReview) {
      return c.json({
        canReview: false,
        reason: 'already_reviewed',
        existingReview,
      });
    }

    // Check if user has purchased this product
    const purchase = await c.env.DB.prepare(`
      SELECT oi.id, o.createdAt as purchaseDate
      FROM shop_order_items oi
      JOIN shop_orders o ON oi.orderId = o.id
      WHERE oi.productId = ? AND o.userId = ? AND o.paymentStatus = 'paid'
      LIMIT 1
    `).bind(productId, user.id).first();

    return c.json({
      canReview: true,
      hasPurchased: !!purchase,
      purchaseDate: purchase?.purchaseDate || null,
    });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return c.json({ error: 'Failed to check eligibility' }, 500);
  }
});

// Mark review as helpful (authenticated)
productRoutes.post('/reviews/:reviewId/helpful', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const reviewId = c.req.param('reviewId');

  try {
    // Check if review exists
    const review = await c.env.DB.prepare(`
      SELECT id, helpfulCount FROM shop_product_reviews WHERE id = ?
    `).bind(reviewId).first();

    if (!review) {
      return c.json({ error: 'Review not found' }, 404);
    }

    // Check if user already voted on this review
    const existingVote = await c.env.DB.prepare(`
      SELECT id FROM shop_review_votes WHERE reviewId = ? AND userId = ?
    `).bind(reviewId, user.id).first();

    if (existingVote) {
      return c.json({ error: 'You have already voted on this review' }, 400);
    }

    // Record vote and update helpful count
    await c.env.DB.prepare(`
      INSERT INTO shop_review_votes (id, reviewId, userId, isHelpful, createdAt)
      VALUES (?, ?, ?, 1, datetime('now'))
    `).bind(crypto.randomUUID(), reviewId, user.id).run();

    await c.env.DB.prepare(`
      UPDATE shop_product_reviews
      SET helpfulCount = helpfulCount + 1
      WHERE id = ?
    `).bind(reviewId).run();

    return c.json({
      message: 'Marked as helpful',
      helpfulCount: (review.helpfulCount as number || 0) + 1,
    });
  } catch (error) {
    console.error('Error marking helpful:', error);
    return c.json({ error: 'Failed to mark as helpful' }, 500);
  }
});

export { productRoutes };
