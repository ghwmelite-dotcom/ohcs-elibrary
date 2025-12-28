import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimit';
import { aggregateNews, getAggregationStatus, generateArticleSummaries } from './services/newsAggregator';

// Route imports
import {
  authRoutes,
  usersRoutes,
  documentsRoutes,
  bookmarksRoutes,
  forumRoutes,
  chatRoutes,
  groupsRoutes,
  newsRoutes,
  notificationsRoutes,
  gamificationRoutes,
  settingsRoutes,
  adminRoutes,
} from './routes';

export interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  RESEND_API_KEY?: string;
  // Gmail API credentials
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  GMAIL_REFRESH_TOKEN?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: (origin) => {
    // If no origin, allow (for direct API access)
    if (!origin) return '*';

    const allowedOrigins = [
      'https://ohcs-elibrary.gov.gh',
      'https://ohcs-elibrary.pages.dev',
      'https://ohcselibrary.xyz',
      'https://www.ohcselibrary.xyz',
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    // Allow exact matches
    if (allowedOrigins.includes(origin)) return origin;
    // Allow any Cloudflare Pages deployment (main or preview)
    if (origin.match(/^https:\/\/[a-z0-9-]+\.ohcs-elibrary\.pages\.dev$/)) return origin;
    // Allow the origin anyway for document viewing (PDFs need this)
    return origin;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use('*', rateLimiter);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

// News aggregation trigger (secret-protected, for testing)
app.get('/cron/aggregate-news', async (c) => {
  const secret = c.req.query('secret');
  if (secret !== 'ohcs-news-2024') {
    return c.json({ error: 'Invalid secret' }, 401);
  }

  try {
    console.log('Secret-based news aggregation triggered');
    const result = await aggregateNews(c.env);
    return c.json({
      message: 'News aggregation completed',
      ...result,
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    return c.json({ error: 'Aggregation failed', details: String(error) }, 500);
  }
});

// API version
app.get('/api/v1', (c) => {
  return c.json({
    version: '1.0.0',
    name: 'OHCS E-Library API',
    documentation: 'https://api.ohcs-elibrary.gov.gh/docs',
  });
});

// Public routes (no authentication required)
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/documents', documentsRoutes);

// Protected routes (require authentication)
// Apply auth middleware only to specific protected route paths
app.use('/api/v1/users/*', authMiddleware);
app.use('/api/v1/bookmarks/*', authMiddleware);
// Forum, Gamification, Chat, and Groups handle their own auth (some endpoints are public)
// News routes handle their own auth - some are public (categories, sources, articles list)
app.use('/api/v1/notifications/*', authMiddleware);
app.use('/api/v1/settings/*', authMiddleware);
app.use('/api/v1/admin/*', authMiddleware);

app.route('/api/v1/users', usersRoutes);
app.route('/api/v1/bookmarks', bookmarksRoutes);
app.route('/api/v1/forum', forumRoutes);
app.route('/api/v1/chat', chatRoutes);
app.route('/api/v1/groups', groupsRoutes);
app.route('/api/v1/news', newsRoutes);
app.route('/api/v1/notifications', notificationsRoutes);
app.route('/api/v1/settings', settingsRoutes);
app.route('/api/v1/gamification', gamificationRoutes);
app.route('/api/v1/admin', adminRoutes);

// News aggregation admin endpoints
app.post('/api/v1/admin/news/aggregate', authMiddleware, async (c) => {
  try {
    console.log('Manual news aggregation triggered');
    const result = await aggregateNews(c.env);
    return c.json({
      message: 'News aggregation completed',
      ...result,
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    return c.json({ error: 'Aggregation failed' }, 500);
  }
});

app.get('/api/v1/admin/news/status', authMiddleware, async (c) => {
  try {
    const status = await getAggregationStatus(c.env);
    return c.json(status);
  } catch (error) {
    console.error('Status error:', error);
    return c.json({ error: 'Failed to get status' }, 500);
  }
});

// AI summary generation endpoint
app.post('/api/v1/admin/news/generate-summaries', authMiddleware, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const limit = body.limit || 10;

    console.log(`Generating AI summaries for up to ${limit} articles...`);
    const result = await generateArticleSummaries(c.env, limit);

    return c.json({
      message: 'AI summary generation completed',
      ...result,
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    return c.json({ error: 'Summary generation failed' }, 500);
  }
});

// Secret-protected summary generation (for testing)
app.get('/cron/generate-summaries', async (c) => {
  const secret = c.req.query('secret');
  if (secret !== 'ohcs-news-2024') {
    return c.json({ error: 'Invalid secret' }, 401);
  }

  try {
    console.log('Secret-based summary generation triggered');
    const result = await generateArticleSummaries(c.env, 10);
    return c.json({
      message: 'AI summary generation completed',
      ...result,
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    return c.json({ error: 'Summary generation failed', details: String(error) }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: c.req.path,
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : 'An unexpected error occurred',
  }, 500);
});

// Export worker with both fetch and scheduled handlers
export default {
  // HTTP request handler
  fetch: app.fetch,

  // Scheduled handler for cron triggers
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log(`Cron triggered at ${new Date().toISOString()}`);

    ctx.waitUntil(
      (async () => {
        try {
          // Aggregate news first
          const result = await aggregateNews(env);
          console.log('Scheduled aggregation completed:', result);

          // Then generate AI summaries for recent articles
          if (result.articlesAdded > 0) {
            const summaryResult = await generateArticleSummaries(env, 5);
            console.log('AI summary generation completed:', summaryResult);
          }
        } catch (error) {
          console.error('Scheduled aggregation failed:', error);
        }
      })()
    );
  },
};
