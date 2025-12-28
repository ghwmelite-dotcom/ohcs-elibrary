import { useEffect, useRef, useCallback, useState } from 'react';
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
  Clock,
  ChevronRight,
  Radio,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useBroadcastStore, type Broadcast, type BroadcastSeverity } from '@/stores/broadcastStore';
import { Button } from '@/components/shared/Button';

// Severity configurations with enhanced styling
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
    gradientFrom: string;
    gradientTo: string;
    accentColor: string;
  }
> = {
  info: {
    icon: Info,
    bgColor: 'bg-gradient-to-r from-blue-600/95 via-blue-500/90 to-cyan-500/85',
    borderColor: 'border-blue-400/50',
    textColor: 'text-white',
    iconColor: 'text-white',
    pulseColor: 'bg-blue-400',
    glowColor: 'shadow-blue-500/30',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-cyan-500',
    accentColor: 'bg-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-gradient-to-r from-amber-600/95 via-orange-500/90 to-yellow-500/85',
    borderColor: 'border-amber-400/50',
    textColor: 'text-white',
    iconColor: 'text-white',
    pulseColor: 'bg-amber-400',
    glowColor: 'shadow-amber-500/40',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-yellow-500',
    accentColor: 'bg-amber-400',
  },
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-gradient-to-r from-red-600/95 via-rose-500/90 to-pink-500/85',
    borderColor: 'border-red-400/50',
    textColor: 'text-white',
    iconColor: 'text-white',
    pulseColor: 'bg-red-400',
    glowColor: 'shadow-red-500/50',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-rose-500',
    accentColor: 'bg-red-400',
  },
  emergency: {
    icon: Siren,
    bgColor: 'bg-gradient-to-r from-red-700/95 via-red-600/95 to-rose-600/90',
    borderColor: 'border-red-500/60',
    textColor: 'text-white',
    iconColor: 'text-white',
    pulseColor: 'bg-red-500',
    glowColor: 'shadow-red-600/60',
    gradientFrom: 'from-red-700',
    gradientTo: 'to-rose-600',
    accentColor: 'bg-red-500',
  },
};

// Alert sound URL (emergency alert sound)
const ALERT_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAAAtITYwOqSAAA+jtbC57X/AACPhcrEvNz/AAB0h8bFr8T/AABvh8TKo6//AABzic7Slp//AAB6j9bYiJL/AACKmeLgg4f/AACSpejlfoH/AACZq+zqe3//AACdr+/tdnz/AACir/Lwc3r/AACnr/Tyc3n/AACrrfX0c3n/AACuq/b1c3n/AACwqfb2c3n/AACyp/f3c3n/AACzpff4c3r/AACzpff4c3r/AACzpff4dHv/AACyo/f4dX3/AACvoO/xd4D/AACqnevreoT/AACkl+DgfYr/AACdj9bUgpL/AACUhcvKh5v/AACKfL/Ajab/AAB+c7O1kbL/AABxaae5mL//AABjYJqvncz/AABUVo6km9n/AABGTYKZmOP/AAA4RHaPlOz/AAArO2qGj/T/AAAeMV58ivn/AAAUKFFyhe/+AAALIkVogdr7AAAE';

interface BroadcastBannerProps {
  broadcast: Broadcast;
  onDismiss: () => void;
  onAcknowledge: () => void;
  isAcknowledging?: boolean;
}

