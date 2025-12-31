/**
 * Calendar Page
 * Main calendar view with events, holidays, and scheduling
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Settings,
  Download,
  RefreshCw,
  Check,
  X,
  Moon,
  Sun,
  Bell,
  Eye,
  EyeOff,
  Clock,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { useCalendarStore } from '@/stores/calendarStore';
import { useThemeStore } from '@/stores/themeStore';
import {
  CalendarHeader,
  CalendarSidebar,
  CalendarGrid,
  EventModal,
  EventForm,
} from '@/components/calendar';
import type { CalendarEvent, GhanaHoliday } from '@/types/calendar';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  const {
    events,
    holidays,
    categories,
    selectedDate,
    currentView,
    visibleRange,
    isLoading,
    error,
    showHolidays,
    fetchEvents,
    fetchHolidays,
    fetchCategories,
    fetchSettings,
    clearError,
    toggleHolidays,
  } = useCalendarStore();

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [defaultEventDate, setDefaultEventDate] = useState<Date | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Action button states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchHolidays(new Date().getFullYear());
    fetchSettings();
  }, [fetchCategories, fetchHolidays, fetchSettings]);

  // Fetch events when visible range changes
  useEffect(() => {
    const startDate = visibleRange.start.toISOString().split('T')[0];
    const endDate = visibleRange.end.toISOString().split('T')[0];
    fetchEvents(startDate, endDate);
  }, [visibleRange, fetchEvents]);

  // Event handlers
  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  const handleHolidayClick = useCallback((holiday: GhanaHoliday) => {
    // Could show a toast or modal with holiday info
    console.log('Holiday clicked:', holiday);
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    // View day events
    console.log('Date clicked:', date);
  }, []);

  const handleCreateEvent = useCallback((date?: Date) => {
    setSelectedEvent(null);
    setDefaultEventDate(date);
    setShowEventForm(true);
  }, []);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(false);
    setShowEventForm(true);
  }, []);

  const handleDeleteEvent = useCallback(async (event: CalendarEvent) => {
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      const { deleteEvent } = useCalendarStore.getState();
      const success = await deleteEvent(event.id);
      if (success) {
        setShowEventModal(false);
        setSelectedEvent(null);
      }
    }
  }, []);

  const handleViewDetails = useCallback((event: CalendarEvent) => {
    setShowEventModal(false);
    navigate(`/calendar/event/${event.id}`);
  }, [navigate]);

  const handleEventFormSuccess = useCallback(() => {
    // Refresh events
    const startDate = visibleRange.start.toISOString().split('T')[0];
    const endDate = visibleRange.end.toISOString().split('T')[0];
    fetchEvents(startDate, endDate);
  }, [visibleRange, fetchEvents]);

  // Refresh with visual feedback
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshSuccess(false);

    try {
      const startDate = visibleRange.start.toISOString().split('T')[0];
      const endDate = visibleRange.end.toISOString().split('T')[0];
      await fetchEvents(startDate, endDate);
      await fetchHolidays(selectedDate.getFullYear());

      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [visibleRange, selectedDate, fetchEvents, fetchHolidays]);

  // Export calendar to ICS format
  const handleExport = useCallback(() => {
    const formatDate = (dateStr: string) => {
      return dateStr.replace(/[-:]/g, '').replace('.000', '').split('.')[0] + 'Z';
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OHCS E-Library//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:OHCS Calendar',
      'X-WR-TIMEZONE:Africa/Accra',
    ];

    // Add events
    events.forEach(event => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@ohcs-elibrary`,
        `DTSTAMP:${formatDate(new Date().toISOString())}`,
        `DTSTART:${formatDate(startDate.toISOString())}`,
        `DTEND:${formatDate(endDate.toISOString())}`,
        `SUMMARY:${event.title}`,
        event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
        event.location ? `LOCATION:${event.location}` : '',
        event.category ? `CATEGORIES:${event.category.name}` : '',
        'END:VEVENT'
      );
    });

    // Add holidays
    holidays.forEach(holiday => {
      const date = new Date(holiday.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${holiday.id}@ohcs-elibrary`,
        `DTSTAMP:${formatDate(new Date().toISOString())}`,
        `DTSTART;VALUE=DATE:${holiday.date.replace(/-/g, '')}`,
        `DTEND;VALUE=DATE:${nextDay.toISOString().split('T')[0].replace(/-/g, '')}`,
        `SUMMARY:${holiday.name} (Ghana Holiday)`,
        holiday.description ? `DESCRIPTION:${holiday.description}` : '',
        'CATEGORIES:Holiday',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    // Create and download file
    const blob = new Blob([icsContent.filter(line => line).join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ohcs-calendar-${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  }, [events, holidays, selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-ghana-green/5 dark:from-gray-900 dark:via-gray-900 dark:to-ghana-green/10">
      {/* Page Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Title */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="p-3 bg-gradient-to-br from-ghana-green to-ghana-green/80 rounded-2xl shadow-lg shadow-ghana-green/20">
                  <CalendarIcon className="w-7 h-7 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-ghana-gold rounded-full"
                />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-ghana-green to-ghana-green dark:from-white dark:via-ghana-gold dark:to-ghana-gold bg-clip-text text-transparent">
                  Calendar
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-ghana-gold" />
                  Training sessions, events & Ghana holidays
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`
                  relative p-2.5 rounded-xl transition-all duration-300 group
                  ${refreshSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
                title="Refresh Calendar"
              >
                <AnimatePresence mode="wait">
                  {refreshSuccess ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="refresh"
                      animate={isRefreshing ? { rotate: 360 } : {}}
                      transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
                    >
                      <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Export Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className={`
                  relative p-2.5 rounded-xl transition-all duration-300
                  ${exportSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
                title="Export Calendar (ICS)"
              >
                <AnimatePresence mode="wait">
                  {exportSuccess ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <FileDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Settings Dropdown */}
              <div className="relative" ref={settingsRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className={`
                    p-2.5 rounded-xl transition-all duration-300
                    ${showSettingsDropdown
                      ? 'bg-ghana-green text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                  title="Calendar Settings"
                >
                  <Settings className={`w-5 h-5 ${showSettingsDropdown ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                </motion.button>

                <AnimatePresence>
                  {showSettingsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Settings className="w-4 h-4 text-ghana-green" />
                          Calendar Settings
                        </h3>
                      </div>

                      <div className="p-2">
                        {/* Show Holidays Toggle */}
                        <button
                          onClick={() => {
                            toggleHolidays();
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {showHolidays ? (
                              <Eye className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <EyeOff className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Ghana Holidays
                            </span>
                          </div>
                          <div className={`w-10 h-6 rounded-full transition-colors ${showHolidays ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <motion.div
                              animate={{ x: showHolidays ? 16 : 2 }}
                              className="w-5 h-5 mt-0.5 bg-white rounded-full shadow-sm"
                            />
                          </div>
                        </button>

                        {/* Reminder Settings */}
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            // Could open a reminder settings modal
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Bell className="w-5 h-5 text-ghana-gold" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Default Reminders
                          </span>
                        </button>

                        {/* Working Hours */}
                        <button
                          onClick={() => {
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Clock className="w-5 h-5 text-blue-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Working Hours
                          </span>
                        </button>
                      </div>

                      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
                          Timezone: Africa/Accra (GMT+0)
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ghana-green/10 dark:bg-ghana-green/20 rounded-lg">
            <div className="w-2 h-2 bg-ghana-green rounded-full animate-pulse" />
            <span className="font-medium text-ghana-green dark:text-ghana-green">
              {events.length} Events
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              {holidays.length} Holidays
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ghana-gold/10 dark:bg-ghana-gold/20 rounded-lg">
            <div className="w-2 h-2 bg-ghana-gold rounded-full" />
            <span className="font-medium text-ghana-gold dark:text-ghana-gold">
              {categories.length} Categories
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mx-4 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <CalendarSidebar
            onEventClick={handleEventClick}
            onHolidayClick={handleHolidayClick}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Calendar Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar Header */}
          <CalendarHeader onCreateEvent={() => handleCreateEvent()} />

          {/* Calendar Grid */}
          <div className="flex-1 overflow-hidden">
            {isLoading && events.length === 0 ? (
              <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-ghana-green/20 border-t-ghana-green rounded-full animate-spin mx-auto" />
                    <CalendarIcon className="w-6 h-6 text-ghana-green absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Loading calendar...</p>
                </motion.div>
              </div>
            ) : (
              <CalendarGrid
                onEventClick={handleEventClick}
                onHolidayClick={handleHolidayClick}
                onDateClick={handleDateClick}
                onCreateEvent={handleCreateEvent}
              />
            )}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onViewDetails={handleViewDetails}
      />

      {/* Event Form Modal */}
      <EventForm
        isOpen={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setSelectedEvent(null);
          setDefaultEventDate(undefined);
        }}
        event={selectedEvent}
        defaultDate={defaultEventDate}
        onSuccess={handleEventFormSuccess}
      />
    </div>
  );
}
