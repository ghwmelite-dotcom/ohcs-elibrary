-- Fix RSS URLs for sources that failed

-- Ghana News Agency - try different feed URL
UPDATE news_sources SET rssUrl = 'https://newsghana.com.gh/feed/' WHERE id = 'src_gna';

-- Daily Graphic - try alternate feed
UPDATE news_sources SET rssUrl = 'https://www.graphic.com.gh/feed/' WHERE id = 'src_graphic';

-- GhanaWeb - use news feed
UPDATE news_sources SET rssUrl = 'https://www.ghanaweb.com/GhanaHomePage/NewsArchive/rss.php' WHERE id = 'src_ghanaweb';

-- Peace FM - try alternate
UPDATE news_sources SET rssUrl = 'https://www.peacefmonline.com/pages/rss/' WHERE id = 'src_peacefm';

-- Citi Newsroom - try without trailing slash
UPDATE news_sources SET rssUrl = 'https://citinewsroom.com/feed' WHERE id = 'src_citinews';

-- Modern Ghana - try news RSS
UPDATE news_sources SET rssUrl = 'https://www.modernghana.com/rss/news' WHERE id = 'src_modernghana';

-- Pulse Ghana - use different feed
UPDATE news_sources SET rssUrl = 'https://www.pulse.com.gh/news/rss' WHERE id = 'src_pulse';

-- Add more reliable sources
INSERT OR IGNORE INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive) VALUES
  ('src_aborigen', 'Adomonline', 'https://www.adomonline.com', 'https://www.adomonline.com/feed/', 'https://www.adomonline.com/favicon.ico', 'Adom FM online news', 1),
  ('src_classfm', 'Class FM', 'https://www.classfmonline.com', 'https://www.classfmonline.com/feed/', 'https://www.classfmonline.com/favicon.ico', 'Class 91.3 FM news', 1);
