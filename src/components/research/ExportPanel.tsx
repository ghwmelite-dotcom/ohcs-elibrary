import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileText,
  FileCode,
  File,
  Copy,
  Check,
  Loader2,
  Clock,
  ChevronDown,
  Eye,
  X,
  Settings2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import type { ResearchExport, ExportType, FormatStyle } from '@/types';

interface ExportPanelProps {
  projectId: string;
  projectTitle: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://ohcs-elibrary-api.ghwmelite.workers.dev';

const EXPORT_TYPES: Record<ExportType, { label: string; icon: typeof FileText; description: string }> = {
  markdown: { label: 'Markdown', icon: FileCode, description: 'Plain text with formatting' },
  pdf: { label: 'PDF', icon: FileText, description: 'Professional document format' },
  docx: { label: 'Word', icon: File, description: 'Microsoft Word document' },
  html: { label: 'HTML', icon: FileCode, description: 'Web page format' },
  latex: { label: 'LaTeX', icon: FileCode, description: 'Academic typesetting' },
  bibtex: { label: 'BibTeX', icon: FileCode, description: 'Bibliography only' },
};

const FORMAT_STYLES: Record<FormatStyle, string> = {
  apa: 'APA 7th Edition',
  mla: 'MLA 9th Edition',
  chicago: 'Chicago 17th Edition',
  harvard: 'Harvard Style',
  ieee: 'IEEE Style',
  custom: 'Custom',
};

const CONTENT_SECTIONS = [
  { id: 'overview', label: 'Overview & Abstract' },
  { id: 'methodology', label: 'Methodology' },
  { id: 'findings', label: 'Findings' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'conclusions', label: 'Conclusions' },
  { id: 'insights', label: 'AI Insights' },
];

export function ExportPanel({ projectId, projectTitle }: ExportPanelProps) {
  const { token } = useAuthStore();
  const [exports, setExports] = useState<ResearchExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Export options
  const [exportType, setExportType] = useState<ExportType>('markdown');
  const [formatStyle, setFormatStyle] = useState<FormatStyle>('apa');
  const [selectedSections, setSelectedSections] = useState<string[]>(['overview', 'methodology', 'findings', 'conclusions']);
  const [includeCitations, setIncludeCitations] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

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

  const fetchExports = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE}/api/v1/research/projects/${projectId}/exports`);
      if (response.ok) {
        const data = await response.json();
        setExports(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch exports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExports();
  }, [projectId]);

  const handleGenerateExport = async () => {
    setGenerating(true);
    try {
      const response = await authFetch(`${API_BASE}/api/v1/research/projects/${projectId}/exports`, {
        method: 'POST',
        body: JSON.stringify({
          exportType,
          formatStyle,
          contentSections: selectedSections,
          includeCitations,
          includeAppendices: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data.content || data.markdown || '');
        setShowPreview('new');
        await fetchExports();
      }
    } catch (err) {
      console.error('Failed to generate export:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(previewContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([previewContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-primary-500" />
          Export Research
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Generate and download your research in various formats
        </p>
      </div>

      {/* Export Generator */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
            Generate New Export
          </h3>

          {/* Format Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {Object.entries(EXPORT_TYPES).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = exportType === key;
              const isSupported = key === 'markdown'; // Only markdown is fully supported for now

              return (
                <button
                  key={key}
                  onClick={() => isSupported && setExportType(key as ExportType)}
                  disabled={!isSupported}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    isActive
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : isSupported
                        ? 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                        : 'border-surface-100 dark:border-surface-800 opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon className={cn(
                    'w-6 h-6 mx-auto mb-2',
                    isActive ? 'text-primary-500' : 'text-surface-400 dark:text-surface-500'
                  )} />
                  <p className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-primary-700 dark:text-primary-300' : 'text-surface-700 dark:text-surface-300'
                  )}>
                    {config.label}
                  </p>
                  {!isSupported && (
                    <span className="text-xs text-surface-400 dark:text-surface-500 mt-1">Coming soon</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Options Toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-500 mb-4"
          >
            <Settings2 className="w-4 h-4" />
            Advanced Options
            <ChevronDown className={cn('w-4 h-4 transition-transform', showOptions && 'rotate-180')} />
          </button>

          {/* Advanced Options */}
          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pb-4">
                  {/* Citation Style */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Citation Style
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(FORMAT_STYLES).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setFormatStyle(key as FormatStyle)}
                          className={cn(
                            'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                            formatStyle === key
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Sections */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Include Sections
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CONTENT_SECTIONS.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => toggleSection(section.id)}
                          className={cn(
                            'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                            selectedSections.includes(section.id)
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                              : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                          )}
                        >
                          {section.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Include Citations */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCitations}
                      onChange={(e) => setIncludeCitations(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-surface-300 dark:border-surface-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      Include References Section
                    </span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <button
            onClick={handleGenerateExport}
            disabled={generating || selectedSections.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Generate Export
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Export Preview
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyContent}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => setShowPreview(null)}
                    className="p-1.5 text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
                <pre className="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-300 font-mono bg-surface-50 dark:bg-surface-900 p-4 rounded-lg">
                  {previewContent}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous Exports */}
      {!loading && exports.length > 0 && (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-surface-400 dark:text-surface-500" />
              Export History
            </h3>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-700">
            {exports.slice(0, 5).map((exp) => (
              <div key={exp.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-100 dark:bg-surface-700 rounded-lg">
                    <FileText className="w-4 h-4 text-surface-500 dark:text-surface-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {exp.title}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {exp.exportType.toUpperCase()} • {FORMAT_STYLES[exp.formatStyle]} •{' '}
                      {exp.generatedAt ? new Date(exp.generatedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Pending'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {exp.status === 'completed' && (
                    <button
                      onClick={() => {
                        const url = `${API_BASE}/api/v1/research/projects/${projectId}/exports/${exp.id}/download`;
                        const a = document.createElement('a');
                        a.href = token ? `${url}?token=${encodeURIComponent(token)}` : url;
                        a.download = `${exp.title || 'export'}.md`;
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="p-1.5 text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <span className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    exp.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                    exp.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                  )}>
                    {exp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportPanel;
