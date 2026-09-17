"use client";

import { create } from "zustand";
import type { PaymentMethod, Transaction, WalletAccount } from "@/lib/types";
import {
  buildSeedPaymentMethods,
  buildSeedTransactions,
  buildSeedWallets,
} from "@/lib/mock-data";
import { realtimeBus } from "@/services/realtime";
import { walletApi } from "@/services/api";

interface WalletState {
  accounts: WalletAccount[];
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  usdtRate: number;
  converting: boolean;
  wired: boolean;
  /** how much INR is currently locked per auction id */
  lockedByAuction: Record<string, number>;

  /** available for bidding across INR wallet = available − locked */
  availableForBidding: () => number;
  inrAccount: () => WalletAccount | undefined;
  usdtAccount: () => WalletAccount | undefined;

  lockForBid: (amount: number, auctionTitle: string) => void;
  releaseLock: (amount: number) => void;
  settleLock: (amount: number, auctionTitle: string) => void;
  subscribeRealtime: () => void;

  convertUsdToInr: (usdtAmount: number) => Promise<{ ok: boolean; inrCredited?: number; error?: string }>;
  topUp: (amount: number, method: string) => Promise<void>;

  setDefaultPaymentMethod: (id: string) => void;
  removePaymentMethod: (id: string) => void;
}

function touchWallet(reason: string) {
  realtimeBus.emit("WALLET_UPDATED", { reason });
}

export const useWalletStore = create<WalletState>((set, get) => ({
  accounts: buildSeedWallets(),
  transactions: buildSeedTransactions(),
  paymentMethods: buildSeedPaymentMethods(),
  usdtRate: 83.0,
  converting: false,
  wired: false,
  lockedByAuction: {},

  /** Wire bid-settlement behaviour to the realtime bus. */
  subscribeRealtime: () => {
    if (get().wired) return;
    set({ wired: true });

    realtimeBus.on("BID_ACCEPTED", ({ bid, newCurrentBid }) => {
      const { lockedByAuction } = get();
      const prevLock = lockedByAuction[bid.auctionId] ?? 0;
      if (bid.isYou) {
        // top up the lock to the new full amount
        const diff = (newCurrentBid ?? bid.amount) - prevLock;
        if (diff > 0) {
          get().lockForBid(diff, `Security deposit · lot ${bid.auctionId.replace("auc-", "")}`);
          set((s) => ({
            lockedByAuction: { ...s.lockedByAuction, [bid.auctionId]: newCurrentBid ?? bid.amount },
          }));
        }
      } else if (prevLock > 0) {
        // outbid — release the previous lock
        get().releaseLock(prevLock);
        set((s) => {
          const { [bid.auctionId]: _removed, ...rest } = s.lockedByAuction;
          return { lockedByAuction: rest };
        });
      }
    });

    realtimeBus.on("AUCTION_ENDED", ({ auctionId, winnerName, finalPrice }) => {
      const lock = get().lockedByAuction[auctionId];
      if (lock && winnerName === "You") {
        get().settleLock(finalPrice, "Winning bid settlement");
      } else if (lock) {
        get().releaseLock(lock);
      }
      set((s) => {
        const { [auctionId]: _removed, ...rest } = s.lockedByAuction;
        return { lockedByAuction: rest };
      });
    });
  },

  availableForBidding: () => {
    const inr = get().inrAccount();
    if (!inr) return 0;
    return Math.max(0, inr.available - inr.locked);
  },
  inrAccount: () => get().accounts.find((a) => a.type === "inr"),
  usdtAccount: () => get().accounts.find((a) => a.type === "usdt"),

  lockForBid: (amount, auctionTitle) => {
    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.type === "inr" ? { ...a, locked: a.locked + amount } : a
      ),
      transactions: [
        {
          id: `tx_${Date.now().toString(36)}`,
          type: "bid_lock",
          title: "Funds locked for bid",
          subtitle: auctionTitle,
          amount: -amount,
          currency: "INR",
          status: "pending",
          createdAt: Date.now(),
          method: "INR Wallet",
        },
        ...s.transactions,
      ].slice(0, 40),
    }));
    touchWallet(`Lock ${amount} for ${auctionTitle}`);
  },

  releaseLock: (amount) => {
    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.type === "inr" ? { ...a, locked: Math.max(0, a.locked - amount) } : a
      ),
    }));
    touchWallet(`Release lock ${amount}`);
  },

  settleLock: (amount, auctionTitle) => {
    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.type === "inr"
          ? { ...a, locked: Math.max(0, a.locked - amount), available: Math.max(0, a.available - amount) }
          : a
      ),
      transactions: [
        {
          id: `tx_${Date.now().toString(36)}`,
          type: "bid_settlement",
          title: "Auction settlement",
          subtitle: auctionTitle,
          amount: -amount,
          currency: "INR",
          status: "completed",
          createdAt: Date.now(),
          method: "INR Wallet",
        },
        ...s.transactions,
      ].slice(0, 40),
    }));
    realtimeBus.emit("TRANSACTION_COMPLETED", {
      txId: `tx_${Date.now().toString(36)}`,
      title: `Settled ${auctionTitle}`,
    });
  },

  convertUsdToInr: async (usdtAmount) => {
    const usdt = get().usdtAccount();
    if (!usdt) return { ok: false, error: "Crypto wallet unavailable" };
    if (usdtAmount <= 0) return { ok: false, error: "Enter a USDT amount" };
    if (usdtAmount > usdt.available) return { ok: false, error: "Insufficient USDT balance" };

    set({ converting: true });
    const res = await walletApi.convert(usdtAmount);
    // simulate chain confirmation delay
    await new Promise((r) => setTimeout(r, 900));
    set((s) => ({
      converting: false,
      accounts: s.accounts.map((a) => {
        if (a.type === "usdt") return { ...a, available: a.available - usdtAmount };
        if (a.type === "inr") return { ...a, available: a.available + res.inrCredited };
        return a;
      }),
      transactions: [
        {
          id: `tx_${Date.now().toString(36)}`,
          type: "conversion",
          title: `Converted ${usdtAmount} USDT → INR`,
          subtitle: `Rate ₹${res.rate.toFixed(2)} · fee ${res.fee.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}`,
          amount: res.inrCredited,
          currency: "INR",
          status: "completed",
          createdAt: Date.now(),
          method: "USDT → INR Wallet",
        },
        ...s.transactions,
      ].slice(0, 40),
    }));
    realtimeBus.emit("TRANSACTION_COMPLETED", {
      txId: `tx_${Date.now().toString(36)}`,
      title: `Converted ${usdtAmount} USDT → ₹${res.inrCredited.toLocaleString("en-IN")}`,
    });
    touchWallet("USDT converted to INR");
    return { ok: true, inrCredited: res.inrCredited };
  },

  topUp: async (amount, method) => {
    const res = await walletApi.topUp(amount, method);
    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.type === "inr" && res.tx.status === "completed"
          ? { ...a, available: a.available + amount }
          : a
      ),
      transactions: [res.tx, ...s.transactions].slice(0, 40),
    }));
    touchWallet(`Top-up ${method}`);
  },

  setDefaultPaymentMethod: (id) => {
    set((s) => ({
      paymentMethods: s.paymentMethods.map((p) => ({ ...p, isDefault: p.id === id })),
    }));
  },

  removePaymentMethod: (id) => {
    set((s) => ({ paymentMethods: s.paymentMethods.filter((p) => p.id !== id) }));
  },
}));
