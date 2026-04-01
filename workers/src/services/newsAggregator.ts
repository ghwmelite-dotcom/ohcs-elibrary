/**
 * News Aggregator Service
 * Fetches and processes RSS feeds from Ghana news sources
 */

import { Env } from '../types';
import { AI_DEFAULTS } from '../config/aiModels';

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl?: string;
  category?: string;
  author?: string;
  content?: string;
}

interface NewsSource {
  id: string;
  name: string;
  url: string;
  rssUrl: string;
  isActive: number;
}

interface ProcessedArticle {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  url: string;
  imageUrl: string | null;
  sourceId: string;
  category: string;
  tags: string[];
  publishedAt: string;
  relevanceScore: number;
  isBreaking: boolean;
  isFeatured: boolean;
  externalId: string;
  readingTimeMinutes: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Keywords for categorization and relevance scoring
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  policy: ['policy', 'government', 'parliament', 'legislation', 'law', 'regulation', 'minister', 'ministry', 'cabinet', 'president', 'governance', 'public sector', 'civil service', 'mda'],
  training: ['training', 'workshop', 'seminar', 'capacity building', 'skills', 'development', 'learning', 'education', 'certification', 'professional development'],
  technology: ['digital', 'technology', 'e-government', 'ict', 'digitization', 'software', 'app', 'online', 'internet', 'cyber', 'innovation', 'tech'],
  hr: ['recruitment', 'employment', 'job', 'vacancy', 'pension', 'salary', 'promotion', 'transfer', 'retirement', 'staff', 'human resource', 'hr', 'welfare'],
  announcements: ['announcement', 'notice', 'circular', 'memo', 'directive', 'press release', 'statement', 'communique'],
  events: ['event', 'conference', 'summit', 'meeting', 'ceremony', 'celebration', 'launch', 'inauguration', 'festival'],
  general: [] // default category
};

// Keywords that indicate high relevance to civil servants
const RELEVANCE_KEYWORDS = [
  'civil service', 'civil servant', 'public service', 'public servant', 'government worker',
  'ohcs', 'head of civil service', 'public sector', 'mda', 'ministry', 'department', 'agency',
  'ghana government', 'public administration', 'state enterprise', 'soe',
  'local government', 'metropolitan', 'municipal', 'district assembly',
  'public policy', 'governance', 'reform', 'restructuring'
];

// Breaking news keywords
const BREAKING_KEYWORDS = [
  'breaking', 'urgent', 'just in', 'developing', 'flash', 'alert',
  'president announces', 'government announces', 'minister announces'
];

// Sentiment keywords
const POSITIVE_KEYWORDS = [
  'success', 'achievement', 'growth', 'improvement', 'progress', 'win', 'celebrate',
  'launch', 'inaugurate', 'award', 'honor', 'partnership', 'development', 'breakthrough',
  'positive', 'increase', 'boost', 'advance', 'expand', 'approve', 'support'
];

const NEGATIVE_KEYWORDS = [
  'crisis', 'failure', 'decline', 'corruption', 'scandal', 'protest', 'strike',
  'death', 'accident', 'disaster', 'violence', 'conflict', 'arrest', 'fraud',
  'negative', 'decrease', 'loss', 'warning', 'threat', 'concern', 'problem'
];

// Category placeholder images (Ghana-themed colors)
const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  policy: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=450&fit=crop', // Government building
  training: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=450&fit=crop', // Workshop
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop', // Tech
  hr: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=450&fit=crop', // Office workers
  announcements: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop', // News
  events: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop', // Conference
  general: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop', // Newspaper
};

/**
 * Parse RSS/Atom XML feed
 */
