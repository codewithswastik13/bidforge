"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Gavel, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
type Mode = "login" | "signup" | "admin";

export function AuthView() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);
  const loginAdmin = useAuthStore((s) => s.loginAdmin);
  const navigate = useRouterStore((s) => s.navigate);

  function submit() {
    if (!email.includes("@") || password.length < 4) {
      toast.error("Check your details", { description: "Enter a valid email and a password of 4+ characters." });
      return;
    }
    if (mode === "admin") {
      loginAdmin(email);
      toast.success("Admin session started", { description: "Operations console unlocked." });
      navigate("admin");
      return;
    }
    if (mode === "signup") {
      signup(email);
      toast.success("Account created", { description: "Welcome to VYRA — keep funds ready before bidding." });
    } else {
      login(email);
      toast.success("Welcome back", { description: "Live rooms are open — good luck out there." });
    }
    navigate("home");
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 pb-24 pt-28 sm:px-8">
      <div className="radial-fade absolute inset-0 -z-10" />
      <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        {/* left copy */}
        <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }} className="max-w-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/80">VYRA access</p>
          <h1 className="font-display mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
            The room is
            <br />
            <span className="text-gradient">about to open.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-[oklch(0.62_0.01_260)]">
            One account for bidding, wallet and reminders. Admins use a separate console —
            operational access is provisioned server-side.
          </p>
          <div className="mt-8 space-y-2.5 text-[13px] text-white/50">
            {["Escrow-protected settlement", "Realtime outbid alerts", "Wallet-first bidding"].map((f) => (
              <p key={f} className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-300/80" /> {f}
              </p>
            ))}
          </div>
        </motion.div>

        {/* form card */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.12 }}
          className="glass glass-cyan rounded-[1.75rem] p-7 sm:p-9"
        >
          {/* mode switch */}
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] p-1.5">
            {(
              [
                { key: "login", label: "User login", icon: User },
                { key: "signup", label: "New sign up", icon: Mail },
                { key: "admin", label: "Admin login", icon: Lock },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold tracking-wide transition-all",
                  mode === m.key ? "bg-cyan-300/15 text-cyan-200" : "text-white/45 hover:text-white/80"
                )}
              >
                <m.icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mt-7 space-y-4"
            >
              {mode === "admin" && (
                <p className="rounded-xl border border-violet-400/25 bg-violet-400/[0.07] px-4 py-3 text-[11.5px] leading-relaxed text-violet-200/85">
                  <Lock className="mr-1.5 inline h-3 w-3" />
                  Administrative access. Credentials are verified against the operations directory —
                  nothing is stored client-side.
                </p>
              )}
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {mode === "admin" ? "Admin ID" : "Email"}
                </span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/12 bg-black/25 px-4 py-3 focus-within:border-cyan-300/50">
                  <Mail className="h-4 w-4 shrink-0 text-white/35" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={mode === "admin" ? "ops@vyra.example" : "you@example.com"}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    autoComplete="email"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Password</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/12 bg-black/25 px-4 py-3 focus-within:border-cyan-300/50">
                  <Lock className="h-4 w-4 shrink-0 text-white/35" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </div>
              </label>
              <button
                onClick={submit}
                className="btn-shimmer group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-cyan-400 py-3.5 text-[12px] font-bold uppercase tracking-[0.18em] text-black transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {mode === "signup" ? "Create account" : mode === "admin" ? "Enter admin console" : "Sign in"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="flex items-center justify-center gap-1.5 pt-1 text-[10.5px] text-white/30">
                <Gavel className="h-3 w-3" /> Protected by VYRA identity · auth backend connects later
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
