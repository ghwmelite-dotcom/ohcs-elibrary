import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import { useSocialStore } from '@/stores/socialStore';
import { User } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

interface MutualConnectionsProps {
  userId: string;
  limit?: number;
  showCount?: boolean;
  className?: string;
}

export function MutualConnections({
  userId,
  limit = 3,
  showCount = true,
  className,
}: MutualConnectionsProps) {
  const { fetchMutualConnections } = useSocialStore();

  const [mutuals, setMutuals] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadMutuals = async () => {
      setIsLoading(true);
      const result = await fetchMutualConnections(userId, limit + 1);
      setTotalCount(result.length);
      setMutuals(result.slice(0, limit));
      setIsLoading(false);
    };

    loadMutuals();
  }, [userId, limit, fetchMutualConnections]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-surface-500', className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (mutuals.length === 0) {
    return null;
  }

  const remaining = totalCount - mutuals.length;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Stacked avatars */}
      <div className="flex -space-x-2">
        {mutuals.map((mutual) => (
          <Link
            key={mutual.id}
            to={`/profile/${mutual.id}`}
            className="relative hover:z-10"
          >
            <Avatar
              src={mutual.avatar}
              name={mutual.displayName || 'User'}
              size="xs"
              className="ring-2 ring-white dark:ring-surface-800"
            />
          </Link>
        ))}
      </div>

      {/* Text */}
      {showCount && (
        <p className="text-xs text-surface-500">
          {mutuals.length === 1 ? (
            <>
              <Link
                to={`/profile/${mutuals[0].id}`}
                className="font-medium text-surface-700 dark:text-surface-300 hover:text-primary-600"
              >
                {mutuals[0].displayName}
              </Link>
              {' is a mutual connection'}
            </>
          ) : remaining > 0 ? (
            <>
              <Link
                to={`/profile/${mutuals[0].id}`}
                className="font-medium text-surface-700 dark:text-surface-300 hover:text-primary-600"
              >
                {mutuals[0].displayName}
              </Link>
              {', '}
              <Link
                to={`/profile/${mutuals[1].id}`}
                className="font-medium text-surface-700 dark:text-surface-300 hover:text-primary-600"
              >
                {mutuals[1].displayName}
              </Link>
              {` and ${remaining} other${remaining > 1 ? 's' : ''}`}
            </>
          ) : (
            <>
              {mutuals.slice(0, -1).map((m, i) => (
                <span key={m.id}>
                  <Link
                    to={`/profile/${m.id}`}
                    className="font-medium text-surface-700 dark:text-surface-300 hover:text-primary-600"
                  >
                    {m.displayName}
                  </Link>
                  {i < mutuals.length - 2 ? ', ' : ' and '}
                </span>
              ))}
              <Link
                to={`/profile/${mutuals[mutuals.length - 1].id}`}
                className="font-medium text-surface-700 dark:text-surface-300 hover:text-primary-600"
              >
                {mutuals[mutuals.length - 1].displayName}
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
