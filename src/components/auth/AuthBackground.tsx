import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AuthBackgroundProps {
  variant?: 'user' | 'admin';
}

interface BlobSpec {
  className: string;
  px: number;
  py: number;
  duration: number;
}

const BLOBS: Record<'user' | 'admin', BlobSpec[]> = {
  user: [
    {
      className: '-top-[16%] left-[2%] h-[58vmin] w-[58vmin] bg-[#6d5ae6] opacity-[0.20]',
      px: 34,
      py: 22,
      duration: 26,
    },
    {
      className: 'right-[-12%] top-[28%] h-[64vmin] w-[64vmin] bg-[#4338ca] opacity-[0.16]',
      px: -26,
      py: 18,
      duration: 32,
    },
    {
      className: 'bottom-[-24%] left-[34%] h-[52vmin] w-[52vmin] bg-[#ffb454] opacity-[0.07]',
      px: 18,
      py: -14,
      duration: 38,
    },
  ],
  admin: [
    {
      className: '-top-[16%] right-[4%] h-[56vmin] w-[56vmin] bg-[#f59e2d] opacity-[0.12]',
      px: 30,
      py: 20,
      duration: 28,
    },
    {
      className: 'left-[-14%] top-[34%] h-[60vmin] w-[60vmin] bg-[#c2410c] opacity-[0.10]',
      px: -24,
      py: 16,
      duration: 34,
    },
    {
      className: 'bottom-[-22%] right-[30%] h-[50vmin] w-[50vmin] bg-[#6d5ae6] opacity-[0.07]',
      px: 16,
      py: -12,
      duration: 40,
    },
  ],
};

function Blob({
  spec,
  sx,
  sy,
  reduced,
}: {
  spec: BlobSpec;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  reduced: boolean;
}) {
  const x = useTransform(sx, (v) => v * spec.px);
  const y = useTransform(sy, (v) => v * spec.py);
  return (
    <motion.div style={{ x, y }} className={cn('absolute rounded-full blur-[130px]', spec.className)}>
      <motion.div
        className="h-full w-full rounded-full"
        animate={
          reduced
            ? undefined
            : { scale: [1, 1.16, 0.94, 1], opacity: [0.75, 1, 0.7, 0.75] }
        }
        transition={{ duration: spec.duration, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

/**
 * Cinematic scene backdrop: deep-space base, drifting aurora blobs with
 * mouse parallax, film grain and a vignette.
 */
export default function AuthBackground({ variant = 'user' }: AuthBackgroundProps) {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 45, damping: 20 });
  const sy = useSpring(my, { stiffness: 45, damping: 20 });

  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my, reduced]);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-[#05050a]">
      <div className="bg-scene-base absolute inset-0" />
      {BLOBS[variant].map((spec, i) => (
        <Blob key={i} spec={spec} sx={sx} sy={sy} reduced={!!reduced} />
      ))}
      <div className="auth-grain absolute inset-0 opacity-[0.05] mix-blend-overlay" />
      <div className="bg-vignette absolute inset-0" />
    </div>
  );
}
