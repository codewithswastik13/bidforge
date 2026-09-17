"use client";

import { create } from "zustand";
import type { Auction, Bid } from "@/lib/types";
import { buildSeedAuctions } from "@/lib/mock-data";
import { uid } from "@/lib/format";
import { realtimeBus, EXTENSION_AMOUNT_MS } from "@/services/realtime";

/**
 * Auction store — single source of truth for live auction state.
 * All mutations arrive via realtime bus events (mirroring the
 * future socket.io contract) so the UI never talks to mock data
 * directly.
 */

const EXTENSION_WINDOW_MS = 45_000;

interface AuctionState {
  auctions: Auction[];
  /** live bid activity per auction (newest first, capped) */
  bids: Record<string, Bid[]>;
  /** per-auction visual pulse: increments whenever a bid lands */
  bidPulse: Record<string, number>;
  /** per-auction price flash direction */
  priceFlash: Record<string, "up" | "down" | undefined>;
  /** countdown clock, updated once per second from the app shell */
  now: number;
  /** true after realtime handlers are wired */
  wired: boolean;
  yourHighestBid: Record<string, number>;
  /** auction featured in the hero/showcase (resolved id, not hardcoded) */
  heroAuctionId: string;
  /** true when the real bid engine (backend bridge) owns auction state */
  liveMode: boolean;

  init: (now?: number) => void;
  tick: (now: number) => void;
  subscribeRealtime: () => void;
  /** UI action — submit the visitor's own bid through the event contract */
  placeOwnBid: (auctionId: string, amount: number) => { ok: boolean; reason?: string; message?: string };
  resetPulse: (auctionId: string) => void;
  /* ---- backend bridge (live engine) ---- */
  replaceAuctions: (list: Auction[], heroId: string) => void;
  seedBidHistory: (auctionId: string, bids: Bid[]) => void;
  applyServerBid: (bid: Bid) => void;
  applyServerStatus: (auctionId: string, status: "LIVE" | "UPCOMING" | "ENDED") => void;
  pushLocalPendingBid: (bid: Bid) => void;
  /** resolves an optimistic local bid once the engine answers */
  resolveLocalBid: (bid: Bid, status: "accepted" | "rejected") => void;
}

const CAP = 40;

function pushBid(map: Record<string, Bid[]>, bid: Bid): Record<string, Bid[]> {
  const list = [bid, ...(map[bid.auctionId] ?? [])].slice(0, CAP);
  return { ...map, [bid.auctionId]: list };
}

