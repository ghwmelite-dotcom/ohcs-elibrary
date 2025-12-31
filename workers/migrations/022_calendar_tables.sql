-- Calendar & Events System Tables
-- Migration: 022_calendar_tables.sql
-- Description: Complete calendar system for OHCS E-Library with events, RSVP, reminders, and Ghana holidays

-- Event Categories
CREATE TABLE IF NOT EXISTS calendar_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#006B3F',
  icon TEXT DEFAULT 'calendar',
  isSystem INTEGER DEFAULT 0,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  categoryId TEXT,
  organizerId TEXT NOT NULL,
  eventType TEXT NOT NULL DEFAULT 'general',

  -- Timing
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  isAllDay INTEGER DEFAULT 0,
  timezone TEXT DEFAULT 'Africa/Accra',

  -- Location
  location TEXT,
  locationUrl TEXT,
  isVirtual INTEGER DEFAULT 0,
  meetingUrl TEXT,
  meetingProvider TEXT,

  -- Capacity & Registration
  capacity INTEGER,
  registrationRequired INTEGER DEFAULT 0,
  registrationDeadline TEXT,
  waitlistEnabled INTEGER DEFAULT 1,
  attendeeCount INTEGER DEFAULT 0,

  -- Recurrence (RFC 5545)
  isRecurring INTEGER DEFAULT 0,
  recurrenceRule TEXT,
  recurrenceEndDate TEXT,
  parentEventId TEXT,

  -- Visibility & Status
  visibility TEXT DEFAULT 'public',
  status TEXT DEFAULT 'scheduled',

  -- Integration Links
  sourceType TEXT,
  sourceId TEXT,
  groupId TEXT,

  -- Metadata
  tags TEXT,
  attachments TEXT,
  xpReward INTEGER DEFAULT 0,

  -- Timestamps
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (categoryId) REFERENCES calendar_categories(id),
  FOREIGN KEY (organizerId) REFERENCES users(id),
  FOREIGN KEY (parentEventId) REFERENCES calendar_events(id) ON DELETE CASCADE,
  FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE SET NULL
);

