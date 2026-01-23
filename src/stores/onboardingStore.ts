import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TourStep, TourId, OnboardingProgress } from '@/types/onboarding';
import { TOURS } from '@/types/onboarding';

interface OnboardingState {
  // Tour state
  isActive: boolean;
  currentTourId: TourId | null;
  currentStepIndex: number;
  steps: TourStep[];

  // Progress tracking
  progress: OnboardingProgress | null;
  completedTours: Set<TourId>;
  skippedTours: Set<TourId>;

  // Actions
  startTour: (tourId: TourId) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  endTour: () => void;
  resetTours: () => void;
  shouldShowTour: (tourId: TourId) => boolean;

  // Check if first time user
  isFirstTimeUser: boolean;
  setFirstTimeUser: (value: boolean) => void;
}

// Welcome tour steps
const welcomeTourSteps: TourStep[] = [
  {
    id: 'welcome-1',
    title: 'Welcome to OHCS E-Library!',
    content: 'Your comprehensive knowledge hub for Ghana\'s Civil Service. Let\'s take a quick tour to help you get started.',
    target: '[data-tour="header"]',
    position: 'bottom',
    spotlightPadding: 10,
    nextLabel: 'Start Tour',
  },
  {
    id: 'welcome-2',
    title: 'Quick Navigation',
    content: 'Use the sidebar to navigate between different sections of the platform. You can collapse it for more screen space.',
    target: '[data-tour="sidebar"]',
    position: 'right',
    spotlightPadding: 0,
  },
  {
    id: 'welcome-3',
    title: 'Global Search',
    content: 'Press Ctrl+K (or Cmd+K on Mac) anytime to search across documents, forums, users, and more.',
    target: '[data-tour="search"]',
    position: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'welcome-4',
    title: 'Notifications',
    content: 'Stay updated with notifications about forum replies, document updates, and connections. Configure your preferences in Settings.',
    target: '[data-tour="notifications"]',
    position: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'welcome-5',
    title: 'Your Profile',
    content: 'Access your profile, settings, and sign out from here. Complete your profile to connect with colleagues.',
    target: '[data-tour="user-menu"]',
    position: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'welcome-6',
    title: 'XP & Achievements',
    content: 'Earn XP by participating! Read documents, join discussions, complete courses, and climb the leaderboard.',
    target: '[data-tour="xp-display"]',
    position: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'welcome-7',
    title: 'Meet Ozzy',
    content: 'Ozzy is your AI knowledge assistant! Click the icon to ask questions about policies, documents, or get help navigating the platform.',
    target: '[data-tour="ozzy"]',
    position: 'left',
    spotlightPadding: 8,
  },
  {
    id: 'welcome-8',
    title: 'Theme Toggle',
    content: 'Switch between light and dark mode anytime with this toggle. Your preference is saved automatically.',
    target: '[data-tour="theme-toggle"]',
    position: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'welcome-9',
    title: 'You\'re All Set!',
    content: 'Explore the platform and make the most of your learning journey. Need help? Ozzy is always here for you.',
    target: '[data-tour="header"]',
    position: 'bottom',
    nextLabel: 'Get Started',
  },
];

// Library tour steps
const libraryTourSteps: TourStep[] = [
  {
    id: 'library-1',
    title: 'Document Library',
    content: 'Browse and search official documents, policies, and resources from across Ghana\'s Civil Service.',
    target: '[data-tour="library-header"]',
    position: 'bottom',
    nextLabel: 'Continue',
  },
  {
    id: 'library-2',
    title: 'Categories',
    content: 'Filter documents by category to find what you need quickly.',
    target: '[data-tour="library-categories"]',
    position: 'right',
  },
  {
    id: 'library-3',
    title: 'Document Cards',
    content: 'Click any document to view, download, or bookmark it for later.',
    target: '[data-tour="document-card"]',
    position: 'top',
  },
  {
    id: 'library-4',
    title: 'AI Summary',
    content: 'Ozzy can summarize long documents for you. Look for the AI summary option when viewing documents.',
    target: '[data-tour="library-header"]',
    position: 'bottom',
    nextLabel: 'Got it!',
  },
];

// Forum tour steps
const forumTourSteps: TourStep[] = [
  {
    id: 'forum-1',
    title: 'Discussion Forum',
    content: 'Engage with colleagues across MDAs. Ask questions, share knowledge, and learn from others.',
    target: '[data-tour="forum-header"]',
    position: 'bottom',
  },
  {
    id: 'forum-2',
    title: 'Categories',
    content: 'Browse different categories to find discussions relevant to your work.',
    target: '[data-tour="forum-categories"]',
    position: 'right',
  },
  {
    id: 'forum-3',
    title: 'Create Topic',
    content: 'Start a new discussion by creating a topic. You\'ll earn XP for quality contributions!',
    target: '[data-tour="create-topic"]',
    position: 'left',
  },
];

