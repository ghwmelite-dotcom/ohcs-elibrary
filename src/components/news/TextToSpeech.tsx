import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface TextToSpeechProps {
  text: string;
  title?: string;
  className?: string;
  variant?: 'button' | 'player';
}

interface VoiceSettings {
  rate: number;
  pitch: number;
  voice: SpeechSynthesisVoice | null;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  rate: 1,
  pitch: 1,
  voice: null,
};

export function TextToSpeech({
  text,
  title,
  className,
  variant = 'button',
}: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for speech synthesis support
  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      // Prefer English voices
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);

      // Set default voice (prefer natural/enhanced voices)
      if (!settings.voice && englishVoices.length > 0) {
        const naturalVoice = englishVoices.find(v =>
          v.name.includes('Natural') ||
          v.name.includes('Enhanced') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel')
        );
        setSettings(prev => ({ ...prev, voice: naturalVoice || englishVoices[0] }));
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported, settings.voice]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  }, []);

  const play = useCallback(() => {
    if (!isSupported) return;

    // Clean text for speech
    const cleanText = text
      .replace(/<[^>]+>/g, '') // Remove HTML
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleanText) return;

    // Stop any existing speech
    stop();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    if (settings.voice) {
      utterance.voice = settings.voice;
    }

    // Calculate estimated duration (rough estimate)
    const wordsPerMinute = 150 * settings.rate;
    const wordCount = cleanText.split(/\s+/).length;
    const estimatedDuration = (wordCount / wordsPerMinute) * 60 * 1000;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);

      // Update progress
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / estimatedDuration) * 100, 100);
        setProgress(newProgress);
      }, 100);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utterance.onend = () => {
      stop();
    };

    utterance.onerror = () => {
      stop();
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, text, settings, stop]);

  const togglePlayPause = useCallback(() => {
    if (!isSupported) return;

    if (isPlaying) {
      if (isPaused) {
        speechSynthesis.resume();
      } else {
        speechSynthesis.pause();
      }
    } else {
      play();
    }
  }, [isSupported, isPlaying, isPaused, play]);

  // Skip functionality (restart for skip back, or stop for skip forward)
  const skipBack = useCallback(() => {
    if (isPlaying) {
      stop();
      play();
    }
  }, [isPlaying, stop, play]);

  const skipForward = useCallback(() => {
    stop();
  }, [stop]);

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  // Simple button variant
  if (variant === 'button') {
    return (
      <button
        onClick={togglePlayPause}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          isPlaying
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
            : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400 dark:hover:bg-surface-600',
          className
        )}
        title={isPlaying ? (isPaused ? 'Resume reading' : 'Pause reading') : 'Listen to article'}
      >
        {isPlaying ? (
          isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
        <span>{isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Listen'}</span>
      </button>
    );
  }

  // Full player variant
  return (
    <div className={cn('bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary-500" />
          <span className="font-medium text-surface-900 dark:text-surface-50">
            {isPlaying ? 'Now Reading' : 'Listen to Article'}
          </span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            showSettings
              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
              : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500'
          )}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      {title && isPlaying && (
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-3 line-clamp-1">
          {title}
        </p>
      )}

      {/* Progress bar */}
      {isPlaying && (
        <div className="mb-3">
          <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-500"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={skipBack}
          disabled={!isPlaying}
          className={cn(
            'p-2 rounded-full transition-colors',
            isPlaying
              ? 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
              : 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
          )}
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={togglePlayPause}
          className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors shadow-lg"
        >
          {isPlaying && !isPaused ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>

        <button
          onClick={skipForward}
          disabled={!isPlaying}
          className={cn(
            'p-2 rounded-full transition-colors',
            isPlaying
              ? 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
              : 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
          )}
        >
          <SkipForward className="w-5 h-5" />
        </button>

        {isPlaying && (
          <button
            onClick={stop}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
          >
            <VolumeX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-surface-200 dark:border-surface-700 space-y-4">
              {/* Speed */}
              <div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2 block">
                  Speed: {settings.rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.rate}
                  onChange={(e) => setSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  className="w-full accent-primary-500"
                />
              </div>

              {/* Pitch */}
              <div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2 block">
                  Pitch: {settings.pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.pitch}
                  onChange={(e) => setSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                  className="w-full accent-primary-500"
                />
              </div>

              {/* Voice selection */}
              {availableVoices.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2 block">
                    Voice
                  </label>
                  <select
                    value={settings.voice?.name || ''}
                    onChange={(e) => {
                      const voice = availableVoices.find(v => v.name === e.target.value);
                      setSettings(prev => ({ ...prev, voice: voice || null }));
                    }}
                    className="w-full px-3 py-2 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm"
                  >
                    {availableVoices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
