/**
 * Calendar & Events System Store
 * Zustand store for managing calendar events, holidays, RSVP, and settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CalendarEvent,
  EventCategory,
  EventAttendee,
  GhanaHoliday,
  CalendarSettings,
  CalendarView,
  RSVPStatus,
  CreateEventInput,
  UpdateEventInput,
  CalendarEventsResponse,
  EventAttendeesResponse,
  CalendarFilters,
} from '@/types/calendar';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

const getAuthToken = (): string | null => {
  try {
    const authState = JSON.parse(localStorage.getItem('ohcs-auth-storage') || '{}');
    return authState?.state?.token || localStorage.getItem('auth_token');
  } catch {
    return localStorage.getItem('auth_token');
  }
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }
  return response.json();
};

interface CalendarState {
  // Event data
  events: CalendarEvent[];
  totalEvents: number;
  currentEvent: CalendarEvent | null;
  attendees: EventAttendee[];

  // Categories
  categories: EventCategory[];

  // Holidays
  holidays: GhanaHoliday[];

  // Settings
  settings: CalendarSettings | null;

  // View state
  selectedDate: Date;
  currentView: CalendarView;
  visibleRange: { start: Date; end: Date };

  // Filters
  filters: CalendarFilters;
  selectedCategories: string[];
  showHolidays: boolean;
  showLmsEvents: boolean;
  showGroupEvents: boolean;

  // UI state
  isLoading: boolean;
  isRegistering: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions - Fetching
  fetchEvents: (startDate?: string, endDate?: string, additionalFilters?: CalendarFilters) => Promise<void>;
  fetchEvent: (eventId: string) => Promise<void>;
  fetchMyEvents: () => Promise<void>;
  fetchCalendarFeed: (startDate: string, endDate: string) => Promise<void>;
  fetchHolidays: (year?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchAttendees: (eventId: string) => Promise<void>;

  // Actions - CRUD
  createEvent: (event: CreateEventInput) => Promise<CalendarEvent | null>;
  updateEvent: (eventId: string, updates: UpdateEventInput) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;

  // Actions - Registration
  registerForEvent: (eventId: string) => Promise<boolean>;
  cancelRegistration: (eventId: string) => Promise<boolean>;
  updateRsvp: (eventId: string, status: RSVPStatus, notes?: string) => Promise<boolean>;
  checkInToEvent: (eventId: string, code?: string) => Promise<boolean>;

  // Actions - Reminders
  setReminder: (eventId: string, minutesBefore: number, reminderType?: string) => Promise<boolean>;
  deleteReminder: (reminderId: string) => Promise<boolean>;

  // Actions - Settings
  updateSettings: (settings: Partial<CalendarSettings>) => Promise<boolean>;

  // Actions - Admin
  addHoliday: (holiday: Omit<GhanaHoliday, 'id' | 'createdAt'>) => Promise<boolean>;
  deleteHoliday: (holidayId: string) => Promise<boolean>;

  // Actions - View management
  setSelectedDate: (date: Date) => void;
  setCurrentView: (view: CalendarView) => void;
  setVisibleRange: (start: Date, end: Date) => void;
  toggleCategory: (categoryId: string) => void;
  setFilters: (filters: Partial<CalendarFilters>) => void;
  clearFilters: () => void;

  // Utility
  clearError: () => void;
  clearCurrentEvent: () => void;
  setShowHolidays: (show: boolean) => void;
  setShowLmsEvents: (show: boolean) => void;
  setShowGroupEvents: (show: boolean) => void;
  toggleHolidays: () => void;
}

// Helper to get date range for current view
const getDateRangeForView = (date: Date, view: CalendarView): { start: Date; end: Date } => {
  const start = new Date(date);
  const end = new Date(date);

  switch (view) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const dayOfWeek = start.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(start.getDate() + mondayOffset);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'agenda':
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 30);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      // Initial state
      events: [],
      totalEvents: 0,
      currentEvent: null,
      attendees: [],
      categories: [],
      holidays: [],
      settings: null,
      selectedDate: new Date(),
      currentView: 'month',
      visibleRange: getDateRangeForView(new Date(), 'month'),
      filters: {},
      selectedCategories: [],
      showHolidays: true,
      showLmsEvents: true,
      showGroupEvents: true,
      isLoading: false,
      isRegistering: false,
      isSaving: false,
      error: null,

      // Fetch events with optional filters
      fetchEvents: async (startDate?: string, endDate?: string, additionalFilters?: CalendarFilters) => {
        set({ isLoading: true, error: null });
        try {
          const { visibleRange, filters, selectedCategories } = get();
          const start = startDate || formatDate(visibleRange.start);
          const end = endDate || formatDate(visibleRange.end);

          const queryParams = new URLSearchParams();
          queryParams.set('startDate', start);
          queryParams.set('endDate', end);

          const mergedFilters = { ...filters, ...additionalFilters };
          if (mergedFilters.search) queryParams.set('search', mergedFilters.search);
          if (mergedFilters.eventTypes?.length) queryParams.set('eventTypes', mergedFilters.eventTypes.join(','));
          if (mergedFilters.status?.length) queryParams.set('status', mergedFilters.status.join(','));
          if (selectedCategories.length) queryParams.set('categories', selectedCategories.join(','));

          const response = await authFetch(`${API_BASE}/calendar/events?${queryParams.toString()}`) as CalendarEventsResponse;

          set({
            events: response.events || [],
            totalEvents: response.total || 0,
          });
        } catch (error: any) {
          console.error('Error fetching events:', error);
          set({ error: error.message || 'Failed to fetch events' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch single event details
      fetchEvent: async (eventId: string) => {
        set({ isLoading: true, error: null });
        try {
          const event = await authFetch(`${API_BASE}/calendar/events/${eventId}`) as CalendarEvent;
          set({ currentEvent: event });
        } catch (error: any) {
          console.error('Error fetching event:', error);
          set({ error: error.message || 'Failed to fetch event' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch user's events (created + attending)
      fetchMyEvents: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/calendar/my-events`) as CalendarEventsResponse;
          set({ events: response.events || [] });
        } catch (error: any) {
          console.error('Error fetching my events:', error);
          set({ error: error.message || 'Failed to fetch your events' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch unified calendar feed (events + holidays + LMS + groups)
      fetchCalendarFeed: async (startDate: string, endDate: string) => {
        set({ isLoading: true, error: null });
        try {
          const { showHolidays, showLmsEvents, showGroupEvents } = get();

          const queryParams = new URLSearchParams();
          queryParams.set('startDate', startDate);
          queryParams.set('endDate', endDate);
          queryParams.set('includeHolidays', showHolidays.toString());
          queryParams.set('includeLms', showLmsEvents.toString());
          queryParams.set('includeGroups', showGroupEvents.toString());

          const response = await authFetch(`${API_BASE}/calendar/feed?${queryParams.toString()}`);

          set({
            events: response.events || [],
            holidays: response.holidays || [],
          });
        } catch (error: any) {
          console.error('Error fetching calendar feed:', error);
          set({ error: error.message || 'Failed to fetch calendar' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch Ghana holidays
      fetchHolidays: async (year?: number) => {
        try {
          const targetYear = year || new Date().getFullYear();
          const response = await authFetch(`${API_BASE}/calendar/holidays?year=${targetYear}`);
          set({ holidays: response.holidays || [] });
        } catch (error: any) {
          console.error('Error fetching holidays:', error);
        }
      },

      // Fetch event categories
      fetchCategories: async () => {
        try {
          const response = await authFetch(`${API_BASE}/calendar/categories`);
          set({ categories: response.categories || [] });
        } catch (error: any) {
          console.error('Error fetching categories:', error);
        }
      },

      // Fetch user settings
      fetchSettings: async () => {
        try {
          const response = await authFetch(`${API_BASE}/calendar/settings`);
          set({ settings: response.settings || response });

          // Apply settings to view
          if (response.settings?.defaultView) {
            set({ currentView: response.settings.defaultView });
          }
        } catch (error: any) {
          console.error('Error fetching settings:', error);
        }
      },

      // Fetch event attendees
      fetchAttendees: async (eventId: string) => {
        try {
          const response = await authFetch(`${API_BASE}/calendar/events/${eventId}/attendees`) as EventAttendeesResponse;
          set({ attendees: response.attendees || [] });
        } catch (error: any) {
          console.error('Error fetching attendees:', error);
        }
      },

      // Create new event
      createEvent: async (eventData: CreateEventInput) => {
        set({ isSaving: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/calendar/events`, {
            method: 'POST',
            body: JSON.stringify(eventData),
          });

          const newEvent = response.event || response;

          // Add to events list
          set(state => ({
            events: [newEvent, ...state.events],
            totalEvents: state.totalEvents + 1,
          }));

          return newEvent;
        } catch (error: any) {
          console.error('Error creating event:', error);
          set({ error: error.message || 'Failed to create event' });
          return null;
        } finally {
          set({ isSaving: false });
        }
      },

      // Update event
      updateEvent: async (eventId: string, updates: UpdateEventInput) => {
        set({ isSaving: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/calendar/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
          });

          const updatedEvent = response.event || response;

          // Update in events list
          set(state => ({
            events: state.events.map(e => e.id === eventId ? { ...e, ...updatedEvent } : e),
            currentEvent: state.currentEvent?.id === eventId ? { ...state.currentEvent, ...updatedEvent } : state.currentEvent,
          }));

          return true;
        } catch (error: any) {
          console.error('Error updating event:', error);
          set({ error: error.message || 'Failed to update event' });
          return false;
        } finally {
          set({ isSaving: false });
        }
      },

      // Delete event
      deleteEvent: async (eventId: string) => {
        set({ isSaving: true, error: null });
        try {
          await authFetch(`${API_BASE}/calendar/events/${eventId}`, {
            method: 'DELETE',
          });

          // Remove from events list
          set(state => ({
            events: state.events.filter(e => e.id !== eventId),
            totalEvents: state.totalEvents - 1,
            currentEvent: state.currentEvent?.id === eventId ? null : state.currentEvent,
          }));

          return true;
        } catch (error: any) {
          console.error('Error deleting event:', error);
          set({ error: error.message || 'Failed to delete event' });
          return false;
        } finally {
          set({ isSaving: false });
        }
      },

      // Register for event
      registerForEvent: async (eventId: string) => {
        set({ isRegistering: true, error: null });
        try {
          const response = await authFetch(`${API_BASE}/calendar/events/${eventId}/register`, {
            method: 'POST',
          });

          // Update event in list
          set(state => ({
            events: state.events.map(e =>
              e.id === eventId
                ? {
                    ...e,
                    isRegistered: true,
                    myRsvpStatus: response.status || 'accepted',
                    attendeeCount: e.attendeeCount + 1,
                  }
                : e
            ),
            currentEvent: state.currentEvent?.id === eventId
              ? {
                  ...state.currentEvent,
                  isRegistered: true,
                  myRsvpStatus: response.status || 'accepted',
                  attendeeCount: state.currentEvent.attendeeCount + 1,
                }
              : state.currentEvent,
          }));

          return true;
        } catch (error: any) {
          console.error('Error registering for event:', error);
          set({ error: error.message || 'Failed to register' });
          return false;
        } finally {
          set({ isRegistering: false });
        }
      },

      // Cancel registration
      cancelRegistration: async (eventId: string) => {
        set({ isRegistering: true, error: null });
        try {
          await authFetch(`${API_BASE}/calendar/events/${eventId}/register`, {
            method: 'DELETE',
          });

          // Update event in list
          set(state => ({
            events: state.events.map(e =>
              e.id === eventId
                ? { ...e, isRegistered: false, myRsvpStatus: undefined, attendeeCount: Math.max(0, e.attendeeCount - 1) }
                : e
            ),
            currentEvent: state.currentEvent?.id === eventId
              ? { ...state.currentEvent, isRegistered: false, myRsvpStatus: undefined, attendeeCount: Math.max(0, state.currentEvent.attendeeCount - 1) }
              : state.currentEvent,
          }));

          return true;
        } catch (error: any) {
          console.error('Error canceling registration:', error);
          set({ error: error.message || 'Failed to cancel registration' });
          return false;
        } finally {
          set({ isRegistering: false });
        }
      },

      // Update RSVP status
      updateRsvp: async (eventId: string, status: RSVPStatus, notes?: string) => {
        set({ isRegistering: true, error: null });
        try {
          await authFetch(`${API_BASE}/calendar/events/${eventId}/rsvp`, {
            method: 'PUT',
            body: JSON.stringify({ status, notes }),
          });

          // Update event in list
          set(state => ({
            events: state.events.map(e =>
              e.id === eventId ? { ...e, myRsvpStatus: status } : e
            ),
            currentEvent: state.currentEvent?.id === eventId
              ? { ...state.currentEvent, myRsvpStatus: status }
              : state.currentEvent,
          }));

          return true;
        } catch (error: any) {
          console.error('Error updating RSVP:', error);
          set({ error: error.message || 'Failed to update RSVP' });
          return false;
        } finally {
          set({ isRegistering: false });
        }
      },

      // Check in to event
      checkInToEvent: async (eventId: string, code?: string) => {
        set({ isRegistering: true, error: null });
        try {
          await authFetch(`${API_BASE}/calendar/events/${eventId}/check-in`, {
            method: 'POST',
            body: JSON.stringify({ code }),
          });

          return true;
        } catch (error: any) {
          console.error('Error checking in:', error);
          set({ error: error.message || 'Failed to check in' });
          return false;
        } finally {
          set({ isRegistering: false });
        }
      },

      // Set reminder
      setReminder: async (eventId: string, minutesBefore: number, reminderType?: string) => {
        try {
          await authFetch(`${API_BASE}/calendar/events/${eventId}/reminders`, {
            method: 'POST',
            body: JSON.stringify({ minutesBefore, reminderType }),
          });
          return true;
        } catch (error: any) {
          console.error('Error setting reminder:', error);
          set({ error: error.message || 'Failed to set reminder' });
          return false;
        }
      },

      // Delete reminder
      deleteReminder: async (reminderId: string) => {
        try {
          await authFetch(`${API_BASE}/calendar/reminders/${reminderId}`, {
            method: 'DELETE',
          });
          return true;
        } catch (error: any) {
          console.error('Error deleting reminder:', error);
          return false;
        }
      },

      // Update calendar settings
      updateSettings: async (settingsUpdate: Partial<CalendarSettings>) => {
        try {
          const response = await authFetch(`${API_BASE}/calendar/settings`, {
            method: 'PUT',
            body: JSON.stringify(settingsUpdate),
          });

          set({ settings: response.settings || response });
          return true;
        } catch (error: any) {
          console.error('Error updating settings:', error);
          set({ error: error.message || 'Failed to update settings' });
          return false;
        }
      },

      // Add holiday (admin)
      addHoliday: async (holiday) => {
        try {
          const response = await authFetch(`${API_BASE}/calendar/holidays`, {
            method: 'POST',
            body: JSON.stringify(holiday),
          });

          set(state => ({
            holidays: [...state.holidays, response.holiday || response],
          }));

          return true;
        } catch (error: any) {
          console.error('Error adding holiday:', error);
          set({ error: error.message || 'Failed to add holiday' });
          return false;
        }
      },

      // Delete holiday (admin)
      deleteHoliday: async (holidayId: string) => {
        try {
          await authFetch(`${API_BASE}/calendar/holidays/${holidayId}`, {
            method: 'DELETE',
          });

          set(state => ({
            holidays: state.holidays.filter(h => h.id !== holidayId),
          }));

          return true;
        } catch (error: any) {
          console.error('Error deleting holiday:', error);
          set({ error: error.message || 'Failed to delete holiday' });
          return false;
        }
      },

      // View management
      setSelectedDate: (date: Date) => {
        const { currentView } = get();
        const newRange = getDateRangeForView(date, currentView);
        set({
          selectedDate: date,
          visibleRange: newRange,
        });
      },

      setCurrentView: (view: CalendarView) => {
        const { selectedDate } = get();
        const newRange = getDateRangeForView(selectedDate, view);
        set({
          currentView: view,
          visibleRange: newRange,
        });
      },

      setVisibleRange: (start: Date, end: Date) => {
        set({ visibleRange: { start, end } });
      },

      toggleCategory: (categoryId: string) => {
        set(state => ({
          selectedCategories: state.selectedCategories.includes(categoryId)
            ? state.selectedCategories.filter(id => id !== categoryId)
            : [...state.selectedCategories, categoryId],
        }));
      },

      setFilters: (newFilters: Partial<CalendarFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearFilters: () => {
        set({
          filters: {},
          selectedCategories: [],
        });
      },

      // Utility
      clearError: () => set({ error: null }),

      clearCurrentEvent: () => set({ currentEvent: null, attendees: [] }),

      setShowHolidays: (show: boolean) => set({ showHolidays: show }),
      toggleHolidays: () => set((state) => ({ showHolidays: !state.showHolidays })),

      setShowLmsEvents: (show: boolean) => set({ showLmsEvents: show }),

      setShowGroupEvents: (show: boolean) => set({ showGroupEvents: show }),
    }),
    {
      name: 'calendar-store',
      partialize: (state) => ({
        // Persist view preferences
        currentView: state.currentView,
        showHolidays: state.showHolidays,
        showLmsEvents: state.showLmsEvents,
        showGroupEvents: state.showGroupEvents,
        selectedCategories: state.selectedCategories,
      }),
    }
  )
);
