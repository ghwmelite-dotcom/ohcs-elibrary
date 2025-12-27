-- News Sources (approved news outlets)
CREATE TABLE IF NOT EXISTS news_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logoUrl TEXT,
  description TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- News Articles
CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  url TEXT NOT NULL,
  imageUrl TEXT,
  sourceId TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT, -- JSON array stored as text
  publishedAt TEXT NOT NULL,
  relevanceScore INTEGER DEFAULT 0,
  isBreaking INTEGER DEFAULT 0,
  isFeatured INTEGER DEFAULT 0,
  viewCount INTEGER DEFAULT 0,
  fetchedAt TEXT DEFAULT (datetime('now')),
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sourceId) REFERENCES news_sources(id) ON DELETE CASCADE
);

-- News Bookmarks (user saved articles)
CREATE TABLE IF NOT EXISTS news_bookmarks (
  id TEXT PRIMARY KEY,
  articleId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (articleId) REFERENCES news_articles(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(articleId, userId)
);

-- News Categories (for organization)
CREATE TABLE IF NOT EXISTS news_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  sortOrder INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON news_articles(sourceId);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(publishedAt DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_breaking ON news_articles(isBreaking);
CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON news_articles(isFeatured);
CREATE INDEX IF NOT EXISTS idx_news_bookmarks_user ON news_bookmarks(userId);
CREATE INDEX IF NOT EXISTS idx_news_bookmarks_article ON news_bookmarks(articleId);

-- Seed initial news sources (Ghana news outlets)
INSERT OR IGNORE INTO news_sources (id, name, url, logoUrl, description, isActive) VALUES
  ('src_gna', 'Ghana News Agency', 'https://gna.org.gh', 'https://gna.org.gh/favicon.ico', 'Official news agency of Ghana', 1),
  ('src_graphic', 'Daily Graphic', 'https://graphic.com.gh', 'https://graphic.com.gh/favicon.ico', 'Ghana''s leading newspaper', 1),
  ('src_myjoy', 'MyJoyOnline', 'https://myjoyonline.com', 'https://myjoyonline.com/favicon.ico', 'News, entertainment and sports', 1),
  ('src_citinews', 'Citi Newsroom', 'https://citinewsroom.com', 'https://citinewsroom.com/favicon.ico', 'Independent news coverage', 1),
  ('src_ghanaweb', 'GhanaWeb', 'https://ghanaweb.com', 'https://ghanaweb.com/favicon.ico', 'Ghana''s homepage since 1999', 1),
  ('src_peacefm', 'Peace FM Online', 'https://peacefmonline.com', 'https://peacefmonline.com/favicon.ico', 'News and entertainment', 1);

-- Seed initial news categories
INSERT OR IGNORE INTO news_categories (id, name, slug, description, icon, color, sortOrder) VALUES
  ('cat_policy', 'Policy & Governance', 'policy', 'Government policies and governance news', 'Scale', '#059669', 1),
  ('cat_training', 'Training & Development', 'training', 'Professional development and training programs', 'GraduationCap', '#0284c7', 2),
  ('cat_technology', 'Digital Transformation', 'technology', 'Technology initiatives and digital services', 'Laptop', '#7c3aed', 3),
  ('cat_hr', 'HR & Administration', 'hr', 'Human resources and administrative updates', 'Users', '#db2777', 4),
  ('cat_announcements', 'Announcements', 'announcements', 'Official announcements and circulars', 'Megaphone', '#ea580c', 5),
  ('cat_events', 'Events & Programs', 'events', 'Upcoming events and program updates', 'Calendar', '#ca8a04', 6),
  ('cat_general', 'General News', 'general', 'General news and updates', 'Newspaper', '#64748b', 7);
