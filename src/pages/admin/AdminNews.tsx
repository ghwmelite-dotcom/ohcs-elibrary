import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  ExternalLink,
  Plus,
  TrendingUp,
  Bookmark,
  RefreshCw,
  Globe,
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

interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: string;
  status: 'active' | 'paused' | 'error';
  articleCount: number;
  lastFetch: Date;
  createdAt: Date;
}

export default function AdminNews() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('sources');
  const [selectedSource, setSelectedSource] = useState<NewsSource | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const stats = [
    { label: 'Active Sources', value: '12', change: '+2', icon: Globe },
    { label: 'Total Articles', value: '3,456', change: '+156', icon: Newspaper },
    { label: 'Articles Today', value: '89', change: '+12', icon: TrendingUp },
    { label: 'User Bookmarks', value: '567', change: '+23', icon: Bookmark },
  ];

  const sources: NewsSource[] = [
    {
      id: '1',
      name: 'Ghana News Agency',
      url: 'https://newsghana.com.gh',
      category: 'General',
      status: 'active',
      articleCount: 1234,
      lastFetch: new Date(Date.now() - 3600000),
      createdAt: new Date(Date.now() - 86400000 * 365),
    },
    {
      id: '2',
      name: 'Daily Graphic',
      url: 'https://graphic.com.gh',
      category: 'General',
      status: 'active',
      articleCount: 987,
      lastFetch: new Date(Date.now() - 7200000),
      createdAt: new Date(Date.now() - 86400000 * 300),
    },
    {
      id: '3',
      name: 'Joy Online',
      url: 'https://myjoyonline.com',
      category: 'General',
      status: 'active',
      articleCount: 876,
      lastFetch: new Date(Date.now() - 1800000),
      createdAt: new Date(Date.now() - 86400000 * 200),
    },
    {
      id: '4',
      name: 'Citi Newsroom',
      url: 'https://citinewsroom.com',
      category: 'General',
      status: 'paused',
      articleCount: 654,
      lastFetch: new Date(Date.now() - 86400000),
      createdAt: new Date(Date.now() - 86400000 * 150),
    },
  ];

  const columns = [
    {
      key: 'name',
      header: 'Source',
      render: (source: NewsSource) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50">{source.name}</p>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              {source.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (source: NewsSource) => (
        <Badge variant="default">{source.category}</Badge>
      ),
    },
    {
      key: 'articles',
      header: 'Articles',
      render: (source: NewsSource) => (
        <span className="font-medium">{source.articleCount.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (source: NewsSource) => {
        const variants: Record<string, any> = {
          active: 'success',
          paused: 'warning',
          error: 'danger',
        };
        return <Badge variant={variants[source.status]}>{source.status}</Badge>;
      },
    },
    {
      key: 'lastFetch',
      header: 'Last Fetch',
      render: (source: NewsSource) => (
        <span className="text-sm text-surface-500">
          {formatDistanceToNow(source.lastFetch, { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (source: NewsSource) => (
        <Dropdown
          items={[
            { label: 'View Articles', icon: Eye, onClick: () => {} },
            { label: 'Refresh Now', icon: RefreshCw, onClick: () => {} },
            { label: source.status === 'active' ? 'Pause' : 'Resume', icon: Globe, onClick: () => {} },
            { label: 'Delete', icon: Trash2, onClick: () => { setSelectedSource(source); setShowDeleteModal(true); }, danger: true },
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
    { id: 'sources', label: 'News Sources', count: sources.length },
    { id: 'articles', label: 'Recent Articles' },
    { id: 'categories', label: 'Categories' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
            News Management
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Manage news sources and article aggregation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh All
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
            Add Source
          </Button>
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
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
          Filters
        </Button>
      </div>

      {/* Sources Table */}
      <DataTable
        data={sources}
        columns={columns}
        searchable={false}
      />

      {/* Add Source Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add News Source"
        size="md"
      >
        <div className="space-y-4">
          <Input label="Source Name" placeholder="e.g., Ghana News Agency" />
          <Input label="RSS/API URL" placeholder="https://example.com/rss" />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Category
            </label>
            <select className="w-full px-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg">
              <option>General</option>
              <option>Politics</option>
              <option>Economy</option>
              <option>Technology</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddModal(false)}>
              Add Source
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete News Source"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-surface-600 dark:text-surface-400">
            Are you sure you want to delete "{selectedSource?.name}"? All associated articles will also be removed.
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
