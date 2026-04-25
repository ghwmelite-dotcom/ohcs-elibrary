import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  MessageCircle,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  PhoneCall,
  BarChart3,
  RefreshCw,
  Shield,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  Filter,
  AlertCircle,
  FileText,
  Video,
  Headphones,
  Dumbbell,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import type {
  WellnessResourceType,
  WellnessCategory,
  WellnessDifficulty,
  EscalationUrgency,
  EscalationStatus,
} from '@/types';

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.ohcselibrary.xyz/api/v1';

// --- Interfaces ---

interface DashboardStats {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  averageMood: number;
  escalationsPending: number;
  sessionsToday: number;
  topTopics: Array<{ topic: string; count: number }>;
  escalationsByUrgency?: {
    crisis: number;
    high: number;
    normal: number;
    low: number;
  };
  totalEscalations?: number;
}

interface Escalation {
  id: string;
  sessionId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  reason?: string;
  urgency: EscalationUrgency;
  status: EscalationStatus;
  assignedCounselorId?: string;
  assignedCounselorName?: string;
  notes?: string;
  sessionTopic?: string;
  sessionMessages?: number;
  createdAt: string;
}

interface WellnessResource {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: WellnessResourceType;
  category: WellnessCategory;
  difficulty: WellnessDifficulty;
  thumbnailUrl?: string;
  mediaUrl?: string;
  duration?: number;
  views: number;
  likes: number;
  createdAt: string;
}

interface CounselorOption {
  id: string;
  counselorId: string;
  counselorName: string;
}

// --- Constants ---

const urgencyColors: Record<EscalationUrgency, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  normal: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  crisis: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusColors: Record<EscalationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  acknowledged: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const topicLabels: Record<string, string> = {
  work_stress: 'Work Stress',
  career: 'Career Growth',
  relationships: 'Relationships',
  personal: 'Personal Life',
  financial: 'Financial',
  general: 'General',
};

const resourceTypeIcons: Record<WellnessResourceType, React.ElementType> = {
  article: FileText,
  video: Video,
  audio: Headphones,
  exercise: Dumbbell,
};

const resourceTypeColors: Record<WellnessResourceType, string> = {
  article: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  video: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  audio: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  exercise: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

const moodEmoji = (mood: number): string => {
  if (mood >= 4) return '😊';
  if (mood >= 3) return '😐';
  if (mood >= 2) return '😟';
  return '😢';
};

type TabKey = 'dashboard' | 'escalations' | 'resources';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'escalations', label: 'Escalations', icon: Shield },
  { key: 'resources', label: 'Resources', icon: BookOpen },
];

// --- Main Component ---

