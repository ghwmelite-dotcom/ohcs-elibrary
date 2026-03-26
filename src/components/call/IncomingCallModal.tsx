import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCallStore } from '@/stores/callStore';
import { Avatar } from '@/components/shared/Avatar';

const AUTO_DISMISS_MS = 30_000;

export function IncomingCallModal() {
  const incomingCall = useCallStore((s) => s.incomingCall);
  const acceptCall = useCallStore((s) => s.acceptCall);
  const rejectCall = useCallStore((s) => s.rejectCall);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (!incomingCall) return;

    timerRef.current = setTimeout(() => {
      rejectCall(incomingCall.callId);
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [incomingCall, rejectCall]);

  return (
    <AnimatePresence>
      {incomingCall && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Top gradient strip */}
              <div className="h-2 bg-gradient-to-r from-primary-500 to-accent-500" />

              <div className="px-6 py-8 flex flex-col items-center text-center">
                {/* Pulsing ring behind avatar */}
                <div className="relative mb-6">
                  {/* Outer pulse */}
                  <motion.div
                    animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                    className="absolute inset-0 rounded-full bg-primary-400 dark:bg-primary-500"
                  />
                  {/* Inner pulse */}
                  <motion.div
                    animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: 0.3,
                    }}
                    className="absolute inset-0 rounded-full bg-primary-400 dark:bg-primary-500"
                  />
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar
                      src={incomingCall.caller.avatar}
                      name={incomingCall.caller.name}
                      size="xl"
                    />
                  </div>
                </div>

                {/* Call info */}
                <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-1">
                  {incomingCall.caller.name}
                </h3>
                <p className="text-surface-500 dark:text-surface-400 mb-8 flex items-center gap-2">
                  {incomingCall.callType === 'video' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                  {incomingCall.callType === 'video'
                    ? 'Video Call'
                    : 'Audio Call'}{' '}
                  incoming...
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-8">
                  {/* Reject */}
                  <button
                    onClick={() => rejectCall(incomingCall.callId)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white flex items-center justify-center shadow-lg transition-colors">
                      <PhoneOff className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-medium text-surface-500 dark:text-surface-400 group-hover:text-red-500 transition-colors">
                      Decline
                    </span>
                  </button>

                  {/* Accept */}
                  <button
                    onClick={() => acceptCall(incomingCall.callId)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white flex items-center justify-center shadow-lg transition-colors"
                    >
                      {incomingCall.callType === 'video' ? (
                        <Video className="w-7 h-7" />
                      ) : (
                        <Phone className="w-7 h-7" />
                      )}
                    </motion.div>
                    <span className="text-xs font-medium text-surface-500 dark:text-surface-400 group-hover:text-green-500 transition-colors">
                      Accept
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
