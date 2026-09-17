"use client";

import { motion } from "framer-motion";
import { Bell, CalendarClock } from "lucide-react";
import { ReminderButton } from "@/components/shared/ReminderButton";
import { SectionHeading } from "@/components/shared/Sparkline";
import { useRouterStore } from "@/store/router";
import { useNow } from "@/hooks/use-vyra";
import type { Auction } from "@/lib/types";
import { formatDHM, formatDate, formatINR } from "@/lib/format";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * 08 — UPCOMING AUCTIONS: schedule-focused rows with the full
 * reminder system (5m / 15m / 1h / 1d) attached to every lot.
 */
export function UpcomingAuctions({ auctions }: { auctions: Auction[] }) {
  const upcoming = auctions.filter((a) => a.status === "upcoming").slice(0, 4);
  const navigate = useRouterStore((s) => s.navigate);
  const now = useNow();

  return (
    <section className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8" aria-label="Upcoming auctions">
      <SectionHeading
        kicker="On the calendar"
        title={
          <>
            Upcoming <span className="text-gradient">auctions</span>
          </>
        }
        sub="Set a reminder and we'll ping you before the room opens — keep funds ready so your first bid lands instantly."
      />

      <div className="mt-12 space-y-4">
        {upcoming.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
            className="group grid cursor-pointer grid-cols-[auto_1fr] items-center gap-5 rounded-2xl border border-white/8 bg-white/[0.025] p-4 backdrop-blur-xl transition-all duration-300 hover:border-cyan-300/25 hover:bg-white/[0.045] sm:grid-cols-[auto_1.4fr_1fr_auto] sm:gap-7 sm:p-5"
            onClick={() => navigate("auction", { id: a.id })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("auction", { id: a.id })}
            aria-label={`${a.title} — starts in ${formatDHM(a.startsAt - now)}`}
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 sm:h-24 sm:w-24">
              { }
              <img src={a.images[0]} alt={a.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>

            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">
                <CalendarClock className="h-3 w-3" /> {formatDate(a.startsAt)} · Lot {a.lotNumber}
              </p>
              <h3 className="font-display mt-1 truncate text-base font-semibold text-white/95 sm:text-lg">
                {a.title}
              </h3>
              <p className="mt-0.5 text-xs text-white/40">
                Base {formatINR(a.basePrice)} · Est. {formatINR(a.estimateLow ?? 0)}–{formatINR(a.estimateHigh ?? 0)}
              </p>
            </div>

            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Starts in</p>
              <p className="font-num mt-1 text-2xl font-semibold tabular text-white/90">
                {formatDHM(Math.max(0, a.startsAt - now))}
              </p>
            </div>

            <ReminderButton
              auctionId={a.id}
              auctionTitle={a.title}
              startsAt={a.startsAt}
              className="justify-self-start sm:justify-self-end"
            />
          </motion.div>
        ))}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-white/35">
        <Bell className="h-3.5 w-3.5 text-cyan-300/60" />
        Reminders arrive as push-style notifications — 5 minutes, 15 minutes, 1 hour or 1 day before start.
      </p>
    </section>
  );
}
