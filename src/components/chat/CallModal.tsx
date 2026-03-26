import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useCallStore } from '@/stores/callStore';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CallModal({ isOpen, onClose }: CallModalProps) {
  const {
    callId,
    status,
    callType,
    caller,
    callee,
    isMuted,
    isVideoOff,
    callDuration,
    error,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCallStore();

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status text
  const getStatusText = (): string => {
    switch (status) {
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call ended';
      default:
        return '';
    }
  };

  // The peer to display (if we're the caller, show callee and vice versa)
  const peer = callee || caller;

  if (status === 'idle' && !isOpen) return null;

  const isConnected = status === 'connected';
  const isCalling = status === 'calling';
  const isConnecting = status === 'connecting';
  const isVideoCall = callType === 'video';

  return (
    <AnimatePresence>
      {isOpen && status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={cn(
              'relative w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl',
              'bg-gradient-to-b from-surface-800 to-surface-900'
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Call content */}
            <div className="px-8 pt-12 pb-8">
              {/* Call type indicator */}
              <div className="flex justify-center mb-6">
                <div className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2',
                  isVideoCall
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'bg-secondary-500/20 text-secondary-400'
                )}>
                  {isVideoCall ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                  {isVideoCall ? 'Video Call' : 'Voice Call'}
                </div>
              </div>

              {/* Avatar with pulse animation for calling/connecting */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {(isCalling || isConnecting) && (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-primary-500/30"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                        className="absolute inset-0 rounded-full bg-primary-500/30"
                      />
                    </>
                  )}
                  <Avatar
                    name={peer?.name || 'Unknown'}
                    src={peer?.avatar}
                    size="xl"
                    className="w-32 h-32 text-4xl border-4 border-primary-500/30"
                  />
                  {isConnected && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-success-500 rounded-full flex items-center justify-center border-4 border-surface-800">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {peer?.name || 'Unknown'}
                </h2>
              </div>

              {/* Status */}
              <div className="text-center mb-4">
                <motion.p
                  key={status}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'text-lg font-medium',
                    isConnected ? 'text-success-400' : 'text-white/80'
                  )}
                >
                  {getStatusText()}
                </motion.p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <div className="bg-error-500/20 border border-error-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-error-300">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Call controls */}
              <div className="flex items-center justify-center gap-4">
                {(isCalling || isConnecting || isConnected) && (
                  <>
                    {/* Mute button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleMute}
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center transition-colors',
                        isMuted
                          ? 'bg-error-500/20 text-error-400'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      )}
                    >
                      {isMuted ? (
                        <MicOff className="w-6 h-6" />
                      ) : (
                        <Mic className="w-6 h-6" />
                      )}
                    </motion.button>

                    {/* Video toggle (only for video calls) */}
                    {isVideoCall && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleVideo}
                        className={cn(
                          'w-14 h-14 rounded-full flex items-center justify-center transition-colors',
                          isVideoOff
                            ? 'bg-error-500/20 text-error-400'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        )}
                      >
                        {isVideoOff ? (
                          <VideoOff className="w-6 h-6" />
                        ) : (
                          <Video className="w-6 h-6" />
                        )}
                      </motion.button>
                    )}

                    {/* End call button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={endCall}
                      className="w-16 h-16 rounded-full bg-error-500 hover:bg-error-600 flex items-center justify-center transition-colors shadow-lg shadow-error-500/30"
                    >
                      <PhoneOff className="w-7 h-7 text-white" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Decorative gradient at bottom */}
            <div className="h-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Incoming call notification — now delegates to the centralized IncomingCallModal
// Kept as a no-op export to avoid breaking any existing imports
export function IncomingCallNotification() {
  return null;
}
