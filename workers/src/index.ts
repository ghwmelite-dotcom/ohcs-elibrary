import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimit';

// Route imports
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { documentsRoutes } from './routes/documents';
import { forumRoutes } from './routes/forum';
import { chatRoutes } from './routes/chat';
import { groupsRoutes } from './routes/groups';
import { newsRoutes } from './routes/news';
import { notificationsRoutes } from './routes/notifications';
import { gamificationRoutes } from './routes/gamification';
import { adminRoutes } from './routes/admin';

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
  origin: ['https://ohcs-elibrary.gov.gh', 'http://localhost:5173'],
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

// Public routes
app.route('/api/v1/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/v1/*', authMiddleware);

app.route('/api/v1/users', usersRoutes);
app.route('/api/v1/documents', documentsRoutes);
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
