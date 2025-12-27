import { create } from 'zustand';

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'missed' | 'busy';

export interface CallParticipant {
  id: string;
  displayName: string;
  avatar?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
}

export interface ActiveCall {
  id: string;
  type: CallType;
  roomId?: string;
  roomName?: string;
  initiatorId: string;
  participants: CallParticipant[];
  startTime?: Date;
  status: CallStatus;
  isIncoming: boolean;
}

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

interface CallState {
  activeCall: ActiveCall | null;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  permissionError: string | null;
  availableDevices: MediaDevice[];
  selectedAudioInput: string | null;
  selectedVideoInput: string | null;
  selectedAudioOutput: string | null;
  isTestingDevices: boolean;
  deviceTestStream: MediaStream | null;
}

interface CallActions {
  // Call initiation
  startCall: (params: {
    type: CallType;
    roomId: string;
    roomName: string;
    participants: CallParticipant[];
  }) => Promise<void>;

  // Incoming call handling
  receiveCall: (call: ActiveCall) => void;
  acceptCall: () => Promise<void>;
  declineCall: () => void;

  // Call controls
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  toggleSpeaker: () => void;

  // Device management
  enumerateDevices: () => Promise<void>;
  selectAudioInput: (deviceId: string) => Promise<void>;
  selectVideoInput: (deviceId: string) => Promise<void>;
  selectAudioOutput: (deviceId: string) => void;
  testDevices: (type: CallType) => Promise<{ success: boolean; error?: string }>;
  stopDeviceTest: () => void;

  // Internal
  setCallStatus: (status: CallStatus) => void;
  updateCallDuration: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (participantId: string, stream: MediaStream) => void;
  removeRemoteStream: (participantId: string) => void;
  resetCall: () => void;
  clearPermissionError: () => void;
}

type CallStore = CallState & CallActions;

// Helper to check if we're in a secure context (HTTPS or localhost)
const isSecureContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.isSecureContext ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
};

// Helper to check if mediaDevices API is available
const isMediaDevicesSupported = (): boolean => {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
};

// Helper to enumerate available devices
const getAvailableDevices = async (): Promise<MediaDevice[]> => {
  if (!isMediaDevicesSupported()) return [];

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => ['audioinput', 'videoinput', 'audiooutput'].includes(d.kind))
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `${d.kind === 'audioinput' ? 'Microphone' : d.kind === 'videoinput' ? 'Camera' : 'Speaker'} ${d.deviceId.slice(0, 4)}`,
        kind: d.kind as 'audioinput' | 'videoinput' | 'audiooutput',
      }));
  } catch (error) {
    console.warn('Failed to enumerate devices:', error);
    return [];
  }
};

// Main getUserMedia function with robust error handling
const requestUserMedia = async (
  type: CallType,
  audioDeviceId?: string,
  videoDeviceId?: string
): Promise<{ stream: MediaStream | null; error: string | null }> => {
  // Check for secure context
  if (!isSecureContext()) {
    return {
      stream: null,
      error:
        'Camera and microphone access requires a secure connection (HTTPS). Please access the site via HTTPS or localhost.',
    };
  }

  // Check if mediaDevices is available
  if (!isMediaDevicesSupported()) {
    return {
      stream: null,
      error:
        'Your browser does not support camera/microphone access. Please use a modern browser like Chrome, Firefox, Safari, or Edge.',
    };
  }

  // Build constraints with optional device selection
  const audioConstraints: MediaTrackConstraints | boolean = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...(audioDeviceId ? { deviceId: { exact: audioDeviceId } } : {}),
  };

  const videoConstraints: MediaTrackConstraints | boolean =
    type === 'video'
      ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
          ...(videoDeviceId ? { deviceId: { exact: videoDeviceId } } : {}),
        }
      : false;

  const constraints: MediaStreamConstraints = {
    audio: audioConstraints,
    video: videoConstraints,
  };

  console.log('[CallStore] Requesting getUserMedia with constraints:', constraints);

  try {
    // Request media - this will trigger the browser's permission prompt if needed
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('[CallStore] getUserMedia succeeded:', stream.getTracks().map((t) => t.kind));
    return { stream, error: null };
  } catch (error: any) {
    console.error('[CallStore] getUserMedia error:', error.name, error.message);
    return { stream: null, error: getMediaErrorMessage(error, type) };
  }
};

