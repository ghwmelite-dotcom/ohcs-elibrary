import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  Eye,
  Clock,
  User,
  Tag,
  FileText,
  MessageSquare,
  Star,
  MoreVertical,
  Flag,
  History,
  ExternalLink,
} from 'lucide-react';
import { useLibraryStore } from '@/stores/libraryStore';
import {
  DocumentReader,
  DocumentRating,
  RatingBreakdown,
  DocumentComments,
  AIAnalysisPanel,
  CollectionManager,
} from '@/components/library';
import { Button } from '@/components/shared/Button';
import { Avatar } from '@/components/shared/Avatar';
import { Badge } from '@/components/shared/Badge';
import { Tabs } from '@/components/shared/Tabs';
import { Dropdown } from '@/components/shared/Dropdown';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn } from '@/utils/cn';
import { formatRelativeTime, formatFileSize, formatDate } from '@/utils/formatters';

export default function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, categories, bookmarks, toggleBookmark, isLoading } = useLibraryStore();
  const [activeTab, setActiveTab] = useState('content');

  const document = documents.find((d) => d.id === id);
  const category = categories.find((c) => c.id === document?.categoryId);
  const isBookmarked = document ? bookmarks.includes(document.id) : false;

  // Simulate view tracking
  useEffect(() => {
    if (id) {
      // Track document view
      console.log('Viewed document:', id);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
          Document Not Found
        </h2>
        <p className="text-surface-500 dark:text-surface-400 mb-6">
          The document you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/library')}>Back to Library</Button>
      </div>
    );
  }

  const menuItems = [
    { label: 'Report Issue', icon: Flag, onClick: () => {} },
    { label: 'View History', icon: History, onClick: () => {} },
    { label: 'Open in New Tab', icon: ExternalLink, onClick: () => {} },
  ];

  const tabs = [
    { id: 'content', label: 'Document', icon: <FileText className="w-4 h-4" /> },
    { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Analysis', icon: <span className="text-sm">&#10024;</span> },
  ];

  // Mock comments
  const comments = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Kwame Asante',
      content:
        'This document provides excellent guidance on the new HR policies. Very helpful for understanding the recent changes.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      replies: [
        {
          id: '1-1',
          userId: 'user2',
          userName: 'Ama Serwaa',
          content: 'I agree! The section on leave policies was particularly useful.',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      id: '2',
      userId: 'user3',
      userName: 'Kofi Mensah',
      content: 'Could someone clarify the section on page 15 about performance reviews?',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Mock AI analysis
  const aiAnalysis = {
    summary:
      'This comprehensive document outlines the updated policies and procedures for Ghana\'s civil service, focusing on employee welfare, professional development, and organizational efficiency. It establishes clear guidelines for various administrative processes and defines the rights and responsibilities of civil servants.',
    keyPoints: [
      'Updated performance evaluation criteria for all civil service grades',
      'New guidelines for professional development and training opportunities',
      'Revised leave policies including parental and compassionate leave',
      'Introduction of digital-first approach for administrative processes',
      'Enhanced whistleblower protection mechanisms',
    ],
    topics: ['HR Policy', 'Civil Service', 'Employee Rights', 'Performance Management'],
    readingTime: 25,
    complexity: 'intermediate' as const,
    recommendations: [
      'Civil Service Training Manual 2024',
      'Code of Conduct for Public Officers',
      'Performance Management Guidelines',
    ],
  };

  // Mock collections
  const collections = [
    { id: '1', name: 'HR Policies', description: 'Human resources related documents', documentCount: 12, isPublic: false, createdAt: new Date().toISOString() },
    { id: '2', name: 'Training Materials', description: 'Training and development resources', documentCount: 8, isPublic: true, createdAt: new Date().toISOString() },
  ];

  // Mock rating breakdown
  const ratingBreakdown = { 5: 45, 4: 32, 3: 12, 2: 5, 1: 2 };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/library"
          className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Library
        </Link>
        {category && (
          <>
            <span className="text-surface-400">/</span>
            <span className="text-surface-500 dark:text-surface-400">{category.name}</span>
          </>
        )}
      </nav>

      {/* Document Header */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Document Icon */}
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${category?.color || '#006B3F'}20` }}
          >
            <FileText
              className="w-10 h-10"
              style={{ color: category?.color || '#006B3F' }}
            />
          </div>

          {/* Document Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-heading font-bold text-surface-900 dark:text-surface-50">
                  {document.title}
                </h1>
                <p className="mt-2 text-surface-600 dark:text-surface-400">
                  {document.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isBookmarked ? 'secondary' : 'outline'}
                  onClick={() => toggleBookmark(document.id)}
                  leftIcon={
                    isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )
                  }
                >
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
                <Button variant="outline" leftIcon={<Share2 className="w-5 h-5" />}>
                  Share
                </Button>
                <Button leftIcon={<Download className="w-5 h-5" />}>Download</Button>
                <Dropdown items={menuItems} align="right">
                  <button className="p-2.5 border border-surface-300 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                    <MoreVertical className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                  </button>
                </Dropdown>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
              <div className="flex items-center gap-1.5">
                <Avatar size="xs" name={document.uploadedBy} />
                <span>Uploaded by {document.uploadedBy}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{formatRelativeTime(document.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{document.viewCount} views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                <span>{document.downloadCount} downloads</span>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {category && (
                <Badge variant="category" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                  {category.name}
                </Badge>
              )}
              {document.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-xs rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Content */}
        <div className="lg:col-span-2">
          {activeTab === 'content' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DocumentReader
                documentId={document.id}
                fileUrl={document.fileUrl}
                fileName={document.title}
                totalPages={document.pageCount}
                onDownload={() => console.log('Download')}
              />
            </motion.div>
          )}

          {activeTab === 'comments' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6"
            >
              <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-6">
                Comments ({comments.length})
              </h2>
              <DocumentComments
                documentId={document.id}
                comments={comments}
                currentUserId="current-user"
                onAddComment={(content, parentId) =>
                  console.log('Add comment:', content, parentId)
                }
                onEditComment={(id, content) => console.log('Edit:', id, content)}
                onDeleteComment={(id) => console.log('Delete:', id)}
              />
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AIAnalysisPanel
                documentId={document.id}
                analysis={aiAnalysis}
                onRefresh={() => console.log('Refresh AI analysis')}
              />
            </motion.div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Rating */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Ratings & Reviews
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-surface-900 dark:text-surface-50">
                  {document.rating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'w-4 h-4',
                        star <= Math.round(document.rating)
                          ? 'text-secondary-500 fill-secondary-500'
                          : 'text-surface-300'
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-surface-500 mt-1">
                  {document.ratingCount} reviews
                </p>
              </div>
              <div className="flex-1">
                <RatingBreakdown
                  ratings={ratingBreakdown}
                  totalRatings={document.ratingCount}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                Rate this document
              </p>
              <DocumentRating
                documentId={document.id}
                currentRating={document.rating}
                totalRatings={document.ratingCount}
                onRate={(rating) => console.log('Rate:', rating)}
              />
            </div>
          </div>

          {/* Document Details */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">
              Document Details
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">File Type</dt>
                <dd className="font-medium text-surface-900 dark:text-surface-50 uppercase">
                  {document.fileType}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">File Size</dt>
                <dd className="font-medium text-surface-900 dark:text-surface-50">
                  {formatFileSize(document.fileSize)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">Pages</dt>
                <dd className="font-medium text-surface-900 dark:text-surface-50">
                  {document.pageCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">Version</dt>
                <dd className="font-medium text-surface-900 dark:text-surface-50">
                  {document.version}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">Published</dt>
                <dd className="font-medium text-surface-900 dark:text-surface-50">
                  {formatDate(document.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-surface-500 dark:text-surface-400">Access Level</dt>
                <dd>
                  <Badge variant={document.accessLevel === 'public' ? 'success' : 'warning'}>
                    {document.accessLevel}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>

          {/* Collections */}
          <CollectionManager
            collections={collections}
            documentId={document.id}
            onCreateCollection={(name, desc, isPublic) =>
              console.log('Create:', name, desc, isPublic)
            }
            onAddToCollection={(collectionId, docId) =>
              console.log('Add to collection:', collectionId, docId)
            }
          />
        </div>
      </div>
    </div>
  );
}
