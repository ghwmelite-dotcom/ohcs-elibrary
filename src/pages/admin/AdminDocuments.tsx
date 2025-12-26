import { useState } from 'react';
import {
  FileText,
  Upload,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Download,
  Shield,
  Star
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataTable, StatCard } from '@/components/admin';
import { cn } from '@/utils/cn';

interface Document {
  id: string;
  title: string;
  category: string;
  author: string;
  mda: string;
  accessLevel: string;
  downloads: number;
  views: number;
  rating: number;
  status: 'published' | 'draft' | 'archived' | 'pending';
  createdAt: string;
  fileSize: string;
}

export default function AdminDocuments() {
  const mockDocuments: Document[] = [
    {
      id: '1',
      title: 'Annual Budget Guidelines 2024',
      category: 'Policy Documents',
      author: 'Kwame Asante',
      mda: 'Ministry of Finance',
      accessLevel: 'public',
      downloads: 1245,
      views: 3420,
      rating: 4.5,
      status: 'published',
      createdAt: '2024-01-10',
      fileSize: '2.4 MB',
    },
    {
      id: '2',
      title: 'Civil Service Training Manual',
      category: 'Training Materials',
      author: 'Ama Serwaa',
      mda: 'Public Services Commission',
      accessLevel: 'internal',
      downloads: 892,
      views: 2150,
      rating: 4.8,
      status: 'published',
      createdAt: '2024-01-08',
      fileSize: '5.1 MB',
    },
    {
      id: '3',
      title: 'Health Sector Performance Report Q4',
      category: 'Reports',
      author: 'Kofi Mensah',
      mda: 'Ministry of Health',
      accessLevel: 'restricted',
      downloads: 156,
      views: 420,
      rating: 4.2,
      status: 'pending',
      createdAt: '2024-01-12',
      fileSize: '1.8 MB',
    },
  ];

  const columns = [
    {
      key: 'title',
      header: 'Document',
      sortable: true,
      render: (doc: Document) => (
        <div>
          <p className="font-medium text-surface-900 dark:text-surface-50">
            {doc.title}
          </p>
          <p className="text-xs text-surface-500">{doc.category} • {doc.fileSize}</p>
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      sortable: true,
    },
    {
      key: 'accessLevel',
      header: 'Access',
      render: (doc: Document) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium capitalize',
          doc.accessLevel === 'public' && 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
          doc.accessLevel === 'internal' && 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
          doc.accessLevel === 'restricted' && 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
          doc.accessLevel === 'confidential' && 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300'
        )}>
          {doc.accessLevel}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc: Document) => (
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium capitalize',
          doc.status === 'published' && 'bg-success-100 text-success-700',
          doc.status === 'draft' && 'bg-surface-100 text-surface-700',
          doc.status === 'pending' && 'bg-warning-100 text-warning-700',
          doc.status === 'archived' && 'bg-surface-200 text-surface-600'
        )}>
          {doc.status}
        </span>
      ),
    },
    {
      key: 'downloads',
      header: 'Downloads',
      sortable: true,
      render: (doc: Document) => doc.downloads.toLocaleString(),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (doc: Document) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-secondary-500 fill-secondary-500" />
          <span>{doc.rating}</span>
        </div>
      ),
    },
  ];

  const renderActions = (doc: Document) => (
    <div className="flex items-center gap-1">
      <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded" title="View">
        <Eye className="w-4 h-4 text-surface-500" />
      </button>
      <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded" title="Edit">
        <Edit2 className="w-4 h-4 text-surface-500" />
      </button>
      <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded" title="Delete">
        <Trash2 className="w-4 h-4 text-error-500" />
      </button>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              Document Management
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Manage and moderate platform documents
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Documents" value={1523} change={8.3} icon={FileText} color="primary" />
          <StatCard title="Published" value={1245} icon={Eye} color="success" />
          <StatCard title="Pending Review" value={45} icon={Shield} color="warning" />
          <StatCard title="Downloads" value={28450} change={12.5} icon={Download} color="secondary" />
        </div>

        <DataTable
          columns={columns}
          data={mockDocuments}
          keyField="id"
          selectable
          actions={renderActions}
          searchPlaceholder="Search documents..."
        />
      </div>
    </MainLayout>
  );
}
