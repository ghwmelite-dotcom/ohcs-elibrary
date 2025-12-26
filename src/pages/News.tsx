import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Search, RefreshCw, Rss, TrendingUp } from 'lucide-react';
import { NewsFeed, CategoryFilter, SourceFilter, BreakingNews } from '@/components/news';
import { useNewsStore } from '@/stores/newsStore';

export default function News() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showBreakingNews, setShowBreakingNews] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Mock news data
  const mockArticles = [
    {
      id: '1',
      title: 'Government Announces New Digital Transformation Initiative for Civil Service',
      excerpt: 'The Office of the Head of Civil Service has unveiled a comprehensive digital transformation plan aimed at modernizing government operations across all MDAs.',
      source: 'Ghana News Agency',
      sourceIcon: '',
      category: 'Government',
      imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      url: 'https://gna.org.gh',
      relevanceScore: 95,
      isTrending: true,
    },
    {
      id: '2',
      title: 'Public Services Commission Reviews Promotion Guidelines for 2025',
      excerpt: 'New guidelines aim to create a more transparent and merit-based promotion system for civil servants nationwide.',
      source: 'Daily Graphic',
      category: 'Government',
      imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      url: 'https://graphic.com.gh',
      relevanceScore: 88,
    },
    {
      id: '3',
      title: 'Ministry of Finance Releases Q4 Budget Performance Report',
      excerpt: 'The report highlights fiscal achievements and challenges faced during the last quarter, with key insights for civil service operations.',
      source: 'Joy News',
      category: 'Economy',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      url: 'https://myjoyonline.com',
      relevanceScore: 82,
      isTrending: true,
    },
    {
      id: '4',
      title: 'Ghana Health Service Launches Training Program for Regional Staff',
      excerpt: 'A new capacity building initiative aims to enhance healthcare delivery at the regional and district levels.',
      source: 'Citi FM',
      category: 'Health',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
      publishedAt: new Date(Date.now() - 21600000).toISOString(),
      url: 'https://citifmonline.com',
      relevanceScore: 75,
    },
    {
      id: '5',
      title: 'Ministry of Education Implements New Teacher Evaluation Framework',
      excerpt: 'The framework introduces competency-based assessments to improve teaching quality in public schools.',
      source: 'Ghana News Agency',
      category: 'Education',
      imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
      publishedAt: new Date(Date.now() - 28800000).toISOString(),
      url: 'https://gna.org.gh',
      relevanceScore: 70,
    },
    {
      id: '6',
      title: 'Local Government Ministry Announces Smart City Initiative',
      excerpt: 'Major metropolitan areas to receive technology upgrades as part of the national digitization agenda.',
      source: 'Daily Graphic',
      category: 'Technology',
      imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
      publishedAt: new Date(Date.now() - 43200000).toISOString(),
      url: 'https://graphic.com.gh',
      relevanceScore: 78,
    },
    {
      id: '7',
      title: 'Ghana Signs MoU with Singapore on Public Service Excellence',
      excerpt: 'The partnership will facilitate knowledge exchange and training opportunities for Ghanaian civil servants.',
      source: 'Ghana News Agency',
      category: 'International',
      imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      publishedAt: new Date(Date.now() - 57600000).toISOString(),
      url: 'https://gna.org.gh',
      relevanceScore: 85,
    },
    {
      id: '8',
      title: 'National Sports Authority Plans Inter-MDA Sports Festival',
      excerpt: 'The annual event returns with new disciplines and increased participation from ministries and agencies.',
      source: 'Joy News',
      category: 'Sports',
      imageUrl: 'https://images.unsplash.com/photo-1461896836934- voices-68b78c6?w=800',
      publishedAt: new Date(Date.now() - 72000000).toISOString(),
      url: 'https://myjoyonline.com',
      relevanceScore: 60,
    },
  ];

  const mockBreakingNews = [
    {
      id: 'b1',
      title: 'President addresses Civil Servants at Annual Conference',
      source: 'Ghana News Agency',
      url: 'https://gna.org.gh',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'b2',
      title: 'New minimum wage adjustments to take effect January 2025',
      source: 'Daily Graphic',
      url: 'https://graphic.com.gh',
      timestamp: new Date().toISOString(),
    },
  ];

  const categories = [
    { id: 'government', name: 'Government', icon: 'government', count: 25 },
    { id: 'economy', name: 'Economy', icon: 'economy', count: 18 },
    { id: 'health', name: 'Health', icon: 'health', count: 12 },
    { id: 'education', name: 'Education', icon: 'education', count: 15 },
    { id: 'technology', name: 'Technology', icon: 'technology', count: 8 },
    { id: 'international', name: 'International', icon: 'international', count: 10 },
    { id: 'sports', name: 'Sports', icon: 'sports', count: 5 },
  ];

  const sources = [
    { id: 'gna', name: 'Ghana News Agency', count: 42 },
    { id: 'graphic', name: 'Daily Graphic', count: 35 },
    { id: 'joy', name: 'Joy News', count: 28 },
    { id: 'citi', name: 'Citi FM', count: 22 },
    { id: 'tv3', name: 'TV3 Ghana', count: 15 },
    { id: 'peacefm', name: 'Peace FM', count: 12 },
  ];

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
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleBookmark = (articleId: string) => {
    // Toggle bookmark
    console.log('Bookmark article:', articleId);
  };

  const handleShare = (article: any) => {
    // Open share dialog
    console.log('Share article:', article);
  };

  // Filter articles based on selection
  const filteredArticles = mockArticles.filter((article) => {
    const matchesSearch = searchQuery
      ? article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesCategory = selectedCategories.length
      ? selectedCategories.includes(article.category.toLowerCase())
      : true;

    const matchesSource = selectedSources.length
      ? selectedSources.some((s) =>
          article.source.toLowerCase().includes(s.toLowerCase())
        )
      : true;

    return matchesSearch && matchesCategory && matchesSource;
  });

  const featuredArticle = filteredArticles.find((a) => a.isTrending);
  const regularArticles = filteredArticles.filter((a) => a !== featuredArticle);

  return (
    <div className="space-y-6">
      {/* Breaking News Banner */}
      {showBreakingNews && mockBreakingNews.length > 0 && (
        <BreakingNews
          items={mockBreakingNews}
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Articles', value: mockArticles.length, icon: Newspaper, color: 'text-primary-600' },
            { label: 'Trending', value: mockArticles.filter(a => a.isTrending).length, icon: TrendingUp, color: 'text-accent-600' },
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <CategoryFilter
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
              onClearAll={() => setSelectedCategories([])}
            />

            <SourceFilter
              sources={sources}
              selectedSources={selectedSources}
              onSourceToggle={handleSourceToggle}
              onClearAll={() => setSelectedSources([])}
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
            <NewsFeed
              articles={regularArticles}
              featuredArticle={featuredArticle}
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
