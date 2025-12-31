/**
 * Event Card Component
 * Displays event in calendar grid cells
 */

import { Clock, MapPin, Video, Users, Repeat, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CalendarEvent } from '@/types/calendar';
import { CATEGORY_COLORS } from '@/types/calendar';

interface EventCardProps {
  event: CalendarEvent;
  variant?: 'compact' | 'default' | 'expanded';
  onClick?: () => void;
}

export default function EventCard({ event, variant = 'default', onClick }: EventCardProps) {
  const categoryColor = CATEGORY_COLORS[event.eventType] || CATEGORY_COLORS.general;

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className="w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-all hover:ring-1 hover:ring-offset-1"
        style={{
          backgroundColor: `${categoryColor}20`,
          color: categoryColor,
          borderLeft: `3px solid ${categoryColor}`,
        }}
        title={event.title}
      >
        {!event.isAllDay && (
          <span className="font-medium mr-1">{formatTime(event.startDate)}</span>
        )}
        <span className="truncate">{event.title}</span>
      </motion.button>
    );
  }

  if (variant === 'expanded') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        onClick={onClick}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div
          className="h-1.5"
          style={{ backgroundColor: categoryColor }}
        />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>
            {event.xpReward > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-ghana-gold/10 rounded-full">
                <Star className="w-3.5 h-3.5 text-ghana-gold" />
                <span className="text-xs font-medium text-ghana-gold">{event.xpReward} XP</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                {event.isAllDay
                  ? 'All day'
                  : `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-1.5">
                {event.isVirtual ? (
                  <Video className="w-4 h-4 text-blue-500" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                <span className="truncate max-w-[150px]">
                  {event.isVirtual ? 'Virtual Event' : event.location}
                </span>
              </div>
            )}

            {event.registrationRequired && event.capacity && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>
                  {event.attendeeCount}/{event.capacity}
                </span>
              </div>
            )}

            {event.isRecurring && (
              <div className="flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-purple-500" />
                <span>Recurring</span>
              </div>
            )}
          </div>

          {/* Registration Status */}
          {event.isRegistered && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-medium
                  ${event.myRsvpStatus === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                  ${event.myRsvpStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                  ${event.myRsvpStatus === 'waitlisted' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                  ${event.myRsvpStatus === 'tentative' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}
                `}
              >
                {event.myRsvpStatus === 'accepted' && 'Registered'}
                {event.myRsvpStatus === 'pending' && 'Pending'}
                {event.myRsvpStatus === 'waitlisted' && 'On Waitlist'}
                {event.myRsvpStatus === 'tentative' && 'Tentative'}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      onClick={onClick}
      className="w-full text-left p-2 rounded-lg transition-all hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
      style={{
        backgroundColor: `${categoryColor}10`,
        borderLeft: `4px solid ${categoryColor}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {event.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {!event.isAllDay && (
              <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(event.startDate)}
              </span>
            )}
            {event.isAllDay && (
              <span className="text-xs text-gray-500 dark:text-gray-400">All day</span>
            )}
            {event.isVirtual && (
              <Video className="w-3 h-3 text-blue-500" />
            )}
            {event.isRecurring && (
              <Repeat className="w-3 h-3 text-purple-500" />
            )}
          </div>
        </div>
        {event.xpReward > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-ghana-gold">
            <Star className="w-3 h-3" />
            {event.xpReward}
          </span>
        )}
      </div>
    </motion.button>
  );
}
