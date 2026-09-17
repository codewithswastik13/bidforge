"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Flame, Radio, ShieldCheck, Timer, Zap } from "lucide-react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useRouterStore } from "@/store/router";
import { useAuction, useCountdown, useLiveBids, useNow } from "@/hooks/use-vyra";
import { formatCountdown, formatINR, timeAgo } from "@/lib/format";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * 02 — LIVE AUCTION SHOWCASE: a cinematic banner of the hottest
 * live room, with streaming bids, price ticker and countdown.
 */
export function LiveShowcase() {
  const navigate = useRouterStore((s) => s.navigate);
  const featured = useAuction("auc-chronograph");
  const bids = useLiveBids("auc-chronograph");
  const now = useNow();
  const cd = useCountdown(featured?.endsAt ?? 0);
  const feed = bids.slice(0, 5);

  if (!featured) return null;

  return (
    <section className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:py-20" aria-label="Live auction showcase">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="glass relative overflow-hidden rounded-[2rem]"
      >
        {/* ambient glow */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-violet-500/10 blur-[100px]" />

        <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:p-12">
          {/* info */}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={featured.status} />
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                <Radio className="h-3 w-3 text-cyan-300" /> Showcase room
              </span>
            </div>
            <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {featured.title}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[oklch(0.68_0.01_260)]">
              {featured.description.slice(0, 140)}…
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-10 gap-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Current bid</p>
                <AnimatedNumber value={featured.currentBid} className="mt-1 block text-3xl font-semibold text-cyan-200 sm:text-4xl" />
              </div>
              <div>
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  <Timer className="h-3 w-3" /> Time left
                </p>
                <p className={`font-num mt-1 text-3xl font-semibold tabular sm:text-4xl ${cd.urgent ? "text-rose-300" : "text-white/90"}`}>
                  {formatCountdown(cd.ms)}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("auction", { id: featured.id })}
              className="btn-shimmer group mt-8 inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-black transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Enter the room
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* live feed */}
          <div className="glass rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
                <Zap className="h-3.5 w-3.5 text-cyan-300" /> Live bid stream
              </p>
              <span className="font-num text-[11px] text-white/35">{featured.bidCount} total bids</span>
            </div>
            <div className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {feed.map((b) => (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, x: 24, filter: "blur(4px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                          b.isYou ? "bg-cyan-300/20 text-cyan-200" : "bg-white/8 text-white/60"
                        }`}
                      >
                        {b.isYou ? "YOU" : b.bidder.replace("User #", "#")}
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-white/90">{formatINR(b.amount)}</p>
                        <p className="text-[10px] text-white/35">
                          {b.bidder} · {timeAgo(b.createdAt, now)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                      <Flame className="h-2.5 w-2.5" /> accepted
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {feed.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/30">
                  Live feed connecting…
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3">
              <span className="flex items-center gap-2 text-[11px] font-semibold text-emerald-200/90">
                <ShieldCheck className="h-3.5 w-3.5" /> Every bid is escrow-verified
              </span>
              <span className="font-num text-[10px] text-emerald-300/60">0 failed today</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