function parseRSSFeed(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Check if it's Atom or RSS
  const isAtom = xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"');

  if (isAtom) {
    // Parse Atom feed
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];

      const title = extractTag(entry, 'title');
      const link = extractAtomLink(entry);
      const summary = extractTag(entry, 'summary') || extractTag(entry, 'content');
      const published = extractTag(entry, 'published') || extractTag(entry, 'updated');
      const author = extractTag(entry, 'name'); // inside <author>

      if (title && link) {
        items.push({
          title: cleanText(title),
          link: link,
          description: cleanText(summary || ''),
          pubDate: published || new Date().toISOString(),
          author: author ? cleanText(author) : undefined,
        });
      }
    }
  } else {
    // Parse RSS 2.0 feed
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];

      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link') || extractTag(item, 'guid');
      const description = extractTag(item, 'description') || extractTag(item, 'content:encoded');
      const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'dc:date');
      const category = extractTag(item, 'category');
      const author = extractTag(item, 'author') || extractTag(item, 'dc:creator');

      // Try to extract image
      let imageUrl = extractMediaContent(item) || extractEnclosure(item) || extractImageFromContent(description || '');

      if (title && link) {
        items.push({
          title: cleanText(title),
          link: cleanText(link),
          description: cleanText(description || ''),
          pubDate: pubDate || new Date().toISOString(),
          category: category ? cleanText(category) : undefined,
          author: author ? cleanText(author) : undefined,
          imageUrl: imageUrl,
        });
      }
    }
  }

  return items;
}

/**
 * Extract content from XML tag
 */
function extractTag(xml: string, tagName: string): string | null {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tagName}>`, 'i');
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1];

  // Handle regular content
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = regex.exec(xml);
  return match ? match[1] : null;
}

/**
 * Extract link from Atom entry
 */
function extractAtomLink(entry: string): string | null {
  // Try alternate link first
  const altMatch = /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i.exec(entry);
  if (altMatch) return altMatch[1];

  // Try any link with href
  const hrefMatch = /<link[^>]*href=["']([^"']+)["']/i.exec(entry);
  if (hrefMatch) return hrefMatch[1];

  return null;
}

/**
 * Extract media:content image
 */
function extractMediaContent(item: string): string | null {
  const match = /<media:content[^>]*url=["']([^"']+)["']/i.exec(item);
  return match ? match[1] : null;
}

/**
 * Extract enclosure image
 */
function extractEnclosure(item: string): string | null {
  const match = /<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i.exec(item);
  return match ? match[1] : null;
}

/**
 * Extract image from HTML content
 */
function extractImageFromContent(content: string): string | null {
  const match = /<img[^>]*src=["']([^"']+)["']/i.exec(content);
  return match ? match[1] : null;
}

/**
 * Clean text - remove HTML tags and decode entities
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10))) // Decode numeric entities (&#8211; → –)
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, code) => String.fromCharCode(parseInt(code, 16))) // Decode hex entities (&#x2014; → —)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&hellip;/g, '\u2026')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Generate unique ID for article
 */
function generateArticleId(): string {
  return `art_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate external ID (hash of URL for deduplication)
 */
function generateExternalId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ext_${Math.abs(hash).toString(36)}`;
}

/**
 * Categorize article based on content
 */
function categorizeArticle(title: string, description: string): string {
  const content = `${title} ${description}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'general') continue;

    for (const keyword of keywords) {
      if (content.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return 'general';
}

/**
 * Extract tags from content
 */
function extractTags(title: string, description: string, category: string): string[] {
  const content = `${title} ${description}`.toLowerCase();
  const tags: Set<string> = new Set();

  // Add category as tag
  tags.add(category);

  // Add matching keywords as tags
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (content.includes(keyword.toLowerCase())) {
        tags.add(keyword.toLowerCase());
      }
    }
  }

  // Limit to 5 tags
  return Array.from(tags).slice(0, 5);
}

/**
 * Calculate relevance score (0-100)
 */
