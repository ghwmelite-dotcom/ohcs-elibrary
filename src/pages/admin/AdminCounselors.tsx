import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  UserCog,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Heart,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  Briefcase,
  TrendingUp,
  Users,
  DollarSign,
  MessageCircle,
  Building2,
  Mail,
  Clock,
  Activity,
  Pause,
  Play,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import type { CounselorTopic, CounselorStatus } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1';

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
  active: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Play },
  inactive: { label: 'Inactive', color: 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-400', icon: Pause },
  on_leave: { label: 'On Leave', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
};

// Animated Background
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

// Stat Card
interface StatCardProps {
  label: string;
  value: number;
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

export default function AdminCounselors() {
  const { token } = useAuthStore();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [stats, setStats] = useState<CounselorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Fetch counselors and stats
  useEffect(() => {
    fetchCounselors();
    fetchStats();
  }, []);

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

  const handleDeleteCounselor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this counselor?')) return;

    try {
      const res = await fetch(`${API_BASE}/counselor/admin/counselors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCounselors(prev => prev.filter(c => c.id !== id));
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
        setCounselors(prev => prev.map(c => c.id === id ? { ...c, status } : c));
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
    setActionMenuId(null);
  };

  // Filter counselors
  const filteredCounselors = counselors.filter(c => {
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                  Counselor Management
                </h1>
                <p className="text-surface-600 dark:text-surface-400">
                  Manage wellness counselors and assignments
                </p>
              </div>
            </div>

            <Button onClick={() => setShowAddModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Counselor
            </Button>
          </div>
        </motion.div>

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
                  ? (typeof counselor.specializations === 'string'
                      ? JSON.parse(counselor.specializations)
                      : counselor.specializations)
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
                            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>

                            <div className="relative">
                              <button
                                onClick={() => setActionMenuId(actionMenuId === counselor.id ? null : counselor.id)}
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
                                className={cn('px-2 py-0.5 rounded text-xs font-medium', topicColors[topic])}
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

// Add Counselor Modal
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

  // Search users
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
    setSpecializations(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
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
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">
              Add New Counselor
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700">
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

// Edit Counselor Modal
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
    ? (typeof counselor.specializations === 'string'
        ? JSON.parse(counselor.specializations)
        : counselor.specializations)
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
    setSpecializations(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
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
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">
              Edit Counselor
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700">
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
