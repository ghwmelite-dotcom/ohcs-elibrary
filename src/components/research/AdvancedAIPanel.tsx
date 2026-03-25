import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Lightbulb,
  Tags,
  Network,
  Search,
  Sparkles,
  Loader2,
  Plus,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useResearchApi } from '@/hooks/useResearchApi';
import { ErrorAlert } from './ErrorAlert';

interface AdvancedAIPanelProps {
  projectId: string;
  project: any;
}

type AITab = 'literature-gaps' | 'question-refinement' | 'methodology' | 'auto-tags' | 'cross-insights';

const AI_TABS: Array<{ id: AITab; label: string; icon: typeof Brain; description: string }> = [
  { id: 'literature-gaps', label: 'Literature Gaps', icon: Search, description: 'Identify gaps in your literature review' },
  { id: 'question-refinement', label: 'Question Refinement', icon: Lightbulb, description: 'Refine your research question' },
  { id: 'methodology', label: 'Methodology', icon: Brain, description: 'Get methodology suggestions' },
  { id: 'auto-tags', label: 'Auto-Tags', icon: Tags, description: 'AI-generated topic tags' },
  { id: 'cross-insights', label: 'Cross-Project', icon: Network, description: 'Insights across projects' },
];

interface LiteratureGapResult {
  gaps: Array<{ area: string; description: string; priority: string }>;
  recommendations: Array<{ title: string; reason: string }>;
}

interface QuestionRefinementResult {
  critique: string;
  suggestions: Array<{ question: string; rationale: string }>;
}

interface MethodologyResult {
  recommended: { name: string; rationale: string; steps: string[] };
  alternatives: Array<{ name: string; rationale: string }>;
}

interface AutoTagResult {
  tags: Array<{ name: string; confidence: number }>;
}

interface CrossInsightResult {
  relatedProjects: Array<{
    projectId: string;
    title: string;
    connection: string;
    similarity: number;
  }>;
}

