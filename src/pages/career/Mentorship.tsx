import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Users,
  Star,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  Award,
  ChevronDown,
  ChevronUp,
  History,
  Filter,
  Calendar,
  Building2,
  Target,
  GraduationCap,
  Sparkles,
  User,
  Mail,
} from 'lucide-react';
import { useCareerStore } from '@/stores/careerStore';
import type { CareerMentor, MentorshipRequest } from '@/types/career';
import { cn } from '@/utils/cn';

// ============================================================================
// MENTOR CARD
// ============================================================================
interface MentorCardProps {
  mentor: CareerMentor;
  onRequest: (mentor: CareerMentor) => void;
  hasActiveRequest: boolean;
}

function MentorCard({ mentor, onRequest, hasActiveRequest }: MentorCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
            {mentor.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">{mentor.name}</h3>
            <p className="text-white/80 text-sm">{mentor.title}</p>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-4 h-4',
                    star <= Math.round(mentor.rating) ? 'fill-yellow-300 text-yellow-300' : 'text-white/30'
                  )}
                />
              ))}
              <span className="ml-1 text-sm text-white/80">{mentor.rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <p className="text-sm text-surface-600 dark:text-surface-300 mb-4 line-clamp-3">{mentor.bio}</p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
            <Building2 className="w-4 h-4 text-surface-400 dark:text-surface-500" />
            <span>{mentor.ministry}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
            <Briefcase className="w-4 h-4 text-surface-400 dark:text-surface-500" />
            <span>{mentor.yearsOfService} years of service</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
            <Users className="w-4 h-4 text-surface-400 dark:text-surface-500" />
            <span>{mentor.totalMentees} mentees ({mentor.activeMentees} active)</span>
          </div>
        </div>

        {/* Expertise */}
        <div className="mb-4">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">Expertise</p>
          <div className="flex flex-wrap gap-1.5">
            {mentor.expertise.slice(0, 4).map((exp) => (
              <span key={exp} className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-lg">
                {exp}
              </span>
            ))}
          </div>
        </div>

        {/* Available For */}
        <div className="mb-6">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">Available For</p>
          <div className="flex flex-wrap gap-1.5">
            {mentor.availableFor.map((item) => (
              <span
                key={item}
                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg capitalize"
              >
                {item.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onRequest(mentor)}
          disabled={hasActiveRequest || !mentor.isAvailable}
          className={cn(
            'w-full py-3 rounded-xl font-medium transition-all duration-200',
            hasActiveRequest
              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 cursor-not-allowed'
              : mentor.isAvailable
              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-surface-100 dark:bg-surface-700 text-surface-400 dark:text-surface-500 cursor-not-allowed'
          )}
        >
          {hasActiveRequest ? 'Request Pending' : mentor.isAvailable ? 'Request Mentorship' : 'Currently Unavailable'}
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// REQUEST MODAL
// ============================================================================
interface RequestModalProps {
  mentor: CareerMentor;
  onClose: () => void;
  onSubmit: (data: { purpose: string; goals: string[]; preferredDuration: string; message: string }) => void;
}

function RequestModal({ mentor, onClose, onSubmit }: RequestModalProps) {
  const [purpose, setPurpose] = useState('');
  const [goals, setGoals] = useState('');
  const [duration, setDuration] = useState('3_months');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      purpose,
      goals: goals.split('\n').filter((g) => g.trim()),
      preferredDuration: duration,
      message,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-surface-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="p-6 border-b border-surface-100 dark:border-surface-700">
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">Request Mentorship</h2>
          <p className="text-surface-500 dark:text-surface-400">Connect with {mentor.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
            >
              <option value="">Select purpose...</option>
              <option value="career_guidance">Career Guidance</option>
              <option value="skill_development">Skill Development</option>
              <option value="promotion_prep">Promotion Preparation</option>
              <option value="leadership">Leadership Development</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
              Your Goals (one per line)
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              required
              rows={3}
              placeholder="What do you hope to achieve?"
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
              Preferred Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
            >
              <option value="3_months">3 Months</option>
              <option value="6_months">6 Months</option>
              <option value="12_months">12 Months</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Introduce yourself and explain why you'd like this mentor..."
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-200 font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors shadow-lg"
            >
              Send Request
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// REQUEST HISTORY SECTION
// ============================================================================
interface RequestHistoryProps {
  requests: MentorshipRequest[];
}

function RequestHistory({ requests }: RequestHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusConfig = (status: MentorshipRequest['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-900/30',
          border: 'border-amber-200 dark:border-amber-700',
          label: 'Pending',
        };
      case 'accepted':
        return {
          icon: CheckCircle2,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-700',
          label: 'Accepted',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-700',
          label: 'Declined',
        };
      case 'completed':
        return {
          icon: Award,
          color: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-900/30',
          border: 'border-purple-200 dark:border-purple-700',
          label: 'Completed',
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/50 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Request History</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">{requests.length} total requests</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-surface-400 dark:text-surface-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-surface-400 dark:text-surface-500" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Filter */}
            <div className="px-6 py-3 border-t border-surface-100 dark:border-surface-700 flex items-center gap-2">
              <Filter className="w-4 h-4 text-surface-400 dark:text-surface-500" />
              <div className="flex gap-2">
                {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-3 py-1 text-sm font-medium rounded-full transition-colors capitalize',
                      filter === f
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Request List */}
            <div className="px-6 pb-6">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                  <History className="w-12 h-12 mx-auto mb-3 text-surface-300 dark:text-surface-600" />
                  <p>No {filter === 'all' ? '' : filter} requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request, index) => {
                    const statusConfig = getStatusConfig(request.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={cn(
                          'p-4 rounded-xl border',
                          statusConfig.border,
                          statusConfig.bg
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-white dark:bg-surface-800 rounded-xl flex items-center justify-center shadow-sm">
                              <User className="w-5 h-5 text-surface-600 dark:text-surface-300" />
                            </div>
                            <div>
                              <h4 className="font-medium text-surface-900 dark:text-surface-100">
                                {request.mentorName || 'Mentor'}
                              </h4>
                              <p className="text-sm text-surface-600 dark:text-surface-300 capitalize">
                                {request.purpose.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full', statusConfig.bg)}>
                            <StatusIcon className={cn('w-4 h-4', statusConfig.color)} />
                            <span className={cn('text-sm font-medium', statusConfig.color)}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        {/* Goals */}
                        {request.goals.length > 0 && (
                          <div className="mt-3 ml-13">
                            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Goals:</p>
                            <ul className="text-sm text-surface-600 dark:text-surface-300 space-y-1">
                              {request.goals.map((goal, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Target className="w-3 h-3 mt-1 text-surface-400 dark:text-surface-500" />
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Mentor Response */}
                        {request.mentorResponse && (
                          <div className="mt-3 p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-600">
                            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Mentor Response:</p>
                            <p className="text-sm text-surface-700 dark:text-surface-200">{request.mentorResponse}</p>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="mt-3 flex items-center gap-4 text-xs text-surface-500 dark:text-surface-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Requested: {formatDate(request.createdAt)}
                          </span>
                          {request.respondedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Responded: {formatDate(request.respondedAt)}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Mentorship() {
  const {
    mentors,
    mentorshipRequests,
    loadCareerData,
    submitMentorshipRequest,
    isLoading,
  } = useCareerStore();

  const [selectedMentor, setSelectedMentor] = useState<CareerMentor | null>(null);

  useEffect(() => {
    loadCareerData();
  }, [loadCareerData]);

  const handleRequestMentorship = (mentor: CareerMentor) => {
    setSelectedMentor(mentor);
  };

  const handleSubmitRequest = (data: {
    purpose: string;
    goals: string[];
    preferredDuration: string;
    message: string;
  }) => {
    if (selectedMentor) {
      submitMentorshipRequest({
        menteeId: 'current-user',
        mentorId: selectedMentor.id,
        mentorName: selectedMentor.name,
        purpose: data.purpose,
        goals: data.goals,
        preferredDuration: data.preferredDuration,
        message: data.message,
      });
      setSelectedMentor(null);
    }
  };

  const hasPendingRequest = (mentorId: string) => {
    return mentorshipRequests.some(
      (req) => req.mentorId === mentorId && req.status === 'pending'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-600 dark:text-surface-300">Loading Mentors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/50 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Find a Mentor</h1>
              <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Popular
              </span>
            </div>
            <p className="text-surface-500 dark:text-surface-400">Connect with experienced officers for career guidance</p>
          </div>
        </div>
      </motion.div>

      {/* Request History */}
      {mentorshipRequests.length > 0 && (
        <div className="mb-8">
          <RequestHistory requests={mentorshipRequests} />
        </div>
      )}

      {/* Available Mentors */}
      <div>
        <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-4">Available Mentors</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              onRequest={handleRequestMentorship}
              hasActiveRequest={hasPendingRequest(mentor.id)}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {mentors.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">No Mentors Available</h2>
          <p className="text-surface-500 dark:text-surface-400">Check back later for available mentors.</p>
        </div>
      )}

      {/* Request Modal */}
      <AnimatePresence>
        {selectedMentor && (
          <RequestModal
            mentor={selectedMentor}
            onClose={() => setSelectedMentor(null)}
            onSubmit={handleSubmitRequest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
