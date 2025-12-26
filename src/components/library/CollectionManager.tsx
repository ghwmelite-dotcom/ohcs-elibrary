import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus,
  Folder,
  MoreVertical,
  Edit2,
  Trash2,
  Lock,
  Globe,
  Plus,
  X,
  Check,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { Dropdown } from '@/components/shared/Dropdown';
import { cn } from '@/utils/cn';

interface Collection {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  isPublic: boolean;
  createdAt: string;
}

interface CollectionManagerProps {
  collections: Collection[];
  selectedCollection?: string;
  documentId?: string;
  onSelectCollection?: (id: string) => void;
  onCreateCollection?: (name: string, description: string, isPublic: boolean) => void;
  onUpdateCollection?: (id: string, name: string, description: string, isPublic: boolean) => void;
  onDeleteCollection?: (id: string) => void;
  onAddToCollection?: (collectionId: string, documentId: string) => void;
  onRemoveFromCollection?: (collectionId: string, documentId: string) => void;
}

export function CollectionManager({
  collections,
  selectedCollection,
  documentId,
  onSelectCollection,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onAddToCollection,
  onRemoveFromCollection,
}: CollectionManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateCollection?.(newName, newDescription, isPublic);
    setShowCreateModal(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingCollection || !newName.trim()) return;
    onUpdateCollection?.(editingCollection.id, newName, newDescription, isPublic);
    setEditingCollection(null);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setIsPublic(false);
  };

  const startEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setNewName(collection.name);
    setNewDescription(collection.description || '');
    setIsPublic(collection.isPublic);
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
        <h3 className="font-semibold text-surface-900 dark:text-surface-50">
          My Collections
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<FolderPlus className="w-4 h-4" />}
        >
          New
        </Button>
      </div>

      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {collections.length === 0 ? (
          <div className="p-6 text-center">
            <Folder className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
            <p className="text-surface-500 dark:text-surface-400 text-sm">
              No collections yet
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Collection
            </Button>
          </div>
        ) : (
          collections.map((collection) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              isSelected={selectedCollection === collection.id}
              documentId={documentId}
              onSelect={() => onSelectCollection?.(collection.id)}
              onEdit={() => startEdit(collection)}
              onDelete={() => onDeleteCollection?.(collection.id)}
              onAddDocument={() =>
                documentId && onAddToCollection?.(collection.id, documentId)
              }
              onRemoveDocument={() =>
                documentId && onRemoveFromCollection?.(collection.id, documentId)
              }
            />
          ))
        )}
      </div>

      {/* Create Collection Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Collection"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Collection Name"
            placeholder="Enter collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              placeholder="Describe this collection..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className={cn(
                'w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'resize-none h-20'
              )}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                isPublic
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-surface-400 dark:border-surface-500'
              )}
              onClick={() => setIsPublic(!isPublic)}
            >
              {isPublic && <Check className="w-3 h-3 text-white" />}
            </div>
            <div>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Make this collection public
              </span>
              <p className="text-xs text-surface-500">
                Others can view this collection
              </p>
            </div>
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Create Collection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Collection Modal */}
      <Modal
        isOpen={!!editingCollection}
        onClose={() => {
          setEditingCollection(null);
          resetForm();
        }}
        title="Edit Collection"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Collection Name"
            placeholder="Enter collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              placeholder="Describe this collection..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className={cn(
                'w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg',
                'text-surface-900 dark:text-surface-50 placeholder:text-surface-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'resize-none h-20'
              )}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                isPublic
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-surface-400 dark:border-surface-500'
              )}
              onClick={() => setIsPublic(!isPublic)}
            >
              {isPublic && <Check className="w-3 h-3 text-white" />}
            </div>
            <div>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Make this collection public
              </span>
              <p className="text-xs text-surface-500">
                Others can view this collection
              </p>
            </div>
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditingCollection(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!newName.trim()}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface CollectionItemProps {
  collection: Collection;
  isSelected: boolean;
  documentId?: string;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddDocument: () => void;
  onRemoveDocument: () => void;
}

function CollectionItem({
  collection,
  isSelected,
  documentId,
  onSelect,
  onEdit,
  onDelete,
  onAddDocument,
  onRemoveDocument,
}: CollectionItemProps) {
  const menuItems = [
    { label: 'Edit', icon: Edit2, onClick: onEdit },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: onDelete,
      className: 'text-error-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex items-center gap-3 p-3 cursor-pointer transition-colors group',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          isSelected
            ? 'bg-primary-100 dark:bg-primary-800'
            : 'bg-surface-100 dark:bg-surface-700'
        )}
      >
        <Folder
          className={cn(
            'w-5 h-5',
            isSelected
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-surface-500 dark:text-surface-400'
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-medium truncate',
              isSelected
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-surface-900 dark:text-surface-50'
            )}
          >
            {collection.name}
          </span>
          {collection.isPublic ? (
            <Globe className="w-3.5 h-3.5 text-surface-400" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-surface-400" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <FileText className="w-3 h-3" />
          <span>{collection.documentCount} documents</span>
        </div>
      </div>

      {documentId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddDocument();
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add
        </Button>
      )}

      <Dropdown items={menuItems} align="right">
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </Dropdown>
    </motion.div>
  );
}
