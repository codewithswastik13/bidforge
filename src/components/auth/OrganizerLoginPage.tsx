'use client';

import { motion, useAnimationControls } from 'framer-motion';
import { ArrowLeft, ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useRouterStore } from '@/store/router';
import { useAuthStore } from '@/store/auth';
import { getAuthProvider, AuthError, type AuthResult } from '@/lib/auth';
import AuthBackground from '@/components/auth/AuthBackground';
import BrandMark from '@/components/auth/BrandMark';
import FloatingInput from '@/components/auth/FloatingInput';
import FormError from '@/components/auth/FormError';
import { item, staggerVariants } from '@/components/auth/motionPresets';
import PasswordInput from '@/components/auth/PasswordInput';
import PrimaryButton from '@/components/auth/PrimaryButton';

/**
 * Organizer Access — a completely separate organizer authentication flow.
 * User ID + password only. No Google, no public signup, none of the
 * consumer login UI. Verification runs through the auth provider seam:
 * the live backend enforces the ADMIN role; the demo provider covers
 * engine-down mode. Successful sign-in opens the Admin Console.
 */
export default function OrganizerLoginPage() {
  const navigate = useRouterStore((s) => s.navigate);
  const loginWithBackend = useAuthStore((s) => s.loginWithBackend);
  const loginAdminMock = useAuthStore((s) => s.loginAdmin);
  const shake = useAnimationControls();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ userId?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Organizer Access · BidForge';
    return () => {
      document.title = 'BidForge — The Auction Moves In Real Time';
    };
  }, []);

  const adoptAdminSession = (r: AuthResult) => {
    if (r.token && !r.token.startsWith('demo-')) {
      loginWithBackend({
        token: r.token,
        userId: r.user.id,
        username: r.user.name,
        role: 'ADMIN',
      });
    } else {
      loginAdminMock(r.user.email);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: typeof fieldErrors = {};
    if (!userId.trim()) errors.userId = 'Enter your organizer user ID.';
    if (password.length < 6) errors.password = 'Enter your organizer password.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFormError(null);
    setSubmitting(true);
    try {
      const provider = await getAuthProvider();
      const result = await provider.signInAsAdmin({ userId, password });
      adoptAdminSession(result);
      toast.success('Admin session started', { description: 'Operations console unlocked.' });
      navigate('admin');
    } catch (err) {
      setFormError(err instanceof AuthError ? err.message : 'Unable to verify. Try again.');
      void shake.start({ x: [0, -10, 10, -6, 6, -2, 0] }, { duration: 0.5, ease: 'easeOut' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#05050a]">
      <AuthBackground variant="admin" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto px-5 py-10">
        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
          className="flex w-full max-w-[400px] flex-col items-center"
        >
          <motion.div variants={item} className="mb-9 flex items-center gap-3 opacity-80">
            <BrandMark size={24} withWordmark />
            <span className="h-4 w-px bg-white/15" />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
              Admin
            </span>
          </motion.div>

          <motion.div variants={item} className="relative mb-7">
            <div aria-hidden className="absolute -inset-4 rounded-3xl bg-[#ffb454]/10 blur-2xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ffb454]/25 bg-[#ffb454]/[0.06]">
              <ShieldCheck className="h-7 w-7 text-[#ffc069]" strokeWidth={1.6} />
            </div>
          </motion.div>

          <motion.div variants={item} className="mb-8 text-center">
            <h1 className="font-display text-[27px] font-semibold tracking-tight text-white">
              Organizer Access
            </h1>
            <p className="mt-1.5 text-[14px] text-white/50">
              Admin sign-in only · authorized personnel.
            </p>
          </motion.div>

          <motion.section
            variants={item}
            className="w-full rounded-[24px] border border-white/[0.08] bg-white/[0.045] shadow-[0_40px_90px_-28px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <motion.div animate={shake} className="relative p-6 sm:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffc069]/40 to-transparent"
              />
              <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
                <FormError message={formError} />
                <FloatingInput
                  label="User ID"
                  icon={KeyRound}
                  name="userId"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  error={fieldErrors.userId}
                />
                <PasswordInput
                  label="Password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fieldErrors.password}
                />
                <div className="pt-1">
                  <PrimaryButton
                    accent="amber"
                    loading={submitting}
                    loadingLabel="Verifying access…"
                  >
                    Enter Admin Portal
                    <ArrowRight
                      className="h-[17px] w-[17px] transition-transform duration-300 group-hover:translate-x-1"
                      strokeWidth={2}
                    />
                  </PrimaryButton>
                </div>
              </form>
            </motion.div>
          </motion.section>

          <motion.p variants={item} className="mt-7 text-center text-[13px] text-white/45">
            <button
              type="button"
              onClick={() => navigate('auth')}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to participant sign in
            </button>
          </motion.p>
        </motion.div>

        <p className="mt-10 text-center text-[11px] text-white/25">
          Separate authentication flow — no Google, no public signup.
        </p>
      </div>
    </div>
  );
}
