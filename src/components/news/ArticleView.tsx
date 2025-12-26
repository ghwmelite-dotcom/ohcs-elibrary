import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Share2,
  MessageSquare,
  ThumbsUp,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Check
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import { formatDate, formatRelativeTime } from '@/utils/formatters';

interface RelatedArticle {
  id: string;
  title: string;
  source: string;
  imageUrl?: string;
  publishedAt: string;
}

interface ArticleViewProps {
  article: {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    source: string;
    sourceIcon?: string;
    sourceUrl?: string;
    category: string;
    imageUrl?: string;
    publishedAt: string;
    url: string;
    author?: string;
    readTime?: number;
    relevanceScore?: number;
    isBookmarked?: boolean;
    tags?: string[];
  };
  relatedArticles?: RelatedArticle[];
  onBookmark?: () => void;
  onShare?: () => void;
}

export function ArticleView({
  article,
  relatedArticles = [],
  onBookmark,
  onShare,
}: ArticleViewProps) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(article.title);

  const socialLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      color: 'hover:text-blue-600',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
      color: 'hover:text-sky-500',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`,
      color: 'hover:text-blue-700',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        to="/news"
        className="inline-flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to News
      </Link>

      <article>
        {/* Header */}
        <header className="mb-8">
          {/* Category */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
              {article.category}
            </span>
            {article.relevanceScore && article.relevanceScore >= 80 && (
              <span className="px-3 py-1 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 rounded-full text-sm font-medium">
                Highly Relevant
              </span>
            )}
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-surface-50 mb-4"
          >
            {article.title}
          </motion.h1>

          {/* Excerpt */}
          <p className="text-lg text-surface-600 dark:text-surface-400 mb-6">
            {article.excerpt}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-surface-500">
            <div className="flex items-center gap-2">
              {article.sourceIcon && (
                <img src={article.sourceIcon} alt={article.source} className="w-5 h-5 rounded" />
              )}
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-primary-600 transition-colors"
              >
                {article.source}
              </a>
            </div>
            {article.author && (
              <>
                <span>•</span>
                <span>By {article.author}</span>
              </>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(article.publishedAt)}
            </span>
            {article.readTime && (
              <>
                <span>•</span>
                <span>{article.readTime} min read</span>
              </>
            )}
          </div>
        </header>

        {/* Featured Image */}
        {article.imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-xl overflow-hidden"
          >
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full aspect-video object-cover"
            />
          </motion.div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between py-4 border-y border-surface-200 dark:border-surface-700 mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={onBookmark}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                article.isBookmarked
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
              )}
            >
              {article.isBookmarked ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {article.isBookmarked ? 'Saved' : 'Save'}
              </span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">Share</span>
              </button>

              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-2 bg-white dark:bg-surface-800 rounded-xl shadow-elevation-3 p-2 z-10 min-w-[180px]"
                >
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors',
                        social.color
                      )}
                    >
                      <social.icon className="w-4 h-4" />
                      <span className="text-sm">{social.name}</span>
                    </a>
                  ))}
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <span className="text-sm font-medium">Read Original</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-lg dark:prose-invert max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                to={`/news?tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 rounded-full text-sm hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-700">
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-6">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((related) => (
              <Link
                key={related.id}
                to={`/news/${related.id}`}
                className="group"
              >
                {related.imageUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-3">
                    <img
                      src={related.imageUrl}
                      alt={related.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <h3 className="font-medium text-surface-900 dark:text-surface-50 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {related.title}
                </h3>
                <p className="text-sm text-surface-500 mt-1">
                  {related.source} • {formatRelativeTime(related.publishedAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