// Get user-friendly error messages for different error types
const getMediaErrorMessage = (error: any, type: CallType): string => {
  const deviceType = type === 'video' ? 'camera and microphone' : 'microphone';

  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} access was blocked. Click the camera/lock icon in your browser's address bar, set permissions to "Allow", then click "Try Again".`;

    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return type === 'video'
        ? 'No camera or microphone found. Please connect a device and try again.'
        : 'No microphone found. Please connect a microphone and try again.';

    case 'NotReadableError':
    case 'TrackStartError':
      return `Your ${deviceType} is being used by another application. Please close other apps using your ${deviceType} and try again.`;

    case 'OverconstrainedError':
      return `Your ${deviceType} doesn't support the requested settings. Trying with default settings may help.`;

    case 'TypeError':
      return 'Invalid media settings. Please refresh the page and try again.';

    case 'AbortError':
      return 'The request was cancelled. Please try again.';

    case 'SecurityError':
      return 'Security error. Make sure the page is loaded over HTTPS.';

    default:
      return `Failed to access your ${deviceType}. Please check your device connections and browser permissions.`;
  }
};

// Helper to get display media for screen sharing
const getDisplayMedia = async (): Promise<{
  stream: MediaStream | null;
  error: string | null;
}> => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    return {
      stream: null,
      error: 'Screen sharing is not supported in your browser.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor',
      } as any,
      audio: {
        suppressLocalAudioPlayback: false,
      } as any,
    });
    return { stream, error: null };
  } catch (error: any) {
    console.error('[CallStore] getDisplayMedia error:', error);

    if (error.name === 'NotAllowedError') {
      return { stream: null, error: 'Screen sharing was cancelled.' };
    }

    return { stream: null, error: 'Failed to start screen sharing. Please try again.' };
  }
};

// Stop all tracks in a stream
const stopStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
};

