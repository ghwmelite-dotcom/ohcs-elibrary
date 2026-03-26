import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Newspaper,
  Download,
  WifiOff,
  Sparkles
} from 'lucide-react';
import { TextToSpeech } from '@/components/news';
import { useNewsStore } from '@/stores/newsStore';
import { useOfflineArticles } from '@/hooks/useOfflineArticles';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export default function Article() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const {
    currentArticle,
    articles,
    isLoading,
    error,
    fetchArticle,
    bookmarkArticle,
    removeBookmark,
    clearError,
    clearCurrentArticle,
  } = useNewsStore();

  const { isArticleSaved, toggleOffline, isOnline } = useOfflineArticles();
  const [relatedFromApi, setRelatedFromApi] = useState<typeof articles>([]);

  useEffect(() => {
    if (articleId) {
      // Clear any previous article when loading a new one
      clearCurrentArticle();
      fetchArticle(articleId);
    }

    // Cleanup when component unmounts
    return () => {
      clearCurrentArticle();
    };
  }, [articleId, fetchArticle, clearCurrentArticle]);

  // Fetch related articles from API when the store's article list is empty (direct navigation)
  useEffect(() => {
    if (!currentArticle) return;
    if (articles.length > 0) {
      setRelatedFromApi([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/v1/news?category=${encodeURIComponent(currentArticle.category)}&limit=4`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { articles?: typeof articles }) => {
        if (data.articles) {
          setRelatedFromApi(data.articles.filter((a) => a.id !== currentArticle.id).slice(0, 3));
        }
      })
      .catch(() => {/* ignore abort / network errors */});
    return () => controller.abort();
  }, [currentArticle, articles.length]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmark = () => {
    if (!currentArticle) return;
    if (currentArticle.isBookmarked) {
      removeBookmark(currentArticle.id);
    } else {
      bookmarkArticle(currentArticle.id);
    }
  };

  const handleShare = async () => {
    if (!currentArticle) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentArticle.title,
          text: currentArticle.summary,
          url: currentArticle.url,
        });
      } catch {
        // User cancelled
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const handleSaveOffline = () => {
    if (!currentArticle) return;
    toggleOffline({
      id: currentArticle.id,
      title: currentArticle.title,
      summary: currentArticle.summary,
      content: currentArticle.content,
      imageUrl: currentArticle.imageUrl,
      category: currentArticle.category,
      publishedAt: currentArticle.publishedAt,
      source: currentArticle.source,
      readingTimeMinutes: 5,
    });
  };

  const isSavedOffline = currentArticle ? isArticleSaved(currentArticle.id) : false;

  // Get related articles: prefer store list, fall back to API results fetched on direct navigation
  const relatedArticles = articles.length > 0
    ? articles.filter(a => a.id !== articleId && a.category === currentArticle?.category).slice(0, 3)
    : relatedFromApi;

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(currentArticle?.title || '');

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

  // Loading state - show loading if isLoading is true OR if we haven't loaded the article yet
  if (isLoading || (!currentArticle && !error)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
          <p className="text-surface-600 dark:text-surface-400">Loading article...</p>
        </div>
      </div>
    );
  }

  // Error state - only show if there's an actual error
  if (error || !currentArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to News
        </Link>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
            Article Not Found
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            {error || "The article you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => navigate('/news')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse All News
          </button>
        </div>
      </div>
    );
  }

  // Format tags
  const tags = currentArticle.tags || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            {/* Category & Relevance */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium capitalize">
                {currentArticle.category}
              </span>
              {currentArticle.relevanceScore && currentArticle.relevanceScore >= 80 && (
                <span className="px-3 py-1 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 rounded-full text-sm font-medium">
                  Highly Relevant
                </span>
              )}
              {currentArticle.isBreaking && (
                <span className="px-3 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded-full text-sm font-medium">
                  Breaking
                </span>
              )}
            </div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-surface-50 mb-4"
            >
              {currentArticle.title}
            </motion.h1>

            {/* Summary */}
            <p className="text-lg text-surface-600 dark:text-surface-400 mb-4">
              {currentArticle.summary}
            </p>

            {/* AI Summary */}
            {currentArticle.aiSummary?.trim() ? (
              <div className="flex gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl mb-6">
                <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1 uppercase tracking-wide">
                    AI Summary
                  </p>
                  <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                    {currentArticle.aiSummary}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-surface-500">
              <div className="flex items-center gap-2">
                {currentArticle.source?.logoUrl && (
                  <img
                    src={currentArticle.source.logoUrl}
                    alt={currentArticle.source.name}
                    className="w-5 h-5 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <a
                  href={currentArticle.source?.url || currentArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-primary-600 transition-colors"
                >
                  {currentArticle.source?.name || 'Unknown Source'}
                </a>
              </div>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(currentArticle.publishedAt)}
              </span>
              <span className="text-surface-400">
                ({formatRelativeTime(currentArticle.publishedAt)})
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {currentArticle.imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 rounded-xl overflow-hidden"
            >
              <img
                src={currentArticle.imageUrl}
                alt={currentArticle.title}
                loading="lazy"
                decoding="async"
                className="w-full aspect-video object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </motion.div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between py-4 border-y border-surface-200 dark:border-surface-700 mb-8">
            <div className="flex items-center gap-2">
              {/* Text-to-Speech */}
              <TextToSpeech
                text={`${currentArticle.title}. ${currentArticle.summary}`}
                variant="button"
              />

              <button
                onClick={handleBookmark}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                  currentArticle.isBookmarked
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
                )}
              >
                {currentArticle.isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {currentArticle.isBookmarked ? 'Saved' : 'Save'}
                </span>
              </button>

              <button
                onClick={handleSaveOffline}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                  isSavedOffline
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
                )}
                title={isSavedOffline ? 'Remove from offline' : 'Save for offline reading'}
              >
                {isSavedOffline ? (
                  <WifiOff className="w-5 h-5" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {isSavedOffline ? 'Saved Offline' : 'Save Offline'}
                </span>
              </button>

              <div className="relative">
                <button
                  onClick={handleShare}
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
              href={currentArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <span className="text-sm font-medium">Read Full Article</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Content Section - For RSS articles, show summary with CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            {currentArticle.content ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: currentArticle.content }}
              />
            ) : (
              <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Newspaper className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  Continue Reading on {currentArticle.source?.name || 'Source'}
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
                  This article is provided by {currentArticle.source?.name}. Click below to read the full story on their website.
                </p>
                <a
                  href={currentArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
                >
                  Read Full Article
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            )}
          </motion.div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/news?search=${encodeURIComponent(tag)}`}
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
                    <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-surface-100 dark:bg-surface-800">
                      <img
                        src={related.imageUrl}
                        alt={related.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <h3 className="font-medium text-surface-900 dark:text-surface-50 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {related.title}
                  </h3>
                  <p className="text-sm text-surface-500 mt-1">
                    {related.source?.name || 'Unknown'} • {formatRelativeTime(related.publishedAt)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
    </div>
  );
}
