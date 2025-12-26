import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Check
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  searchable?: boolean;
  searchPlaceholder?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  actions?: (row: T) => React.ReactNode;
  pagination?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  isLoading?: boolean;
  onExport?: () => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  searchable = true,
  searchPlaceholder = 'Search...',
  selectable = false,
  onSelectionChange,
  actions,
  pagination = true,
  pageSize = 10,
  emptyMessage = 'No data found',
  isLoading = false,
  onExport,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    } else {
      const newSelected = new Set(paginatedData.map((row) => String(row[keyField])));
      setSelectedIds(newSelected);
      onSelectionChange?.(Array.from(newSelected));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const getValue = (row: T, key: string) => {
    const keys = key.split('.');
    let value: any = row;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Toolbar */}
      {(searchable || onExport) && (
        <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {searchable && (
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            {selectedIds.size > 0 && (
              <span className="text-sm text-surface-600 dark:text-surface-400">
                {selectedIds.size} selected
              </span>
            )}
          </div>

          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 dark:bg-surface-700/50">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer select-none hover:text-surface-900 dark:hover:text-surface-200',
                    column.width
                  )}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && sortColumn === column.key && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="w-20 px-4 py-3 text-right text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {selectable && (
                    <td className="px-4 py-3">
                      <div className="w-4 h-4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
                    </td>
                  )}
                  {columns.map((column, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 bg-surface-200 dark:bg-surface-700 rounded animate-pulse ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-surface-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <motion.tr
                  key={String(row[keyField])}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    'hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors',
                    selectedIds.has(String(row[keyField])) && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(String(row[keyField]))}
                        onChange={() => handleSelectRow(String(row[keyField]))}
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-3 text-sm text-surface-700 dark:text-surface-300"
                    >
                      {column.render
                        ? column.render(row)
                        : getValue(row, String(column.key))}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      {actions(row)}
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="p-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                    currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
                  )}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