export const useAuctionStore = create<AuctionState>((set, get) => ({
  auctions: [],
  bids: {},
  bidPulse: {},
  priceFlash: {},
  now: 0,
  wired: false,
  yourHighestBid: {},
  heroAuctionId: "auc-chronograph",
  liveMode: false,

  init: (now = Date.now()) => {
    if (get().auctions.length > 0) return;
    set({ auctions: buildSeedAuctions(now), now });
    get().subscribeRealtime();
  },

  tick: (now) => {
    const { auctions } = get();
    let changed = false;
    let extendedOrEnded: { id: string; winnerName: string; finalPrice: number } | null = null;
    const startedIds: string[] = [];

    const next = auctions.map((a) => {
      if (a.status === "upcoming" && a.startsAt <= now) {
        changed = true;
        startedIds.push(a.id);
        return { ...a, status: "live" as const };
      }
      if (a.status === "live" && a.endsAt <= now) {
        changed = true;
        const last = get().bids[a.id]?.find((b) => b.status === "accepted");
        extendedOrEnded = {
          id: a.id,
          winnerName: last?.bidder ?? "—",
          finalPrice: last?.amount ?? a.currentBid,
        };
        return { ...a, status: "ended" as const };
      }
      return a;
    });

    if (changed) {
      set({ auctions: next, now });
      for (const id of startedIds) realtimeBus.emit("AUCTION_STARTED", { auctionId: id });
      if (extendedOrEnded) realtimeBus.emit("AUCTION_ENDED", extendedOrEnded);
    } else {
      set({ now });
    }
  },

  subscribeRealtime: () => {
    if (get().wired) return;
    set({ wired: true });

    /* ---- a bid arrives (rival engine or this user) ---- */
    realtimeBus.on("BID_RECEIVED", ({ bid }) => {
      const { auctions } = get();
      const auction = auctions.find((a) => a.id === bid.auctionId);
      if (!auction || auction.status !== "live") return;

      const valid = bid.amount > auction.currentBid;

      set((s) => ({ bids: pushBid(s.bids, bid) }));

      if (!valid) {
        // server would reject — simulate the round trip
        setTimeout(() => {
          realtimeBus.emit("BID_REJECTED", {
            auctionId: bid.auctionId,
            bid: { ...bid, status: "rejected" },
            reason: `Your bid must exceed the current highest bid of ₹${auction.currentBid.toLocaleString("en-IN")}.`,
          });
        }, 420);
        return;
      }

      setTimeout(() => {
        const acceptedBid: Bid = { ...bid, status: "accepted" };
        const state = get();
        const auction2 = state.auctions.find((a) => a.id === bid.auctionId);
        if (!auction2 || auction2.status !== "live") return;

        const remaining = auction2.endsAt - state.now;
        const shouldExtend = remaining < EXTENSION_WINDOW_MS;
        const newEndsAt = shouldExtend ? auction2.endsAt + EXTENSION_AMOUNT_MS : auction2.endsAt;

        set((s) => ({
          auctions: s.auctions.map((a) =>
            a.id === bid.auctionId
              ? {
                  ...a,
                  currentBid: acceptedBid.amount,
                  bidCount: a.bidCount + 1,
                  endsAt: newEndsAt,
                  bidHistory: [...a.bidHistory.slice(-30), acceptedBid.amount],
                }
              : a
          ),
          bidPulse: { ...s.bidPulse, [bid.auctionId]: (s.bidPulse[bid.auctionId] ?? 0) + 1 },
          priceFlash: { ...s.priceFlash, [bid.auctionId]: "up" },
          bids: s.bids[bid.auctionId]?.some((b) => b.id === bid.id)
            ? {
                ...s.bids,
                [bid.auctionId]: s.bids[bid.auctionId].map((b) =>
                  b.id === bid.id ? acceptedBid : b
                ),
              }
            : pushBid(s.bids, acceptedBid),
          yourHighestBid:
            acceptedBid.isYou && acceptedBid.amount > (s.yourHighestBid[bid.auctionId] ?? 0)
              ? { ...s.yourHighestBid, [bid.auctionId]: acceptedBid.amount }
              : s.yourHighestBid,
        }));

        realtimeBus.emit("BID_ACCEPTED", {
          auctionId: bid.auctionId,
          bid: acceptedBid,
          newCurrentBid: acceptedBid.amount,
        });
        const prev = auction2.currentBid;
        realtimeBus.emit("PRICE_UPDATED", {
          auctionId: bid.auctionId,
          previous: prev,
          current: acceptedBid.amount,
        });
        if (shouldExtend) {
          realtimeBus.emit("AUCTION_EXTENDED", {
            auctionId: bid.auctionId,
            addedMs: EXTENSION_AMOUNT_MS,
            newEndsAt,
          });
        }
      }, 380 + Math.random() * 420);
    });

    /* ---- rejected bid ---- */
    realtimeBus.on("BID_REJECTED", ({ bid }) => {
      set((s) => ({
        bids: {
          ...s.bids,
          [bid.auctionId]: (s.bids[bid.auctionId] ?? []).map((b) =>
            b.id === bid.id ? { ...b, status: "rejected" as const } : b
          ),
        },
      }));
    });

    /* ---- flash cleanup shortly after price change ---- */
    realtimeBus.on("PRICE_UPDATED", ({ auctionId }) => {
      setTimeout(() => {
        set((s) => ({ priceFlash: { ...s.priceFlash, [auctionId]: undefined } }));
      }, 900);
    });
  },

  placeOwnBid: (auctionId, amount) => {
    const state = get();
    const auction = state.auctions.find((a) => a.id === auctionId);
    if (!auction) return { ok: false, reason: "not_found" };
    if (auction.status !== "live") return { ok: false, reason: "not_live", message: "This auction is not live." };
    if (amount <= auction.currentBid) {
      return {
        ok: false,
        reason: "too_low",
        message: `Your bid must exceed the current highest bid of ₹${auction.currentBid.toLocaleString("en-IN")}.`,
      };
    }

    /* live engine mode: optimistic pending bid + REST round trip; the
       authoritative result lands via applyServerBid / BID_REJECTED */
    if (state.liveMode) {
      // local sanity check against the last known price (engine re-checks)
      void (async () => {
        const { placeBidViaBackend, pushOwnPendingBid } = await import("@/services/backend-bridge");
        const pending = pushOwnPendingBid(auctionId, amount);
        const result = await placeBidViaBackend(auctionId, amount);
        const store = get();
        if (!result.ok) {
          store.resolveLocalBid(pending, "rejected");
          realtimeBus.emit("BID_REJECTED", {
            auctionId,
            bid: { ...pending, status: "rejected" },
            reason: result.message,
          });
        } else {
          // accepted bid lands via applyServerBid — retire the placeholder
          store.resolveLocalBid(pending, "accepted");
        }
      })();
      return { ok: true, message: `Bid of ₹${amount.toLocaleString("en-IN")} submitted.` };
    }

    const bid: Bid = {
      id: uid("bid"),
      auctionId,
      bidder: "You",
      bidderId: "u-you",
      amount,
      createdAt: Date.now(),
      status: "pending",
      isYou: true,
    };
    realtimeBus.emit("BID_RECEIVED", { auctionId, bid });
    return { ok: true, message: `Bid of ₹${amount.toLocaleString("en-IN")} submitted.` };
  },

  resetPulse: (auctionId) =>
    set((s) => ({ bidPulse: { ...s.bidPulse, [auctionId]: 0 } })),

  /* ---- backend bridge (live engine) ---- */

  replaceAuctions: (list, heroId) =>
    set({ auctions: list, heroAuctionId: heroId, liveMode: true, bids: {}, yourHighestBid: {} }),

  seedBidHistory: (auctionId, bids) =>
    set((s) => ({
      bids: { ...s.bids, [auctionId]: bids.slice(0, CAP) },
      auctions: s.auctions.map((a) =>
        a.id === auctionId && bids.length > 0
          ? {
              ...a,
              bidCount: Math.max(a.bidCount, bids.length),
              bidHistory: [...bids].reverse().map((b) => b.amount),
            }
          : a
      ),
    })),

  /** Authoritative accepted bid from the engine — no re-validation,
   * no simulated latency, no timer extension (the engine owns endsAt). */
  applyServerBid: (bid) => {
    const state = get();
    const auction = state.auctions.find((a) => a.id === bid.auctionId);
    if (!auction) return;
    if (state.bids[bid.auctionId]?.some((b) => b.id === bid.id)) return; // duplicate delivery

    set((s) => ({
      bids: pushBid(s.bids, bid),
      auctions: s.auctions.map((a) =>
        a.id === bid.auctionId
          ? {
              ...a,
              currentBid: bid.amount,
              bidCount: a.bidCount + 1,
              bidHistory: [...a.bidHistory.slice(-30), bid.amount],
            }
          : a
      ),
      bidPulse: { ...s.bidPulse, [bid.auctionId]: (s.bidPulse[bid.auctionId] ?? 0) + 1 },
      priceFlash: { ...s.priceFlash, [bid.auctionId]: "up" },
      yourHighestBid:
        bid.isYou && bid.amount > (s.yourHighestBid[bid.auctionId] ?? 0)
          ? { ...s.yourHighestBid, [bid.auctionId]: bid.amount }
          : s.yourHighestBid,
    }));

    const previous = auction.currentBid;
    realtimeBus.emit("BID_ACCEPTED", { auctionId: bid.auctionId, bid, newCurrentBid: bid.amount });
    realtimeBus.emit("PRICE_UPDATED", {
      auctionId: bid.auctionId,
      previous,
      current: bid.amount,
    });
  },

  applyServerStatus: (auctionId, status) => {
    const mapped = status === "LIVE" ? "live" : status === "UPCOMING" ? "upcoming" : "ended";
    set((s) => ({
      auctions: s.auctions.map((a) => (a.id === auctionId ? { ...a, status: mapped } : a)),
    }));
  },

  pushLocalPendingBid: (bid) => set((s) => ({ bids: pushBid(s.bids, bid) })),

  resolveLocalBid: (bid, status) =>
    set((s) => ({
      bids: {
        ...s.bids,
        [bid.auctionId]: (s.bids[bid.auctionId] ?? []).map((b) =>
          b.id === bid.id ? { ...b, status } : b
        ),
      },
    })),
}));
