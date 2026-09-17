"use client";

import { useRef } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Eye, Flame, Gavel, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { HeroCanvas } from "@/components/three/HeroCanvas";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { LivePill } from "@/components/shared/StatusBadge";
import { useRouterStore } from "@/store/router";
import { useAuction, useCountdown, useLiveBids, useNow } from "@/hooks/use-vyra";
import { useAuctionStore } from "@/store/auctions";
import { formatCountdown, formatINR, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const navigate = useRouterStore((s) => s.navigate);
  const auction = useAuction("auc-chronograph");
  const bids = useLiveBids("auc-chronograph");
  const pulse = useAuctionStore((s) => s.bidPulse["auc-chronograph"] ?? 0);
  const now = useNow();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 140]);

  const countdown = useCountdown(auction?.endsAt ?? 0);
  const accepted = bids.filter((b) => b.status === "accepted").slice(0, 4);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] overflow-hidden" aria-label="VYRA live auction hero">
      {/* backdrop layers */}
      <div className="radial-fade absolute inset-0" />
      <div className="grid-bg absolute inset-0" />
      <motion.div style={{ y: sceneY }} className="absolute inset-0">
        <HeroCanvas />
      </motion.div>

      {/* content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-28 pt-32 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pb-20 lg:pt-36"
      >
        {/* left — copy */}
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          >
            <LivePill label="LIVE AUCTION ENGINE" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.22 }}
            className="font-display mt-6 text-[13.5vw] font-bold leading-[0.98] tracking-[-0.02em] text-[oklch(0.97_0.005_106)] sm:text-6xl lg:text-[4.6rem]"
          >
            THE AUCTION MOVES
            <br />
            <span className="text-gradient">IN REAL TIME.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.36 }}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-[oklch(0.68_0.01_260)] sm:text-base"
          >
            Bid faster. Compete live. Secure every transaction.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.48 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <button
              onClick={() => navigate("auctions")}
              className="btn-shimmer group relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-300 to-cyan-400 px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[oklch(0.13_0.02_260)] shadow-[0_10px_40px_-8px_oklch(0.82_0.14_205/0.55)] transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              Enter bidding
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => {
                document.getElementById("auctions-today")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/14 bg-white/[0.04] px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08]"
            >
              Explore auctions
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-[11px] font-medium tracking-wide text-[oklch(0.5_0.01_260)]"
          >
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-300/80" /> 12ms bid latency
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300/80" /> Escrow-secured
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gavel className="h-3.5 w-3.5 text-violet-300/80" /> 24/7 auction rooms
            </span>
          </motion.div>
        </div>

        {/* right — live demo panel */}
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.55 }}
          className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end"
        >
          {/* bid pulse ring */}
          <AnimatePresence>
            {pulse > 0 && (
              <motion.div
                key={pulse}
                initial={{ opacity: 0.5, scale: 0.96 }}
                animate={{ opacity: 0, scale: 1.06 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="pointer-events-none absolute -inset-3 rounded-[2rem] border border-cyan-300/40"
              />
            )}
          </AnimatePresence>

          <div className="glass glass-cyan relative rounded-[1.75rem] p-6 shadow-[0_40px_120px_-30px_oklch(0.82_0.14_205/0.35)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="ping-ring text-rose-400 absolute inset-0 rounded-full opacity-60" />
                  <span className="live-dot h-2 w-2 rounded-full bg-rose-400" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-300/90">
                  Live auction
                </span>
              </div>
              <span className="font-num rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] tracking-widest text-white/50">
                {auction?.lotNumber ?? "VY-0088"}
              </span>
            </div>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Product
            </p>
            <h3 className="font-display mt-1 text-lg font-semibold text-white/95">
              {auction?.title ?? "Limited Edition Chronograph"}
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  Current bid
                </p>
                <AnimatedNumber
                  value={auction?.currentBid ?? 10000}
                  className="mt-1 block text-[1.45rem] font-semibold text-cyan-200"
                />
                <p className="font-num mt-0.5 text-[10px] text-white/35">
                  base {formatINR(auction?.basePrice ?? 5000)}
                </p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  <TrendingUp className="h-3 w-3" /> Live bids
                </p>
                <AnimatedNumber
                  value={auction?.bidCount ?? 247}
                  currency={false}
                  className="mt-1 block text-[1.45rem] font-semibold text-white/90"
                />
                <p className="font-num mt-0.5 flex items-center gap-1 text-[10px] text-white/35">
                  <Eye className="h-2.5 w-2.5" /> {auction?.watcherCount ?? 1290} watching
                </p>
              </div>
            </div>

            {/* countdown */}
            <div className="mt-3 flex items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
                Time left
              </span>
              <span
                className={cn(
                  "font-num text-2xl font-semibold tabular tracking-wide",
                  countdown && countdown.urgent ? "text-rose-300 text-glow-cyan" : "text-white/95"
                )}
              >
                {countdown?.text ?? "00:00"}
              </span>
            </div>

            {/* bid events */}
            <div className="mt-4 space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {accepted.map((b) => (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: -14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.03] px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                        <Flame className="h-3 w-3" />
                      </span>
                      <div>
                        <p className="text-xs font-medium text-white/85">+{formatINR(b.amount)}</p>
                        <p className="text-[10px] text-white/35">
                          {b.isYou ? "You" : b.bidder} · Bid accepted
                        </p>
                      </div>
                    </div>
                    <span className="font-num text-[10px] text-white/30">{timeAgo(b.createdAt, now)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {accepted.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/10 px-3.5 py-3 text-center text-[11px] text-white/30">
                  Waiting for incoming bids…
                </p>
              )}
            </div>

            <button
              onClick={() => {
                navigate("auction", { id: "auc-chronograph" });
                toast("Entering live room", { description: "Limited Edition Chronograph" });
              }}
              className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 py-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200 transition-all hover:bg-cyan-300/20 hover:shadow-[0_8px_30px_-6px_oklch(0.82_0.14_205/0.5)]"
            >
              Join this auction
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* floating chips */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="glass absolute -left-6 -top-6 hidden rounded-xl px-4 py-3 sm:block"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">New highest bid</p>
            <p className="font-num mt-0.5 text-sm font-semibold text-emerald-300 text-glow-green">
              +{formatINR(auction?.bidIncrement ?? 500)}
            </p>
          </motion.div>
          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="glass absolute -bottom-5 -right-4 hidden rounded-xl px-4 py-3 sm:block"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Escrow status</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Funds secured
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-9 w-6 items-start justify-center rounded-full border border-white/15 p-1.5">
          <motion.div
            animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1 rounded-full bg-cyan-300"
          />
        </div>
      </motion.div>
    </section>
  );
}
