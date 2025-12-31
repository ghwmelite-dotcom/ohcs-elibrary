/**
 * Calendar Sidebar Component
 * Mini calendar, upcoming events, and category filters
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Palmtree } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalendarStore } from '@/stores/calendarStore';
import type { CalendarEvent, GhanaHoliday } from '@/types/calendar';
import { CATEGORY_COLORS } from '@/types/calendar';

interface CalendarSidebarProps {
  onEventClick?: (event: CalendarEvent) => void;
  onHolidayClick?: (holiday: GhanaHoliday) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function CalendarSidebar({
  onEventClick,
  onHolidayClick,
  isCollapsed = false,
}: CalendarSidebarProps) {
  const {
    selectedDate,
    setSelectedDate,
    events,
    holidays,
    categories,
    selectedCategories,
    toggleCategory,
    showHolidays,
    setShowHolidays,
    showLmsEvents,
    setShowLmsEvents,
    showGroupEvents,
    setShowGroupEvents,
    fetchEvents,
  } = useCalendarStore();

  const [miniCalMonth, setMiniCalMonth] = useState(new Date(selectedDate));

  // Get days for mini calendar
  const calendarDays = useMemo(() => {
    const year = miniCalMonth.getFullYear();
    const month = miniCalMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Start from Monday (1) - adjust if first day is Sunday (0)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days: { date: Date; isCurrentMonth: boolean; hasEvents: boolean; isHoliday: boolean }[] = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        hasEvents: hasEventsOnDate(date),
        isHoliday: isHolidayDate(date),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        hasEvents: hasEventsOnDate(date),
        isHoliday: isHolidayDate(date),
      });
    }

    // Next month days (fill to 42 for 6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        hasEvents: hasEventsOnDate(date),
        isHoliday: isHolidayDate(date),
      });
    }

    return days;
  }, [miniCalMonth, events, holidays]);

  // Helper to check if date has events
  function hasEventsOnDate(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return events.some(e => e.startDate.split('T')[0] === dateStr);
  }

  // Helper to check if date is a holiday
  function isHolidayDate(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some(h => h.date === dateStr);
  }

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekLater = new Date(now);
    weekLater.setDate(weekLater.getDate() + 7);

    return events
      .filter(e => {
        const eventDate = new Date(e.startDate);
        return eventDate >= now && eventDate <= weekLater;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
  }, [events]);

  // Get upcoming holidays
  const upcomingHolidays = useMemo(() => {
    const now = new Date();
    const monthLater = new Date(now);
    monthLater.setMonth(monthLater.getMonth() + 1);

    return holidays
      .filter(h => {
        const holidayDate = new Date(h.date);
        return holidayDate >= now && holidayDate <= monthLater;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [holidays]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    fetchEvents();
  };

  const isSelectedDate = (date: Date): boolean => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="w-72 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
      {/* Mini Calendar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setMiniCalMonth(new Date(miniCalMonth.getFullYear(), miniCalMonth.getMonth() - 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {miniCalMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setMiniCalMonth(new Date(miniCalMonth.getFullYear(), miniCalMonth.getMonth() + 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day.date)}
              className={`
                relative p-1.5 text-xs rounded-md transition-all
                ${!day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}
                ${isSelectedDate(day.date) ? 'bg-ghana-green text-white' : ''}
                ${isToday(day.date) && !isSelectedDate(day.date) ? 'bg-ghana-gold/20 text-ghana-gold font-bold' : ''}
                ${day.isHoliday && !isSelectedDate(day.date) ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}
                ${!isSelectedDate(day.date) && !isToday(day.date) && !day.isHoliday ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
              `}
            >
              {day.date.getDate()}
              {day.hasEvents && !isSelectedDate(day.date) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-ghana-green rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Upcoming Events</h3>

        <AnimatePresence>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.map(event => (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => onEventClick?.(event)}
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[event.eventType] || CATEGORY_COLORS.general }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-ghana-green dark:group-hover:text-ghana-gold transition-colors">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(event.startDate).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events</p>
          )}
        </AnimatePresence>
      </div>

      {/* Upcoming Holidays */}
      {showHolidays && upcomingHolidays.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Palmtree className="w-4 h-4 text-emerald-500" />
            Upcoming Holidays
          </h3>
          <div className="space-y-2">
            {upcomingHolidays.map(holiday => (
              <button
                key={holiday.id}
                onClick={() => onHolidayClick?.(holiday)}
                className="w-full text-left p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {holiday.name}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {new Date(holiday.date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map(category => (
            <label
              key={category.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedCategories.length === 0 || selectedCategories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="sr-only"
              />
              <div
                className={`
                  w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                  ${selectedCategories.length === 0 || selectedCategories.includes(category.id)
                    ? 'border-transparent'
                    : 'border-gray-300 dark:border-gray-600'
                  }
                `}
                style={{
                  backgroundColor:
                    selectedCategories.length === 0 || selectedCategories.includes(category.id)
                      ? category.color
                      : 'transparent',
                }}
              >
                {(selectedCategories.length === 0 || selectedCategories.includes(category.id)) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Display Options</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showHolidays}
              onChange={(e) => setShowHolidays(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-ghana-green focus:ring-ghana-green"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Ghana Holidays</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLmsEvents}
              onChange={(e) => setShowLmsEvents(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-ghana-green focus:ring-ghana-green"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show LMS Deadlines</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showGroupEvents}
              onChange={(e) => setShowGroupEvents(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-ghana-green focus:ring-ghana-green"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Group Events</span>
          </label>
        </div>
      </div>
    </div>
  );
}
