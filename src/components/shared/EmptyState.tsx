import { type ReactNode } from 'react';
import { FileText, MessageSquare, Users, Bell, Search, Folder, BookOpen } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    container: 'py-8',
    icon: 'w-12 h-12',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'w-16 h-16',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 'w-20 h-20',
    title: 'text-xl',
    description: 'text-base',
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'mb-4 text-surface-300 dark:text-surface-600',
            styles.icon
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          'font-semibold text-surface-900 dark:text-surface-50',
          styles.title
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'mt-2 text-surface-500 dark:text-surface-400 max-w-sm',
            styles.description
          )}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty states for common scenarios
export function EmptyDocuments({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="w-full h-full" />}
      title="No documents found"
      description="Start by uploading your first document or try adjusting your filters."
      action={onUpload ? { label: 'Upload Document', onClick: onUpload } : undefined}
    />
  );
}

export function EmptyMessages() {
  return (
    <EmptyState
      icon={<MessageSquare className="w-full h-full" />}
      title="No messages yet"
      description="Start a conversation by sending a message."
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={<Bell className="w-full h-full" />}
      title="No notifications"
      description="You're all caught up! New notifications will appear here."
      size="sm"
    />
  );
}

export function EmptySearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<Search className="w-full h-full" />}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try different keywords or check your spelling.`}
    />
  );
}

export function EmptyGroups({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<Users className="w-full h-full" />}
      title="No groups found"
      description="Join a group to connect with colleagues or create your own."
      action={onCreate ? { label: 'Create Group', onClick: onCreate } : undefined}
    />
  );
}

export function EmptyBookmarks() {
  return (
    <EmptyState
      icon={<Folder className="w-full h-full" />}
      title="No bookmarks yet"
      description="Save documents and articles here for quick access later."
      size="sm"
    />
  );
}

export function EmptyTopics({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<BookOpen className="w-full h-full" />}
      title="No topics yet"
      description="Be the first to start a discussion in this category."
      action={onCreate ? { label: 'Create Topic', onClick: onCreate } : undefined}
    />
  );
}
