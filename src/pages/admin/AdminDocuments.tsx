import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Download,
  Shield,
  Star,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  X,
  Check,
  Clock,
  Archive,
  FileCheck,
  FolderOpen,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Presentation,
  BookOpen,
  TrendingUp,
  Users,
  Calendar,
  ChevronDown,
  Send,
  AlertTriangle,
  CheckCircle,
  Lock,
  Globe,
  Building2,
  CloudUpload,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  authorAvatar?: string;
  mda: string;
  accessLevel: 'public' | 'internal' | 'restricted' | 'confidential';
  downloads: number;
  views: number;
  rating: number;
  ratingCount: number;
  status: 'published' | 'draft' | 'archived' | 'pending';
  createdAt: string;
  updatedAt: string;
  fileSize: string;
  fileType: string;
  thumbnail?: string;
  tags: string[];
}

// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950" />

      {/* Animated orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, #006B3F 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -left-32 w-80 h-80 rounded-full opacity-20 dark:opacity-15"
        style={{
          background: 'radial-gradient(circle, #FCD116 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full opacity-20 dark:opacity-10"
        style={{
          background: 'radial-gradient(circle, #CE1126 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -20, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// File type icon helper
function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type === 'pdf') return FileText;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) return FileImage;
  if (['xls', 'xlsx', 'csv'].includes(type)) return FileSpreadsheet;
  if (['ppt', 'pptx'].includes(type)) return Presentation;
  if (['doc', 'docx'].includes(type)) return BookOpen;
  if (['html', 'css', 'js', 'json'].includes(type)) return FileCode;
  return File;
}

// File type color helper
function getFileColor(fileType: string) {
  const type = fileType.toLowerCase();
  if (type === 'pdf') return '#CE1126';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) return '#8B5CF6';
  if (['xls', 'xlsx', 'csv'].includes(type)) return '#10B981';
  if (['ppt', 'pptx'].includes(type)) return '#F59E0B';
  if (['doc', 'docx'].includes(type)) return '#3B82F6';
  return '#6B7280';
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  subtitle
}: {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
    primary: { bg: 'bg-primary-500', text: 'text-primary-500', glow: '#006B3F' },
    secondary: { bg: 'bg-secondary-500', text: 'text-secondary-500', glow: '#FCD116' },
    success: { bg: 'bg-success-500', text: 'text-success-500', glow: '#10B981' },
    warning: { bg: 'bg-warning-500', text: 'text-warning-500', glow: '#F59E0B' },
    error: { bg: 'bg-error-500', text: 'text-error-500', glow: '#EF4444' },
    info: { bg: 'bg-info-500', text: 'text-info-500', glow: '#3B82F6' },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative group"
    >
      {/* Glow effect on hover */}
      <div
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-40 blur-xl transition-all duration-500"
        style={{ background: colors.glow }}
      />

      <div className="relative bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-lg border border-surface-200/50 dark:border-surface-700/50 overflow-hidden">
        {/* Decorative corner */}
        <div
          className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10"
          style={{ background: colors.glow }}
        />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex-1">
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-surface-400 mt-1">{subtitle}</p>
            )}
            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-xs font-medium',
                change >= 0 ? 'text-success-500' : 'text-error-500'
              )}>
                <TrendingUp className={cn('w-3 h-3', change < 0 && 'rotate-180')} />
                <span>{change >= 0 ? '+' : ''}{change}% this month</span>
              </div>
            )}
          </div>
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            colors.bg,
            'bg-opacity-10 dark:bg-opacity-20'
          )}>
            <Icon className={cn('w-6 h-6', colors.text)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Document Card Component (Grid View)
function DocumentCard({
  doc,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onDownload
}: {
  doc: Document;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const FileIcon = getFileIcon(doc.fileType);
  const fileColor = getFileColor(doc.fileType);

  const statusConfig = {
    published: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-300', icon: CheckCircle },
    draft: { bg: 'bg-surface-100 dark:bg-surface-700', text: 'text-surface-600 dark:text-surface-300', icon: Edit2 },
    pending: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300', icon: Clock },
    archived: { bg: 'bg-surface-200 dark:bg-surface-600', text: 'text-surface-500 dark:text-surface-400', icon: Archive },
  };

  const accessConfig = {
    public: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-300', icon: Globe },
    internal: { bg: 'bg-info-100 dark:bg-info-900/30', text: 'text-info-700 dark:text-info-300', icon: Building2 },
    restricted: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300', icon: Shield },
    confidential: { bg: 'bg-error-100 dark:bg-error-900/30', text: 'text-error-700 dark:text-error-300', icon: Lock },
  };

  const StatusIcon = statusConfig[doc.status].icon;
  const AccessIcon = accessConfig[doc.accessLevel].icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative group bg-white dark:bg-surface-800 rounded-2xl overflow-hidden shadow-lg border-2 transition-all duration-300',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-transparent hover:border-surface-300 dark:hover:border-surface-600'
      )}
    >
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSelect}
          className={cn(
            'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'bg-white/80 dark:bg-surface-700/80 border-surface-300 dark:border-surface-500 opacity-0 group-hover:opacity-100'
          )}
        >
          {isSelected && <Check className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* More menu */}
      <div className="absolute top-3 right-3 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowMenu(!showMenu)}
          className="w-8 h-8 rounded-lg bg-white/80 dark:bg-surface-700/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <MoreVertical className="w-4 h-4 text-surface-600 dark:text-surface-300" />
        </motion.button>

        <AnimatePresence>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden z-20"
              >
                <button
                  onClick={() => { onView(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Document
                </button>
                <button
                  onClick={() => { onDownload(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Details
                </button>
                <div className="border-t border-surface-200 dark:border-surface-700" />
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Document thumbnail/preview */}
      <div className="relative h-40 bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 overflow-hidden">
        {doc.thumbnail ? (
          <img src={doc.thumbnail} alt={doc.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-20 h-24 rounded-lg flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${fileColor}15` }}
            >
              <FileIcon className="w-10 h-10" style={{ color: fileColor }} />
            </div>
          </div>
        )}

        {/* File type badge */}
        <div
          className="absolute bottom-3 left-3 px-2 py-1 rounded-md text-xs font-bold text-white uppercase"
          style={{ backgroundColor: fileColor }}
        >
          {doc.fileType}
        </div>

        {/* Access level badge */}
        <div className={cn(
          'absolute bottom-3 right-3 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1',
          accessConfig[doc.accessLevel].bg,
          accessConfig[doc.accessLevel].text
        )}>
          <AccessIcon className="w-3 h-3" />
          {doc.accessLevel}
        </div>
      </div>

      {/* Document info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-surface-900 dark:text-surface-50 line-clamp-2 leading-tight">
            {doc.title}
          </h3>
        </div>

        <p className="text-xs text-surface-500 dark:text-surface-400 mb-3 line-clamp-2">
          {doc.description}
        </p>

        {/* Category and status */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded-md text-xs text-surface-600 dark:text-surface-300">
            {doc.category}
          </span>
          <span className={cn(
            'px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1',
            statusConfig[doc.status].bg,
            statusConfig[doc.status].text
          )}>
            <StatusIcon className="w-3 h-3" />
            {doc.status}
          </span>
        </div>

        {/* Author and MDA */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white">
            {doc.author.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-surface-700 dark:text-surface-200 truncate">
              {doc.author}
            </p>
            <p className="text-[10px] text-surface-400 truncate">{doc.mda}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-3 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {doc.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              {doc.downloads.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-secondary-500 fill-secondary-500" />
            <span className="text-xs font-medium text-surface-700 dark:text-surface-200">
              {doc.rating}
            </span>
            <span className="text-[10px] text-surface-400">({doc.ratingCount})</span>
          </div>
        </div>

        {/* File info */}
        <div className="flex items-center justify-between mt-2 text-[10px] text-surface-400">
          <span>{doc.fileSize}</span>
          <span>Updated {doc.updatedAt}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Document Row Component (Table View)
function DocumentRow({
  doc,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onDownload
}: {
  doc: Document;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const FileIcon = getFileIcon(doc.fileType);
  const fileColor = getFileColor(doc.fileType);

  const statusConfig = {
    published: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-300' },
    draft: { bg: 'bg-surface-100 dark:bg-surface-700', text: 'text-surface-600 dark:text-surface-300' },
    pending: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300' },
    archived: { bg: 'bg-surface-200 dark:bg-surface-600', text: 'text-surface-500 dark:text-surface-400' },
  };

  const accessConfig = {
    public: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-300' },
    internal: { bg: 'bg-info-100 dark:bg-info-900/30', text: 'text-info-700 dark:text-info-300' },
    restricted: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300' },
    confidential: { bg: 'bg-error-100 dark:bg-error-900/30', text: 'text-error-700 dark:text-error-300' },
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'group transition-colors',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
      )}
    >
      {/* Checkbox */}
      <td className="px-4 py-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSelect}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'border-surface-300 dark:border-surface-500'
          )}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </motion.button>
      </td>

      {/* Document info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${fileColor}15` }}
          >
            <FileIcon className="w-5 h-5" style={{ color: fileColor }} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-surface-900 dark:text-surface-50 truncate max-w-xs">
              {doc.title}
            </p>
            <p className="text-xs text-surface-500 truncate max-w-xs">
              {doc.category} • {doc.fileSize} • {doc.fileType.toUpperCase()}
            </p>
          </div>
        </div>
      </td>

      {/* Author */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {doc.author.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-surface-700 dark:text-surface-200 truncate">
              {doc.author}
            </p>
            <p className="text-xs text-surface-400 truncate">{doc.mda}</p>
          </div>
        </div>
      </td>

      {/* Access Level */}
      <td className="px-4 py-3">
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium capitalize',
          accessConfig[doc.accessLevel].bg,
          accessConfig[doc.accessLevel].text
        )}>
          {doc.accessLevel}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium capitalize',
          statusConfig[doc.status].bg,
          statusConfig[doc.status].text
        )}>
          {doc.status}
        </span>
      </td>

      {/* Stats */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-surface-500">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {doc.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            {doc.downloads.toLocaleString()}
          </span>
        </div>
      </td>

      {/* Rating */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-secondary-500 fill-secondary-500" />
          <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
            {doc.rating}
          </span>
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-sm text-surface-500">
        {doc.updatedAt}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="relative">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onView}
              className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              title="View"
            >
              <Eye className="w-4 h-4 text-surface-500" />
            </button>
            <button
              onClick={onDownload}
              className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4 text-surface-500" />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-surface-500" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-error-100 dark:hover:bg-error-900/20 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-error-500" />
            </button>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// Upload Modal Component
function UploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Ghana stripe header */}
          <div className="h-1.5 flex">
            <div className="flex-1 bg-[#CE1126]" />
            <div className="flex-1 bg-[#FCD116]" />
            <div className="flex-1 bg-[#006B3F]" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  Upload Document
                </h2>
                <p className="text-sm text-surface-500">Add a new document to the library</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-surface-700/50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              />

              <motion.div
                animate={{ y: isDragging ? -10 : 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <CloudUpload className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <p className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-2">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your file'}
                </p>
                <p className="text-sm text-surface-500 mb-4">
                  or click to browse from your computer
                </p>
                <p className="text-xs text-surface-400">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV (Max 50MB)
                </p>
              </motion.div>
            </div>

            {/* Uploaded file preview */}
            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 dark:text-surface-50 truncate">
                    {uploadedFile.name}
                  </p>
                  <p className="text-sm text-surface-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                  className="p-2 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-surface-500" />
                </button>
              </motion.div>
            )}

            {/* Document details form */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter document title"
                  className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-surface-900 dark:text-surface-50 placeholder-surface-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter document description"
                  className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-surface-900 dark:text-surface-50 placeholder-surface-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                    Category *
                  </label>
                  <select className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-surface-900 dark:text-surface-50">
                    <option value="">Select category</option>
                    <option value="policy">Policy Documents</option>
                    <option value="reports">Reports</option>
                    <option value="training">Training Materials</option>
                    <option value="guidelines">Guidelines</option>
                    <option value="forms">Forms & Templates</option>
                    <option value="legislation">Legislation</option>
                    <option value="research">Research Papers</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                    Access Level *
                  </label>
                  <select className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-surface-900 dark:text-surface-50">
                    <option value="public">Public</option>
                    <option value="internal">Internal Only</option>
                    <option value="restricted">Restricted</option>
                    <option value="confidential">Confidential</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                    MDA *
                  </label>
                  <select className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-surface-900 dark:text-surface-50">
                    <option value="">Select MDA</option>
                    <option value="ohcs">Office of the Head of Civil Service</option>
                    <option value="mof">Ministry of Finance</option>
                    <option value="moh">Ministry of Health</option>
                    <option value="moe">Ministry of Education</option>
                    <option value="psc">Public Services Commission</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tags (comma separated)"
                    className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-surface-900 dark:text-surface-50 placeholder-surface-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
            >
              Upload Document
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Main Component
export default function AdminDocuments() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const mockDocuments: Document[] = [
    {
      id: '1',
      title: 'Annual Budget Guidelines 2024',
      description: 'Comprehensive guidelines for budget preparation and implementation across all MDAs for the fiscal year 2024.',
      category: 'Policy Documents',
      author: 'Kwame Asante',
      mda: 'Ministry of Finance',
      accessLevel: 'public',
      downloads: 1245,
      views: 3420,
      rating: 4.5,
      ratingCount: 89,
      status: 'published',
      createdAt: '2024-01-10',
      updatedAt: 'Jan 15, 2024',
      fileSize: '2.4 MB',
      fileType: 'pdf',
      tags: ['budget', 'finance', '2024'],
    },
    {
      id: '2',
      title: 'Civil Service Training Manual',
      description: 'Official training manual for civil service personnel covering ethics, procedures, and best practices.',
      category: 'Training Materials',
      author: 'Ama Serwaa',
      mda: 'Public Services Commission',
      accessLevel: 'internal',
      downloads: 892,
      views: 2150,
      rating: 4.8,
      ratingCount: 156,
      status: 'published',
      createdAt: '2024-01-08',
      updatedAt: 'Jan 12, 2024',
      fileSize: '5.1 MB',
      fileType: 'pdf',
      tags: ['training', 'civil service', 'manual'],
    },
    {
      id: '3',
      title: 'Health Sector Performance Report Q4',
      description: 'Quarterly performance review of the health sector including key metrics and improvement areas.',
      category: 'Reports',
      author: 'Kofi Mensah',
      mda: 'Ministry of Health',
      accessLevel: 'restricted',
      downloads: 156,
      views: 420,
      rating: 4.2,
      ratingCount: 34,
      status: 'pending',
      createdAt: '2024-01-12',
      updatedAt: 'Jan 14, 2024',
      fileSize: '1.8 MB',
      fileType: 'pdf',
      tags: ['health', 'report', 'Q4'],
    },
    {
      id: '4',
      title: 'Digital Transformation Strategy 2025-2030',
      description: 'Strategic roadmap for digital transformation across the civil service over the next five years.',
      category: 'Policy Documents',
      author: 'Yaw Boateng',
      mda: 'Ministry of Communications',
      accessLevel: 'public',
      downloads: 2340,
      views: 5670,
      rating: 4.9,
      ratingCount: 203,
      status: 'published',
      createdAt: '2024-01-05',
      updatedAt: 'Jan 10, 2024',
      fileSize: '8.2 MB',
      fileType: 'pdf',
      tags: ['digital', 'strategy', 'transformation'],
    },
    {
      id: '5',
      title: 'Procurement Guidelines Template',
      description: 'Standard template for procurement processes in compliance with PPA regulations.',
      category: 'Forms & Templates',
      author: 'Akua Mensah',
      mda: 'Public Procurement Authority',
      accessLevel: 'internal',
      downloads: 567,
      views: 1234,
      rating: 4.3,
      ratingCount: 67,
      status: 'published',
      createdAt: '2024-01-07',
      updatedAt: 'Jan 09, 2024',
      fileSize: '1.2 MB',
      fileType: 'docx',
      tags: ['procurement', 'template', 'guidelines'],
    },
    {
      id: '6',
      title: 'Education Sector Budget Analysis',
      description: 'Detailed analysis of education sector budget allocation and utilization patterns.',
      category: 'Reports',
      author: 'Kwesi Appiah',
      mda: 'Ministry of Education',
      accessLevel: 'restricted',
      downloads: 234,
      views: 567,
      rating: 4.1,
      ratingCount: 28,
      status: 'draft',
      createdAt: '2024-01-11',
      updatedAt: 'Jan 13, 2024',
      fileSize: '3.4 MB',
      fileType: 'xlsx',
      tags: ['education', 'budget', 'analysis'],
    },
    {
      id: '7',
      title: 'Public Financial Management Act',
      description: 'Full text of the Public Financial Management Act with annotations and guidelines.',
      category: 'Legislation',
      author: 'Ministry of Finance',
      mda: 'Ministry of Finance',
      accessLevel: 'public',
      downloads: 4521,
      views: 12340,
      rating: 4.7,
      ratingCount: 312,
      status: 'published',
      createdAt: '2023-12-15',
      updatedAt: 'Dec 20, 2023',
      fileSize: '4.8 MB',
      fileType: 'pdf',
      tags: ['legislation', 'finance', 'PFM'],
    },
    {
      id: '8',
      title: 'Civil Service Code of Conduct',
      description: 'Official code of conduct for all civil servants in Ghana.',
      category: 'Guidelines',
      author: 'OHCS',
      mda: 'Office of the Head of Civil Service',
      accessLevel: 'public',
      downloads: 3456,
      views: 8901,
      rating: 4.6,
      ratingCount: 189,
      status: 'published',
      createdAt: '2023-11-20',
      updatedAt: 'Nov 25, 2023',
      fileSize: '1.5 MB',
      fileType: 'pdf',
      tags: ['ethics', 'conduct', 'guidelines'],
    },
  ];

  const categories = ['Policy Documents', 'Reports', 'Training Materials', 'Guidelines', 'Forms & Templates', 'Legislation', 'Research Papers'];
  const accessLevels = ['public', 'internal', 'restricted', 'confidential'];
  const statuses = ['published', 'draft', 'pending', 'archived'];

  // Filter documents
  const filteredDocs = mockDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.mda.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesAccess = accessFilter === 'all' || doc.accessLevel === accessFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesAccess;
  });

  const toggleSelectAll = () => {
    if (selectedDocs.length === filteredDocs.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocs.map(d => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedDocs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  // Stats
  const totalDocs = mockDocuments.length;
  const publishedDocs = mockDocuments.filter(d => d.status === 'published').length;
  const pendingDocs = mockDocuments.filter(d => d.status === 'pending').length;
  const totalDownloads = mockDocuments.reduce((sum, d) => sum + d.downloads, 0);

  return (
    <div className="min-h-screen">
      <AnimatedBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              Document Management
            </h1>
            <p className="text-surface-600 dark:text-surface-400">
              Manage and moderate platform documents
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Documents"
            value={totalDocs}
            change={8.3}
            icon={FileText}
            color="primary"
            subtitle={`${categories.length} categories`}
          />
          <StatCard
            title="Published"
            value={publishedDocs}
            icon={FileCheck}
            color="success"
            subtitle="Available to users"
          />
          <StatCard
            title="Pending Review"
            value={pendingDocs}
            icon={Clock}
            color="warning"
            subtitle="Awaiting approval"
          />
          <StatCard
            title="Total Downloads"
            value={totalDownloads}
            change={12.5}
            icon={Download}
            color="secondary"
            subtitle="This month"
          />
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-200/50 dark:border-surface-700/50 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                placeholder="Search documents by title, author, or MDA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-surface-900 dark:text-surface-50 placeholder-surface-400"
              />
            </div>

            {/* Filter toggles */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
                  showFilters
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                )}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(statusFilter !== 'all' || categoryFilter !== 'all' || accessFilter !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-primary-500" />
                )}
              </button>

              {/* View toggle */}
              <div className="flex items-center bg-surface-100 dark:bg-surface-700 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-surface-600 shadow-sm text-primary-600 dark:text-primary-400'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'table'
                      ? 'bg-white dark:bg-surface-600 shadow-sm text-primary-600 dark:text-primary-400'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-surface-200 dark:border-surface-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-surface-500 mb-1.5">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-surface-50"
                    >
                      <option value="all">All Statuses</option>
                      {statuses.map(status => (
                        <option key={status} value={status} className="capitalize">{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-500 mb-1.5">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-surface-50"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-500 mb-1.5">Access Level</label>
                    <select
                      value={accessFilter}
                      onChange={(e) => setAccessFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-surface-50"
                    >
                      <option value="all">All Access Levels</option>
                      {accessLevels.map(level => (
                        <option key={level} value={level} className="capitalize">{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedDocs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedDocs([])}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 rounded-lg text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 rounded-lg text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300 rounded-lg text-sm font-medium hover:bg-error-200 dark:hover:bg-error-900/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-surface-500">
            Showing {filteredDocs.length} of {mockDocuments.length} documents
          </p>
          {viewMode === 'grid' && filteredDocs.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              {selectedDocs.length === filteredDocs.length ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>

        {/* Document Grid/Table */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  isSelected={selectedDocs.includes(doc.id)}
                  onSelect={() => toggleSelect(doc.id)}
                  onView={() => console.log('View', doc.id)}
                  onEdit={() => console.log('Edit', doc.id)}
                  onDelete={() => console.log('Delete', doc.id)}
                  onDownload={() => console.log('Download', doc.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-200/50 dark:border-surface-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="px-4 py-3 text-left">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleSelectAll}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                          selectedDocs.length === filteredDocs.length && filteredDocs.length > 0
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'border-surface-300 dark:border-surface-500'
                        )}
                      >
                        {selectedDocs.length === filteredDocs.length && filteredDocs.length > 0 && (
                          <Check className="w-3 h-3" />
                        )}
                      </motion.button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Access
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                  <AnimatePresence>
                    {filteredDocs.map((doc) => (
                      <DocumentRow
                        key={doc.id}
                        doc={doc}
                        isSelected={selectedDocs.includes(doc.id)}
                        onSelect={() => toggleSelect(doc.id)}
                        onView={() => console.log('View', doc.id)}
                        onEdit={() => console.log('Edit', doc.id)}
                        onDelete={() => console.log('Delete', doc.id)}
                        onDownload={() => console.log('Download', doc.id)}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredDocs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-surface-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
              No documents found
            </h3>
            <p className="text-surface-500 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setAccessFilter('all');
              }}
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}