// Social tour steps
const socialTourSteps: TourStep[] = [
  {
    id: 'social-1',
    title: 'Your Feed',
    content: 'See updates from colleagues you follow, trending posts, and activity across the platform.',
    target: '[data-tour="feed-header"]',
    position: 'bottom',
  },
  {
    id: 'social-2',
    title: 'Create Post',
    content: 'Share updates, insights, or questions with your network.',
    target: '[data-tour="create-post"]',
    position: 'bottom',
  },
  {
    id: 'social-3',
    title: 'Network',
    content: 'Connect with colleagues, find experts, and grow your professional network.',
    target: '[data-tour="network-link"]',
    position: 'right',
  },
];

// LMS tour steps
const lmsTourSteps: TourStep[] = [
  {
    id: 'lms-1',
    title: 'Learning Management',
    content: 'Access training courses, track your progress, and earn certificates.',
    target: '[data-tour="lms-header"]',
    position: 'bottom',
  },
  {
    id: 'lms-2',
    title: 'Course Catalog',
    content: 'Browse available courses by category, difficulty, or department.',
    target: '[data-tour="course-catalog"]',
    position: 'bottom',
  },
  {
    id: 'lms-3',
    title: 'My Learning',
    content: 'Track courses you\'ve enrolled in and your completion progress.',
    target: '[data-tour="my-learning"]',
    position: 'right',
  },
];

// Calendar tour steps
const calendarTourSteps: TourStep[] = [
  {
    id: 'calendar-1',
    title: 'Events & Training',
    content: 'View upcoming training sessions, webinars, and public holidays.',
    target: '[data-tour="calendar-header"]',
    position: 'bottom',
  },
  {
    id: 'calendar-2',
    title: 'Event Types',
    content: 'Filter by event type: Training, Webinars, Meetings, and more.',
    target: '[data-tour="calendar-filters"]',
    position: 'right',
  },
  {
    id: 'calendar-3',
    title: 'Create Event',
    content: 'Create events for your team or RSVP to existing ones.',
    target: '[data-tour="create-event"]',
    position: 'left',
  },
];

// Tour configurations
const tourConfigs: Record<TourId, TourStep[]> = {
  [TOURS.WELCOME]: welcomeTourSteps,
  [TOURS.LIBRARY]: libraryTourSteps,
  [TOURS.FORUM]: forumTourSteps,
  [TOURS.SOCIAL]: socialTourSteps,
  [TOURS.LMS]: lmsTourSteps,
  [TOURS.CALENDAR]: calendarTourSteps,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentTourId: null,
      currentStepIndex: 0,
      steps: [],
      progress: null,
      completedTours: new Set<TourId>(),
      skippedTours: new Set<TourId>(),
      isFirstTimeUser: true,

      startTour: (tourId: TourId) => {
        const steps = tourConfigs[tourId];
        if (!steps || steps.length === 0) return;

        set({
          isActive: true,
          currentTourId: tourId,
          currentStepIndex: 0,
          steps,
        });
      },

      nextStep: () => {
        const { currentStepIndex, steps, currentTourId } = get();
        if (currentStepIndex < steps.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 });
        } else {
          // Complete tour
          get().completeTour();
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },

      skipTour: () => {
        const { currentTourId, skippedTours } = get();
        if (currentTourId) {
          const newSkipped = new Set(skippedTours);
          newSkipped.add(currentTourId);
          set({
            isActive: false,
            currentTourId: null,
            currentStepIndex: 0,
            steps: [],
            skippedTours: newSkipped,
          });
        }
      },

      completeTour: () => {
        const { currentTourId, completedTours } = get();
        if (currentTourId) {
          const newCompleted = new Set(completedTours);
          newCompleted.add(currentTourId);
          set({
            isActive: false,
            currentTourId: null,
            currentStepIndex: 0,
            steps: [],
            completedTours: newCompleted,
            isFirstTimeUser: false,
          });
        }
      },

      endTour: () => {
        set({
          isActive: false,
          currentTourId: null,
          currentStepIndex: 0,
          steps: [],
        });
      },

      resetTours: () => {
        set({
          completedTours: new Set(),
          skippedTours: new Set(),
          isFirstTimeUser: true,
        });
      },

      shouldShowTour: (tourId: TourId) => {
        const { completedTours, skippedTours } = get();
        return !completedTours.has(tourId) && !skippedTours.has(tourId);
      },

      setFirstTimeUser: (value: boolean) => {
        set({ isFirstTimeUser: value });
      },
    }),
    {
      name: 'ohcs-onboarding',
      partialize: (state) => ({
        completedTours: Array.from(state.completedTours),
        skippedTours: Array.from(state.skippedTours),
        isFirstTimeUser: state.isFirstTimeUser,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert arrays back to Sets
          state.completedTours = new Set(state.completedTours as unknown as TourId[]);
          state.skippedTours = new Set(state.skippedTours as unknown as TourId[]);
        }
      },
    }
  )
);
