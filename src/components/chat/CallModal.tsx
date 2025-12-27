import { useEffect, useState } from 'react';
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
import { useCallStore, CallType } from '@/stores/callStore';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CallModal({ isOpen, onClose }: CallModalProps) {
  const {
    activeCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    isAudioMuted,
    isVideoOff,
    callDuration,
    permissionError,
    updateCallDuration,
    clearPermissionError,
  } = useCallStore();

  // Update call duration every second when connected
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeCall?.status === 'connected') {
      interval = setInterval(() => {
        updateCallDuration();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.status, updateCallDuration]);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status text
  const getStatusText = (): string => {
    if (!activeCall) return '';

    switch (activeCall.status) {
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Incoming call';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call ended';
      case 'declined':
        return 'Call declined';
      case 'missed':
        return 'Missed call';
      case 'busy':
        return 'User is busy';
      default:
        return '';
    }
  };

  // Get the main participant to display
  const mainParticipant = activeCall?.participants[0];

  if (!activeCall) return null;

  const isRinging = activeCall.status === 'ringing';
  const isConnected = activeCall.status === 'connected';
  const isCalling = activeCall.status === 'calling';
  const isVideoCall = activeCall.type === 'video';

  return (
    <AnimatePresence>
      {isOpen && (
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

              {/* Avatar with pulse animation for calling/ringing */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {(isCalling || isRinging) && (
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
                    name={mainParticipant?.displayName || activeCall.roomName || 'Unknown'}
                    src={mainParticipant?.avatar}
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

              {/* Name and room */}
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {mainParticipant?.displayName || activeCall.roomName || 'Unknown'}
                </h2>
                {activeCall.roomName && mainParticipant && (
                  <p className="text-white/60 text-sm mt-1">
                    #{activeCall.roomName}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="text-center mb-4">
                <motion.p
                  key={activeCall.status}
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

              {/* Permission Error */}
              <AnimatePresence>
                {permissionError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <div className="bg-error-500/20 border border-error-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-error-300 font-medium">Permission Required</p>
                        <p className="text-xs text-error-400/80 mt-1">{permissionError}</p>
                      </div>
                      <button
                        onClick={clearPermissionError}
                        className="p-1 text-error-400 hover:text-error-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Call controls */}
              <div className="flex items-center justify-center gap-4">
                {/* If ringing (incoming call) - show accept/decline */}
                {isRinging && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={declineCall}
                      className="w-16 h-16 rounded-full bg-error-500 hover:bg-error-600 flex items-center justify-center transition-colors shadow-lg shadow-error-500/30"
                    >
                      <PhoneOff className="w-7 h-7 text-white" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={acceptCall}
                      className="w-16 h-16 rounded-full bg-success-500 hover:bg-success-600 flex items-center justify-center transition-colors shadow-lg shadow-success-500/30"
                    >
                      {isVideoCall ? (
                        <Video className="w-7 h-7 text-white" />
                      ) : (
                        <Phone className="w-7 h-7 text-white" />
                      )}
                    </motion.button>
                  </>
                )}

                {/* If calling or connected - show controls */}
                {(isCalling || isConnected) && (
                  <>
                    {/* Mute button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleMute}
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center transition-colors',
                        isAudioMuted
                          ? 'bg-error-500/20 text-error-400'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      )}
                    >
                      {isAudioMuted ? (
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

              {/* Participants count for group calls */}
              {activeCall.participants.length > 1 && isConnected && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-center text-white/60 text-sm mb-3">
                    {activeCall.participants.length} participants
                  </p>
                  <div className="flex justify-center gap-2">
                    {activeCall.participants.slice(0, 5).map((participant) => (
                      <Avatar
                        key={participant.id}
                        name={participant.displayName}
                        src={participant.avatar}
                        size="sm"
                        className="border-2 border-surface-800"
                      />
                    ))}
                    {activeCall.participants.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-xs text-white">
                        +{activeCall.participants.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Decorative gradient at bottom */}
            <div className="h-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Incoming call notification that can appear as a toast-like overlay
export function IncomingCallNotification() {
  const { activeCall, acceptCall, declineCall } = useCallStore();

  if (!activeCall || activeCall.status !== 'ringing') return null;

  const mainParticipant = activeCall.participants[0];
  const isVideoCall = activeCall.type === 'video';

  return (
    <motion.div
      initial={{ opacity: 0, y: -100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -100, scale: 0.9 }}
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 sm:w-80 max-w-sm sm:max-w-none mx-auto sm:mx-0"
    >
      <div className="bg-surface-800 rounded-2xl shadow-2xl border border-surface-700 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <Avatar
                name={mainParticipant?.displayName || 'Unknown'}
                src={mainParticipant?.avatar}
                size="md"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-success-500 rounded-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">
                {mainParticipant?.displayName || 'Unknown'}
              </p>
              <p className="text-sm text-white/60 flex items-center gap-1">
                {isVideoCall ? (
                  <>
                    <Video className="w-3 h-3" />
                    Incoming video call
                  </>
                ) : (
                  <>
                    <Phone className="w-3 h-3" />
                    Incoming voice call
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={declineCall}
              className="flex-1 py-2.5 px-4 bg-error-500/20 hover:bg-error-500/30 text-error-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              Decline
            </button>
            <button
              onClick={acceptCall}
              className="flex-1 py-2.5 px-4 bg-success-500 hover:bg-success-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isVideoCall ? (
                <Video className="w-4 h-4" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
              Accept
            </button>
          </div>
        </div>

        {/* Animated border */}
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 30, ease: 'linear' }}
          className="h-1 bg-success-500 origin-left"
        />
      </div>
    </motion.div>
  );
}
