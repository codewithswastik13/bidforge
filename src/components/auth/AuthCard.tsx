'use client';

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouterStore } from '@/store/router';
import { useAuthStore } from '@/store/auth';
import { getAuthProvider } from '@/lib/auth';
import { AuthError, type AuthResult } from '@/lib/auth';
import LoginForm, { type LoginValues } from '@/components/auth/LoginForm';
import SignupForm, { type SignupValues } from '@/components/auth/SignupForm';
import BrandMark from '@/components/auth/BrandMark';
import { cardVariants, item, panelVariants } from '@/components/auth/motionPresets';

type Pending = 'none' | 'password' | 'google';

/**
 * Glass auth card. Owns the auth wiring (provider seam + BidForge session
 * store) and the login ⇄ signup swap; the UI forms themselves stay
 * logic-free. Design preserved from the merged login design.
 */
export default function AuthCard({ uiVisible }: { uiVisible: boolean }) {
  const navigate = useRouterStore((s) => s.navigate);
  const loginMock = useAuthStore((s) => s.login);
  const loginAdminMock = useAuthStore((s) => s.loginAdmin);
  const loginWithBackend = useAuthStore((s) => s.loginWithBackend);
  const reducedMotion = useReducedMotion();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [pending, setPending] = useState<Pending>('none');
  const [formError, setFormError] = useState<string | null>(null);

  // Subtle 3D parallax: the card leans a degree or two toward the cursor.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, (v) => v * 1.8), { stiffness: 140, damping: 20 });
  const rotateX = useSpring(useTransform(py, (v) => v * -1.4), { stiffness: 140, damping: 20 });

  useEffect(() => {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (e: MouseEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [px, py, reducedMotion]);

  const toMessage = (e: unknown) =>
    e instanceof AuthError ? e.message : 'Something went wrong. Please try again.';

  /** Applies a provider result to the BidForge session store. */
  const adoptSession = (r: AuthResult) => {
    if (r.token && r.token !== 'demo-token' && r.token !== 'demo-admin-token') {
      loginWithBackend({
        token: r.token,
        userId: r.user.id,
        username: r.user.name,
        role: r.user.role === 'admin' ? 'ADMIN' : 'BIDDER',
      });
    } else if (r.user.role === 'admin') {
      loginAdminMock(r.user.email);
    } else {
      loginMock(r.user.email);
    }
  };

  const handleLogin = async (values: LoginValues) => {
    setFormError(null);
    setPending('password');
    try {
      const provider = await getAuthProvider();
      const r = await provider.signInWithPassword(values);
      adoptSession(r);
      toast.success(`Welcome back, ${r.user.name.split(' ')[0]}`, {
        description: 'Live rooms are open — good luck out there.',
      });
      navigate('home');
    } catch (e) {
      setFormError(toMessage(e));
    } finally {
      setPending('none');
    }
  };

  const handleSignup = async (values: SignupValues) => {
    setFormError(null);
    setPending('password');
    try {
      const provider = await getAuthProvider();
      const r = await provider.signUpWithPassword(values);
      adoptSession(r);
      toast.success('Account created', {
        description: `Welcome aboard, ${r.user.name.split(' ')[0]} — keep funds ready before bidding.`,
      });
      navigate('home');
    } catch (e) {
      setFormError(toMessage(e));
    } finally {
      setPending('none');
    }
  };

  const handleGoogle = async () => {
    setFormError(null);
    setPending('google');
    try {
      const provider = await getAuthProvider();
      await provider.signInWithGoogle();
    } catch (e) {
      const message = toMessage(e);
      if (e instanceof AuthError && e.code === 'auth/google-unavailable') {
        toast.info('Google sign-in', { description: message });
      } else {
        setFormError(message);
      }
    } finally {
      setPending('none');
    }
  };

  const switchMode = (next: 'login' | 'signup') => {
    setFormError(null);
    setMode(next);
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      className="w-full max-w-[404px]"
    >
      <motion.section
        layout
        variants={cardVariants}
        initial="hidden"
        animate={uiVisible ? 'visible' : 'hidden'}
        className="relative overflow-clip rounded-[28px] border border-white/[0.08] bg-white/[0.045] shadow-[0_44px_100px_-28px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-12%] h-52 w-52 rounded-full bg-[#6d5ae6]/20 blur-[90px]"
        />

        <div className="relative px-6 pb-7 pt-7 sm:px-8">
          <motion.div variants={item} className="mb-6 flex items-center">
            <BrandMark size={27} withWordmark />
          </motion.div>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={mode} variants={panelVariants} initial="hidden" exit="exit">
              {mode === 'login' ? (
                <LoginForm
                  onSubmit={handleLogin}
                  onGoogle={handleGoogle}
                  submitting={pending === 'password'}
                  googleLoading={pending === 'google'}
                  formError={formError}
                  onSwitchToSignup={() => switchMode('signup')}
                />
              ) : (
                <SignupForm
                  onSubmit={handleSignup}
                  onGoogle={handleGoogle}
                  submitting={pending === 'password'}
                  googleLoading={pending === 'google'}
                  formError={formError}
                  onSwitchToLogin={() => switchMode('login')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>
    </motion.div>
  );
}
