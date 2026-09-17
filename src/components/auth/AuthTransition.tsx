/* eslint-disable react-hooks/set-state-in-effect -- preserved cinematic design code: state syncs with intro lifecycle, not derivable state */
import {
  motion,
  useAnimationControls,
  useReducedMotion,
} from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouterStore } from '@/store/router';
import { brand, INTRO_FLAG } from '../../config/brand';
import { cn } from '../../lib/utils';
import AuthCard from './AuthCard';
import AuthBackground from './AuthBackground';
import BrandMark from './BrandMark';
import RabbitIntro from './RabbitIntro';
import { EASE_CINEMATIC, fade, item } from './motionPresets';

type Mode = 'intro' | 'ready';

/**
 * Orchestrates the whole experience as one continuous animation:
 *
 *   fullscreen rabbit video → (ends / skipped / fallback)
 *     → the stage morphs into its slot (desktop: cinematic left hero,
 *       mobile: porthole above the card)
 *     → background + login card stagger in (blur + opacity + translate)
 *
 * Returning visitors (or reduced-motion users) get a short brand flourish
 * instead of the video; a "Replay intro" control re-runs the full sequence.
 */
export default function AuthTransition() {
  const navigate = useRouterStore((s) => s.navigate);
  const controls = useAnimationControls();
  const prefersReducedMotion = useReducedMotion();
  const slotRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  // `?intro=1` always plays the full cinematic intro, ignoring the
  // returning-visitor flag and reduced-motion shortcut.
  const [forceIntro] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).has('intro');
    } catch {
      return false;
    }
  });
  const reducedMotion = !!prefersReducedMotion && !forceIntro;

  const [mode, setMode] = useState<Mode>('intro');
  const [uiVisible, setUiVisible] = useState(false);
  const [variant, setVariant] = useState<'full' | 'short'>(() => {
    try {
      if (new URLSearchParams(window.location.search).has('intro')) return 'full';
      if (localStorage.getItem(INTRO_FLAG) === '1') return 'short';
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'short';
    } catch {
      /* storage unavailable — default to the full intro */
    }
    return 'full';
  });
  const [replayKey, setReplayKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const introActive = mode === 'intro' && !uiVisible;

  const placeInSlot = useCallback(
    (animate: boolean) => {
      const slot = slotRef.current;
      if (!slot) return;
      const r = slot.getBoundingClientRect();
      const isDesktop = window.innerWidth >= 1024;
      const target = {
        x: r.left,
        y: r.top,
        width: r.width,
        height: r.height,
        borderRadius: isDesktop ? 36 : 999,
      };
      if (animate) {
        return controls.start(target, { duration: 1.3, ease: EASE_CINEMATIC, delay: 0.12 });
      }
      controls.set(target);
      return Promise.resolve();
    },
    [controls],
  );

  /** Intro finished (ended, skipped or fallback) — morph into the login layout. */
  const handleIntroFinish = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    setUiVisible(true);
    const run = async () => {
      if (reducedMotion) {
        placeInSlot(false);
      } else {
        await placeInSlot(true);
      }
      setMode('ready');
      setVariant('short');
      try {
        localStorage.setItem(INTRO_FLAG, '1');
      } catch {
        /* storage unavailable */
      }
      busyRef.current = false;
    };
    void run();
  }, [placeInSlot, reducedMotion]);

  /** Replay the full cinematic intro. */
  const replay = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setUiVisible(false);
    setMode('intro');
    await controls.start(
      { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: 0 },
      { duration: 0.95, ease: EASE_CINEMATIC },
    );
    setVariant('full');
    setReplayKey((k) => k + 1);
    busyRef.current = false;
    setBusy(false);
  }, [controls]);

  // Reduced motion: place the stage instantly, skip all cinematic movement.
  useLayoutEffect(() => {
    if (!reducedMotion) return;
    placeInSlot(false);
    setMode('ready');
    setUiVisible(true);
    setVariant('short');
  }, [reducedMotion, placeInSlot]);

  // Brand the browser tab while the sign-in experience is on screen.
  useEffect(() => {
    document.title = 'Sign in · BidForge';
    return () => {
      document.title = 'BidForge — The Auction Moves In Real Time';
    };
  }, []);

  // Keep the stage glued to its slot across resize + inner scrolling.
  useEffect(() => {
    const reposition = () => {
      if (mode === 'ready') {
        placeInSlot(false);
      } else if (mode === 'intro' && !uiVisible && variant === 'full') {
        controls.set({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: 0 });
      }
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [mode, uiVisible, variant, controls, placeInSlot]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#05050a]">
      <AuthBackground />

      {/* Final layout — always rendered; the stage morphs into its slot. */}
      <main
        className={cn(
          'relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col lg:grid lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:gap-10',
          mode === 'intro' ? 'overflow-hidden' : 'overflow-y-auto lg:overflow-visible',
        )}
      >
        {/* Rabbit slot: desktop hero / mobile porthole */}
        <div className="flex shrink-0 flex-col items-center justify-center gap-4 px-6 pb-1 pt-9 lg:pt-6">
          <div className="relative">
            <motion.div
              aria-hidden
              variants={fade}
              initial="hidden"
              animate={uiVisible ? 'visible' : 'hidden'}
              className="pointer-events-none absolute inset-0 m-auto h-[130%] w-[115%] rounded-full bg-[#6d5ae6]/[0.14] blur-[100px]"
            />
            <div
              ref={slotRef}
              aria-hidden
              className="relative h-28 w-28 rounded-full lg:h-[min(56vh,520px)] lg:w-[min(42vw,600px)] lg:rounded-[36px]"
            />
          </div>
          <motion.p
            variants={item}
            initial="hidden"
            animate={uiVisible ? 'visible' : 'hidden'}
            className="hidden text-[11.5px] font-medium uppercase tracking-[0.3em] text-white/35 lg:block"
          >
            {brand.tagline}
          </motion.p>
        </div>

        {/* Login / signup card */}
        <div className="flex flex-1 items-start justify-center px-5 pb-20 pt-3 lg:items-center lg:pb-24 lg:pt-0">
          <AuthCard uiVisible={uiVisible} />
        </div>
      </main>

      {/* Footer controls */}
      <motion.footer
        className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-6 pb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: uiVisible ? 1 : 0 }}
        transition={{ delay: uiVisible ? 0.9 : 0, duration: 0.6 }}
      >
        <button
          type="button"
          onClick={() => void replay()}
          disabled={busy || mode === 'intro'}
          className="group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/35 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none"
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180" />
          Replay intro
        </button>
        <button
          type="button"
          onClick={() => navigate('organizer')}
          className="rounded-full px-3 py-1.5 text-xs text-white/35 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Organizer access
        </button>
      </motion.footer>

      {/* The morphing stage that carries the rabbit video */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-30 overflow-hidden will-change-[transform,width,height]"
        initial={
          variant === 'short'
            ? {
                x: (window.innerWidth - 120) / 2,
                y: Math.max(window.innerHeight * 0.38 - 60, 24),
                width: 120,
                height: 120,
                borderRadius: 999,
              }
            : { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: 0 }
        }
        animate={controls}
      >
        <RabbitIntro
          variant={variant}
          active={introActive}
          replayKey={replayKey}
          onFinish={handleIntroFinish}
        />
      </motion.div>

      {/* Minimal brand whisper during the intro */}
      <motion.div
        className="absolute left-6 top-6 z-40"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: introActive ? 0.7 : 0, y: introActive ? 0 : -8 }}
        transition={{ duration: 0.6 }}
      >
        <BrandMark size={26} withWordmark />
      </motion.div>
    </div>
  );
}
