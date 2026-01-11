import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package, Plus, Search, Filter, MoreVertical, Eye, Edit,
  Copy, Trash2, Send, Globe, EyeOff, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, CheckCircle2, Clock, XCircle, FileSearch,
  ArrowLeft, BookOpen, DollarSign
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { cn } from '@/utils/cn';
import { useProductsStore } from '@/stores/shopStore';
import { useSellerStore } from '@/stores/shopStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/shared/Toast';
import type { Product, ProductStatus } from '@/types/shop';

const statusConfig: Record<ProductStatus, {
  label: string;
  icon: typeof Clock;
  color: string;
  bgColor: string;
}> = {
  draft: {
    label: 'Draft',
    icon: Edit,
    color: 'text-surface-600',
    bgColor: 'bg-surface-100 dark:bg-surface-700',
  },
  pending_review: {
    label: 'Pending Review',
    icon: Clock,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100 dark:bg-warning-900/30',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-success-600',
    bgColor: 'bg-success-100 dark:bg-success-900/30',
  },
  published: {
    label: 'Published',
    icon: Globe,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-error-600',
    bgColor: 'bg-error-100 dark:bg-error-900/30',
  },
  archived: {
    label: 'Archived',
    icon: Package,
    color: 'text-surface-500',
    bgColor: 'bg-surface-100 dark:bg-surface-800',
  },
};

