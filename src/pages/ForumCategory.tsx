import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  GraduationCap,
  Laptop,
  Users,
  MapPin,
  Megaphone,
  Lightbulb,
  LucideIcon,
} from 'lucide-react';
import { useForumStore } from '@/stores/forumStore';

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  FileText,
  GraduationCap,
  Laptop,
  Users,
  MapPin,
  Megaphone,
  Lightbulb,
};

function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || MessageSquare;
}
import {
  TopicList,
  CategoryStats,
  CompactCategoryList,
  NewTopicModal,
} from '@/components/forum';
import { Skeleton } from '@/components/shared/Skeleton';

export default function ForumCategory() {
  const { categoryId: id } = useParams<{ categoryId: string }>();
  const {
    categories,
    topics,
    fetchCategories,
    fetchTopics,
    isLoading,
  } = useForumStore();
  const [showNewTopic, setShowNewTopic] = useState(false);

  const category = categories.find((c) => c.id === id);
  const categoryTopics = topics.filter((t) => t.categoryId === id);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchTopics(id);
    }
  }, [fetchCategories, fetchTopics, id]);

  if (isLoading && !category) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
          Category Not Found
        </h2>
        <p className="text-surface-500 dark:text-surface-400 mb-6">
          The category you're looking for doesn't exist.
        </p>
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forum
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/forum"
          className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Forum
        </Link>
        <span className="text-surface-400">/</span>
        <span className="text-surface-500 dark:text-surface-400">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {(() => {
            const IconComponent = getIconComponent(category.icon || 'MessageSquare');
            return (
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: category.color }} />
              </div>
            );
          })()}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-surface-900 dark:text-surface-50 truncate">
              {category.name}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-surface-600 dark:text-surface-400 line-clamp-2">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Mobile: Category Stats (shown first on mobile) */}
        <div className="lg:hidden">
          <CategoryStats
            category={{
              name: category.name,
              icon: category.icon || '',
              color: category.color || '#6B7280',
              topicCount: category.topicCount,
              postCount: category.postCount,
              lastActivity: category.lastActivityAt ? {
                topicTitle: 'Recent activity',
                userName: 'User',
                timestamp: category.lastActivityAt,
              } : undefined,
            }}
          />
        </div>

        {/* Topics */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <TopicList
            topics={categoryTopics}
            categories={categories}
            isLoading={isLoading}
            onNewTopic={() => setShowNewTopic(true)}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block space-y-6 order-1 lg:order-2">
          <CategoryStats
            category={{
              name: category.name,
              icon: category.icon || '',
              color: category.color || '#6B7280',
              topicCount: category.topicCount,
              postCount: category.postCount,
              lastActivity: category.lastActivityAt ? {
                topicTitle: 'Recent activity',
                userName: 'User',
                timestamp: category.lastActivityAt,
              } : undefined,
            }}
          />

          <CompactCategoryList
            categories={categories}
            selectedCategory={id}
            onSelect={(catId) => {
              if (catId) {
                window.location.href = `/forum/category/${catId}`;
              } else {
                window.location.href = '/forum';
              }
            }}
          />
        </div>
      </div>

      {/* New Topic Modal */}
      <NewTopicModal
        isOpen={showNewTopic}
        onClose={() => setShowNewTopic(false)}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        onSubmit={(data) => {
          console.log('Create topic:', data);
          setShowNewTopic(false);
        }}
      />
    </div>
  );
}