// Enhanced Banner Alert Component
function BroadcastBanner({ broadcast, onDismiss, onAcknowledge, isAcknowledging = false }: BroadcastBannerProps) {
  const config = severityConfig[broadcast.severity];
  const Icon = config.icon;
  const isUrgent = broadcast.severity === 'critical' || broadcast.severity === 'emergency';

  return (
    <motion.div
      initial={{ y: -100, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -100, opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'relative overflow-hidden backdrop-blur-xl shadow-2xl',
        config.bgColor,
        config.glowColor,
        isUrgent && 'shadow-lg'
      )}
    >
      {/* Animated shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-200%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
      />

      {/* Emergency animated stripes */}
      {broadcast.severity === 'emergency' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-full w-24 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
                animate={{ x: ['-100%', '1000%'] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'linear',
                }}
                style={{ left: `${i * 12}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Warning animated pulse */}
      {broadcast.severity === 'warning' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-transparent to-yellow-500/20"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Content container */}
      <div className="relative">
        {/* Top accent line */}
        <motion.div
          className={cn('h-1', config.accentColor)}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Icon with animation */}
            <motion.div
              className={cn(
                'relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center',
                'bg-white/20 backdrop-blur-sm shadow-inner'
              )}
              animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              {/* Pulsing ring for urgent */}
              {isUrgent && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-white/50"
                    animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-white/30"
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  />
                </>
              )}
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Badge + Title row */}
              <div className="flex items-center gap-2 flex-wrap">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider',
                    'bg-white/25 text-white backdrop-blur-sm'
                  )}
                >
                  <Radio className="w-3 h-3" />
                  {broadcast.severity === 'emergency' ? 'EMERGENCY' : broadcast.severity.toUpperCase()}
                </motion.span>
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  {broadcast.title}
                </h3>
              </div>

              {/* Message */}
              <p className="mt-1 text-xs sm:text-sm text-white/90 line-clamp-2 sm:line-clamp-1">
                {broadcast.message}
              </p>

              {/* Timestamp - mobile */}
              <div className="flex items-center gap-1 mt-1 sm:hidden">
                <Clock className="w-3 h-3 text-white/60" />
                <span className="text-[10px] text-white/60">
                  {new Date(broadcast.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Right side: Timestamp + Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Timestamp - desktop */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5 text-white/70" />
                <span className="text-xs text-white/80 font-medium">
                  {new Date(broadcast.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Action buttons */}
              {broadcast.requires_acknowledgment && !broadcast.acknowledged ? (
                <motion.button
                  whileHover={{ scale: isAcknowledging ? 1 : 1.05 }}
                  whileTap={{ scale: isAcknowledging ? 1 : 0.95 }}
                  onClick={onAcknowledge}
                  disabled={isAcknowledging}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm',
                    'bg-white text-surface-900 shadow-lg',
                    'hover:bg-white/90 transition-colors',
                    isAcknowledging && 'opacity-75 cursor-not-allowed'
                  )}
                >
                  {isAcknowledging ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}</span>
                  <span className="sm:hidden">{isAcknowledging ? '...' : 'OK'}</span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onDismiss}
                  className={cn(
                    'p-2 sm:p-2.5 rounded-xl transition-colors',
                    'bg-white/10 hover:bg-white/20 backdrop-blur-sm',
                    'text-white'
                  )}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              )}
            </div>
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
  isAcknowledging?: boolean;
}

// Enhanced Full-screen Modal Alert Component
function BroadcastModal({ broadcast, onDismiss, onAcknowledge, isAcknowledging = false }: BroadcastModalProps) {
  const config = severityConfig[broadcast.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Animated backdrop - pointer-events-none to allow clicks to pass through to modal */}
      <motion.div
        className={cn(
          'absolute inset-0 pointer-events-none',
          broadcast.severity === 'emergency'
            ? 'bg-gradient-to-br from-red-900/98 via-red-800/95 to-black/98'
            : 'bg-black/85 backdrop-blur-md'
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Emergency animated stripes */}
        {broadcast.severity === 'emergency' && (
          <div className="absolute inset-0 overflow-hidden opacity-20">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-full w-16 bg-gradient-to-b from-yellow-500 via-transparent to-yellow-500"
                style={{ left: `${i * 8}%`, transform: 'skewX(-15deg)' }}
                animate={{ x: ['0%', '150%'] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
        )}

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'absolute w-2 h-2 rounded-full',
                broadcast.severity === 'emergency' ? 'bg-red-400/30' : 'bg-white/10'
              )}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Modal content - pointer-events-auto to ensure clicks work */}
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={cn(
          'relative w-full max-w-lg rounded-3xl overflow-hidden pointer-events-auto',
          'bg-white dark:bg-surface-800',
          'shadow-2xl',
          broadcast.severity === 'emergency' && 'ring-4 ring-red-500/50'
        )}
      >
        {/* Header with severity indicator */}
        <div
          className={cn(
            'relative px-6 py-8 sm:py-10 text-center overflow-hidden',
            `bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo}`
          )}
        >
          {/* Animated background circles */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 10, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10"
              animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
          </div>

          {/* Animated icon */}
          <motion.div
            animate={
              broadcast.severity === 'emergency'
                ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }
                : { scale: [1, 1.1, 1] }
            }
            transition={{ duration: 1, repeat: Infinity }}
            className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 shadow-xl"
          >
            <Icon className="h-10 w-10 text-white" />
            {/* Pulsing rings */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-white/40"
              animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-bold text-white mb-2"
          >
            {broadcast.severity === 'emergency' ? 'EMERGENCY ALERT' : 'Important Notice'}
          </motion.h2>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm"
          >
            <Radio className="w-4 h-4 text-white/80" />
            <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
              {broadcast.severity} Broadcast
            </span>
          </motion.div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <motion.h3
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 mb-4"
          >
            {broadcast.title}
          </motion.h3>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap text-sm sm:text-base"
          >
            {broadcast.message}
          </motion.p>

          {/* Timestamp */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center gap-2 text-surface-400 dark:text-surface-500"
          >
            <Clock className="w-4 h-4" />
            <span className="text-xs sm:text-sm">
              Issued: {new Date(broadcast.created_at).toLocaleString()}
            </span>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="px-6 py-5 sm:px-8 sm:py-6 bg-surface-50 dark:bg-surface-900/50 border-t border-surface-200 dark:border-surface-700"
        >
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            {broadcast.requires_acknowledgment && !broadcast.acknowledged ? (
              <Button
                size="lg"
                variant={broadcast.severity === 'emergency' ? 'danger' : 'primary'}
                onClick={onAcknowledge}
                disabled={isAcknowledging}
                className="w-full sm:w-auto min-w-[200px] text-base font-semibold py-3"
              >
                {isAcknowledging ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Acknowledging...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    I Acknowledge This Alert
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={onDismiss}
                className="w-full sm:w-auto px-8"
              >
                Dismiss
              </Button>
            )}
          </div>
        </motion.div>
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

  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
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
      setAcknowledgingId(id);
      try {
        await acknowledgeBroadcast(id);
      } finally {
        setAcknowledgingId(null);
      }
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
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSound}
          className={cn(
            'fixed bottom-20 right-4 z-[201] p-3.5 rounded-2xl shadow-xl transition-all',
            'bg-white dark:bg-surface-800',
            'border border-surface-200 dark:border-surface-700',
            'text-surface-600 dark:text-surface-400',
            'hover:shadow-2xl'
          )}
          title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </motion.button>
      )}

      {/* Banner alerts (stack at top) */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col">
        <AnimatePresence>
          {bannerBroadcasts.map((broadcast, index) => (
            <motion.div
              key={broadcast.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <BroadcastBanner
                broadcast={broadcast}
                onDismiss={() => handleDismiss(broadcast.id)}
                onAcknowledge={() => handleAcknowledge(broadcast.id)}
                isAcknowledging={acknowledgingId === broadcast.id}
              />
            </motion.div>
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
            isAcknowledging={acknowledgingId === modalBroadcast.id}
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
        'flex items-start gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md',
        'bg-white/95 dark:bg-surface-800/95',
        'border-l-4',
        config.borderColor,
        'max-w-sm'
      )}
    >
      <div className={cn('p-2.5 rounded-xl', config.bgColor)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Megaphone className="h-3 w-3 text-surface-400" />
          <span className="text-xs text-surface-400 uppercase tracking-wider font-semibold">
            {broadcast.severity} Alert
          </span>
        </div>
        <h4 className="font-bold text-surface-900 dark:text-surface-100 mt-1">
          {broadcast.title}
        </h4>
        <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mt-0.5">
          {broadcast.message}
        </p>
      </div>
    </motion.div>
  );
}