function calculateRelevanceScore(title: string, description: string): number {
  const content = `${title} ${description}`.toLowerCase();
  let score = 50; // Base score

  // Add points for relevance keywords
  for (const keyword of RELEVANCE_KEYWORDS) {
    if (content.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Check if article is breaking news
 */
function isBreakingNews(title: string, description: string): boolean {
  const content = `${title} ${description}`.toLowerCase();

  for (const keyword of BREAKING_KEYWORDS) {
    if (content.includes(keyword.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate reading time in minutes
 */
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200; // Average reading speed
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Analyze sentiment of content
 */
function analyzeSentiment(title: string, description: string): 'positive' | 'neutral' | 'negative' {
  const content = `${title} ${description}`.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  for (const keyword of POSITIVE_KEYWORDS) {
    if (content.includes(keyword)) positiveCount++;
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (content.includes(keyword)) negativeCount++;
  }

  if (positiveCount > negativeCount + 1) return 'positive';
  if (negativeCount > positiveCount + 1) return 'negative';
  return 'neutral';
}

/**
 * Fetch Open Graph image from article URL
 */
async function fetchOGImage(url: string, timeout = 5000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'OHCS-ELibrary-Bot/1.0 (OpenGraph fetcher)',
        'Accept': 'text/html',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();

    // Try og:image first
    let match = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(html);
    if (match) return match[1];

    // Try reversed attribute order
    match = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i.exec(html);
    if (match) return match[1];

    // Try twitter:image
    match = /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i.exec(html);
    if (match) return match[1];

    // Try twitter:image reversed
    match = /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i.exec(html);
    if (match) return match[1];

    // Try first large image in content
    const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
    if (imgMatches) {
      for (const imgTag of imgMatches) {
        const srcMatch = /src=["']([^"']+)["']/i.exec(imgTag);
        if (srcMatch) {
          const src = srcMatch[1];
          // Skip small images, icons, logos
          if (!src.includes('icon') && !src.includes('logo') && !src.includes('avatar') &&
              !src.includes('1x1') && !src.includes('pixel') && src.startsWith('http')) {
            return src;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get placeholder image for category
 */
function getCategoryPlaceholder(category: string): string {
  return CATEGORY_PLACEHOLDERS[category] || CATEGORY_PLACEHOLDERS.general;
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Process RSS items into articles
 */
function processRSSItems(items: RSSItem[], sourceId: string): ProcessedArticle[] {
  return items.map(item => {
    const category = categorizeArticle(item.title, item.description);
    const tags = extractTags(item.title, item.description, category);
    const relevanceScore = calculateRelevanceScore(item.title, item.description);
    const breaking = isBreakingNews(item.title, item.description);
    const readingTime = calculateReadingTime(`${item.title} ${item.description}`);
    const sentiment = analyzeSentiment(item.title, item.description);

    return {
      id: generateArticleId(),
      title: item.title.slice(0, 500), // Limit title length
      summary: item.description.slice(0, 1000), // Limit summary length
      content: null,
      url: item.link,
      imageUrl: item.imageUrl || null, // Will be enhanced with OG fetch later
      sourceId: sourceId,
      category: category,
      tags: tags,
      publishedAt: parseDate(item.pubDate),
      relevanceScore: relevanceScore,
      isBreaking: breaking,
      isFeatured: relevanceScore >= 90,
      externalId: generateExternalId(item.link),
      readingTimeMinutes: readingTime,
      sentiment: sentiment,
    };
  });
}

/**
 * Fetch RSS feed with timeout and error handling
 */
async function fetchRSSFeed(url: string, timeout = 10000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'OHCS-ELibrary-NewsBot/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Main aggregation function - fetches and stores news from all sources
 */
export async function aggregateNews(env: Env): Promise<{
  success: boolean;
  sourcesProcessed: number;
  articlesAdded: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let sourcesProcessed = 0;
  let articlesAdded = 0;

  try {
    // Get all active sources with RSS URLs
    const sources = await env.DB.prepare(`
      SELECT id, name, url, rssUrl, isActive
      FROM news_sources
      WHERE isActive = 1 AND rssUrl IS NOT NULL AND rssUrl != ''
    `).all<NewsSource>();

    if (!sources.results || sources.results.length === 0) {
      return { success: true, sourcesProcessed: 0, articlesAdded: 0, errors: ['No active sources with RSS URLs'] };
    }

    console.log(`Processing ${sources.results.length} news sources...`);

    for (const source of sources.results) {
      try {
        console.log(`Fetching from ${source.name}: ${source.rssUrl}`);

        // Fetch RSS feed
        const xml = await fetchRSSFeed(source.rssUrl);

        if (!xml) {
          errors.push(`Failed to fetch from ${source.name}`);
          await updateSourceError(env, source.id, 'Failed to fetch RSS feed');
          continue;
        }

        // Parse RSS feed
        const items = parseRSSFeed(xml);
        console.log(`Parsed ${items.length} items from ${source.name}`);

        if (items.length === 0) {
          errors.push(`No items found in ${source.name} feed`);
          await updateSourceError(env, source.id, 'No items in feed');
          continue;
        }

        // Process items into articles
        const articles = processRSSItems(items, source.id);

        // Insert articles (skip duplicates)
        let added = 0;
        const articlesToFetchImages: ProcessedArticle[] = [];

        for (const article of articles) {
          try {
            // Check if article already exists (by externalId or URL)
            const existing = await env.DB.prepare(`
              SELECT id FROM news_articles WHERE externalId = ? OR url = ?
            `).bind(article.externalId, article.url).first();

            if (existing) {
              continue; // Skip duplicate
            }

            // If no image, try to fetch OG image (limit to 3 per source to avoid timeout)
            let finalImageUrl = article.imageUrl;
            if (!finalImageUrl && articlesToFetchImages.length < 3) {
              console.log(`Fetching OG image for: ${article.title.slice(0, 50)}...`);
              const ogImage = await fetchOGImage(article.url);
              if (ogImage) {
                finalImageUrl = ogImage;
                console.log(`Found OG image: ${ogImage.slice(0, 50)}...`);
              }
            }

            // Use category placeholder if still no image
            if (!finalImageUrl) {
              finalImageUrl = getCategoryPlaceholder(article.category);
            }

            // Insert new article with enhanced fields
            await env.DB.prepare(`
              INSERT INTO news_articles (
                id, title, summary, content, url, imageUrl, sourceId, category,
                tags, publishedAt, relevanceScore, isBreaking, isFeatured, externalId,
                readingTimeMinutes, sentiment
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              article.id,
              article.title,
              article.summary,
              article.content,
              article.url,
              finalImageUrl,
              article.sourceId,
              article.category,
              JSON.stringify(article.tags),
              article.publishedAt,
              article.relevanceScore,
              article.isBreaking ? 1 : 0,
              article.isFeatured ? 1 : 0,
              article.externalId,
              article.readingTimeMinutes,
              article.sentiment
            ).run();

            added++;
            if (!article.imageUrl) {
              articlesToFetchImages.push(article);
            }
          } catch (err) {
            console.error(`Error inserting article: ${article.title}`, err);
          }
        }

        articlesAdded += added;
        sourcesProcessed++;

        // Update source last fetched time
        await env.DB.prepare(`
          UPDATE news_sources SET lastFetchedAt = datetime('now'), fetchError = NULL WHERE id = ?
        `).bind(source.id).run();

        console.log(`Added ${added} new articles from ${source.name}`);

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Error processing ${source.name}: ${errorMsg}`);
        await updateSourceError(env, source.id, errorMsg);
      }
    }

    // Clean up old articles (older than 24 hours), but preserve bookmarked ones
    await env.DB.prepare(`
      DELETE FROM news_articles
      WHERE publishedAt < datetime('now', '-24 hours')
        AND id NOT IN (SELECT articleId FROM news_bookmarks)
    `).run();

    return {
      success: true,
      sourcesProcessed,
      articlesAdded,
      errors,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Aggregation failed: ${errorMsg}`);
    return {
      success: false,
      sourcesProcessed,
      articlesAdded,
      errors,
    };
  }
}

/**
 * Update source error status
 */
async function updateSourceError(env: Env, sourceId: string, error: string): Promise<void> {
  try {
    await env.DB.prepare(`
      UPDATE news_sources SET fetchError = ?, lastFetchedAt = datetime('now') WHERE id = ?
    `).bind(error, sourceId).run();
  } catch (err) {
    console.error('Error updating source error status:', err);
  }
}

/**
 * Generate AI summary for an article
 */
async function generateAISummary(
  env: Env,
  title: string,
  content: string
): Promise<string | null> {
  try {
    if (!env.AI) {
      console.log('AI binding not available');
      return null;
    }

    const prompt = `You are a news summarizer for Ghana's civil service. Create a concise 2-3 sentence summary of this article that highlights the key points relevant to government workers and public sector employees.

Article Title: ${title}

Article Content: ${content.slice(0, 2000)}

Summary:`;

    const response = await env.AI.run(AI_DEFAULTS.news.model, {
      prompt,
      max_tokens: AI_DEFAULTS.news.max_tokens,
      temperature: AI_DEFAULTS.news.temperature,
    });

    if (response && response.response) {
      return response.response.trim().slice(0, 500);
    }

    return null;
  } catch (error) {
    console.error('AI summary generation failed:', error);
    return null;
  }
}

/**
 * Generate AI summaries for articles that don't have them
 */
export async function generateArticleSummaries(
  env: Env,
  limit: number = 10
): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Get articles without AI summaries
    const articles = await env.DB.prepare(`
      SELECT id, title, summary
      FROM news_articles
      WHERE aiSummary IS NULL
      ORDER BY publishedAt DESC
      LIMIT ?
    `).bind(limit).all<{ id: string; title: string; summary: string }>();

    if (!articles.results || articles.results.length === 0) {
      return { processed: 0, errors: ['No articles need summaries'] };
    }

    console.log(`Generating AI summaries for ${articles.results.length} articles...`);

    for (const article of articles.results) {
      try {
        const aiSummary = await generateAISummary(env, article.title, article.summary);

        if (aiSummary) {
          await env.DB.prepare(`
            UPDATE news_articles SET aiSummary = ? WHERE id = ?
          `).bind(aiSummary, article.id).run();

          processed++;
          console.log(`Generated summary for: ${article.title.slice(0, 40)}...`);
        } else {
          // Mark as processed but with empty summary to avoid retrying
          await env.DB.prepare(`
            UPDATE news_articles SET aiSummary = '' WHERE id = ?
          `).bind(article.id).run();
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Failed to summarize "${article.title.slice(0, 30)}...": ${errorMsg}`);
      }
    }

    return { processed, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Summary generation failed: ${errorMsg}`);
    return { processed, errors };
  }
}

/**
 * Get aggregation status
 */
export async function getAggregationStatus(env: Env): Promise<{
  sources: Array<{
    id: string;
    name: string;
    rssUrl: string;
    lastFetchedAt: string | null;
    fetchError: string | null;
    articleCount: number;
  }>;
  totalArticles: number;
  lastRun: string | null;
}> {
  const sources = await env.DB.prepare(`
    SELECT
      s.id, s.name, s.rssUrl, s.lastFetchedAt, s.fetchError,
      COUNT(a.id) as articleCount
    FROM news_sources s
    LEFT JOIN news_articles a ON s.id = a.sourceId
    WHERE s.isActive = 1
    GROUP BY s.id
  `).all();

  const totalResult = await env.DB.prepare(`
    SELECT COUNT(*) as total FROM news_articles
  `).first<{ total: number }>();

  const lastRunResult = await env.DB.prepare(`
    SELECT MAX(lastFetchedAt) as lastRun FROM news_sources
  `).first<{ lastRun: string | null }>();

  return {
    sources: sources.results as any[] || [],
    totalArticles: totalResult?.total || 0,
    lastRun: lastRunResult?.lastRun || null,
  };
}
