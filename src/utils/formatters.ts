import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Format a date string to a readable format
 */
export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return format(dateObj, formatStr);
}

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format a date to datetime format
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-GH').format(num);
}

/**
 * Format a number in compact form (e.g., 1.2K, 3.4M)
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-GH', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format XP points
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M XP`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K XP`;
  }
  return `${xp} XP`;
}

/**
 * Format reading time in minutes
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return 'Less than 1 min read';
  if (minutes === 1) return '1 min read';
  if (minutes < 60) return `${Math.round(minutes)} min read`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours} hr read`;
  return `${hours} hr ${mins} min read`;
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format user's full name
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Slugify a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format document category name
 */
export function formatCategory(category: string): string {
  const categoryNames: Record<string, string> = {
    circulars: 'Circulars & Directives',
    policies: 'Policies & Guidelines',
    training: 'Training Materials',
    reports: 'Reports & Publications',
    forms: 'Forms & Templates',
    legal: 'Legal Documents',
    research: 'Research Papers',
    general: 'General Resources',
  };
  return categoryNames[category] || titleCase(category);
}

/**
 * Format role name for display
 */
export function formatRole(role: string): string {
  const roleNames: Record<string, string> = {
    guest: 'Guest',
    user: 'User',
    contributor: 'Contributor',
    moderator: 'Moderator',
    librarian: 'Librarian',
    admin: 'Administrator',
    director: 'Director',
    super_admin: 'Super Admin',
  };
  return roleNames[role] || titleCase(role.replace('_', ' '));
}

/**
 * Format access level for display
 */
export function formatAccessLevel(level: string): string {
  const levels: Record<string, string> = {
    public: 'Public',
    internal: 'Internal',
    restricted: 'Restricted',
    confidential: 'Confidential',
    secret: 'Secret',
  };
  return levels[level] || titleCase(level);
}
