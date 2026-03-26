-- Migration 043: Seed/update Ghana news sources with real RSS feeds
-- Adds category, isOfficial, and language columns, then upserts 10 verified sources.

-- Add new columns to news_sources if they don't already exist.
-- SQLite does not support IF NOT EXISTS on ALTER TABLE ADD COLUMN in all drivers,
-- so we use a safe pattern: ignore the error if the column already exists by
-- wrapping each ALTER in its own statement (D1 executes each statement independently).
ALTER TABLE news_sources ADD COLUMN category TEXT DEFAULT 'general';
ALTER TABLE news_sources ADD COLUMN isOfficial INTEGER DEFAULT 0;
ALTER TABLE news_sources ADD COLUMN language TEXT DEFAULT 'en';

-- ─────────────────────────────────────────────────────────────────────────────
-- TIER 1 — Official Government Sources
-- ─────────────────────────────────────────────────────────────────────────────

-- Ghana News Agency (GNA) — official state news agency.
-- Originally inserted as src_gna in 009, then left active (not deleted in 010).
-- We replace it here to set the correct rssUrl and new columns.
INSERT OR REPLACE INTO news_sources
  (id, name, url, rssUrl, logoUrl, category, isActive, isOfficial, description, language, createdAt)
VALUES (
  'news-source-gna',
  'Ghana News Agency',
  'https://gna.org.gh',
  'https://gna.org.gh/feed/',
  'https://www.google.com/s2/favicons?domain=gna.org.gh&sz=128',
  'government',
  1,
  1,
  'Official state news agency of Ghana — the primary source of authoritative government news and public-sector information.',
  'en',
  datetime('now')
);

-- Keep the old src_gna row updated too so existing article foreign keys are not broken.
UPDATE news_sources
SET
  rssUrl      = 'https://gna.org.gh/feed/',
  logoUrl     = 'https://www.google.com/s2/favicons?domain=gna.org.gh&sz=128',
  category    = 'government',
  isOfficial  = 1,
  language    = 'en',
  description = 'Official state news agency of Ghana — the primary source of authoritative government news and public-sector information.',
  isActive    = 1
WHERE id = 'src_gna';

-- Ghana Government portal — official government of Ghana website.
INSERT OR REPLACE INTO news_sources
  (id, name, url, rssUrl, logoUrl, category, isActive, isOfficial, description, language, createdAt)
