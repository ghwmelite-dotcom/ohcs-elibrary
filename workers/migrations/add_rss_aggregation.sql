-- Add RSS aggregation fields to news_sources
ALTER TABLE news_sources ADD COLUMN rssUrl TEXT;
ALTER TABLE news_sources ADD COLUMN lastFetchedAt TEXT;
ALTER TABLE news_sources ADD COLUMN fetchInterval INTEGER DEFAULT 3600; -- seconds between fetches
ALTER TABLE news_sources ADD COLUMN fetchError TEXT; -- last error message if any

-- Add external ID field to articles for deduplication
ALTER TABLE news_articles ADD COLUMN externalId TEXT; -- hash of URL for dedup
ALTER TABLE news_articles ADD COLUMN rawContent TEXT; -- original RSS content

-- Create index for deduplication
CREATE INDEX IF NOT EXISTS idx_news_articles_external ON news_articles(externalId);
CREATE INDEX IF NOT EXISTS idx_news_articles_url ON news_articles(url);

-- Update sources with RSS feed URLs
UPDATE news_sources SET rssUrl = 'https://gna.org.gh/feed/' WHERE id = 'src_gna';
UPDATE news_sources SET rssUrl = 'https://www.graphic.com.gh/feed' WHERE id = 'src_graphic';
UPDATE news_sources SET rssUrl = 'https://www.myjoyonline.com/feed/' WHERE id = 'src_myjoy';
UPDATE news_sources SET rssUrl = 'https://citinewsroom.com/feed/' WHERE id = 'src_citinews';
UPDATE news_sources SET rssUrl = 'https://www.ghanaweb.com/GhanaHomePage/NewsArchive/rss.xml' WHERE id = 'src_ghanaweb';
UPDATE news_sources SET rssUrl = 'https://www.peacefmonline.com/pages/rss' WHERE id = 'src_peacefm';

-- Clear demo articles (we'll fetch real ones)
DELETE FROM news_articles WHERE id LIKE 'art_%';

-- Add more Ghana news sources with RSS feeds
INSERT OR IGNORE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive) VALUES
  ('src_3news', '3News Ghana', 'https://3news.com', 'https://3news.com/feed/', 'https://3news.com/favicon.ico', 'TV3 Ghana news portal', 1),
  ('src_modernghana', 'Modern Ghana', 'https://www.modernghana.com', 'https://www.modernghana.com/rss/news.xml', 'https://www.modernghana.com/favicon.ico', 'News and information portal', 1),
  ('src_starrfm', 'Starr FM', 'https://starrfm.com.gh', 'https://starrfm.com.gh/feed/', 'https://starrfm.com.gh/favicon.ico', 'Starr 103.5 FM news', 1),
  ('src_pulse', 'Pulse Ghana', 'https://www.pulse.com.gh', 'https://www.pulse.com.gh/rss', 'https://www.pulse.com.gh/favicon.ico', 'News, entertainment and lifestyle', 1);
