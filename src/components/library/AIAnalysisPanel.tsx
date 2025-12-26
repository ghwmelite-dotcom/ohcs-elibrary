import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ListChecks,
  FileText,
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn } from '@/utils/cn';

interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  topics: string[];
  readingTime: number;
  complexity: 'basic' | 'intermediate' | 'advanced';
  recommendations: string[];
}

interface AIAnalysisPanelProps {
  documentId: string;
  analysis?: AIAnalysis;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function AIAnalysisPanel({
  documentId,
  analysis,
  isLoading = false,
  onRefresh,
}: AIAnalysisPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sections = [
    {
      id: 'summary',
      title: 'AI Summary',
      icon: FileText,
      content: analysis?.summary,
    },
    {
      id: 'keyPoints',
      title: 'Key Points',
      icon: Lightbulb,
      content: analysis?.keyPoints,
    },
    {
      id: 'topics',
      title: 'Topics Covered',
      icon: ListChecks,
      content: analysis?.topics,
    },
    {
      id: 'recommendations',
      title: 'Related Reading',
      icon: MessageSquare,
      content: analysis?.recommendations,
    },
  ];

  const complexityColors = {
    basic: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    intermediate:
      'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    advanced: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
            <span className="font-semibold text-surface-900 dark:text-surface-50">
              AI Analysis
            </span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <span className="font-semibold text-surface-900 dark:text-surface-50">
              AI Analysis
            </span>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary-500" />
          </div>
          <p className="text-surface-600 dark:text-surface-400 mb-4">
            Get AI-powered insights about this document
          </p>
          <Button onClick={onRefresh} leftIcon={<Sparkles className="w-4 h-4" />}>
            Generate Analysis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-elevation-1 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="font-semibold text-surface-900 dark:text-surface-50">
            AI Analysis
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-3 bg-surface-50 dark:bg-surface-700/50 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-surface-500 dark:text-surface-400">
            Reading time:{' '}
            <span className="font-medium text-surface-700 dark:text-surface-300">
              {analysis.readingTime} min
            </span>
          </span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
              complexityColors[analysis.complexity]
            )}
          >
            {analysis.complexity}
          </span>
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-surface-200 dark:divide-surface-700">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              onClick={() =>
                setExpandedSection(expandedSection === section.id ? null : section.id)
              }
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <section.icon className="w-4 h-4 text-primary-500" />
                <span className="font-medium text-surface-900 dark:text-surface-50">
                  {section.title}
                </span>
              </div>
              {expandedSection === section.id ? (
                <ChevronUp className="w-4 h-4 text-surface-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-surface-400" />
              )}
            </button>

            <AnimatePresence>
              {expandedSection === section.id && section.content && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4 relative">
                      <button
                        onClick={() =>
                          handleCopy(
                            Array.isArray(section.content)
                              ? section.content.join('\n')
                              : section.content || '',
                            section.id
                          )
                        }
                        className="absolute top-2 right-2 p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-white dark:hover:bg-surface-600 rounded transition-colors"
                      >
                        {copiedSection === section.id ? (
                          <Check className="w-4 h-4 text-success-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {typeof section.content === 'string' ? (
                        <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed pr-8">
                          {section.content}
                        </p>
                      ) : (
                        <ul className="space-y-2 pr-8">
                          {section.content.map((item, index) => (
                            <li
                              key={index}
                              className="text-sm text-surface-700 dark:text-surface-300 flex items-start gap-2"
                            >
                              <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                                {index + 1}
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
