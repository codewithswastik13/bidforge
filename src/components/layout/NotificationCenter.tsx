"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellRing,
  CheckCheck,
  Gavel,
  Gavel as GavelIcon,
  PackageCheck,
  ShieldAlert,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useNotificationsStore } from "@/store/notifications";
import { useRouterStore } from "@/store/router";
import { timeAgo } from "@/lib/format";
import { useNow } from "@/hooks/use-vyra";
import { cn } from "@/lib/utils";

const KIND_ICON = {
  reminder_triggered: { icon: BellRing, tone: "text-cyan-300 bg-cyan-300/10 border-cyan-300/25" },
  auction_started: { icon: Gavel, tone: "text-rose-300 bg-rose-400/10 border-rose-400/25" },
  outbid: { icon: TrendingUp, tone: "text-amber-300 bg-amber-300/10 border-amber-300/25" },
  bid_accepted: { icon: GavelIcon, tone: "text-emerald-300 bg-emerald-300/10 border-emerald-300/25" },
  bid_rejected: { icon: ShieldAlert, tone: "text-rose-300 bg-rose-400/10 border-rose-400/25" },
  auction_won: { icon: PackageCheck, tone: "text-emerald-300 bg-emerald-300/10 border-emerald-300/25" },
  wallet_updated: { icon: Wallet, tone: "text-violet-300 bg-violet-400/10 border-violet-400/25" },
  product_approved: { icon: PackageCheck, tone: "text-emerald-300 bg-emerald-300/10 border-emerald-300/25" },
  product_rejected: { icon: ShieldAlert, tone: "text-amber-300 bg-amber-300/10 border-amber-300/25" },
  system: { icon: Bell, tone: "text-white/70 bg-white/[0.06] border-white/15" },
} as const;

export function NotificationCenter() {
  const open = useNotificationsStore((s) => s.panelOpen);
  const setOpen = useNotificationsStore((s) => s.setPanelOpen);
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const navigate = useRouterStore((s) => s.navigate);
  const now = useNow();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.4 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col border-l border-white/10 bg-[oklch(0.14_0.012_285/0.97)] shadow-2xl backdrop-blur-2xl"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <h2 className="font-display text-sm font-semibold tracking-wide text-white">Notifications</h2>
                <p className="mt-0.5 text-[11px] text-white/40">
                  {notifications.filter((n) => !n.read).length} unread · realtime
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={markAllRead}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-emerald-300"
                  aria-label="Mark all read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="thin-scroll flex-1 overflow-y-auto p-3">
              {notifications.map((n) => {
                const meta = KIND_ICON[n.kind] ?? KIND_ICON.system;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (n.auctionId) {
                        setOpen(false);
                        navigate("auction", { id: n.auctionId });
                      }
                    }}
                    className={cn(
                      "mb-2 flex w-full gap-3 rounded-xl border p-3.5 text-left transition-colors",
                      n.read
                        ? "border-white/6 bg-white/[0.02] opacity-70"
                        : "border-cyan-300/15 bg-cyan-300/[0.045] hover:bg-cyan-300/[0.07]"
                    )}
                  >
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", meta.tone)}>
                      <meta.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-white/90">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-white/50">{n.body}</span>
                      <span className="font-num mt-1.5 block text-[10px] text-white/30">{timeAgo(n.createdAt, now)}</span>
                    </span>
                  </button>
                );
              })}
              {notifications.length === 0 && (
                <p className="py-16 text-center text-sm text-white/35">You're all caught up.</p>
              )}
            </div>

            <div className="border-t border-white/8 px-5 py-3">
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Realtime channel connected
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
