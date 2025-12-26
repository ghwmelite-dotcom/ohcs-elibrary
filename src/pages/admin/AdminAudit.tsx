import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  User,
  FileText,
  Settings,
  LogIn,
  LogOut,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { Tabs } from '@/components/shared/Tabs';
import { cn } from '@/utils/cn';
import { format, formatDistanceToNow } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  actionType: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'security';
  resource: string;
  resourceId?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  details?: string;
  timestamp: Date;
}

export default function AdminAudit() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  const logs: AuditLog[] = [
    {
      id: '1',
      action: 'User Login',
      actionType: 'login',
      resource: 'Authentication',
      user: { id: '1', name: 'Kwame Asante', email: 'kwame@mof.gov.gh', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
      ipAddress: '41.215.160.1',
      userAgent: 'Chrome 120.0 / Windows 10',
      status: 'success',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      action: 'Document Uploaded',
      actionType: 'create',
      resource: 'Documents',
      resourceId: 'doc-123',
      user: { id: '2', name: 'Ama Serwaa', email: 'ama@moh.gov.gh' },
      ipAddress: '41.215.161.45',
      userAgent: 'Firefox 121.0 / macOS',
      status: 'success',
      details: 'Uploaded: Ghana Health Policy 2024.pdf',
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: '3',
      action: 'Failed Login Attempt',
      actionType: 'security',
      resource: 'Authentication',
      user: { id: '3', name: 'Unknown', email: 'admin@test.com' },
      ipAddress: '185.220.101.5',
      userAgent: 'Unknown',
      status: 'failure',
      details: 'Invalid credentials - Account locked after 5 attempts',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '4',
      action: 'User Role Updated',
      actionType: 'update',
      resource: 'Users',
      resourceId: 'user-456',
      user: { id: '1', name: 'Kwame Asante', email: 'kwame@mof.gov.gh' },
      ipAddress: '41.215.160.1',
      userAgent: 'Chrome 120.0 / Windows 10',
      status: 'success',
      details: 'Changed role from "user" to "moderator" for Kofi Mensah',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: '5',
      action: 'System Settings Modified',
      actionType: 'update',
      resource: 'Settings',
      user: { id: '1', name: 'Kwame Asante', email: 'kwame@mof.gov.gh' },
      ipAddress: '41.215.160.1',
      userAgent: 'Chrome 120.0 / Windows 10',
      status: 'warning',
      details: 'Changed maintenance mode to enabled',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: '6',
      action: 'Document Deleted',
      actionType: 'delete',
      resource: 'Documents',
      resourceId: 'doc-789',
      user: { id: '2', name: 'Ama Serwaa', email: 'ama@moh.gov.gh' },
      ipAddress: '41.215.161.45',
      userAgent: 'Firefox 121.0 / macOS',
      status: 'success',
      details: 'Permanently deleted: Draft_Policy_v1.pdf',
      timestamp: new Date(Date.now() - 172800000),
    },
  ];

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create': return Plus;
      case 'read': return Eye;
      case 'update': return Edit;
      case 'delete': return Trash2;
      case 'login': return LogIn;
      case 'logout': return LogOut;
      case 'security': return AlertTriangle;
      default: return FileText;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'failure': return XCircle;
      case 'warning': return AlertTriangle;
      default: return CheckCircle;
    }
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (log: AuditLog) => (
        <div className="text-sm">
          <p className="font-medium text-surface-900 dark:text-surface-50">
            {format(log.timestamp, 'MMM d, yyyy')}
          </p>
          <p className="text-surface-500">
            {format(log.timestamp, 'HH:mm:ss')}
          </p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: AuditLog) => {
        const Icon = getActionIcon(log.actionType);
        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              log.actionType === 'create' && 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
              log.actionType === 'read' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
              log.actionType === 'update' && 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
              log.actionType === 'delete' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
              log.actionType === 'login' && 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
              log.actionType === 'logout' && 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400',
              log.actionType === 'security' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-surface-900 dark:text-surface-50">{log.action}</p>
              <p className="text-sm text-surface-500">{log.resource}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'user',
      header: 'User',
      render: (log: AuditLog) => (
        <div className="flex items-center gap-2">
          <Avatar src={log.user.avatar} name={log.user.name} size="sm" />
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{log.user.name}</p>
            <p className="text-xs text-surface-500">{log.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (log: AuditLog) => (
        <div className="text-sm">
          {log.details && (
            <p className="text-surface-600 dark:text-surface-400 max-w-xs truncate">{log.details}</p>
          )}
          <p className="text-xs text-surface-400">IP: {log.ipAddress}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (log: AuditLog) => {
        const StatusIcon = getStatusIcon(log.status);
        const variants: Record<string, any> = {
          success: 'success',
          failure: 'danger',
          warning: 'warning',
        };
        return (
          <Badge variant={variants[log.status]} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {log.status}
          </Badge>
        );
      },
    },
  ];

  const tabs = [
    { id: 'all', label: 'All Activity', count: logs.length },
    { id: 'security', label: 'Security', count: logs.filter(l => l.actionType === 'security' || l.status === 'failure').length },
    { id: 'documents', label: 'Documents', count: logs.filter(l => l.resource === 'Documents').length },
    { id: 'users', label: 'Users', count: logs.filter(l => l.resource === 'Users').length },
  ];

  const dateRanges = [
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
  ];

  const filteredLogs = logs.filter(log => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'security') return log.actionType === 'security' || log.status === 'failure';
    if (selectedTab === 'documents') return log.resource === 'Documents';
    if (selectedTab === 'users') return log.resource === 'Users';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50">
            Audit Logs
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            Track all system activity and changes
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
            {dateRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  dateRange === range.id
                    ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-50 shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{logs.length}</p>
              <p className="text-sm text-surface-500">Total Events</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {logs.filter(l => l.status === 'success').length}
              </p>
              <p className="text-sm text-surface-500">Successful</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {logs.filter(l => l.status === 'failure').length}
              </p>
              <p className="text-sm text-surface-500">Failed</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {logs.filter(l => l.actionType === 'security').length}
              </p>
              <p className="text-sm text-surface-500">Security Events</p>
            </div>
          </div>
        </div>
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
            placeholder="Search audit logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
          Filters
        </Button>
      </div>

      {/* Logs Table */}
      <DataTable
        data={filteredLogs}
        columns={columns}
        searchable={false}
      />
    </div>
  );
}
