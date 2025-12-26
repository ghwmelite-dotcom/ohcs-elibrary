import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Shield,
  Plus,
  TrendingUp,
  UserPlus,
  Lock,
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
import { Avatar, AvatarGroup } from '@/components/shared/Avatar';
import { formatDistanceToNow } from 'date-fns';

interface Group {
  id: string;
  name: string;
  description: string;
  type: 'open' | 'closed' | 'private' | 'official';
  memberCount: number;
  postCount: number;
  status: 'active' | 'inactive' | 'flagged';
  owner: { name: string; avatar?: string };
  createdAt: Date;
  lastActivity: Date;
}

export default function AdminGroups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const stats = [
    { label: 'Total Groups', value: '156', change: '+8', icon: Users },
    { label: 'Active Members', value: '2,345', change: '+12%', icon: UserPlus },
    { label: 'Posts This Week', value: '892', change: '+15%', icon: TrendingUp },
    { label: 'Official Groups', value: '23', change: '+2', icon: Shield },
  ];

  const groups: Group[] = [
    {
      id: '1',
      name: 'IT Officers Network',
      description: 'A community for IT professionals across all MDAs',
      type: 'official',
      memberCount: 234,
      postCount: 456,
      status: 'active',
      owner: { name: 'Kwame Asante', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
      createdAt: new Date(Date.now() - 86400000 * 180),
      lastActivity: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      name: 'Policy Research Group',
      description: 'Discussing and analyzing government policies',
      type: 'closed',
      memberCount: 89,
      postCount: 234,
      status: 'active',
      owner: { name: 'Ama Serwaa' },
      createdAt: new Date(Date.now() - 86400000 * 120),
      lastActivity: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      name: 'Young Civil Servants',
      description: 'Networking group for new civil servants',
      type: 'open',
      memberCount: 567,
      postCount: 1234,
      status: 'active',
      owner: { name: 'Kofi Mensah' },
      createdAt: new Date(Date.now() - 86400000 * 90),
      lastActivity: new Date(Date.now() - 1800000),
    },
  ];

  const columns = [
    {
      key: 'name',
      header: 'Group',
      render: (group: Group) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50">{group.name}</p>
            <p className="text-sm text-surface-500 truncate max-w-xs">{group.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (group: Group) => {
        const variants: Record<string, any> = {
          open: 'success',
          closed: 'warning',
          private: 'danger',
          official: 'primary',
        };
        const icons: Record<string, any> = {
          open: Globe,
          closed: Lock,
          private: Lock,
          official: Shield,
        };
        const Icon = icons[group.type];
        return (
          <Badge variant={variants[group.type]} className="flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {group.type}
          </Badge>
        );
      },
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (group: Group) => (
        <div className="flex items-center gap-2">
          <Avatar src={group.owner.avatar} name={group.owner.name} size="sm" />
          <span className="text-sm">{group.owner.name}</span>
        </div>
      ),
    },
    {
      key: 'members',
      header: 'Members',
      render: (group: Group) => (
        <span className="font-medium">{group.memberCount}</span>
      ),
    },
    {
      key: 'posts',
      header: 'Posts',
      render: (group: Group) => (
        <span>{group.postCount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (group: Group) => {
        const variants: Record<string, any> = {
          active: 'success',
          inactive: 'default',
          flagged: 'danger',
        };
        return <Badge variant={variants[group.status]}>{group.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (group: Group) => (
        <Dropdown
          items={[
            { label: 'View Group', icon: Eye, onClick: () => {} },
            { label: 'Manage Members', icon: Users, onClick: () => {} },
            { label: 'Make Official', icon: Shield, onClick: () => {} },
            { label: 'Delete', icon: Trash2, onClick: () => { setSelectedGroup(group); setShowDeleteModal(true); }, danger: true },
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
    { id: 'all', label: 'All Groups', count: groups.length },
    { id: 'official', label: 'Official', count: groups.filter(g => g.type === 'official').length },
    { id: 'flagged', label: 'Flagged', count: 0 },
    { id: 'pending', label: 'Pending Approval' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
            Groups Management
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Manage user groups and communities
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>
          Create Official Group
        </Button>
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
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
          Filters
        </Button>
      </div>

      {/* Groups Table */}
      <DataTable
        data={groups}
        columns={columns}
        searchable={false}
      />

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Group"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-surface-600 dark:text-surface-400">
            Are you sure you want to delete "{selectedGroup?.name}"? All posts and members will be removed.
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
