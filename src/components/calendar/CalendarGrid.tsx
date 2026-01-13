/**
 * Calendar Grid Component
 * Stunning, responsive calendar view with Month, Week, Day, and Agenda views
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palmtree, Calendar as CalendarIcon, Plus, ChevronRight } from 'lucide-react';
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
  } = useCalendarStore();

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.startDate.split('T')[0] === dateStr);
  };

  const getHolidayForDate = (date: Date): GhanaHoliday | undefined => {
    if (!showHolidays) return undefined;
    const dateStr = date.toISOString().split('T')[0];
    return holidays.find(h => h.date === dateStr);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (date: Date): boolean => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  // Month View - Responsive
  const MonthView = () => {
    const monthDays = useMemo(() => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      let startDay = firstDay.getDay();
      startDay = startDay === 0 ? 6 : startDay - 1;

      const days: { date: Date; isCurrentMonth: boolean }[] = [];

      const prevMonth = new Date(year, month, 0);
      for (let i = startDay - 1; i >= 0; i--) {
        days.push({
          date: new Date(year, month - 1, prevMonth.getDate() - i),
          isCurrentMonth: false,
        });
      }

      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push({
          date: new Date(year, month, i),
          isCurrentMonth: true,
        });
      }

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
      <div className="flex flex-col h-full bg-white dark:bg-surface-800">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-200 dark:border-surface-700">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div
              key={day}
              className={`py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                i >= 5 ? 'text-surface-400 dark:text-surface-500' : 'text-surface-600 dark:text-surface-400'
              }`}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
          {monthDays.map((day, index) => {
            const dayEvents = getEventsForDate(day.date);
            const holiday = getHolidayForDate(day.date);
            const hasEvents = dayEvents.length > 0 || holiday;
            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

            return (
              <motion.div
                key={index}
                initial={false}
                whileHover={{ backgroundColor: 'rgba(0, 107, 63, 0.03)' }}
                className={`
                  relative min-h-[60px] sm:min-h-[80px] md:min-h-[100px] lg:min-h-[110px]
                  border-b border-r border-surface-100 dark:border-surface-700/50
                  ${!day.isCurrentMonth ? 'bg-surface-50/50 dark:bg-surface-900/30' : ''}
                  ${isWeekend && day.isCurrentMonth ? 'bg-surface-50/30 dark:bg-surface-900/20' : ''}
                  ${isToday(day.date) ? 'bg-ghana-green/5 dark:bg-ghana-green/10' : ''}
                  cursor-pointer transition-colors group
                `}
                onClick={() => handleDateClick(day.date)}
                onDoubleClick={() => onCreateEvent?.(day.date)}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between p-1 sm:p-1.5">
                  <span
                    className={`
                      w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-all
                      ${isToday(day.date)
                        ? 'bg-ghana-green text-white shadow-sm shadow-ghana-green/30'
                        : isSelectedDate(day.date)
                          ? 'bg-ghana-gold/20 text-ghana-gold ring-1 ring-ghana-gold/30'
                          : !day.isCurrentMonth
                            ? 'text-surface-300 dark:text-surface-600'
                            : 'text-surface-700 dark:text-surface-300 group-hover:bg-surface-100 dark:group-hover:bg-surface-700'
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Holiday Icon */}
                  {holiday && (
                    <Palmtree className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>

                {/* Holiday Badge - Mobile optimized */}
                {holiday && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onHolidayClick?.(holiday);
                    }}
                    className="mx-1 mb-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 truncate block w-[calc(100%-8px)] text-left hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
                    title={holiday.name}
                  >
                    <span className="hidden sm:inline">{holiday.name}</span>
                    <span className="sm:hidden">🎉</span>
                  </button>
                )}

                {/* Events - Compact on mobile */}
                <div className="px-1 space-y-0.5 overflow-hidden">
                  {/* Mobile: Show dots for events */}
                  <div className="sm:hidden flex flex-wrap gap-0.5 justify-center">
                    {dayEvents.slice(0, 4).map((event) => (
                      <div
                        key={event.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: event.category?.color || '#006B3F' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[8px] text-surface-400 dark:text-surface-500">+{dayEvents.length - 4}</span>
                    )}
                  </div>

                  {/* Desktop: Show event cards */}
                  <div className="hidden sm:block space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        variant="compact"
                        onClick={() => onEventClick?.(event)}
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDateClick(day.date);
                        }}
                        className="w-full text-center text-[10px] text-surface-500 dark:text-surface-400 hover:text-ghana-green dark:hover:text-ghana-gold py-0.5 transition-colors"
                      >
                        +{dayEvents.length - 2} more
                      </button>
                    )}
                  </div>
                </div>

                {/* Hover: Add event button */}
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateEvent?.(day.date);
                    }}
                    className="p-1 rounded-md bg-ghana-green/10 hover:bg-ghana-green/20 text-ghana-green transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  // Week View - Responsive
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
      <div className="flex flex-col h-full bg-white dark:bg-surface-800 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
          <div className="grid grid-cols-8">
            <div className="w-12 sm:w-16 border-r border-surface-200 dark:border-surface-700" />
            {weekDays.map((day, i) => {
              const holiday = getHolidayForDate(day);
              const dayEvents = getEventsForDate(day);
              return (
                <div
                  key={i}
                  className={`text-center py-2 sm:py-3 border-r border-surface-200 dark:border-surface-700 ${
                    isToday(day) ? 'bg-ghana-green/5 dark:bg-ghana-green/10' : ''
                  }`}
                >
                  <div className="text-[10px] sm:text-xs text-surface-500 dark:text-surface-400 uppercase">
                    {day.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 3)}
                  </div>
                  <div
                    className={`
                      inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm font-semibold mt-0.5
                      ${isToday(day) ? 'bg-ghana-green text-white' : 'text-surface-900 dark:text-white'}
                    `}
                  >
                    {day.getDate()}
                  </div>
                  {holiday && (
                    <div className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 truncate px-1 mt-0.5">
                      {holiday.name}
                    </div>
                  )}
                  {dayEvents.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div key={e.id} className="w-1 h-1 rounded-full" style={{ backgroundColor: e.category?.color || '#006B3F' }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 min-h-full">
            {/* Time Labels */}
            <div className="w-12 sm:w-16">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-10 sm:h-12 border-b border-r border-surface-100 dark:border-surface-700/50 pr-1 sm:pr-2 py-0.5 text-right text-[10px] sm:text-xs text-surface-400 dark:text-surface-500"
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getEventsForDate(day);
              return (
                <div key={dayIndex} className="relative">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className={`h-10 sm:h-12 border-b border-r border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 cursor-pointer ${
                        isToday(day) ? 'bg-ghana-green/[0.02]' : ''
                      }`}
                      onClick={() => {
                        const clickedDate = new Date(day);
                        clickedDate.setHours(hour, 0, 0, 0);
                        onCreateEvent?.(clickedDate);
                      }}
                    />
                  ))}
                  {/* Events Overlay */}
                  {dayEvents.map((event) => {
                    const startHour = new Date(event.startDate).getHours();
                    const startMinute = new Date(event.startDate).getMinutes();
                    const endHour = new Date(event.endDate).getHours();
                    const endMinute = new Date(event.endDate).getMinutes();
                    const top = event.isAllDay ? 0 : (startHour + startMinute / 60) * 40;
                    const height = event.isAllDay ? 24 : Math.max(20, ((endHour - startHour) + (endMinute - startMinute) / 60) * 40);

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute left-0.5 right-0.5 z-10"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <EventCard event={event} variant="compact" onClick={() => onEventClick?.(event)} />
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Day View - Responsive
  const DayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(selectedDate);
    const holiday = getHolidayForDate(selectedDate);

    return (
      <div className="flex flex-col h-full bg-white dark:bg-surface-800 overflow-hidden">
        {/* Day Header */}
        <div className="flex-shrink-0 border-b border-surface-200 dark:border-surface-700 p-3 sm:p-4 bg-surface-50 dark:bg-surface-900/50">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                isToday(selectedDate) ? 'bg-ghana-green text-white' : 'bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-white'
              }`}
            >
              <span className="text-[10px] sm:text-xs uppercase font-medium">
                {selectedDate.toLocaleDateString('en-GB', { weekday: 'short' })}
              </span>
              <span className="text-xl sm:text-2xl font-bold leading-none">{selectedDate.getDate()}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-white truncate">
                {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {holiday && (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Palmtree className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium truncate">{holiday.name}</span>
                </div>
              )}
              {dayEvents.length > 0 && (
                <p className="text-xs text-surface-500 dark:text-surface-400">{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </div>

        {/* Time Grid */}
        <div className="flex-1 overflow-auto">
          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="flex">
                <div className="w-14 sm:w-20 flex-shrink-0 h-12 sm:h-14 border-b border-r border-surface-100 dark:border-surface-700/50 pr-2 py-1 text-right text-xs text-surface-400 dark:text-surface-500">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div
                  className="flex-1 h-12 sm:h-14 border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 cursor-pointer"
                  onClick={() => {
                    const clickedDate = new Date(selectedDate);
                    clickedDate.setHours(hour, 0, 0, 0);
                    onCreateEvent?.(clickedDate);
                  }}
                />
              </div>
            ))}

            {/* Events Overlay */}
            <div className="absolute top-0 left-14 sm:left-20 right-0">
              {dayEvents.filter(e => !e.isAllDay).map((event) => {
                const startHour = new Date(event.startDate).getHours();
                const startMinute = new Date(event.startDate).getMinutes();
                const endHour = new Date(event.endDate).getHours();
                const endMinute = new Date(event.endDate).getMinutes();
                const top = (startHour + startMinute / 60) * 48;
                const height = Math.max(24, ((endHour - startHour) + (endMinute - startMinute) / 60) * 48);

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-1 right-2 z-10"
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <EventCard event={event} variant="default" onClick={() => onEventClick?.(event)} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* All Day Events */}
        {dayEvents.filter(e => e.isAllDay).length > 0 && (
          <div className="flex-shrink-0 border-t border-surface-200 dark:border-surface-700 p-3 bg-surface-50 dark:bg-surface-900/50">
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">All Day</p>
            <div className="space-y-1">
              {dayEvents.filter(e => e.isAllDay).map((event) => (
                <EventCard key={event.id} event={event} variant="compact" onClick={() => onEventClick?.(event)} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Agenda View - Responsive
  const AgendaView = () => {
    const sortedEvents = useMemo(() => {
      return [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [events]);

    const groupedEvents = useMemo(() => {
      const groups: Map<string, CalendarEvent[]> = new Map();
      sortedEvents.forEach((event) => {
        const dateKey = event.startDate.split('T')[0];
        if (!groups.has(dateKey)) groups.set(dateKey, []);
        groups.get(dateKey)!.push(event);
      });
      return groups;
    }, [sortedEvents]);

    if (sortedEvents.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-white dark:bg-surface-800">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-surface-400 dark:text-surface-500" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">No Upcoming Events</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">You don't have any events scheduled for this period.</p>
            {onCreateEvent && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCreateEvent()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-ghana-green hover:bg-ghana-green/90 text-white rounded-xl font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </motion.button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-auto bg-surface-50 dark:bg-surface-900">
        <div className="max-w-3xl mx-auto p-3 sm:p-4 lg:p-6">
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
                  className="mb-4 sm:mb-6"
                >
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-2 sm:mb-3 sticky top-0 bg-surface-50 dark:bg-surface-900 py-2 z-10">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                        isToday(date) ? 'bg-ghana-green text-white' : 'bg-white dark:bg-surface-800 shadow-sm'
                      }`}
                    >
                      <span className="text-[9px] sm:text-[10px] uppercase font-medium opacity-80">
                        {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                      </span>
                      <span className="text-base sm:text-lg font-bold leading-none">{date.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-surface-900 dark:text-white truncate">
                        {isToday(date) ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                      {holiday && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Palmtree className="w-3 h-3" />
                          {holiday.name}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-surface-400 dark:text-surface-500 ml-auto flex-shrink-0" />
                  </div>

                  {/* Events */}
                  <div className="space-y-2 sm:space-y-3 ml-0 sm:ml-[60px]">
                    {dateEvents.map((event) => (
                      <EventCard key={event.id} event={event} variant="expanded" onClick={() => onEventClick?.(event)} />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {currentView === 'month' && <MonthView />}
      {currentView === 'week' && <WeekView />}
      {currentView === 'day' && <DayView />}
      {currentView === 'agenda' && <AgendaView />}
    </div>
  );
}
