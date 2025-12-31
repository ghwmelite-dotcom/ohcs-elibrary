/**
 * Calendar Page
 * Stunning, sleek, and fully responsive calendar view
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Settings,
  RefreshCw,
  Check,
  X,
  Bell,
  Eye,
  EyeOff,
  Clock,
  FileDown,
  Sparkles,
  Menu,
  ChevronDown,
  Filter,
  Plus,
} from 'lucide-react';
import { useCalendarStore } from '@/stores/calendarStore';
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

  // Mobile sidebar
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Action states
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

  // Close mobile sidebar on route change or escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMobileSidebar(false);
        setShowSettingsDropdown(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
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
    setShowMobileSidebar(false);
  }, []);

  const handleHolidayClick = useCallback((holiday: GhanaHoliday) => {
    console.log('Holiday clicked:', holiday);
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    console.log('Date clicked:', date);
  }, []);

  const handleCreateEvent = useCallback((date?: Date) => {
    setSelectedEvent(null);
    setDefaultEventDate(date);
    setShowEventForm(true);
    setShowMobileSidebar(false);
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

    holidays.forEach(holiday => {
      const nextDay = new Date(holiday.date);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setShowMobileSidebar(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-gray-800 z-50 lg:hidden shadow-2xl"
            >
              <CalendarSidebar
                onEventClick={handleEventClick}
                onHolidayClick={handleHolidayClick}
                isCollapsed={false}
                onToggleCollapse={() => setShowMobileSidebar(false)}
                isMobile={true}
                onClose={() => setShowMobileSidebar(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700/80">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Menu + Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileSidebar(true)}
                className="lg:hidden p-2 -ml-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <Menu className="w-5 h-5" />
              </motion.button>

              {/* Icon */}
              <div className="hidden sm:flex relative flex-shrink-0">
                <div className="p-2.5 sm:p-3 bg-gradient-to-br from-ghana-green via-ghana-green to-emerald-600 rounded-xl sm:rounded-2xl shadow-lg shadow-ghana-green/25">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-ghana-gold rounded-full ring-2 ring-white dark:ring-gray-900" />
              </div>

              {/* Title */}
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  Calendar
                </h1>
                <p className="hidden sm:flex text-xs sm:text-sm text-gray-500 dark:text-gray-400 items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-ghana-gold flex-shrink-0" />
                  <span className="truncate">Events & Ghana Holidays</span>
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Stats - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-2 mr-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-ghana-green/10 dark:bg-ghana-green/20 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-ghana-green rounded-full" />
                  <span className="text-xs font-semibold text-ghana-green">{events.length}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{holidays.length}</span>
                </div>
              </div>

              {/* Refresh */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 sm:p-2.5 rounded-xl transition-all ${
                  refreshSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                title="Refresh"
              >
                {refreshSuccess ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                )}
              </motion.button>

              {/* Export */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className={`p-2 sm:p-2.5 rounded-xl transition-all ${
                  exportSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                title="Export ICS"
              >
                {exportSuccess ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />}
              </motion.button>

              {/* Settings */}
              <div className="relative" ref={settingsRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all ${
                    showSettingsDropdown
                      ? 'bg-ghana-green text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                  title="Settings"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>

                <AnimatePresence>
                  {showSettingsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 sm:w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-50"
                    >
                      <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                          <Settings className="w-4 h-4 text-ghana-green" />
                          Settings
                        </h3>
                      </div>
                      <div className="p-1.5 sm:p-2">
                        <button
                          onClick={toggleHolidays}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            {showHolidays ? <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />}
                            <span className="text-sm text-gray-700 dark:text-gray-300">Ghana Holidays</span>
                          </div>
                          <div className={`w-9 h-5 sm:w-10 sm:h-6 rounded-full transition-colors flex items-center ${showHolidays ? 'bg-emerald-500 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'}`}>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 mx-0.5 bg-white rounded-full shadow-sm" />
                          </div>
                        </button>
                        <button className="w-full flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-ghana-gold" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Reminders</span>
                        </button>
                        <button className="w-full flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Working Hours</span>
                        </button>
                      </div>
                      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400">Africa/Accra (GMT+0)</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Create Event - Mobile FAB style on small screens */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCreateEvent()}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-ghana-green to-emerald-600 hover:from-ghana-green/90 hover:to-emerald-600/90 text-white rounded-xl font-medium shadow-lg shadow-ghana-green/25 transition-all"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden lg:inline">New Event</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-red-200 dark:border-red-800"
          >
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400 truncate">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-65px)] sm:h-[calc(100vh-73px)] overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <CalendarSidebar
            onEventClick={handleEventClick}
            onHolidayClick={handleHolidayClick}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Calendar Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <CalendarHeader onCreateEvent={handleCreateEvent} />

          <div className="flex-1 overflow-hidden">
            {isLoading && events.length === 0 ? (
              <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-8"
                >
                  <div className="relative inline-flex">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-ghana-green/20 border-t-ghana-green rounded-full animate-spin" />
                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-ghana-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="mt-4 text-sm sm:text-base text-gray-500 dark:text-gray-400">Loading calendar...</p>
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

      {/* Mobile FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleCreateEvent()}
        className="sm:hidden fixed bottom-6 right-4 z-30 w-14 h-14 bg-gradient-to-br from-ghana-green to-emerald-600 text-white rounded-2xl shadow-xl shadow-ghana-green/30 flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

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
