import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  Siren,
  Volume2,
  VolumeX,
  CheckCircle,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useBroadcastStore, type Broadcast, type BroadcastSeverity } from '@/stores/broadcastStore';
import { Button } from '@/components/shared/Button';

// Severity configurations
const severityConfig: Record<
  BroadcastSeverity,
  {
    icon: typeof Info;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
    pulseColor: string;
    glowColor: string;
  }
> = {
  info: {
    icon: Info,
    bgColor: 'bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-900 dark:text-blue-100',
    iconColor: 'text-blue-500',
    pulseColor: 'bg-blue-500',
    glowColor: 'shadow-blue-500/20',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-500/25',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-900 dark:text-amber-100',
    iconColor: 'text-amber-500',
    pulseColor: 'bg-amber-500',
    glowColor: 'shadow-amber-500/30',
  },
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-gradient-to-r from-red-500/15 via-red-500/5 to-transparent dark:from-red-500/25',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-900 dark:text-red-100',
    iconColor: 'text-red-500',
    pulseColor: 'bg-red-500',
    glowColor: 'shadow-red-500/40',
  },
  emergency: {
    icon: Siren,
    bgColor: 'bg-gradient-to-r from-red-600/20 via-red-600/10 to-red-600/5 dark:from-red-600/30',
    borderColor: 'border-red-600/60',
    textColor: 'text-red-950 dark:text-red-50',
    iconColor: 'text-red-600',
    pulseColor: 'bg-red-600',
    glowColor: 'shadow-red-600/50',
  },
};

// Alert sound URL (emergency alert sound)
const ALERT_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAAAtITYwOqSAAA+jtbC57X/AACPhcrEvNz/AAB0h8bFr8T/AABvh8TKo6//AABzic7Slp//AAB6j9bYiJL/AACKmeLgg4f/AACSpejlfoH/AACZq+zqe3//AACdr+/tdnz/AACir/Lwc3r/AACnr/Tyc3n/AACrrfX0c3n/AACuq/b1c3n/AACwqfb2c3n/AACyp/f3c3n/AACzpff4c3r/AACzpff4c3r/AACzpff4dHv/AACyo/f4dX3/AACvoO/xd4D/AACqnevreoT/AACkl+DgfYr/AACdj9bUgpL/AACUhcvKh5v/AACKfL/Ajab/AAB+c7O1kbL/AABxaae5mL//AABjYJqvncz/AABUVo6km9n/AABGTYKZmOP/AAA4RHaPlOz/AAArO2qGj/T/AAAeMV58ivn/AAAUKFFyhe/+AAALIkVogdr7AAAE';

interface BroadcastBannerProps {
  broadcast: Broadcast;
  onDismiss: () => void;
  onAcknowledge: () => void;
}

