"use client";

import { create } from "zustand";
import type { Reminder, UserNotification } from "@/lib/types";
import { uid } from "@/lib/format";
import { realtimeBus } from "@/services/realtime";
import { remindersApi } from "@/services/api";
import { useAuctionStore } from "@/store/auctions";

interface NotificationsState {
  notifications: UserNotification[];
  reminders: Reminder[];
  panelOpen: boolean;
  wired: boolean;

  setPanelOpen: (open: boolean) => void;
  push: (n: Omit<UserNotification, "id" | "createdAt" | "read">) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  unreadCount: () => number;

  setReminder: (auctionId: string, auctionTitle: string, startsAt: number, offsetMinutes: number) => Promise<void>;
  cancelReminder: (reminderId: string) => Promise<void>;
  subscribeRealtime: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [
    {
      id: "n-seed-1",
      kind: "system",
      title: "Live auction engine online",
      body: "Realtime bidding is now operating at full capacity. Latency nominal at 21ms.",
      createdAt: Date.now() - 6 * 60_000,
      read: false,
    },
    {
      id: "n-seed-2",
      kind: "outbid",
      title: "You've been outbid",
      body: "Nitro Stealth Runner — Prototype 01 moved to ₹28,500. Place a higher bid to reclaim the lead.",
      createdAt: Date.now() - 52 * 60_000,
      read: false,
      auctionId: "auc-sneaker",
    },
    {
      id: "n-seed-3",
      kind: "auction_won",
      title: "Lot won — Chromatic Drift",
      body: "Your winning bid of ₹96,500 was accepted. Settlement completed from INR Wallet.",
      createdAt: Date.now() - 22 * 3600_000,
      read: true,
    },
  ],
  reminders: [],
  panelOpen: false,
  wired: false,

  setPanelOpen: (open) => set({ panelOpen: open }),

  push: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: uid("n"), createdAt: Date.now(), read: false },
        ...s.notifications,
      ].slice(0, 50),
    })),

  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  setReminder: async (auctionId, auctionTitle, startsAt, offsetMinutes) => {
    const rem = await remindersApi.set(auctionId, offsetMinutes);
    set((s) => ({ reminders: [...s.reminders, rem] }));
    const label =
      offsetMinutes === 60
        ? "1 hour"
        : offsetMinutes === 1440
          ? "1 day"
          : `${offsetMinutes} minutes`;
    get().push({
      kind: "reminder_triggered",
      title: "Reminder set",
      body: `${auctionTitle} — we'll notify you ${label} before it starts.`,
      auctionId,
    });
    // Demo-mode scheduled trigger: fire a shortened reminder soon so the
    // notification UX can be experienced without waiting hours.
    const demoDelay = Math.min(45_000, Math.max(12_000, offsetMinutes * 400));
    setTimeout(() => {
      const still = get().reminders.some((r) => r.id === rem.id);
      if (!still) return;
      realtimeBus.emit("REMINDER_TRIGGERED", {
        reminderId: rem.id,
        auctionId,
        title: auctionTitle,
      });
    }, demoDelay);
  },

  cancelReminder: async (reminderId) => {
    await remindersApi.cancel(reminderId);
    set((s) => ({ reminders: s.reminders.filter((r) => r.id !== reminderId) }));
  },

  subscribeRealtime: () => {
    if (get().wired) return;
    set({ wired: true });

    realtimeBus.on("BID_ACCEPTED", ({ bid, newCurrentBid }) => {
      if (bid.isYou) {
        get().push({
          kind: "bid_accepted",
          title: "Bid accepted",
          body: `You lead the room at ₹${(newCurrentBid ?? bid.amount).toLocaleString("en-IN")}. Stay sharp — rivals are bidding.`,
          auctionId: bid.auctionId,
        });
        return;
      }
      // outbid check — only if the user currently leads this auction
      const yourHigh = useAuctionStore.getState().yourHighestBid[bid.auctionId] ?? 0;
      if (yourHigh > 0 && (newCurrentBid ?? bid.amount) > yourHigh) {
        get().push({
          kind: "outbid",
          title: "You've been outbid",
          body: `The highest bid moved to ₹${(newCurrentBid ?? bid.amount).toLocaleString("en-IN")}. Place a higher bid to reclaim the lead.`,
          auctionId: bid.auctionId,
        });
      }
    });

    realtimeBus.on("REMINDER_TRIGGERED", ({ reminderId, auctionId, title }) => {
      get().push({
        kind: "reminder_triggered",
        title: `Starting soon — ${title}`,
        body: "Your reminder window is open. Keep funds ready and secure your position.",
        auctionId,
      });
      set((s) => ({ reminders: s.reminders.filter((r) => r.id !== reminderId) }));
    });

    realtimeBus.on("AUCTION_ENDED", ({ auctionId, winnerName, finalPrice }) => {
      if (winnerName === "You") {
        get().push({
          kind: "auction_won",
          title: "Lot won",
          body: `Your bid of ₹${finalPrice.toLocaleString("en-IN")} was the highest. Settlement has started.`,
          auctionId,
        });
      } else {
        get().push({
          kind: "system",
          title: "Auction ended",
          body: `Final price ₹${finalPrice.toLocaleString("en-IN")} — won by ${winnerName}.`,
          auctionId,
        });
      }
    });

    realtimeBus.on("AUCTION_STARTED", ({ auctionId }) => {
      get().push({
        kind: "auction_started",
        title: "Auction is live",
        body: "Bidding is now open. Enter the room to compete in real time.",
        auctionId,
      });
    });

    realtimeBus.on("PRODUCT_APPROVED", ({ title }) => {
      get().push({
        kind: "product_approved",
        title: "Product approved",
        body: `${title} is now READY FOR AUCTION. It will appear in the marketplace.`,
      });
    });

    realtimeBus.on("PRODUCT_REJECTED", ({ title, note }) => {
      get().push({
        kind: "product_rejected",
        title: "Verification update",
        body: `${title}: ${note || "changes requested by the review team"}.`,
      });
    });
  },
}));
