-- Add more reliable Ghana news sources with working RSS feeds

-- First, update existing sources with better RSS URLs
UPDATE news_sources SET rssUrl = 'https://www.myjoyonline.com/feed/' WHERE id = 'src_myjoyonline' OR name LIKE '%Joy%';

-- Insert new reliable sources
INSERT OR IGNORE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive) VALUES
  -- Major news outlets with reliable RSS
  ('src_myjoy', 'MyJoyOnline', 'https://www.myjoyonline.com', 'https://www.myjoyonline.com/feed/', 'https://www.myjoyonline.com/favicon.ico', 'Ghana''s most trusted news source', 1),
  ('src_3news', '3News', 'https://3news.com', 'https://3news.com/feed/', 'https://3news.com/favicon.ico', 'TV3 Ghana news portal', 1),
  ('src_starrfm', 'Starrfm Online', 'https://starrfm.com.gh', 'https://starrfm.com.gh/feed/', 'https://starrfm.com.gh/favicon.ico', 'Starr FM news and updates', 1),
  ('src_ghanabusinessnews', 'Ghana Business News', 'https://www.ghanabusinessnews.com', 'https://www.ghanabusinessnews.com/feed/', 'https://www.ghanabusinessnews.com/favicon.ico', 'Business news from Ghana', 1),
  ('src_businessghana', 'Business Ghana', 'https://www.businessghana.com', 'https://www.businessghana.com/site/news/rss', 'https://www.businessghana.com/favicon.ico', 'Ghana business and economy news', 1),
  ('src_dailyguide', 'Daily Guide Africa', 'https://dailyguidenetwork.com', 'https://dailyguidenetwork.com/feed/', 'https://dailyguidenetwork.com/favicon.ico', 'Daily Guide Network Ghana', 1),
  ('src_chronicle', 'Ghanaian Chronicle', 'https://thechronicle.com.gh', 'https://thechronicle.com.gh/feed/', 'https://thechronicle.com.gh/favicon.ico', 'The Ghanaian Chronicle', 1),
  ('src_gna2', 'GNA Online', 'https://newsghana.com.gh', 'https://newsghana.com.gh/feed/', 'https://newsghana.com.gh/favicon.ico', 'Ghana News Agency online', 1),
  ('src_aborigenradio', 'Adom Online', 'https://www.adomonline.com', 'https://www.adomonline.com/feed/', 'https://www.adomonline.com/favicon.ico', 'Adom FM online news', 1),
  ('src_ghanaiantimes', 'Ghanaian Times', 'https://www.ghanaiantimes.com.gh', 'https://www.ghanaiantimes.com.gh/feed/', 'https://www.ghanaiantimes.com.gh/favicon.ico', 'State-owned newspaper', 1),
  ('src_peacefmonline', 'Peace FM Online', 'https://www.peacefmonline.com', 'https://www.peacefmonline.com/pages/rss/', 'https://www.peacefmonline.com/favicon.ico', 'Peace FM news portal', 1);

-- Deactivate sources that consistently fail
UPDATE news_sources SET isActive = 0 WHERE fetchError IS NOT NULL AND fetchError != '';

-- Reset fetch errors for a fresh start
UPDATE news_sources SET fetchError = NULL;