-- Event Attendees (RSVP)
CREATE TABLE IF NOT EXISTS calendar_attendees (
  id TEXT PRIMARY KEY,
  eventId TEXT NOT NULL,
  userId TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  role TEXT DEFAULT 'attendee',
  registeredAt TEXT DEFAULT (datetime('now')),
  respondedAt TEXT,
  checkedInAt TEXT,
  waitlistPosition INTEGER,
  notes TEXT,

  UNIQUE(eventId, userId),
  FOREIGN KEY (eventId) REFERENCES calendar_events(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Event Reminders
CREATE TABLE IF NOT EXISTS calendar_reminders (
  id TEXT PRIMARY KEY,
  eventId TEXT NOT NULL,
  userId TEXT NOT NULL,
  reminderType TEXT DEFAULT 'notification',
  minutesBefore INTEGER NOT NULL,
  isSent INTEGER DEFAULT 0,
  sentAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),

  UNIQUE(eventId, userId, minutesBefore),
  FOREIGN KEY (eventId) REFERENCES calendar_events(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Ghana Public Holidays
CREATE TABLE IF NOT EXISTS calendar_holidays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT DEFAULT 'public',
  isRecurring INTEGER DEFAULT 1,
  description TEXT,
  createdAt TEXT DEFAULT (datetime('now')),

  UNIQUE(name, year)
);

-- User Calendar Settings
CREATE TABLE IF NOT EXISTS calendar_settings (
  userId TEXT PRIMARY KEY,
  defaultView TEXT DEFAULT 'month',
  weekStartsOn INTEGER DEFAULT 1,
  showWeekends INTEGER DEFAULT 1,
  workingHoursStart TEXT DEFAULT '08:00',
  workingHoursEnd TEXT DEFAULT '17:00',
  defaultReminders TEXT DEFAULT '[15, 60, 1440]',
  syncLmsDeadlines INTEGER DEFAULT 1,
  syncGroupEvents INTEGER DEFAULT 1,
  showHolidays INTEGER DEFAULT 1,
  timezone TEXT DEFAULT 'Africa/Accra',
  updatedAt TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cal_events_organizer ON calendar_events(organizerId);
CREATE INDEX IF NOT EXISTS idx_cal_events_start ON calendar_events(startDate);
CREATE INDEX IF NOT EXISTS idx_cal_events_end ON calendar_events(endDate);
CREATE INDEX IF NOT EXISTS idx_cal_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_cal_events_category ON calendar_events(categoryId);
CREATE INDEX IF NOT EXISTS idx_cal_events_source ON calendar_events(sourceType, sourceId);
CREATE INDEX IF NOT EXISTS idx_cal_events_group ON calendar_events(groupId);
CREATE INDEX IF NOT EXISTS idx_cal_events_visibility ON calendar_events(visibility);
CREATE INDEX IF NOT EXISTS idx_cal_attendees_user ON calendar_attendees(userId);
CREATE INDEX IF NOT EXISTS idx_cal_attendees_event ON calendar_attendees(eventId);
CREATE INDEX IF NOT EXISTS idx_cal_attendees_status ON calendar_attendees(status);
CREATE INDEX IF NOT EXISTS idx_cal_reminders_event ON calendar_reminders(eventId);
CREATE INDEX IF NOT EXISTS idx_cal_reminders_user ON calendar_reminders(userId);
CREATE INDEX IF NOT EXISTS idx_cal_reminders_sent ON calendar_reminders(isSent);
CREATE INDEX IF NOT EXISTS idx_cal_holidays_date ON calendar_holidays(date);
CREATE INDEX IF NOT EXISTS idx_cal_holidays_year ON calendar_holidays(year);

-- Insert Default Categories (Ghana-themed colors)
INSERT OR IGNORE INTO calendar_categories (id, name, slug, description, color, icon, isSystem, sortOrder) VALUES
  ('cat-training', 'Training', 'training', 'Training sessions and courses', '#006B3F', 'graduation-cap', 1, 1),
  ('cat-webinar', 'Webinar', 'webinar', 'Online webinars and virtual sessions', '#FCD116', 'video', 1, 2),
  ('cat-workshop', 'Workshop', 'workshop', 'Hands-on workshops', '#CE1126', 'wrench', 1, 3),
  ('cat-meeting', 'Meeting', 'meeting', 'Team and departmental meetings', '#3B82F6', 'users', 1, 4),
  ('cat-deadline', 'Deadline', 'deadline', 'Assignment and submission deadlines', '#EF4444', 'clock', 1, 5),
  ('cat-holiday', 'Holiday', 'holiday', 'Public and departmental holidays', '#10B981', 'palmtree', 1, 6),
  ('cat-personal', 'Personal', 'personal', 'Personal events and reminders', '#8B5CF6', 'user', 1, 7),
  ('cat-general', 'General', 'general', 'General events', '#6B7280', 'calendar', 1, 8);

-- Insert Ghana Public Holidays 2025
INSERT OR IGNORE INTO calendar_holidays (id, name, date, year, type, description) VALUES
  ('hol-new-year-2025', 'New Year''s Day', '2025-01-01', 2025, 'public', 'First day of the year'),
  ('hol-constitution-2025', 'Constitution Day', '2025-01-07', 2025, 'public', 'Anniversary of the 1993 Constitution'),
  ('hol-independence-2025', 'Independence Day', '2025-03-06', 2025, 'public', 'Ghana''s independence from British rule in 1957'),
  ('hol-good-friday-2025', 'Good Friday', '2025-04-18', 2025, 'public', 'Christian observance'),
  ('hol-easter-saturday-2025', 'Easter Saturday', '2025-04-19', 2025, 'public', 'Day before Easter Sunday'),
  ('hol-easter-monday-2025', 'Easter Monday', '2025-04-21', 2025, 'public', 'Day after Easter Sunday'),
  ('hol-may-day-2025', 'May Day', '2025-05-01', 2025, 'public', 'Workers'' Day'),
  ('hol-africa-day-2025', 'Africa Day', '2025-05-25', 2025, 'public', 'Founding of Organization of African Unity'),
  ('hol-republic-2025', 'Republic Day', '2025-07-01', 2025, 'public', 'Ghana became a Republic in 1960'),
  ('hol-founders-2025', 'Founders'' Day', '2025-08-04', 2025, 'public', 'Birth of Kwame Nkrumah'),
  ('hol-kwame-2025', 'Kwame Nkrumah Memorial Day', '2025-09-21', 2025, 'public', 'Death of Kwame Nkrumah'),
  ('hol-farmers-2025', 'Farmers'' Day', '2025-12-05', 2025, 'public', 'Celebrating Ghanaian farmers'),
  ('hol-christmas-2025', 'Christmas Day', '2025-12-25', 2025, 'public', 'Christian celebration'),
  ('hol-boxing-2025', 'Boxing Day', '2025-12-26', 2025, 'public', 'Day after Christmas');

-- Insert Ghana Public Holidays 2026
INSERT OR IGNORE INTO calendar_holidays (id, name, date, year, type, description) VALUES
  ('hol-new-year-2026', 'New Year''s Day', '2026-01-01', 2026, 'public', 'First day of the year'),
  ('hol-constitution-2026', 'Constitution Day', '2026-01-07', 2026, 'public', 'Anniversary of the 1993 Constitution'),
  ('hol-independence-2026', 'Independence Day', '2026-03-06', 2026, 'public', 'Ghana''s independence from British rule in 1957'),
  ('hol-good-friday-2026', 'Good Friday', '2026-04-03', 2026, 'public', 'Christian observance'),
  ('hol-easter-saturday-2026', 'Easter Saturday', '2026-04-04', 2026, 'public', 'Day before Easter Sunday'),
  ('hol-easter-monday-2026', 'Easter Monday', '2026-04-06', 2026, 'public', 'Day after Easter Sunday'),
  ('hol-may-day-2026', 'May Day', '2026-05-01', 2026, 'public', 'Workers'' Day'),
  ('hol-africa-day-2026', 'Africa Day', '2026-05-25', 2026, 'public', 'Founding of Organization of African Unity'),
  ('hol-republic-2026', 'Republic Day', '2026-07-01', 2026, 'public', 'Ghana became a Republic in 1960'),
  ('hol-founders-2026', 'Founders'' Day', '2026-08-04', 2026, 'public', 'Birth of Kwame Nkrumah'),
  ('hol-kwame-2026', 'Kwame Nkrumah Memorial Day', '2026-09-21', 2026, 'public', 'Death of Kwame Nkrumah'),
  ('hol-farmers-2026', 'Farmers'' Day', '2026-12-04', 2026, 'public', 'Celebrating Ghanaian farmers'),
  ('hol-christmas-2026', 'Christmas Day', '2026-12-25', 2026, 'public', 'Christian celebration'),
  ('hol-boxing-2026', 'Boxing Day', '2026-12-26', 2026, 'public', 'Day after Christmas');
