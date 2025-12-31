/**
 * Calendar & Events API Routes
 * Comprehensive calendar system for OHCS E-Library
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const calendar = new Hono<{ Bindings: Env }>();

// Helper: Generate event ID
const generateEventId = () => `evt-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
const generateAtendeeId = () => `att-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
const generateReminderId = () => `rem-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

// Helper: Get user info for responses
async function getUserSummary(db: D1Database, userId: string) {
  const user = await db.prepare(`
    SELECT id, displayName, avatar, title, department FROM users WHERE id = ?
  `).bind(userId).first();
  return user || { id: userId, displayName: 'Unknown User' };
}

// Helper: Get category info
async function getCategory(db: D1Database, categoryId: string) {
  return await db.prepare(`
    SELECT * FROM calendar_categories WHERE id = ?
  `).bind(categoryId).first();
}

// Helper: Check if user can manage event
async function canManageEvent(db: D1Database, eventId: string, userId: string, userRole: string): Promise<boolean> {
  const event = await db.prepare(`SELECT organizerId FROM calendar_events WHERE id = ?`).bind(eventId).first();
  if (!event) return false;
  if (event.organizerId === userId) return true;
  if (['admin', 'super_admin', 'director'].includes(userRole)) return true;
  return false;
}

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

// GET /calendar/holidays - Get Ghana public holidays
calendar.get('/holidays', async (c) => {
  const db = c.env.DB;
  const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());

  try {
    const holidays = await db.prepare(`
      SELECT * FROM calendar_holidays
      WHERE year = ?
      ORDER BY date ASC
    `).bind(year).all();

    return c.json({
      holidays: holidays.results || [],
      year,
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return c.json({ error: 'Failed to fetch holidays' }, 500);
  }
});

// GET /calendar/categories - Get event categories
calendar.get('/categories', async (c) => {
  const db = c.env.DB;

  try {
    const categories = await db.prepare(`
      SELECT * FROM calendar_categories
      ORDER BY sortOrder ASC
    `).all();

    return c.json({ categories: categories.results || [] });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// GET /calendar/events/public - Get public events (no auth required)
calendar.get('/events/public', async (c) => {
  const db = c.env.DB;
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

  try {
    let query = `
      SELECT e.*, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon,
             u.displayName as organizerName, u.avatar as organizerAvatar
      FROM calendar_events e
      LEFT JOIN calendar_categories c ON e.categoryId = c.id
      LEFT JOIN users u ON e.organizerId = u.id
      WHERE e.visibility = 'public' AND e.status IN ('scheduled', 'live')
    `;
    const params: any[] = [];

    if (startDate) {
      query += ` AND e.endDate >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND e.startDate <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY e.startDate ASC LIMIT ?`;
    params.push(limit);

    const events = await db.prepare(query).bind(...params).all();

    // Format events
    const formattedEvents = (events.results || []).map((e: any) => ({
      ...e,
      category: e.categoryId ? {
        id: e.categoryId,
        name: e.categoryName,
        color: e.categoryColor,
        icon: e.categoryIcon,
      } : null,
      organizer: {
        id: e.organizerId,
        displayName: e.organizerName,
        avatar: e.organizerAvatar,
      },
      tags: e.tags ? JSON.parse(e.tags) : [],
      attachments: e.attachments ? JSON.parse(e.attachments) : [],
    }));

    return c.json({ events: formattedEvents });
  } catch (error) {
    console.error('Error fetching public events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// ============================================================================
// AUTHENTICATED ENDPOINTS
// ============================================================================

// GET /calendar/events - List events with filters
calendar.get('/events', optionalAuth, async (c) => {
  const db = c.env.DB;
  const user = c.get('user'); // May be null if not authenticated
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const categories = c.req.query('categories')?.split(',').filter(Boolean);
  const eventTypes = c.req.query('eventTypes')?.split(',').filter(Boolean);
  const status = c.req.query('status');
  const search = c.req.query('search');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = (page - 1) * limit;

  try {
    let whereConditions: string[];
    let params: any[];

    if (user) {
      // Authenticated user - show public events + their own events + events they're attending
      whereConditions = [`(
        e.visibility = 'public' OR
        e.organizerId = ? OR
        e.visibility = 'department' OR
        EXISTS (SELECT 1 FROM calendar_attendees WHERE eventId = e.id AND userId = ?) OR
        EXISTS (SELECT 1 FROM group_members WHERE groupId = e.groupId AND userId = ?)
      )`];
      params = [user.id, user.id, user.id];
    } else {
      // Unauthenticated user - show only public events
      whereConditions = [`e.visibility = 'public'`];
      params = [];
    }

    if (startDate) {
      whereConditions.push(`e.endDate >= ?`);
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push(`e.startDate <= ?`);
      params.push(endDate);
    }
    if (categories?.length) {
      whereConditions.push(`e.categoryId IN (${categories.map(() => '?').join(',')})`);
      params.push(...categories);
    }
    if (eventTypes?.length) {
      whereConditions.push(`e.eventType IN (${eventTypes.map(() => '?').join(',')})`);
      params.push(...eventTypes);
    }
    if (status) {
      whereConditions.push(`e.status = ?`);
      params.push(status);
    }
    if (search) {
      whereConditions.push(`(e.title LIKE ? OR e.description LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total FROM calendar_events e
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countResult = await db.prepare(countQuery).bind(...params).first();
    const total = (countResult as any)?.total || 0;

    // Fetch events - conditionally join attendees table only for authenticated users
    let query: string;

    if (user) {
      query = `
        SELECT e.*, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon, c.slug as categorySlug,
               u.displayName as organizerName, u.avatar as organizerAvatar, u.jobTitle as organizerTitle,
               a.status as myRsvpStatus, a.role as myRole
        FROM calendar_events e
        LEFT JOIN calendar_categories c ON e.categoryId = c.id
        LEFT JOIN users u ON e.organizerId = u.id
        LEFT JOIN calendar_attendees a ON a.eventId = e.id AND a.userId = ?
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY e.startDate ASC
        LIMIT ? OFFSET ?
      `;
      params.unshift(user.id); // Add user.id for attendee join
    } else {
      query = `
        SELECT e.*, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon, c.slug as categorySlug,
               u.displayName as organizerName, u.avatar as organizerAvatar, u.jobTitle as organizerTitle,
               NULL as myRsvpStatus, NULL as myRole
        FROM calendar_events e
        LEFT JOIN calendar_categories c ON e.categoryId = c.id
        LEFT JOIN users u ON e.organizerId = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY e.startDate ASC
        LIMIT ? OFFSET ?
      `;
    }
    params.push(limit, offset);

    const events = await db.prepare(query).bind(...params).all();

    // Format events
    const formattedEvents = (events.results || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      startDate: e.startDate,
      endDate: e.endDate,
      isAllDay: !!e.isAllDay,
      timezone: e.timezone,
      location: e.location,
      locationUrl: e.locationUrl,
      isVirtual: !!e.isVirtual,
      meetingUrl: e.meetingUrl,
      meetingProvider: e.meetingProvider,
      capacity: e.capacity,
      registrationRequired: !!e.registrationRequired,
      registrationDeadline: e.registrationDeadline,
      waitlistEnabled: !!e.waitlistEnabled,
      attendeeCount: e.attendeeCount || 0,
      isRecurring: !!e.isRecurring,
      recurrenceRule: e.recurrenceRule,
      visibility: e.visibility,
      status: e.status,
      xpReward: e.xpReward || 0,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      category: e.categoryId ? {
        id: e.categoryId,
        name: e.categoryName,
        slug: e.categorySlug,
        color: e.categoryColor,
        icon: e.categoryIcon,
      } : null,
      organizer: {
        id: e.organizerId,
        displayName: e.organizerName,
        avatar: e.organizerAvatar,
        title: e.organizerTitle,
      },
      isRegistered: !!e.myRsvpStatus,
      myRsvpStatus: e.myRsvpStatus,
      myRole: e.myRole,
      tags: e.tags ? JSON.parse(e.tags) : [],
    }));

    return c.json({
      events: formattedEvents,
      total,
      page,
      limit,
      hasMore: offset + formattedEvents.length < total,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// GET /calendar/my-events - Get user's events (created + attending)
calendar.get('/my-events', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const filter = c.req.query('filter') || 'all'; // all, created, attending
  const status = c.req.query('status'); // upcoming, past
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

  try {
    let query = `
      SELECT DISTINCT e.*, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon,
             u.displayName as organizerName, u.avatar as organizerAvatar,
             a.status as myRsvpStatus, a.role as myRole
      FROM calendar_events e
      LEFT JOIN calendar_categories c ON e.categoryId = c.id
      LEFT JOIN users u ON e.organizerId = u.id
      LEFT JOIN calendar_attendees a ON a.eventId = e.id AND a.userId = ?
      WHERE e.status != 'cancelled'
    `;
    const params: any[] = [user.id];

    if (filter === 'created') {
      query += ` AND e.organizerId = ?`;
      params.push(user.id);
    } else if (filter === 'attending') {
      query += ` AND a.userId = ? AND a.status IN ('accepted', 'tentative')`;
      params.push(user.id);
    } else {
      query += ` AND (e.organizerId = ? OR a.userId = ?)`;
      params.push(user.id, user.id);
    }

    const now = new Date().toISOString();
    if (status === 'upcoming') {
      query += ` AND e.startDate >= ?`;
      params.push(now);
    } else if (status === 'past') {
      query += ` AND e.endDate < ?`;
      params.push(now);
    }

    query += ` ORDER BY e.startDate ${status === 'past' ? 'DESC' : 'ASC'} LIMIT ?`;
    params.push(limit);

    const events = await db.prepare(query).bind(...params).all();

    const formattedEvents = (events.results || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      startDate: e.startDate,
      endDate: e.endDate,
      isAllDay: !!e.isAllDay,
      location: e.location,
      isVirtual: !!e.isVirtual,
      meetingUrl: e.meetingUrl,
      attendeeCount: e.attendeeCount || 0,
      status: e.status,
      category: e.categoryId ? {
        id: e.categoryId,
        name: e.categoryName,
        color: e.categoryColor,
        icon: e.categoryIcon,
      } : null,
      organizer: {
        id: e.organizerId,
        displayName: e.organizerName,
        avatar: e.organizerAvatar,
      },
      isRegistered: !!e.myRsvpStatus,
      myRsvpStatus: e.myRsvpStatus,
      myRole: e.myRole || (e.organizerId === user.id ? 'organizer' : undefined),
    }));

    return c.json({ events: formattedEvents });
  } catch (error) {
    console.error('Error fetching my events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// GET /calendar/feed - Get unified calendar feed (events + holidays + LMS)
calendar.get('/feed', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const startDate = c.req.query('startDate') || new Date().toISOString().split('T')[0];
  const endDate = c.req.query('endDate');
  const includeHolidays = c.req.query('includeHolidays') !== 'false';
  const includeLms = c.req.query('includeLms') !== 'false';

  try {
    // Fetch user's calendar events
    const eventsQuery = `
      SELECT e.*, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon,
             u.displayName as organizerName, u.avatar as organizerAvatar,
             a.status as myRsvpStatus
      FROM calendar_events e
      LEFT JOIN calendar_categories c ON e.categoryId = c.id
      LEFT JOIN users u ON e.organizerId = u.id
      LEFT JOIN calendar_attendees a ON a.eventId = e.id AND a.userId = ?
      WHERE e.status IN ('scheduled', 'live')
        AND (e.visibility = 'public' OR e.organizerId = ? OR a.userId = ?)
        AND e.endDate >= ?
        ${endDate ? 'AND e.startDate <= ?' : ''}
      ORDER BY e.startDate ASC
    `;
    const eventParams = [user.id, user.id, user.id, startDate];
    if (endDate) eventParams.push(endDate);

    const events = await db.prepare(eventsQuery).bind(...eventParams).all();

    // Fetch holidays if requested
    let holidays: any[] = [];
    if (includeHolidays) {
      const year = new Date(startDate).getFullYear();
      const holidaysResult = await db.prepare(`
        SELECT * FROM calendar_holidays WHERE year IN (?, ?) ORDER BY date ASC
      `).bind(year, year + 1).all();
      holidays = holidaysResult.results || [];
    }

    // Fetch LMS deadlines if requested
    let lmsDeadlines: any[] = [];
    if (includeLms) {
      const lmsQuery = `
        SELECT a.id, a.title, a.dueDate as startDate, a.dueDate as endDate,
               'deadline' as eventType, c.title as courseTitle, c.id as courseId
        FROM lms_assignments a
        JOIN lms_courses c ON a.courseId = c.id
        JOIN lms_enrollments e ON e.courseId = c.id AND e.userId = ?
        WHERE a.dueDate >= ? AND e.status = 'active'
        ORDER BY a.dueDate ASC
      `;
      const lmsResult = await db.prepare(lmsQuery).bind(user.id, startDate).all();
      lmsDeadlines = (lmsResult.results || []).map((d: any) => ({
        id: `lms-${d.id}`,
        title: d.title,
        description: `Assignment for ${d.courseTitle}`,
        startDate: d.startDate,
        endDate: d.endDate,
        eventType: 'deadline',
        isAllDay: true,
        sourceType: 'lms_assignment',
        sourceId: d.id,
        category: {
          id: 'cat-deadline',
          name: 'Deadline',
          color: '#EF4444',
          icon: 'clock',
        },
      }));
    }

    // Format calendar events
    const formattedEvents = (events.results || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.eventType,
      startDate: e.startDate,
      endDate: e.endDate,
      isAllDay: !!e.isAllDay,
      location: e.location,
      isVirtual: !!e.isVirtual,
      meetingUrl: e.meetingUrl,
      status: e.status,
      category: e.categoryId ? {
        id: e.categoryId,
        name: e.categoryName,
        color: e.categoryColor,
        icon: e.categoryIcon,
      } : null,
      organizer: {
        id: e.organizerId,
        displayName: e.organizerName,
        avatar: e.organizerAvatar,
      },
      isRegistered: !!e.myRsvpStatus,
      myRsvpStatus: e.myRsvpStatus,
    }));

    return c.json({
      events: formattedEvents,
      holidays,
      lmsDeadlines,
    });
  } catch (error) {
    console.error('Error fetching calendar feed:', error);
    return c.json({ error: 'Failed to fetch calendar feed' }, 500);
  }
});

// GET /calendar/events/:id - Get event details
calendar.get('/events/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const eventId = c.req.param('id');

  try {
    const event = await db.prepare(`
      SELECT e.*, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon, c.slug as categorySlug,
             u.displayName as organizerName, u.avatar as organizerAvatar, u.jobTitle as organizerTitle, u.department as organizerDepartment,
             a.status as myRsvpStatus, a.role as myRole
      FROM calendar_events e
      LEFT JOIN calendar_categories c ON e.categoryId = c.id
      LEFT JOIN users u ON e.organizerId = u.id
      LEFT JOIN calendar_attendees a ON a.eventId = e.id AND a.userId = ?
      WHERE e.id = ?
    `).bind(user.id, eventId).first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Check visibility
    if (event.visibility === 'private' && event.organizerId !== user.id && !event.myRsvpStatus) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get attendee count breakdown
    const attendeeStats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined,
        SUM(CASE WHEN status = 'waitlisted' THEN 1 ELSE 0 END) as waitlisted
      FROM calendar_attendees WHERE eventId = ?
    `).bind(eventId).first();

    // Get user's reminders for this event
    const reminders = await db.prepare(`
      SELECT * FROM calendar_reminders WHERE eventId = ? AND userId = ?
    `).bind(eventId, user.id).all();

    const formattedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      isAllDay: !!event.isAllDay,
      timezone: event.timezone,
      location: event.location,
      locationUrl: event.locationUrl,
      isVirtual: !!event.isVirtual,
      meetingUrl: event.meetingUrl,
      meetingProvider: event.meetingProvider,
      capacity: event.capacity,
      registrationRequired: !!event.registrationRequired,
      registrationDeadline: event.registrationDeadline,
      waitlistEnabled: !!event.waitlistEnabled,
      attendeeCount: event.attendeeCount || 0,
      isRecurring: !!event.isRecurring,
      recurrenceRule: event.recurrenceRule,
      recurrenceEndDate: event.recurrenceEndDate,
      visibility: event.visibility,
      status: event.status,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      groupId: event.groupId,
      xpReward: event.xpReward || 0,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      category: event.categoryId ? {
        id: event.categoryId,
        name: event.categoryName,
        slug: event.categorySlug,
        color: event.categoryColor,
        icon: event.categoryIcon,
      } : null,
      organizer: {
        id: event.organizerId,
        displayName: event.organizerName,
        avatar: event.organizerAvatar,
        title: event.organizerTitle,
        department: event.organizerDepartment,
      },
      isRegistered: !!event.myRsvpStatus,
      myRsvpStatus: event.myRsvpStatus,
      myRole: event.myRole || (event.organizerId === user.id ? 'organizer' : undefined),
      isOrganizer: event.organizerId === user.id,
      tags: event.tags ? JSON.parse(event.tags) : [],
      attachments: event.attachments ? JSON.parse(event.attachments) : [],
      attendeeStats: attendeeStats || { total: 0, accepted: 0, pending: 0, declined: 0, waitlisted: 0 },
      myReminders: reminders.results || [],
    };

    return c.json({ event: formattedEvent });
  } catch (error) {
    console.error('Error fetching event:', error);
    return c.json({ error: 'Failed to fetch event' }, 500);
  }
});

// POST /calendar/events - Create event
calendar.post('/events', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const {
      title,
      description,
      categoryId,
      eventType = 'general',
      startDate,
      endDate,
      isAllDay = false,
      timezone = 'Africa/Accra',
      location,
      locationUrl,
      isVirtual = false,
      meetingUrl,
      meetingProvider,
      capacity,
      registrationRequired = false,
      registrationDeadline,
      waitlistEnabled = true,
      isRecurring = false,
      recurrenceRule,
      recurrenceEndDate,
      visibility = 'public',
      status = 'scheduled',
      groupId,
      tags = [],
      xpReward = 0,
    } = body;

    if (!title || !startDate || !endDate) {
      return c.json({ error: 'Title, start date, and end date are required' }, 400);
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate) && !isAllDay) {
      return c.json({ error: 'End date must be after start date' }, 400);
    }

    const eventId = generateEventId();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO calendar_events (
        id, title, description, categoryId, organizerId, eventType,
        startDate, endDate, isAllDay, timezone,
        location, locationUrl, isVirtual, meetingUrl, meetingProvider,
        capacity, registrationRequired, registrationDeadline, waitlistEnabled,
        isRecurring, recurrenceRule, recurrenceEndDate,
        visibility, status, groupId, tags, xpReward, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      eventId, title, description || null, categoryId || null, user.id, eventType,
      startDate, endDate, isAllDay ? 1 : 0, timezone,
      location || null, locationUrl || null, isVirtual ? 1 : 0, meetingUrl || null, meetingProvider || null,
      capacity || null, registrationRequired ? 1 : 0, registrationDeadline || null, waitlistEnabled ? 1 : 0,
      isRecurring ? 1 : 0, recurrenceRule || null, recurrenceEndDate || null,
      visibility, status, groupId || null, JSON.stringify(tags), xpReward, now, now
    ).run();

    // Auto-register organizer as attendee
    await db.prepare(`
      INSERT INTO calendar_attendees (id, eventId, userId, status, role, registeredAt, respondedAt)
      VALUES (?, ?, ?, 'accepted', 'organizer', ?, ?)
    `).bind(generateAtendeeId(), eventId, user.id, now, now).run();

    // Get created event
    const event = await db.prepare(`
      SELECT e.*, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon
      FROM calendar_events e
      LEFT JOIN calendar_categories c ON e.categoryId = c.id
      WHERE e.id = ?
    `).bind(eventId).first();

    return c.json({
      message: 'Event created successfully',
      event: {
        ...event,
        category: event?.categoryId ? {
          id: event.categoryId,
          name: event.categoryName,
          color: event.categoryColor,
          icon: event.categoryIcon,
        } : null,
        organizer: await getUserSummary(db, user.id),
        isRegistered: true,
        myRsvpStatus: 'accepted',
        myRole: 'organizer',
      },
    }, 201);
  } catch (error) {
    console.error('Error creating event:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

// PUT /calendar/events/:id - Update event
calendar.put('/events/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const eventId = c.req.param('id');

  try {
    // Check permission
    if (!await canManageEvent(db, eventId, user.id, user.role)) {
      return c.json({ error: 'Permission denied' }, 403);
    }

    const body = await c.req.json();
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'title', 'description', 'categoryId', 'eventType',
      'startDate', 'endDate', 'isAllDay', 'timezone',
      'location', 'locationUrl', 'isVirtual', 'meetingUrl', 'meetingProvider',
      'capacity', 'registrationRequired', 'registrationDeadline', 'waitlistEnabled',
      'isRecurring', 'recurrenceRule', 'recurrenceEndDate',
      'visibility', 'status', 'xpReward',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'tags') {
          updates.push(`${field} = ?`);
          values.push(JSON.stringify(body[field]));
        } else if (['isAllDay', 'isVirtual', 'registrationRequired', 'waitlistEnabled', 'isRecurring'].includes(field)) {
          updates.push(`${field} = ?`);
          values.push(body[field] ? 1 : 0);
        } else {
          updates.push(`${field} = ?`);
          values.push(body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(eventId);

    await db.prepare(`
      UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    return c.json({ error: 'Failed to update event' }, 500);
  }
});

// DELETE /calendar/events/:id - Delete event
calendar.delete('/events/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const eventId = c.req.param('id');

  try {
    if (!await canManageEvent(db, eventId, user.id, user.role)) {
      return c.json({ error: 'Permission denied' }, 403);
    }

    // Delete event (cascades to attendees and reminders)
    await db.prepare(`DELETE FROM calendar_events WHERE id = ?`).bind(eventId).run();

    return c.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return c.json({ error: 'Failed to delete event' }, 500);
  }
});

// ============================================================================
// REGISTRATION ENDPOINTS
// ============================================================================

// POST /calendar/events/:id/register - Register for event
calendar.post('/events/:id/register', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const eventId = c.req.param('id');

  try {
    // Get event
    const event = await db.prepare(`
      SELECT * FROM calendar_events WHERE id = ?
    `).bind(eventId).first();

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    if (event.status === 'cancelled') {
      return c.json({ error: 'Event has been cancelled' }, 400);
    }

    // Check if already registered
    const existing = await db.prepare(`
      SELECT * FROM calendar_attendees WHERE eventId = ? AND userId = ?
    `).bind(eventId, user.id).first();

    if (existing) {
      return c.json({ error: 'Already registered for this event' }, 400);
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return c.json({ error: 'Registration deadline has passed' }, 400);
    }

    // Check capacity
    let status = 'accepted';
    let waitlistPosition = null;

    if (event.capacity) {
      const acceptedCount = await db.prepare(`
        SELECT COUNT(*) as count FROM calendar_attendees
        WHERE eventId = ? AND status = 'accepted'
      `).bind(eventId).first();

      if ((acceptedCount as any)?.count >= event.capacity) {
        if (event.waitlistEnabled) {
          status = 'waitlisted';
          const maxPosition = await db.prepare(`
            SELECT MAX(waitlistPosition) as max FROM calendar_attendees
            WHERE eventId = ? AND status = 'waitlisted'
          `).bind(eventId).first();
          waitlistPosition = ((maxPosition as any)?.max || 0) + 1;
        } else {
          return c.json({ error: 'Event is at full capacity' }, 400);
        }
      }
    }

    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO calendar_attendees (id, eventId, userId, status, role, registeredAt, respondedAt, waitlistPosition)
      VALUES (?, ?, ?, ?, 'attendee', ?, ?, ?)
    `).bind(generateAtendeeId(), eventId, user.id, status, now, now, waitlistPosition).run();

    // Update attendee count
    await db.prepare(`
      UPDATE calendar_events SET attendeeCount = attendeeCount + 1 WHERE id = ?
    `).bind(eventId).run();

    return c.json({
      message: status === 'waitlisted' ? 'Added to waitlist' : 'Registration successful',
      status,
      waitlistPosition,
    }, 201);
  } catch (error) {
    console.error('Error registering for event:', error);
    return c.json({ error: 'Failed to register' }, 500);
  }
});

// DELETE /calendar/events/:id/register - Cancel registration
calendar.delete('/events/:id/register', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const eventId = c.req.param('id');

  try {
    const attendee = await db.prepare(`
      SELECT * FROM calendar_attendees WHERE eventId = ? AND userId = ?
    `).bind(eventId, user.id).first();

    if (!attendee) {
      return c.json({ error: 'Not registered for this event' }, 404);
    }

    if (attendee.role === 'organizer') {
      return c.json({ error: 'Organizer cannot cancel registration' }, 400);
    }

    await db.prepare(`
      DELETE FROM calendar_attendees WHERE eventId = ? AND userId = ?
    `).bind(eventId, user.id).run();

    // Update attendee count
    await db.prepare(`
      UPDATE calendar_events SET attendeeCount = MAX(0, attendeeCount - 1) WHERE id = ?
    `).bind(eventId).run();

    // If someone was accepted, promote from waitlist
    if (attendee.status === 'accepted') {
      const nextInLine = await db.prepare(`
        SELECT id, userId FROM calendar_attendees
        WHERE eventId = ? AND status = 'waitlisted'
        ORDER BY waitlistPosition ASC LIMIT 1
      `).bind(eventId).first();

      if (nextInLine) {
        await db.prepare(`
          UPDATE calendar_attendees SET status = 'accepted', waitlistPosition = NULL
          WHERE id = ?
        `).bind(nextInLine.id).run();

        // TODO: Send notification to promoted user
      }
    }

    return c.json({ message: 'Registration cancelled' });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return c.json({ error: 'Failed to cancel registration' }, 500);
  }
});

// PUT /calendar/events/:id/rsvp - Update RSVP status
calendar.put('/events/:id/rsvp', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const eventId = c.req.param('id');

  try {
    const { status, notes } = await c.req.json();

    if (!['accepted', 'declined', 'tentative'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    const attendee = await db.prepare(`
      SELECT * FROM calendar_attendees WHERE eventId = ? AND userId = ?
    `).bind(eventId, user.id).first();

    if (!attendee) {
      return c.json({ error: 'Not registered for this event' }, 404);
    }

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE calendar_attendees
      SET status = ?, notes = ?, respondedAt = ?
      WHERE eventId = ? AND userId = ?
    `).bind(status, notes || null, now, eventId, user.id).run();

    return c.json({ message: 'RSVP updated', status });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return c.json({ error: 'Failed to update RSVP' }, 500);
  }
});

// GET /calendar/events/:id/attendees - Get event attendees
calendar.get('/events/:id/attendees', authMiddleware, async (c) => {
  const db = c.env.DB;
  const eventId = c.req.param('id');
  const status = c.req.query('status');

  try {
    let query = `
      SELECT a.*, u.displayName, u.avatar, u.jobTitle, u.department
      FROM calendar_attendees a
      JOIN users u ON a.userId = u.id
      WHERE a.eventId = ?
    `;
    const params: any[] = [eventId];

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY a.registeredAt ASC`;

    const attendees = await db.prepare(query).bind(...params).all();

    const formattedAttendees = (attendees.results || []).map((a: any) => ({
      id: a.id,
      eventId: a.eventId,
      userId: a.userId,
      status: a.status,
      role: a.role,
      registeredAt: a.registeredAt,
      respondedAt: a.respondedAt,
      checkedInAt: a.checkedInAt,
      waitlistPosition: a.waitlistPosition,
      user: {
        id: a.userId,
        displayName: a.displayName,
        avatar: a.avatar,
        title: a.title,
        department: a.department,
      },
    }));

    // Get stats
    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined,
        SUM(CASE WHEN status = 'waitlisted' THEN 1 ELSE 0 END) as waitlisted
      FROM calendar_attendees WHERE eventId = ?
    `).bind(eventId).first();

    return c.json({
      attendees: formattedAttendees,
      ...stats,
    });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return c.json({ error: 'Failed to fetch attendees' }, 500);
  }
});

// POST /calendar/events/:id/check-in - Check in to event
calendar.post('/events/:id/check-in', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const eventId = c.req.param('id');

  try {
    const attendee = await db.prepare(`
      SELECT * FROM calendar_attendees WHERE eventId = ? AND userId = ?
    `).bind(eventId, user.id).first();

    if (!attendee) {
      return c.json({ error: 'Not registered for this event' }, 404);
    }

    if (attendee.checkedInAt) {
      return c.json({ error: 'Already checked in' }, 400);
    }

    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE calendar_attendees SET checkedInAt = ? WHERE eventId = ? AND userId = ?
    `).bind(now, eventId, user.id).run();

    // Award XP if event has XP reward
    const event = await db.prepare(`SELECT xpReward FROM calendar_events WHERE id = ?`).bind(eventId).first();
    if (event?.xpReward > 0) {
      // TODO: Award XP using gamification service
    }

    return c.json({ message: 'Check-in successful', checkedInAt: now });
  } catch (error) {
    console.error('Error checking in:', error);
    return c.json({ error: 'Failed to check in' }, 500);
  }
});

// ============================================================================
// REMINDER ENDPOINTS
// ============================================================================

// GET /calendar/reminders - Get user's reminders
calendar.get('/reminders', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    const reminders = await db.prepare(`
      SELECT r.*, e.title as eventTitle, e.startDate as eventStartDate
      FROM calendar_reminders r
      JOIN calendar_events e ON r.eventId = e.id
      WHERE r.userId = ? AND r.isSent = 0
      ORDER BY e.startDate ASC
    `).bind(user.id).all();

    return c.json({ reminders: reminders.results || [] });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return c.json({ error: 'Failed to fetch reminders' }, 500);
  }
});

// POST /calendar/events/:id/reminders - Set event reminder
calendar.post('/events/:id/reminders', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const eventId = c.req.param('id');

  try {
    const { minutesBefore, reminderType = 'notification' } = await c.req.json();

    if (!minutesBefore || minutesBefore < 0) {
      return c.json({ error: 'Invalid reminder time' }, 400);
    }

    // Check if event exists
    const event = await db.prepare(`SELECT id FROM calendar_events WHERE id = ?`).bind(eventId).first();
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const now = new Date().toISOString();
    await db.prepare(`
      INSERT OR REPLACE INTO calendar_reminders (id, eventId, userId, reminderType, minutesBefore, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(generateReminderId(), eventId, user.id, reminderType, minutesBefore, now).run();

    return c.json({ message: 'Reminder set successfully' }, 201);
  } catch (error) {
    console.error('Error setting reminder:', error);
    return c.json({ error: 'Failed to set reminder' }, 500);
  }
});

// DELETE /calendar/reminders/:id - Delete reminder
calendar.delete('/reminders/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const reminderId = c.req.param('id');

  try {
    await db.prepare(`
      DELETE FROM calendar_reminders WHERE id = ? AND userId = ?
    `).bind(reminderId, user.id).run();

    return c.json({ message: 'Reminder deleted' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return c.json({ error: 'Failed to delete reminder' }, 500);
  }
});

// ============================================================================
// SETTINGS ENDPOINTS
// ============================================================================

// GET /calendar/settings - Get user's calendar settings
calendar.get('/settings', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    let settings = await db.prepare(`
      SELECT * FROM calendar_settings WHERE userId = ?
    `).bind(user.id).first();

    // Return defaults if no settings exist
    if (!settings) {
      settings = {
        userId: user.id,
        defaultView: 'month',
        weekStartsOn: 1,
        showWeekends: 1,
        workingHoursStart: '08:00',
        workingHoursEnd: '17:00',
        defaultReminders: '[15, 60, 1440]',
        syncLmsDeadlines: 1,
        syncGroupEvents: 1,
        showHolidays: 1,
        timezone: 'Africa/Accra',
      };
    }

    return c.json({
      settings: {
        ...settings,
        showWeekends: !!settings.showWeekends,
        syncLmsDeadlines: !!settings.syncLmsDeadlines,
        syncGroupEvents: !!settings.syncGroupEvents,
        showHolidays: !!settings.showHolidays,
        defaultReminders: JSON.parse(settings.defaultReminders as string || '[15, 60, 1440]'),
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// PUT /calendar/settings - Update calendar settings
calendar.put('/settings', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO calendar_settings (
        userId, defaultView, weekStartsOn, showWeekends,
        workingHoursStart, workingHoursEnd, defaultReminders,
        syncLmsDeadlines, syncGroupEvents, showHolidays, timezone, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        defaultView = COALESCE(?, defaultView),
        weekStartsOn = COALESCE(?, weekStartsOn),
        showWeekends = COALESCE(?, showWeekends),
        workingHoursStart = COALESCE(?, workingHoursStart),
        workingHoursEnd = COALESCE(?, workingHoursEnd),
        defaultReminders = COALESCE(?, defaultReminders),
        syncLmsDeadlines = COALESCE(?, syncLmsDeadlines),
        syncGroupEvents = COALESCE(?, syncGroupEvents),
        showHolidays = COALESCE(?, showHolidays),
        timezone = COALESCE(?, timezone),
        updatedAt = ?
    `).bind(
      user.id,
      body.defaultView || 'month',
      body.weekStartsOn ?? 1,
      body.showWeekends !== undefined ? (body.showWeekends ? 1 : 0) : 1,
      body.workingHoursStart || '08:00',
      body.workingHoursEnd || '17:00',
      body.defaultReminders ? JSON.stringify(body.defaultReminders) : '[15, 60, 1440]',
      body.syncLmsDeadlines !== undefined ? (body.syncLmsDeadlines ? 1 : 0) : 1,
      body.syncGroupEvents !== undefined ? (body.syncGroupEvents ? 1 : 0) : 1,
      body.showHolidays !== undefined ? (body.showHolidays ? 1 : 0) : 1,
      body.timezone || 'Africa/Accra',
      now,
      body.defaultView,
      body.weekStartsOn,
      body.showWeekends !== undefined ? (body.showWeekends ? 1 : 0) : null,
      body.workingHoursStart,
      body.workingHoursEnd,
      body.defaultReminders ? JSON.stringify(body.defaultReminders) : null,
      body.syncLmsDeadlines !== undefined ? (body.syncLmsDeadlines ? 1 : 0) : null,
      body.syncGroupEvents !== undefined ? (body.syncGroupEvents ? 1 : 0) : null,
      body.showHolidays !== undefined ? (body.showHolidays ? 1 : 0) : null,
      body.timezone,
      now
    ).run();

    return c.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// POST /calendar/holidays - Add holiday (admin only)
calendar.post('/holidays', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');

  if (!['admin', 'super_admin'].includes(user.role)) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  try {
    const { name, date, year, type = 'public', description } = await c.req.json();

    if (!name || !date || !year) {
      return c.json({ error: 'Name, date, and year are required' }, 400);
    }

    const id = `hol-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${year}`;

    await db.prepare(`
      INSERT OR REPLACE INTO calendar_holidays (id, name, date, year, type, description, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, date, year, type, description || null, new Date().toISOString()).run();

    return c.json({ message: 'Holiday added successfully', id }, 201);
  } catch (error) {
    console.error('Error adding holiday:', error);
    return c.json({ error: 'Failed to add holiday' }, 500);
  }
});

// DELETE /calendar/holidays/:id - Delete holiday (admin only)
calendar.delete('/holidays/:id', authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  const holidayId = c.req.param('id');

  if (!['admin', 'super_admin'].includes(user.role)) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  try {
    await db.prepare(`DELETE FROM calendar_holidays WHERE id = ?`).bind(holidayId).run();
    return c.json({ message: 'Holiday deleted' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return c.json({ error: 'Failed to delete holiday' }, 500);
  }
});

export const calendarRoutes = calendar;
