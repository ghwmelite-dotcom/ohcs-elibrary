import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  ThumbsUp,
  Share2,
  Bookmark,
  BookmarkCheck,
  MoreVertical,
  Flag,
  Pin,
  Lock,
  Edit2,
  Trash2,
  Clock,
  ChevronUp,
} from 'lucide-react';
import { useForumStore } from '@/stores/forumStore';
import { PostThread, PostEditor, CompactCategoryList } from '@/components/forum';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Dropdown } from '@/components/shared/Dropdown';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn } from '@/utils/cn';
import { formatRelativeTime, formatDate } from '@/utils/formatters';

export default function ForumTopic() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { topics, categories, posts, fetchTopicById, fetchPosts, isLoading } = useForumStore();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const topic = topics.find((t) => t.id === id);
  const category = categories.find((c) => c.id === topic?.categoryId);
  const topicPosts = posts.filter((p) => p.topicId === id);

  useEffect(() => {
    if (id) {
      fetchTopicById(id);
      fetchPosts(id);
    }
  }, [id, fetchTopicById, fetchPosts]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Submit reply:', replyContent);
      setReplyContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !topic) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
          Topic Not Found
        </h2>
        <p className="text-surface-500 dark:text-surface-400 mb-6">
          The topic you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/forum')}>Back to Forum</Button>
      </div>
    );
  }

  const menuItems = [
    { label: 'Share', icon: Share2, onClick: () => {} },
    { label: 'Report', icon: Flag, onClick: () => {} },
    ...(topic.author.id === 'current-user'
      ? [
          { label: 'Edit', icon: Edit2, onClick: () => {} },
          { label: 'Delete', icon: Trash2, onClick: () => {}, className: 'text-error-600' },
        ]
      : []),
  ];

  // Mock first post (the topic content)
  const topicPost = {
    id: 'topic-post',
    topicId: topic.id,
    author: topic.author,
    content: `${topic.preview}\n\nThis is the full content of the topic post. It contains detailed information about the subject matter being discussed.\n\nKey points to consider:\n1. First important point\n2. Second important point\n3. Third important point\n\nI would appreciate any insights or feedback from the community on this matter.`,
    createdAt: topic.createdAt,
    likeCount: topic.likeCount,
    dislikeCount: 0,
    isBestAnswer: false,
    isEdited: false,
  };

  const allPosts = [topicPost, ...topicPosts];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm flex-wrap">
        <Link
          to="/forum"
          className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Forum
        </Link>
        {category && (
          <>
            <span className="text-surface-400">/</span>
            <Link
              to={`/forum/category/${category.id}`}
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {category.name}
            </Link>
          </>
        )}
        <span className="text-surface-400">/</span>
        <span className="text-surface-500 dark:text-surface-400 truncate max-w-[200px]">
          {topic.title}
        </span>
      </nav>

      {/* Topic Header */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-start gap-4">
          <Avatar
            src={topic.author.avatar}
            name={topic.author.name}
            size="lg"
            className="hidden sm:block"
          />
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {topic.isPinned && (
                <Badge variant="status" className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {topic.isLocked && (
                <Badge variant="status" className="bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-400">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
              {topic.hasBestAnswer && (
                <Badge variant="success">Solved</Badge>
              )}
              {category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  {category.name}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
              {topic.title}
            </h1>

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-surface-500">
              <span className="flex items-center gap-2 sm:hidden">
                <Avatar
                  src={topic.author.avatar}
                  name={topic.author.name}
                  size="xs"
                />
                {topic.author.name}
              </span>
              <span className="hidden sm:inline">
                by{' '}
                <Link
                  to={`/profile/${topic.author.id}`}
                  className="font-medium text-surface-700 dark:text-surface-300 hover:text-primary-600"
                >
                  {topic.author.name}
                </Link>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatRelativeTime(topic.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {topic.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {topic.replyCount} replies
              </span>
            </div>

            {/* Tags */}
            {topic.tags && topic.tags.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {topic.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant={isBookmarked ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </Button>
            <Dropdown items={menuItems} align="right">
              <button className="p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Posts */}
        <div className="lg:col-span-3 space-y-6">
          <PostThread
            posts={allPosts}
            topicAuthorId={topic.author.id}
            currentUserId="current-user"
            onLike={(postId) => console.log('Like:', postId)}
            onDislike={(postId) => console.log('Dislike:', postId)}
            onReply={(postId, content) => console.log('Reply to:', postId, content)}
            onEdit={(postId, content) => console.log('Edit:', postId, content)}
            onDelete={(postId) => console.log('Delete:', postId)}
            onMarkBestAnswer={(postId) => console.log('Best answer:', postId)}
            onQuote={(postId) => console.log('Quote:', postId)}
          />

          {/* Reply Editor */}
          {!topic.isLocked ? (
            <div id="reply">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Post a Reply
              </h3>
              <PostEditor
                value={replyContent}
                onChange={setReplyContent}
                placeholder="Write your reply..."
                minHeight="150px"
                onSubmit={handleSubmitReply}
                isSubmitting={isSubmitting}
                submitLabel="Post Reply"
              />
            </div>
          ) : (
            <div className="bg-surface-100 dark:bg-surface-700/50 rounded-xl p-6 text-center">
              <Lock className="w-8 h-8 text-surface-400 mx-auto mb-2" />
              <p className="text-surface-600 dark:text-surface-400">
                This topic is locked. New replies are not allowed.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CompactCategoryList
            categories={categories}
            selectedCategory={topic.categoryId}
            onSelect={(catId) => {
              if (catId) {
                navigate(`/forum/category/${catId}`);
              } else {
                navigate('/forum');
              }
            }}
          />

          {/* Related Topics - mock */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Related Topics
            </h3>
            <ul className="space-y-3">
              {topics.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/forum/topic/${t.id}`}
                    className="text-sm text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2"
                  >
                    {t.title}
                  </Link>
                  <p className="text-xs text-surface-400 mt-1">
                    {t.replyCount} replies &bull; {formatRelativeTime(t.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showScrollTop ? 1 : 0, scale: showScrollTop ? 1 : 0.8 }}
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 p-3 bg-primary-600 text-white rounded-full shadow-elevation-3 hover:bg-primary-700 transition-colors z-40"
      >
        <ChevronUp className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
