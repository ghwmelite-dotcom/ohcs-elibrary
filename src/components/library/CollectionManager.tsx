import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus,
  Folder,
  Trash2,
  Lock,
  Globe,
  Plus,
  Check,
  FileText,
  Loader2,
  X,
  BookmarkPlus,
  BookmarkMinus,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  documentCount: number;
  createdAt: string;
  documents?: Array<{ id: string }>;
}

interface CollectionManagerProps {
  documentId: string;
}

export function CollectionManager({ documentId }: CollectionManagerProps) {
  const { token, isAuthenticated } = useAuthStore();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // Track which collections contain the current document
  const [collectionDocs, setCollectionDocs] = useState<Record<string, boolean>>({});

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  const fetchCollections = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/documents/collections`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error('Failed to fetch collections');
      const data = await res.json();
      setCollections(data.collections || []);

      // Check which collections contain the current document
      const docMap: Record<string, boolean> = {};
      for (const col of data.collections || []) {
        try {
          const detailRes = await fetch(`${API_BASE}/api/v1/documents/collections/${col.id}`, {
            headers: headers(),
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const docs = detail.documents || detail.collection?.documents || [];
            docMap[col.id] = docs.some((d: any) => d.id === documentId || d.documentId === documentId);
          }
        } catch {
          // Skip individual collection check errors
        }
      }
      setCollectionDocs(docMap);
    } catch (err) {
      console.error('Error fetching collections:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, documentId, headers]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreate = async () => {
    if (!newName.trim() || isCreating || !token) return;
    setIsCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/documents/collections`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          isPublic,
        }),
      });
      if (!res.ok) throw new Error('Failed to create collection');
      const created = await res.json();
      const newCol = created.collection || created;
      setCollections((prev) => [...prev, { ...newCol, documentCount: newCol.documentCount || 0 }]);
      setShowCreateForm(false);
      setNewName('');
      setNewDescription('');
      setIsPublic(false);
    } catch (err) {
      console.error('Error creating collection:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (!token) return;
    setActionLoading(collectionId);
    try {
      const res = await fetch(`${API_BASE}/api/v1/documents/collections/${collectionId}/documents`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ documentId }),
      });
      if (!res.ok) throw new Error('Failed to add document');
      setCollectionDocs((prev) => ({ ...prev, [collectionId]: true }));
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId ? { ...c, documentCount: c.documentCount + 1 } : c
        )
      );
    } catch (err) {
      console.error('Error adding to collection:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFromCollection = async (collectionId: string) => {
    if (!token) return;
    setActionLoading(collectionId);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/documents/collections/${collectionId}/documents/${documentId}`,
        { method: 'DELETE', headers: headers() }
      );
      if (!res.ok) throw new Error('Failed to remove document');
      setCollectionDocs((prev) => ({ ...prev, [collectionId]: false }));
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId ? { ...c, documentCount: Math.max(0, c.documentCount - 1) } : c
        )
      );
    } catch (err) {
      console.error('Error removing from collection:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (collectionId: string) => {
    if (!token) return;
    setActionLoading(collectionId);
    try {
      const res = await fetch(`${API_BASE}/api/v1/documents/collections/${collectionId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (!res.ok) throw new Error('Failed to delete collection');
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting collection:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6 text-center">
        <Folder className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
        <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">Collections</h3>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Sign in to organize documents into collections
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 p-6">
        <div className="flex items-center justify-center gap-2 text-surface-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading collections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">My Collections</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
          leftIcon={showCreateForm ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
        >
          {showCreateForm ? 'Cancel' : 'New'}
        </Button>
      </div>

      {/* Inline Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-surface-50 dark:bg-surface-700/50 border-b border-surface-200 dark:border-surface-700 space-y-3">
              <input
                type="text"
                placeholder="Collection name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                  'text-surface-900 dark:text-surface-50 placeholder:text-surface-400 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
              <textarea
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                  'text-surface-900 dark:text-surface-50 placeholder:text-surface-400 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'resize-none h-16'
                )}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                      isPublic
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-surface-400 dark:border-surface-500'
                    )}
                    onClick={() => setIsPublic(!isPublic)}
                  >
                    {isPublic && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-xs text-surface-600 dark:text-surface-400">Public</span>
                </label>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  isLoading={isCreating}
                  disabled={!newName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collections List */}
      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {collections.length === 0 ? (
          <div className="p-6 text-center">
            <Folder className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
            <p className="text-surface-500 dark:text-surface-400 text-sm mb-1">
              Create your first collection to organize documents
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowCreateForm(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Collection
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {collections.map((collection) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="group"
              >
                {deleteConfirm === collection.id ? (
                  <div className="p-3 bg-error-50 dark:bg-error-900/20">
                    <p className="text-sm text-error-700 dark:text-error-300 mb-2">
                      Delete "{collection.name}"?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-error-600 border-error-300 hover:bg-error-50"
                        onClick={() => handleDelete(collection.id)}
                        isLoading={actionLoading === collection.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                      <Folder className="w-4.5 h-4.5 text-surface-500 dark:text-surface-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm text-surface-900 dark:text-surface-50 truncate">
                          {collection.name}
                        </span>
                        {collection.isPublic ? (
                          <Globe className="w-3 h-3 text-surface-400 flex-shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 text-surface-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-surface-500">
                        <FileText className="w-3 h-3" />
                        <span>{collection.documentCount} docs</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {collectionDocs[collection.id] ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromCollection(collection.id)}
                          isLoading={actionLoading === collection.id}
                          className="text-primary-600 dark:text-primary-400"
                          title="Remove from collection"
                        >
                          <BookmarkMinus className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddToCollection(collection.id)}
                          isLoading={actionLoading === collection.id}
                          title="Add to collection"
                        >
                          <BookmarkPlus className="w-4 h-4" />
                        </Button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(collection.id)}
                        className="p-1.5 text-surface-400 hover:text-error-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
