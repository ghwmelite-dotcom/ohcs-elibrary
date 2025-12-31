/**
 * Onboarding Tour Types
 */

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
  nextLabel?: string;
  prevLabel?: string;
  skipable?: boolean;
  beforeShow?: () => void;
  afterHide?: () => void;
}

export interface Tour {
  id: string;
  name: string;
  description?: string;
  steps: TourStep[];
  completedAt?: string;
}

export interface OnboardingProgress {
  userId: string;
  completedTours: string[];
  skippedTours: string[];
  currentTourId?: string;
  currentStepIndex?: number;
  startedAt?: string;
  updatedAt: string;
}

// Predefined tours
export const TOURS = {
  WELCOME: 'welcome-tour',
  LIBRARY: 'library-tour',
  FORUM: 'forum-tour',
  SOCIAL: 'social-tour',
  LMS: 'lms-tour',
  CALENDAR: 'calendar-tour',
} as const;

export type TourId = typeof TOURS[keyof typeof TOURS];
