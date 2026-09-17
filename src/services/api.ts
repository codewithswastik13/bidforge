/* ============================================================
 * VYRA — API service layer (mock)
 *
 * Every UI action flows through these services. Each function
 * documents the future backend route. To connect the real
 * backend, replace the body with `fetch(...)` — signatures
 * stay identical.
 * ============================================================ */

import type {
  Auction,
  AuctionListFilters,
  ConvertQuote,
  PaymentMethod,
  ProductSubmission,
  Reminder,
  Transaction,
  UserProfile,
} from "@/lib/types";
import { buildSeedAuctions, USDT_RATE_BASE } from "@/lib/mock-data";
import { randBetween, uid } from "@/lib/format";

const LATENCY = () => randBetween(220, 520);

function ok<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), LATENCY()));
}

/* ---------------- Auction API — GET /api/auctions ---------------- */

export const auctionsApi = {
  list(filters?: AuctionListFilters): Promise<Auction[]> {
    let data = buildSeedAuctions();
    if (filters?.status && filters.status !== "all") {
      data = data.filter((a) => a.status === filters.status);
    }
    if (filters?.category) {
      data = data.filter((a) => a.category === filters.category);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      data = data.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.seller.name.toLowerCase().includes(q)
      );
    }
    return ok(data);
  },
  get(id: string): Promise<Auction | undefined> {
    return ok(buildSeedAuctions().find((a) => a.id === id));
  },
};

/* ---------------- Wallet API — /api/wallet ---------------- */

export const walletApi = {
  /** GET /api/wallet/convert-quote?amount=&from=USDT */
  quote(usdtAmount: number): Promise<ConvertQuote> {
    const rate = USDT_RATE_BASE + randBetween(-0.6, 0.6);
    const fee = Math.round(usdtAmount * rate * 0.005);
    return ok({
      fromAmount: usdtAmount,
      rate: Math.round(rate * 100) / 100,
      fee,
      estimatedINR: Math.max(0, Math.round(usdtAmount * rate - fee)),
    });
  },
  /** POST /api/wallet/convert */
  convert(usdtAmount: number): Promise<{ success: boolean; inrCredited: number; rate: number; fee: number }> {
    const rate = USDT_RATE_BASE + randBetween(-0.4, 0.4);
    const fee = Math.round(usdtAmount * rate * 0.005);
    return ok({
      success: true,
      inrCredited: Math.max(0, Math.round(usdtAmount * rate - fee)),
      rate: Math.round(rate * 100) / 100,
      fee,
    });
  },
  /** POST /api/wallet/topup */
  topUp(amount: number, method: string): Promise<{ success: boolean; tx: Transaction }> {
    return ok({
      success: true,
      tx: {
        id: uid("tx"),
        type: "deposit",
        title: `Top-up via ${method}`,
        subtitle: "Credited to INR Wallet",
        amount,
        currency: "INR",
        status: method === "INR Wallet" ? "completed" : "pending",
        createdAt: Date.now(),
        method,
      },
    });
  },
};

/* ---------------- Product API — /api/products ---------------- */

export const productsApi = {
  /** POST /api/products — submit for review (requires captured camera image) */
  submit(payload: Omit<ProductSubmission, "id" | "submittedAt" | "status">): Promise<ProductSubmission> {
    return ok({
      ...payload,
      id: uid("sub"),
      submittedAt: Date.now(),
      status: "pending_review",
    });
  },
};

/* ---------------- Admin API — /api/admin ---------------- */

export const adminApi = {
  /** POST /api/admin/products/:id/approve */
  approve(submissionId: string): Promise<{ success: boolean }> {
    return ok({ success: true });
  },
  /** POST /api/admin/products/:id/reject */
  reject(submissionId: string, note: string): Promise<{ success: boolean }> {
    return ok({ success: true });
  },
  /** POST /api/admin/products/:id/request-changes */
  requestChanges(submissionId: string, note: string): Promise<{ success: boolean }> {
    return ok({ success: true });
  },
};

/* ---------------- Reminder API — /api/reminders ---------------- */

export const remindersApi = {
  /** POST /api/reminders */
  set(auctionId: string, offsetMinutes: number): Promise<Reminder> {
    return ok({
      id: uid("rem"),
      auctionId,
      offsetMinutes,
      createdAt: Date.now(),
    });
  },
  /** DELETE /api/reminders/:id */
  cancel(reminderId: string): Promise<{ success: boolean }> {
    return ok({ success: true });
  },
};

/* ---------------- Auth API — /api/auth (structure only) ---------------- */

export const authApi = {
  /** POST /api/auth/login */
  login(email: string): Promise<{ user: UserProfile }> {
    return ok({ user: { ...({} as UserProfile) } });
  },
  /** POST /api/auth/admin-login — no credentials are stored client-side */
  adminLogin(email: string): Promise<{ ok: boolean }> {
    return ok({ ok: true });
  },
};

/* ---------------- Notification API — /api/notifications ---------------- */

export const notificationsApi = {
  /** GET /api/notifications */
  list(): Promise<never[]> {
    return ok([]);
  },
};
