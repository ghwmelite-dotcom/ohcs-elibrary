import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  X,
  Settings,
  ChevronDown,
  Volume2,
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useCallStore, CallType, MediaDevice } from '@/stores/callStore';
import { Avatar } from '@/components/shared/Avatar';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/cn';

interface PreCallSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCall: () => void;
  callType: CallType;
  roomName: string;
  participantName?: string;
  participantAvatar?: string;
}

export function PreCallSetup({
  isOpen,
  onClose,
  onStartCall,
  callType,
  roomName,
  participantName,
  participantAvatar,
}: PreCallSetupProps) {
  const {
    availableDevices,
    selectedAudioInput,
    selectedVideoInput,
    deviceTestStream,
    isTestingDevices,
    permissionError,
    enumerateDevices,
    selectAudioInput,
    selectVideoInput,
    testDevices,
    stopDeviceTest,
    clearPermissionError,
  } = useCallStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioAnalyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [hasTestedDevices, setHasTestedDevices] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Get devices by type
  const audioInputs = availableDevices.filter((d) => d.kind === 'audioinput');
  const videoInputs = availableDevices.filter((d) => d.kind === 'videoinput');
  const audioOutputs = availableDevices.filter((d) => d.kind === 'audiooutput');

  // Test devices on mount
  useEffect(() => {
    if (isOpen && !hasTestedDevices) {
      handleTestDevices();
    }

    return () => {
      // Cleanup on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopDeviceTest();
    };
  }, [isOpen]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && deviceTestStream && isVideoEnabled) {
      videoRef.current.srcObject = deviceTestStream;
    }
  }, [deviceTestStream, isVideoEnabled]);

  // Audio level visualization
  useEffect(() => {
    if (!deviceTestStream || !isAudioEnabled) {
      setAudioLevel(0);
      return;
    }

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(deviceTestStream);
      source.connect(analyser);
      analyser.fftSize = 256;
      audioAnalyzerRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (audioAnalyzerRef.current) {
          audioAnalyzerRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 128) * 100));
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        audioContext.close();
      };
    } catch (error) {
      console.warn('Failed to create audio analyzer:', error);
    }
  }, [deviceTestStream, isAudioEnabled]);

  const handleTestDevices = async () => {
    setTestError(null);
    clearPermissionError();

    const result = await testDevices(callType);
    setHasTestedDevices(true);

    if (!result.success) {
      setTestError(result.error || 'Failed to access devices');
    }
  };

  const handleToggleVideo = () => {
    if (deviceTestStream) {
      deviceTestStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleToggleAudio = () => {
    if (deviceTestStream) {
      deviceTestStream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleStartCall = () => {
    // Transfer test stream state to call state
    if (deviceTestStream) {
      // Apply mute states
      deviceTestStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled;
      });
      deviceTestStream.getAudioTracks().forEach((track) => {
        track.enabled = isAudioEnabled;
      });
    }
    stopDeviceTest();
    onStartCall();
  };

  const handleClose = () => {
    stopDeviceTest();
    setHasTestedDevices(false);
    setTestError(null);
    onClose();
  };

  if (!isOpen) return null;

  const currentError = permissionError || testError;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl bg-surface-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {callType === 'video' ? 'Video Call' : 'Voice Call'} Setup
              </h2>
              <p className="text-sm text-white/60">
                Preview your camera and microphone before joining
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Preview */}
              <div className="space-y-4">
                <div
                  className={cn(
                    'relative aspect-video bg-surface-900 rounded-xl overflow-hidden',
                    'flex items-center justify-center'
                  )}
                >
                  {isTestingDevices ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
                      <p className="text-white/60 text-sm">Accessing devices...</p>
                    </div>
                  ) : currentError ? (
                    <div className="text-center px-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-error-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-error-400" />
                      </div>
                      <p className="text-error-300 text-sm mb-3">{currentError}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTestDevices}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  ) : callType === 'video' && isVideoEnabled && deviceTestStream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <div className="text-center">
                      <Avatar
                        name={participantName || 'You'}
                        src={participantAvatar}
                        size="xl"
                        className="w-24 h-24 text-3xl mx-auto"
                      />
                      {callType === 'video' && !isVideoEnabled && (
                        <p className="text-white/60 text-sm mt-3">Camera is off</p>
                      )}
                    </div>
                  )}

                  {/* Audio level indicator */}
                  {!currentError && isAudioEnabled && deviceTestStream && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                        <Mic className="w-4 h-4 text-white/80" />
                        <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-success-500 rounded-full"
                            style={{ width: `${audioLevel}%` }}
                            transition={{ duration: 0.05 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick controls */}
                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleAudio}
                    disabled={isTestingDevices || !!currentError}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                      isAudioEnabled
                        ? 'bg-surface-700 text-white hover:bg-surface-600'
                        : 'bg-error-500 text-white',
                      (isTestingDevices || currentError) && 'opacity-50 cursor-not-allowed'
                    )}
                    title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </motion.button>

                  {callType === 'video' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleToggleVideo}
                      disabled={isTestingDevices || !!currentError}
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                        isVideoEnabled
                          ? 'bg-surface-700 text-white hover:bg-surface-600'
                          : 'bg-error-500 text-white',
                        (isTestingDevices || currentError) && 'opacity-50 cursor-not-allowed'
                      )}
                      title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    >
                      {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                      showDeviceSettings
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-700 text-white hover:bg-surface-600'
                    )}
                    title="Device settings"
                  >
                    <Settings className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Right side - Room info & device settings */}
              <div className="space-y-4">
                {/* Room info */}
                <div className="bg-surface-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                      {callType === 'video' ? (
                        <Video className="w-6 h-6 text-primary-400" />
                      ) : (
                        <Phone className="w-6 h-6 text-primary-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{roomName}</h3>
                      <p className="text-sm text-white/60">
                        {callType === 'video' ? 'Video call' : 'Voice call'}
                      </p>
                    </div>
                  </div>
                  {participantName && (
                    <div className="flex items-center gap-2 pt-3 border-t border-surface-600">
                      <Avatar name={participantName} src={participantAvatar} size="sm" />
                      <span className="text-sm text-white/80">{participantName}</span>
                    </div>
                  )}
                </div>

                {/* Device settings */}
                <AnimatePresence>
                  {showDeviceSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {/* Microphone selection */}
                      <DeviceSelector
                        label="Microphone"
                        icon={<Mic className="w-4 h-4" />}
                        devices={audioInputs}
                        selectedId={selectedAudioInput || audioInputs[0]?.deviceId}
                        onSelect={(id) => selectAudioInput(id)}
                      />

                      {/* Camera selection */}
                      {callType === 'video' && (
                        <DeviceSelector
                          label="Camera"
                          icon={<Video className="w-4 h-4" />}
                          devices={videoInputs}
                          selectedId={selectedVideoInput || videoInputs[0]?.deviceId}
                          onSelect={(id) => selectVideoInput(id)}
                        />
                      )}

                      {/* Speaker selection */}
                      <DeviceSelector
                        label="Speaker"
                        icon={<Volume2 className="w-4 h-4" />}
                        devices={audioOutputs}
                        selectedId={audioOutputs[0]?.deviceId}
                        onSelect={() => {}}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status indicator */}
                {!currentError && deviceTestStream && (
                  <div className="flex items-center gap-2 text-success-400 text-sm">
                    <Check className="w-4 h-4" />
                    <span>Devices ready</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-700 bg-surface-800/50">
            <Button variant="ghost" onClick={handleClose} className="text-white/70 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleStartCall}
              disabled={isTestingDevices || !!currentError}
              className="bg-success-500 hover:bg-success-600 text-white px-6"
            >
              {callType === 'video' ? (
                <>
                  <Video className="w-5 h-5 mr-2" />
                  Start Video Call
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  Start Voice Call
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
            className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface-700 rounded-lg shadow-lg overflow-hidden"
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
