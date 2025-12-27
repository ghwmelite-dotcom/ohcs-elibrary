import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, Trash2, Play, Pause, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
}

export function VoiceRecorder({
  onSend,
  onCancel,
  isRecording,
  onStartRecording,
}: VoiceRecorderProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analyzer for visualization
      const audioContext = new AudioContext();
      const analyzer = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);
      analyzer.fftSize = 256;
      analyzerRef.current = analyzer;

      // Start visualizing audio level
      const updateLevel = () => {
        if (analyzerRef.current) {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 128) * 100));
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        // Stop stream
        stream.getTracks().forEach((track) => track.stop());

        // Stop visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.start();
      onStartRecording();

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAudioLevel(0);
  };

  // Cancel recording
  const cancelRecording = () => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setPlaybackTime(0);
    onCancel();
  };

  // Send recording
  const sendRecording = () => {
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setPlaybackTime(0);
    }
  };

  // Play/pause preview
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle audio events
  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };

      audio.ontimeupdate = () => {
        setPlaybackTime(Math.floor(audio.currentTime));
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Recording state
  if (isRecording && !audioBlob) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="flex items-center gap-3 px-4 py-3 bg-error-50 dark:bg-error-900/20 rounded-2xl"
      >
        {/* Cancel button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={cancelRecording}
          className="p-2 text-error-500 hover:bg-error-100 dark:hover:bg-error-900/30 rounded-full transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </motion.button>

        {/* Waveform visualization */}
        <div className="flex-1 flex items-center gap-1 h-8">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-error-400 dark:bg-error-500 rounded-full"
              animate={{
                height: `${Math.max(4, audioLevel * (0.3 + Math.random() * 0.7))}%`,
              }}
              transition={{ duration: 0.1 }}
              style={{ minHeight: '4px', maxHeight: '100%' }}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 bg-error-500 rounded-full"
          />
          <span className="text-sm font-medium text-error-600 dark:text-error-400 min-w-[40px]">
            {formatTime(recordingTime)}
          </span>
        </div>

        {/* Stop button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={stopRecording}
          className="p-2.5 bg-error-500 text-white rounded-full shadow-lg"
        >
          <Square className="w-5 h-5" fill="white" />
        </motion.button>
      </motion.div>
    );
  }

  // Preview state
  if (audioBlob && audioUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl"
      >
        {/* Cancel button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={cancelRecording}
          className="p-2 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Play/pause button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlayback}
          className="p-2.5 bg-primary-500 text-white rounded-full"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" fill="white" />
          ) : (
            <Play className="w-5 h-5" fill="white" />
          )}
        </motion.button>

        {/* Progress bar */}
        <div className="flex-1">
          <div className="h-1.5 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-500 rounded-full"
              style={{
                width: `${(playbackTime / recordingTime) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Duration */}
        <span className="text-sm font-medium text-primary-600 dark:text-primary-400 min-w-[40px]">
          {formatTime(isPlaying ? playbackTime : recordingTime)}
        </span>

        {/* Send button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={sendRecording}
          className="p-2.5 bg-success-500 text-white rounded-full shadow-lg"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </motion.div>
    );
  }

  // Idle state - just the mic button
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={startRecording}
      className="p-2 text-surface-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
      title="Record voice message"
    >
      <Mic className="w-5 h-5" />
    </motion.button>
  );
}

// Voice message player component for displaying sent voice messages
export function VoiceMessagePlayer({
  audioUrl,
  duration,
  isOwn,
}: {
  audioUrl: string;
  duration: number;
  isOwn: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadeddata = () => setAudioLoaded(true);
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    return () => {
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[200px]',
        isOwn
          ? 'bg-primary-100 dark:bg-primary-900/30'
          : 'bg-surface-100 dark:bg-surface-700'
      )}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={togglePlayback}
        disabled={!audioLoaded}
        className={cn(
          'p-2.5 rounded-full transition-colors',
          isOwn
            ? 'bg-primary-500 text-white'
            : 'bg-surface-300 dark:bg-surface-600 text-surface-700 dark:text-surface-200'
        )}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" fill="currentColor" />
        ) : (
          <Play className="w-4 h-4" fill="currentColor" />
        )}
      </motion.button>

      <div className="flex-1">
        {/* Waveform visualization (static for now) */}
        <div className="flex items-center gap-0.5 h-6">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-full transition-all duration-150',
                isOwn
                  ? 'bg-primary-400 dark:bg-primary-500'
                  : 'bg-surface-400 dark:bg-surface-500',
                i < (currentTime / duration) * 25 && (isOwn ? 'bg-primary-600' : 'bg-surface-600')
              )}
              style={{
                height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}%`,
              }}
            />
          ))}
        </div>
      </div>

      <span
        className={cn(
          'text-xs font-medium min-w-[36px]',
          isOwn
            ? 'text-primary-600 dark:text-primary-300'
            : 'text-surface-600 dark:text-surface-300'
        )}
      >
        {formatTime(isPlaying ? currentTime : duration)}
      </span>
    </div>
  );
}
