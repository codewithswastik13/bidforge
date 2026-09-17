"use client";

import { motion } from "framer-motion";
import { Gavel, Wallet, Zap, ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/Sparkline";
import { useRouterStore } from "@/store/router";

const STEPS = [
  {
    n: "01",
    icon: Gavel,
    tone: "text-cyan-300 border-cyan-300/25 bg-cyan-300/[0.07]",
    title: "Choose an auction",
    body: "Browse live rooms and upcoming lots. Study the bid history, estimates and seller verification before you commit.",
  },
  {
    n: "02",
    icon: Wallet,
    tone: "text-violet-300 border-violet-300/25 bg-violet-300/[0.07]",
    title: "Keep your funds ready",
    body: "Wallet balance bids instantly. UPI and bank transfers can take time — top up before the auction begins so a bid never fails.",
  },
  {
    n: "03",
    icon: Zap,
    tone: "text-emerald-300 border-emerald-300/25 bg-emerald-300/[0.07]",
    title: "Bid live",
    body: "Every bid is processed in milliseconds. Win, and settlement runs through escrow automatically. Lose, and locked funds release instantly.",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function HowItWorks() {
  const navigate = useRouterStore((s) => s.navigate);
  return (
    <section className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:py-28" aria-label="How real-time bidding works">
      <SectionHeading
        kicker="How it works"
        title={
          <>
            Real-time bidding, <span className="text-gradient">in three moves</span>
          </>
        }
        sub="From discovery to settlement — one continuous, secured flow."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.75, ease: EASE, delay: i * 0.12 }}
            className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] p-7 backdrop-blur-xl transition-colors duration-300 hover:border-white/16 hover:bg-white/[0.04]"
          >
            <span className="font-num pointer-events-none absolute -right-3 -top-7 text-[6.5rem] font-bold leading-none text-white/[0.04] transition-colors duration-500 group-hover:text-cyan-300/[0.07]">
              {s.n}
            </span>
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <h3 className="font-display mt-6 text-lg font-semibold text-white/95">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[oklch(0.62_0.01_260)]">{s.body}</p>
            {i < 2 && (
              <ArrowRight className="absolute -right-2 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-white/15 md:block" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={() => navigate("auctions")}
          className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-cyan-300/90 transition-colors hover:text-cyan-200"
        >
          Browse open auctions
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