// Banner Alert Component (slides from top)
function BroadcastBanner({ broadcast, onDismiss, onAcknowledge }: BroadcastBannerProps) {
  const config = severityConfig[broadcast.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'relative overflow-hidden border-b-2 backdrop-blur-md',
        config.bgColor,
        config.borderColor,
        broadcast.severity === 'emergency' && 'animate-pulse-subtle'
      )}
    >
      {/* Animated background pattern for emergency */}
      {broadcast.severity === 'emergency' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-full w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent"
                animate={{
                  x: ['-100%', '500%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'linear',
                }}
                style={{ left: `${i * 20}%` }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Pulsing icon */}
            <div className="relative flex-shrink-0">
              <Icon className={cn('h-5 w-5', config.iconColor)} />
              {(broadcast.severity === 'critical' || broadcast.severity === 'emergency') && (
                <motion.div
                  className={cn('absolute inset-0 rounded-full', config.pulseColor)}
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn('font-semibold text-sm', config.textColor)}>
                {broadcast.title}
              </p>
              <p className={cn('text-sm opacity-80 truncate', config.textColor)}>
                {broadcast.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {broadcast.requires_acknowledgment && !broadcast.acknowledged ? (
              <Button
                size="sm"
                variant={broadcast.severity === 'emergency' ? 'danger' : 'primary'}
                onClick={onAcknowledge}
                className="whitespace-nowrap"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Acknowledge
              </Button>
            ) : (
              <button
                onClick={onDismiss}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  'hover:bg-black/10 dark:hover:bg-white/10',
                  config.textColor
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface BroadcastModalProps {
  broadcast: Broadcast;
  onDismiss: () => void;
  onAcknowledge: () => void;
}

// Full-screen Modal Alert Component (for critical/emergency)
function BroadcastModal({ broadcast, onDismiss, onAcknowledge }: BroadcastModalProps) {
  const config = severityConfig[broadcast.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      {/* Animated backdrop */}
      <motion.div
        className={cn(
          'absolute inset-0',
          broadcast.severity === 'emergency'
            ? 'bg-gradient-to-br from-red-900/95 via-red-800/90 to-black/95'
            : 'bg-black/80 backdrop-blur-md'
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Emergency animated stripes */}
        {broadcast.severity === 'emergency' && (
          <div className="absolute inset-0 overflow-hidden opacity-20">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-full w-20 bg-gradient-to-b from-yellow-500 via-transparent to-yellow-500"
                style={{ left: `${i * 10}%`, transform: 'skewX(-15deg)' }}
                animate={{ x: ['0%', '100%'] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal content */}
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={cn(
          'relative w-full max-w-lg rounded-2xl overflow-hidden',
          'bg-white dark:bg-surface-800',
          'shadow-2xl',
          config.glowColor,
          broadcast.severity === 'emergency' && 'ring-4 ring-red-500/50'
        )}
      >
        {/* Header with severity indicator */}
        <div
          className={cn(
            'relative px-6 py-8 text-center',
            broadcast.severity === 'emergency'
              ? 'bg-gradient-to-b from-red-600 to-red-700'
              : broadcast.severity === 'critical'
              ? 'bg-gradient-to-b from-red-500 to-red-600'
              : 'bg-gradient-to-b from-amber-500 to-amber-600'
          )}
        >
          {/* Animated icon */}
          <motion.div
            animate={
              broadcast.severity === 'emergency'
                ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }
                : { scale: [1, 1.1, 1] }
            }
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4"
          >
            <Icon className="h-8 w-8 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {broadcast.severity === 'emergency' ? 'EMERGENCY ALERT' : 'Important Notice'}
          </h2>
          <p className="text-white/80 text-sm uppercase tracking-wider">
            {broadcast.severity.toUpperCase()} BROADCAST
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-3">
            {broadcast.title}
          </h3>
          <p className="text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap">
            {broadcast.message}
          </p>

          {/* Timestamp */}
          <p className="mt-4 text-xs text-surface-400 dark:text-surface-500">
            Issued: {new Date(broadcast.created_at).toLocaleString()}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-700">
          <div className="flex justify-center gap-3">
            {broadcast.requires_acknowledgment && !broadcast.acknowledged ? (
              <Button
                size="lg"
                variant={broadcast.severity === 'emergency' ? 'danger' : 'primary'}
                onClick={onAcknowledge}
                className="w-full sm:w-auto min-w-[200px]"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                I Acknowledge This Alert
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={onDismiss}
                className="w-full sm:w-auto"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Main Broadcast Alert Container
export function BroadcastAlertContainer() {
  const {
    activeBroadcasts,
    soundEnabled,
    lastPlayedSoundId,
    fetchActiveBroadcasts,
    acknowledgeBroadcast,
    dismissBroadcast,
    toggleSound,
    markSoundPlayed,
  } = useBroadcastStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch broadcasts on mount and poll every 30 seconds
  useEffect(() => {
    fetchActiveBroadcasts();

    pollingRef.current = setInterval(() => {
      fetchActiveBroadcasts();
    }, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchActiveBroadcasts]);

  // Play sound for critical/emergency alerts
  useEffect(() => {
    if (!soundEnabled) return;

    const criticalBroadcast = activeBroadcasts.find(
      (b) =>
        (b.severity === 'critical' || b.severity === 'emergency') &&
        b.id !== lastPlayedSoundId &&
        !b.acknowledged
    );

    if (criticalBroadcast) {
      // Create and play audio
      if (!audioRef.current) {
        audioRef.current = new Audio(ALERT_SOUND_URL);
        audioRef.current.volume = 0.5;
      }
      audioRef.current.play().catch(() => {
        // Audio autoplay blocked by browser
      });
      markSoundPlayed(criticalBroadcast.id);
    }
  }, [activeBroadcasts, soundEnabled, lastPlayedSoundId, markSoundPlayed]);

  const handleAcknowledge = useCallback(
    async (id: string) => {
      await acknowledgeBroadcast(id);
    },
    [acknowledgeBroadcast]
  );

  const handleDismiss = useCallback(
    (id: string) => {
      dismissBroadcast(id);
    },
    [dismissBroadcast]
  );

  // Separate broadcasts by type
  const bannerBroadcasts = activeBroadcasts.filter(
    (b) => b.severity === 'info' || b.severity === 'warning'
  );
  const modalBroadcast = activeBroadcasts.find(
    (b) =>
      (b.severity === 'critical' || b.severity === 'emergency') &&
      (!b.acknowledged || b.requires_acknowledgment)
  );

  return (
    <>
      {/* Sound toggle button */}
      {activeBroadcasts.length > 0 && (
        <button
          onClick={toggleSound}
          className={cn(
            'fixed bottom-20 right-4 z-[201] p-3 rounded-full shadow-lg transition-all',
            'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700',
            'text-surface-600 dark:text-surface-400'
          )}
          title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      )}

      {/* Banner alerts (stack at top) */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col">
        <AnimatePresence>
          {bannerBroadcasts.map((broadcast) => (
            <BroadcastBanner
              key={broadcast.id}
              broadcast={broadcast}
              onDismiss={() => handleDismiss(broadcast.id)}
              onAcknowledge={() => handleAcknowledge(broadcast.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Modal alert (for critical/emergency) */}
      <AnimatePresence>
        {modalBroadcast && (
          <BroadcastModal
            broadcast={modalBroadcast}
            onDismiss={() => handleDismiss(modalBroadcast.id)}
            onAcknowledge={() => handleAcknowledge(modalBroadcast.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Toast notification for new broadcasts
export function BroadcastToast({ broadcast }: { broadcast: Broadcast }) {
  const config = severityConfig[broadcast.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl shadow-xl backdrop-blur-md',
        'bg-white/95 dark:bg-surface-800/95',
        'border-l-4',
        config.borderColor,
        'max-w-sm'
      )}
    >
      <div className={cn('p-2 rounded-lg', config.bgColor)}>
        <Icon className={cn('h-5 w-5', config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Megaphone className="h-3 w-3 text-surface-400" />
          <span className="text-xs text-surface-400 uppercase tracking-wider">
            {broadcast.severity} Alert
          </span>
        </div>
        <h4 className="font-semibold text-surface-900 dark:text-surface-100 mt-1">
          {broadcast.title}
        </h4>
        <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mt-0.5">
          {broadcast.message}
        </p>
      </div>
    </motion.div>
  );
}
