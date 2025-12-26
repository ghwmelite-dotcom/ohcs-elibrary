import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Shield,
  Ban,
  Mail,
  Download
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataTable } from '@/components/admin';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  mda: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  xp: number;
  level: number;
}

export default function AdminUsers() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Kwame Asante',
      email: 'kwame.asante@ohcs.gov.gh',
      role: 'civil_servant',
      mda: 'Office of the Head of Civil Service',
      status: 'active',
      lastLogin: '2024-01-15T10:30:00Z',
      createdAt: '2023-06-15',
      xp: 10200,
      level: 6,
    },
    {
      id: '2',
      name: 'Ama Serwaa',
      email: 'ama.serwaa@psc.gov.gh',
      role: 'moderator',
      mda: 'Public Services Commission',
      status: 'active',
      lastLogin: '2024-01-15T09:45:00Z',
      createdAt: '2023-05-20',
      xp: 14850,
      level: 8,
    },
    {
      id: '3',
      name: 'Kofi Mensah',
      email: 'kofi.mensah@mof.gov.gh',
      role: 'civil_servant',
      mda: 'Ministry of Finance',
      status: 'inactive',
      lastLogin: '2024-01-10T14:20:00Z',
      createdAt: '2023-08-01',
      xp: 5400,
      level: 4,
    },
    {
      id: '4',
      name: 'Abena Pokua',
      email: 'abena.pokua@moh.gov.gh',
      role: 'admin',
      mda: 'Ministry of Health',
      status: 'active',
      lastLogin: '2024-01-15T11:00:00Z',
      createdAt: '2023-03-10',
      xp: 18500,
      level: 9,
    },
    {
      id: '5',
      name: 'Yaw Boateng',
      email: 'yaw.boateng@moe.gov.gh',
      role: 'civil_servant',
      mda: 'Ministry of Education',
      status: 'suspended',
      lastLogin: '2024-01-05T08:30:00Z',
      createdAt: '2023-09-25',
      xp: 2100,
      level: 2,
    },
  ];

  const columns = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar} name={user.name} size="sm" />
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50">
              {user.name}
            </p>
            <p className="text-xs text-surface-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user: User) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium capitalize',
          user.role === 'admin' && 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
          user.role === 'moderator' && 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
          user.role === 'civil_servant' && 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
          user.role === 'guest' && 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300'
        )}>
          {user.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'mda',
      header: 'MDA',
      sortable: true,
      render: (user: User) => (
        <span className="text-sm text-surface-600 dark:text-surface-400 truncate max-w-[200px] block">
          {user.mda}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user: User) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium capitalize',
          user.status === 'active' && 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
          user.status === 'inactive' && 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
          user.status === 'suspended' && 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300'
        )}>
          {user.status}
        </span>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      sortable: true,
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {user.level}
          </span>
          <span className="text-sm text-surface-600 dark:text-surface-400">
            {user.xp.toLocaleString()} XP
          </span>
        </div>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      sortable: true,
      render: (user: User) => (
        <span className="text-sm text-surface-500">
          {new Date(user.lastLogin).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const handleExport = () => {
    console.log('Exporting users...');
  };

  const renderActions = (user: User) => (
    <div className="relative group">
      <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded transition-colors">
        <MoreHorizontal className="w-5 h-5 text-surface-500" />
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-surface-800 rounded-lg shadow-elevation-3 py-1 z-10 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
          <Shield className="w-4 h-4" />
          Change Role
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700">
          <Mail className="w-4 h-4" />
          Send Email
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warning-600 dark:text-warning-400 hover:bg-surface-50 dark:hover:bg-surface-700">
          <Ban className="w-4 h-4" />
          Suspend
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-surface-50 dark:hover:bg-surface-700">
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              User Management
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Manage platform users and their permissions
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: mockUsers.length, color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' },
            { label: 'Active', value: mockUsers.filter(u => u.status === 'active').length, color: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400' },
            { label: 'Inactive', value: mockUsers.filter(u => u.status === 'inactive').length, color: 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400' },
            { label: 'Suspended', value: mockUsers.filter(u => u.status === 'suspended').length, color: 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn('p-4 rounded-xl', stat.color.split(' ')[0], stat.color.split(' ')[1])}
            >
              <p className={cn('text-2xl font-bold', stat.color.split(' ').slice(2).join(' '))}>
                {stat.value}
              </p>
              <p className="text-sm opacity-80">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={mockUsers}
          keyField="id"
          selectable
          onSelectionChange={setSelectedUsers}
          actions={renderActions}
          onExport={handleExport}
          searchPlaceholder="Search users..."
        />

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-900 dark:bg-surface-700 text-white px-6 py-3 rounded-full shadow-elevation-3 flex items-center gap-4"
          >
            <span className="text-sm">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                Send Email
              </button>
              <button className="px-3 py-1 text-sm bg-warning-600 hover:bg-warning-700 rounded-lg transition-colors">
                Suspend
              </button>
              <button className="px-3 py-1 text-sm bg-error-600 hover:bg-error-700 rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