export const useCallStore = create<CallStore>((set, get) => ({
  // Initial state
  activeCall: null,
  isAudioMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isSpeakerOn: true,
  callDuration: 0,
  localStream: null,
  remoteStreams: new Map(),
  permissionError: null,
  availableDevices: [],
  selectedAudioInput: null,
  selectedVideoInput: null,
  selectedAudioOutput: null,
  isTestingDevices: false,
  deviceTestStream: null,

  // Enumerate available devices
  enumerateDevices: async () => {
    const devices = await getAvailableDevices();
    set({ availableDevices: devices });
  },

  // Test devices before starting a call
  testDevices: async (type: CallType) => {
    set({ isTestingDevices: true, permissionError: null });

    const { selectedAudioInput, selectedVideoInput } = get();
    const { stream, error } = await requestUserMedia(
      type,
      selectedAudioInput || undefined,
      selectedVideoInput || undefined
    );

    if (error || !stream) {
      set({ isTestingDevices: false, permissionError: error });
      return { success: false, error: error || 'Failed to access devices' };
    }

    // Update device labels after getting permission
    const devices = await getAvailableDevices();
    set({ availableDevices: devices, deviceTestStream: stream, isTestingDevices: false });

    return { success: true };
  },

  // Stop device test
  stopDeviceTest: () => {
    const { deviceTestStream } = get();
    stopStream(deviceTestStream);
    set({ deviceTestStream: null, isTestingDevices: false });
  },

  // Select audio input device
  selectAudioInput: async (deviceId: string) => {
    set({ selectedAudioInput: deviceId });

    // If currently in a call, switch the audio track
    const { localStream, activeCall } = get();
    if (localStream && activeCall) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        });
        const newAudioTrack = newStream.getAudioTracks()[0];

        // Replace old audio track
        const oldAudioTrack = localStream.getAudioTracks()[0];
        if (oldAudioTrack) {
          localStream.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
        }
        localStream.addTrack(newAudioTrack);
      } catch (error) {
        console.error('[CallStore] Failed to switch audio input:', error);
      }
    }
  },

  // Select video input device
  selectVideoInput: async (deviceId: string) => {
    set({ selectedVideoInput: deviceId });

    // If currently in a video call, switch the video track
    const { localStream, activeCall, isVideoOff } = get();
    if (localStream && activeCall && activeCall.type === 'video' && !isVideoOff) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
        });
        const newVideoTrack = newStream.getVideoTracks()[0];

        // Replace old video track
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStream.addTrack(newVideoTrack);
      } catch (error) {
        console.error('[CallStore] Failed to switch video input:', error);
      }
    }
  },

  // Select audio output device
  selectAudioOutput: (deviceId: string) => {
    set({ selectedAudioOutput: deviceId });
    // Note: Setting audio output requires using setSinkId on audio/video elements
    // This would be handled in the UI components
  },

  // Start a new call
  startCall: async ({ type, roomId, roomName, participants }) => {
    set({ permissionError: null });

    // Enumerate devices first
    await get().enumerateDevices();

    const { selectedAudioInput, selectedVideoInput } = get();

    // Request media permissions
    const { stream, error } = await requestUserMedia(
      type,
      selectedAudioInput || undefined,
      selectedVideoInput || undefined
    );

    if (error || !stream) {
      set({ permissionError: error || 'Failed to access camera/microphone.' });
      throw new Error(error || 'Failed to access camera/microphone.');
    }

    const call: ActiveCall = {
      id: `call-${Date.now()}`,
      type,
      roomId,
      roomName,
      initiatorId: 'current-user',
      participants,
      status: 'calling',
      isIncoming: false,
    };

    set({
      activeCall: call,
      localStream: stream,
      isVideoOff: type === 'audio',
      isAudioMuted: false,
      callDuration: 0,
    });

    // Update device list after permission
    await get().enumerateDevices();

    // Simulate connection after 2 seconds (in real app, this would be WebRTC signaling)
    setTimeout(() => {
      const currentCall = get().activeCall;
      if (currentCall && currentCall.status === 'calling') {
        set({
          activeCall: {
            ...currentCall,
            status: 'connected',
            startTime: new Date(),
          },
        });
      }
    }, 2000);
  },

  // Receive an incoming call
  receiveCall: (call) => {
    set({
      activeCall: {
        ...call,
        status: 'ringing',
        isIncoming: true,
      },
      permissionError: null,
    });
  },

  // Accept incoming call
  acceptCall: async () => {
    const { activeCall, selectedAudioInput, selectedVideoInput } = get();
    if (!activeCall) return;

    set({ permissionError: null });

    // Request media permissions
    const { stream, error } = await requestUserMedia(
      activeCall.type,
      selectedAudioInput || undefined,
      selectedVideoInput || undefined
    );

    if (error || !stream) {
      set({ permissionError: error || 'Failed to access camera/microphone.' });
      throw new Error(error || 'Failed to access camera/microphone.');
    }

    set({
      activeCall: {
        ...activeCall,
        status: 'connected',
        startTime: new Date(),
      },
      localStream: stream,
      isVideoOff: activeCall.type === 'audio',
      isAudioMuted: false,
      callDuration: 0,
    });

    // Update device list
    await get().enumerateDevices();
  },

  // Decline incoming call
  declineCall: () => {
    const { localStream, deviceTestStream } = get();

    stopStream(localStream);
    stopStream(deviceTestStream);

    set({
      activeCall: null,
      localStream: null,
      deviceTestStream: null,
      remoteStreams: new Map(),
      callDuration: 0,
      permissionError: null,
    });
  },

  // End active call
  endCall: () => {
    const { localStream, activeCall, deviceTestStream } = get();

    stopStream(localStream);
    stopStream(deviceTestStream);

    // Update status briefly to show "ended" before clearing
    if (activeCall) {
      set({
        activeCall: {
          ...activeCall,
          status: 'ended',
        },
      });
    }

    // Clear after brief delay
    setTimeout(() => {
      set({
        activeCall: null,
        localStream: null,
        deviceTestStream: null,
        remoteStreams: new Map(),
        isAudioMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
        callDuration: 0,
        permissionError: null,
      });
    }, 1000);
  },

  // Toggle audio mute
  toggleMute: () => {
    const { localStream, isAudioMuted } = get();

    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isAudioMuted; // Toggle: if muted, enable; if not muted, disable
      });
    }

    set({ isAudioMuted: !isAudioMuted });
  },

  // Toggle video
  toggleVideo: async () => {
    const { localStream, isVideoOff, activeCall, selectedVideoInput } = get();

    if (!activeCall || activeCall.type !== 'video') return;

    if (isVideoOff) {
      // User wants to turn video ON
      if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        if (videoTracks.length > 0) {
          // Just enable existing tracks
          videoTracks.forEach((track) => {
            track.enabled = true;
          });
          set({ isVideoOff: false, permissionError: null });
        } else {
          // Need to get new video stream
          set({ permissionError: null });

          try {
            const constraints: MediaStreamConstraints = {
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                ...(selectedVideoInput ? { deviceId: { exact: selectedVideoInput } } : {}),
              },
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newVideoTrack = newStream.getVideoTracks()[0];

            if (newVideoTrack) {
              localStream.addTrack(newVideoTrack);
            }

            set({ isVideoOff: false, permissionError: null });
          } catch (error: any) {
            const errorMessage = getMediaErrorMessage(error, 'video');
            set({ permissionError: errorMessage });
          }
        }
      } else {
        // No stream at all, request new one
        set({ permissionError: null });
        const { stream, error } = await requestUserMedia('video', undefined, selectedVideoInput || undefined);

        if (error) {
          set({ permissionError: error });
          return;
        }

        if (stream) {
          set({ localStream: stream, isVideoOff: false, isAudioMuted: false, permissionError: null });
        }
      }
    } else {
      // User wants to turn video OFF - just disable tracks (don't stop them)
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      set({ isVideoOff: true });
    }
  },

  // Toggle screen sharing
  toggleScreenShare: async () => {
    const { isScreenSharing, localStream, activeCall, selectedAudioInput, selectedVideoInput } = get();

    if (!activeCall) return;

    set({ permissionError: null });

    if (isScreenSharing) {
      // Stop screen sharing, revert to camera
      const { stream, error } = await requestUserMedia(
        activeCall.type,
        selectedAudioInput || undefined,
        selectedVideoInput || undefined
      );

      stopStream(localStream);

      if (error) {
        set({ permissionError: error });
      }

      set({
        localStream: stream,
        isScreenSharing: false,
        isVideoOff: !stream,
      });
    } else {
      // Start screen sharing
      const { stream: screenStream, error } = await getDisplayMedia();

      if (error) {
        set({ permissionError: error });
        return;
      }

      if (!screenStream) {
        return;
      }

      // Keep audio from original stream
      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach((track) => {
          // Clone the track so we don't affect the original
          screenStream.addTrack(track);
        });

        // Stop only video tracks from original stream
        localStream.getVideoTracks().forEach((track) => track.stop());
      }

      // Handle when user stops sharing via browser UI
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          get().toggleScreenShare();
        };
      }

      set({
        localStream: screenStream,
        isScreenSharing: true,
        isVideoOff: false,
        permissionError: null,
      });
    }
  },

  // Toggle speaker (for mobile)
  toggleSpeaker: () => {
    set((state) => ({ isSpeakerOn: !state.isSpeakerOn }));
  },

  // Update call status
  setCallStatus: (status) => {
    const { activeCall } = get();
    if (activeCall) {
      set({
        activeCall: {
          ...activeCall,
          status,
        },
      });
    }
  },

  // Update call duration
  updateCallDuration: () => {
    set((state) => ({ callDuration: state.callDuration + 1 }));
  },

  // Set local stream
  setLocalStream: (stream) => {
    set({ localStream: stream });
  },

  // Add remote stream
  addRemoteStream: (participantId, stream) => {
    set((state) => {
      const newStreams = new Map(state.remoteStreams);
      newStreams.set(participantId, stream);
      return { remoteStreams: newStreams };
    });
  },

  // Remove remote stream
  removeRemoteStream: (participantId) => {
    set((state) => {
      const newStreams = new Map(state.remoteStreams);
      newStreams.delete(participantId);
      return { remoteStreams: newStreams };
    });
  },

  // Reset call state
  resetCall: () => {
    const { localStream, deviceTestStream } = get();

    stopStream(localStream);
    stopStream(deviceTestStream);

    set({
      activeCall: null,
      isAudioMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isSpeakerOn: true,
      callDuration: 0,
      localStream: null,
      deviceTestStream: null,
      remoteStreams: new Map(),
      permissionError: null,
      isTestingDevices: false,
    });
  },

  // Clear permission error
  clearPermissionError: () => {
    set({ permissionError: null });
  },
}));
