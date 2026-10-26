import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WebPImg } from '../lib/webp';

/**
 * Premium boot loader — ink + orange brand language
 * Uses a compact spinner (not a giant logo flash).
 */

const MESSAGES = [
  'Preparing your counselling desk',
  'Loading seat intelligence',
  'Syncing cut-off bands',
  'Almost ready',
];

function useBootVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Never show loader on dashboard or admin pages
    const path = window.location.pathname;
    if (path.startsWith('/dashboard') || path.startsWith('/admin')) return;

    try {
      if (sessionStorage.getItem('mbbs-wala-loader-done') === '1') return;
    } catch {
      /* private mode */
    }
    setVisible(true);
  }, []);

  return [visible, setVisible] as const;
}

function markDone() {
  try {
    sessionStorage.setItem('mbbs-wala-loader-done', '1');
  } catch {
    /* ignore */
  }
}

export default function PremiumLoader() {
  const [visible, setVisible] = useBootVisible();
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const DURATION = 1400;
    const start = performance.now();
    let raf = 0;
    let closed = false;

    const finish = () => {
      if (closed) return;
      closed = true;
      markDone();
      setProgress(100);
      window.setTimeout(() => setVisible(false), 280);
    };

    const hardStop = window.setTimeout(finish, DURATION + 600);

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 2.6);
      setProgress(Math.round(eased * 100));
      setMsgIdx(Math.min(MESSAGES.length - 1, Math.floor(t * MESSAGES.length)));
      if (t < 1) raf = requestAnimationFrame(frame);
      else finish();
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hardStop);
    };
  }, [visible, setVisible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden select-none bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          aria-busy="true"
          aria-label="Loading MBBS WAALA"
        >
          <div className="relative w-full max-w-[320px] px-6 flex flex-col items-center">
            
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <WebPImg
                src="/images/mbbswala/logo.png"
                alt="MBBS WAALA"
                className="h-28 w-auto object-contain"
                draggable={false}
                fetchPriority="high"
              />
            </motion.div>

            {/* Progress Bar Container */}
            <div className="w-full max-w-[240px]">
              <div className="relative h-1.5 rounded-full overflow-hidden bg-gray-100">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.max(5, progress)}%`,
                    background: 'linear-gradient(90deg, #3B82F6 0%, #EC4899 100%)',
                  }}
                  transition={{ ease: "linear" }}
                />
              </div>

              {/* Loading Text */}
              <div className="mt-4 flex justify-center">
                <motion.p
                  className="text-sm font-medium tracking-wide text-gray-600"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                >
                  Loading...
                </motion.p>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
