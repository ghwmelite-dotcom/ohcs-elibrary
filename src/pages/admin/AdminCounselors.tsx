import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  UserCog,
  UserPlus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Heart,
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  Users,
  MessageCircle,
  Building2,
  Mail,
  Clock,
  Activity,
  Pause,
  Play,
  FileText,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import type { CounselorTopic, CounselorStatus } from '@/types';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

// --- Interfaces ---

interface Counselor {
  id: string;
  counselorId: string;
  counselorName: string;
  counselorEmail: string;
  counselorAvatar?: string;
  counselorTitle?: string;
  assignedByName?: string;
  specializations?: CounselorTopic[];
  status: CounselorStatus;
  maxCaseload: number;
  currentCaseload: number;
  bio?: string;
  qualifications?: string;
  notes?: string;
  createdAt: string;
}

interface CounselorStats {
  totalCounselors: number;
  activeCounselors: number;
  totalAssignedCases: number;
  averageCaseload: number;
  pendingEscalations: number;
  resolvedThisWeek: number;
}

interface UserSearchResult {
  id: string;
  displayName: string;
  email: string;
  title?: string;
  department?: string;
}

interface UserWellnessReport {
  user: {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
  };
  sessions: {
    total: number;
    active: number;
    escalated: number;
    lastActiveAt?: string;
  };
  mood: {
    current?: number;
    average?: number;
    trend?: 'improving' | 'declining' | 'stable' | null;
    history: Array<{ mood: number; createdAt: string }>;
  };
  escalations: Array<{
    id: string;
    urgency: string;
    status: string;
    reason?: string;
    createdAt: string;
  }>;
}

interface AggregateTrends {
  moodTrend: Array<{ date: string; avgMood: number; count: number }>;
  sessionVolume: Array<{ date: string; count: number }>;
  topTopics: Array<{ topic: string; count: number }>;
  totalSessions: number;
  totalUsers: number;
  averageMood: number;
}

// --- Constants ---

const topicLabels: Record<CounselorTopic, string> = {
  work_stress: 'Work Stress',
  career: 'Career',
  relationships: 'Relationships',
  personal: 'Personal',
  financial: 'Financial',
  general: 'General',
};

const topicColors: Record<CounselorTopic, string> = {
  work_stress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  career: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  relationships: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  financial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  general: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: Play,
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-400',
    icon: Pause,
  },
  on_leave: {
    label: 'On Leave',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
};

const moodEmoji = (mood: number): string => {
  if (mood >= 4) return '😊';
  if (mood >= 3) return '😐';
  if (mood >= 2) return '😟';
  return '😢';
};

type TabKey = 'counselors' | 'reports' | 'trends';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'counselors', label: 'Counselors', icon: UserCog },
  { key: 'reports', label: 'User Reports', icon: FileText },
  { key: 'trends', label: 'Aggregate Trends', icon: TrendingUp },
];

// --- Animated Background ---

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.12) 0%, transparent 70%)',
          top: '-15%',
          right: '-10%',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
          bottom: '10%',
          left: '-5%',
        }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// --- Stat Card ---

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}

