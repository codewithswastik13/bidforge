import { Eye, EyeOff, Lock, type LucideIcon } from 'lucide-react';
import { useState, type ChangeEventHandler, type FocusEventHandler } from 'react';
import { motion } from 'framer-motion';
import FloatingInput from '@/components/auth/FloatingInput';

interface PasswordInputProps {
  label?: string;
  name?: string;
  autoComplete?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  error?: string | null;
  icon?: LucideIcon;
}

/** Password field with an animated show/hide toggle. */
export default function PasswordInput({
  label = 'Password',
  icon: Icon = Lock,
  ...props
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <FloatingInput
      {...props}
      label={label}
      icon={Icon}
      type={show ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
        >
          <motion.span
            key={show ? 'shown' : 'hidden'}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.16 }}
            className="flex"
          >
            {show ? (
              <EyeOff className="h-[17px] w-[17px]" strokeWidth={1.8} />
            ) : (
              <Eye className="h-[17px] w-[17px]" strokeWidth={1.8} />
            )}
          </motion.span>
        </button>
      }
    />
  );
}
