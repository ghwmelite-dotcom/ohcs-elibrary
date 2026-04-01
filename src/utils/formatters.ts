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

/**
 * Format currency (Ghana Cedi)
 */
export function formatCurrency(amount: number, currency: string = 'GHS'): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format file type/MIME type to user-friendly string
 */
export function formatFileType(mimeType: string): string {
  if (!mimeType) return 'File';

  // Common MIME type mappings
  const mimeMap: Record<string, string> = {
    // Documents
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    // Google formats
    'application/vnd.google-apps.document': 'Google Doc',
    'application/vnd.google-apps.spreadsheet': 'Google Sheet',
    'application/vnd.google-apps.presentation': 'Google Slides',
    // Text
    'text/plain': 'TXT',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'text/csv': 'CSV',
    'application/json': 'JSON',
    'application/xml': 'XML',
    // Images
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WEBP',
    'image/svg+xml': 'SVG',
    // Audio
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/ogg': 'OGG',
    'audio/mp4': 'M4A',
    'audio/aac': 'AAC',
    // Video
    'video/mp4': 'MP4',
    'video/webm': 'WEBM',
    'video/ogg': 'OGG',
    'video/quicktime': 'MOV',
    'video/x-msvideo': 'AVI',
    // Archives
    'application/zip': 'ZIP',
    'application/x-rar-compressed': 'RAR',
    'application/gzip': 'GZIP',
  };

  // Check exact match first
  if (mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  // Try to extract from MIME type
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PPT';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Excel';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'Doc';
  if (mimeType.includes('pdf')) return 'PDF';

  // Last resort: try to get extension from MIME type
  const parts = mimeType.split('/');
  if (parts.length === 2) {
    const subtype = parts[1].split('.').pop() || parts[1];
    return subtype.toUpperCase().slice(0, 6);
  }

  return 'File';
}

/**
 * Decode HTML entities in text (&#8211; → –, &amp; → &, etc.)
 * Handles numeric (&#123;), hex (&#x1F;), and named entities.
 */
export function decodeHTMLEntities(text: string): string {
  if (!text || !text.includes('&')) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}
