"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Eye,
  Gavel,
  Info,
  MapPin,
  ShieldCheck,
  Timer,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Sparkline } from "@/components/shared/Sparkline";
import { useRouterStore } from "@/store/router";
import { useAuctionStore } from "@/store/auctions";
import { useAuction, useCountdown, useLiveBids, useNow } from "@/hooks/use-vyra";
import { useWalletStore } from "@/store/wallet";
import { realtimeBus } from "@/services/realtime";
import { formatCountdown, formatDateTime, formatDHM, formatINR, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ============================================================ */

export function AuctionView({ auctionId }: { auctionId: string }) {
  const navigate = useRouterStore((s) => s.navigate);
  const auction = useAuction(auctionId);
  const bids = useLiveBids(auctionId);
  const now = useNow();
  const yourHigh = useAuctionStore((s) => s.yourHighestBid[auctionId] ?? 0);
  const locked = useWalletStore((s) => s.lockedByAuction[auctionId] ?? 0);
  const cd = useCountdown(auction?.endsAt ?? 0);

  if (!auction) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-40 text-center">
        <p className="font-display text-2xl text-white/70">Lot not found</p>
        <button
          onClick={() => navigate("auctions")}
          className="mt-6 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-cyan-200"
        >
          Back to marketplace
        </button>
      </div>
    );
  }

  const isUpcoming = auction.status === "upcoming";
  const isOver = auction.status === "ended" || auction.status === "sold" || auction.status === "cancelled";

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-32 pt-24 sm:px-6 lg:pb-16 lg:pt-28">
      {/* breadcrumb */}
      <button
        onClick={() => navigate("auctions")}
        className="group mb-6 inline-flex items-center gap-2 text-xs font-medium text-white/45 transition-colors hover:text-cyan-200"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Auction floor <ChevronRight className="h-3 w-3 opacity-40" />
        <span className="text-white/70">{auction.title}</span>
      </button>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr_0.92fr] xl:gap-8">
        {/* ---------------- LEFT: product visual ---------------- */}
        <ProductVisual auctionId={auction.id} />

        {/* ---------------- CENTER: auction info ---------------- */}
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
          aria-label="Auction information"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={auction.status} />
            <span className="font-num rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] tracking-widest text-white/50">
              LOT {auction.lotNumber}
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-wider text-white/50">
              {auction.category}
            </span>
          </div>

          <h1 className="font-display mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {auction.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {auction.location}</span>
            <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3 text-emerald-300/70" /> {auction.seller.name} ★ {auction.seller.rating}</span>
            <span>Condition · {auction.condition}</span>
          </p>

          <p className="mt-5 text-sm leading-relaxed text-[oklch(0.65_0.01_260)]">{auction.description}</p>

          {/* headline numbers */}
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="glass rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Current highest bid</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <AnimatedNumber value={auction.currentBid} className="text-[1.9rem] font-semibold text-cyan-200" />
                {yourHigh > 0 && auction.currentBid <= yourHigh && (
                  <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-300">
                    YOU LEAD
                  </span>
                )}
              </div>
              <p className="font-num mt-1 text-[11px] text-white/35">Base price {formatINR(auction.basePrice)}</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                <Timer className="h-3 w-3" /> Time remaining
              </p>
              <p className={cn("font-num mt-1.5 text-[1.9rem] font-semibold tabular", cd.urgent ? "text-rose-300 text-glow-cyan" : "text-white/95")}>
                {isUpcoming ? formatDHM(Math.max(0, auction.startsAt - now)) : isOver ? "CLOSED" : formatCountdown(cd.ms)}
              </p>
              <p className="font-num mt-1 text-[11px] text-white/35">
                {isUpcoming ? `Opens ${formatDateTime(auction.startsAt)}` : `Closes ${formatDateTime(auction.endsAt)}`}
              </p>
            </div>
            <div className="glass rounded-2xl p-5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                <Users className="h-3 w-3" /> Bidders
              </p>
              <AnimatedNumber value={auction.bidCount} currency={false} className="mt-1.5 block text-[1.9rem] font-semibold text-white/95" />
              <p className="font-num mt-1 flex items-center gap-1 text-[11px] text-white/35">
                <Eye className="h-2.5 w-2.5" /> {auction.watcherCount} watching
              </p>
            </div>
            <div className="glass rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Estimate</p>
              <p className="font-num mt-1.5 text-[1.35rem] font-semibold text-white/90">
                {formatINR(auction.estimateLow ?? 0)}
              </p>
              <p className="font-num text-[11px] text-white/35">up to {formatINR(auction.estimateHigh ?? 0)}</p>
            </div>
          </div>

          {/* price ladder + trend */}
          <div className="glass mt-4 flex items-center justify-between gap-4 rounded-2xl p-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Bid momentum</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-white/60">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                {auction.bidHistory.length > 1
                  ? `+${Math.round(((auction.currentBid - auction.bidHistory[0]) / Math.max(1, auction.bidHistory[0])) * 100)}% since open`
                  : "Awaiting first bids"}
              </p>
              {locked > 0 && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> {formatINR(locked)} locked for your bid
                </p>
              )}
            </div>
            <Sparkline data={auction.bidHistory.length > 1 ? auction.bidHistory : [auction.basePrice, auction.currentBid]} width={190} height={54} />
          </div>

          {/* highlights */}
          {auction.highlights && auction.highlights.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {auction.highlights.map((h) => (
                <span key={h} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/60">
                  {h}
                </span>
              ))}
            </div>
          )}
        </motion.section>

        {/* ---------------- RIGHT: bid panel ---------------- */}
        <BidPanel auctionId={auction.id} isUpcoming={isUpcoming} isOver={isOver} bids={bids} now={now} />
      </div>

      {/* mobile sticky summary — current bid + timer always visible */}
      <div className="fixed inset-x-0 bottom-[57px] z-40 border-t border-white/10 bg-[oklch(0.13_0.012_285/0.95)] px-4 py-2.5 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">Current bid</p>
            <AnimatedNumber value={auction.currentBid} className="text-base font-semibold text-cyan-200" />
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">Time left</p>
            <p className={cn("font-num text-base font-semibold tabular", cd.urgent ? "text-rose-300" : "text-white/90")}>
              {isUpcoming ? "Upcoming" : isOver ? "Closed" : formatCountdown(cd.ms)}
            </p>
          </div>
          <button
            onClick={() => document.getElementById("bid-panel")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-full bg-gradient-to-r from-cyan-300 to-cyan-400 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-black"
          >
            Bid now
          </button>
        </div>
      </div>
    </div>
  );
}

