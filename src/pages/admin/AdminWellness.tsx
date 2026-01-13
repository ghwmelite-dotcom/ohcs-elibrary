import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';

// API base URL
const API_BASE = import.meta.env.PROD
  ? 'https://ohcs-elibrary-api.ghwmelite.workers.dev/api/v1'
  : '/api/v1';

// Helper to get auth token
const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

interface DashboardStats {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  averageMood: number;
  escalationsPending: number;
  sessionsToday: number;
  topTopics: Array<{ topic: string; count: number }>;
}

interface Escalation {
  id: string;
  sessionId: string;
  userId?: string;
  userName?: string;
  reason?: string;
  urgency: 'low' | 'normal' | 'high' | 'crisis';
  status: 'pending' | 'acknowledged' | 'scheduled' | 'resolved';
  createdAt: string;
}

const urgencyColors = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  normal: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  crisis: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusColors = {
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

export default function AdminWellness() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [statsRes, escalationsRes] = await Promise.all([
        fetch(`${API_BASE}/counselor/admin/dashboard`, { headers }),
        fetch(`${API_BASE}/counselor/admin/escalations`, { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (escalationsRes.ok) {
        const escData = await escalationsRes.json();
        setEscalations(escData.escalations || []);
      }
    } catch (error) {
      console.error('Error fetching wellness admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateEscalation = async (escalationId: string, status: string) => {
    setIsUpdating(escalationId);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/counselor/admin/escalations/${escalationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setEscalations(prev =>
          prev.map(e => e.id === escalationId ? { ...e, status: status as Escalation['status'] } : e)
        );
      }
    } catch (error) {
      console.error('Error updating escalation:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const pendingEscalations = escalations.filter(e => e.status === 'pending');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/30">
              <Heart className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Wellness Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-surface-400">
            Monitor AI counselor sessions and manage escalations
          </p>
        </div>

        <Button
          onClick={fetchData}
          variant="outline"
          className="gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          label="Average Mood"
          value={stats?.averageMood?.toFixed(1) || '0.0'}
          trend="Out of 5"
          color="purple"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Escalations"
          value={stats?.escalationsPending || 0}
          trend="Needs attention"
          color="orange"
          alert={pendingEscalations.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Escalations Queue */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-amber-500" />
              Escalation Queue
            </h2>
            <span className="text-sm text-gray-500 dark:text-surface-400">
              {pendingEscalations.length} pending
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-surface-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : escalations.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-surface-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No escalations at this time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {escalations.map((escalation) => (
                <motion.div
                  key={escalation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border border-gray-200 dark:border-surface-700 hover:bg-gray-50 dark:hover:bg-surface-750 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          urgencyColors[escalation.urgency]
                        )}>
                          {escalation.urgency.toUpperCase()}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          statusColors[escalation.status]
                        )}>
                          {escalation.status}
                        </span>
                      </div>

                      <p className="text-gray-900 dark:text-white font-medium mb-1">
                        {escalation.userName || 'Anonymous User'}
                      </p>

                      {escalation.reason && (
                        <p className="text-sm text-gray-600 dark:text-surface-400 mb-2">
                          {escalation.reason}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-surface-400">
                        <Clock className="w-3 h-3" />
                        {escalation.createdAt
                          ? formatDistanceToNow(new Date(escalation.createdAt), { addSuffix: true })
                          : 'Recently'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {escalation.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateEscalation(escalation.id, 'acknowledged')}
                            disabled={isUpdating === escalation.id}
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateEscalation(escalation.id, 'scheduled')}
                            disabled={isUpdating === escalation.id}
                          >
                            Schedule
                          </Button>
                        </>
                      )}
                      {escalation.status === 'acknowledged' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateEscalation(escalation.id, 'scheduled')}
                          disabled={isUpdating === escalation.id}
                        >
                          Schedule
                        </Button>
                      )}
                      {(escalation.status === 'acknowledged' || escalation.status === 'scheduled') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleUpdateEscalation(escalation.id, 'resolved')}
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

        {/* Topic Distribution */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Top Topics
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
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
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {topic.count}
                      </span>
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

          {/* Summary stats */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-surface-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Overall Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-surface-400">Total Messages</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats?.totalMessages?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-surface-400">Avg. Mood Score</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats?.averageMood?.toFixed(1) || '0.0'} / 5
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-surface-400">Sessions Today</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats?.sessionsToday || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
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
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
          </span>
        )}
      </div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>

      <p className="text-sm text-gray-600 dark:text-surface-400">{label}</p>
      <p className="text-xs text-gray-500 dark:text-surface-500 mt-1">{trend}</p>
    </motion.div>
  );
}
