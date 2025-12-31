/**
 * Calendar Grid Component
 * Main calendar view with Month, Week, Day, and Agenda views
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palmtree, Calendar as CalendarIcon } from 'lucide-react';
import { useCalendarStore } from '@/stores/calendarStore';
import EventCard from './EventCard';
import type { CalendarEvent, GhanaHoliday } from '@/types/calendar';

interface CalendarGridProps {
  onEventClick?: (event: CalendarEvent) => void;
  onHolidayClick?: (holiday: GhanaHoliday) => void;
  onDateClick?: (date: Date) => void;
  onCreateEvent?: (date?: Date) => void;
}

export default function CalendarGrid({
  onEventClick,
  onHolidayClick,
  onDateClick,
  onCreateEvent,
}: CalendarGridProps) {
  const {
    events,
    holidays,
    selectedDate,
    currentView,
    visibleRange,
    showHolidays,
    setSelectedDate,
    fetchEvents,
  } = useCalendarStore();

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.startDate.split('T')[0] === dateStr);
  };

  // Get holiday for a specific date
  const getHolidayForDate = (date: Date): GhanaHoliday | undefined => {
    if (!showHolidays) return undefined;
    const dateStr = date.toISOString().split('T')[0];
    return holidays.find(h => h.date === dateStr);
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelectedDate = (date: Date): boolean => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  // Month View
  const MonthView = () => {
    const monthDays = useMemo(() => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      let startDay = firstDay.getDay();
      startDay = startDay === 0 ? 6 : startDay - 1; // Adjust for Monday start

      const days: { date: Date; isCurrentMonth: boolean }[] = [];

      // Previous month
      const prevMonth = new Date(year, month, 0);
      for (let i = startDay - 1; i >= 0; i--) {
        days.push({
          date: new Date(year, month - 1, prevMonth.getDate() - i),
          isCurrentMonth: false,
        });
      }

      // Current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push({
          date: new Date(year, month, i),
          isCurrentMonth: true,
        });
      }

      // Next month (fill to 42)
      const remaining = 42 - days.length;
      for (let i = 1; i <= remaining; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }

      return days;
    }, [selectedDate]);

    return (
      <div className="flex-1 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {monthDays.map((day, index) => {
            const dayEvents = getEventsForDate(day.date);
            const holiday = getHolidayForDate(day.date);

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] border-b border-r border-gray-200 dark:border-gray-700 p-1
                  ${!day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800'}
                  ${isToday(day.date) ? 'bg-ghana-gold/5' : ''}
                  hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer
                `}
                onClick={() => handleDateClick(day.date)}
                onDoubleClick={() => onCreateEvent?.(day.date)}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                      ${isToday(day.date)
                        ? 'bg-ghana-green text-white'
                        : isSelectedDate(day.date)
                          ? 'bg-ghana-gold text-white'
                          : !day.isCurrentMonth
                            ? 'text-gray-400 dark:text-gray-600'
                            : 'text-gray-900 dark:text-gray-100'
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </span>
                  {holiday && (
                    <Palmtree className="w-4 h-4 text-emerald-500" />
                  )}
                </div>

                {/* Holiday Badge */}
                {holiday && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onHolidayClick?.(holiday);
                    }}
                    className="w-full text-left px-1.5 py-0.5 mb-1 rounded text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 truncate hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                    title={holiday.name}
                  >
                    {holiday.name}
                  </button>
                )}

                {/* Events */}
                <div className="space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="compact"
                      onClick={() => {
                        onEventClick?.(event);
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateClick(day.date);
                      }}
                      className="w-full text-center text-xs text-gray-500 dark:text-gray-400 hover:text-ghana-green dark:hover:text-ghana-gold transition-colors"
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Week View
  const WeekView = () => {
    const weekDays = useMemo(() => {
      const days: Date[] = [];
      const start = new Date(visibleRange.start);

      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        days.push(date);
      }

      return days;
    }, [visibleRange]);

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex-1 overflow-auto">
        {/* Header with days */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-8">
            <div className="w-16 border-r border-gray-200 dark:border-gray-700" />
            {weekDays.map((day, index) => {
              const holiday = getHolidayForDate(day);
              return (
                <div
                  key={index}
                  className={`
                    text-center py-2 border-r border-gray-200 dark:border-gray-700
                    ${isToday(day) ? 'bg-ghana-gold/10' : ''}
                  `}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </div>
                  <div
                    className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
                      ${isToday(day) ? 'bg-ghana-green text-white' : 'text-gray-900 dark:text-white'}
                    `}
                  >
                    {day.getDate()}
                  </div>
                  {holiday && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 truncate px-1">
                      {holiday.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-8">
          {/* Time labels */}
          <div className="w-16">
            {hours.map(hour => (
              <div
                key={hour}
                className="h-12 border-b border-r border-gray-200 dark:border-gray-700 px-2 py-1 text-right text-xs text-gray-500 dark:text-gray-400"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const dayEvents = getEventsForDate(day);

            return (
              <div key={dayIndex} className="relative">
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="h-12 border-b border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                    onClick={() => {
                      const clickedDate = new Date(day);
                      clickedDate.setHours(hour, 0, 0, 0);
                      onCreateEvent?.(clickedDate);
                    }}
                  />
                ))}

                {/* Events overlay */}
                {dayEvents.map(event => {
                  const startHour = new Date(event.startDate).getHours();
                  const startMinute = new Date(event.startDate).getMinutes();
                  const endHour = new Date(event.endDate).getHours();
                  const endMinute = new Date(event.endDate).getMinutes();

                  const top = event.isAllDay ? 0 : (startHour + startMinute / 60) * 48;
                  const height = event.isAllDay
                    ? 24
                    : Math.max(24, ((endHour - startHour) + (endMinute - startMinute) / 60) * 48);

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute left-1 right-1 z-10"
                      style={{
                        top: event.isAllDay ? 0 : `${top}px`,
                        height: `${height}px`,
                      }}
                    >
                      <EventCard
                        event={event}
                        variant="compact"
                        onClick={() => onEventClick?.(event)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Day View
  const DayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(selectedDate);
    const holiday = getHolidayForDate(selectedDate);

    return (
      <div className="flex-1 overflow-auto">
        {/* Day header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <div
              className={`
                w-16 h-16 rounded-xl flex flex-col items-center justify-center
                ${isToday(selectedDate) ? 'bg-ghana-green text-white' : 'bg-gray-100 dark:bg-gray-700'}
              `}
            >
              <span className="text-xs uppercase">
                {selectedDate.toLocaleDateString('en-GB', { weekday: 'short' })}
              </span>
              <span className="text-2xl font-bold">{selectedDate.getDate()}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              {holiday && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Palmtree className="w-4 h-4" />
                  <span className="text-sm font-medium">{holiday.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[auto_1fr]">
          {hours.map(hour => (
            <div key={hour} className="contents">
              <div className="w-20 h-14 border-b border-r border-gray-200 dark:border-gray-700 px-3 py-2 text-right text-sm text-gray-500 dark:text-gray-400">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div
                className="relative h-14 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                onClick={() => {
                  const clickedDate = new Date(selectedDate);
                  clickedDate.setHours(hour, 0, 0, 0);
                  onCreateEvent?.(clickedDate);
                }}
              />
            </div>
          ))}

          {/* Events overlay */}
          <div className="col-start-2 row-start-1 row-span-24 relative">
            {dayEvents.map(event => {
              if (event.isAllDay) return null;

              const startHour = new Date(event.startDate).getHours();
              const startMinute = new Date(event.startDate).getMinutes();
              const endHour = new Date(event.endDate).getHours();
              const endMinute = new Date(event.endDate).getMinutes();

              const top = (startHour + startMinute / 60) * 56;
              const height = Math.max(28, ((endHour - startHour) + (endMinute - startMinute) / 60) * 56);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute left-2 right-4 z-10"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                  }}
                >
                  <EventCard
                    event={event}
                    variant="default"
                    onClick={() => onEventClick?.(event)}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* All day events */}
        {dayEvents.filter(e => e.isAllDay).length > 0 && (
          <div className="absolute top-24 left-24 right-4 z-20">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">All Day</div>
              <div className="space-y-1">
                {dayEvents.filter(e => e.isAllDay).map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="compact"
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Agenda View
  const AgendaView = () => {
    const sortedEvents = useMemo(() => {
      return [...events]
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [events]);

    // Group events by date
    const groupedEvents = useMemo(() => {
      const groups: Map<string, CalendarEvent[]> = new Map();

      sortedEvents.forEach(event => {
        const dateKey = event.startDate.split('T')[0];
        if (!groups.has(dateKey)) {
          groups.set(dateKey, []);
        }
        groups.get(dateKey)!.push(event);
      });

      return groups;
    }, [sortedEvents]);

    if (sortedEvents.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <CalendarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Upcoming Events
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You don't have any events scheduled for this period.
            </p>
            {onCreateEvent && (
              <button
                onClick={() => onCreateEvent()}
                className="px-4 py-2 bg-ghana-green text-white rounded-lg hover:bg-ghana-green/90 transition-colors"
              >
                Create Event
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence>
          {Array.from(groupedEvents.entries()).map(([dateKey, dateEvents]) => {
            const date = new Date(dateKey);
            const holiday = getHolidayForDate(date);

            return (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 z-10">
                  <div
                    className={`
                      w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0
                      ${isToday(date)
                        ? 'bg-ghana-green text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }
                    `}
                  >
                    <span className="text-xs uppercase">
                      {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-bold">{date.getDate()}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {date.toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </h3>
                    {holiday && (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Palmtree className="w-3 h-3" />
                        {holiday.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Events */}
                <div className="space-y-3 ml-15">
                  {dateEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="expanded"
                      onClick={() => onEventClick?.(event)}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
      {currentView === 'month' && <MonthView />}
      {currentView === 'week' && <WeekView />}
      {currentView === 'day' && <DayView />}
      {currentView === 'agenda' && <AgendaView />}
    </div>
  );
}
