import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  useId,
  useState,
  type FocusEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

interface FloatingInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'placeholder' | 'size'> {
  label: string;
  icon: LucideIcon;
  error?: string | null;
  trailing?: ReactNode;
}

/**
 * Premium text field: floating label, soft focus glow, inline error reveal.
 */
export default function FloatingInput({
  label,
  icon: Icon,
  error,
  trailing,
  onFocus,
  onBlur,
  value,
  ...inputProps
}: FloatingInputProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const filled = typeof value === 'string' && value.length > 0;
  const floated = focused || filled;

  const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <div>
      <div
        className={cn(
          'group relative rounded-2xl border bg-white/[0.035] transition-[border-color,background-color,box-shadow] duration-300',
          error
            ? 'border-rose-400/40 focus-within:border-rose-400/70 focus-within:shadow-[0_0_0_4px_rgba(251,113,133,0.12)]'
            : 'border-white/10 hover:border-white/[0.16] focus-within:border-[#8b7cff]/60 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_4px_rgba(124,108,255,0.13),0_14px_40px_-16px_rgba(124,108,255,0.4)]',
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        <Icon
          strokeWidth={1.8}
          className={cn(
            'pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 transition-colors duration-300',
            error ? 'text-rose-300/80' : focused ? 'text-[#a79bff]' : 'text-white/35',
          )}
        />
        <input
          id={id}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={error ? true : undefined}
          className={cn(
            'autofill-fix h-[58px] w-full bg-transparent pb-1.5 pl-11 pr-5 pt-5 text-[15px] text-white caret-[#a79bff] outline-none',
            !!trailing && 'pr-12',
          )}
          {...inputProps}
        />
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute left-11 origin-left transition-all duration-300 ease-out',
            floated
              ? 'top-[13px] translate-y-0 text-[11px] tracking-[0.08em]'
              : 'top-1/2 -translate-y-1/2 text-[15px]',
            error
              ? 'text-rose-200/70'
              : floated
                ? focused
                  ? 'text-[#a79bff]'
                  : 'text-white/45'
                : 'text-white/40',
          )}
        >
          {label}
        </label>
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="error"
            role="alert"
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="pl-1.5 text-xs text-rose-300/90">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
