import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Newspaper, Search, TrendingUp, Rss, AlertCircle, RefreshCw, WifiOff, Clock } from 'lucide-react';
import { NewsFeed, CategoryFilter, SourceFilter, BreakingNews, HeroCarousel, TrendingTopicsList } from '@/components/news';
import { RefreshableContainer, OfflineStatusBadge } from '@/components/shared';
import { useNewsStore } from '@/stores/newsStore';
import { useOfflineArticles } from '@/hooks/useOfflineArticles';
import { formatRelativeTime } from '@/utils/formatters';
import type { NewsCategory } from '@/types';

export default function News() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showBreakingNews, setShowBreakingNews] = useState(true);
  const [refreshingSourceId, setRefreshingSourceId] = useState<string | null>(null);

  const {
    articles,
    sources,
    categories,
    breakingNews,
    isLoading,
    error,
    total,
    fetchArticles,
    fetchSources,
    fetchCategories,
    fetchBreakingNews,
    bookmarkArticle,
    removeBookmark,
    setFilter,
    clearError,
  } = useNewsStore();

  const { offlineArticles, isOnline, isLoading: offlineLoading } = useOfflineArticles();

  // Fetch data on mount
  useEffect(() => {
    fetchSources();
    fetchCategories();
    fetchBreakingNews();
    fetchArticles();
  }, []);

  // Fetch articles when filters change
  useEffect(() => {
    const category = selectedCategories.length === 1 ? selectedCategories[0] : undefined;
    const sourceId = selectedSources.length === 1 ? selectedSources[0] : undefined;

    setFilter({
      category,
      sourceId,
      search: searchQuery || undefined,
    });

    fetchArticles({
      category,
      sourceId,
      search: searchQuery || undefined,
    });
  }, [searchQuery, selectedCategories, selectedSources]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((s) => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchArticles(),
      fetchBreakingNews(),
    ]);
  };

  const handleBookmark = (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (article?.isBookmarked) {
      removeBookmark(articleId);
    } else {
      bookmarkArticle(articleId);
    }
  };

  const handleShare = async (article: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || article.summary,
          url: article.url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(article.url);
    }
  };

  const handleSourceRefresh = async (sourceId: string) => {
    setRefreshingSourceId(sourceId);
    try {
      // Refresh articles filtered by this source
      await fetchArticles({ sourceId });
    } finally {
      setRefreshingSourceId(null);
    }
  };

  // Transform articles for NewsFeed component
  const transformedArticles = articles.map((article) => ({
    id: article.id,
    title: article.title,
    excerpt: article.summary || '',
    source: article.source?.name || 'Unknown Source',
    sourceIcon: article.source?.logoUrl,
    category: article.category,
    imageUrl: article.imageUrl,
    publishedAt: article.publishedAt,
    url: article.url,
    relevanceScore: article.relevanceScore,
    isBookmarked: article.isBookmarked,
    isTrending: Boolean(article.isBreaking || (article.relevanceScore && article.relevanceScore > 90)),
    readingTimeMinutes: (article as any).readingTimeMinutes || 1,
    sentiment: ((article as any).sentiment || 'neutral') as 'positive' | 'neutral' | 'negative',
    aiSummary: ((article as any).aiSummary as string | null | undefined) ?? null,
  }));

  // Transform breaking news for BreakingNews component
  const transformedBreakingNews = breakingNews.map((article) => ({
    id: article.id,
    title: article.title,
    source: article.source?.name || 'Unknown Source',
    url: article.url,
    timestamp: article.publishedAt,
  }));

  // Transform categories for CategoryFilter component
  const transformedCategories = categories.map((cat: NewsCategory) => ({
    id: cat.slug,
    name: cat.name,
    icon: cat.slug,
    count: cat.articleCount,
  }));

  // Transform sources for SourceFilter component
  const transformedSources = sources.map((source) => ({
    id: source.id,
    name: source.name,
    icon: source.logoUrl,
    url: source.url,
    count: (source as any).articleCount,
  }));

  // Filter articles client-side for additional filtering
  const filteredArticles = transformedArticles.filter((article) => {
    // If multiple categories selected, filter by any matching
    if (selectedCategories.length > 1) {
      const matchesCategory = selectedCategories.some(
        (cat) => article.category.toLowerCase() === cat.toLowerCase()
      );
      if (!matchesCategory) return false;
    }

    // If multiple sources selected, filter by any matching
    if (selectedSources.length > 1) {
      const matchesSource = selectedSources.some((srcId) => {
        const source = sources.find((s) => s.id === srcId);
        return source && article.source.toLowerCase().includes(source.name.toLowerCase());
      });
      if (!matchesSource) return false;
    }

    return true;
  });

  const featuredArticle = filteredArticles.find((a) => a.isTrending);
  const regularArticles = filteredArticles.filter((a) => a !== featuredArticle);

  const trendingCount = articles.filter(a => a.isBreaking || (a.relevanceScore && a.relevanceScore > 90)).length;

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 dark:text-red-400"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Breaking News Banner */}
      {showBreakingNews && transformedBreakingNews.length > 0 && (
        <BreakingNews
          items={transformedBreakingNews}
          onDismiss={() => setShowBreakingNews(false)}
        />
      )}

      <div>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                News Feed
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Stay informed with curated Ghana news
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Hero Carousel - Featured Articles */}
        {filteredArticles.filter(a => a.isTrending || (a.relevanceScore && a.relevanceScore >= 80)).length > 0 && (
          <div className="mb-8">
            <HeroCarousel
              articles={filteredArticles
                .filter(a => a.isTrending || (a.relevanceScore && a.relevanceScore >= 80))
                .slice(0, 5)
                .map(article => ({
                  id: article.id,
                  title: article.title,
                  excerpt: article.excerpt,
                  source: article.source,
                  sourceIcon: article.sourceIcon,
                  category: article.category,
                  imageUrl: article.imageUrl,
                  publishedAt: article.publishedAt,
                  url: article.url,
                  aiSummary: article.aiSummary,
                  readingTimeMinutes: article.readingTimeMinutes,
                }))}
              autoPlayInterval={6000}
            />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Articles', value: total || articles.length, icon: Newspaper, color: 'text-primary-600' },
            { label: 'Trending', value: trendingCount, icon: TrendingUp, color: 'text-accent-600' },
            { label: 'Sources', value: sources.length, icon: Rss, color: 'text-success-600' },
            { label: 'Categories', value: categories.length, icon: Search, color: 'text-secondary-600' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-surface-800 rounded-xl shadow-sm p-4"
            >
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                    {stat.value}
                  </p>
                  <p className="text-xs text-surface-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Offline Articles Section - Show when offline or has saved articles */}
        {(!isOnline || offlineArticles.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <WifiOff className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                    {!isOnline ? 'Offline Mode' : 'Saved for Offline'}
                  </h3>
                  <p className="text-sm text-surface-500">
                    {offlineArticles.length} article{offlineArticles.length !== 1 ? 's' : ''} available offline
                  </p>
                </div>
              </div>
              <OfflineStatusBadge />
            </div>

            {offlineArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offlineArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/news/${article.id}`}
                    className="bg-white dark:bg-surface-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {article.imageUrl && (
                      <div className="aspect-video bg-surface-100 dark:bg-surface-700">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-medium">
                          Offline
                        </span>
                        <span className="text-xs text-surface-500 capitalize">{article.category}</span>
                      </div>
                      <h4 className="font-medium text-surface-900 dark:text-surface-50 line-clamp-2 mb-2">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-surface-500">
                        <Clock className="w-3 h-3" />
                        <span>Saved {formatRelativeTime(article.savedAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-6 text-center">
                <WifiOff className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <p className="text-surface-600 dark:text-surface-400">
                  {!isOnline
                    ? "You're offline. No articles have been saved for offline reading."
                    : 'No articles saved for offline reading yet.'}
                </p>
                <p className="text-sm text-surface-500 mt-2">
                  Click the download icon on any article to save it for offline reading.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <CategoryFilter
              categories={transformedCategories}
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
              onClearAll={() => setSelectedCategories([])}
            />

            <SourceFilter
              sources={transformedSources}
              selectedSources={selectedSources}
              onSourceToggle={handleSourceToggle}
              onSourceRefresh={handleSourceRefresh}
              onClearAll={() => setSelectedSources([])}
              isRefreshing={refreshingSourceId}
            />

            {/* Trending Topics */}
            <TrendingTopicsList
              articles={articles.map(a => ({
                title: a.title,
                category: a.category,
                tags: (a as any).tags,
              }))}
              onTopicClick={(topic) => setSearchQuery(topic)}
              maxTopics={8}
            />

            {/* AI Relevance Info */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-4">
              <h4 className="font-medium text-surface-900 dark:text-surface-50 mb-2">
                AI-Powered Relevance
              </h4>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                Articles are scored based on relevance to civil service matters, helping you focus on what matters most to your work.
              </p>
            </div>
          </aside>

          {/* News Feed */}
          <main className="lg:col-span-3">
            <RefreshableContainer
              onRefresh={handleRefresh}
              isRefreshing={isLoading}
              className="min-h-[400px]"
            >
              <NewsFeed
                articles={regularArticles}
                featuredArticle={featuredArticle}
                isLoading={isLoading}
                onRefresh={handleRefresh}
                onBookmark={handleBookmark}
                onShare={handleShare}
              />
            </RefreshableContainer>
          </main>
        </div>
      </div>
    </div>
  );
}
