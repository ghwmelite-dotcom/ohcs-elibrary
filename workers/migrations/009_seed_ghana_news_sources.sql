-- Seed Ghana News Sources for OHCS E-Library
-- These sources provide relevant news for civil servants

-- Clear existing sources if any
DELETE FROM news_sources WHERE 1=1;

-- Insert Ghana News Sources with RSS feeds
INSERT INTO news_sources (id, name, url, rssUrl, logoUrl, description, isActive, createdAt)
VALUES
  -- Major News Portals
  (
    'src_ghanaweb',
    'GhanaWeb',
    'https://www.ghanaweb.com',
    'https://www.ghanaweb.com/GhanaHomePage/NewsArchive/rss.xml',
    'https://www.ghanaweb.com/img/ghana/ghanaweb_logo.png',
    'Ghana''s largest online news portal covering politics, business, sports, and entertainment',
    1,
    datetime('now')
  ),
  (
    'src_myjoyonline',
    'MyJoyOnline',
    'https://www.myjoyonline.com',
    'https://www.myjoyonline.com/feed/',
    'https://www.myjoyonline.com/wp-content/uploads/2021/01/myjoyonline-logo.png',
    'Joy FM''s online news platform - Ghana''s leading multimedia company',
    1,
    datetime('now')
  ),
  (
    'src_graphic',
    'Graphic Online',
    'https://www.graphic.com.gh',
    'https://www.graphic.com.gh/feed',
    'https://www.graphic.com.gh/images/logo.png',
    'Daily Graphic - Ghana''s most authoritative newspaper since 1950',
    1,
    datetime('now')
  ),
  (
    'src_citinewsroom',
    'Citi Newsroom',
    'https://citinewsroom.com',
    'https://citinewsroom.com/feed/',
    'https://citinewsroom.com/wp-content/uploads/2020/01/citi-newsroom-logo.png',
    'Citi FM''s online news platform for breaking news and analysis',
    1,
    datetime('now')
  ),
  (
    'src_3news',
    '3News Ghana',
    'https://3news.com',
    'https://3news.com/feed/',
    'https://3news.com/wp-content/uploads/2020/01/3news-logo.png',
    'TV3 Ghana''s news portal covering national and international news',
    1,
    datetime('now')
  ),
  (
    'src_peacefmonline',
    'Peace FM Online',
    'https://www.peacefmonline.com',
    'https://www.peacefmonline.com/rss/rss.xml',
    'https://www.peacefmonline.com/images/peace-fm-logo.png',
    'Peace FM''s comprehensive news coverage across Ghana',
    1,
    datetime('now')
  ),
  (
    'src_gna',
    'Ghana News Agency',
    'https://gna.org.gh',
    'https://gna.org.gh/feed/',
    'https://gna.org.gh/wp-content/uploads/2020/01/gna-logo.png',
    'Official national news agency of Ghana - authoritative government news',
    1,
    datetime('now')
  ),
  (
    'src_modernghana',
    'Modern Ghana',
    'https://www.modernghana.com',
    'https://www.modernghana.com/rss/news.xml',
    'https://www.modernghana.com/images/logo.png',
    'Independent news platform covering Ghana and African affairs',
    1,
    datetime('now')
  ),
  (
    'src_starrfm',
    'Starr FM Online',
    'https://starrfm.com.gh',
    'https://starrfm.com.gh/feed/',
    'https://starrfm.com.gh/wp-content/uploads/2020/01/starr-fm-logo.png',
    'Starr FM Ghana - breaking news and current affairs',
    1,
    datetime('now')
  ),
  (
    'src_ghanaguardian',
    'Ghana Guardian',
    'https://ghanaguardian.com',
    'https://ghanaguardian.com/feed/',
    'https://ghanaguardian.com/wp-content/uploads/2020/01/ghana-guardian-logo.png',
    'Ghana Guardian news portal for politics and current affairs',
    1,
    datetime('now')
  ),
  (
    'src_businessghana',
    'Business Ghana',
    'https://www.businessghana.com',
    'https://www.businessghana.com/site/rss',
    'https://www.businessghana.com/images/logo.png',
    'Business and economic news for professionals in Ghana',
    1,
    datetime('now')
  ),
  (
    'src_classfm',
    'Class FM Online',
    'https://www.classfmonline.com',
    'https://www.classfmonline.com/feed/',
    'https://www.classfmonline.com/wp-content/uploads/2020/01/class-fm-logo.png',
    'Class FM Ghana - news, entertainment, and current affairs',
    1,
    datetime('now')
  );

-- Add index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_news_sources_isActive ON news_sources(isActive);
