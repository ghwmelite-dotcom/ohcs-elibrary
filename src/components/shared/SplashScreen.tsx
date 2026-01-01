import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
  minDisplayTime?: number;
}

export function SplashScreen({ onComplete, minDisplayTime = 2500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minDisplayTime) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 16);

    // Hide splash screen after minimum display time
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, minDisplayTime);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [minDisplayTime, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0a0f0d 0%, #0d1a14 50%, #0a0f0d 100%)',
          }}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 107, 63, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 80% 100%, rgba(252, 209, 22, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse 50% 30% at 20% 80%, rgba(206, 17, 38, 0.05) 0%, transparent 50%)
              `,
            }}
          />

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle, index) => (
              <motion.div
                key={index}
                className="absolute rounded-full"
                style={{
                  left: particle.left,
                  top: particle.top,
                  width: particle.size,
                  height: particle.size,
                  background: particle.color,
                  boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
                }}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 1, 0.8, 1, 0],
                  y: [-20, -80, -100, -120, -150],
                  x: [0, particle.drift, particle.drift * 1.5, particle.drift * 2],
                  scale: [0.5, 1, 1.5, 1.2, 0.8],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 text-center">
            {/* Book icon with glow ring */}
            <motion.div
              className="relative mx-auto mb-8"
              style={{ width: 140, height: 120 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* Pulsing glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(252, 209, 22, 0.2), rgba(0, 107, 63, 0.2))',
                  filter: 'blur(20px)',
                }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Animated 3D Book */}
              <motion.div
                className="relative"
                style={{
                  perspective: 600,
                  transformStyle: 'preserve-3d',
                }}
                animate={{
                  rotateY: [-25, -15, -25],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div
                  className="relative mx-auto"
                  style={{
                    width: 72,
                    height: 96,
                    marginTop: 12,
                  }}
                >
                  {/* Book spine */}
                  <div
                    className="absolute left-0 h-full rounded-l"
                    style={{
                      width: 10,
                      background: 'linear-gradient(180deg, #006B3F 0%, #004026 100%)',
                      transform: 'translateX(-100%)',
                      boxShadow: '-2px 4px 10px rgba(0,0,0,0.3)',
                    }}
                  />

                  {/* Book cover */}
                  <div
                    className="absolute inset-0 rounded-r"
                    style={{
                      background: 'linear-gradient(135deg, #006B3F 0%, #004026 100%)',
                      boxShadow: '4px 8px 20px rgba(0,0,0,0.4)',
                      border: '1px solid rgba(252, 209, 22, 0.2)',
                    }}
                  >
                    {/* Gold accent lines */}
                    <div
                      className="absolute top-3 left-3 right-3 rounded"
                      style={{
                        height: 2,
                        background: 'rgba(252, 209, 22, 0.4)',
                      }}
                    />
                    <div
                      className="absolute bottom-3 left-3 right-3 rounded"
                      style={{
                        height: 2,
                        background: 'rgba(252, 209, 22, 0.4)',
                      }}
                    />
                  </div>

                  {/* Book pages */}
                  <div
                    className="absolute rounded-r"
                    style={{
                      right: -4,
                      top: 4,
                      bottom: 4,
                      width: 4,
                      background: 'linear-gradient(90deg, #f5f0e6 0%, #e8e0d0 100%)',
                    }}
                  />

                  {/* Animated page flipping */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-r"
                      style={{
                        right: 1,
                        top: 4,
                        bottom: 4,
                        width: 'calc(100% - 8px)',
                        background: '#f8f5ef',
                        transformOrigin: 'left',
                        boxShadow: '-1px 0 1px rgba(0,0,0,0.05)',
                      }}
                      animate={{
                        rotateY: [0, -30, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: 0.1 * i,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* AI Sparkle */}
              <motion.div
                className="absolute"
                style={{ top: -10, right: 20 }}
                animate={{
                  rotate: [0, 180, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(252, 209, 22, 0.6))',
                  }}
                >
                  <path
                    d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z"
                    fill="#FCD116"
                  />
                </svg>
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <p className="text-white/80 text-base mb-1 tracking-wide">The</p>
              <h1
                className="text-3xl md:text-4xl font-bold mb-1"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                <motion.span
                  className="inline-block"
                  style={{
                    background: 'linear-gradient(135deg, #FCD116 0%, #ffe066 50%, #FCD116 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    backgroundSize: '200% 100%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  AI-Powered
                </motion.span>{' '}
                <span className="text-white">Library</span>
              </h1>
              <p className="text-white/60 text-sm tracking-wider mt-2">
                for Ghana's Civil Service
              </p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="mt-10 mx-auto overflow-hidden rounded-full"
              style={{
                width: 200,
                height: 3,
                background: 'rgba(255, 255, 255, 0.1)',
              }}
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #006B3F, #FCD116, #006B3F)',
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>

            {/* Loading text */}
            <motion.p
              className="mt-4 text-white/40 text-xs tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Loading...
            </motion.p>
          </div>

          {/* Ghana flag stripe */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {[
              { color: '#CE1126' },
              { color: '#FCD116' },
              { color: '#006B3F' },
            ].map((stripe, index) => (
              <motion.span
                key={index}
                className="block rounded"
                style={{
                  width: 28,
                  height: 4,
                  background: stripe.color,
                  boxShadow: `0 0 10px ${stripe.color}66`,
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scaleX: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Particle configuration
const particles = [
  { left: '10%', top: '20%', size: 4, color: 'rgba(252, 209, 22, 0.6)', duration: 12, delay: 0, drift: 15 },
  { left: '20%', top: '80%', size: 3, color: 'rgba(0, 107, 63, 0.5)', duration: 18, delay: 2, drift: -10 },
  { left: '80%', top: '30%', size: 4, color: 'rgba(252, 209, 22, 0.5)', duration: 14, delay: 4, drift: 20 },
  { left: '70%', top: '70%', size: 3, color: 'rgba(0, 107, 63, 0.4)', duration: 16, delay: 1, drift: -15 },
  { left: '50%', top: '10%', size: 3, color: 'rgba(252, 209, 22, 0.4)', duration: 20, delay: 3, drift: 10 },
  { left: '30%', top: '60%', size: 2, color: 'rgba(206, 17, 38, 0.35)', duration: 13, delay: 5, drift: -5 },
  { left: '90%', top: '50%', size: 3, color: 'rgba(252, 209, 22, 0.5)', duration: 17, delay: 2.5, drift: -20 },
  { left: '5%', top: '50%', size: 2, color: 'rgba(0, 107, 63, 0.4)', duration: 15, delay: 4.5, drift: 8 },
];
