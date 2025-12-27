import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Hash } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Topic {
  name: string;
  count: number;
}

interface TrendingTopicsProps {
  articles: Array<{
    title: string;
    category: string;
    tags?: string[];
  }>;
  onTopicClick?: (topic: string) => void;
  className?: string;
  maxTopics?: number;
}

// Common words to exclude from topic extraction
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose',
  'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'just', 'also', 'now', 'new', 'says', 'said', 'after', 'over', 'into',
  'about', 'out', 'up', 'down', 'off', 'then', 'here', 'there', 'any', 'many', 'much',
]);

// Extract topics from article data
function extractTopics(articles: TrendingTopicsProps['articles']): Topic[] {
  const topicCounts = new Map<string, number>();

  articles.forEach(article => {
    // Add category as a topic
    if (article.category) {
      const cat = article.category.toLowerCase();
      topicCounts.set(cat, (topicCounts.get(cat) || 0) + 3); // Weight categories higher
    }

    // Add tags as topics
    if (article.tags) {
      article.tags.forEach(tag => {
        const cleanTag = tag.toLowerCase().trim();
        if (cleanTag.length > 2 && !STOP_WORDS.has(cleanTag)) {
          topicCounts.set(cleanTag, (topicCounts.get(cleanTag) || 0) + 2);
        }
      });
    }

    // Extract key words from title
    const words = article.title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word =>
        word.length > 3 &&
        !STOP_WORDS.has(word) &&
        !/^\d+$/.test(word)
      );

    words.forEach(word => {
      topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
    });
  });

  // Convert to array and sort by count
  return Array.from(topicCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// Get size class based on topic popularity
function getTopicSize(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio > 0.8) return 'text-xl font-bold';
  if (ratio > 0.6) return 'text-lg font-semibold';
  if (ratio > 0.4) return 'text-base font-medium';
  if (ratio > 0.2) return 'text-sm';
  return 'text-xs';
}

// Get color class based on topic type
function getTopicColor(topic: string): string {
  const colors = [
    'text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30',
    'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-900/30',
    'text-accent-600 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-900/30',
    'text-success-600 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-900/30',
    'text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30',
    'text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30',
    'text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30',
    'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30',
  ];

  // Use hash of topic name to get consistent color
  const hash = topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function TrendingTopics({
  articles,
  onTopicClick,
  className,
  maxTopics = 15,
}: TrendingTopicsProps) {
  const topics = useMemo(() => {
    return extractTopics(articles).slice(0, maxTopics);
  }, [articles, maxTopics]);

  if (topics.length === 0) return null;

  const maxCount = topics[0]?.count || 1;

  return (
    <div className={cn('bg-white dark:bg-surface-800 rounded-xl shadow-sm p-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-accent-500" />
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">
          Trending Topics
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <motion.button
            key={topic.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onTopicClick?.(topic.name)}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors cursor-pointer',
              'bg-surface-50 dark:bg-surface-700/50',
              getTopicColor(topic.name),
              getTopicSize(topic.count, maxCount)
            )}
            title={`${topic.count} mentions`}
          >
            <Hash className="w-3 h-3 opacity-50" />
            <span className="capitalize">{topic.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Topic stats */}
      <div className="mt-4 pt-3 border-t border-surface-100 dark:border-surface-700">
        <p className="text-xs text-surface-500">
          Based on {articles.length} articles
        </p>
      </div>
    </div>
  );
}

// Compact version for sidebar
export function TrendingTopicsList({
  articles,
  onTopicClick,
  maxTopics = 8,
  className,
}: TrendingTopicsProps) {
  const topics = useMemo(() => {
    return extractTopics(articles).slice(0, maxTopics);
  }, [articles, maxTopics]);

  if (topics.length === 0) return null;

  return (
    <div className={cn('bg-white dark:bg-surface-800 rounded-xl shadow-sm p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-accent-500" />
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">
          Hot Topics
        </h3>
      </div>

      <div className="space-y-2">
        {topics.map((topic, index) => (
          <motion.button
            key={topic.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onTopicClick?.(topic.name)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-surface-400 w-4">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300 capitalize group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {topic.name}
              </span>
            </div>
            <span className="text-xs text-surface-400 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">
              {topic.count}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