function StatCard({ label, value, icon: Icon, color, delay = 0 }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay }}
      className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
          <p className="text-sm text-surface-500">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdminCounselors() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('counselors');
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [stats, setStats] = useState<CounselorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const fetchCounselors = async () => {
    try {
      const res = await fetch(`${API_BASE}/counselor/admin/counselors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCounselors(data.counselors || []);
      }
    } catch (error) {
      console.error('Failed to fetch counselors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/counselor/admin/counselors/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchCounselors();
    fetchStats();
  }, []);

  const handleDeleteCounselor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this counselor?')) return;

    try {
      const res = await fetch(`${API_BASE}/counselor/admin/counselors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCounselors((prev) => prev.filter((c) => c.id !== id));
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete counselor:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: CounselorStatus) => {
    try {
      const res = await fetch(`${API_BASE}/counselor/admin/counselors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setCounselors((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
    setActionMenuId(null);
  };

  const filteredCounselors = counselors.filter((c) => {
    const matchesSearch =
      c.counselorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.counselorEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 relative">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Counselor Management</h1>
                <p className="text-surface-600 dark:text-surface-400">
                  Manage wellness counselors, view reports, and track trends
                </p>
              </div>
            </div>

            {activeTab === 'counselors' && (
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Counselor
              </Button>
            )}
          </div>
        </motion.div>

        {/* Tab Bar */}
        <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl mb-6 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'counselors' && (
            <motion.div
              key="counselors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    label="Total Counselors"
                    value={stats.totalCounselors}
                    icon={UserCog}
                    color="#0D9488"
                    delay={0.1}
                  />
                  <StatCard
                    label="Active"
                    value={stats.activeCounselors}
                    icon={Activity}
                    color="#22C55E"
                    delay={0.15}
                  />
                  <StatCard
                    label="Pending Escalations"
                    value={stats.pendingEscalations}
                    icon={AlertCircle}
                    color="#EF4444"
                    delay={0.2}
                  />
                  <StatCard
                    label="Resolved This Week"
                    value={stats.resolvedThisWeek}
                    icon={CheckCircle2}
                    color="#3B82F6"
                    delay={0.25}
                  />
                </div>
              )}

              {/* Search and Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 mb-6"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input
                      type="text"
                      placeholder="Search counselors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </motion.div>

              {/* Counselors List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
                  </div>
                ) : filteredCounselors.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCog className="w-12 h-12 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
                    <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">
                      No counselors found
                    </h3>
                    <p className="text-surface-500 mb-4">
                      {searchQuery || statusFilter
                        ? 'Try adjusting your filters'
                        : 'Add your first counselor to get started'}
                    </p>
                    {!searchQuery && !statusFilter && (
                      <Button onClick={() => setShowAddModal(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Counselor
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-surface-200 dark:divide-surface-700">
                    {filteredCounselors.map((counselor, index) => {
                      const status = statusConfig[counselor.status];
                      const StatusIcon = status.icon;
                      const specializations = counselor.specializations
                        ? typeof counselor.specializations === 'string'
                          ? JSON.parse(counselor.specializations as unknown as string)
                          : counselor.specializations
                        : [];

                      return (
                        <motion.div
                          key={counselor.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="p-4 sm:p-6 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              {counselor.counselorAvatar ? (
                                <img
                                  src={counselor.counselorAvatar}
                                  alt={counselor.counselorName}
                                  className="w-12 h-12 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                                  {counselor.counselorName.charAt(0)}
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-surface-900 dark:text-white">
                                    {counselor.counselorName}
                                  </h3>
                                  <p className="text-sm text-surface-500 flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" />
                                    {counselor.counselorEmail}
                                  </p>
                                  {counselor.counselorTitle && (
                                    <p className="text-sm text-surface-500 flex items-center gap-1 mt-0.5">
                                      <Building2 className="w-3.5 h-3.5" />
                                      {counselor.counselorTitle}
                                    </p>
                                  )}
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                      status.color
                                    )}
                                  >
                                    <StatusIcon className="w-3 h-3" />
                                    {status.label}
                                  </span>

                                  <div className="relative">
                                    <button
                                      onClick={() =>
                                        setActionMenuId(actionMenuId === counselor.id ? null : counselor.id)
                                      }
                                      className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors"
                                    >
                                      <MoreHorizontal className="w-5 h-5 text-surface-500" />
                                    </button>

                                    <AnimatePresence>
                                      {actionMenuId === counselor.id && (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.95 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.95 }}
                                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 py-1 z-20"
                                        >
                                          <button
                                            onClick={() => {
                                              setSelectedCounselor(counselor);
                                              setShowEditModal(true);
                                              setActionMenuId(null);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                            Edit Counselor
                                          </button>
                                          {counselor.status !== 'active' && (
                                            <button
                                              onClick={() => handleUpdateStatus(counselor.id, 'active')}
                                              className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2"
                                            >
                                              <Play className="w-4 h-4" />
                                              Set Active
                                            </button>
                                          )}
                                          {counselor.status === 'active' && (
                                            <button
                                              onClick={() => handleUpdateStatus(counselor.id, 'on_leave')}
                                              className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2"
                                            >
                                              <Clock className="w-4 h-4" />
                                              Set On Leave
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleDeleteCounselor(counselor.id)}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                            Remove Counselor
                                          </button>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </div>

                              {/* Specializations */}
                              {specializations.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {specializations.map((topic: CounselorTopic) => (
                                    <span
                                      key={topic}
                                      className={cn(
                                        'px-2 py-0.5 rounded text-xs font-medium',
                                        topicColors[topic]
                                      )}
                                    >
                                      {topicLabels[topic]}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Stats */}
                              <div className="flex items-center gap-4 mt-3 text-sm text-surface-500">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {counselor.currentCaseload} / {counselor.maxCaseload} cases
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Added {new Date(counselor.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <UserReportsTab token={token!} />
            </motion.div>
          )}

          {activeTab === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AggregateTrendsTab token={token!} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Counselor Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddCounselorModal
            token={token!}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchCounselors();
              fetchStats();
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Counselor Modal */}
      <AnimatePresence>
        {showEditModal && selectedCounselor && (
          <EditCounselorModal
            token={token!}
            counselor={selectedCounselor}
            onClose={() => {
              setShowEditModal(false);
              setSelectedCounselor(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedCounselor(null);
              fetchCounselors();
              fetchStats();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// User Reports Tab
// ============================================================================

function UserReportsTab({ token }: { token: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [report, setReport] = useState<UserWellnessReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/counselor/reports/users?search=${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const fetchReport = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingReport(true);
    try {
      const res = await fetch(`${API_BASE}/counselor/reports/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div>
      {/* User Search */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-teal-500" />
          Search User for Wellness Report
        </h2>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500" />
            </div>
          )}

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 max-h-64 overflow-y-auto z-10">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    fetchReport(user.id);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className={cn(
                    'w-full p-3 text-left hover:bg-surface-50 dark:hover:bg-surface-700 border-b border-surface-100 dark:border-surface-700 last:border-0 transition-colors',
                    selectedUserId === user.id && 'bg-teal-50 dark:bg-teal-900/20'
                  )}
                >
                  <p className="font-medium text-surface-900 dark:text-white">{user.displayName}</p>
                  <p className="text-sm text-surface-500">{user.email}</p>
                  {user.department && (
                    <p className="text-xs text-surface-400 mt-0.5">{user.department}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Display */}
      {isLoadingReport ? (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4" />
          <p className="text-surface-500">Loading wellness report...</p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* User Header */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
            <div className="flex items-center gap-4">
              {report.user.avatar ? (
                <img
                  src={report.user.avatar}
                  alt={report.user.displayName}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl">
                  {report.user.displayName.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                  {report.user.displayName}
                </h3>
                <p className="text-surface-500">{report.user.email}</p>
                {report.sessions.lastActiveAt && (
                  <p className="text-sm text-surface-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Last active{' '}
                    {formatDistanceToNow(new Date(report.sessions.lastActiveAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Session & Mood Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Sessions"
              value={report.sessions.total}
              icon={MessageCircle}
              color="#3B82F6"
            />
            <StatCard
              label="Active Sessions"
              value={report.sessions.active}
              icon={Activity}
              color="#22C55E"
            />
            <StatCard
              label="Escalated"
              value={report.sessions.escalated}
              icon={AlertCircle}
              color="#EF4444"
            />
            <StatCard
              label="Avg Mood"
              value={
                report.mood.average
                  ? `${report.mood.average.toFixed(1)} ${moodEmoji(report.mood.average)}`
                  : 'N/A'
              }
              icon={Heart}
              color="#8B5CF6"
            />
          </div>

          {/* Mood History */}
          {report.mood.history && report.mood.history.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Mood History
                </h3>
                {report.mood.trend && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      report.mood.trend === 'improving'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : report.mood.trend === 'declining'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-400'
                    )}
                  >
                    {report.mood.trend === 'improving' && <ArrowUp className="w-3 h-3" />}
                    {report.mood.trend === 'declining' && <ArrowDown className="w-3 h-3" />}
                    {report.mood.trend === 'stable' && <Minus className="w-3 h-3" />}
                    {report.mood.trend.charAt(0).toUpperCase() + report.mood.trend.slice(1)}
                  </span>
                )}
              </div>

              {/* Simple bar chart for mood history */}
              <div className="flex items-end gap-1 h-32">
                {report.mood.history.slice(-30).map((entry, i) => {
                  const height = (entry.mood / 5) * 100;
                  const moodColor =
                    entry.mood >= 4
                      ? 'bg-green-500'
                      : entry.mood >= 3
                        ? 'bg-yellow-500'
                        : entry.mood >= 2
                          ? 'bg-orange-500'
                          : 'bg-red-500';
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: i * 0.02, duration: 0.3 }}
                      className={cn('flex-1 rounded-t min-w-[4px]', moodColor)}
                      title={`Mood: ${entry.mood} - ${new Date(entry.createdAt).toLocaleDateString()}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-surface-400">
                <span>Oldest</span>
                <span>Most Recent</span>
              </div>
            </div>
          )}

          {/* Escalation History */}
          {report.escalations && report.escalations.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Escalation History ({report.escalations.length})
              </h3>
              <div className="space-y-3">
                {report.escalations.map((esc) => (
                  <div
                    key={esc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          esc.urgency === 'crisis'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : esc.urgency === 'high'
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                              : esc.urgency === 'normal'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        )}
                      >
                        {esc.urgency.toUpperCase()}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          esc.status === 'resolved'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : esc.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        )}
                      >
                        {esc.status}
                      </span>
                      {esc.reason && (
                        <span className="text-sm text-surface-600 dark:text-surface-400">{esc.reason}</span>
                      )}
                    </div>
                    <span className="text-xs text-surface-400">
                      {new Date(esc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        !selectedUserId && (
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
            <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">
              Search for a user to view their wellness report
            </h3>
            <p className="text-surface-500">
              Use the search bar above to find a user by name or email
            </p>
          </div>
        )
      )}
    </div>
  );
}

// ============================================================================
// Aggregate Trends Tab
// ============================================================================

function AggregateTrendsTab({ token }: { token: string }) {
  const [trends, setTrends] = useState<AggregateTrends | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchTrends = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/counselor/reports/aggregate?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrends(data);
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [days]);

  return (
    <div>
      {/* Time Period Selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-500" />
          Platform-Wide Trends
        </h2>
        <div className="flex gap-2">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                days === d
                  ? 'bg-teal-500 text-white'
                  : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              )}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : trends ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label={`Sessions (${days}d)`}
              value={trends.totalSessions}
              icon={MessageCircle}
              color="#3B82F6"
            />
            <StatCard
              label="Unique Users"
              value={trends.totalUsers}
              icon={Users}
              color="#22C55E"
            />
            <StatCard
              label="Avg Mood"
              value={
                trends.averageMood
                  ? `${trends.averageMood.toFixed(1)} ${moodEmoji(trends.averageMood)}`
                  : 'N/A'
              }
              icon={Heart}
              color="#8B5CF6"
            />
          </div>

          {/* Mood Trend Chart */}
          {trends.moodTrend && trends.moodTrend.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Mood Trend
              </h3>
              <div className="flex items-end gap-1 h-40">
                {trends.moodTrend.map((entry, i) => {
                  const height = (entry.avgMood / 5) * 100;
                  const moodColor =
                    entry.avgMood >= 4
                      ? 'bg-green-500'
                      : entry.avgMood >= 3
                        ? 'bg-yellow-500'
                        : entry.avgMood >= 2
                          ? 'bg-orange-500'
                          : 'bg-red-500';
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: i * 0.02, duration: 0.3 }}
                      className={cn('flex-1 rounded-t min-w-[4px]', moodColor)}
                      title={`${entry.date}: Avg ${entry.avgMood.toFixed(1)} (${entry.count} entries)`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-surface-400">
                <span>{trends.moodTrend[0]?.date}</span>
                <span>{trends.moodTrend[trends.moodTrend.length - 1]?.date}</span>
              </div>
            </div>
          )}

          {/* Session Volume Chart */}
          {trends.sessionVolume && trends.sessionVolume.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Session Volume
              </h3>
              <div className="flex items-end gap-1 h-40">
                {trends.sessionVolume.map((entry, i) => {
                  const maxCount = Math.max(...trends.sessionVolume.map((e) => e.count), 1);
                  const height = (entry.count / maxCount) * 100;
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: i * 0.02, duration: 0.3 }}
                      className="flex-1 rounded-t min-w-[4px] bg-blue-500"
                      title={`${entry.date}: ${entry.count} sessions`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-surface-400">
                <span>{trends.sessionVolume[0]?.date}</span>
                <span>{trends.sessionVolume[trends.sessionVolume.length - 1]?.date}</span>
              </div>
            </div>
          )}

          {/* Most Common Topics */}
          {trends.topTopics && trends.topTopics.length > 0 && (
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-teal-500" />
                Most Common Topics
              </h3>
              <div className="space-y-3">
                {trends.topTopics.map((topic, index) => {
                  const maxCount = trends.topTopics[0]?.count || 1;
                  const percentage = (topic.count / maxCount) * 100;
                  const topicLabel =
                    topicLabels[topic.topic as CounselorTopic] || topic.topic;

                  return (
                    <div key={topic.topic}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-surface-700 dark:text-surface-300">{topicLabel}</span>
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                          {topic.count} sessions
                        </span>
                      </div>
                      <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
          <p className="text-surface-500">No trend data available</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Add Counselor Modal
// ============================================================================

function AddCounselorModal({
  token,
  onClose,
  onSuccess,
}: {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [specializations, setSpecializations] = useState<CounselorTopic[]>([]);
  const [maxCaseload, setMaxCaseload] = useState(50);
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/users?search=${encodeURIComponent(searchQuery)}&limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/counselor/admin/counselors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          specializations,
          maxCaseload,
          bio,
          qualifications,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add counselor');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to add counselor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSpecialization = (topic: CounselorTopic) => {
    setSpecializations((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

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
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Add New Counselor</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Select User *
            </label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-800">
                <div>
                  <p className="font-medium text-surface-900 dark:text-white">{selectedUser.displayName}</p>
                  <p className="text-sm text-surface-500">{selectedUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded hover:bg-teal-100 dark:hover:bg-teal-800"
                >
                  <X className="w-4 h-4 text-teal-600" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-800 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700 max-h-48 overflow-y-auto z-10">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full p-3 text-left hover:bg-surface-50 dark:hover:bg-surface-700 border-b border-surface-100 dark:border-surface-700 last:border-0"
                      >
                        <p className="font-medium text-surface-900 dark:text-white">{user.displayName}</p>
                        <p className="text-sm text-surface-500">{user.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Specializations
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(topicLabels) as CounselorTopic[]).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleSpecialization(topic)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    specializations.includes(topic)
                      ? topicColors[topic]
                      : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                  )}
                >
                  {topicLabels[topic]}
                </button>
              ))}
            </div>
          </div>

          {/* Max Caseload */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Max Caseload
            </label>
            <input
              type="number"
              value={maxCaseload}
              onChange={(e) => setMaxCaseload(parseInt(e.target.value) || 50)}
              min={1}
              max={200}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Professional Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief description of the counselor's background..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Qualifications */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Qualifications
            </label>
            <textarea
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder="Degrees, certifications, training..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedUser || isSubmitting} className="flex-1">
              {isSubmitting ? 'Adding...' : 'Add Counselor'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Edit Counselor Modal
// ============================================================================

function EditCounselorModal({
  token,
  counselor,
  onClose,
  onSuccess,
}: {
  token: string;
  counselor: Counselor;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const existingSpecs = counselor.specializations
    ? typeof counselor.specializations === 'string'
      ? JSON.parse(counselor.specializations as unknown as string)
      : counselor.specializations
    : [];

  const [specializations, setSpecializations] = useState<CounselorTopic[]>(existingSpecs);
  const [status, setStatus] = useState<CounselorStatus>(counselor.status);
  const [maxCaseload, setMaxCaseload] = useState(counselor.maxCaseload);
  const [bio, setBio] = useState(counselor.bio || '');
  const [qualifications, setQualifications] = useState(counselor.qualifications || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/counselor/admin/counselors/${counselor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          specializations,
          status,
          maxCaseload,
          bio,
          qualifications,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update counselor');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to update counselor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSpecialization = (topic: CounselorTopic) => {
    setSpecializations((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

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
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Edit Counselor</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Counselor Info (read-only) */}
          <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
              {counselor.counselorName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-surface-900 dark:text-white">{counselor.counselorName}</p>
              <p className="text-sm text-surface-500">{counselor.counselorEmail}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CounselorStatus)}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Specializations
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(topicLabels) as CounselorTopic[]).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleSpecialization(topic)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    specializations.includes(topic)
                      ? topicColors[topic]
                      : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                  )}
                >
                  {topicLabels[topic]}
                </button>
              ))}
            </div>
          </div>

          {/* Max Caseload */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Max Caseload
            </label>
            <input
              type="number"
              value={maxCaseload}
              onChange={(e) => setMaxCaseload(parseInt(e.target.value) || 50)}
              min={1}
              max={200}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Professional Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Qualifications */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Qualifications
            </label>
            <textarea
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Helper for date formatting
function formatDistanceToNow(date: Date, opts?: { addSuffix?: boolean }): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let result: string;
  if (diffMins < 1) result = 'less than a minute';
  else if (diffMins < 60) result = `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  else if (diffHours < 24) result = `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  else if (diffDays < 30) result = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  else result = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''}`;

  return opts?.addSuffix ? `${result} ago` : result;
}
