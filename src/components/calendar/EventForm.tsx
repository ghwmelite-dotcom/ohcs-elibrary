/**
 * Event Form Component
 * Responsive form - bottom sheet on mobile, centered modal on desktop
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Video, Users, Star, Plus, ChevronDown } from 'lucide-react';
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

const eventTypes: { value: EventType; label: string; color: string }[] = [
  { value: 'training', label: 'Training', color: CATEGORY_COLORS.training },
  { value: 'webinar', label: 'Webinar', color: CATEGORY_COLORS.webinar },
  { value: 'workshop', label: 'Workshop', color: CATEGORY_COLORS.workshop },
  { value: 'meeting', label: 'Meeting', color: CATEGORY_COLORS.meeting },
  { value: 'deadline', label: 'Deadline', color: CATEGORY_COLORS.deadline },
  { value: 'personal', label: 'Personal', color: CATEGORY_COLORS.personal },
  { value: 'general', label: 'General', color: CATEGORY_COLORS.general },
];

const visibilityOptions: { value: EventVisibility; label: string; desc: string }[] = [
  { value: 'public', label: 'Public', desc: 'Anyone can see' },
  { value: 'department', label: 'Department', desc: 'Your department only' },
  { value: 'group', label: 'Group', desc: 'Group members only' },
  { value: 'private', label: 'Private', desc: 'Only you' },
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      setShowAdvanced(false);
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

  const selectedTypeColor = CATEGORY_COLORS[eventType] || CATEGORY_COLORS.general;

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

          {/* Modal - Bottom sheet on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-[95%] sm:max-w-2xl"
          >
            <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
              {/* Drag Handle - Mobile */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="relative px-4 sm:px-6 pt-2 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
                {/* Color accent based on event type */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 sm:rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, ${selectedTypeColor}, ${selectedTypeColor}88)` }}
                />

                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white pr-10">
                  {isEditing ? 'Edit Event' : 'New Event'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {isEditing ? 'Update event details' : 'Create a new calendar event'}
                </p>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 sm:space-y-5">
                {/* Title */}
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Event title"
                    className="w-full px-0 py-2 text-lg sm:text-xl font-semibold border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:border-ghana-green focus:ring-0 transition-colors"
                  />
                </div>

                {/* Event Type Pills */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Event Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {eventTypes.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setEventType(type.value)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all
                          ${eventType === type.value
                            ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                            : 'opacity-60 hover:opacity-100'
                          }
                        `}
                        style={{
                          backgroundColor: `${type.color}20`,
                          color: type.color,
                          ...(eventType === type.value && { ringColor: type.color }),
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Time - Responsive Grid */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      When
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-gray-500 dark:text-gray-400">All day</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isAllDay}
                          onChange={(e) => setIsAllDay(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-checked:bg-ghana-green rounded-full transition-colors" />
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow" />
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Start */}
                    <div className="space-y-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Start</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (!endDate) setEndDate(e.target.value);
                        }}
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                      />
                      {!isAllDay && (
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                          />
                        </div>
                      )}
                    </div>

                    {/* End */}
                    <div className="space-y-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">End</span>
                      <input
                        type="date"
                        value={endDate || startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                      />
                      {!isAllDay && (
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    Location
                  </label>

                  {/* Toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setIsVirtual(false)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        !isVirtual
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="hidden sm:inline">In Person</span>
                      <span className="sm:hidden">Physical</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVirtual(true)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isVirtual
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      Virtual
                    </button>
                  </div>

                  {isVirtual ? (
                    <div className="space-y-2">
                      <select
                        value={meetingProvider}
                        onChange={(e) => setMeetingProvider(e.target.value as MeetingProvider)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
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
                        placeholder="Paste meeting link"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Add location"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                    />
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Add event details..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span>Advanced Options</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {/* Advanced Options */}
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-4"
                    >
                      {/* Registration */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            Registration
                          </label>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={registrationRequired}
                              onChange={(e) => setRegistrationRequired(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-checked:bg-ghana-green rounded-full transition-colors cursor-pointer" onClick={() => setRegistrationRequired(!registrationRequired)} />
                            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow pointer-events-none" />
                          </div>
                        </div>

                        {registrationRequired && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-3 space-y-3"
                          >
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Capacity</label>
                              <input
                                type="number"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                min="1"
                                placeholder="Unlimited"
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                              />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={waitlistEnabled}
                                onChange={(e) => setWaitlistEnabled(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-ghana-green focus:ring-ghana-green"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Enable waitlist</span>
                            </label>
                          </motion.div>
                        )}
                      </div>

                      {/* Visibility */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Visibility
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {visibilityOptions.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setVisibility(option.value)}
                              className={`p-3 rounded-xl text-left transition-all ${
                                visibility === option.value
                                  ? 'bg-ghana-green/10 border-2 border-ghana-green'
                                  : 'bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                              }`}
                            >
                              <span className={`block text-sm font-medium ${
                                visibility === option.value ? 'text-ghana-green' : 'text-gray-900 dark:text-white'
                              }`}>
                                {option.label}
                              </span>
                              <span className="block text-xs text-gray-500 dark:text-gray-400">{option.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* XP Reward */}
                      <div className="bg-gradient-to-r from-ghana-gold/10 to-yellow-100/50 dark:from-ghana-gold/20 dark:to-yellow-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                        <label className="text-xs font-semibold text-ghana-gold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <Star className="w-3.5 h-3.5" />
                          XP Reward
                        </label>
                        <input
                          type="number"
                          value={xpReward}
                          onChange={(e) => setXpReward(e.target.value)}
                          min="0"
                          step="5"
                          className="w-full px-3 py-2.5 rounded-xl border border-ghana-gold/30 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-gold focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-ghana-gold/70 mt-1">
                          XP awarded for checking in
                        </p>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Tags
                        </label>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder="Add tag"
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
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

                      {/* Category (from store) */}
                      {categories.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Category
                          </label>
                          <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all"
                          >
                            <option value="">No category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Footer */}
              <div className="flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="order-2 sm:order-1 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSaving || !title || !startDate}
                    className="order-1 sm:order-2 flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-ghana-green hover:bg-ghana-green/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{isEditing ? 'Update Event' : 'Create Event'}</span>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
