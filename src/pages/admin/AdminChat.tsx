import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Ban,
  Users,
  Hash,
  TrendingUp,
  AlertTriangle,
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

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'mda';
  memberCount: number;
  messageCount: number;
  status: 'active' | 'archived' | 'flagged';
  createdAt: Date;
  lastActivity: Date;
}

export default function AdminChat() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('rooms');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const stats = [
    { label: 'Active Rooms', value: '45', change: '+3', icon: Hash },
    { label: 'Online Users', value: '234', change: '+15%', icon: Users },
    { label: 'Messages Today', value: '1,892', change: '+23%', icon: MessageCircle },
    { label: 'Flagged Messages', value: '3', change: '-2', icon: AlertTriangle, negative: true },
  ];

  const rooms: ChatRoom[] = [
    {
      id: '1',
      name: 'General Discussion',
      description: 'Public chat room for all civil servants',
      type: 'public',
      memberCount: 456,
      messageCount: 12453,
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 90),
      lastActivity: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      name: 'Ministry of Finance',
      description: 'Official chat for MoF staff',
      type: 'mda',
      memberCount: 89,
      messageCount: 4532,
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 60),
      lastActivity: new Date(Date.now() - 600000),
    },
    {
      id: '3',
      name: 'IT Officers Group',
      description: 'Technical discussions for IT professionals',
      type: 'private',
      memberCount: 45,
      messageCount: 2341,
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 30),
      lastActivity: new Date(Date.now() - 1800000),
    },
  ];

  const columns = [
    {
      key: 'name',
      header: 'Room',
      render: (room: ChatRoom) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50">{room.name}</p>
            <p className="text-sm text-surface-500 truncate max-w-xs">{room.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (room: ChatRoom) => {
        const variants: Record<string, any> = {
          public: 'success',
          private: 'warning',
          mda: 'primary',
        };
        return <Badge variant={variants[room.type]}>{room.type}</Badge>;
      },
    },
    {
      key: 'members',
      header: 'Members',
      render: (room: ChatRoom) => (
        <span className="font-medium">{room.memberCount}</span>
      ),
    },
    {
      key: 'messages',
      header: 'Messages',
      render: (room: ChatRoom) => (
        <span>{room.messageCount.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (room: ChatRoom) => {
        const variants: Record<string, any> = {
          active: 'success',
          archived: 'default',
          flagged: 'danger',
        };
        return <Badge variant={variants[room.status]}>{room.status}</Badge>;
      },
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      render: (room: ChatRoom) => (
        <span className="text-sm text-surface-500">
          {formatDistanceToNow(room.lastActivity, { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (room: ChatRoom) => (
        <Dropdown
          items={[
            { label: 'View Room', icon: Eye, onClick: () => {} },
            { label: 'Manage Members', icon: Users, onClick: () => {} },
            { label: 'Archive', icon: Ban, onClick: () => {} },
            { label: 'Delete', icon: Trash2, onClick: () => { setSelectedRoom(room); setShowDeleteModal(true); }, danger: true },
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
    { id: 'rooms', label: 'Chat Rooms', count: rooms.length },
    { id: 'flagged', label: 'Flagged Messages', count: 3 },
    { id: 'reports', label: 'User Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
            Chat Management
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Manage chat rooms, messages, and moderation
          </p>
        </div>
        <Button leftIcon={<Hash className="w-4 h-4" />}>
          Create Room
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
            placeholder="Search chat rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
          Filters
        </Button>
      </div>

      {/* Rooms Table */}
      <DataTable
        data={rooms}
        columns={columns}
        searchable={false}
      />

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Chat Room"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-surface-600 dark:text-surface-400">
            Are you sure you want to delete "{selectedRoom?.name}"? All messages will be permanently deleted.
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
