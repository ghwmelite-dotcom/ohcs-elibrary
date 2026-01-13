/**
 * Event Detail Page
 * Full event details with registration, attendees, and management
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Star,
  Bell,
  Edit,
  Trash2,
  ExternalLink,
  Share2,
  Check,
  XCircle,
  HelpCircle,
  UserPlus,
  Repeat,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCalendarStore } from '@/stores/calendarStore';
import { useAuthStore } from '@/stores/authStore';
import { EventForm } from '@/components/calendar';
import type { RSVPStatus, EventAttendee } from '@/types/calendar';
import { CATEGORY_COLORS } from '@/types/calendar';

const rsvpOptions: { status: RSVPStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: 'accepted', label: 'Going', icon: <Check className="w-4 h-4" />, color: 'bg-green-500 hover:bg-green-600' },
  { status: 'tentative', label: 'Maybe', icon: <HelpCircle className="w-4 h-4" />, color: 'bg-yellow-500 hover:bg-yellow-600' },
  { status: 'declined', label: 'Not Going', icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500 hover:bg-red-600' },
];

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    currentEvent: event,
    attendees,
    isLoading,
    isRegistering,
    error,
    fetchEvent,
    fetchAttendees,
    registerForEvent,
    cancelRegistration,
    updateRsvp,
    deleteEvent,
    clearCurrentEvent,
  } = useCalendarStore();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showAllAttendees, setShowAllAttendees] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId);
      fetchAttendees(eventId);
    }

    return () => {
      clearCurrentEvent();
    };
  }, [eventId, fetchEvent, fetchAttendees, clearCurrentEvent]);

  if (isLoading && !event) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-ghana-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-500 dark:text-surface-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
            Event Not Found
          </h2>
          <p className="text-surface-500 dark:text-surface-400 mb-4">
            {error || "The event you're looking for doesn't exist or has been removed."}
          </p>
          <Link
            to="/calendar"
            className="inline-flex items-center gap-2 px-4 py-2 bg-ghana-green text-white rounded-lg hover:bg-ghana-green/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Calendar
          </Link>
        </div>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[event.eventType] || CATEGORY_COLORS.general;
  const isOrganizer = user?.id === event.organizerId;
  const isCapacityFull = event.capacity ? event.attendeeCount >= event.capacity : false;

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
    fetchEvent(event.id);
    fetchAttendees(event.id);
  };

  const handleRsvp = async (status: RSVPStatus) => {
    await updateRsvp(event.id, status);
    fetchEvent(event.id);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${event.title}"? This action cannot be undone.`)) {
      const success = await deleteEvent(event.id);
      if (success) {
        navigate('/calendar');
      }
    }
  };

  const displayedAttendees = showAllAttendees ? attendees : attendees.slice(0, 6);
  const acceptedCount = attendees.filter(a => a.status === 'accepted').length;
  const pendingCount = attendees.filter(a => a.status === 'pending').length;
  const waitlistedCount = attendees.filter(a => a.status === 'waitlisted').length;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div
        className="h-48 sm:h-64 relative"
        style={{
          background: `linear-gradient(135deg, ${categoryColor}dd, ${categoryColor}88)`,
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative h-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-6">
          <Link
            to="/calendar"
            className="absolute top-4 left-4 sm:left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Calendar</span>
          </Link>

          {isOrganizer && (
            <div className="absolute top-4 right-4 sm:right-6 flex items-center gap-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Edit Event"
              >
                <Edit className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                title="Delete Event"
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* Event Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white">
              {event.eventType.replace('_', ' ').charAt(0).toUpperCase() + event.eventType.slice(1)}
            </span>
            {event.isRecurring && (
              <span className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                <Repeat className="w-3.5 h-3.5" />
                Recurring
              </span>
            )}
            {event.xpReward > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-ghana-gold/80 rounded-full text-sm font-medium text-white">
                <Star className="w-3.5 h-3.5" />
                {event.xpReward} XP
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                  Event Details
                </h2>

                <div className="space-y-4">
                  {/* Date & Time */}
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-ghana-green/10 rounded-xl">
                      <Calendar className="w-5 h-5 text-ghana-green" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900 dark:text-white">
                        {formatDate(event.startDate)}
                      </p>
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        {event.isAllDay
                          ? 'All day'
                          : `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {(event.location || event.isVirtual) && (
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl ${event.isVirtual ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-surface-100 dark:bg-surface-700'}`}>
                        {event.isVirtual ? (
                          <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <MapPin className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 dark:text-white">
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

                  {/* Organizer */}
                  {event.organizer && (
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                        <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 dark:text-white">
                          Organized by
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {event.organizer.avatar ? (
                            <img
                              src={event.organizer.avatar}
                              alt={event.organizer.displayName}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-ghana-green text-white text-xs flex items-center justify-center">
                              {event.organizer.displayName?.charAt(0) || 'O'}
                            </div>
                          )}
                          <span className="text-sm text-surface-600 dark:text-surface-400">
                            {event.organizer.displayName}
                            {event.organizer.title && ` - ${event.organizer.title}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                    <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      About This Event
                    </h3>
                    <p className="text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {event.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-surface-100 dark:bg-surface-700 rounded-full text-xs text-surface-600 dark:text-surface-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Attendees Card */}
            {event.registrationRequired && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                      Attendees
                    </h2>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-600 dark:text-green-400">{acceptedCount} going</span>
                      {pendingCount > 0 && (
                        <span className="text-yellow-600 dark:text-yellow-400">{pendingCount} pending</span>
                      )}
                      {waitlistedCount > 0 && (
                        <span className="text-orange-600 dark:text-orange-400">{waitlistedCount} waitlisted</span>
                      )}
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  {event.capacity && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-surface-600 dark:text-surface-400">
                          {event.attendeeCount} / {event.capacity} spots filled
                        </span>
                        <span className="text-surface-500 dark:text-surface-500">
                          {Math.round((event.attendeeCount / event.capacity) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            event.attendeeCount >= event.capacity
                              ? 'bg-red-500'
                              : event.attendeeCount >= event.capacity * 0.8
                                ? 'bg-yellow-500'
                                : 'bg-ghana-green'
                          }`}
                          style={{ width: `${Math.min(100, (event.attendeeCount / event.capacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Attendee List */}
                  {attendees.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {displayedAttendees.map(attendee => (
                          <div
                            key={attendee.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-surface-50 dark:bg-surface-700/50"
                          >
                            {attendee.user.avatar ? (
                              <img
                                src={attendee.user.avatar}
                                alt={attendee.user.displayName}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-ghana-green text-white text-sm flex items-center justify-center">
                                {attendee.user.displayName?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                                {attendee.user.displayName}
                              </p>
                              <p className={`text-xs ${
                                attendee.status === 'accepted' ? 'text-green-600 dark:text-green-400' :
                                attendee.status === 'waitlisted' ? 'text-orange-600 dark:text-orange-400' :
                                'text-surface-500 dark:text-surface-400'
                              }`}>
                                {attendee.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {attendees.length > 6 && (
                        <button
                          onClick={() => setShowAllAttendees(!showAllAttendees)}
                          className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm text-ghana-green hover:text-ghana-green/80 transition-colors"
                        >
                          {showAllAttendees ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show All ({attendees.length})
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-surface-500 dark:text-surface-400 py-4">
                      No attendees yet. Be the first to register!
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden sticky top-6"
            >
              <div className="p-6">
                {event.registrationRequired ? (
                  <>
                    {event.isRegistered ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className={`
                            inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                            ${event.myRsvpStatus === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : ''}
                            ${event.myRsvpStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' : ''}
                            ${event.myRsvpStatus === 'waitlisted' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' : ''}
                            ${event.myRsvpStatus === 'tentative' ? 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300' : ''}
                            ${event.myRsvpStatus === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' : ''}
                          `}>
                            {event.myRsvpStatus === 'accepted' && <><Check className="w-4 h-4" /> You're registered!</>}
                            {event.myRsvpStatus === 'pending' && <><Clock className="w-4 h-4" /> Pending confirmation</>}
                            {event.myRsvpStatus === 'waitlisted' && <><Users className="w-4 h-4" /> On waitlist</>}
                            {event.myRsvpStatus === 'tentative' && <><HelpCircle className="w-4 h-4" /> Maybe attending</>}
                            {event.myRsvpStatus === 'declined' && <><XCircle className="w-4 h-4" /> Declined</>}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {rsvpOptions.map(option => (
                            <button
                              key={option.status}
                              onClick={() => handleRsvp(option.status)}
                              disabled={isRegistering}
                              className={`
                                flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium transition-all
                                ${option.color}
                                ${event.myRsvpStatus === option.status ? 'ring-2 ring-offset-2 ring-current' : ''}
                                disabled:opacity-50
                              `}
                            >
                              {option.icon}
                              {option.label}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleRegister}
                          disabled={isRegistering}
                          className="w-full py-2 text-sm text-red-500 hover:text-red-600 transition-colors"
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
                            ? 'bg-surface-200 dark:bg-surface-700 text-surface-500 cursor-not-allowed'
                            : 'bg-ghana-green hover:bg-ghana-green/90 text-white'
                          }
                          disabled:opacity-50
                        `}
                      >
                        {isRegistering ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Registering...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            {isCapacityFull && event.waitlistEnabled ? 'Join Waitlist' : 'Register Now'}
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center text-surface-500 dark:text-surface-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No registration required</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                  <button
                    className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                    title="Set reminder"
                  >
                    <Bell className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.share?.({
                        title: event.title,
                        text: event.description,
                        url: window.location.href,
                      });
                    }}
                    className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                    title="Share event"
                  >
                    <Share2 className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Event Form */}
      <EventForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        event={event}
        onSuccess={() => {
          setShowEditForm(false);
          fetchEvent(event.id);
        }}
      />
    </div>
  );
}
