import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout,
  Star,
  Clock,
  Users,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  Network,
  BarChart3,
  FileText,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { RESEARCH_CATEGORIES, RESEARCH_METHODOLOGIES } from '@/stores/researchStore';
import type { ResearchTemplate, ResearchCategory, ResearchMethodology } from '@/types';

interface TemplatesGalleryProps {
  onSelectTemplate: (template: ResearchTemplate) => void;
  onClose?: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  intermediate: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  advanced: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function TemplatesGallery({ onSelectTemplate, onClose }: TemplatesGalleryProps) {
  const { token } = useAuthStore();
  const [templates, setTemplates] = useState<ResearchTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResearchCategory | 'all'>('all');
  const [selectedMethodology, setSelectedMethodology] = useState<ResearchMethodology | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ResearchTemplate | null>(null);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/v1/research/templates`;
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedMethodology !== 'all') params.append('methodology', selectedMethodology);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory, selectedMethodology]);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredTemplates = filteredTemplates.filter(t => t.isFeatured);
  const otherTemplates = filteredTemplates.filter(t => !t.isFeatured);

  const handleSelectTemplate = (template: ResearchTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary-500" />
            Research Templates
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Start your research with a pre-built template
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 dark:text-surface-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ResearchCategory | 'all')}
            className="px-4 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Object.entries(RESEARCH_CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label}</option>
            ))}
          </select>
          <select
            value={selectedMethodology}
            onChange={(e) => setSelectedMethodology(e.target.value as ResearchMethodology | 'all')}
            className="px-4 py-2.5 border border-surface-300 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Methods</option>
            {Object.entries(RESEARCH_METHODOLOGIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Layout className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-2">
            No templates found
          </h3>
          <p className="text-surface-500 dark:text-surface-400">
            Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Templates */}
          {featuredTemplates.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-secondary-500" />
                Featured Templates
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {featuredTemplates.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    isSelected={selectedTemplate?.id === template.id}
                    onSelect={() => handleSelectTemplate(template)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Templates */}
          {otherTemplates.length > 0 && (
            <div>
              {featuredTemplates.length > 0 && (
                <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-4">
                  All Templates
                </h3>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherTemplates.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    isSelected={selectedTemplate?.id === template.id}
                    onSelect={() => handleSelectTemplate(template)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selection Footer */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 p-4 shadow-lg z-50"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Layout className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-50">
                    {selectedTemplate.name}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {RESEARCH_METHODOLOGIES[selectedTemplate.methodology]} • {selectedTemplate.estimatedDurationDays} days
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSelection}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  <Check className="w-4 h-4" />
                  Use This Template
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TemplateCardProps {
  template: ResearchTemplate;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
}

function TemplateCard({ template, index, isSelected, onSelect, compact }: TemplateCardProps) {
  const category = RESEARCH_CATEGORIES[template.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={cn(
        'relative bg-white dark:bg-surface-800 rounded-xl border-2 cursor-pointer transition-all overflow-hidden group',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600'
      )}
    >
      {/* Featured badge */}
      {template.isFeatured && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary-500 text-white text-xs font-medium rounded-full">
            <Star className="w-3 h-3" />
            Featured
          </span>
        </div>
      )}

      <div className={cn('p-5', compact && 'p-4')}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            'p-2.5 rounded-xl',
            category?.color || 'bg-primary-100 dark:bg-primary-900/30'
          )}>
            <Network className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-surface-900 dark:text-surface-50 truncate">
              {template.name}
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {category?.label || template.category}
            </p>
          </div>
        </div>

        {/* Description */}
        {!compact && template.description && (
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-4 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={cn(
            'px-2 py-0.5 text-xs rounded-full',
            DIFFICULTY_COLORS[template.difficultyLevel]
          )}>
            {DIFFICULTY_LABELS[template.difficultyLevel]}
          </span>
          <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {template.estimatedDurationDays} days
          </span>
          {template.usageCount > 0 && (
            <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {template.usageCount} uses
            </span>
          )}
        </div>

        {/* Objectives Preview */}
        {!compact && template.defaultObjectives && template.defaultObjectives.length > 0 && (
          <div className="border-t border-surface-100 dark:border-surface-700 pt-3 mt-3">
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">
              Objectives:
            </p>
            <ul className="space-y-1">
              {template.defaultObjectives.slice(0, 2).map((obj, i) => (
                <li key={i} className="text-xs text-surface-600 dark:text-surface-400 flex items-start gap-2">
                  <span className="w-1 h-1 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span className="line-clamp-1">{obj}</span>
                </li>
              ))}
              {template.defaultObjectives.length > 2 && (
                <li className="text-xs text-primary-500">
                  +{template.defaultObjectives.length - 2} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Milestones Preview */}
        {!compact && template.structure?.milestones && (
          <div className="border-t border-surface-100 dark:border-surface-700 pt-3 mt-3">
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">
              Milestones:
            </p>
            <div className="flex flex-wrap gap-1">
              {template.structure.milestones.slice(0, 3).map((milestone, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-xs rounded"
                >
                  {milestone}
                </span>
              ))}
              {template.structure.milestones.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-surface-400 dark:text-surface-500">
                  +{template.structure.milestones.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 bg-primary-500/5 pointer-events-none" />
      )}

      {/* Hover arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-5 h-5 text-primary-500" />
      </div>
    </motion.div>
  );
}

export default TemplatesGallery;
