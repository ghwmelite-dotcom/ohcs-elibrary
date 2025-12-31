/**
 * Calendar Header Component
 * Responsive navigation, view switcher, and action buttons
 */

import { ChevronLeft, ChevronRight, Plus, Calendar, List, Grid3X3, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCalendarStore } from '@/stores/calendarStore';
import type { CalendarView } from '@/types/calendar';

interface CalendarHeaderProps {
  onCreateEvent?: (date?: Date) => void;
}

const viewOptions: { value: CalendarView; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { value: 'month', label: 'Month', shortLabel: 'M', icon: <Grid3X3 className="w-4 h-4" /> },
  { value: 'week', label: 'Week', shortLabel: 'W', icon: <CalendarDays className="w-4 h-4" /> },
  { value: 'day', label: 'Day', shortLabel: 'D', icon: <Calendar className="w-4 h-4" /> },
  { value: 'agenda', label: 'Agenda', shortLabel: 'A', icon: <List className="w-4 h-4" /> },
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
    switch (currentView) {
      case 'day':
        return selectedDate.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
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

        if (startMonth === endMonth) {
          return `${weekStart.getDate()} - ${weekEnd.getDate()} ${startMonth}`;
        }
        return `${weekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth}`;
      }
      case 'agenda':
        return 'Upcoming';
      case 'month':
      default:
        return selectedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
  };

  const getShortTitle = (): string => {
    switch (currentView) {
      case 'day':
        return selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      case 'week':
        return `Week ${Math.ceil(selectedDate.getDate() / 7)}`;
      case 'agenda':
        return 'Agenda';
      case 'month':
      default:
        return selectedDate.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    }
  };

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3 lg:p-4">
        {/* Left: Navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Navigation Buttons */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded-xl p-0.5 sm:p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={navigatePrevious}
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={goToToday}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 rounded-md sm:rounded-lg transition-colors"
            >
              Today
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={navigateNext}
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </motion.button>
          </div>

          {/* Title */}
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white ml-1 sm:ml-2 truncate">
            <span className="hidden sm:inline">{getHeaderTitle()}</span>
            <span className="sm:hidden">{getShortTitle()}</span>
          </h2>
        </div>

        {/* Right: View Switcher */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* View Switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded-xl p-0.5 sm:p-1">
            {viewOptions.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleViewChange(option.value)}
                className={`
                  flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all
                  ${currentView === option.value
                    ? 'bg-white dark:bg-gray-600 text-ghana-green dark:text-ghana-gold shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-600/50'
                  }
                `}
                title={option.label}
              >
                {option.icon}
                <span className="hidden lg:inline">{option.label}</span>
                <span className="lg:hidden hidden sm:inline">{option.shortLabel}</span>
              </motion.button>
            ))}
          </div>

          {/* Create Button - Hidden on mobile (FAB instead) */}
          {onCreateEvent && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCreateEvent()}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-ghana-green hover:bg-ghana-green/90 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">New Event</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
