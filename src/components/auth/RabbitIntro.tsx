/* eslint-disable react-hooks/set-state-in-effect -- preserved cinematic design code: state syncs with intro lifecycle, not derivable state */
import { AnimatePresence, motion } from 'framer-motion';
import { SkipForward } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { brand } from '@/config/brand';
import { cn } from '@/lib/utils';
import { RabbitGlyph } from '@/components/auth/BrandMark';

type VideoState = 'loading' | 'playing' | 'ended' | 'error';

interface RabbitIntroProps {
  /** 'full' plays the video; 'short' shows a compact brand flourish instead. */
  variant: 'full' | 'short';
  /** True while the intro owns the screen. */
  active: boolean;
  /** Changing this remounts (and replays) the video. */
  replayKey: number;
  /** Fired once when the intro is done (ended, skipped or fallback finished). */
  onFinish: () => void;
}

/**
 * The opening act: the rabbit video, full-bleed and muted, with a hairline
 * progress bar and a subtle skip affordance. Degrades gracefully — if the
 * video stalls or fails, an animated brand emblem takes over and the intro
 * still resolves.
 */
export default function RabbitIntro({ variant, active, replayKey, onFinish }: RabbitIntroProps) {
  const [videoState, setVideoState] = useState<VideoState>('loading');
  const [progress, setProgress] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const finishedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const short = variant === 'short';

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  // Skip affordance appears after a beat so it never steals the first impression.
  useEffect(() => {
    if (!active) return;
    setShowSkip(false);
    const t = window.setTimeout(() => setShowSkip(true), short ? 350 : 1500);
    return () => window.clearTimeout(t);
  }, [active, short]);

  // Short variant: brand flourish beat, then hand over.
  useEffect(() => {
    if (!active || !short) return;
    const t = window.setTimeout(finish, 1250);
    return () => window.clearTimeout(t);
  }, [active, short, finish]);

  // Loading watchdog — if the video never becomes playable, use the fallback.
  useEffect(() => {
    if (!active || short || videoState !== 'loading') return;
    const t = window.setTimeout(() => {
      setVideoState((s) => (s === 'loading' ? 'error' : s));
    }, 9000);
    return () => window.clearTimeout(t);
  }, [active, short, videoState, replayKey]);

  // Fallback emblem plays a moment, then the intro resolves anyway.
  useEffect(() => {
    if (videoState !== 'error' || !active) return;
    const t = window.setTimeout(finish, 2600);
    return () => window.clearTimeout(t);
  }, [videoState, active, finish]);

  // Let the final frame breathe for a beat before morphing.
  useEffect(() => {
    if (videoState !== 'ended' || !active) return;
    const t = window.setTimeout(finish, 420);
    return () => window.clearTimeout(t);
  }, [videoState, active, finish]);

  // Pause playback as soon as the intro stops owning the screen.
  useEffect(() => {
    if (!active) videoRef.current?.pause();
  }, [active]);

  // Escape skips the intro, matching the skip button.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, finish]);

  const handleCanPlay = () => {
    const v = videoRef.current;
    if (!v || short) return; // short mode keeps the video as a still frame
    v.play()
      .then(() => setVideoState('playing'))
      .catch(() => {
        // Autoplay refused (e.g. low-power mode) — hold the first frame
        // briefly, then continue gracefully.
        setVideoState('ended');
      });
  };

  return (
    <div className="relative h-full w-full">
      {/* Backing layer: keeps the stage intentional even before/without video frames */}
      <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_120%_at_50%_40%,#151528_0%,#0a0a14_70%)]">
        <RabbitGlyph className="h-1/3 w-1/3 opacity-25" />
      </div>

      <video
        key={replayKey}
        ref={videoRef}
        className="relative h-full w-full object-cover object-[68%_50%] brightness-[0.97] saturate-[1.05] contrast-[1.02] lg:object-[50%_50%]"
        src={brand.rabbitVideoUrl}
        autoPlay={!short}
        muted
        playsInline
        loop={false}
        preload={short ? 'metadata' : 'auto'}
        disablePictureInPicture
        disableRemotePlayback
        onCanPlay={handleCanPlay}
        onPlaying={() => setVideoState('playing')}
        onEnded={() => setVideoState('ended')}
        onError={() => setVideoState('error')}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration > 0) setProgress(v.currentTime / v.duration);
        }}
        aria-hidden="true"
      />

      {/* Grade: blends the video's edges into the page scene */}
      <div aria-hidden className="stage-fade pointer-events-none absolute inset-0" />

      {/* Loading pulse while the video buffers */}
      <AnimatePresence>
        {active && !short && videoState === 'loading' && (
          <motion.div
            key="loading"
            className="absolute inset-0 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-white/50"
                  style={{ animation: `loading-pulse 1.2s ease-in-out ${i * 0.18}s infinite` }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback emblem when the video can't play */}
      <AnimatePresence>
        {videoState === 'error' && (
          <motion.div
            key="fallback"
            className="absolute inset-0 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <FallbackEmblem />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Short-intro brand flourish (returning visitors) */}
      <AnimatePresence>
        {short && active && (
          <motion.div
            key="flourish"
            className="absolute inset-0 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <FallbackEmblem compact />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress hairline */}
      <AnimatePresence>
        {active && !short && videoState === 'playing' && (
          <motion.div
            key="progress"
            className="absolute inset-x-0 bottom-0 h-[2.5px] origin-left bg-gradient-to-r from-[#8b7cff] via-[#a79bff] to-[#ffb454]"
            style={{ scaleX: progress }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Skip */}
      <AnimatePresence>
        {active && showSkip && (
          <motion.button
            key="skip"
            type="button"
            onClick={finish}
            className={cn(
              'group absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-full border border-white/[0.12] bg-black/25 px-4 py-2 text-[13px] font-medium text-white/70 backdrop-blur-md transition-colors duration-300',
              'hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.5 } }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
          >
            Skip intro
            <SkipForward className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Animated logo emblem with pulsing rings — the video-free stand-in. */
function FallbackEmblem({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('relative grid place-items-center', compact ? 'h-16 w-16' : 'h-44 w-44')}>
      {[0, 1.1].map((delay) => (
        <motion.span
          key={delay}
          className="absolute inset-0 rounded-full border border-[#8b7cff]/40"
          animate={{ scale: [0.7, 1.6], opacity: [0.7, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <RabbitGlyph className={compact ? 'h-10 w-10' : 'h-24 w-24'} />
      </motion.div>
    </div>
  );
}
