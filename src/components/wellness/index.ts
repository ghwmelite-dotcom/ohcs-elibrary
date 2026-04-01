// Wellness component exports
export { KayaAvatar } from './KayaAvatar';
// Legacy alias kept for any external references — prefer KayaAvatar
export { KayaAvatar as DrSenaAvatar } from './KayaAvatar';
export { MoodSelector } from './MoodSelector';
export { TopicSelector } from './TopicSelector';
export { WelcomeCard } from './WelcomeCard';
export { ResourceCard } from './ResourceCard';
export { SessionCard } from './SessionCard';
export { ChatMessage } from './ChatMessage';
export { MoodChart } from './MoodChart';
export { WellnessDashboardCard } from './WellnessDashboardCard';
export { PrivacyConsent, hasWellnessConsent, setWellnessConsent } from './PrivacyConsent';

// Enhanced Wellness Engagement Components
export {
  EnhancedWellnessDashboardCard,
  ActivityNudge,
  useWellnessNudge,
  MilestoneCelebration,
} from './WellnessEngagement';

// Smart Wellness Notifications
export {
  useSmartWellnessNotifications,
  SmartNotificationBanner,
  WellnessPulse,
  WeeklyWellnessSummary,
} from './WellnessNotifications';
