/**
 * Calendar & Events System Types
 * Comprehensive type definitions for the OHCS E-Library calendar system
 */

// ============================================================================
// Enums & Union Types
// ============================================================================

export type EventType =
  | 'training'
  | 'webinar'
  | 'workshop'
  | 'meeting'
  | 'deadline'
  | 'holiday'
  | 'personal'
  | 'group_event'
  | 'general';

export type EventStatus =
  | 'draft'
  | 'scheduled'
  | 'live'
  | 'completed'
  | 'cancelled';

export type EventVisibility =
  | 'public'
  | 'private'
  | 'department'
  | 'group';

export type RSVPStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'tentative'
  | 'waitlisted';

export type AttendeeRole =
  | 'organizer'
  | 'host'
  | 'speaker'
  | 'attendee';

export type CalendarView =
  | 'month'
  | 'week'
  | 'day'
  | 'agenda';

export type ReminderType =
  | 'notification'
  | 'email'
  | 'push';

export type MeetingProvider =
  | 'zoom'
  | 'teams'
  | 'google_meet'
  | 'custom';

export type HolidayType =
  | 'public'
  | 'observance'
  | 'departmental';

export type SourceType =
  | 'lms_course'
  | 'lms_assignment'
  | 'lms_quiz'
  | 'group'
  | 'manual';

// ============================================================================
// Core Interfaces
// ============================================================================

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  isSystem: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  displayName: string;
  avatar?: string;
  title?: string;
  department?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  category?: EventCategory;
  categoryId?: string;
  organizer: UserSummary;
  organizerId: string;
  eventType: EventType;

  // Timing
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  timezone: string;

  // Location
  location?: string;
  locationUrl?: string;
  isVirtual: boolean;
  meetingUrl?: string;
  meetingProvider?: MeetingProvider;

  // Capacity & Registration
  capacity?: number;
  registrationRequired: boolean;
  registrationDeadline?: string;
  waitlistEnabled: boolean;
  attendeeCount: number;

  // Recurrence
  isRecurring: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  parentEventId?: string;

  // Visibility & Status
  visibility: EventVisibility;
  status: EventStatus;

  // Integration
  sourceType?: SourceType;
  sourceId?: string;
  groupId?: string;

  // Metadata
  tags?: string[];
  attachments?: EventAttachment[];
  xpReward: number;

  // User-specific (populated for authenticated requests)
  isRegistered?: boolean;
  myRsvpStatus?: RSVPStatus;
  myRole?: AttendeeRole;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface EventAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface EventAttendee {
  id: string;
  eventId: string;
  userId: string;
  user: UserSummary;
  status: RSVPStatus;
  role: AttendeeRole;
  registeredAt: string;
  respondedAt?: string;
  checkedInAt?: string;
  waitlistPosition?: number;
  notes?: string;
}

export interface EventReminder {
  id: string;
  eventId: string;
  userId: string;
  reminderType: ReminderType;
  minutesBefore: number;
  isSent: boolean;
  sentAt?: string;
  createdAt: string;
}

export interface GhanaHoliday {
  id: string;
  name: string;
  date: string;
  year: number;
  type: HolidayType;
  isRecurring: boolean;
  description?: string;
  createdAt?: string;
}

export interface CalendarSettings {
  userId?: string;
  defaultView: CalendarView;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  showWeekends: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  defaultReminders: number[]; // minutes before event
  syncLmsDeadlines: boolean;
  syncGroupEvents: boolean;
  showHolidays: boolean;
  timezone: string;
  updatedAt?: string;
}

// ============================================================================
// Input Types (for creating/updating)
// ============================================================================

export interface CreateEventInput {
  title: string;
  description?: string;
  categoryId?: string;
  eventType: EventType;

  // Timing
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  timezone?: string;

  // Location
  location?: string;
  locationUrl?: string;
  isVirtual?: boolean;
  meetingUrl?: string;
  meetingProvider?: MeetingProvider;

  // Capacity
  capacity?: number;
  registrationRequired?: boolean;
  registrationDeadline?: string;
  waitlistEnabled?: boolean;

  // Recurrence
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;

  // Visibility
  visibility?: EventVisibility;
  status?: EventStatus;

  // Integration
  groupId?: string;

