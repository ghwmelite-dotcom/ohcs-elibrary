import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const orderRoutes = new Hono();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const shippingAddressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  region: z.string().min(2),
  country: z.string().default('Ghana'),
  notes: z.string().optional(),
});

const checkoutSchema = z.object({
  paymentMethod: z.enum(['mobile_money', 'card', 'bank_transfer']),
  mobileMoneyProvider: z.enum(['MTN', 'Vodafone', 'AirtelTigo']).optional(),
  mobileMoneyNumber: z.string().optional(),
  shippingAddress: shippingAddressSchema.optional(),
  shippingMethod: z.enum(['standard', 'express', 'pickup']).optional(),
  customerNote: z.string().max(500).optional(),
  discountCode: z.string().optional(),
});

const verifyPaymentSchema = z.object({
  transactionId: z.string(),
  reference: z.string(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getUserFromToken(c: any): { userId: string; role: string } | null {
  const user = c.get('user');
  if (!user) return null;
  return { userId: user.sub, role: user.role };
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `OHCS-${timestamp}-${random}`;
}

// Platform commission rates
const COMMISSION_RATES = {
  digital: 0.10, // 10% for digital (seller keeps 90%)
  physical: 0.12, // 12% for physical (seller keeps 88%)
  verified: 0.08, // 8% for verified authors (seller keeps 92%)
};

// ============================================================================
// CHECKOUT ROUTES
// ============================================================================

// Get checkout summary (validates cart before checkout)
orderRoutes.get('/checkout/summary', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get cart items with full product details
    const cartItems = await c.env.DB.prepare(`
      SELECT
        ci.id as cartItemId,
        ci.quantity,
        p.id as productId,
        p.title,
        p.slug,
        p.coverImage,
        p.price,
        p.productType,
        p.stockQuantity,
        p.trackInventory,
        p.digitalFileUrl,
        p.sellerId,
        s.storeName,
        s.isVerified as sellerVerified,
        s.commissionRate as customCommissionRate
      FROM shop_cart_items ci
      JOIN shop_products p ON ci.productId = p.id
      JOIN seller_profiles s ON p.sellerId = s.id
      WHERE ci.userId = ? AND p.status = 'published'
    `).bind(user.userId).all();

    const items = cartItems.results || [];

    if (items.length === 0) {
      return c.json({ error: 'Cart is empty' }, 400);
    }

    // Validate stock and calculate totals
    const validatedItems = [];
    let subtotal = 0;
    let hasPhysicalProducts = false;
    const stockIssues = [];

    for (const item of items) {
      if (item.trackInventory && item.stockQuantity < item.quantity) {
        stockIssues.push({
          productId: item.productId,
          title: item.title,
          requested: item.quantity,
          available: item.stockQuantity,
        });
      }

      if (item.productType === 'physical') {
        hasPhysicalProducts = true;
      }

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        ...item,
        itemTotal,
      });
    }

    if (stockIssues.length > 0) {
      return c.json({
        error: 'Some items have insufficient stock',
        stockIssues,
      }, 400);
    }

    // Calculate shipping (for physical products)
    const shippingOptions = hasPhysicalProducts ? [
      { method: 'standard', label: 'Standard Delivery (3-5 days)', cost: 25.00 },
      { method: 'express', label: 'Express Delivery (1-2 days)', cost: 50.00 },
      { method: 'pickup', label: 'Pickup from Office', cost: 0 },
    ] : [];

    // Platform fee calculation
    const platformFee = validatedItems.reduce((fee: number, item: any) => {
      let rate = COMMISSION_RATES.digital;
      if (item.productType === 'physical') {
        rate = COMMISSION_RATES.physical;
      }
      if (item.sellerVerified) {
        rate = COMMISSION_RATES.verified;
      }
      if (item.customCommissionRate) {
        rate = item.customCommissionRate;
      }
      return fee + (item.price * item.quantity * rate);
    }, 0);

    return c.json({
      items: validatedItems,
      summary: {
        subtotal,
        platformFee,
        shippingCost: 0, // Will be set based on selected shipping method
        discount: 0,
        total: subtotal,
      },
      hasPhysicalProducts,
      shippingOptions,
      paymentMethods: [
        { id: 'mobile_money', label: 'Mobile Money', providers: ['MTN', 'Vodafone', 'AirtelTigo'] },
        { id: 'card', label: 'Debit/Credit Card' },
        { id: 'bank_transfer', label: 'Bank Transfer' },
      ],
    });
  } catch (error) {
    console.error('Error getting checkout summary:', error);
    return c.json({ error: 'Failed to get checkout summary' }, 500);
  }
});

