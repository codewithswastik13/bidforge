"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, Fingerprint, Lock, ShieldCheck, Sparkles as SparklesIcon } from "lucide-react";
import { SectionHeading } from "@/components/shared/Sparkline";
import { useRouterStore } from "@/store/router";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------- 06 — sell CTA ---------- */

export function SellCTA() {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <section className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8" aria-label="List a product">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-[oklch(0.2_0.03_230/0.5)] via-[oklch(0.16_0.02_285/0.6)] to-[oklch(0.17_0.04_300/0.45)] p-9 backdrop-blur-2xl sm:p-14"
      >
        <div className="grid-bg absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/12 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-violet-500/12 blur-[100px]" />

        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">
              <SparklesIcon className="h-3 w-3" /> For sellers
            </span>
            <h2 className="font-display mt-5 text-3xl font-semibold leading-[1.06] tracking-tight text-white sm:text-[2.6rem]">
              Have something
              <br />
              <span className="text-gradient">worth bidding for?</span>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[oklch(0.68_0.01_260)]">
              Turn your product into a live auction and let the market decide its value. Verified
              listings, global bidders, escrow-settled payouts.
            </p>
          </div>
          <button
            onClick={() => navigate("sell")}
            className="btn-shimmer group inline-flex shrink-0 items-center gap-3 rounded-full bg-white px-8 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-black transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98]"
          >
            List a product
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="relative mt-10 grid gap-4 border-t border-white/8 pt-8 sm:grid-cols-3">
          {[
            { icon: Camera, t: "Live camera verification", d: "Every listing is captured in real time — no stock photos." },
            { icon: Fingerprint, t: "Admin reviewed", d: "A human team verifies condition before your room opens." },
            { icon: Lock, t: "7-day lead time", d: "Listings go live at least a week out, so bidders can prepare." },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.05] text-cyan-200">
                <f.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-white/90">{f.t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/45">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- 07 — trust / security ---------- */

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Transparent bidding",
    body: "Every accepted bid is broadcast to the room with a full audit trail. You always see who leads, by how much, and when the hammer falls.",
  },
  {
    icon: Lock,
    title: "Escrow-secured settlement",
    body: "Winning bids settle through escrow. Sellers ship only after funds clear; buyers are refunded automatically if a lot is not as verified.",
  },
  {
    icon: Fingerprint,
    title: "Verified participants",
    body: "Identity checks on every account. Rejected bids, failed payments and abuse attempts are rate-limited at the engine level.",
  },
];

export function TrustSection() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8" aria-label="Trust and security">
      <SectionHeading
        kicker="Trust architecture"
        title={
          <>
            Built for money. <span className="text-gradient">Treated that way.</span>
          </>
        }
        sub="High-concurrency is only half the story — every transaction is protected end to end."
      />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {TRUST.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.75, ease: EASE, delay: i * 0.1 }}
            className="relative rounded-2xl border border-white/8 bg-white/[0.025] p-7 backdrop-blur-xl transition-colors duration-300 hover:border-emerald-300/20"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-300">
              <t.icon className="h-5 w-5" />
            </span>
            <h3 className="font-display mt-5 text-lg font-semibold text-white/95">{t.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[oklch(0.62_0.01_260)]">{t.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 09 — final CTA ---------- */

export function FinalCTA() {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <section className="relative overflow-hidden py-28 lg:py-36" aria-label="Enter the auction">
      <div className="radial-fade absolute inset-0" />
      <div className="grid-bg absolute inset-0 opacity-60" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: EASE }}
        className="relative mx-auto flex max-w-3xl flex-col items-center px-5 text-center"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/80">
          The room is open
        </p>
        <h2 className="font-display mt-5 text-4xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl">
          ENTER THE
          <span className="text-gradient text-glow-cyan"> AUCTION</span>
        </h2>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[oklch(0.62_0.01_260)]">
          Live lots are closing as you read this. Keep funds ready, place your bid, and let the
          fastest hand win.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate("auctions")}
            className="btn-shimmer group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-300 to-cyan-400 px-8 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-[oklch(0.13_0.02_260)] shadow-[0_10px_40px_-8px_oklch(0.82_0.14_205/0.55)] transition-transform hover:scale-[1.04] active:scale-[0.98]"
          >
            Enter bidding
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => navigate("auth")}
            className="inline-flex items-center rounded-full border border-white/14 bg-white/[0.04] px-8 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/[0.08]"
          >
            Create account
          </button>
        </div>
      </motion.div>
    </section>
  );
}