const statusTabs = [
  { value: 'all', label: 'All Products' },
  { value: 'draft', label: 'Drafts' },
  { value: 'pending_review', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
];

export default function SellerProducts() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuthStore();
  const { profile, fetchDashboard, isLoadingDashboard } = useSellerStore();
  const {
    products,
    statusCounts,
    pagination,
    filters,
    isLoading,
    isSubmitting,
    fetchProducts,
    fetchCategories,
    deleteProduct,
    duplicateProduct,
    submitForReview,
    publishProduct,
    unpublishProduct,
    setFilters,
  } = useProductsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
      fetchCategories();
    }
  }, [isAuthenticated, fetchDashboard, fetchCategories]);

  useEffect(() => {
    if (profile) {
      fetchProducts();
    }
  }, [profile, fetchProducts]);

  const handleSearch = () => {
    setFilters({ search: searchQuery });
    fetchProducts({ search: searchQuery, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ status });
    fetchProducts({ status, page: 1 });
  };

  const handlePageChange = (page: number) => {
    fetchProducts({ page });
  };

  const handleAction = async (action: string, product: Product) => {
    setShowActions(null);

    try {
      switch (action) {
        case 'edit':
          navigate(`/shop/seller/products/${product.id}/edit`);
          break;
        case 'view':
          window.open(`/shop/product/${product.slug}`, '_blank');
          break;
        case 'duplicate':
          const newProduct = await duplicateProduct(product.id);
          toast.success('Product Duplicated', `"${newProduct.title}" has been created`);
          break;
        case 'submit':
          await submitForReview(product.id);
          toast.success('Submitted', 'Product submitted for review');
          break;
        case 'publish':
          await publishProduct(product.id);
          toast.success('Published', 'Product is now live');
          break;
        case 'unpublish':
          await unpublishProduct(product.id);
          toast.success('Unpublished', 'Product is no longer visible');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to archive this product?')) {
            await deleteProduct(product.id);
            toast.success('Archived', 'Product has been archived');
          }
          break;
      }
    } catch (error) {
      toast.error('Action Failed', error instanceof Error ? error.message : 'Please try again');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-surface-300 mb-4" />
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
            Products
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            Please sign in to manage your products
          </p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (isLoadingDashboard) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Package className="w-16 h-16 mx-auto text-surface-300 mb-4" />
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
            Not a Seller
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            You need to be an approved seller to manage products.
          </p>
          <Button onClick={() => navigate('/shop/become-seller')}>
            Become a Seller
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/shop/seller/dashboard"
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-surface-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                Products
              </h1>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                Manage your product listings
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/shop/seller/products/new')}
            className="mt-4 md:mt-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {statusCounts.all || 0}
                </p>
                <p className="text-xs text-surface-500">Total Products</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-100 dark:bg-success-900/30">
                <Globe className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {statusCounts.published || 0}
                </p>
                <p className="text-xs text-surface-500">Published</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
                <Clock className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {statusCounts.pending_review || 0}
                </p>
                <p className="text-xs text-surface-500">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700">
                <Edit className="w-5 h-5 text-surface-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {statusCounts.draft || 0}
                </p>
                <p className="text-xs text-surface-500">Drafts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 mb-6">
          {/* Status Tabs */}
          <div className="flex overflow-x-auto border-b border-surface-200 dark:border-surface-700">
            {statusTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => handleStatusFilter(tab.value)}
                className={cn(
                  'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  filters.status === tab.value
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                )}
              >
                {tab.label}
                {statusCounts[tab.value] !== undefined && (
                  <span className="ml-2 text-xs bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">
                    {statusCounts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search products by title, author, ISBN..."
                  leftIcon={<Search className="w-5 h-5" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-surface-300 mb-4" />
              <p className="text-surface-500 mb-2">No products found</p>
              <p className="text-sm text-surface-400 mb-6">
                {filters.status === 'all'
                  ? "You haven't created any products yet"
                  : `No products with status "${filters.status}"`}
              </p>
              <Button onClick={() => navigate('/shop/seller/products/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Product
              </Button>
            </div>
          ) : (
            <>
              {/* Products Grid/List */}
              <div className="divide-y divide-surface-200 dark:divide-surface-700">
                {products.map((product) => {
                  const status = statusConfig[product.status as ProductStatus] || statusConfig.draft;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={product.id}
                      className="p-4 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 rounded-lg bg-surface-100 dark:bg-surface-700 flex-shrink-0 overflow-hidden">
                          {product.coverImage ? (
                            <img
                              src={product.coverImage}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-surface-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-surface-900 dark:text-surface-50 line-clamp-1">
                                {product.title}
                              </h3>
                              <p className="text-sm text-surface-500 mt-0.5">
                                {product.author || 'No author'} &bull; {product.productType}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="relative">
                              <button
                                onClick={() => setShowActions(showActions === product.id ? null : product.id)}
                                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                              >
                                <MoreVertical className="w-5 h-5 text-surface-400" />
                              </button>

                              {showActions === product.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowActions(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 z-20 py-1">
                                    <button
                                      onClick={() => handleAction('edit', product)}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit
                                    </button>
                                    {product.status === 'published' && (
                                      <button
                                        onClick={() => handleAction('view', product)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                                      >
                                        <Eye className="w-4 h-4" />
                                        View in Store
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleAction('duplicate', product)}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                                    >
                                      <Copy className="w-4 h-4" />
                                      Duplicate
                                    </button>
                                    {(product.status === 'draft' || product.status === 'rejected') && (
                                      <button
                                        onClick={() => handleAction('submit', product)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                      >
                                        <Send className="w-4 h-4" />
                                        Submit for Review
                                      </button>
                                    )}
                                    {product.status === 'approved' && (
                                      <button
                                        onClick={() => handleAction('publish', product)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20"
                                      >
                                        <Globe className="w-4 h-4" />
                                        Publish
                                      </button>
                                    )}
                                    {product.status === 'published' && (
                                      <button
                                        onClick={() => handleAction('unpublish', product)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20"
                                      >
                                        <EyeOff className="w-4 h-4" />
                                        Unpublish
                                      </button>
                                    )}
                                    <hr className="my-1 border-surface-200 dark:border-surface-700" />
                                    <button
                                      onClick={() => handleAction('delete', product)}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Archive
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status & Stats */}
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                              status.bgColor, status.color
                            )}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {status.label}
                            </span>

                            <div className="flex items-center gap-1 text-sm text-surface-500">
                              <DollarSign className="w-4 h-4" />
                              GHS {product.price?.toLocaleString() || '0'}
                            </div>

                            <div className="flex items-center gap-1 text-sm text-surface-500">
                              <Eye className="w-4 h-4" />
                              {product.viewCount || 0} views
                            </div>

                            <div className="flex items-center gap-1 text-sm text-surface-500">
                              <Package className="w-4 h-4" />
                              {product.salesCount || 0} sales
                            </div>

                            {product.stockQuantity !== undefined && product.trackInventory && (
                              <div className={cn(
                                'flex items-center gap-1 text-sm',
                                product.stockQuantity <= (product.lowStockThreshold || 5)
                                  ? 'text-warning-600'
                                  : 'text-surface-500'
                              )}>
                                Stock: {product.stockQuantity}
                              </div>
                            )}
                          </div>

                          {/* Rejection Reason */}
                          {product.status === 'rejected' && product.rejectionReason && (
                            <div className="mt-3 p-2 bg-error-50 dark:bg-error-900/20 rounded-lg">
                              <p className="text-sm text-error-700 dark:text-error-300">
                                <span className="font-medium">Rejection reason:</span> {product.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-700">
                  <p className="text-sm text-surface-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} products
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="flex items-center px-3 text-sm text-surface-600 dark:text-surface-400">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