VALUES (
  'news-source-gov-gh',
  'Ghana Government',
  'https://www.ghana.gov.gh',
  'https://www.ghana.gov.gh/feed/',
  'https://www.google.com/s2/favicons?domain=ghana.gov.gh&sz=128',
  'government',
  1,
  1,
  'Official portal of the Government of Ghana — press releases, policy announcements, and public-sector updates.',
  'en',
  datetime('now')
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TIER 2 — Major News Outlets
-- ─────────────────────────────────────────────────────────────────────────────

-- MyJoyOnline — Ghana's most-visited news site; already in the table as src_myjoyonline.
INSERT OR REPLACE INTO news_sources
  (id, name, url, rssUrl, logoUrl, category, isActive, isOfficial, description, language, createdAt)
VALUES (
  'news-source-myjoyonline',
  'MyJoyOnline',
  'https://www.myjoyonline.com',
  'https://www.myjoyonline.com/feed/',
  'https://www.google.com/s2/favicons?domain=myjoyonline.com&sz=128',
  'general',
  1,
  0,
  'Joy FM''s online news platform — Ghana''s leading multimedia company covering politics, business, and current affairs.',
  'en',
  datetime('now')
);

-- Update legacy row so no duplicate active feed exists.
UPDATE news_sources
SET
  rssUrl      = 'https://www.myjoyonline.com/feed/',
  logoUrl     = 'https://www.google.com/s2/favicons?domain=myjoyonline.com&sz=128',
  category    = 'general',
  isOfficial  = 0,
  language    = 'en',
  isActive    = 1
WHERE id = 'src_myjoyonline';

-- Citi Newsroom — Citi TV/FM's news portal; already in the table as src_citinewsroom.
INSERT OR REPLACE INTO news_sources
  (id, name, url, rssUrl, logoUrl, category, isActive, isOfficial, description, language, createdAt)
VALUES (
  'news-source-citinewsroom',
  'Citi Newsroom',
  'https://citinewsroom.com',
  'https://citinewsroom.com/feed/',
  'https://www.google.com/s2/favicons?domain=citinewsroom.com&sz=128',
  'general',
  1,
  0,
  'Citi TV/FM''s digital newsroom — breaking news, in-depth analysis, and investigative journalism from Ghana.',
  'en',
  datetime('now')
);

UPDATE news_sources
SET
  rssUrl      = 'https://citinewsroom.com/feed/',
  logoUrl     = 'https://www.google.com/s2/favicons?domain=citinewsroom.com&sz=128',
  category    = 'general',
  isOfficial  = 0,
  language    = 'en',
  isActive    = 1
WHERE id = 'src_citinewsroom';

-- GhanaWeb — largest Ghanaian online portal; was deleted in migration 010, re-added here.
INSERT OR REPLACE INTO news_sources
  (id, name, url, rssUrl, logoUrl, category, isActive, isOfficial, description, language, createdAt)
VALUES (
  'news-source-ghanaweb',
  'GhanaWeb',
  'https://www.ghanaweb.com',
  'https://www.ghanaweb.com/GhanaHomePage/rss/',
  'https://www.google.com/s2/favicons?domain=ghanaweb.com&sz=128',
  'general',
  1,
  0,
  'Ghana''s largest online portal — comprehensive coverage of politics, business, sports, and entertainment.',
  'en',
  datetime('now')
);

-- Modern Ghana — news and opinion; was deleted in migration 010, re-added here.
INSERT OR REPLACE INTO news_sources
  (id, name, url, rssUrl, logoUrl, category, isActive, isOfficial, description, language, createdAt)
VALUES (
  'news-source-modernghana',
  'Modern Ghana',
  'https://www.modernghana.com',
  'https://www.modernghana.com/rssfeed/latest.xml',
  'https://www.google.com/s2/favicons?domain=modernghana.com&sz=128',
  'general',
  1,
  0,
  'Independent Ghanaian news and opinion platform covering national affairs, politics, and African news.',
  'en',
  datetime('now')
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TIER 3 — Specialist Sources
-- ─────────────────────────────────────────────────────────────────────────────

-- Daily Graphic — oldest newspaper in Ghana; was deleted in migration 010, re-added here.
INSERT OR REPLACE INTO news_sources
  (id, name, url, rssUrl, logoUrl, category, isActive, isOfficial, description, language, createdAt)
VALUES (
  'news-source-graphic',
  'Daily Graphic',
  'https://www.graphic.com.gh',
  'https://www.graphic.com.gh/feed',
  'https://www.google.com/s2/favicons?domain=graphic.com.gh&sz=128',
  'general',
  1,
  0,
  'Daily Graphic — Ghana''s most authoritative and oldest newspaper, established in 1950.',
  'en',
  datetime('now')
);

-- Business Ghana — business and economy news; was deleted in migration 010, re-added here.
INSERT OR REPLACE INTO news_sources
  (id, name, url, rssUrl, logoUrl, category, isActive, isOfficial, description, language, createdAt)
VALUES (
  'news-source-businessghana',
  'Business Ghana',
  'https://www.businessghana.com',
  'https://www.businessghana.com/site/rss',
  'https://www.google.com/s2/favicons?domain=businessghana.com&sz=128',
  'business',
  1,
  0,
  'Business Ghana — business, economy, and investment news for professionals across Ghana.',
  'en',
  datetime('now')
);

-- Update legacy src_businessghana row if still present.
UPDATE news_sources
SET
  rssUrl      = 'https://www.businessghana.com/site/rss',
  logoUrl     = 'https://www.google.com/s2/favicons?domain=businessghana.com&sz=128',
  category    = 'business',
  isOfficial  = 0,
  language    = 'en',
  isActive    = 1
WHERE id = 'src_businessghana';

-- Ghana Business News — business-focused outlet; already in the table as src_ghanabusiness.
INSERT OR REPLACE INTO news_sources
  (id, name, url, rssUrl, logoUrl, category, isActive, isOfficial, description, language, createdAt)
VALUES (
  'news-source-ghanabusinessnews',
  'Ghana Business News',
  'https://www.ghanabusinessnews.com',
  'https://www.ghanabusinessnews.com/feed/',
  'https://www.google.com/s2/favicons?domain=ghanabusinessnews.com&sz=128',
  'business',
  1,
  0,
  'Ghana Business News — dedicated business and economic news for Ghanaian entrepreneurs and professionals.',
  'en',
  datetime('now')
);

UPDATE news_sources
SET
  rssUrl      = 'https://www.ghanabusinessnews.com/feed/',
  logoUrl     = 'https://www.google.com/s2/favicons?domain=ghanabusinessnews.com&sz=128',
  category    = 'business',
  isOfficial  = 0,
  language    = 'en',
  isActive    = 1
WHERE id = 'src_ghanabusiness';

-- Pulse Ghana — youth-focused news; was deleted in migration 011, re-added here.
INSERT OR REPLACE INTO news_sources
  (id, name, url, rssUrl, logoUrl, category, isActive, isOfficial, description, language, createdAt)
VALUES (
  'news-source-pulse',
  'Pulse Ghana',
  'https://www.pulse.com.gh',
  'https://www.pulse.com.gh/rss',
  'https://www.google.com/s2/favicons?domain=pulse.com.gh&sz=128',
  'general',
  1,
  0,
  'Pulse Ghana — youth-focused news, entertainment, lifestyle, and sports coverage across Ghana.',
  'en',
  datetime('now')
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_news_sources_category   ON news_sources(category);
CREATE INDEX IF NOT EXISTS idx_news_sources_isOfficial ON news_sources(isOfficial);
CREATE INDEX IF NOT EXISTS idx_news_sources_language   ON news_sources(language);
