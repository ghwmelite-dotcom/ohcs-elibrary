-- Add AI summary column to news articles
ALTER TABLE news_articles ADD COLUMN aiSummary TEXT DEFAULT NULL;

-- Add index for articles needing summaries
CREATE INDEX IF NOT EXISTS idx_articles_no_summary ON news_articles(id) WHERE aiSummary IS NULL;
