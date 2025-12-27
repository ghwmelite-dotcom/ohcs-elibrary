-- Add new columns for enhanced article features

-- Reading time in minutes
ALTER TABLE news_articles ADD COLUMN readingTimeMinutes INTEGER DEFAULT 1;

-- Sentiment analysis result
ALTER TABLE news_articles ADD COLUMN sentiment TEXT DEFAULT 'neutral';

-- Update existing articles with default values
UPDATE news_articles SET readingTimeMinutes = 1, sentiment = 'neutral' WHERE readingTimeMinutes IS NULL;
