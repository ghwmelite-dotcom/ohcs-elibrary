import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  MoreVertical,
  Users,
  MessageSquare,
  Settings,
  Volume2,
  VolumeX,
  Grid,
  User,
  AlertTriangle,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useCallStore, MediaDevice } from '@/stores/callStore';
import { Avatar } from '@/components/shared/Avatar';
import { cn } from '@/utils/cn';

interface VideoCallViewProps {
  onClose: () => void;
  onOpenChat?: () => void;
}

type ViewMode = 'speaker' | 'grid';

export function VideoCallView({ onClose, onOpenChat }: VideoCallViewProps) {
  const {
    activeCall,
    localStream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isSpeakerOn,
    callDuration,
    permissionError,
    availableDevices,
    selectedAudioInput,
    selectedVideoInput,
    updateCallDuration,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleSpeaker,
    endCall,
    clearPermissionError,
    selectAudioInput,
    selectVideoInput,
    enumerateDevices,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('speaker');
  const [showControls, setShowControls] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Device lists
  const audioInputs = availableDevices.filter((d) => d.kind === 'audioinput');
  const videoInputs = availableDevices.filter((d) => d.kind === 'videoinput');

  // Enumerate devices on mount
  useEffect(() => {
    enumerateDevices();
  }, [enumerateDevices]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Update call duration
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

  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      controlsTimeoutRef.current = setTimeout(() => {
        if (!showSettings && !showParticipants) {
          setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showSettings, showParticipants]);

  // Toggle fullscreen
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle end call
  const handleEndCall = () => {
    endCall();
    onClose();
  };

  if (!activeCall || activeCall.status !== 'connected') return null;

  const mainParticipant = activeCall.participants[0];
  const isVideoCall = activeCall.type === 'video';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-surface-900 flex flex-col"
    >
      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse" />
                  <span className="text-white font-medium">
                    {formatDuration(callDuration)}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/20" />
                <span className="text-white/80">
                  {activeCall.roomName || mainParticipant?.displayName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'speaker' ? 'grid' : 'speaker')}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title={viewMode === 'speaker' ? 'Grid view' : 'Speaker view'}
                >
                  {viewMode === 'speaker' ? (
                    <Grid className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowParticipants(!showParticipants);
                    setShowSettings(false);
                  }}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    showParticipants
                      ? 'text-primary-400 bg-primary-500/20'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  )}
                  title="Participants"
                >
                  <Users className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setShowParticipants(false);
                  }}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    showSettings
                      ? 'text-primary-400 bg-primary-500/20'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  )}
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                {onOpenChat && (
                  <button
                    onClick={onOpenChat}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Chat"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleFullscreen}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Error Banner */}
      <AnimatePresence>
        {permissionError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-16 left-4 right-4 z-20 bg-error-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Camera/Microphone Access Required</p>
              <p className="text-sm text-white/80 mt-1">{permissionError}</p>
            </div>
            <button
              onClick={clearPermissionError}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main video area */}
      <div className="flex-1 relative">
        {isVideoCall && !isVideoOff && localStream ? (
          // Local video (in a real app, this would show remote participant's video in main view)
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          // Audio call or video off - show avatar
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-surface-800 to-surface-900">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <Avatar
                  name={mainParticipant?.displayName || 'Unknown'}
                  src={mainParticipant?.avatar}
                  size="xl"
                  className="w-40 h-40 text-5xl"
                />
                {/* Audio visualization rings */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-4 border-primary-500/30"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {mainParticipant?.displayName || 'Unknown'}
              </h2>
              {isVideoOff && isVideoCall && (
                <p className="text-white/60 flex items-center justify-center gap-2">
                  <VideoOff className="w-4 h-4" />
                  Camera is off
                </p>
              )}
            </div>
          </div>
        )}

        {/* Picture-in-picture for local video during video call */}
        {isVideoCall && (
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            className="absolute bottom-24 sm:bottom-24 right-2 sm:right-4 w-28 h-20 sm:w-48 sm:h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-surface-700 bg-surface-800"
          >
            {localStream && !isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Avatar name="You" size="md" />
              </div>
            )}
            {isAudioMuted && (
              <div className="absolute bottom-2 right-2 p-1.5 bg-error-500 rounded-full">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.div>
        )}

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute top-0 right-0 bottom-0 w-full sm:w-80 max-w-sm bg-surface-800/95 backdrop-blur-sm border-l border-surface-700 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Call Settings
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Microphone selection */}
                  <DeviceSelector
                    label="Microphone"
                    icon={<Mic className="w-4 h-4" />}
                    devices={audioInputs}
                    selectedId={selectedAudioInput || audioInputs[0]?.deviceId}
                    onSelect={(id) => selectAudioInput(id)}
                  />

                  {/* Camera selection */}
                  {isVideoCall && (
                    <DeviceSelector
                      label="Camera"
                      icon={<Video className="w-4 h-4" />}
                      devices={videoInputs}
                      selectedId={selectedVideoInput || videoInputs[0]?.deviceId}
                      onSelect={(id) => selectVideoInput(id)}
                    />
                  )}

                  {/* Audio/Video status */}
                  <div className="pt-4 border-t border-surface-700">
                    <h4 className="text-xs font-medium text-white/60 uppercase tracking-wide mb-3">
                      Current Status
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">Microphone</span>
                        <span className={isAudioMuted ? 'text-error-400' : 'text-success-400'}>
                          {isAudioMuted ? 'Muted' : 'Active'}
                        </span>
                      </div>
                      {isVideoCall && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/80">Camera</span>
                          <span className={isVideoOff ? 'text-error-400' : 'text-success-400'}>
                            {isVideoOff ? 'Off' : 'On'}
                          </span>
                        </div>
                      )}
                      {isVideoCall && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/80">Screen Sharing</span>
                          <span className={isScreenSharing ? 'text-primary-400' : 'text-white/40'}>
                            {isScreenSharing ? 'Active' : 'Off'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call info */}
                  <div className="pt-4 border-t border-surface-700">
                    <h4 className="text-xs font-medium text-white/60 uppercase tracking-wide mb-3">
                      Call Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Duration</span>
                        <span className="text-white">{formatDuration(callDuration)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Room</span>
                        <span className="text-white truncate max-w-[150px]">
                          {activeCall.roomName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Participants</span>
                        <span className="text-white">{activeCall.participants.length + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Participants panel */}
        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute top-0 right-0 bottom-0 w-full sm:w-80 max-w-sm bg-surface-800/95 backdrop-blur-sm border-l border-surface-700 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">
                    Participants ({activeCall.participants.length + 1})
                  </h3>
                  <button
                    onClick={() => setShowParticipants(false)}
                    className="p-1 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {/* You */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary-500/10">
                    <Avatar name="You" size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        You
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isAudioMuted ? (
                        <MicOff className="w-4 h-4 text-error-400" />
                      ) : (
                        <Mic className="w-4 h-4 text-success-400" />
                      )}
                      {isVideoCall && (
                        isVideoOff ? (
                          <VideoOff className="w-4 h-4 text-error-400" />
                        ) : (
                          <Video className="w-4 h-4 text-success-400" />
                        )
                      )}
                    </div>
                  </div>

                  {/* Other participants */}
                  {activeCall.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <Avatar
                        name={participant.displayName}
                        src={participant.avatar}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {participant.displayName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {participant.isMuted ? (
                          <MicOff className="w-4 h-4 text-error-400" />
                        ) : (
                          <Mic className="w-4 h-4 text-success-400" />
                        )}
                        {isVideoCall && (
                          participant.isVideoOff ? (
                            <VideoOff className="w-4 h-4 text-error-400" />
                          ) : (
                            <Video className="w-4 h-4 text-success-400" />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent"
          >
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {/* Mute button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className={cn(
                  'w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors',
                  isAudioMuted
                    ? 'bg-error-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                )}
                title={isAudioMuted ? 'Unmute' : 'Mute'}
              >
                {isAudioMuted ? (
                  <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </motion.button>

              {/* Video toggle */}
              {isVideoCall && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleVideo}
                  className={cn(
                    'w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors',
                    isVideoOff
                      ? 'bg-error-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  )}
                  title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </motion.button>
              )}

              {/* Screen share - hidden on mobile */}
              {isVideoCall && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleScreenShare}
                  className={cn(
                    'hidden sm:flex w-14 h-14 rounded-full items-center justify-center transition-colors',
                    isScreenSharing
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  )}
                  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  {isScreenSharing ? (
                    <MonitorOff className="w-6 h-6" />
                  ) : (
                    <Monitor className="w-6 h-6" />
                  )}
                </motion.button>
              )}

              {/* Speaker toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSpeaker}
                className={cn(
                  'w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors',
                  !isSpeakerOn
                    ? 'bg-error-500/20 text-error-400'
                    : 'bg-white/10 text-white hover:bg-white/20'
                )}
                title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
              >
                {isSpeakerOn ? (
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </motion.button>

              {/* End call */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleEndCall}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-error-500 hover:bg-error-600 flex items-center justify-center transition-colors shadow-lg shadow-error-500/30"
                title="End call"
              >
                <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </motion.button>

              {/* Settings button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowParticipants(false);
                }}
                className={cn(
                  'w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors',
                  showSettings
                    ? 'bg-primary-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                )}
                title="Settings"
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Device selector dropdown component
function DeviceSelector({
  label,
  icon,
  devices,
  selectedId,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  devices: MediaDevice[];
  selectedId?: string;
  onSelect: (deviceId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDevice = devices.find((d) => d.deviceId === selectedId) || devices[0];

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-white/60 mb-1">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5',
          'bg-surface-700 hover:bg-surface-600 rounded-lg transition-colors',
          'text-left text-sm text-white'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white/60 flex-shrink-0">{icon}</span>
          <span className="truncate">{selectedDevice?.label || 'No device found'}</span>
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-white/60 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {isOpen && devices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface-700 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto"
          >
            {devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => {
                  onSelect(device.deviceId);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors',
                  device.deviceId === selectedId
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-white hover:bg-surface-600'
                )}
              >
                {device.deviceId === selectedId && <Check className="w-4 h-4 flex-shrink-0" />}
                <span className="truncate">{device.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
