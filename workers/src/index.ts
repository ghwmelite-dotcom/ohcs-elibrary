import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimit';

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
  adminRoutes,
} from './routes';

export interface Env {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  CACHE: KVNamespace;
  AI: any;
  JWT_SECRET: string;
  ENVIRONMENT: string;
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
// Forum, Gamification, and Chat handle their own auth (some endpoints are public)
app.use('/api/v1/groups/*', authMiddleware);
app.use('/api/v1/news/*', authMiddleware);
app.use('/api/v1/notifications/*', authMiddleware);
app.use('/api/v1/admin/*', authMiddleware);

app.route('/api/v1/users', usersRoutes);
app.route('/api/v1/bookmarks', bookmarksRoutes);
app.route('/api/v1/forum', forumRoutes);
app.route('/api/v1/chat', chatRoutes);
app.route('/api/v1/groups', groupsRoutes);
app.route('/api/v1/news', newsRoutes);
app.route('/api/v1/notifications', notificationsRoutes);
app.route('/api/v1/gamification', gamificationRoutes);
app.route('/api/v1/admin', adminRoutes);

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

export default app;
