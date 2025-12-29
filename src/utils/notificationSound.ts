/**
 * Notification Sound Utility
 * Uses Web Audio API to generate notification sounds programmatically
 * No external sound files needed!
 */

let audioContext: AudioContext | null = null;

// Initialize audio context on first interaction
function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  return audioContext;
}

/**
 * Play a pleasant notification chime
 * Uses two sine waves for a harmonious sound
 */
export function playNotificationSound(volume: number = 0.3): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const duration = 0.15;

  // Create two oscillators for a pleasant chime
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();

  // First tone - higher pitch
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now); // A5
  osc1.frequency.exponentialRampToValueAtTime(660, now + duration); // E5

  // Second tone - lower harmony
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(523.25, now); // C5
  osc2.frequency.exponentialRampToValueAtTime(392, now + duration); // G4

  // Envelope for smooth fade
  gain1.gain.setValueAtTime(volume, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);

  gain2.gain.setValueAtTime(volume * 0.6, now);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + duration);

  // Connect nodes
  osc1.connect(gain1);
  osc2.connect(gain2);
  gain1.connect(ctx.destination);
  gain2.connect(ctx.destination);

  // Play
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);

  // Cleanup
  setTimeout(() => {
    osc1.disconnect();
    osc2.disconnect();
    gain1.disconnect();
    gain2.disconnect();
  }, duration * 1000 + 100);
}

/**
 * Play a success sound (for achievements, level ups)
 */
export function playSuccessSound(volume: number = 0.4): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // Ascending arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.08);

    gain.gain.setValueAtTime(0, now + i * 0.08);
    gain.gain.linearRampToValueAtTime(volume, now + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.25);
  });
}

/**
 * Play an alert sound (for urgent notifications)
 */
export function playAlertSound(volume: number = 0.4): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const duration = 0.1;

  // Two-tone alert
  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now + i * 0.15);

    gain.gain.setValueAtTime(volume * 0.5, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + duration);
  }
}

/**
 * Play a subtle tick sound (for minor events)
 */
export function playTickSound(volume: number = 0.2): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

// Export default for simple usage
export default {
  notification: playNotificationSound,
  success: playSuccessSound,
  alert: playAlertSound,
  tick: playTickSound
};
