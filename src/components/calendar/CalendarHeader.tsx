/**
 * Calendar Header Component
 * Navigation, view switcher, and action buttons
 */

import { ChevronLeft, ChevronRight, Plus, Calendar, List, Grid3X3, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCalendarStore } from '@/stores/calendarStore';
import type { CalendarView } from '@/types/calendar';

interface CalendarHeaderProps {
  onCreateEvent?: () => void;
}

const viewOptions: { value: CalendarView; label: string; icon: React.ReactNode }[] = [
  { value: 'month', label: 'Month', icon: <Grid3X3 className="w-4 h-4" /> },
  { value: 'week', label: 'Week', icon: <CalendarDays className="w-4 h-4" /> },
  { value: 'day', label: 'Day', icon: <Calendar className="w-4 h-4" /> },
  { value: 'agenda', label: 'Agenda', icon: <List className="w-4 h-4" /> },
];

export default function CalendarHeader({ onCreateEvent }: CalendarHeaderProps) {
  const { selectedDate, currentView, setSelectedDate, setCurrentView, fetchEvents } = useCalendarStore();

  const navigatePrevious = () => {
    const newDate = new Date(selectedDate);
    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
      default:
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'agenda':
        newDate.setDate(newDate.getDate() - 30);
        break;
    }
    setSelectedDate(newDate);
    fetchEvents();
  };

  const navigateNext = () => {
    const newDate = new Date(selectedDate);
    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
      default:
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'agenda':
        newDate.setDate(newDate.getDate() + 30);
        break;
    }
    setSelectedDate(newDate);
    fetchEvents();
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    fetchEvents();
  };

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
    fetchEvents();
  };

  const getHeaderTitle = (): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric' };

    switch (currentView) {
      case 'day':
        return selectedDate.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      case 'week': {
        const weekStart = new Date(selectedDate);
        const dayOfWeek = weekStart.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        weekStart.setDate(weekStart.getDate() + mondayOffset);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const startMonth = weekStart.toLocaleDateString('en-GB', { month: 'short' });
        const endMonth = weekEnd.toLocaleDateString('en-GB', { month: 'short' });
        const year = weekStart.getFullYear();

        if (startMonth === endMonth) {
          return `${weekStart.getDate()} - ${weekEnd.getDate()} ${startMonth} ${year}`;
        }
        return `${weekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth} ${year}`;
      }
      case 'agenda':
        return `Upcoming Events`;
      case 'month':
      default:
        return selectedDate.toLocaleDateString('en-GB', { month: 'long', ...options });
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={navigatePrevious}
            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Today
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={navigateNext}
            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
        </div>

        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white ml-2">
          {getHeaderTitle()}
        </h2>
      </div>

      {/* Right: View Switcher & Create Button */}
      <div className="flex items-center gap-3">
        {/* View Switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {viewOptions.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleViewChange(option.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${currentView === option.value
                  ? 'bg-white dark:bg-gray-600 text-ghana-green dark:text-ghana-gold shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
                }
              `}
              title={option.label}
            >
              {option.icon}
              <span className="hidden sm:inline">{option.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Create Event Button */}
        {onCreateEvent && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateEvent}
            className="flex items-center gap-2 px-4 py-2 bg-ghana-green hover:bg-ghana-green/90 text-white rounded-lg font-medium shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Event</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
