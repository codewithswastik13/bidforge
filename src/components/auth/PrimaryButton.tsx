import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PrimaryButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  loading?: boolean;
  loadingLabel?: string;
  accent?: 'violet' | 'amber';
  children: ReactNode;
}

/**
 * Gradient CTA with lift-on-hover, press spring, shine sweep and a
 * spinner loading state.
 */
export default function PrimaryButton({
  loading = false,
  loadingLabel,
  accent = 'violet',
  children,
  className,
  disabled,
  ...rest
}: PrimaryButtonProps) {
  const inactive = disabled || loading;

  return (
    <motion.button
      type="submit"
      disabled={inactive}
      aria-busy={loading}
      whileHover={inactive ? undefined : { y: -2 }}
      whileTap={inactive ? undefined : { scale: 0.977 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className={cn(
        'group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-[15px] font-semibold transition-[filter,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b14]',
        accent === 'amber'
          ? 'bg-gradient-to-b from-[#ffc069] to-[#f0982a] text-[#221303] shadow-[0_14px_36px_-12px_rgba(240,152,42,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] hover:shadow-[0_20px_50px_-14px_rgba(240,152,42,0.7),inset_0_1px_0_rgba(255,255,255,0.45)] hover:brightness-105'
          : 'bg-gradient-to-b from-[#8572ff] to-[#5b4bdb] text-white shadow-[0_14px_36px_-12px_rgba(108,88,255,0.6),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_20px_54px_-14px_rgba(108,88,255,0.75),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-[1.07]',
        inactive && 'cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="shine" />
      {loading ? (
        <>
          <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={2.2} />
          <span>{loadingLabel ?? 'Working…'}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