// Apply discount code
orderRoutes.post('/checkout/discount', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { code } = await c.req.json();

    if (!code) {
      return c.json({ error: 'Discount code is required' }, 400);
    }

    const discount = await c.env.DB.prepare(`
      SELECT
        id, code, type, value, minPurchase, maxDiscount,
        usageLimit, usageCount, startDate, endDate, isActive
      FROM shop_discount_codes
      WHERE code = ? AND isActive = 1
    `).bind(code.toUpperCase()).first();

    if (!discount) {
      return c.json({ error: 'Invalid discount code' }, 400);
    }

    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) {
      return c.json({ error: 'Discount code is not yet active' }, 400);
    }
    if (discount.endDate && new Date(discount.endDate) < now) {
      return c.json({ error: 'Discount code has expired' }, 400);
    }
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return c.json({ error: 'Discount code usage limit reached' }, 400);
    }

    // Check if user already used this code
    const existingUsage = await c.env.DB.prepare(`
      SELECT id FROM shop_orders WHERE userId = ? AND discountCodeId = ?
    `).bind(user.userId, discount.id).first();

    if (existingUsage) {
      return c.json({ error: 'You have already used this discount code' }, 400);
    }

    return c.json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type, // 'percentage' or 'fixed'
        value: discount.value,
        minPurchase: discount.minPurchase,
        maxDiscount: discount.maxDiscount,
      },
    });
  } catch (error) {
    console.error('Error validating discount:', error);
    return c.json({ error: 'Failed to validate discount code' }, 500);
  }
});