/* hook wrapper so countdown target can follow the live auction object */

/* ============================================================ */
/* LEFT — product visual with tilt + floating bid markers        */
/* ============================================================ */

function ProductVisual({ auctionId }: { auctionId: string }) {
  const auction = useAuction(auctionId);
  const pulse = useAuctionStore((s) => s.bidPulse[auctionId] ?? 0);
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rX = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 140, damping: 16 });
  const rY = useSpring(useTransform(mx, [0, 1], [-8, 8]), { stiffness: 140, damping: 16 });

  function onMove(e: React.PointerEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }

  if (!auction) return null;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="lg:sticky lg:top-24 lg:self-start"
      aria-label="Product visualization"
    >
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
        style={{ rotateX: rX, rotateY: rY, transformPerspective: 1100 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent"
      >
        <div className="grid-bg absolute inset-0 opacity-50" />
        { }
        <img
          src={auction.images[0]}
          alt={auction.title}
          className="relative aspect-square w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* pulse on incoming bid */}
        <AnimatePresence>
          {pulse > 0 && (
            <motion.div
              key={pulse}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="pointer-events-none absolute inset-0 border-2 border-cyan-300/50"
            />
          )}
        </AnimatePresence>

        {/* floating bid markers */}
        <FloatingMarkers auctionId={auctionId} />
      </motion.div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { icon: ShieldCheck, label: "Verified", sub: "Admin reviewed" },
          { icon: Gavel, label: "Escrow", sub: "Protected payout" },
          { icon: Zap, label: "Latency", sub: "12ms routing" },
        ].map((f) => (
          <div key={f.label} className="glass flex items-center gap-2.5 rounded-xl px-3 py-2.5">
            <f.icon className="h-4 w-4 shrink-0 text-cyan-300/80" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-white/85">{f.label}</p>
              <p className="truncate text-[9px] text-white/35">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function FloatingMarkers({ auctionId }: { auctionId: string }) {
  const bids = useLiveBids(auctionId);
  const markers = useMemo(() => bids.slice(0, 3).map((b, i) => ({ ...b, x: 14 + i * 26, y: 22 + i * 9 })), [bids]);
  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence mode="popLayout">
        {markers.map((m) => (
          <motion.div
            key={m.id}
            layout
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          >
            <div className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-num text-[10px] font-semibold text-white/90">{formatINR(m.amount)}</span>
              <span className="text-[9px] text-white/45">{m.isYou ? "you" : m.bidder.replace("User ", "")}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================ */
/* RIGHT — live bid panel + activity stream                      */
/* ============================================================ */

type FeedItem = {
  id: string;
  amount: number;
  bidder: string;
  isYou: boolean;
  createdAt: number;
  status: "accepted" | "rejected" | "pending";
};

function BidPanel({
  auctionId,
  isUpcoming,
  isOver,
  bids,
  now,
}: {
  auctionId: string;
  isUpcoming: boolean;
  isOver: boolean;
  bids: FeedItem[];
  now: number;
}) {
  const auction = useAuction(auctionId);
  const placeOwnBid = useAuctionStore((s) => s.placeOwnBid);
  const available = useWalletStore((s) => s.availableForBidding());
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [extended, setExtended] = useState(0);
  const streamRef = useRef<HTMLDivElement>(null);

  const minNext = (auction?.currentBid ?? 0) + (auction?.bidIncrement ?? 500);

  /* clear success flash */
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 2600);
    return () => clearTimeout(t);
  }, [success]);

  /* auction extension flash */
  useEffect(() => {
    const off = realtimeBus.on("AUCTION_EXTENDED", ({ auctionId: id }) => {
      if (id === auctionId) setExtended((v) => v + 1);
    });
    return off;
  }, [auctionId]);

  useEffect(() => {
    if (!extended) return;
    const t = setTimeout(() => setExtended(0), 2200);
    return () => clearTimeout(t);
  }, [extended]);

  function submit(value?: number) {
    if (!auction) return;
    const n = value ?? parseInt(amount.replace(/[^\d]/g, ""), 10);
    if (!n || Number.isNaN(n)) {
      setError("Enter a valid bid amount to continue.");
      setErrorKey((k) => k + 1);
      return;
    }
    const res = placeOwnBid(auctionId, n);
    if (!res.ok) {
      setError(res.message ?? "Bid rejected.");
      setErrorKey((k) => k + 1);
      toast.error("Bid rejected", { description: res.message });
      return;
    }
    setError(null);
    setAmount("");
    setSuccess(n);
    toast.success("Bid accepted", {
      description: `You lead at ${formatINR(n)} — rivals have been notified.`,
    });
  }

  return (
    <motion.aside
      id="bid-panel"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.16 }}
      className="lg:sticky lg:top-24 lg:self-start"
      aria-label="Live bidding panel"
    >
      <div className="glass glass-cyan rounded-[1.75rem] p-5 sm:p-6">
        {/* extension banner */}
        <AnimatePresence>
          {extended > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <p className="flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-3.5 py-2.5 text-[11px] font-semibold text-amber-200">
                <Timer className="h-3.5 w-3.5" />
                Auction extended by 15 seconds — a bid landed inside the closing window.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            <Gavel className="h-3.5 w-3.5 text-cyan-300" /> Place your bid
          </p>
          <span className="font-num rounded-md border border-emerald-400/25 bg-emerald-400/[0.08] px-2 py-1 text-[10px] font-semibold text-emerald-300">
            {formatINR(available)} ready
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/40">Current bid</span>
            <AnimatedNumber value={auction?.currentBid ?? 0} className="text-sm font-semibold text-white/85" />
          </div>
          <div className="mt-3.5">
            <label htmlFor="bid-amount" className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              Your bid
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/12 bg-black/25 px-4 py-3 transition-colors focus-within:border-cyan-300/50">
              <span className="font-num text-lg font-semibold text-cyan-300">₹</span>
              <input
                id="bid-amount"
                inputMode="numeric"
                disabled={isUpcoming || isOver}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value.replace(/[^\d]/g, ""));
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={formatINR(minNext).replace("₹", "")}
                className="font-num w-full bg-transparent text-lg font-semibold tabular text-white outline-none placeholder:text-white/20 disabled:opacity-40"
              />
            </div>
            <p className="mt-2 text-[10.5px] text-white/35">
              Must exceed {formatINR(auction?.currentBid ?? 0)} · increments of {formatINR(auction?.bidIncrement ?? 500)}
            </p>
          </div>

          {/* quick increments */}
          <div className="mt-3.5 flex flex-wrap gap-2">
            {[1, 2, 4].map((m) => {
              const v = (auction?.currentBid ?? 0) + (auction?.bidIncrement ?? 500) * m;
              return (
                <button
                  key={m}
                  disabled={isUpcoming || isOver}
                  onClick={() => {
                    setAmount(String(v));
                    setError(null);
                  }}
                  className="font-num rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 transition-all hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-200 disabled:opacity-30"
                >
                  +{formatINR((auction?.bidIncrement ?? 500) * m)}
                </button>
              );
            })}
            <button
              disabled={isUpcoming || isOver}
              onClick={() => submit(minNext)}
              className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 transition-all hover:border-cyan-300/40 hover:text-cyan-200 disabled:opacity-30"
            >
              MIN {formatINR(minNext)}
            </button>
          </div>

          {/* PLACE BID */}
          <button
            disabled={isUpcoming || isOver}
            onClick={() => submit()}
            className={cn(
              "btn-shimmer group mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[13px] font-bold uppercase tracking-[0.18em] transition-all",
              isUpcoming || isOver
                ? "cursor-not-allowed border border-white/10 bg-white/[0.04] text-white/35"
                : "bg-gradient-to-r from-cyan-300 to-cyan-400 text-[oklch(0.13_0.02_260)] shadow-[0_10px_36px_-8px_oklch(0.82_0.14_205/0.55)] hover:scale-[1.015] active:scale-[0.98]"
            )}
          >
            {isUpcoming ? "Auction starts soon" : isOver ? "Bidding closed" : "Place bid"}
          </button>

          {/* error state — elegant */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key={errorKey}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-3.5 py-3"
                role="alert"
              >
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                <div>
                  <p className="text-xs font-semibold text-rose-200">Bid rejected</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-rose-200/70">{error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-3"
                role="status"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <div>
                  <p className="text-xs font-semibold text-emerald-200">Bid accepted</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-200/70">
                    {formatINR(success)} submitted — you are the highest bidder.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* funds education */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] px-3.5 py-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/70" />
            <p className="text-[10.5px] leading-relaxed text-white/45">
              Wallet balance bids instantly. UPI or bank top-ups can lag behind the room —
              keep funds ready before the clock runs low.
            </p>
          </div>
        </div>

        {/* activity stream */}
        <div className="mt-5">
          <div className="flex items-center justify-between px-1 pb-2.5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
              <span className="relative flex h-1.5 w-1.5">
                <span className="ping-ring text-rose-400 absolute inset-0 rounded-full opacity-60" />
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-rose-400" />
              </span>
              Live activity
            </p>
            <span className="font-num text-[10px] text-white/30">{bids.length} events</span>
          </div>
          <div ref={streamRef} className="thin-scroll max-h-[320px] space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false} mode="popLayout">
              {bids.map((b) => (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: -16, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3.5 py-2.5",
                    b.isYou
                      ? "border-cyan-300/30 bg-cyan-300/[0.07]"
                      : b.status === "rejected"
                        ? "border-rose-400/25 bg-rose-400/[0.05]"
                        : "border-white/6 bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold",
                        b.isYou
                          ? "bg-cyan-300/20 text-cyan-200"
                          : b.status === "rejected"
                            ? "bg-rose-400/15 text-rose-300"
                            : "bg-white/8 text-white/55"
                      )}
                    >
                      {b.isYou ? "YOU" : b.bidder.replace("User #", "#")}
                    </span>
                    <div>
                      <p className={cn("text-[13px] font-semibold", b.status === "rejected" ? "text-rose-300/80 line-through" : "text-white/90")}>
                        {formatINR(b.amount)}
                      </p>
                      <p className="text-[10px] text-white/35">
                        {b.bidder} · {timeAgo(b.createdAt, now)}
                      </p>
                    </div>
                  </div>
                  {b.status === "accepted" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-300">
                      <CheckCircle2 className="h-2.5 w-2.5" /> ACCEPTED
                    </span>
                  )}
                  {b.status === "rejected" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-400/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-rose-300">
                      <XCircle className="h-2.5 w-2.5" /> REJECTED
                    </span>
                  )}
                  {b.status === "pending" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white/45">
                      <Zap className="h-2.5 w-2.5 animate-pulse" /> PROCESSING
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {bids.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/30">
                Live stream open — bids will appear here the moment they land.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
