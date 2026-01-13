/**
 * Event Modal Component
 * Responsive modal with bottom sheet on mobile, centered modal on desktop
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  ExternalLink,
  Edit2,
  Trash2,
  Award,
  ChevronRight,
  Share2,
  Bell,
} from 'lucide-react';
import type { CalendarEvent } from '@/types/calendar';

interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  onViewDetails?: (event: CalendarEvent) => void;
}

export default function EventModal({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewDetails,
}: EventModalProps) {
  if (!event) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal - Bottom sheet on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-[95%] sm:max-w-lg"
          >
            <div className="bg-white dark:bg-surface-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
              {/* Drag Handle - Mobile */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-surface-300 dark:bg-surface-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="relative px-4 sm:px-6 pt-2 sm:pt-5 pb-4">
                {/* Category Badge */}
                {event.category && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
                    style={{
                      backgroundColor: `${event.category.color}15`,
                      color: event.category.color,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.category.color }} />
                    {event.category.name}
                  </div>
                )}

                {/* Title */}
                <h2 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-50 pr-10 leading-tight">
                  {event.title}
                </h2>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2 rounded-xl bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-4">
                {/* Date & Time */}
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl sm:rounded-2xl">
                  <div className="p-2 sm:p-2.5 bg-ghana-green/10 dark:bg-ghana-green/20 rounded-xl">
                    <Calendar className="w-5 h-5 text-ghana-green dark:text-ghana-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-surface-900 dark:text-surface-50">
                      {formatDate(event.startDate)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-surface-500 dark:text-surface-400">
                      <Clock className="w-4 h-4" />
                      <span>
                        {event.isAllDay ? 'All Day' : `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`}
                      </span>
                      {!event.isAllDay && (
                        <>
                          <span className="text-surface-300 dark:text-surface-600">•</span>
                          <span>{getDuration()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location */}
                {(event.location || event.isVirtual) && (
                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl sm:rounded-2xl">
                    <div className="p-2 sm:p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      {event.isVirtual ? (
                        <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-surface-900 dark:text-surface-50">
                        {event.isVirtual ? 'Virtual Event' : event.location}
                      </p>
                      {event.meetingUrl && (
                        <a
                          href={event.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Join Meeting</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Capacity & Registration */}
                {event.registrationRequired && (
                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl sm:rounded-2xl">
                    <div className="p-2 sm:p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-medium text-surface-900 dark:text-surface-50">
                        Registration Required
                      </p>
                      <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                        {event.attendeeCount || 0}{event.capacity ? ` / ${event.capacity}` : ''} registered
                        {event.waitlistEnabled && ' • Waitlist enabled'}
                      </p>
                    </div>
                  </div>
                )}

                {/* XP Reward */}
                {event.xpReward > 0 && (
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-ghana-gold/10 to-yellow-100/50 dark:from-ghana-gold/20 dark:to-yellow-900/20 rounded-xl sm:rounded-2xl">
                    <div className="p-2 sm:p-2.5 bg-ghana-gold/20 rounded-xl">
                      <Award className="w-5 h-5 text-ghana-gold" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-ghana-gold">
                        Earn {event.xpReward} XP
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        for attending this event
                      </p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
                      About
                    </h3>
                    <p className="text-sm sm:text-base text-surface-700 dark:text-surface-300 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Organizer */}
                {event.organizer && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center overflow-hidden">
                      {event.organizer.avatar ? (
                        <img src={event.organizer.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-surface-500 dark:text-surface-400">
                          {event.organizer.displayName?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        {event.organizer.displayName}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Organizer</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 p-4 sm:p-5 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {/* View Details */}
                  {onViewDetails && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onViewDetails(event)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-ghana-green hover:bg-ghana-green/90 text-white rounded-xl font-medium transition-colors"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  )}

                  {/* Secondary Actions */}
                  <div className="flex gap-2">
                    {onEdit && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEdit(event)}
                        className="flex-1 sm:flex-none p-3 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-xl transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5 text-surface-600 dark:text-surface-300 mx-auto" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 sm:flex-none p-3 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-xl transition-colors"
                      title="Set Reminder"
                    >
                      <Bell className="w-5 h-5 text-surface-600 dark:text-surface-300 mx-auto" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 sm:flex-none p-3 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 rounded-xl transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5 text-surface-600 dark:text-surface-300 mx-auto" />
                    </motion.button>
                    {onDelete && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDelete(event)}
                        className="flex-1 sm:flex-none p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400 mx-auto" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
