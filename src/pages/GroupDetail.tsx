import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Settings,
  Share2,
  MoreVertical,
  Bell,
  BellOff,
  LogOut,
  UserPlus,
  Image as ImageIcon,
  File,
  Send,
  Calendar,
  Pin,
  Globe,
  Lock,
  Shield,
} from 'lucide-react';
import { useGroupsStore } from '@/stores/groupsStore';
import { useAuthStore } from '@/stores/authStore';
import { GroupPost, MemberList, PostComposer } from '@/components/groups';
import { Avatar, AvatarGroup } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { Tabs } from '@/components/shared/Tabs';
import { Dropdown } from '@/components/shared/Dropdown';
import { Modal } from '@/components/shared/Modal';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/formatters';

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    groups,
    currentGroup,
    posts,
    comments,
    members,
    fetchGroup,
    fetchPosts,
    fetchMembers,
    fetchComments,
    joinGroup,
    leaveGroup,
    createPost,
    createComment,
    likePost,
    unlikePost,
    toggleReaction,
    toggleCommentReaction,
  } = useGroupsStore();

  const [activeTab, setActiveTab] = useState('posts');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  // Use currentGroup if it matches the groupId, otherwise look in groups array
  const group = currentGroup?.id === groupId ? currentGroup : groups.find((g) => g.id === groupId);
  const groupPosts = posts.filter((p) => p.groupId === groupId);
  const groupMembers = members;

  useEffect(() => {
    if (!groupId) return;

    let isMounted = true;
    setLoading(true);

    const load = async () => {
      try {
        await fetchGroup(groupId);
      } catch (e) { /* ignore */ }
      try {
        await fetchPosts(groupId);
      } catch (e) { /* ignore */ }
      try {
        await fetchMembers(groupId);
      } catch (e) { /* ignore */ }

      if (isMounted) {
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  const handleCreatePost = async (content: string, attachments?: any[]) => {
    if (!groupId) return;
    await createPost(groupId, content, attachments);
  };

  const handleExpandComments = async (postId: string) => {
    if (!expandedPosts.has(postId)) {
      await fetchComments(postId);
      setExpandedPosts((prev) => new Set(prev).add(postId));
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) {
      await unlikePost(postId);
    } else {
      await likePost(postId);
    }
  };

  const handleReaction = async (postId: string, emoji: string) => {
    await toggleReaction(postId, emoji);
  };

  const handleCommentReaction = async (commentId: string, emoji: string) => {
    await toggleCommentReaction(commentId, emoji);
  };

  const handleCreateComment = async (postId: string, content: string) => {
    await createComment(postId, content);
  };

  // Show loading skeleton while loading
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Only show "not found" after load completes and group is still missing
  if (!group) {
    return (
      <div className="text-center py-16">
        <Users className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
          Group Not Found
        </h2>
        <p className="text-surface-500 mb-6">
          The group you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/groups')}>Browse Groups</Button>
      </div>
    );
  }

  const getTypeIcon = () => {
    switch (group.type) {
      case 'private':
        return <Lock className="w-4 h-4" />;
      case 'official':
        return <Shield className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'posts', label: 'Posts', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'members', label: `Members (${group.memberCount})`, icon: <Users className="w-4 h-4" /> },
    { id: 'files', label: 'Files', icon: <File className="w-4 h-4" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
  ];

  const isAdmin = group.memberRole === 'admin' || group.memberRole === 'owner';
  const currentUserId = user?.id || 'current-user';

  const menuItems = [
    { label: 'Mute', icon: BellOff, onClick: () => {} },
    { label: 'Share Group', icon: Share2, onClick: () => {} },
    ...(isAdmin
      ? [{ label: 'Group Settings', icon: Settings, onClick: () => {} }]
      : []),
    {
      label: 'Leave Group',
      icon: LogOut,
      onClick: () => leaveGroup(group.id),
      className: 'text-error-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/groups"
          className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Groups
        </Link>
        <span className="text-surface-400">/</span>
        <span className="text-surface-500 dark:text-surface-400">{group.name}</span>
      </nav>

      {/* Cover & Header */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
        {/* Cover */}
        <div
          className="h-48 relative"
          style={{
            backgroundColor: group.coverColor || (group.coverImage?.startsWith('#') ? group.coverImage : '#006B3F'),
            backgroundImage: group.coverImage && !group.coverImage.startsWith('#') ? `url(${group.coverImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Type Badge */}
          <span className="absolute top-4 right-4 text-sm px-3 py-1 bg-white/90 dark:bg-surface-800/90 rounded-full flex items-center gap-1.5 font-medium capitalize">
            {getTypeIcon()}
            {group.type}
          </span>
        </div>

        {/* Group Info */}
        <div className="p-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            {group.avatar ? (
              <Avatar
                src={group.avatar}
                name={group.name}
                size="xl"
                className="ring-4 ring-white dark:ring-surface-800 w-24 h-24"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-primary-500 flex items-center justify-center ring-4 ring-white dark:ring-surface-800">
                <span className="text-4xl text-white font-bold">
                  {group.name.charAt(0)}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 mt-8 sm:mt-0">
              <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
                {group.name}
              </h1>
              <p className="mt-1 text-surface-600 dark:text-surface-400">
                {group.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-surface-500">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {group.memberCount} members
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {group.postCount} posts
                </span>
                <span>Created {formatDate(group.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {group.isJoined ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteModal(true)}
                    leftIcon={<UserPlus className="w-5 h-5" />}
                  >
                    Invite
                  </Button>
                  <Dropdown items={menuItems} align="right">
                    <button className="p-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                      <MoreVertical className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                    </button>
                  </Dropdown>
                </>
              ) : (
                <Button onClick={() => joinGroup(group.id)} leftIcon={<UserPlus className="w-5 h-5" />}>
                  {group.type === 'closed' ? 'Request to Join' : 'Join Group'}
                </Button>
              )}
            </div>
          </div>

          {/* Member Avatars */}
          <div className="mt-4 flex items-center gap-3">
            <AvatarGroup
              users={groupMembers.slice(0, 6).map((m) => ({
                id: m.id,
                name: m.displayName || 'Member',
                avatar: m.avatar,
              }))}
              max={6}
              size="sm"
            />
            {group.memberCount > 6 && (
              <span className="text-sm text-surface-500">
                +{group.memberCount - 6} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'posts' && (
            <>
              {/* Create Post with PostComposer */}
              {group.isJoined && groupId && (
                <PostComposer
                  groupId={groupId}
                  onSubmit={handleCreatePost}
                  placeholder="Share something with the group..."
                />
              )}

              {/* Posts */}
              <div className="space-y-4">
                {groupPosts.length === 0 ? (
                  <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-surface-600 dark:text-surface-400">
                      No posts yet. Be the first to share something!
                    </p>
                  </div>
                ) : (
                  groupPosts.map((post) => {
                    const postComments = comments.filter((c) => c.postId === post.id);
                    return (
                      <GroupPost
                        key={post.id}
                        post={post}
                        comments={postComments}
                        isOwnPost={post.authorId === currentUserId}
                        isPinned={post.isPinned}
                        onLike={() => handleLike(post.id, post.isLiked ?? false)}
                        onReact={(emoji) => handleReaction(post.id, emoji)}
                        onComment={(content) => handleCreateComment(post.id, content)}
                        onCommentReact={(commentId, emoji) => handleCommentReaction(commentId, emoji)}
                        onShare={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/groups/${groupId}/posts/${post.id}`);
                        }}
                      />
                    );
                  })
                )}
              </div>
            </>
          )}

          {activeTab === 'members' && (
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
              <MemberList
                members={groupMembers}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                onMessage={(memberId) => navigate(`/messages/${memberId}`)}
              />
            </div>
          )}

          {activeTab === 'files' && (
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-8 text-center">
              <File className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-surface-600 dark:text-surface-400">
                No files shared yet
              </p>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-8 text-center">
              <Calendar className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-surface-600 dark:text-surface-400">
                No upcoming events
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* About */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-3">
              About
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
              {group.description}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">Type</span>
                <span className="font-medium text-surface-700 dark:text-surface-300 capitalize flex items-center gap-1">
                  {getTypeIcon()}
                  {group.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Created</span>
                <span className="font-medium text-surface-700 dark:text-surface-300">
                  {formatDate(group.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Posts</span>
                <span className="font-medium text-surface-700 dark:text-surface-300">
                  {group.postCount}
                </span>
              </div>
            </div>
          </div>

          {/* Admins */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-4">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-3">
              Admins
            </h3>
            <div className="space-y-2">
              {groupMembers
                .filter((m) => m.role === 'admin' || m.role === 'owner')
                .slice(0, 3)
                .map((admin) => (
                  <Link
                    key={admin.id}
                    to={`/profile/${admin.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <Avatar src={admin.avatar} name={admin.displayName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                        {admin.displayName}
                      </p>
                      <p className="text-xs text-surface-500 capitalize">
                        {admin.role}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Members"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-surface-600 dark:text-surface-400">
            Share this link to invite people to join the group:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/groups/${group.id}/join`}
              className="flex-1 px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-lg text-sm"
            />
            <Button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/groups/${group.id}/join`)}
            >
              Copy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
