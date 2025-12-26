import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Lock,
  Pin,
  Flag,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Badge } from '@/components/shared/Badge';
import { Modal } from '@/components/shared/Modal';
import { Dropdown } from '@/components/shared/Dropdown';
import { Tabs } from '@/components/shared/Tabs';
import { formatDistanceToNow } from 'date-fns';

interface ForumTopic {
  id: string;
  title: string;
  author: string;
  category: string;
  replies: number;
  views: number;
  status: 'active' | 'locked' | 'flagged' | 'hidden';
  isPinned: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export default function AdminForum() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const stats = [
    { label: 'Total Topics', value: '1,234', change: '+12%', icon: MessageSquare },
    { label: 'Active Discussions', value: '89', change: '+5%', icon: TrendingUp },
    { label: 'Flagged Content', value: '7', change: '-3', icon: Flag, negative: true },
    { label: 'Active Users', value: '456', change: '+8%', icon: Users },
  ];

  const topics: ForumTopic[] = [
    {
      id: '1',
      title: 'Best practices for digital document management',
      author: 'Kwame Asante',
      category: 'Best Practices',
      replies: 24,
      views: 456,
      status: 'active',
      isPinned: true,
      createdAt: new Date(Date.now() - 86400000 * 7),
      lastActivity: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      title: 'How to implement e-services in your MDA',
      author: 'Ama Serwaa',
      category: 'How-To Guides',
      replies: 18,
      views: 312,
      status: 'active',
      isPinned: false,
      createdAt: new Date(Date.now() - 86400000 * 5),
      lastActivity: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      title: 'Inappropriate content discussion',
      author: 'Anonymous',
      category: 'General',
      replies: 5,
      views: 89,
      status: 'flagged',
      isPinned: false,
      createdAt: new Date(Date.now() - 86400000 * 2),
      lastActivity: new Date(Date.now() - 86400000),
    },
  ];

  const columns = [
    {
      key: 'title',
      header: 'Topic',
      render: (topic: ForumTopic) => (
        <div className="flex items-center gap-2">
          {topic.isPinned && <Pin className="w-4 h-4 text-primary-600" />}
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50">{topic.title}</p>
            <p className="text-sm text-surface-500">by {topic.author}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (topic: ForumTopic) => (
        <Badge variant="default">{topic.category}</Badge>
      ),
    },
    {
      key: 'stats',
      header: 'Activity',
      render: (topic: ForumTopic) => (
        <div className="text-sm">
          <p>{topic.replies} replies</p>
          <p className="text-surface-500">{topic.views} views</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (topic: ForumTopic) => {
        const variants: Record<string, any> = {
          active: 'success',
          locked: 'warning',
          flagged: 'danger',
          hidden: 'default',
        };
        return <Badge variant={variants[topic.status]}>{topic.status}</Badge>;
      },
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      render: (topic: ForumTopic) => (
        <span className="text-sm text-surface-500">
          {formatDistanceToNow(topic.lastActivity, { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (topic: ForumTopic) => (
        <Dropdown
          items={[
            { label: 'View Topic', icon: Eye, onClick: () => {} },
            { label: topic.isPinned ? 'Unpin' : 'Pin', icon: Pin, onClick: () => {} },
            { label: topic.status === 'locked' ? 'Unlock' : 'Lock', icon: Lock, onClick: () => {} },
            { label: 'Delete', icon: Trash2, onClick: () => { setSelectedTopic(topic); setShowDeleteModal(true); }, danger: true },
          ]}
          align="right"
        >
          <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
            <MoreVertical className="w-4 h-4" />
          </button>
        </Dropdown>
      ),
    },
  ];

  const tabs = [
    { id: 'topics', label: 'All Topics', count: topics.length },
    { id: 'flagged', label: 'Flagged', count: topics.filter(t => t.status === 'flagged').length },
    { id: 'categories', label: 'Categories' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
            Forum Management
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Manage forum topics, categories, and moderation
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={selectedTab}
        onChange={setSelectedTab}
      />

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
          Filters
        </Button>
      </div>

      {/* Topics Table */}
      <DataTable
        data={topics}
        columns={columns}
        searchable={false}
      />

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Topic"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-surface-600 dark:text-surface-400">
            Are you sure you want to delete "{selectedTopic?.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(false)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
