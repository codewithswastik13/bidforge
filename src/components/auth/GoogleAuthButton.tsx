import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Official four-colour Google "G" mark. */
export function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

interface GoogleAuthButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  loading?: boolean;
  label?: string;
  loadingLabel?: string;
}

/**
 * "Continue with Google" with premium hover (lift + glow + icon nudge)
 * and an in-button connecting state.
 */
export default function GoogleAuthButton({
  loading = false,
  label = 'Continue with Google',
  loadingLabel = 'Connecting to Google…',
  className,
  disabled,
  ...rest
}: GoogleAuthButtonProps) {
  const inactive = disabled || loading;

  return (
    <motion.button
      type="button"
      disabled={inactive}
      aria-busy={loading}
      whileHover={inactive ? undefined : { y: -1.5, scale: 1.012 }}
      whileTap={inactive ? undefined : { scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className={cn(
        'group relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.055] text-[14.5px] font-medium text-white/90 transition-[background-color,border-color,box-shadow] duration-300',
        'hover:border-white/20 hover:bg-white/[0.09] hover:shadow-[0_10px_34px_-10px_rgba(255,255,255,0.18)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b14]',
        inactive && 'cursor-not-allowed opacity-80',
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="shine" />
      <span className="relative flex h-5 w-5 items-center justify-center">
        {loading ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin text-white/70" strokeWidth={2.2} />
        ) : (
          <GoogleGlyph className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-px group-hover:scale-110" />
        )}
      </span>
      <span>{loading ? loadingLabel : label}</span>
    </motion.button>
  );
}
