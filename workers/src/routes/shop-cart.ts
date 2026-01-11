import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const cartRoutes = new Hono();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().min(1).default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.number().min(0),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getUserFromToken(c: any): { userId: string; role: string } | null {
  const user = c.get('user');
  if (!user) return null;
  return { userId: user.id, role: user.role };
}

// ============================================================================
// CART ROUTES
// ============================================================================

// Get cart
cartRoutes.get('/', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const cartItems = await c.env.DB.prepare(`
      SELECT
        ci.id,
        ci.productId,
        ci.variantId,
        ci.quantity,
        ci.addedAt,
        p.title,
        p.slug,
        p.coverImage,
        p.price,
        p.compareAtPrice,
        p.productType,
        p.stockQuantity,
        p.trackInventory,
        p.digitalFileUrl,
        s.storeName,
        s.storeSlug as sellerSlug
      FROM shop_cart_items ci
      JOIN shop_products p ON ci.productId = p.id
      JOIN seller_profiles s ON p.sellerId = s.id
      WHERE ci.userId = ? AND p.status = 'published'
      ORDER BY ci.addedAt DESC
    `).bind(user.userId).all();

    // Calculate totals
    const items = cartItems.results || [];
    const subtotal = items.reduce((total: number, item: any) => {
      return total + (item.price * item.quantity);
    }, 0);

    const hasPhysicalProducts = items.some((item: any) => item.productType === 'physical');

    return c.json({
      items,
      summary: {
        itemCount: items.reduce((count: number, item: any) => count + item.quantity, 0),
        uniqueItems: items.length,
        subtotal,
        hasPhysicalProducts,
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return c.json({ error: 'Failed to fetch cart' }, 500);
  }
});

// Add to cart
cartRoutes.post('/', zValidator('json', addToCartSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { productId, variantId, quantity } = c.req.valid('json');

  try {
    // Check if product exists and is published
    const product = await c.env.DB.prepare(`
      SELECT id, title, price, stockQuantity, trackInventory, status
      FROM shop_products
      WHERE id = ? AND status = 'published'
    `).bind(productId).first();

    if (!product) {
      return c.json({ error: 'Product not found or unavailable' }, 404);
    }

    // Check stock
    if (product.trackInventory && product.stockQuantity < quantity) {
      return c.json({
        error: 'Insufficient stock',
        available: product.stockQuantity,
      }, 400);
    }

    // Check if item already in cart
    const existingItem = await c.env.DB.prepare(`
      SELECT id, quantity FROM shop_cart_items
      WHERE userId = ? AND productId = ? AND (variantId = ? OR (variantId IS NULL AND ? IS NULL))
    `).bind(user.userId, productId, variantId || null, variantId || null).first();

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      // Check stock for updated quantity
      if (product.trackInventory && product.stockQuantity < newQuantity) {
        return c.json({
          error: 'Cannot add more items. Insufficient stock.',
          available: product.stockQuantity,
          inCart: existingItem.quantity,
        }, 400);
      }

      await c.env.DB.prepare(`
        UPDATE shop_cart_items SET quantity = ?, updatedAt = ? WHERE id = ?
      `).bind(newQuantity, new Date().toISOString(), existingItem.id).run();

      return c.json({
        success: true,
        message: 'Cart updated',
        itemId: existingItem.id,
        quantity: newQuantity,
      });
    } else {
      // Add new item
      const itemId = crypto.randomUUID();
      const now = new Date().toISOString();

      await c.env.DB.prepare(`
        INSERT INTO shop_cart_items (id, userId, productId, variantId, quantity, addedAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, user.userId, productId, variantId || null, quantity, now, now).run();

      return c.json({
        success: true,
        message: 'Added to cart',
        itemId,
        quantity,
      }, 201);
    }
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return c.json({
      error: 'Failed to add to cart',
      details: error?.message || String(error)
    }, 500);
  }
});

// Update cart item
cartRoutes.patch('/:itemId', zValidator('json', updateCartItemSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const itemId = c.req.param('itemId');
  const { quantity } = c.req.valid('json');

  try {
    // Get the cart item with product info
    const cartItem = await c.env.DB.prepare(`
      SELECT ci.id, ci.productId, p.stockQuantity, p.trackInventory
      FROM shop_cart_items ci
      JOIN shop_products p ON ci.productId = p.id
      WHERE ci.id = ? AND ci.userId = ?
    `).bind(itemId, user.userId).first();

    if (!cartItem) {
      return c.json({ error: 'Cart item not found' }, 404);
    }

    if (quantity === 0) {
      // Remove item
      await c.env.DB.prepare(`
        DELETE FROM shop_cart_items WHERE id = ? AND userId = ?
      `).bind(itemId, user.userId).run();

      return c.json({ success: true, message: 'Item removed from cart' });
    }

    // Check stock
    if (cartItem.trackInventory && cartItem.stockQuantity < quantity) {
      return c.json({
        error: 'Insufficient stock',
        available: cartItem.stockQuantity,
      }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE shop_cart_items SET quantity = ?, updatedAt = ? WHERE id = ? AND userId = ?
    `).bind(quantity, new Date().toISOString(), itemId, user.userId).run();

    return c.json({ success: true, message: 'Cart updated', quantity });
  } catch (error) {
    console.error('Error updating cart:', error);
    return c.json({ error: 'Failed to update cart' }, 500);
  }
});

// Remove from cart
cartRoutes.delete('/:itemId', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const itemId = c.req.param('itemId');

  try {
    const result = await c.env.DB.prepare(`
      DELETE FROM shop_cart_items WHERE id = ? AND userId = ?
    `).bind(itemId, user.userId).run();

    if (!result.changes) {
      return c.json({ error: 'Cart item not found' }, 404);
    }

    return c.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return c.json({ error: 'Failed to remove from cart' }, 500);
  }
});

// Clear cart
cartRoutes.delete('/', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    await c.env.DB.prepare(`
      DELETE FROM shop_cart_items WHERE userId = ?
    `).bind(user.userId).run();

    return c.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return c.json({ error: 'Failed to clear cart' }, 500);
  }
});

// Get cart count (lightweight endpoint)
cartRoutes.get('/count', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ count: 0 });
  }

  try {
    const result = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as count
      FROM shop_cart_items
      WHERE userId = ?
    `).bind(user.userId).first();

    return c.json({ count: result?.count || 0 });
  } catch (error) {
    return c.json({ count: 0 });
  }
});

export { cartRoutes };
