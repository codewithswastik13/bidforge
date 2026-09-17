"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Eye, MapPin, ShieldCheck, Users } from "lucide-react";
import type { Auction } from "@/lib/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ReminderButton } from "@/components/shared/ReminderButton";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { useRouterStore } from "@/store/router";
import { useCountdown, useNow } from "@/hooks/use-vyra";
import { formatCountdown, formatDHM, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  auction: Auction;
  className?: string;
  compact?: boolean;
}

/**
 * Premium 3D tilt card. On hover the product lifts forward,
 * data particles appear and the shadow deepens. Pure transform
 * animations — layout is never touched.
 */
export function AuctionCard({ auction, className, compact }: Props) {
  const navigate = useRouterStore((s) => s.navigate);
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rX = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 180, damping: 18 });
  const rY = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 180, damping: 18 });
  const glowX = useTransform(mx, [0, 1], ["20%", "80%"]);
  const glowY = useTransform(my, [0, 1], ["15%", "85%"]);
  const glowBg = useTransform(
    [glowX, glowY],
    ([gx, gy]: string[]) =>
      `radial-gradient(280px circle at ${gx} ${gy}, oklch(0.82 0.14 205 / 0.10), transparent 65%)`
  );

  const isUpcoming = auction.status === "upcoming";
  const isOver = auction.status === "ended" || auction.status === "sold" || auction.status === "cancelled";
  const countdown = useCountdown(isUpcoming ? auction.startsAt : auction.endsAt);
  const now = useNow();

  function onMove(e: React.PointerEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }

  function onEnter() {
    setHover(true);
  }
  function onLeave() {
    setHover(false);
    mx.set(0.5);
    my.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onClick={() => isOver || navigate("auction", { id: auction.id })}
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 900 }}
      whileHover={{ z: 0 }}
      className={cn(
        "tilt-card group relative cursor-pointer rounded-2xl border border-white/8 bg-[oklch(0.16_0.012_285/0.55)] backdrop-blur-xl transition-shadow duration-300",
        hover && "shadow-[0_30px_80px_-24px_oklch(0.82_0.14_205/0.35),0_0_0_1px_oklch(0.82_0.14_205/0.18)]",
        isOver && "opacity-70 saturate-[0.6]",
        className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate("auction", { id: auction.id })}
      aria-label={`${auction.title} — view auction`}
    >
      {/* cursor glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glowBg }}
      />

      {/* image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
        { }
        <img
          src={auction.images[0]}
          alt={auction.title}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-all duration-700 ease-out",
            hover ? "scale-[1.07] translate-z-12 brightness-110" : "scale-100 brightness-[0.92]"
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.13_0.012_285/0.9)] via-transparent to-transparent" />

        <div className="absolute left-3.5 top-3.5">
          <StatusBadge status={auction.status} />
        </div>
        <span className="font-num absolute right-3.5 top-3.5 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] tracking-widest text-white/60 backdrop-blur-md">
          {auction.lotNumber}
        </span>

        {/* hover data particles */}
        <AnimatePresence>
          {hover && (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.5 }}
                  animate={{
                    opacity: [0, 0.9, 0],
                    y: -46 - i * 12,
                    x: [0, (i - 2) * 14],
                    scale: [0.5, 1, 0.4],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6 + i * 0.2, repeat: Infinity, delay: i * 0.28, ease: "easeOut" }}
                  className="absolute bottom-8 h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_oklch(0.82_0.14_205/0.6)]"
                  style={{ left: `${22 + i * 14}%` }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* countdown chip */}
        {!isOver && (
          <div className="font-num absolute bottom-3.5 left-3.5 flex items-center gap-2 rounded-lg border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-lg">
            <span className={cn("h-1.5 w-1.5 rounded-full", countdown.urgent && !isUpcoming ? "live-dot bg-rose-400" : isUpcoming ? "bg-cyan-300" : "bg-emerald-400")} />
            {isUpcoming ? (
              <span className="text-cyan-200">Starts in {formatDHM(Math.max(0, auction.startsAt - now))}</span>
            ) : (
              <span className={countdown.urgent ? "text-rose-200" : ""}>{formatCountdown(countdown.ms)}</span>
            )}
          </div>
        )}
      </div>

      {/* body */}
      <div className="tilt-inner relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display truncate text-[15px] font-semibold text-white/95">{auction.title}</h3>
            <p className="mt-1 flex items-center gap-2 text-[11px] text-white/40">
              <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                {auction.category}
              </span>
              {!compact && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" /> {auction.location}
                </span>
              )}
            </p>
          </div>
          <span
            className={cn(
              "font-num shrink-0 rounded-lg border px-2.5 py-1.5 text-sm font-semibold",
              auction.status === "live"
                ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-200"
                : "border-white/10 bg-white/[0.04] text-white/70"
            )}
          >
            {formatINR(auction.currentBid)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3.5">
          <div className="flex items-center gap-4 text-[11px] text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-white/30" />
              {auction.bidCount} bids
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-white/30" />
              {auction.watcherCount}
            </span>
            {auction.seller.verified && (
              <span className="inline-flex items-center gap-1 text-emerald-300/80">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>

          {isUpcoming ? (
            <ReminderButton
              auctionId={auction.id}
              auctionTitle={auction.title}
              startsAt={auction.startsAt}
              compact
              className="!px-3.5 !py-1.5"
            />
          ) : (
            isOver && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
                {auction.status === "sold" ? `Sold ${formatINR(auction.currentBid)}` : "Closed"}
              </span>
            )
          )}
        </div>
      </div>

      {/* enter arrow */}
      {!isOver && (
        <div
          className={cn(
            "absolute right-4 top-[38%] flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-[oklch(0.13_0.012_285/0.7)] text-cyan-200 backdrop-blur-lg transition-all duration-300",
            hover ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          )}
        >
          <ArrowUpRight className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}
