import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { brand } from '@/config/brand';
import { isEmail } from '@/lib/auth';
import FormError from '@/components/auth/FormError';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { item, itemPress } from '@/components/auth/motionPresets';
import PasswordInput from '@/components/auth/PasswordInput';
import FloatingInput from '@/components/auth/FloatingInput';
import PrimaryButton from '@/components/auth/PrimaryButton';

export interface LoginValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (values: LoginValues) => Promise<void>;
  onGoogle: () => Promise<void>;
  submitting: boolean;
  googleLoading: boolean;
  formError: string | null;
  onSwitchToSignup: () => void;
}

/**
 * "Welcome back" panel: heading, email + password with floating labels,
 * gradient CTA, Google button, sign-up switch and terms — all stagger items.
 */
export default function LoginForm({
  onSubmit,
  onGoogle,
  submitting,
  googleLoading,
  formError,
  onSwitchToSignup,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: typeof fieldErrors = {};
    if (!isEmail(email)) errors.email = 'Enter a valid email address.';
    if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    await onSubmit({ email: email.trim(), password });
  };

  return (
    <div>
      <motion.div variants={item} className="mb-6">
        <h1 className="font-display text-[27px] font-semibold leading-tight tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/50">{brand.authSubline}</p>
      </motion.div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        <FormError message={formError} />
        <motion.div variants={item}>
          <FloatingInput
            label="Email address"
            icon={Mail}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
        </motion.div>
        <motion.div variants={item}>
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
        </motion.div>
        <motion.div variants={itemPress} className="pt-1">
          <PrimaryButton loading={submitting} loadingLabel="Signing in…">
            Sign in
            <ArrowRight
              className="h-[17px] w-[17px] transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={2}
            />
          </PrimaryButton>
        </motion.div>
      </form>

      <motion.div variants={item} className="mt-5 flex items-center gap-3.5">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.13]" />
        <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/35">
          or continue with
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.13]" />
      </motion.div>

      <motion.div variants={itemPress} className="mt-5">
        <GoogleAuthButton onClick={() => void onGoogle()} loading={googleLoading} />
      </motion.div>

      <motion.p variants={item} className="mt-6 text-center text-sm text-white/50">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="group inline-flex items-baseline gap-0.5 font-medium text-[#a79bff] transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b14]"
        >
          Create account
          <span className="inline-block h-px w-0 self-center bg-current transition-all duration-300 group-hover:w-full" />
        </button>
      </motion.p>

      <motion.p variants={item} className="mt-3 text-center text-[11.5px] leading-relaxed text-white/30">
        By continuing, you agree to our{' '}
        <a
          href={brand.links.terms}
          onClick={(e) => e.preventDefault()}
          className="underline-offset-2 transition-colors hover:text-white/55 hover:underline"
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          href={brand.links.privacy}
          onClick={(e) => e.preventDefault()}
          className="underline-offset-2 transition-colors hover:text-white/55 hover:underline"
        >
          Privacy Policy
        </a>
        .
      </motion.p>
    </div>
  );
}
