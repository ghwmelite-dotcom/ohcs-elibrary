/**
 * Calendar Sidebar Component
 * Responsive sidebar with mini calendar, upcoming events, and categories
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Palmtree,
  Calendar,
  MapPin,
  Clock,
  Users,
  X,
  Sparkles,
} from 'lucide-react';
import { useCalendarStore } from '@/stores/calendarStore';
import type { CalendarEvent, GhanaHoliday } from '@/types/calendar';

interface CalendarSidebarProps {
  onEventClick?: (event: CalendarEvent) => void;
  onHolidayClick?: (holiday: GhanaHoliday) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function CalendarSidebar({
  onEventClick,
  onHolidayClick,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  onClose,
}: CalendarSidebarProps) {
  const {
    events,
    holidays,
    categories,
    selectedDate,
    showHolidays,
    setSelectedDate,
    toggleCategory,
    selectedCategories,
  } = useCalendarStore();

  // Mini calendar state
  const miniCalendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonth.getDate() - i), isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [selectedDate]);

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekLater = new Date(now);
    weekLater.setDate(weekLater.getDate() + 7);

    return events
      .filter((e) => {
        const eventDate = new Date(e.startDate);
        return eventDate >= now && eventDate <= weekLater;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
  }, [events]);

  // Upcoming holidays
  const upcomingHolidays = useMemo(() => {
    if (!showHolidays) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return holidays
      .filter((h) => new Date(h.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [holidays, showHolidays]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  const hasEvents = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.some((e) => e.startDate.split('T')[0] === dateStr);
  };

  const isHoliday = (date: Date) => {
    if (!showHolidays) return false;
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some((h) => h.date === dateStr);
  };

  const navigateMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  const formatEventTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  if (isCollapsed && !isMobile) {
    return (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 64, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleCollapse}
          className="w-12 h-12 rounded-xl bg-ghana-green hover:bg-ghana-green/90 text-white shadow-lg shadow-ghana-green/30 flex items-center justify-center transition-all"
          title="Expand sidebar (Ctrl+.)"
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>

        {/* Mini indicators */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-ghana-green/10 flex items-center justify-center" title={`${events.length} events`}>
            <Calendar className="w-5 h-5 text-ghana-green" />
          </div>
          {showHolidays && (
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center" title={`${holidays.length} holidays`}>
              <Palmtree className="w-5 h-5 text-emerald-600" />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`${isMobile ? 'w-full' : 'w-72 lg:w-80'} h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col relative`}>
      {/* Collapse Toggle Button - Desktop only */}
      {!isMobile && onToggleCollapse && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleCollapse}
          className="absolute top-4 right-3 z-20 flex items-center justify-center w-10 h-10 rounded-xl bg-ghana-green hover:bg-ghana-green/90 text-white shadow-lg shadow-ghana-green/30 transition-all"
          title="Collapse sidebar (Ctrl+.)"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-ghana-green" />
            <span className="font-semibold text-gray-900 dark:text-white">Calendar</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Mini Calendar */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigateMonth(-1)} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {selectedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => navigateMonth(1)} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {miniCalendarDays.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDate(day.date)}
                className={`
                  relative aspect-square flex items-center justify-center text-xs rounded-lg transition-all
                  ${!day.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                  ${isToday(day.date) ? 'bg-ghana-green text-white font-semibold' : ''}
                  ${isSelected(day.date) && !isToday(day.date) ? 'bg-ghana-gold/20 text-ghana-gold ring-1 ring-ghana-gold/50' : ''}
                  ${day.isCurrentMonth && !isToday(day.date) && !isSelected(day.date) ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300' : ''}
                `}
              >
                {day.date.getDate()}
                {/* Event/Holiday Indicator */}
                {(hasEvents(day.date) || isHoliday(day.date)) && (
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isHoliday(day.date) ? 'bg-emerald-500' : 'bg-ghana-green'}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-ghana-gold" />
            Upcoming Events
          </h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No upcoming events</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <motion.button
                  key={event.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onEventClick?.(event)}
                  className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.category?.color || '#006B3F' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-ghana-green dark:group-hover:text-ghana-gold transition-colors">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{formatEventTime(event.startDate)}</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span>{new Date(event.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Holidays */}
        {showHolidays && upcomingHolidays.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5">
              <Palmtree className="w-3.5 h-3.5 text-emerald-500" />
              Ghana Holidays
            </h3>
            <div className="space-y-2">
              {upcomingHolidays.map((holiday) => (
                <motion.button
                  key={holiday.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onHolidayClick?.(holiday)}
                  className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                      <Palmtree className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 truncate">{holiday.name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {new Date(holiday.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">
            Categories
          </h3>
          <div className="space-y-1.5">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
                  selectedCategories.length === 0 || selectedCategories.includes(category.id)
                    ? 'bg-gray-50 dark:bg-gray-900/50'
                    : 'opacity-50'
                } hover:bg-gray-100 dark:hover:bg-gray-700/50`}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{category.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {events.filter((e) => e.category?.id === category.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
