import { create } from 'zustand';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CallType = 'audio' | 'video';
export type CallStatus =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'ended';

interface CallPeer {
  id: string;
  name: string;
  avatar?: string;
}

interface IncomingCall {
  callId: string;
  caller: CallPeer;
  callType: CallType;
}

interface CallState {
  callId: string | null;
  status: CallStatus;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  caller: CallPeer | null;
  callee: CallPeer | null;
  error: string | null;
  incomingCall: IncomingCall | null;
  callDuration: number;
}

interface CallActions {
  startCall: (
    targetUserId: string,
    targetUserName: string,
    callType: CallType,
    targetAvatar?: string
  ) => Promise<void>;
  checkIncomingCalls: () => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  updateCallDuration: () => void;
  resetCall: () => void;
}

type CallStore = CallState & CallActions;

// ─── API Helper ──────────────────────────────────────────────────────────────

const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://ohcs-elibrary-api.ghwmelite.workers.dev';

async function callApi(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const token = useAuthStore.getState().token;
  return fetch(`${API_BASE}/api/v1/calls${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

// ─── WebRTC Helpers ──────────────────────────────────────────────────────────

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

let peerConnection: RTCPeerConnection | null = null;
let icePollInterval: ReturnType<typeof setInterval> | null = null;
let answerPollInterval: ReturnType<typeof setInterval> | null = null;
let incomingPollInterval: ReturnType<typeof setInterval> | null = null;
let durationInterval: ReturnType<typeof setInterval> | null = null;

function clearAllIntervals() {
  if (icePollInterval) {
    clearInterval(icePollInterval);
    icePollInterval = null;
  }
  if (answerPollInterval) {
    clearInterval(answerPollInterval);
    answerPollInterval = null;
  }
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
}

function closePeerConnection() {
  if (peerConnection) {
    peerConnection.onicecandidate = null;
    peerConnection.ontrack = null;
    peerConnection.oniceconnectionstatechange = null;
    peerConnection.close();
    peerConnection = null;
  }
}

function stopStream(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

// Helper to get user media with robust error handling
async function requestUserMedia(
  callType: CallType
): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video:
      callType === 'video'
        ? {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30 },
            facingMode: 'user',
          }
        : false,
  };

  return navigator.mediaDevices.getUserMedia(constraints);
}

// ─── Store ───────────────────────────────────────────────────────────────────

const initialState: CallState = {
  callId: null,
  status: 'idle',
  callType: 'audio',
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  caller: null,
  callee: null,
  error: null,
  incomingCall: null,
  callDuration: 0,
};

export const useCallStore = create<CallStore>((set, get) => ({
  ...initialState,

  // ── Start an outgoing call ────────────────────────────────────────────────

  startCall: async (targetUserId, targetUserName, callType, targetAvatar) => {
    const { status } = get();
    if (status !== 'idle') return;

    set({
      status: 'calling',
      callType,
      error: null,
      callee: { id: targetUserId, name: targetUserName, avatar: targetAvatar },
    });

    try {
      // 1. Capture local media
      const localStream = await requestUserMedia(callType);
      set({ localStream, isVideoOff: callType === 'audio' });

      // 2. Initiate call via API
      const initiateRes = await callApi('/initiate', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId,
          callType,
        }),
      });

      if (!initiateRes.ok) {
        const err = await initiateRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to initiate call');
      }

      const { callId, iceServers } = await initiateRes.json();
      set({ callId });

      // 3. Create RTCPeerConnection
      const rtcConfig: RTCConfiguration = {
        iceServers: iceServers?.length ? iceServers : DEFAULT_ICE_SERVERS,
      };
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnection = pc;

      // 4. Add local tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // 5. Handle remote tracks
      const remoteStream = new MediaStream();
      set({ remoteStream });

      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        set({ remoteStream });
      };

      // 6. ICE candidate handling — send each to the server
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            await callApi(`/${callId}/ice`, {
              method: 'POST',
              body: JSON.stringify({
                candidate: event.candidate.toJSON(),
                role: 'caller',
              }),
            });
          } catch (err) {
            console.warn('[CallStore] Failed to send ICE candidate:', err);
          }
        }
      };

      // 7. Monitor connection state
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log('[CallStore] ICE connection state:', state);

        if (state === 'connected' || state === 'completed') {
          set({ status: 'connected' });
          // Start duration timer
          if (!durationInterval) {
            durationInterval = setInterval(() => {
              get().updateCallDuration();
            }, 1000);
          }
        } else if (state === 'failed' || state === 'disconnected') {
          // Allow brief disconnections — only end on 'failed'
          if (state === 'failed') {
            set({ error: 'Connection failed. Please try again.' });
            get().endCall();
          }
        }
      };

      // 8. Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 9. Send offer to server
      const offerRes = await callApi(`/${callId}/offer`, {
        method: 'POST',
        body: JSON.stringify({ sdp: offer }),
      });

      if (!offerRes.ok) {
        throw new Error('Failed to store offer');
      }

      // 10. Poll for answer every 1s
      set({ status: 'calling' });

      answerPollInterval = setInterval(async () => {
        try {
          const answerRes = await callApi(`/${callId}/answer`);
          if (answerRes.ok) {
            const data = await answerRes.json();
            if (data.sdp) {
              // Answer received
              if (answerPollInterval) {
                clearInterval(answerPollInterval);
                answerPollInterval = null;
              }

              set({ status: 'connecting' });

              const answerDesc = new RTCSessionDescription(data.sdp);
              await pc.setRemoteDescription(answerDesc);

              // 11. Poll for remote ICE candidates
              icePollInterval = setInterval(async () => {
                try {
                  const iceRes = await callApi(
                    `/${callId}/ice?role=callee`
                  );
                  if (iceRes.ok) {
                    const iceData = await iceRes.json();
                    if (iceData.candidates?.length) {
                      for (const candidate of iceData.candidates) {
                        try {
                          await pc.addIceCandidate(
                            new RTCIceCandidate(candidate)
                          );
                        } catch (err) {
                          console.warn(
                            '[CallStore] Failed to add remote ICE candidate:',
                            err
                          );
                        }
                      }
                    }
                  }
                } catch (err) {
                  console.warn('[CallStore] ICE poll error:', err);
                }
              }, 1000);
            }
          }
        } catch (err) {
          console.warn('[CallStore] Answer poll error:', err);
        }
      }, 1000);
    } catch (err: any) {
      console.error('[CallStore] startCall error:', err);
      set({
        status: 'ended',
        error: err.message || 'Failed to start call',
      });
      closePeerConnection();
      clearAllIntervals();
      stopStream(get().localStream);

      // Auto-reset after showing error
      setTimeout(() => {
        set({ ...initialState });
      }, 3000);
    }
  },

  // ── Check for incoming calls ──────────────────────────────────────────────

  checkIncomingCalls: async () => {
    const { status, incomingCall } = get();
    // Don't check if already in a call or already have an incoming call
    if (status !== 'idle' || incomingCall) return;

    try {
      const res = await callApi('/incoming');
      if (res.ok) {
        const data = await res.json();
        if (data.call) {
          set({
            incomingCall: {
              callId: data.call.callId,
              caller: {
                id: data.call.callerId,
                name: data.call.callerName,
                avatar: data.call.callerAvatar,
              },
              callType: data.call.callType,
            },
          });
        }
      }
    } catch (err) {
      // Silently fail — this is background polling
      console.warn('[CallStore] Incoming call check failed:', err);
    }
  },

  // ── Accept an incoming call ───────────────────────────────────────────────

  acceptCall: async (callId) => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    const callType = incomingCall.callType;

    set({
      status: 'connecting',
      callId,
      callType,
      caller: incomingCall.caller,
      incomingCall: null,
      error: null,
    });

    try {
      // 1. Get local media
      const localStream = await requestUserMedia(callType);
      set({ localStream, isVideoOff: callType === 'audio' });

      // 2. Notify server we're accepting
      const acceptRes = await callApi(`/${callId}/accept`, {
        method: 'POST',
      });

      if (!acceptRes.ok) {
        throw new Error('Failed to accept call');
      }

      // 3. Get the caller's offer
      const offerRes = await callApi(`/${callId}/offer`);
      if (!offerRes.ok) {
        throw new Error('Failed to retrieve offer');
      }

      const offerData = await offerRes.json();

      // 4. Create RTCPeerConnection
      const iceServers = offerData.iceServers || DEFAULT_ICE_SERVERS;
      const pc = new RTCPeerConnection({ iceServers });
      peerConnection = pc;

      // 5. Set remote description (the offer)
      await pc.setRemoteDescription(
        new RTCSessionDescription(offerData.sdp)
      );

      // 6. Add local tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // 7. Handle remote tracks
      const remoteStream = new MediaStream();
      set({ remoteStream });

      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        set({ remoteStream });
      };

      // 8. ICE candidate handling
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            await callApi(`/${callId}/ice`, {
              method: 'POST',
              body: JSON.stringify({
                candidate: event.candidate.toJSON(),
                role: 'callee',
              }),
            });
          } catch (err) {
            console.warn('[CallStore] Failed to send ICE candidate:', err);
          }
        }
      };

      // 9. Monitor connection state
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log('[CallStore] ICE connection state:', state);

        if (state === 'connected' || state === 'completed') {
          set({ status: 'connected' });
          if (!durationInterval) {
            durationInterval = setInterval(() => {
              get().updateCallDuration();
            }, 1000);
          }
        } else if (state === 'failed') {
          set({ error: 'Connection failed.' });
          get().endCall();
        }
      };

      // 10. Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 11. Send answer to server
      const answerRes = await callApi(`/${callId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ sdp: answer }),
      });

      if (!answerRes.ok) {
        throw new Error('Failed to send answer');
      }

      // 12. Poll for caller's ICE candidates
      icePollInterval = setInterval(async () => {
        try {
          const iceRes = await callApi(`/${callId}/ice?role=caller`);
          if (iceRes.ok) {
            const iceData = await iceRes.json();
            if (iceData.candidates?.length) {
              for (const candidate of iceData.candidates) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                  console.warn(
                    '[CallStore] Failed to add remote ICE candidate:',
                    err
                  );
                }
              }
            }
          }
        } catch (err) {
          console.warn('[CallStore] ICE poll error:', err);
        }
      }, 1000);
    } catch (err: any) {
      console.error('[CallStore] acceptCall error:', err);
      set({
        status: 'ended',
        error: err.message || 'Failed to accept call',
      });
      closePeerConnection();
      clearAllIntervals();
      stopStream(get().localStream);

      setTimeout(() => {
        set({ ...initialState });
      }, 3000);
    }
  },

  // ── Reject an incoming call ───────────────────────────────────────────────

  rejectCall: async (callId) => {
    try {
      await callApi(`/${callId}/reject`, { method: 'POST' });
    } catch (err) {
      console.warn('[CallStore] Failed to reject call:', err);
    }
    set({ incomingCall: null });
  },

  // ── End the current call ──────────────────────────────────────────────────

  endCall: async () => {
    const { callId, localStream, remoteStream } = get();

    // Notify server
    if (callId) {
      try {
        await callApi(`/${callId}/end`, { method: 'POST' });
      } catch (err) {
        console.warn('[CallStore] Failed to notify call end:', err);
      }
    }

    // Cleanup WebRTC
    closePeerConnection();
    clearAllIntervals();
    stopStream(localStream);
    stopStream(remoteStream);

    set({ status: 'ended' });

    // Reset after brief "ended" display
    setTimeout(() => {
      set({ ...initialState });
    }, 1500);
  },

  // ── Toggle mute ───────────────────────────────────────────────────────────

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // toggle: if muted → enable, if not → disable
      });
    }
    set({ isMuted: !isMuted });
  },

  // ── Toggle video ──────────────────────────────────────────────────────────

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff; // toggle
      });
    }
    set({ isVideoOff: !isVideoOff });
  },

  // ── Duration timer ────────────────────────────────────────────────────────

  updateCallDuration: () => {
    set((state) => ({ callDuration: state.callDuration + 1 }));
  },

  // ── Full reset ────────────────────────────────────────────────────────────

  resetCall: () => {
    const { localStream, remoteStream } = get();
    closePeerConnection();
    clearAllIntervals();
    stopStream(localStream);
    stopStream(remoteStream);
    set({ ...initialState });
  },
}));

// ─── Start / stop incoming call polling ──────────────────────────────────────

export function startIncomingCallPolling() {
  if (incomingPollInterval) return;
  incomingPollInterval = setInterval(() => {
    useCallStore.getState().checkIncomingCalls();
  }, 3000);
}

export function stopIncomingCallPolling() {
  if (incomingPollInterval) {
    clearInterval(incomingPollInterval);
    incomingPollInterval = null;
  }
}