export default function AdminWellness() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [counselors, setCounselors] = useState<CounselorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Resource form state
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState<WellnessResource | null>(null);

  // Escalation resolve modal
  const [resolveModal, setResolveModal] = useState<{ id: string; notes: string } | null>(null);
  const [assignModal, setAssignModal] = useState<{ id: string; counselorId: string } | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/counselor/admin/dashboard`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchEscalations = async () => {
    try {
      const url = urgencyFilter
        ? `${API_BASE}/counselor/admin/escalations?urgency=${urgencyFilter}`
        : `${API_BASE}/counselor/admin/escalations`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setEscalations(data.escalations || []);
      }
    } catch (error) {
      console.error('Error fetching escalations:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch(`${API_BASE}/counselor/resources`, { headers });
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchCounselors = async () => {
    try {
      const res = await fetch(`${API_BASE}/counselor/admin/counselors`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCounselors(
          (data.counselors || []).map((c: Record<string, string>) => ({
            id: c.id,
            counselorId: c.counselorId,
            counselorName: c.counselorName,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching counselors:', error);
    }
  };

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchDashboard(), fetchEscalations(), fetchResources(), fetchCounselors()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchEscalations();
  }, [urgencyFilter]);

  // --- Escalation Actions ---

  const handleUpdateEscalation = async (
    escalationId: string,
    updates: { status?: string; notes?: string; assignedCounselorId?: string }
  ) => {
    setIsUpdating(escalationId);
    try {
      const res = await fetch(`${API_BASE}/counselor/admin/escalations/${escalationId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        setEscalations((prev) =>
          prev.map((e) => (e.id === escalationId ? { ...e, ...updates, ...(updated.escalation || {}) } : e))
        );
        setResolveModal(null);
        setAssignModal(null);
      }
    } catch (error) {
      console.error('Error updating escalation:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  // --- Resource Actions ---

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      const res = await fetch(`${API_BASE}/counselor/admin/resources/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const pendingEscalations = escalations.filter((e) => e.status === 'pending');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/30">
              <Heart className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wellness Center</h1>
          </div>
          <p className="text-gray-600 dark:text-surface-400">
            Monitor AI counselor sessions, manage escalations, and wellness resources
          </p>
        </div>

        <Button onClick={fetchAll} variant="outline" className="gap-2" disabled={isLoading}>
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-surface-800 rounded-xl mb-6 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-white dark:bg-surface-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-surface-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'escalations' && pendingEscalations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {pendingEscalations.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardTab stats={stats} escalations={escalations} isLoading={isLoading} />
          </motion.div>
        )}

        {activeTab === 'escalations' && (
          <motion.div
            key="escalations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <EscalationsTab
              escalations={escalations}
              counselors={counselors}
              isLoading={isLoading}
              isUpdating={isUpdating}
              urgencyFilter={urgencyFilter}
              setUrgencyFilter={setUrgencyFilter}
              onAcknowledge={(id) => handleUpdateEscalation(id, { status: 'acknowledged' })}
              onAssign={setAssignModal}
              onResolve={setResolveModal}
              assignModal={assignModal}
              resolveModal={resolveModal}
              setAssignModal={setAssignModal}
              setResolveModal={setResolveModal}
              handleUpdateEscalation={handleUpdateEscalation}
            />
          </motion.div>
        )}

        {activeTab === 'resources' && (
          <motion.div
            key="resources"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ResourcesTab
              resources={resources}
              isLoading={isLoading}
              showForm={showResourceForm}
              editingResource={editingResource}
              onAdd={() => {
                setEditingResource(null);
                setShowResourceForm(true);
              }}
              onEdit={(r) => {
                setEditingResource(r);
                setShowResourceForm(true);
              }}
              onDelete={handleDeleteResource}
              onCloseForm={() => {
                setShowResourceForm(false);
                setEditingResource(null);
              }}
              onSaved={() => {
                setShowResourceForm(false);
                setEditingResource(null);
                fetchResources();
              }}
              token={token!}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Dashboard Tab
// ============================================================================

function DashboardTab({
  stats,
  escalations,
  isLoading,
}: {
  stats: DashboardStats | null;
  escalations: Escalation[];
  isLoading: boolean;
}) {
  const pendingEscalations = escalations.filter((e) => e.status === 'pending');

  // Compute urgency breakdown from escalations list
  const urgencyBreakdown = escalations.reduce(
    (acc, e) => {
      acc[e.urgency] = (acc[e.urgency] || 0) + 1;
      return acc;
    },
    { crisis: 0, high: 0, normal: 0, low: 0 } as Record<string, number>
  );

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={MessageCircle}
          label="Total Sessions"
          value={stats?.totalSessions || 0}
          trend={`${stats?.sessionsToday || 0} today`}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Active Sessions"
          value={stats?.activeSessions || 0}
          trend="Currently active"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Mood"
          value={`${stats?.averageMood?.toFixed(1) || '0.0'} ${moodEmoji(stats?.averageMood || 0)}`}
          trend="Out of 5"
          color="purple"
        />
        <StatCard
          icon={AlertTriangle}
          label="Total Escalations"
          value={stats?.totalEscalations || escalations.length}
          trend={`${pendingEscalations.length} pending`}
          color="orange"
          alert={pendingEscalations.length > 0}
        />
        <StatCard
          icon={Shield}
          label="Pending Escalations"
          value={pendingEscalations.length}
          trend="Needs attention"
          color="orange"
          alert={pendingEscalations.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgency Breakdown */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Escalation Urgency
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-surface-700 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(
                [
                  { key: 'crisis', label: 'Crisis', color: 'bg-red-500' },
                  { key: 'high', label: 'High', color: 'bg-orange-500' },
                  { key: 'normal', label: 'Normal', color: 'bg-yellow-500' },
                  { key: 'low', label: 'Low', color: 'bg-green-500' },
                ] as const
              ).map(({ key, label, color }) => {
                const count = stats?.escalationsByUrgency?.[key] ?? urgencyBreakdown[key] ?? 0;
                const total = escalations.length || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-3 h-3 rounded-full', color)} />
                        <span className="text-sm text-gray-700 dark:text-surface-300">{label}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                        className={cn('h-full rounded-full', color)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Topic Distribution */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Top Topics
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-surface-700 rounded animate-pulse" />
              ))}
            </div>
          ) : !stats?.topTopics || stats.topTopics.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-surface-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topTopics.map((topic, index) => {
                const maxCount = stats.topTopics[0]?.count || 1;
                const percentage = (topic.count / maxCount) * 100;

                return (
                  <div key={topic.topic}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-surface-300">
                        {topicLabels[topic.topic] || topic.topic}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{topic.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-teal-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overall Stats */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            Overall Stats
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 bg-gray-100 dark:bg-surface-700 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-surface-400">Total Messages</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats?.totalMessages?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-surface-400">Avg. Mood Score</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats?.averageMood?.toFixed(1) || '0.0'} / 5 {moodEmoji(stats?.averageMood || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-surface-400">Sessions Today</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats?.sessionsToday || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-surface-400">Active Sessions</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats?.activeSessions || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Escalations Tab
// ============================================================================

function EscalationsTab({
  escalations,
  counselors,
  isLoading,
  isUpdating,
  urgencyFilter,
  setUrgencyFilter,
  onAcknowledge,
  onAssign,
  onResolve,
  assignModal,
  resolveModal,
  setAssignModal,
  setResolveModal,
  handleUpdateEscalation,
}: {
  escalations: Escalation[];
  counselors: CounselorOption[];
  isLoading: boolean;
  isUpdating: string | null;
  urgencyFilter: string;
  setUrgencyFilter: (v: string) => void;
  onAcknowledge: (id: string) => void;
  onAssign: (v: { id: string; counselorId: string }) => void;
  onResolve: (v: { id: string; notes: string }) => void;
  assignModal: { id: string; counselorId: string } | null;
  resolveModal: { id: string; notes: string } | null;
  setAssignModal: (v: { id: string; counselorId: string } | null) => void;
  setResolveModal: (v: { id: string; notes: string } | null) => void;
  handleUpdateEscalation: (id: string, updates: Record<string, string | undefined>) => void;
}) {
  return (
    <div>
      {/* Filters */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-surface-300">Filter by urgency:</span>
          <div className="flex gap-2">
            {[
              { value: '', label: 'All' },
              { value: 'crisis', label: 'Crisis' },
              { value: 'high', label: 'High' },
              { value: 'normal', label: 'Normal' },
              { value: 'low', label: 'Low' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setUrgencyFilter(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  urgencyFilter === opt.value
                    ? opt.value
                      ? urgencyColors[opt.value as EscalationUrgency]
                      : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 dark:bg-surface-700 dark:text-surface-400 hover:bg-gray-200 dark:hover:bg-surface-600'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Escalation List */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700">
        <div className="p-4 border-b border-gray-200 dark:border-surface-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-amber-500" />
            Escalation Queue
          </h2>
          <span className="text-sm text-gray-500 dark:text-surface-400">
            {escalations.length} total
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-surface-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : escalations.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-surface-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No escalations found</p>
            <p className="text-sm mt-1">
              {urgencyFilter ? 'Try changing the filter' : 'All clear!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-surface-700">
            {escalations.map((escalation) => (
              <motion.div
                key={escalation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-gray-50 dark:hover:bg-surface-750 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          urgencyColors[escalation.urgency]
                        )}
                      >
                        {escalation.urgency.toUpperCase()}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          statusColors[escalation.status]
                        )}
                      >
                        {escalation.status}
                      </span>
                      {escalation.sessionTopic && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-surface-700 dark:text-surface-400">
                          {topicLabels[escalation.sessionTopic] || escalation.sessionTopic}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-900 dark:text-white font-medium mb-1">
                      {escalation.userName || 'Anonymous User'}
                      {escalation.userEmail && (
                        <span className="text-sm text-gray-500 dark:text-surface-400 ml-2">
                          ({escalation.userEmail})
                        </span>
                      )}
                    </p>

                    {escalation.reason && (
                      <p className="text-sm text-gray-600 dark:text-surface-400 mb-2">{escalation.reason}</p>
                    )}

                    {escalation.assignedCounselorName && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                        Assigned to: {escalation.assignedCounselorName}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-surface-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {escalation.createdAt
                          ? formatDistanceToNow(new Date(escalation.createdAt), { addSuffix: true })
                          : 'Recently'}
                      </span>
                      {escalation.sessionMessages !== undefined && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {escalation.sessionMessages} messages
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[120px]">
                    {escalation.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => onAcknowledge(escalation.id)}
                        disabled={isUpdating === escalation.id}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {(escalation.status === 'pending' || escalation.status === 'acknowledged') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAssign({ id: escalation.id, counselorId: '' })}
                        disabled={isUpdating === escalation.id}
                        className="gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign
                      </Button>
                    )}
                    {(escalation.status === 'acknowledged' || escalation.status === 'scheduled') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={() => onResolve({ id: escalation.id, notes: '' })}
                        disabled={isUpdating === escalation.id}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal && (
          <ModalOverlay onClose={() => setAssignModal(null)}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assign to Counselor</h3>
              <select
                value={assignModal.counselorId}
                onChange={(e) => setAssignModal({ ...assignModal, counselorId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 mb-4"
              >
                <option value="">Select a counselor...</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.counselorId}>
                    {c.counselorName}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setAssignModal(null)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleUpdateEscalation(assignModal.id, {
                      status: 'scheduled',
                      assignedCounselorId: assignModal.counselorId || undefined,
                    })
                  }
                  disabled={!assignModal.counselorId}
                  className="flex-1"
                >
                  Assign
                </Button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Resolve Modal */}
      <AnimatePresence>
        {resolveModal && (
          <ModalOverlay onClose={() => setResolveModal(null)}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resolve Escalation</h3>
              <textarea
                value={resolveModal.notes}
                onChange={(e) => setResolveModal({ ...resolveModal, notes: e.target.value })}
                placeholder="Resolution notes (optional)..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none mb-4"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setResolveModal(null)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleUpdateEscalation(resolveModal.id, {
                      status: 'resolved',
                      notes: resolveModal.notes || undefined,
                    })
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Resolve
                </Button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Resources Tab
// ============================================================================

function ResourcesTab({
  resources,
  isLoading,
  showForm,
  editingResource,
  onAdd,
  onEdit,
  onDelete,
  onCloseForm,
  onSaved,
  token,
}: {
  resources: WellnessResource[];
  isLoading: boolean;
  showForm: boolean;
  editingResource: WellnessResource | null;
  onAdd: () => void;
  onEdit: (r: WellnessResource) => void;
  onDelete: (id: string) => void;
  onCloseForm: () => void;
  onSaved: () => void;
  token: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Wellness Resources</h2>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Resource
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-surface-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-surface-600" />
          <p className="text-gray-500 dark:text-surface-400 font-medium">No resources yet</p>
          <p className="text-sm text-gray-400 dark:text-surface-500 mt-1">Add your first wellness resource</p>
          <Button onClick={onAdd} className="mt-4 gap-2">
            <Plus className="w-4 h-4" />
            Add Resource
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => {
            const TypeIcon = resourceTypeIcons[resource.type] || FileText;
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {resource.thumbnailUrl && (
                  <div className="h-32 bg-gray-100 dark:bg-surface-700 overflow-hidden">
                    <img
                      src={resource.thumbnailUrl}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('p-1.5 rounded-lg', resourceTypeColors[resource.type])}>
                        <TypeIcon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-surface-400 uppercase">
                        {resource.type}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(resource)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500 dark:text-surface-400" />
                      </button>
                      <button
                        onClick={() => onDelete(resource.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                    {resource.title}
                  </h3>
                  {resource.description && (
                    <p className="text-xs text-gray-500 dark:text-surface-400 line-clamp-2 mb-2">
                      {resource.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-surface-500">
                    <span className="capitalize">{resource.category}</span>
                    {resource.duration && <span>{resource.duration} min</span>}
                    <span>{resource.views} views</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Resource Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ResourceFormModal
            resource={editingResource}
            token={token}
            onClose={onCloseForm}
            onSaved={onSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Resource Form Modal
// ============================================================================

function ResourceFormModal({
  resource,
  token,
  onClose,
  onSaved,
}: {
  resource: WellnessResource | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!resource;
  const [title, setTitle] = useState(resource?.title || '');
  const [description, setDescription] = useState(resource?.description || '');
  const [content, setContent] = useState(resource?.content || '');
  const [type, setType] = useState<WellnessResourceType>(resource?.type || 'article');
  const [category, setCategory] = useState<WellnessCategory>(resource?.category || 'stress');
  const [difficulty, setDifficulty] = useState<WellnessDifficulty>(resource?.difficulty || 'beginner');
  const [duration, setDuration] = useState(resource?.duration || 0);
  const [thumbnailUrl, setThumbnailUrl] = useState(resource?.thumbnailUrl || '');
  const [mediaUrl, setMediaUrl] = useState(resource?.mediaUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim() || undefined,
        type,
        category,
        difficulty,
        duration: duration || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        mediaUrl: mediaUrl.trim() || undefined,
      };

      const url = isEdit
        ? `${API_BASE}/counselor/admin/resources/${resource.id}`
        : `${API_BASE}/counselor/admin/resources`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save resource');
      }
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Failed to save resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-6 border-b border-gray-200 dark:border-surface-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Resource' : 'Add Resource'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Type & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WellnessResourceType)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="exercise">Exercise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WellnessCategory)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="stress">Stress</option>
              <option value="career">Career</option>
              <option value="relationships">Relationships</option>
              <option value="mindfulness">Mindfulness</option>
              <option value="sleep">Sleep</option>
            </select>
          </div>
        </div>

        {/* Difficulty & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as WellnessDifficulty)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
              Duration (min)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min={0}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Full content or embed code..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        {/* URLs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">Thumbnail URL</label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">Media URL</label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </form>

      <div className="p-6 border-t border-gray-200 dark:border-surface-700 flex gap-3">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={(e: React.MouseEvent) => {
            const form = (e.target as HTMLElement).closest('.fixed')?.querySelector('form');
            if (form) form.requestSubmit();
          }}
          disabled={!title.trim() || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Resource' : 'Create Resource'}
        </Button>
      </div>
    </ModalOverlay>
  );
}

// ============================================================================
// Shared Components
// ============================================================================

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  alert?: boolean;
}

function StatCard({ icon: Icon, label, value, trend, color, alert }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 p-5',
        alert && 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-surface-900'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {alert && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
          </span>
        )}
      </div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-600 dark:text-surface-400">{label}</p>
      <p className="text-xs text-gray-500 dark:text-surface-500 mt-1">{trend}</p>
    </motion.div>
  );
}
