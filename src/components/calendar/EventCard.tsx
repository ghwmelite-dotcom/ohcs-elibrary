/**
 * Event Card Component
 * Sleek, responsive event display for calendar grid cells
 */

import { Clock, MapPin, Video, Users, Repeat, Star, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CalendarEvent } from '@/types/calendar';
import { CATEGORY_COLORS } from '@/types/calendar';

interface EventCardProps {
  event: CalendarEvent;
  variant?: 'dot' | 'compact' | 'default' | 'expanded';
  onClick?: () => void;
}

export default function EventCard({ event, variant = 'default', onClick }: EventCardProps) {
  const categoryColor = CATEGORY_COLORS[event.eventType] || CATEGORY_COLORS.general;

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Dot variant - minimal indicator for mobile calendar cells
  if (variant === 'dot') {
    return (
      <button
        onClick={onClick}
        className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-transform hover:scale-125 active:scale-110"
        style={{ backgroundColor: categoryColor }}
        title={event.title}
      />
    );
  }

  // Compact variant - for tight spaces and mobile
  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="w-full text-left px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs truncate transition-all hover:ring-1 hover:ring-offset-1 active:opacity-80"
        style={{
          backgroundColor: `${categoryColor}15`,
          color: categoryColor,
          borderLeft: `2px solid ${categoryColor}`,
        }}
        title={event.title}
      >
        <span className="font-medium">{event.title}</span>
      </motion.button>
    );
  }

  // Expanded variant - full details for agenda/list views
  if (variant === 'expanded') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 dark:border-gray-700 overflow-hidden group"
      >
        {/* Gradient top border */}
        <div
          className="h-1 sm:h-1.5"
          style={{
            background: `linear-gradient(90deg, ${categoryColor}, ${categoryColor}88)`,
          }}
        />

        <div className="p-3 sm:p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* Category badge */}
                <span
                  className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
                  style={{
                    backgroundColor: `${categoryColor}15`,
                    color: categoryColor,
                  }}
                >
                  {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                </span>
                {event.isRecurring && (
                  <Repeat className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500" />
                )}
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate group-hover:text-ghana-green dark:group-hover:text-ghana-gold transition-colors">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>

            {/* XP Badge */}
            {event.xpReward > 0 && (
              <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-ghana-gold/20 to-yellow-100/50 dark:from-ghana-gold/30 dark:to-yellow-900/20 rounded-full">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-ghana-gold" />
                <span className="text-[10px] sm:text-xs font-bold text-ghana-gold">{event.xpReward}</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {/* Time */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="p-1 sm:p-1.5 rounded-md bg-gray-100 dark:bg-gray-700">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="font-medium">
                {event.isAllDay
                  ? 'All day'
                  : `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`}
              </span>
            </div>

            {/* Location */}
            {(event.location || event.isVirtual) && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="p-1 sm:p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30">
                  {event.isVirtual ? (
                    <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
                  ) : (
                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
                  )}
                </div>
                <span className="truncate max-w-[100px] sm:max-w-[150px]">
                  {event.isVirtual ? 'Virtual' : event.location}
                </span>
              </div>
            )}

            {/* Capacity */}
            {event.registrationRequired && event.capacity && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="p-1 sm:p-1.5 rounded-md bg-purple-50 dark:bg-purple-900/30">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500" />
                </div>
                <span>
                  <span className="font-medium">{event.attendeeCount}</span>/{event.capacity}
                </span>
              </div>
            )}
          </div>

          {/* Registration Status & Action */}
          <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
            {event.isRegistered ? (
              <span
                className={`
                  px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium
                  ${event.myRsvpStatus === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                  ${event.myRsvpStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                  ${event.myRsvpStatus === 'waitlisted' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                  ${event.myRsvpStatus === 'tentative' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}
                `}
              >
                {event.myRsvpStatus === 'accepted' && 'Registered'}
                {event.myRsvpStatus === 'pending' && 'Pending'}
                {event.myRsvpStatus === 'waitlisted' && 'Waitlist'}
                {event.myRsvpStatus === 'tentative' && 'Tentative'}
              </span>
            ) : (
              <span className="text-[10px] sm:text-xs text-gray-400">
                {event.registrationRequired ? 'Registration required' : 'Open event'}
              </span>
            )}
            <motion.span
              className="flex items-center gap-1 text-xs sm:text-sm font-medium text-ghana-green dark:text-ghana-gold group-hover:gap-2 transition-all"
            >
              View <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant - balanced for calendar cells
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${categoryColor}08, ${categoryColor}15)`,
        borderLeft: `3px solid ${categoryColor}`,
      }}
    >
      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="font-medium text-[11px] sm:text-xs lg:text-sm text-gray-900 dark:text-white truncate group-hover:text-ghana-green dark:group-hover:text-ghana-gold transition-colors">
            {event.title}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
            {!event.isAllDay && (
              <span className="text-[9px] sm:text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5 sm:gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {formatTime(event.startDate)}
              </span>
            )}
            {event.isAllDay && (
              <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">All day</span>
            )}

            {/* Icons */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {event.isVirtual && (
                <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
              )}
              {event.isRecurring && (
                <Repeat className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-500" />
              )}
            </div>
          </div>
        </div>

        {/* XP indicator */}
        {event.xpReward > 0 && (
          <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] text-ghana-gold flex-shrink-0">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            <span className="font-bold hidden sm:inline">{event.xpReward}</span>
          </span>
        )}
      </div>
    </motion.button>
  );
}
