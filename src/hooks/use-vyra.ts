"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuctionStore } from "@/store/auctions";
import { useWalletStore } from "@/store/wallet";
import { useAuthStore } from "@/store/auth";
import { useNotificationsStore } from "@/store/notifications";
import { useProductsStore } from "@/store/products";
import { useMetricsStore } from "@/store/metrics";
import type { Auction, Bid, ProductSubmission, SystemMetrics } from "@/lib/types";

/* ---------- auction hooks ---------- */

export function useAuction(id: string): Auction | undefined {
  return useAuctionStore((s) => s.auctions.find((a) => a.id === id));
}

export function useAuctionList(): Auction[] {
  return useAuctionStore((s) => s.auctions);
}

/** live bid activity for one auction, newest first */
const EMPTY_BIDS: Bid[] = [];
export function useLiveBids(auctionId: string): Bid[] {
  const map = useAuctionStore((s) => s.bids);
  return map[auctionId] ?? EMPTY_BIDS;
}

/** global 1s clock — components derive countdowns from this */
export function useNow(): number {
  return useAuctionStore((s) => s.now);
}

export function useCountdown(targetMs: number): { ms: number; text: string; urgent: boolean } {
  const now = useNow();
  const ms = Math.max(0, targetMs - now);
  const urgent = ms < 30_000 && ms > 0;
  let text: string;
  if (ms < 3600_000) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    text = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  } else {
    const total = Math.floor(ms / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    text = d > 0 ? `${String(d).padStart(2, "0")}d ${String(h).padStart(2, "0")}h` : `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  }
  return { ms, text, urgent };
}

/* ---------- wallet hooks ---------- */

export function useWallet() {
  const accounts = useWalletStore((s) => s.accounts);
  const transactions = useWalletStore((s) => s.transactions);
  const paymentMethods = useWalletStore((s) => s.paymentMethods);
  const converting = useWalletStore((s) => s.converting);
  const inr = accounts.find((a) => a.type === "inr");
  const usdt = accounts.find((a) => a.type === "usdt");
  const availableForBidding = inr ? Math.max(0, inr.available - inr.locked) : 0;
  return { accounts, transactions, paymentMethods, converting, availableForBidding, inr, usdt };
}

/* ---------- user hooks ---------- */

export function useUser() {
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const email = useAuthStore((s) => s.email);
  const login = useAuthStore((s) => s.login);
  const loginAdmin = useAuthStore((s) => s.loginAdmin);
  const signup = useAuthStore((s) => s.signup);
  const logout = useAuthStore((s) => s.logout);
  return { role, user, email, login, loginAdmin, signup, logout, isAdmin: role === "admin" };
}

/* ---------- notifications hooks ---------- */

export function useNotifications() {
  const notifications = useNotificationsStore((s) => s.notifications);
  const panelOpen = useNotificationsStore((s) => s.panelOpen);
  const setPanelOpen = useNotificationsStore((s) => s.setPanelOpen);
  const push = useNotificationsStore((s) => s.push);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const unread = notifications.filter((n) => !n.read).length;
  const reminders = useNotificationsStore((s) => s.reminders);
  const setReminder = useNotificationsStore((s) => s.setReminder);
  const cancelReminder = useNotificationsStore((s) => s.cancelReminder);
  return { notifications, panelOpen, setPanelOpen, push, markAllRead, unread, reminders, setReminder, cancelReminder };
}

/* ---------- admin hooks ---------- */

export function useAdmin(): {
  submissions: ProductSubmission[];
  metrics: SystemMetrics;
} {
  const submissions = useProductsStore((s) => s.submissions);
  const metrics = useMetricsStore((s) => s.metrics);
  return { submissions, metrics };
}

/* ---------- responsive helper ---------- */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );
  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

/** stable per-auction sparkline path */
export function useSparklinePath(data: number[], width = 120, height = 32): string {
  return useMemo(() => {
    if (data.length < 2) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    return data
      .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`)
      .join(" ");
  }, [data, width, height]);
}
