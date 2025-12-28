-- Update news sources with working RSS feeds
-- Remove non-working sources and add working ones

-- Delete non-working sources
DELETE FROM news_sources WHERE id IN (
  'src_ghanaweb',
  'src_graphic',
  'src_citinewsroom',
  'src_peacefmonline',
  'src_gna',
  'src_modernghana',
  'src_ghanaguardian',
  'src_businessghana',
  'src_classfm'
);

-- Add new working sources
INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
(
  'src_bft',
  'Business & Financial Times',
  'https://thebftonline.com',
  'https://thebftonline.com/feed/',
  'https://thebftonline.com/wp-content/uploads/2020/01/bft-logo.png',
  'Ghana premier business and financial news publication',
  1,
  datetime('now')
);

INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
(
  'src_dailyguide',
  'Daily Guide Network',
  'https://dailyguidenetwork.com',
  'https://dailyguidenetwork.com/feed/',
  'https://dailyguidenetwork.com/wp-content/uploads/2020/01/daily-guide-logo.png',
  'Daily Guide newspaper - comprehensive Ghana news coverage',
  1,
  datetime('now')
);

INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
(
  'src_ghanabusiness',
  'Ghana Business News',
  'https://www.ghanabusinessnews.com',
  'https://www.ghanabusinessnews.com/feed/',
  'https://www.ghanabusinessnews.com/wp-content/uploads/2020/logo.png',
  'Business and economic news for Ghana professionals',
  1,
  datetime('now')
);

INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
(
  'src_adomonline',
  'Adom Online',
  'https://www.adomonline.com',
  'https://www.adomonline.com/feed/',
  'https://www.adomonline.com/wp-content/uploads/2020/adom-logo.png',
  'Adom FM online platform - popular Ghanaian news and entertainment',
  1,
  datetime('now')
);

INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
(
  'src_ghanaiantimes',
  'Ghanaian Times',
  'https://www.ghanaiantimes.com.gh',
  'https://www.ghanaiantimes.com.gh/feed/',
  'https://www.ghanaiantimes.com.gh/wp-content/uploads/logo.png',
  'The Ghanaian Times - established national newspaper',
  1,
  datetime('now')
);

INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
(
  'src_newsghana',
  'News Ghana',
  'https://newsghana.com.gh',
  'https://newsghana.com.gh/feed/',
  'https://newsghana.com.gh/wp-content/uploads/logo.png',
  'News Ghana - comprehensive Ghana news and current affairs',
  1,
  datetime('now')
);

INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
(
  'src_ghheadlines',
  'GH Headlines',
  'https://www.ghheadlines.com',
  'https://www.ghheadlines.com/feed/',
  'https://www.ghheadlines.com/wp-content/uploads/logo.png',
  'Ghana Headlines - aggregated top news from Ghana',
  1,
  datetime('now')
);

INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
(
  'src_ghanacelebs',
  'Ghana Celebrities',
  'https://www.ghanacelebrities.com',
  'https://www.ghanacelebrities.com/feed/',
  'https://www.ghanacelebrities.com/wp-content/uploads/logo.png',
  'Entertainment and celebrity news from Ghana',
  1,
  datetime('now')
);

INSERT OR REPLACE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt) VALUES
(
  'src_pulse',
  'Pulse Ghana',
  'https://www.pulse.com.gh',
  'https://www.pulse.com.gh/feed/',
  'https://www.pulse.com.gh/wp-content/uploads/logo.png',
  'Pulse Ghana - news, entertainment, lifestyle and sports',
  1,
  datetime('now')
);
