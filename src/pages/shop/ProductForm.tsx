import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Package, ArrowLeft, Save, Send, Loader2, Image as ImageIcon,
  Plus, X, BookOpen, FileText, Upload, DollarSign, Boxes,
  Tag, Globe, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { cn } from '@/utils/cn';
import { useProductsStore, ProductFormData } from '@/stores/shopStore';
import { useSellerStore } from '@/stores/shopStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/shared/Toast';

const productTypes = [
  {
    value: 'digital',
    label: 'Digital Product',
    description: 'E-books, PDFs, downloadable files',
    icon: FileText,
  },
  {
    value: 'physical',
    label: 'Physical Product',
    description: 'Printed books, merchandise',
    icon: Package,
  },
  {
    value: 'bundle',
    label: 'Bundle',
    description: 'Collection of products',
    icon: Boxes,
  },
];

const defaultFormData: ProductFormData = {
  title: '',
  description: '',
  shortDescription: '',
  categoryId: '',
  price: 0,
  compareAtPrice: undefined,
  productType: 'digital',
  stockQuantity: 0,
  trackInventory: false,
  allowBackorder: false,
  language: 'en',
  status: 'draft',
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditing = Boolean(id);

  const { isAuthenticated } = useAuthStore();
  const { profile, fetchDashboard, isLoadingDashboard } = useSellerStore();
  const {
    selectedProduct,
    categories,
    isLoading,
    isSubmitting,
    fetchProduct,
    fetchCategories,
    createProduct,
    updateProduct,
    clearSelectedProduct,
  } = useProductsStore();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    pricing: true,
    media: false,
    bookDetails: false,
    inventory: false,
    seo: false,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    defaultValues: defaultFormData,
  });

  const productType = watch('productType');
  const trackInventory = watch('trackInventory');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
      fetchCategories();
    }
  }, [isAuthenticated, fetchDashboard, fetchCategories]);

  useEffect(() => {
    if (isEditing && id && profile) {
      fetchProduct(id).then(product => {
        if (product) {
          reset({
            title: product.title,
            description: product.description,
            shortDescription: product.shortDescription || '',
            categoryId: product.categoryId,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            productType: product.productType,
            digitalFileUrl: product.digitalFileUrl,
            digitalFileName: product.digitalFileName,
            previewUrl: product.previewUrl,
            downloadLimit: product.downloadLimit,
            weight: product.weight,
            requiresShipping: product.requiresShipping,
            sku: product.sku,
            stockQuantity: product.stockQuantity,
            trackInventory: product.trackInventory,
            allowBackorder: product.allowBackorder,
            lowStockThreshold: product.lowStockThreshold,
            coverImage: product.coverImage,
            images: product.images,
            videoUrl: product.videoUrl,
            author: product.author,
            coAuthors: product.coAuthors,
            isbn: product.isbn,
            publisher: product.publisher,
            publishYear: product.publishYear,
            edition: product.edition,
            language: product.language,
            pages: product.pages,
            format: product.format,
            tags: product.tags,
            searchKeywords: product.searchKeywords,
            metaTitle: product.metaTitle,
            metaDescription: product.metaDescription,
            status: product.status === 'draft' || product.status === 'rejected' ? 'draft' : 'draft',
          });
        }
      });
    }

    return () => {
      clearSelectedProduct();
    };
  }, [isEditing, id, profile, fetchProduct, reset, clearSelectedProduct]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditing && id) {
        await updateProduct(id, data);
        toast.success('Product Updated', 'Your changes have been saved');
      } else {
        const result = await createProduct(data);
        toast.success('Product Created', 'Your product has been saved as a draft');
        navigate(`/shop/seller/products/${result.id}/edit`);
      }
    } catch (error) {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to save product');
    }
  };

  const handleSaveAndSubmit = async () => {
    const data = watch();
    data.status = 'pending_review';

    try {
      if (isEditing && id) {
        await updateProduct(id, data);
      } else {
        await createProduct(data);
      }
      toast.success('Submitted', 'Product has been submitted for review');
      navigate('/shop/seller/products');
    } catch (error) {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to submit product');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-surface-300 mb-4" />
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            Please sign in to manage products
          </p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (isLoadingDashboard || (isEditing && isLoading)) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-surface-300 mb-4" />
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            You need to be an approved seller to manage products.
          </p>
          <Button onClick={() => navigate('/shop/become-seller')}>Become a Seller</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/shop/seller/products"
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-surface-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {isEditing ? 'Edit Product' : 'New Product'}
              </h1>
              <p className="text-surface-600 dark:text-surface-400 mt-1">
                {isEditing ? 'Update your product details' : 'Create a new product listing'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={handleSaveAndSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit for Review
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <button
              type="button"
              onClick={() => toggleSection('basic')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                    Basic Information
                  </h2>
                  <p className="text-sm text-surface-500">Title, description, and category</p>
                </div>
              </div>
              {expandedSections.basic ? (
                <ChevronUp className="w-5 h-5 text-surface-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-surface-400" />
              )}
            </button>

            {expandedSections.basic && (
              <div className="px-4 pb-4 space-y-4 border-t border-surface-200 dark:border-surface-700 pt-4">
                {/* Product Type */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Product Type *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {productTypes.map(type => (
                      <label
                        key={type.value}
                        className={cn(
                          'flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all',
                          productType === type.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                        )}
                      >
                        <input
                          type="radio"
                          value={type.value}
                          {...register('productType')}
                          className="sr-only"
                        />
                        <type.icon className={cn(
                          'w-8 h-8 mb-2',
                          productType === type.value ? 'text-primary-600' : 'text-surface-400'
                        )} />
                        <span className={cn(
                          'font-medium text-sm',
                          productType === type.value
                            ? 'text-primary-600'
                            : 'text-surface-700 dark:text-surface-300'
                        )}>
                          {type.label}
                        </span>
                        <span className="text-xs text-surface-500 text-center mt-1">
                          {type.description}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Product Title *
                  </label>
                  <Input
                    {...register('title', { required: 'Title is required' })}
                    placeholder="Enter product title"
                    error={errors.title?.message}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Category *
                  </label>
                  <select
                    {...register('categoryId', { required: 'Category is required' })}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border bg-white dark:bg-surface-800',
                      'text-surface-900 dark:text-surface-50',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500',
                      errors.categoryId
                        ? 'border-error-500'
                        : 'border-surface-300 dark:border-surface-600'
                    )}
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-sm text-error-500 mt-1">{errors.categoryId.message}</p>
                  )}
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Short Description
                  </label>
                  <Input
                    {...register('shortDescription')}
                    placeholder="Brief summary (shown in product cards)"
                  />
                  <p className="text-xs text-surface-500 mt-1">Max 500 characters</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Full Description *
                  </label>
                  <textarea
                    {...register('description', {
                      required: 'Description is required',
                      minLength: { value: 50, message: 'Description must be at least 50 characters' },
                    })}
                    rows={6}
                    placeholder="Detailed product description..."
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border bg-white dark:bg-surface-800',
                      'text-surface-900 dark:text-surface-50',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500',
                      errors.description
                        ? 'border-error-500'
                        : 'border-surface-300 dark:border-surface-600'
                    )}
                  />
                  {errors.description && (
                    <p className="text-sm text-error-500 mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <button
              type="button"
              onClick={() => toggleSection('pricing')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success-100 dark:bg-success-900/30">
                  <DollarSign className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                    Pricing
                  </h2>
                  <p className="text-sm text-surface-500">Set your product price</p>
                </div>
              </div>
              {expandedSections.pricing ? (
                <ChevronUp className="w-5 h-5 text-surface-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-surface-400" />
              )}
            </button>

            {expandedSections.pricing && (
              <div className="px-4 pb-4 space-y-4 border-t border-surface-200 dark:border-surface-700 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Price (GHS) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('price', {
                        required: 'Price is required',
                        min: { value: 0, message: 'Price must be positive' },
                        valueAsNumber: true,
                      })}
                      placeholder="0.00"
                      leftIcon={<DollarSign className="w-5 h-5" />}
                      error={errors.price?.message}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Compare at Price (GHS)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('compareAtPrice', { valueAsNumber: true })}
                      placeholder="Original price"
                      leftIcon={<DollarSign className="w-5 h-5" />}
                    />
                    <p className="text-xs text-surface-500 mt-1">Show as crossed-out price</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Media */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <button
              type="button"
              onClick={() => toggleSection('media')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info-100 dark:bg-info-900/30">
                  <ImageIcon className="w-5 h-5 text-info-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                    Media
                  </h2>
                  <p className="text-sm text-surface-500">Cover image and gallery</p>
                </div>
              </div>
              {expandedSections.media ? (
                <ChevronUp className="w-5 h-5 text-surface-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-surface-400" />
              )}
            </button>

            {expandedSections.media && (
              <div className="px-4 pb-4 space-y-4 border-t border-surface-200 dark:border-surface-700 pt-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Cover Image URL
                  </label>
                  <Input
                    {...register('coverImage')}
                    placeholder="https://example.com/image.jpg"
                    leftIcon={<ImageIcon className="w-5 h-5" />}
                  />
                  <p className="text-xs text-surface-500 mt-1">
                    Recommended: 800x600px, max 2MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Video URL (Optional)
                  </label>
                  <Input
                    {...register('videoUrl')}
                    placeholder="YouTube or Vimeo URL"
                  />
                </div>

                {productType === 'digital' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Digital File URL *
                      </label>
                      <Input
                        {...register('digitalFileUrl')}
                        placeholder="URL to downloadable file"
                        leftIcon={<Upload className="w-5 h-5" />}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Preview URL
                      </label>
                      <Input
                        {...register('previewUrl')}
                        placeholder="URL to preview/sample file"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <button
              type="button"
              onClick={() => toggleSection('bookDetails')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
                  <BookOpen className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                    Book Details
                  </h2>
                  <p className="text-sm text-surface-500">Author, ISBN, publisher info</p>
                </div>
              </div>
              {expandedSections.bookDetails ? (
                <ChevronUp className="w-5 h-5 text-surface-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-surface-400" />
              )}
            </button>

            {expandedSections.bookDetails && (
              <div className="px-4 pb-4 space-y-4 border-t border-surface-200 dark:border-surface-700 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Author
                    </label>
                    <Input
                      {...register('author')}
                      placeholder="Author name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      ISBN
                    </label>
                    <Input
                      {...register('isbn')}
                      placeholder="ISBN-13"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Publisher
                    </label>
                    <Input
                      {...register('publisher')}
                      placeholder="Publisher name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Publication Year
                    </label>
                    <Input
                      type="number"
                      {...register('publishYear', { valueAsNumber: true })}
                      placeholder="2025"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Edition
                    </label>
                    <Input
                      {...register('edition')}
                      placeholder="1st Edition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Language
                    </label>
                    <select
                      {...register('language')}
                      className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50"
                    >
                      <option value="en">English</option>
                      <option value="tw">Twi</option>
                      <option value="ga">Ga</option>
                      <option value="ee">Ewe</option>
                      <option value="ha">Hausa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Pages
                    </label>
                    <Input
                      type="number"
                      {...register('pages', { valueAsNumber: true })}
                      placeholder="Number of pages"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Format
                  </label>
                  <Input
                    {...register('format')}
                    placeholder="e.g., PDF, EPUB, Paperback"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Inventory (for physical products) */}
          {productType === 'physical' && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
              <button
                type="button"
                onClick={() => toggleSection('inventory')}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Boxes className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                      Inventory
                    </h2>
                    <p className="text-sm text-surface-500">Stock and shipping settings</p>
                  </div>
                </div>
                {expandedSections.inventory ? (
                  <ChevronUp className="w-5 h-5 text-surface-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-surface-400" />
                )}
              </button>

              {expandedSections.inventory && (
                <div className="px-4 pb-4 space-y-4 border-t border-surface-200 dark:border-surface-700 pt-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      {...register('trackInventory')}
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label className="text-sm text-surface-700 dark:text-surface-300">
                      Track inventory for this product
                    </label>
                  </div>

                  {trackInventory && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Stock Quantity
                        </label>
                        <Input
                          type="number"
                          min="0"
                          {...register('stockQuantity', { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Low Stock Alert
                        </label>
                        <Input
                          type="number"
                          min="0"
                          {...register('lowStockThreshold', { valueAsNumber: true })}
                          placeholder="5"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      {...register('allowBackorder')}
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label className="text-sm text-surface-700 dark:text-surface-300">
                      Allow customers to order when out of stock
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      SKU (Stock Keeping Unit)
                    </label>
                    <Input
                      {...register('sku')}
                      placeholder="Product SKU"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Weight (kg)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('weight', { valueAsNumber: true })}
                      placeholder="Product weight"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SEO */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <button
              type="button"
              onClick={() => toggleSection('seo')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                    SEO & Tags
                  </h2>
                  <p className="text-sm text-surface-500">Search optimization</p>
                </div>
              </div>
              {expandedSections.seo ? (
                <ChevronUp className="w-5 h-5 text-surface-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-surface-400" />
              )}
            </button>

            {expandedSections.seo && (
              <div className="px-4 pb-4 space-y-4 border-t border-surface-200 dark:border-surface-700 pt-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Meta Title
                  </label>
                  <Input
                    {...register('metaTitle')}
                    placeholder="SEO title (max 70 characters)"
                    maxLength={70}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    {...register('metaDescription')}
                    rows={3}
                    maxLength={160}
                    placeholder="SEO description (max 160 characters)"
                    className="w-full px-4 py-3 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Search Keywords
                  </label>
                  <Input
                    {...register('searchKeywords')}
                    placeholder="Comma-separated keywords"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/shop/seller/products')}
            >
              Cancel
            </Button>

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={handleSaveAndSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit for Review
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