export function AdvancedAIPanel({ projectId, project }: AdvancedAIPanelProps) {
  const { authFetch } = useResearchApi();
  const [activeTab, setActiveTab] = useState<AITab>('literature-gaps');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results state
  const [literatureGaps, setLiteratureGaps] = useState<LiteratureGapResult | null>(null);
  const [questionRefinement, setQuestionRefinement] = useState<QuestionRefinementResult | null>(null);
  const [methodologySuggestions, setMethodologySuggestions] = useState<MethodologyResult | null>(null);
  const [autoTags, setAutoTags] = useState<AutoTagResult | null>(null);
  const [crossInsights, setCrossInsights] = useState<CrossInsightResult | null>(null);
  const [addedTags, setAddedTags] = useState<Set<string>>(new Set());

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      let response: Response;

      switch (activeTab) {
        case 'literature-gaps':
          response = await authFetch(
            `/projects/${projectId}/ai/literature-gaps`,
            { method: 'POST', body: JSON.stringify({}) }
          );
          if (response.ok) {
            const data = await response.json();
            setLiteratureGaps(data);
          } else {
            throw new Error('Failed to analyze literature gaps');
          }
          break;

        case 'question-refinement':
          response = await authFetch(
            `/projects/${projectId}/ai/refine-question`,
            {
              method: 'POST',
              body: JSON.stringify({
                question: project?.researchQuestion,
                category: project?.category,
                methodology: project?.methodology,
              }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            setQuestionRefinement(data);
          } else {
            throw new Error('Failed to refine question');
          }
          break;

        case 'methodology':
          response = await authFetch(
            `/projects/${projectId}/ai/suggest-methodology`,
            {
              method: 'POST',
              body: JSON.stringify({
                question: project?.researchQuestion,
                category: project?.category,
              }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            setMethodologySuggestions(data);
          } else {
            throw new Error('Failed to suggest methodology');
          }
          break;

        case 'auto-tags':
          response = await authFetch(
            `/projects/${projectId}/ai/auto-tags`,
            { method: 'POST', body: JSON.stringify({}) }
          );
          if (response.ok) {
            const data = await response.json();
            setAutoTags(data);
          } else {
            throw new Error('Failed to generate tags');
          }
          break;

        case 'cross-insights':
          response = await authFetch(
            `/projects/${projectId}/ai/cross-insights`
          );
          if (response.ok) {
            const data = await response.json();
            setCrossInsights(data);
          } else {
            throw new Error('Failed to fetch cross-project insights');
          }
          break;
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllTags = () => {
    if (autoTags?.tags) {
      setAddedTags(new Set(autoTags.tags.map(t => t.name)));
    }
  };

  const getResultForTab = (): boolean => {
    switch (activeTab) {
      case 'literature-gaps': return literatureGaps !== null;
      case 'question-refinement': return questionRefinement !== null;
      case 'methodology': return methodologySuggestions !== null;
      case 'auto-tags': return autoTags !== null;
      case 'cross-insights': return crossInsights !== null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          Advanced AI Analysis
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          AI-powered tools to enhance your research workflow
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-surface-200 dark:border-surface-700">
          {AI_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-50 dark:hover:bg-surface-700/50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Description & Run Button */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  {AI_TABS.find(t => t.id === activeTab)?.description}
                </p>
                <button
                  onClick={runAnalysis}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Run Analysis
                    </>
                  )}
                </button>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
              </AnimatePresence>

              {/* Results */}
              {!getResultForTab() && !loading && (
                <div className="text-center py-12">
                  <Brain className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                  <p className="text-surface-500 dark:text-surface-400 text-sm">
                    Click "Run Analysis" to generate AI insights
                  </p>
                </div>
              )}

              {/* Literature Gaps Results */}
              {activeTab === 'literature-gaps' && literatureGaps && (
                <div className="space-y-6">
                  {literatureGaps.gaps?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">
                        Identified Gaps
                      </h4>
                      <div className="space-y-3">
                        {literatureGaps.gaps.map((gap, i) => (
                          <div
                            key={i}
                            className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-medium text-surface-900 dark:text-white">
                                {gap.area}
                              </h5>
                              <span className={cn(
                                'px-2 py-0.5 text-xs rounded-full shrink-0',
                                gap.priority === 'high'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : gap.priority === 'medium'
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              )}>
                                {gap.priority}
                              </span>
                            </div>
                            <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                              {gap.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {literatureGaps.recommendations?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">
                        Recommendations
                      </h4>
                      <div className="space-y-2">
                        {literatureGaps.recommendations.map((rec, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-900/50 rounded-lg"
                          >
                            <ChevronRight className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-surface-900 dark:text-white">{rec.title}</p>
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{rec.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Question Refinement Results */}
              {activeTab === 'question-refinement' && questionRefinement && (
                <div className="space-y-6">
                  {questionRefinement.critique && (
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-2">
                        Analysis of Current Question
                      </h4>
                      <div className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-lg">
                        <p className="text-sm text-surface-700 dark:text-surface-300">
                          {questionRefinement.critique}
                        </p>
                      </div>
                    </div>
                  )}

                  {questionRefinement.suggestions?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">
                        Suggested Refinements
                      </h4>
                      <div className="space-y-3">
                        {questionRefinement.suggestions.map((suggestion, i) => (
                          <div
                            key={i}
                            className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg"
                          >
                            <p className="text-sm font-medium text-surface-900 dark:text-white italic">
                              "{suggestion.question}"
                            </p>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
                              {suggestion.rationale}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Methodology Results */}
              {activeTab === 'methodology' && methodologySuggestions && (
                <div className="space-y-6">
                  {methodologySuggestions.recommended && (
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">
                        Recommended Methodology
                      </h4>
                      <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
                        <h5 className="text-sm font-semibold text-surface-900 dark:text-white">
                          {methodologySuggestions.recommended.name}
                        </h5>
                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                          {methodologySuggestions.recommended.rationale}
                        </p>
                        {methodologySuggestions.recommended.steps?.length > 0 && (
                          <ol className="mt-3 space-y-1">
                            {methodologySuggestions.recommended.steps.map((step, i) => (
                              <li key={i} className="text-sm text-surface-700 dark:text-surface-300 flex items-start gap-2">
                                <span className="text-xs font-medium text-green-600 dark:text-green-400 mt-0.5 shrink-0">
                                  {i + 1}.
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </div>
                  )}

                  {methodologySuggestions.alternatives?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">
                        Alternative Approaches
                      </h4>
                      <div className="space-y-3">
                        {methodologySuggestions.alternatives.map((alt, i) => (
                          <div
                            key={i}
                            className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-lg"
                          >
                            <h5 className="text-sm font-medium text-surface-900 dark:text-white">{alt.name}</h5>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{alt.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auto-Tags Results */}
              {activeTab === 'auto-tags' && autoTags && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-white">
                      Suggested Tags
                    </h4>
                    <button
                      onClick={handleAddAllTags}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {autoTags.tags?.map((tag, i) => (
                      <motion.span
                        key={tag.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors',
                          addedTags.has(tag.name)
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-primary-300 dark:hover:border-primary-700'
                        )}
                      >
                        <Tags className="w-3.5 h-3.5" />
                        {tag.name}
                        <span className="text-xs opacity-60">
                          {Math.round(tag.confidence * 100)}%
                        </span>
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cross-Project Insights Results */}
              {activeTab === 'cross-insights' && crossInsights && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-surface-900 dark:text-white">
                    Related Projects
                  </h4>
                  {crossInsights.relatedProjects?.length === 0 ? (
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      No related projects found.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {crossInsights.relatedProjects?.map((rp, i) => (
                        <motion.div
                          key={rp.projectId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h5 className="text-sm font-medium text-surface-900 dark:text-white flex items-center gap-2">
                                {rp.title}
                                <ExternalLink className="w-3.5 h-3.5 text-surface-400" />
                              </h5>
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                {rp.connection}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shrink-0">
                              {Math.round(rp.similarity * 100)}% match
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default AdvancedAIPanel;
