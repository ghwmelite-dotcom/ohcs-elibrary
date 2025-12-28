import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  ArrowLeft,
  Settings,
  Users,
  BookOpen,
  Lightbulb,
  FileText,
  MessageSquare,
  Activity,
  Calendar,
  Target,
  Edit3,
  Trash2,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  MoreVertical,
  Share2,
  Download,
  Sparkles,
  Loader2,
  Wand2,
  Brain,
  X,
  Eye,
  Copy,
  Check,
  StickyNote,
  Quote,
  ClipboardCheck,
  MessagesSquare,
  Flag,
  BarChart3,
  FileDown,
} from 'lucide-react';
import {
  useResearchStore,
  RESEARCH_CATEGORIES,
  RESEARCH_STATUSES,
  RESEARCH_PHASES,
  RESEARCH_METHODOLOGIES,
} from '@/stores/researchStore';
import { PhaseProgress, KofiChat, CollaborationPanel, AnalyticsPanel, MilestonesPanel, ExportPanel } from '@/components/research';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';

type TabType = 'overview' | 'literature' | 'notes' | 'citations' | 'reviews' | 'discussions' | 'milestones' | 'analytics' | 'export' | 'insights' | 'briefs' | 'team' | 'activity' | 'comments';

export default function ResearchProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    currentProject,
    isLoading,
    error,
    fetchProject,
    literature,
    literatureLoading,
    fetchLiterature,
    summarizeLiterature,
    insights,
    insightsLoading,
    fetchInsights,
    generateInsights,
    deleteInsight,
    briefs,
    briefsLoading,
    fetchBriefs,
    generateBrief,
    deleteBrief,
    comments,
    commentsLoading,
    fetchComments,
    addComment,
    activities,
    activitiesLoading,
    fetchActivity,
    deleteProject,
  } = useResearchStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [summarizingLitId, setSummarizingLitId] = useState<string | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<string | null>(null);
  const [copiedBriefId, setCopiedBriefId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject(id);
    }
  }, [id, fetchProject]);

  useEffect(() => {
    if (id && currentProject) {
      if (activeTab === 'literature') {
        fetchLiterature(id);
      } else if (activeTab === 'insights') {
        fetchInsights(id);
      } else if (activeTab === 'briefs') {
        fetchBriefs(id);
      } else if (activeTab === 'comments') {
        fetchComments(id);
      } else if (activeTab === 'activity') {
        fetchActivity(id);
      }
    }
  }, [id, activeTab, currentProject]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    setIsSubmittingComment(true);
    try {
      await addComment(id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteProject(id);
      navigate('/research-lab');
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleGenerateInsights = async () => {
    if (!id) return;
    setIsGeneratingInsights(true);
    try {
      await generateInsights(id);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleGenerateBrief = async (briefType = 'policy', audience = 'policymakers') => {
    if (!id) return;
    setIsGeneratingBrief(true);
    try {
      await generateBrief(id, briefType, audience);
    } catch (error) {
      console.error('Failed to generate brief:', error);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleSummarizeLiterature = async (litId: string) => {
    setSummarizingLitId(litId);
    try {
      await summarizeLiterature(litId);
      // Refresh literature to show updated notes
      if (id) await fetchLiterature(id);
    } catch (error) {
      console.error('Failed to summarize literature:', error);
    } finally {
      setSummarizingLitId(null);
    }
  };

  const handleCopyBrief = async (briefId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedBriefId(briefId);
      setTimeout(() => setCopiedBriefId(null), 2000);
    } catch (error) {
      console.error('Failed to copy brief:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Project not found'}
          </h2>
          <Link
            to="/research-lab"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Back to Research Lab
          </Link>
        </div>
      </div>
    );
  }

  const category = RESEARCH_CATEGORIES[currentProject.category];
  const status = RESEARCH_STATUSES[currentProject.status];
  const phase = RESEARCH_PHASES[currentProject.phase];
  const isOwner = currentProject.createdById === user?.id;
  const isLead = currentProject.teamLeadId === user?.id;
  const isMember = currentProject.teamMembers?.some(member => member.userId === user?.id) ?? false;
  const canEdit = isOwner || isLead || isMember;

  const tabs: Array<{ id: TabType; label: string; icon: typeof Target; count?: number; isAI?: boolean }> = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'literature', label: 'Literature', icon: BookOpen, count: currentProject.literatureCount },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'citations', label: 'Citations', icon: Quote },
    { id: 'reviews', label: 'Reviews', icon: ClipboardCheck },
    { id: 'discussions', label: 'Discussions', icon: MessagesSquare },
    { id: 'milestones', label: 'Milestones', icon: Flag },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'export', label: 'Export', icon: FileDown },
    { id: 'insights', label: 'AI Insights', icon: Brain, count: currentProject.insightCount, isAI: true },
    { id: 'briefs', label: 'Briefs', icon: FileText, count: currentProject.briefCount, isAI: true },
    { id: 'team', label: 'Team', icon: Users, count: currentProject.teamMemberCount },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className={cn('border-b border-gray-200 dark:border-gray-700', category.color.replace('bg-', 'bg-gradient-to-r from-') + ' to-primary-700')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/70 mb-4">
            <Link to="/research-lab" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Research Lab
            </Link>
            <span>/</span>
            <span className="text-white">Project</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', status.color, 'text-white')}>
                  {status.label}
                </span>
                <span className="text-white/70 text-sm">
                  {category.icon} {category.label}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {currentProject.title}
              </h1>
              <p className="text-white/80 text-lg">
                {currentProject.researchQuestion}
              </p>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Open edit modal */}}
                  className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {isOwner && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 bg-red-500/20 text-white rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded-full',
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Phase Progress */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Research Progress
                  </h3>
                  <PhaseProgress
                    currentPhase={currentProject.phase}
                    progress={currentProject.progress}
                    variant="horizontal"
                    size="md"
                  />
                </div>

                {/* Description */}
                {currentProject.description && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {currentProject.description}
                    </p>
                  </div>
                )}

                {/* Objectives */}
                {currentProject.objectives && currentProject.objectives.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Research Objectives
                    </h3>
                    <ul className="space-y-2">
                      {currentProject.objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hypothesis */}
                {currentProject.hypothesis && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-secondary-500" />
                      Hypothesis
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 italic">
                      "{currentProject.hypothesis}"
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Info */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Project Info
                  </h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Methodology</dt>
                      <dd className="mt-1 text-gray-900 dark:text-white font-medium">
                        {RESEARCH_METHODOLOGIES[currentProject.methodology]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Team Lead</dt>
                      <dd className="mt-1 flex items-center gap-2">
                        {currentProject.teamLead?.avatar ? (
                          <img
                            src={currentProject.teamLead.avatar}
                            alt={currentProject.teamLead.displayName}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              {currentProject.teamLead?.displayName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <span className="text-gray-900 dark:text-white">
                          {currentProject.teamLead?.displayName || 'Unknown'}
                        </span>
                      </dd>
                    </div>
                    {currentProject.startDate && (
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Start Date</dt>
                        <dd className="mt-1 text-gray-900 dark:text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(currentProject.startDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </dd>
                      </div>
                    )}
                    {currentProject.targetEndDate && (
                      <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Target End Date</dt>
                        <dd className="mt-1 text-gray-900 dark:text-white flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {new Date(currentProject.targetEndDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Visibility</dt>
                      <dd className="mt-1 text-gray-900 dark:text-white">
                        {currentProject.isPublic ? 'Public' : 'Private'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Tags */}
                {currentProject.tags && currentProject.tags.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentProject.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Quick Actions */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-semibold">AI Research Tools</h3>
                  </div>
                  <p className="text-primary-100 text-sm mb-4">
                    Get AI-powered insights, literature synthesis, and research brief generation.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('insights')}
                      className="w-full px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Brain className="w-4 h-4" />
                      View AI Insights
                    </button>
                    <button
                      onClick={() => setActiveTab('briefs')}
                      className="w-full px-4 py-2 bg-white text-primary-700 rounded-lg font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Generate Brief
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'literature' && (
            <motion.div
              key="literature"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Literature ({literature.length})
                </h2>
                {canEdit && (
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Literature
                  </button>
                )}
              </div>

              {literatureLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : literature.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                  <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No literature added yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Add documents from the library or external sources to build your literature review.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {literature.map((lit) => (
                    <div
                      key={lit.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <BookOpen className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {lit.document?.title || lit.externalTitle || 'Untitled'}
                          </h4>
                          {lit.externalAuthors && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {lit.externalAuthors} {lit.externalYear && `(${lit.externalYear})`}
                            </p>
                          )}
                          {lit.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                              {lit.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">{lit.citationKey}</span>
                            {lit.relevanceScore && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                {Math.round(lit.relevanceScore * 100)}% relevant
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              onClick={() => handleSummarizeLiterature(lit.id)}
                              disabled={summarizingLitId === lit.id}
                              className="p-2 text-gray-400 hover:text-primary-500 transition-colors disabled:opacity-50"
                              title="AI Summarize"
                            >
                              {summarizingLitId === lit.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Wand2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {lit.externalUrl && (
                            <a
                              href={lit.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Collaboration Tabs */}
          {(activeTab === 'notes' || activeTab === 'citations' || activeTab === 'reviews' || activeTab === 'discussions') && (
            <motion.div
              key="collaboration"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CollaborationPanel
                projectId={id!}
                activeTab={activeTab}
                canEdit={canEdit}
              />
            </motion.div>
          )}

          {/* Phase 4: Milestones Tab */}
          {activeTab === 'milestones' && (
            <motion.div
              key="milestones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MilestonesPanel projectId={id!} canEdit={canEdit} />
            </motion.div>
          )}

          {/* Phase 4: Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AnalyticsPanel projectId={id!} />
            </motion.div>
          )}

          {/* Phase 4: Export Tab */}
          {activeTab === 'export' && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ExportPanel projectId={id!} projectTitle={currentProject.title} />
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary-500" />
                    AI Insights ({insights.length})
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    AI-generated research insights and recommendations
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={handleGenerateInsights}
                    disabled={isGeneratingInsights}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {isGeneratingInsights ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate Insights
                      </>
                    )}
                  </button>
                )}
              </div>

              {insightsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : insights.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                  <Brain className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No insights yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Generate AI-powered insights to help guide your research.
                  </p>
                  {canEdit && (
                    <button
                      onClick={handleGenerateInsights}
                      disabled={isGeneratingInsights}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {isGeneratingInsights ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Generate First Insights
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className={cn(
                        'bg-white dark:bg-gray-800 rounded-xl p-5 border-l-4',
                        insight.confidence >= 0.7 && 'border-l-green-500',
                        insight.confidence >= 0.4 && insight.confidence < 0.7 && 'border-l-yellow-500',
                        insight.confidence < 0.4 && 'border-l-red-500',
                        'border border-gray-200 dark:border-gray-700'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              'px-2 py-0.5 text-xs rounded-full capitalize',
                              insight.type === 'recommendation' && 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
                              insight.type === 'key_finding' && 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
                              insight.type === 'gap' && 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
                              insight.type === 'contradiction' && 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
                              insight.type === 'synthesis' && 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
                              insight.type === 'opportunity' && 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
                              insight.type === 'trend' && 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                            )}>
                              {insight.type.replace('_', ' ')}
                            </span>
                            {insight.isAIGenerated && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> AI
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {insight.title}
                          </h4>
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => id && deleteInsight(id, insight.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {insight.content}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        {insight.confidence !== undefined && (
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            insight.confidence >= 0.7 && 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                            insight.confidence >= 0.4 && insight.confidence < 0.7 && 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                            insight.confidence < 0.4 && 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          )}>
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'briefs' && (
            <motion.div
              key="briefs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    Policy Briefs ({briefs.length})
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    AI-generated policy briefs and executive summaries
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleGenerateBrief('policy', 'policymakers')}
                    disabled={isGeneratingBrief}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {isGeneratingBrief ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate Brief
                      </>
                    )}
                  </button>
                )}
              </div>

              {briefsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : briefs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                  <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No briefs yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Generate AI-powered policy briefs from your research insights.
                  </p>
                  {canEdit && (
                    <button
                      onClick={() => handleGenerateBrief('policy', 'policymakers')}
                      disabled={isGeneratingBrief}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {isGeneratingBrief ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Generate First Brief
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {briefs.map((brief) => (
                    <div
                      key={brief.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full capitalize">
                                Policy Brief
                              </span>
                              <span className={cn(
                                'px-2 py-0.5 text-xs rounded-full',
                                brief.status === 'published' && 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
                                brief.status === 'draft' && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                                brief.status === 'review' && 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
                                brief.status === 'approved' && 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              )}>
                                {brief.status}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {brief.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Version {brief.version} • Created: {new Date(brief.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedBrief(selectedBrief === brief.id ? null : brief.id)}
                              className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                              title="View Brief"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyBrief(brief.id, brief.executiveSummary)}
                              className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                              title="Copy to Clipboard"
                            >
                              {copiedBriefId === brief.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => id && deleteBrief(id, brief.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete Brief"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {selectedBrief === brief.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-5 pt-0 border-t border-gray-100 dark:border-gray-700 mt-4">
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
                                  {brief.executiveSummary}
                                </pre>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Team Members ({(currentProject.teamMembers?.length || 0) + 1})
                </h2>
                {(isOwner || isLead) && (
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Member
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Team Lead */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-primary-200 dark:border-primary-800">
                  <div className="flex items-center gap-4">
                    {currentProject.teamLead?.avatar ? (
                      <img
                        src={currentProject.teamLead.avatar}
                        alt={currentProject.teamLead.displayName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <span className="text-lg font-medium text-primary-600 dark:text-primary-400">
                          {currentProject.teamLead?.displayName?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {currentProject.teamLead?.displayName || 'Unknown'}
                      </h4>
                      <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                        Team Lead
                      </span>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                {currentProject.teamMembers?.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      {member.user?.avatar ? (
                        <img
                          src={member.user.avatar}
                          alt={member.user.displayName}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                            {member.user?.displayName?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {member.user?.displayName || 'Unknown'}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Activity Log
              </h2>

              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                  <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No activity yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Activity will appear here as the project progresses.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4">
                      {activity.user?.avatar ? (
                        <img
                          src={activity.user.avatar}
                          alt={activity.user.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {activity.user?.displayName?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{activity.user?.displayName || 'Someone'}</span>
                          {' '}
                          <span className="text-gray-500 dark:text-gray-400">
                            {activity.action.replace(/_/g, ' ')}
                          </span>
                          {activity.details && (
                            <span className="text-gray-600 dark:text-gray-300"> - {activity.details}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(activity.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'comments' && (
            <motion.div
              key="comments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Discussion ({comments.length})
              </h2>

              {/* Comment Form */}
              {isMember && (
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-0 py-0 border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 resize-none"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        {isSubmittingComment ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Comments List */}
              {commentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 animate-pulse">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
                        </div>
                      </div>
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                  <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No comments yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Start the discussion by adding the first comment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        {comment.user?.avatar ? (
                          <img
                            src={comment.user.avatar}
                            alt={comment.user.displayName}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {comment.user?.displayName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {comment.user?.displayName || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-12 mt-4 space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-3">
                              {reply.user?.avatar ? (
                                <img
                                  src={reply.user.avatar}
                                  alt={reply.user.displayName}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {reply.user?.displayName?.charAt(0) || 'U'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                                    {reply.user?.displayName || 'Unknown'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(reply.createdAt).toLocaleDateString('en-GB', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Project?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{currentProject.title}"? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Kofi AI Chat */}
      <KofiChat
        projectContext={{
          id: currentProject.id,
          title: currentProject.title,
          researchQuestion: currentProject.researchQuestion,
          methodology: currentProject.methodology,
          category: currentProject.category,
          phase: currentProject.phase,
          objectives: currentProject.objectives,
        }}
      />
    </div>
  );
}
