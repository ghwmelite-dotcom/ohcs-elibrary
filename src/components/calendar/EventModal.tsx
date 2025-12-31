/**
 * Event Modal Component
 * Quick view modal for event details with RSVP actions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Clock, MapPin, Video, Users, Star, Bell, Edit, Trash2,
  ExternalLink, Share2, Check, XCircle, HelpCircle, UserPlus, Repeat
} from 'lucide-react';
import { useCalendarStore } from '@/stores/calendarStore';
import type { CalendarEvent, RSVPStatus } from '@/types/calendar';
import { CATEGORY_COLORS } from '@/types/calendar';

interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  onViewDetails?: (event: CalendarEvent) => void;
}

const rsvpOptions: { status: RSVPStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: 'accepted', label: 'Accept', icon: <Check className="w-4 h-4" />, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { status: 'tentative', label: 'Maybe', icon: <HelpCircle className="w-4 h-4" />, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  { status: 'declined', label: 'Decline', icon: <XCircle className="w-4 h-4" />, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
];

export default function EventModal({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewDetails,
}: EventModalProps) {
  const {
    registerForEvent,
    cancelRegistration,
    updateRsvp,
    setReminder,
    isRegistering,
  } = useCalendarStore();

  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<number | null>(null);

  if (!event) return null;

  const categoryColor = CATEGORY_COLORS[event.eventType] || CATEGORY_COLORS.general;

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRegister = async () => {
    if (event.isRegistered) {
      await cancelRegistration(event.id);
    } else {
      await registerForEvent(event.id);
    }
  };

  const handleRsvp = async (status: RSVPStatus) => {
    await updateRsvp(event.id, status);
  };

  const handleSetReminder = async (minutes: number) => {
    const success = await setReminder(event.id, minutes);
    if (success) {
      setSelectedReminder(minutes);
      setShowReminderOptions(false);
    }
  };

  const canEdit = event.organizerId === 'current-user'; // TODO: Get from auth
  const isCapacityFull = event.capacity ? event.attendeeCount >= event.capacity : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header with category color */}
            <div
              className="h-2"
              style={{ backgroundColor: categoryColor }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-6">
              {/* Event Type Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${categoryColor}20`,
                    color: categoryColor,
                  }}
                >
                  {event.eventType.replace('_', ' ').charAt(0).toUpperCase() + event.eventType.slice(1)}
                </span>
                {event.isRecurring && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                    <Repeat className="w-3 h-3" />
                    Recurring
                  </span>
                )}
                {event.xpReward > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-ghana-gold/10 text-ghana-gold rounded-full text-xs font-medium">
                    <Star className="w-3 h-3" />
                    {event.xpReward} XP
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pr-8">
                {event.title}
              </h2>

              {/* Event Details */}
              <div className="space-y-3 mb-6">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formatDate(event.startDate)}
                    </p>
                    {!event.isAllDay && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(event.startDate)} - {formatTime(event.endDate)}
                      </p>
                    )}
                    {event.isAllDay && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">All day</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                {(event.location || event.isVirtual) && (
                  <div className="flex items-start gap-3">
                    {event.isVirtual ? (
                      <Video className="w-5 h-5 text-blue-500 mt-0.5" />
                    ) : (
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    )}
                    <div>
                      <p className="text-gray-900 dark:text-white">
                        {event.isVirtual ? 'Virtual Event' : event.location}
                      </p>
                      {event.meetingUrl && (
                        <a
                          href={event.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-ghana-green hover:underline flex items-center gap-1"
                        >
                          Join Meeting <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Capacity */}
                {event.registrationRequired && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-900 dark:text-white">
                        {event.attendeeCount} {event.capacity ? `/ ${event.capacity}` : ''} attendees
                      </p>
                      {isCapacityFull && event.waitlistEnabled && (
                        <p className="text-sm text-orange-500">Event full - Waitlist available</p>
                      )}
                      {isCapacityFull && !event.waitlistEnabled && (
                        <p className="text-sm text-red-500">Event full - Registration closed</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Organizer */}
                {event.organizer && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-ghana-green text-white text-xs flex items-center justify-center">
                        {event.organizer.displayName?.charAt(0) || 'O'}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Organized by <span className="font-medium">{event.organizer.displayName}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              {/* RSVP Section */}
              {event.registrationRequired && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Your Response
                  </h4>

                  {event.isRegistered ? (
                    <div className="space-y-3">
                      {/* Current status */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium
                            ${event.myRsvpStatus === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                            ${event.myRsvpStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                            ${event.myRsvpStatus === 'waitlisted' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                            ${event.myRsvpStatus === 'tentative' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}
                            ${event.myRsvpStatus === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                          `}
                        >
                          {event.myRsvpStatus === 'accepted' && 'You\'re attending'}
                          {event.myRsvpStatus === 'pending' && 'Pending confirmation'}
                          {event.myRsvpStatus === 'waitlisted' && 'On waitlist'}
                          {event.myRsvpStatus === 'tentative' && 'Maybe attending'}
                          {event.myRsvpStatus === 'declined' && 'Declined'}
                        </span>
                      </div>

                      {/* RSVP options */}
                      <div className="flex flex-wrap gap-2">
                        {rsvpOptions.map((option) => (
                          <button
                            key={option.status}
                            onClick={() => handleRsvp(option.status)}
                            disabled={isRegistering}
                            className={`
                              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                              ${event.myRsvpStatus === option.status ? option.color : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                              hover:opacity-80 disabled:opacity-50
                            `}
                          >
                            {option.icon}
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {/* Cancel registration */}
                      <button
                        onClick={handleRegister}
                        disabled={isRegistering}
                        className="text-sm text-red-500 hover:text-red-600 transition-colors"
                      >
                        Cancel Registration
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={isRegistering || (isCapacityFull && !event.waitlistEnabled)}
                      className={`
                        flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium transition-all
                        ${isCapacityFull && !event.waitlistEnabled
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-ghana-green hover:bg-ghana-green/90 text-white'
                        }
                        disabled:opacity-50
                      `}
                    >
                      {isRegistering ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          {isCapacityFull && event.waitlistEnabled ? 'Join Waitlist' : 'Register'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  {/* Reminder */}
                  <div className="relative">
                    <button
                      onClick={() => setShowReminderOptions(!showReminderOptions)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Set reminder"
                    >
                      <Bell className={`w-5 h-5 ${selectedReminder ? 'text-ghana-gold' : 'text-gray-500'}`} />
                    </button>

                    {/* Reminder dropdown */}
                    <AnimatePresence>
                      {showReminderOptions && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                        >
                          {[
                            { value: 15, label: '15 minutes before' },
                            { value: 60, label: '1 hour before' },
                            { value: 1440, label: '1 day before' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleSetReminder(option.value)}
                              className={`
                                w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                                ${selectedReminder === option.value ? 'text-ghana-green font-medium' : 'text-gray-700 dark:text-gray-300'}
                              `}
                            >
                              {option.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Share */}
                  <button
                    onClick={() => {
                      navigator.share?.({
                        title: event.title,
                        text: event.description,
                        url: window.location.href,
                      });
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Share event"
                  >
                    <Share2 className="w-5 h-5 text-gray-500" />
                  </button>

                  {/* Edit (if organizer) */}
                  {canEdit && onEdit && (
                    <button
                      onClick={() => onEdit(event)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Edit event"
                    >
                      <Edit className="w-5 h-5 text-gray-500" />
                    </button>
                  )}

                  {/* Delete (if organizer) */}
                  {canEdit && onDelete && (
                    <button
                      onClick={() => onDelete(event)}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  )}
                </div>

                {/* View Details */}
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(event)}
                    className="px-4 py-2 text-ghana-green hover:bg-ghana-green/10 rounded-lg font-medium transition-colors"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
