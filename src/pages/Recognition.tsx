import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  Plus,
  TrendingUp,
  Heart,
  Sparkles,
  Filter,
  Calendar,
  Trophy,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/shared/Spinner';
import {
  RecognitionComposer,
  RecognitionFeed,
  RecognitionLeaderboard,
  CategoryBadge,
} from '@/components/recognition';
import { useRecognitionStore } from '@/stores/recognitionStore';
import { useAuthStore } from '@/stores/authStore';

type Tab = 'feed' | 'leaderboard';
type PeriodFilter = 'all' | 'today' | 'week' | 'month';

export default function Recognition() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'feed');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>('all');

  const {
    categories,
    wallSummary,
    limits,
    isLoading,
    fetchCategories,
    fetchWallSummary,
    fetchLimits,
    openComposer,
    setFilter,
  } = useRecognitionStore();

  const { user } = useAuthStore();

  // Initialize data
  useEffect(() => {
    fetchCategories();
    fetchWallSummary();
    if (user) fetchLimits();
  }, [user]);

  // Update filter when category or period changes
  useEffect(() => {
    setFilter({
      categoryId: selectedCategory || undefined,
      period: period === 'all' ? undefined : period,
    });
  }, [selectedCategory, period]);

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== 'feed') {
      searchParams.set('tab', activeTab);
    } else {
      searchParams.delete('tab');
    }
    setSearchParams(searchParams, { replace: true });
  }, [activeTab]);

  const periodOptions: { value: PeriodFilter; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Recognition Composer Modal */}
      <RecognitionComposer />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Award className="w-7 h-7 text-primary-500" />
              Peer Recognition
            </h1>
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              Celebrate your colleagues' achievements and contributions
            </p>
          </div>

          <button
            onClick={() => openComposer()}
            disabled={limits?.remaining === 0}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
              limits?.remaining === 0
                ? 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25'
            )}
          >
            <Plus className="w-5 h-5" />
            Give Recognition
            {limits && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {limits.remaining} left
              </span>
            )}
          </button>
        </div>

        {/* Summary Stats */}
        {wallSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">
                    {wallSummary.totalRecognitions}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Total</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">
                    {wallSummary.totalThisMonth}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">This Month</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">
                    {wallSummary.totalThisWeek}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">This Week</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">
                    {wallSummary.topCategories?.[0]?.count || 0}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                    {wallSummary.topCategories?.[0]?.name || 'Top Category'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-surface-200 dark:border-surface-700">
          <button
            onClick={() => setActiveTab('feed')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'feed'
                ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                : 'text-surface-600 dark:text-surface-400 border-transparent hover:text-surface-900 dark:hover:text-white'
            )}
          >
            <Award className="w-4 h-4" />
            Recognition Feed
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'leaderboard'
                ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                : 'text-surface-600 dark:text-surface-400 border-transparent hover:text-surface-900 dark:hover:text-white'
            )}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'feed' && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Period Filter */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-surface-500" />
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300"
                    >
                      {periodOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-surface-500" />
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value || null)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters */}
                  {(selectedCategory || period !== 'all') && (
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setPeriod('all');
                      }}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {/* Feed */}
                <RecognitionFeed
                  filter={{
                    categoryId: selectedCategory || undefined,
                    period: period === 'all' ? undefined : period,
                  }}
                />
              </>
            )}

            {activeTab === 'leaderboard' && (
              <RecognitionLeaderboard showTabs limit={20} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Categories */}
            {wallSummary?.topCategories && wallSummary.topCategories.length > 0 && (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Trending Categories
                </h3>
                <div className="space-y-2">
                  {wallSummary.topCategories.slice(0, 5).map((cat, index) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setActiveTab('feed');
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                    >
                      <CategoryBadge
                        category={{ name: cat.name, icon: cat.icon, color: cat.color }}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mini Leaderboard (when on feed tab) */}
            {activeTab === 'feed' && (
              <RecognitionLeaderboard compact limit={5} showTabs={false} />
            )}

            {/* Recognition Tips */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl border border-primary-200 dark:border-primary-800 p-4">
              <h3 className="font-semibold text-primary-800 dark:text-primary-200 mb-2">
                Recognition Tips
              </h3>
              <ul className="text-sm text-primary-700 dark:text-primary-300 space-y-2">
                <li>• Be specific about what you're recognizing</li>
                <li>• Explain the impact of their contribution</li>
                <li>• Recognize behaviors, not just results</li>
                <li>• Don't wait - recognize in the moment</li>
              </ul>
            </div>

            {/* Your Monthly Limit */}
            {limits && (
              <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-3">
                  Your Monthly Limit
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-surface-600 dark:text-surface-400">
                    Recognitions used
                  </span>
                  <span className="font-medium text-surface-900 dark:text-white">
                    {limits.recognitionsGiven} / {limits.maxAllowed}
                  </span>
                </div>
                <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      limits.remaining === 0
                        ? 'bg-red-500'
                        : limits.remaining <= 3
                        ? 'bg-amber-500'
                        : 'bg-primary-500'
                    )}
                    style={{ width: `${(limits.recognitionsGiven / limits.maxAllowed) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
                  {limits.remaining > 0
                    ? `${limits.remaining} recognition${limits.remaining !== 1 ? 's' : ''} remaining this month`
                    : 'Limit reached - resets next month'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
