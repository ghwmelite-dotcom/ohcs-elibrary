-- Replace failing sources with working ones
DELETE FROM news_sources WHERE id IN ('src_ghheadlines', 'src_pulse');

INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
('src_ghanastar', 'Ghana Star', 'https://www.ghanastar.com', 'https://www.ghanastar.com/feed/', 'https://www.ghanastar.com/wp-content/uploads/logo.png', 'Ghana Star - entertainment and news from Ghana', 1, datetime('now'));

INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
('src_ghanamma', 'Ghanamma', 'https://www.ghanamma.com', 'https://www.ghanamma.com/feed/', 'https://www.ghanamma.com/wp-content/uploads/logo.png', 'Ghanamma - Ghana news and current affairs', 1, datetime('now'));
