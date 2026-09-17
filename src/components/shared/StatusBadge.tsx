"use client";

import { motion } from "framer-motion";
import { Gavel, Radio } from "lucide-react";
import type { AuctionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAP: Record<
  AuctionStatus,
  { label: string; cls: string; dot?: string; live?: boolean }
> = {
  live: { label: "LIVE NOW", cls: "text-rose-300 border-rose-400/30 bg-rose-400/10", dot: "bg-rose-400", live: true },
  upcoming: { label: "UPCOMING", cls: "text-cyan-300 border-cyan-300/30 bg-cyan-300/10", dot: "bg-cyan-300" },
  ended: { label: "AUCTION ENDED", cls: "text-white/50 border-white/15 bg-white/5" },
  sold: { label: "SOLD", cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10", dot: "bg-emerald-400" },
  cancelled: { label: "CANCELLED", cls: "text-red-300/80 border-red-400/20 bg-red-400/5" },
};

export function StatusBadge({ status, className }: { status: AuctionStatus; className?: string }) {
  const s = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] backdrop-blur-md",
        s.cls,
        className
      )}
    >
      {s.live ? (
        <>
          <span className="relative flex h-1.5 w-1.5">
            <span className="ping-ring text-rose-400 absolute inset-0 rounded-full opacity-70" />
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-rose-400" />
          </span>
          <Radio className="h-2.5 w-2.5" />
        </>
      ) : (
        s.dot && <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      )}
      {s.label}
    </span>
  );
}

export function LivePill({ label = "LIVE AUCTION ENGINE", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/[0.07] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.22em] text-cyan-200/90 backdrop-blur-md",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="ping-ring text-cyan-300 absolute inset-0 rounded-full opacity-60" />
        <span className="live-dot h-2 w-2 rounded-full bg-cyan-300" />
      </span>
      {label}
    </span>
  );
}

export function GavelMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/30 bg-gradient-to-br from-cyan-300/20 to-violet-400/10 text-cyan-200",
        className
      )}
    >
      <Gavel className="h-4 w-4" />
    </span>
  );
}