// Create order (checkout)
orderRoutes.post('/checkout', zValidator('json', checkoutSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const checkoutData = c.req.valid('json');

  try {
    // Get cart items
    const cartItems = await c.env.DB.prepare(`
      SELECT
        ci.id as cartItemId,
        ci.quantity,
        p.id as productId,
        p.title,
        p.slug,
        p.coverImage,
        p.price,
        p.productType,
        p.stockQuantity,
        p.trackInventory,
        p.digitalFileUrl,
        p.sellerId,
        s.isVerified as sellerVerified,
        s.commissionRate as customCommissionRate
      FROM shop_cart_items ci
      JOIN shop_products p ON ci.productId = p.id
      JOIN seller_profiles s ON p.sellerId = s.id
      WHERE ci.userId = ? AND p.status = 'published'
    `).bind(user.userId).all();

    const items = cartItems.results || [];

    if (items.length === 0) {
      return c.json({ error: 'Cart is empty' }, 400);
    }

    // Validate stock
    for (const item of items) {
      if (item.trackInventory && item.stockQuantity < item.quantity) {
        return c.json({
          error: `Insufficient stock for "${item.title}"`,
          available: item.stockQuantity,
        }, 400);
      }
    }

    // Check for physical products requiring shipping
    const hasPhysicalProducts = items.some((item: any) => item.productType === 'physical');
    if (hasPhysicalProducts && !checkoutData.shippingAddress) {
      return c.json({ error: 'Shipping address is required for physical products' }, 400);
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      // Calculate commission
      let commissionRate = COMMISSION_RATES.digital;
      if (item.productType === 'physical') {
        commissionRate = COMMISSION_RATES.physical;
      }
      if (item.sellerVerified) {
        commissionRate = COMMISSION_RATES.verified;
      }
      if (item.customCommissionRate) {
        commissionRate = item.customCommissionRate;
      }

      const commissionAmount = itemTotal * commissionRate;
      const sellerAmount = itemTotal - commissionAmount;

      orderItems.push({
        productId: item.productId,
        sellerId: item.sellerId,
        title: item.title,
        coverImage: item.coverImage,
        unitPrice: item.price,
        quantity: item.quantity,
        subtotal: itemTotal,
        productType: item.productType,
        digitalFileUrl: item.digitalFileUrl,
        commissionRate,
        commissionAmount,
        sellerAmount,
      });
    }

    // Calculate shipping
    let shippingCost = 0;
    if (hasPhysicalProducts && checkoutData.shippingMethod) {
      switch (checkoutData.shippingMethod) {
        case 'express':
          shippingCost = 50.00;
          break;
        case 'standard':
          shippingCost = 25.00;
          break;
        case 'pickup':
          shippingCost = 0;
          break;
      }
    }

    // Apply discount
    let discount = 0;
    let discountCodeId = null;
    if (checkoutData.discountCode) {
      const discountResult = await c.env.DB.prepare(`
        SELECT id, type, value, minPurchase, maxDiscount
        FROM shop_discount_codes
        WHERE code = ? AND isActive = 1
      `).bind(checkoutData.discountCode.toUpperCase()).first();

      if (discountResult) {
        if (!discountResult.minPurchase || subtotal >= discountResult.minPurchase) {
          if (discountResult.type === 'percentage') {
            discount = subtotal * (discountResult.value / 100);
          } else {
            discount = discountResult.value;
          }
          if (discountResult.maxDiscount && discount > discountResult.maxDiscount) {
            discount = discountResult.maxDiscount;
          }
          discountCodeId = discountResult.id;
        }
      }
    }

    // Calculate platform fee
    const platformFee = orderItems.reduce((fee, item) => fee + item.commissionAmount, 0);

    // Calculate total
    const total = subtotal + shippingCost - discount;

    // Create order
    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO shop_orders (
        id, orderNumber, userId, subtotal, shippingCost, tax, discount,
        platformFee, total, currency, discountCodeId, discountCodeUsed,
        hasPhysicalProducts, shippingMethod, shippingAddress,
        status, paymentStatus, fulfillmentStatus,
        customerNote, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      orderNumber,
      user.userId,
      subtotal,
      shippingCost,
      0, // tax
      discount,
      platformFee,
      total,
      'GHS',
      discountCodeId,
      checkoutData.discountCode || null,
      hasPhysicalProducts ? 1 : 0,
      checkoutData.shippingMethod || null,
      checkoutData.shippingAddress ? JSON.stringify(checkoutData.shippingAddress) : null,
      'pending',
      'pending',
      'unfulfilled',
      checkoutData.customerNote || null,
      now,
      now
    ).run();

    // Create order items
    for (const item of orderItems) {
      const orderItemId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO shop_order_items (
          id, orderId, productId, variantId, sellerId,
          title, sku, coverImage, unitPrice, quantity, subtotal,
          commissionRate, commissionAmount, sellerAmount,
          productType, digitalFileUrl, downloadCount, downloadLimit,
          fulfillmentStatus, payoutStatus, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderItemId,
        orderId,
        item.productId,
        null, // variantId
        item.sellerId,
        item.title,
        null, // sku
        item.coverImage,
        item.unitPrice,
        item.quantity,
        item.subtotal,
        item.commissionRate,
        item.commissionAmount,
        item.sellerAmount,
        item.productType,
        item.productType === 'digital' ? item.digitalFileUrl : null,
        0, // downloadCount
        item.productType === 'digital' ? 5 : 0, // downloadLimit
        item.productType === 'digital' ? 'fulfilled' : 'unfulfilled',
        'pending',
        now
      ).run();

      // Update product stock
      if (items.find((i: any) => i.productId === item.productId)?.trackInventory) {
        await c.env.DB.prepare(`
          UPDATE shop_products SET stockQuantity = stockQuantity - ? WHERE id = ?
        `).bind(item.quantity, item.productId).run();
      }

      // Update product sales count
      await c.env.DB.prepare(`
        UPDATE shop_products SET salesCount = salesCount + ? WHERE id = ?
      `).bind(item.quantity, item.productId).run();
    }

    // Update discount code usage
    if (discountCodeId) {
      await c.env.DB.prepare(`
        UPDATE shop_discount_codes SET usageCount = usageCount + 1 WHERE id = ?
      `).bind(discountCodeId).run();
    }

    // Create payment record
    const paymentId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO shop_payments (
        id, orderId, userId, amount, currency, paymentMethod,
        mobileMoneyProvider, mobileMoneyNumber,
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      paymentId,
      orderId,
      user.userId,
      total,
      'GHS',
      checkoutData.paymentMethod,
      checkoutData.mobileMoneyProvider || null,
      checkoutData.mobileMoneyNumber || null,
      'pending',
      now,
      now
    ).run();

    // Clear cart
    await c.env.DB.prepare(`
      DELETE FROM shop_cart_items WHERE userId = ?
    `).bind(user.userId).run();

    // For Mobile Money, generate payment instructions
    let paymentInstructions = null;
    if (checkoutData.paymentMethod === 'mobile_money') {
      paymentInstructions = {
        provider: checkoutData.mobileMoneyProvider,
        merchantCode: '*714*123#', // Placeholder - would be real merchant code
        reference: orderNumber,
        amount: total,
        instructions: [
          `Dial *${checkoutData.mobileMoneyProvider === 'MTN' ? '170' : checkoutData.mobileMoneyProvider === 'Vodafone' ? '110' : '500'}#`,
          'Select "Pay Bill" or "MerchantPay"',
          `Enter merchant code: OHCS123`,
          `Enter reference: ${orderNumber}`,
          `Enter amount: GHS ${total.toFixed(2)}`,
          'Enter your PIN to confirm',
        ],
      };
    }

    return c.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        total,
        status: 'pending',
        paymentStatus: 'pending',
      },
      paymentId,
      paymentInstructions,
    }, 201);
  } catch (error) {
    console.error('Error creating order:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Verify payment (webhook or manual verification)
orderRoutes.post('/checkout/verify', zValidator('json', verifyPaymentSchema), async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { transactionId, reference } = c.req.valid('json');

  try {
    // Find the order
    const order = await c.env.DB.prepare(`
      SELECT id, orderNumber, total, paymentStatus, userId
      FROM shop_orders
      WHERE orderNumber = ? AND userId = ?
    `).bind(reference, user.userId).first();

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    if (order.paymentStatus === 'paid') {
      return c.json({ error: 'Order already paid' }, 400);
    }

    // In production, this would verify with the payment provider's API
    // For now, we'll simulate a successful payment verification
    const now = new Date().toISOString();

    // Update payment
    await c.env.DB.prepare(`
      UPDATE shop_payments
      SET status = 'completed', transactionId = ?, paidAt = ?, updatedAt = ?
      WHERE orderId = ?
    `).bind(transactionId, now, now, order.id).run();

    // Update order
    await c.env.DB.prepare(`
      UPDATE shop_orders
      SET status = 'confirmed', paymentStatus = 'paid', paidAt = ?, confirmedAt = ?, updatedAt = ?
      WHERE id = ?
    `).bind(now, now, now, order.id).run();

    return c.json({
      success: true,
      message: 'Payment verified successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: 'confirmed',
        paymentStatus: 'paid',
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return c.json({ error: 'Failed to verify payment' }, 500);
  }
});

// ============================================================================
// ORDER ROUTES (Customer)
// ============================================================================

// Get user's orders
orderRoutes.get('/', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const query = c.req.query();
  const page = parseInt(query.page || '1');
  const limit = Math.min(parseInt(query.limit || '10'), 50);
  const offset = (page - 1) * limit;

  try {
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM shop_orders WHERE userId = ?
    `).bind(user.userId).first();

    const orders = await c.env.DB.prepare(`
      SELECT
        o.id, o.orderNumber, o.subtotal, o.shippingCost, o.discount,
        o.total, o.currency, o.status, o.paymentStatus, o.fulfillmentStatus,
        o.hasPhysicalProducts, o.createdAt,
        (SELECT COUNT(*) FROM shop_order_items WHERE orderId = o.id) as itemCount
      FROM shop_orders o
      WHERE o.userId = ?
      ORDER BY o.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(user.userId, limit, offset).all();

    return c.json({
      orders: orders.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Get single order
orderRoutes.get('/:orderNumber', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const orderNumber = c.req.param('orderNumber');

  try {
    const order = await c.env.DB.prepare(`
      SELECT * FROM shop_orders WHERE orderNumber = ? AND userId = ?
    `).bind(orderNumber, user.userId).first();

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Parse shipping address
    if (order.shippingAddress) {
      try {
        order.shippingAddress = JSON.parse(order.shippingAddress as string);
      } catch {
        order.shippingAddress = null;
      }
    }

    // Get order items
    const items = await c.env.DB.prepare(`
      SELECT
        oi.*,
        s.storeName,
        s.storeSlug
      FROM shop_order_items oi
      JOIN seller_profiles s ON oi.sellerId = s.id
      WHERE oi.orderId = ?
    `).bind(order.id).all();

    // Get payment info
    const payment = await c.env.DB.prepare(`
      SELECT * FROM shop_payments WHERE orderId = ? ORDER BY createdAt DESC LIMIT 1
    `).bind(order.id).first();

    return c.json({
      order,
      items: items.results || [],
      payment,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// Download digital product
orderRoutes.get('/:orderNumber/download/:itemId', async (c) => {
  const user = getUserFromToken(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const orderNumber = c.req.param('orderNumber');
  const itemId = c.req.param('itemId');

  try {
    // Verify order belongs to user and is paid
    const order = await c.env.DB.prepare(`
      SELECT id, paymentStatus FROM shop_orders
      WHERE orderNumber = ? AND userId = ?
    `).bind(orderNumber, user.userId).first();

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    if (order.paymentStatus !== 'paid') {
      return c.json({ error: 'Payment required before download' }, 402);
    }

    // Get order item
    const item = await c.env.DB.prepare(`
      SELECT id, digitalFileUrl, downloadCount, downloadLimit, productType
      FROM shop_order_items
      WHERE id = ? AND orderId = ?
    `).bind(itemId, order.id).first();

    if (!item) {
      return c.json({ error: 'Item not found' }, 404);
    }

    if (item.productType !== 'digital') {
      return c.json({ error: 'This is not a digital product' }, 400);
    }

    if (item.downloadLimit > 0 && item.downloadCount >= item.downloadLimit) {
      return c.json({ error: 'Download limit reached' }, 403);
    }

    // Increment download count
    await c.env.DB.prepare(`
      UPDATE shop_order_items
      SET downloadCount = downloadCount + 1, lastDownloadAt = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), itemId).run();

    return c.json({
      downloadUrl: item.digitalFileUrl,
      downloadsRemaining: item.downloadLimit > 0 ? item.downloadLimit - item.downloadCount - 1 : 'unlimited',
    });
  } catch (error) {
    console.error('Error getting download:', error);
    return c.json({ error: 'Failed to get download' }, 500);
  }
});

export { orderRoutes };
