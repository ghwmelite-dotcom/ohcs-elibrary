/**
 * Event Form Component
 * Form for creating and editing calendar events
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Video, Users, Repeat, Star, Plus, Trash2 } from 'lucide-react';
import { useCalendarStore } from '@/stores/calendarStore';
import type {
  CalendarEvent,
  CreateEventInput,
  EventType,
  EventVisibility,
  MeetingProvider,
} from '@/types/calendar';
import { CATEGORY_COLORS } from '@/types/calendar';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  onSuccess?: (event: CalendarEvent) => void;
}

const eventTypes: { value: EventType; label: string }[] = [
  { value: 'training', label: 'Training' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'personal', label: 'Personal' },
  { value: 'general', label: 'General' },
];

const visibilityOptions: { value: EventVisibility; label: string }[] = [
  { value: 'public', label: 'Public - Anyone can see' },
  { value: 'department', label: 'Department - Only your department' },
  { value: 'group', label: 'Group - Only group members' },
  { value: 'private', label: 'Private - Only you' },
];

const meetingProviders: { value: MeetingProvider; label: string }[] = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'custom', label: 'Custom Link' },
];

export default function EventForm({
  isOpen,
  onClose,
  event,
  defaultDate,
  onSuccess,
}: EventFormProps) {
  const { createEvent, updateEvent, categories, isSaving } = useCalendarStore();

  const isEditing = !!event;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('general');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingProvider, setMeetingProvider] = useState<MeetingProvider>('zoom');
  const [capacity, setCapacity] = useState('');
  const [registrationRequired, setRegistrationRequired] = useState(false);
  const [waitlistEnabled, setWaitlistEnabled] = useState(true);
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [xpReward, setXpReward] = useState('0');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Initialize form with event data or defaults
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setEventType(event.eventType);
      setCategoryId(event.categoryId || '');

      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
      setIsAllDay(event.isAllDay);
      setLocation(event.location || '');
      setIsVirtual(event.isVirtual);
      setMeetingUrl(event.meetingUrl || '');
      setMeetingProvider(event.meetingProvider || 'zoom');
      setCapacity(event.capacity?.toString() || '');
      setRegistrationRequired(event.registrationRequired);
      setWaitlistEnabled(event.waitlistEnabled);
      setVisibility(event.visibility);
      setXpReward(event.xpReward.toString());
      setIsRecurring(event.isRecurring);
      setRecurrenceRule(event.recurrenceRule || '');
      setTags(event.tags || []);
    } else {
      // Reset to defaults
      const defaultStart = defaultDate || new Date();
      defaultStart.setMinutes(0);
      defaultStart.setSeconds(0);

      const defaultEnd = new Date(defaultStart);
      defaultEnd.setHours(defaultEnd.getHours() + 1);

      setTitle('');
      setDescription('');
      setEventType('general');
      setCategoryId('');
      setStartDate(defaultStart.toISOString().split('T')[0]);
      setStartTime(defaultStart.toTimeString().slice(0, 5));
      setEndDate(defaultStart.toISOString().split('T')[0]);
      setEndTime(defaultEnd.toTimeString().slice(0, 5));
      setIsAllDay(false);
      setLocation('');
      setIsVirtual(false);
      setMeetingUrl('');
      setMeetingProvider('zoom');
      setCapacity('');
      setRegistrationRequired(false);
      setWaitlistEnabled(true);
      setVisibility('public');
      setXpReward('0');
      setIsRecurring(false);
      setRecurrenceRule('');
      setTags([]);
    }
  }, [event, defaultDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = isAllDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`;
    const endDateTime = isAllDay
      ? `${endDate || startDate}T23:59:59`
      : `${endDate || startDate}T${endTime}:00`;

    const eventData: CreateEventInput = {
      title,
      description: description || undefined,
      eventType,
      categoryId: categoryId || undefined,
      startDate: startDateTime,
      endDate: endDateTime,
      isAllDay,
      location: location || undefined,
      isVirtual,
      meetingUrl: isVirtual ? meetingUrl : undefined,
      meetingProvider: isVirtual ? meetingProvider : undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      registrationRequired,
      waitlistEnabled,
      visibility,
      xpReward: parseInt(xpReward) || 0,
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    let result: CalendarEvent | null = null;

    if (isEditing && event) {
      const success = await updateEvent(event.id, eventData);
      if (success) {
        result = { ...event, ...eventData } as CalendarEvent;
      }
    } else {
      result = await createEvent(eventData);
    }

    if (result) {
      onSuccess?.(result);
      onClose();
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter event title"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                  />
                </div>

                {/* Event Type & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Type *
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as EventType)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date & Time *
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-ghana-green focus:ring-ghana-green"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">All day</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (!endDate) setEndDate(e.target.value);
                        }}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                      />
                      {!isAllDay && (
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={endDate || startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                      />
                      {!isAllDay && (
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isVirtual}
                        onChange={() => setIsVirtual(false)}
                        className="w-4 h-4 text-ghana-green focus:ring-ghana-green"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">In Person</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isVirtual}
                        onChange={() => setIsVirtual(true)}
                        className="w-4 h-4 text-ghana-green focus:ring-ghana-green"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        Virtual
                      </span>
                    </label>
                  </div>
                  {isVirtual ? (
                    <div className="space-y-3">
                      <select
                        value={meetingProvider}
                        onChange={(e) => setMeetingProvider(e.target.value as MeetingProvider)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                      >
                        {meetingProviders.map(provider => (
                          <option key={provider.value} value={provider.value}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="url"
                        value={meetingUrl}
                        onChange={(e) => setMeetingUrl(e.target.value)}
                        placeholder="Meeting URL"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter location"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                    />
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Event description..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Registration & Capacity */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={registrationRequired}
                      onChange={(e) => setRegistrationRequired(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-ghana-green focus:ring-ghana-green"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Require Registration
                    </span>
                  </label>

                  {registrationRequired && (
                    <div className="pl-6 space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Capacity (leave empty for unlimited)
                        </label>
                        <input
                          type="number"
                          value={capacity}
                          onChange={(e) => setCapacity(e.target.value)}
                          min="1"
                          placeholder="e.g., 50"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waitlistEnabled}
                          onChange={(e) => setWaitlistEnabled(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-ghana-green focus:ring-ghana-green"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Enable waitlist when full
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as EventVisibility)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                  >
                    {visibilityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* XP Reward */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-ghana-gold" />
                    XP Reward
                  </label>
                  <input
                    type="number"
                    value={xpReward}
                    onChange={(e) => setXpReward(e.target.value)}
                    min="0"
                    step="5"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    XP awarded to attendees who check in to the event
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag"
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || !title || !startDate}
                className="flex items-center gap-2 px-6 py-2 bg-ghana-green hover:bg-ghana-green/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Event' : 'Create Event'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