  // Metadata
  tags?: string[];
  xpReward?: number;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  // All fields optional for updates
}

export interface UpdateRsvpInput {
  status: RSVPStatus;
  notes?: string;
}

export interface SetReminderInput {
  reminderType?: ReminderType;
  minutesBefore: number;
}

export interface UpdateSettingsInput extends Partial<Omit<CalendarSettings, 'userId' | 'updatedAt'>> {}

// ============================================================================
// Response Types
// ============================================================================

export interface CalendarEventsResponse {
  events: CalendarEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CalendarFeedResponse {
  events: CalendarEvent[];
  holidays: GhanaHoliday[];
  lmsDeadlines?: CalendarEvent[];
  groupEvents?: CalendarEvent[];
}

export interface EventAttendeesResponse {
  attendees: EventAttendee[];
  total: number;
  accepted: number;
  pending: number;
  declined: number;
  waitlisted: number;
}

export interface CalendarStatsResponse {
  totalEvents: number;
  upcomingEvents: number;
  myEvents: number;
  attendingEvents: number;
  eventsByCategory: Record<string, number>;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface CalendarFilters {
  startDate?: string;
  endDate?: string;
  categories?: string[];
  eventTypes?: EventType[];
  status?: EventStatus[];
  visibility?: EventVisibility[];
  organizerId?: string;
  groupId?: string;
  search?: string;
  registrationOpen?: boolean;
}

export interface CalendarQueryParams extends CalendarFilters {
  page?: number;
  limit?: number;
  sortBy?: 'startDate' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// UI State Types
// ============================================================================

export interface CalendarViewState {
  selectedDate: Date;
  currentView: CalendarView;
  visibleRange: {
    start: Date;
    end: Date;
  };
}

export interface EventFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  event?: CalendarEvent;
  defaultDate?: Date;
}

export interface EventModalState {
  isOpen: boolean;
  event: CalendarEvent | null;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
  label: string;
}

export interface RecurrenceInfo {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  dayOfMonth?: number;
  endDate?: Date;
  count?: number;
}

// Helper to parse RRULE strings
export function parseRecurrenceRule(rule: string): RecurrenceInfo | null {
  if (!rule) return null;

  const parts = rule.split(';').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const frequency = parts.FREQ?.toLowerCase() as RecurrenceInfo['frequency'];
  if (!frequency) return null;

  return {
    frequency,
    interval: parseInt(parts.INTERVAL || '1', 10),
    daysOfWeek: parts.BYDAY?.split(',').map(d => {
      const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
      return dayMap[d] ?? 0;
    }),
    dayOfMonth: parts.BYMONTHDAY ? parseInt(parts.BYMONTHDAY, 10) : undefined,
    endDate: parts.UNTIL ? new Date(parts.UNTIL) : undefined,
    count: parts.COUNT ? parseInt(parts.COUNT, 10) : undefined,
  };
}

// Helper to generate RRULE strings
export function generateRecurrenceRule(info: RecurrenceInfo): string {
  const parts = [`FREQ=${info.frequency.toUpperCase()}`];

  if (info.interval > 1) {
    parts.push(`INTERVAL=${info.interval}`);
  }

  if (info.daysOfWeek?.length) {
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    parts.push(`BYDAY=${info.daysOfWeek.map(d => dayMap[d]).join(',')}`);
  }

  if (info.dayOfMonth) {
    parts.push(`BYMONTHDAY=${info.dayOfMonth}`);
  }

  if (info.endDate) {
    parts.push(`UNTIL=${info.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
  }

  if (info.count) {
    parts.push(`COUNT=${info.count}`);
  }

  return parts.join(';');
}

// Category color map for easy access
export const CATEGORY_COLORS: Record<string, string> = {
  training: '#006B3F',    // Ghana Green
  webinar: '#FCD116',     // Ghana Gold
  workshop: '#CE1126',    // Ghana Red
  meeting: '#3B82F6',     // Blue
  deadline: '#EF4444',    // Red
  holiday: '#10B981',     // Emerald
  personal: '#8B5CF6',    // Purple
  general: '#6B7280',     // Gray
};

// Default reminder options (in minutes)
export const DEFAULT_REMINDER_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
  { value: 10080, label: '1 week before' },
];
