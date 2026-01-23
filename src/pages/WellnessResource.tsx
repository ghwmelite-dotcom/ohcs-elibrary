import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Eye,
  Bookmark,
  BookmarkCheck,
  FileText,
  Video,
  Headphones,
  Dumbbell,
  Share2,
  ThumbsUp,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { useWellnessStore } from '@/stores/wellnessStore';
import { cn } from '@/utils/cn';
import ReactMarkdown from 'react-markdown';

const typeIcons = {
  article: FileText,
  video: Video,
  audio: Headphones,
  exercise: Dumbbell,
};

const typeColors = {
  article: 'from-blue-500 to-blue-600',
  video: 'from-red-500 to-red-600',
  audio: 'from-purple-500 to-purple-600',
  exercise: 'from-green-500 to-green-600',
};

const categoryLabels: Record<string, string> = {
  stress: 'Stress Management',
  career: 'Career Growth',
  relationships: 'Relationships',
  mindfulness: 'Mindfulness',
  sleep: 'Sleep & Rest',
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function WellnessResource() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentResource,
    fetchResource,
    toggleBookmark,
    isLoading,
    error,
  } = useWellnessStore();

  useEffect(() => {
    if (id) {
      fetchResource(id);
    }
  }, [id, fetchResource]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error || !currentResource) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-surface-500 dark:text-surface-400 mb-4">
            {error || 'Resource not found'}
          </p>
          <Button onClick={() => navigate('/wellness')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wellness
          </Button>
        </div>
      </div>
    );
  }

  const Icon = typeIcons[currentResource.type];
  const color = typeColors[currentResource.type];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Hero header */}
      <div className={cn('bg-gradient-to-br relative', color)}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 sm:mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm sm:text-base">Back</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                <span className="px-2 py-0.5 sm:py-1 rounded-md bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium capitalize">
                  {currentResource.type}
                </span>
                <span className="px-2 py-0.5 sm:py-1 rounded-md bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs">
                  {categoryLabels[currentResource.category] || currentResource.category}
                </span>
                <span className={cn(
                  'px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs capitalize',
                  difficultyColors[currentResource.difficulty]
                )}>
                  {currentResource.difficulty}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                {currentResource.title}
              </h1>
              {currentResource.description && (
                <p className="text-sm sm:text-base text-white/80 max-w-2xl line-clamp-2 sm:line-clamp-none">
                  {currentResource.description}
                </p>
              )}
            </div>
          </motion.div>

          {/* Meta info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 sm:mt-6 text-white/70 text-xs sm:text-sm"
          >
            {currentResource.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {currentResource.duration} min read
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {currentResource.views.toLocaleString()} views
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {currentResource.likes.toLocaleString()} likes
            </span>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 order-2 lg:order-1"
          >
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 sm:p-6 md:p-8">
              {/* Video/Audio player placeholder */}
              {(currentResource.type === 'video' || currentResource.type === 'audio') && currentResource.mediaUrl && (
                <div className="mb-6 rounded-lg overflow-hidden bg-surface-900 aspect-video flex items-center justify-center">
                  {currentResource.type === 'video' ? (
                    <video
                      src={currentResource.mediaUrl}
                      controls
                      className="w-full h-full"
                    />
                  ) : (
                    <audio
                      src={currentResource.mediaUrl}
                      controls
                      className="w-full"
                    />
                  )}
                </div>
              )}

              {/* Article content */}
              {currentResource.content && (
                <div className="prose prose-surface dark:prose-invert max-w-none">
                  <ReactMarkdown>{currentResource.content}</ReactMarkdown>
                </div>
              )}

              {/* Exercise instructions placeholder */}
              {currentResource.type === 'exercise' && !currentResource.content && (
                <div className="text-center py-12 text-surface-500 dark:text-surface-400">
                  <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Exercise instructions coming soon</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 sm:space-y-4 order-1 lg:order-2"
          >
            {/* Actions */}
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-3 sm:p-4 flex lg:flex-col gap-2 sm:gap-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => toggleBookmark(currentResource.id)}
              >
                {currentResource.isBookmarked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 mr-2 text-teal-500" />
                    Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Bookmark
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  navigator.share?.({
                    title: currentResource.title,
                    url: window.location.href,
                  }).catch(() => {});
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Related info */}
            <div className="bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-200 dark:border-teal-800 p-4">
              <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-2">
                Need more support?
              </h3>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                Chat with Dr. Sena (AI) for personalized guidance on this topic.
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => navigate('/wellness/chat')}
              >
                Chat with Dr. Sena
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
