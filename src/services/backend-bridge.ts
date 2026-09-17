"use client";

/* ============================================================
 * BIDFORGE — Backend bridge
 *
 * Connects the UI's realtime event bus to the real auction
 * engine. When the backend is reachable it becomes the source of
 * truth: auctions hydrate from the API, bids are placed over REST
 * (idempotency-keyed), and live events stream in over WebSocket
 * into the same store actions the simulation used. When the
 * backend is down the app falls back to the local simulation
 * untouched — the site never looks broken.
 * ============================================================ */

import type { Auction, Bid } from "@/lib/types";
import {
  backendApi,
  backendWsUrl,
  getToken,
  parseUtcMs,
  backendReachable,
  type BackendAuction,
  type BackendBidAccepted,
  type BackendBidHistoryItem,
  type BackendWsEvent,
} from "@/lib/backend";
import { buildSeedAuctions } from "@/lib/mock-data";
import { useAuctionStore } from "@/store/auctions";
import { useAuthStore } from "@/store/auth";
import { realtimeBus } from "@/services/realtime";

let active = false;
const sockets = new Map<string, () => void>();
const lastAppliedVersion = new Map<string, number>();

export function isBackendActive(): boolean {
  return active;
}

/* ---------- auction enrichment ----------
   The engine stores bidding truth (prices, versions, timing);
   presentation fields (image, category, seller…) are borrowed from
   the original showcase catalog by exact title match so the UI looks
   exactly as designed. */

const VISUALS_BY_TITLE = new Map<string, Auction>(
  buildSeedAuctions().map((a) => [a.title, a]),
);

function hashLabel(publicId: string): string {
  let h = 0;
  for (let i = 0; i < publicId.length; i += 1) {
    h = (h * 31 + publicId.charCodeAt(i)) | 0;
  }
  return String(Math.abs(h) % 9000 + 1000);
}

export function mapBackendAuction(b: BackendAuction): Auction {
  const seed = VISUALS_BY_TITLE.get(b.title);
  const status =
    b.status === "LIVE" ? "live" : b.status === "UPCOMING" ? "upcoming" : "ended";
  const startsAt = parseUtcMs(b.starts_at);
  const endsAt = parseUtcMs(b.ends_at);
  const current = Number(b.current_price);
  const base = Number(b.starting_price);

  return {
    id: b.auction_id,
    slug: seed?.slug ?? b.auction_id,
    title: b.title,
    description: b.description ?? seed?.description ?? "",
    category: seed?.category ?? "Collectibles",
    condition: seed?.condition ?? "Verified",
    images: seed?.images ?? ["/products/p-robot.png"],
    basePrice: base,
    currentBid: current,
    bidIncrement: Number(b.min_increment),
    bidCount: b.version,
    watcherCount: seed?.watcherCount ?? 240,
    status,
    startsAt,
    endsAt,
    seller: seed?.seller ?? { id: "u-vault", name: "BIDFORGE Vault", rating: 4.9, verified: true },
    location: seed?.location ?? "Mumbai, IN",
    featured: seed?.featured ?? status === "live",
    highlights: seed?.highlights,
    // two-point sparkline until real history loads (see hydrateBidHistory)
    bidHistory: [base, current],
    lotNumber: seed?.lotNumber,
    estimateLow: seed?.estimateLow,
    estimateHigh: seed?.estimateHigh,
    searchText: [
      b.title,
      seed?.category ?? "",
      seed?.location ?? "",
      seed?.seller.name ?? "",
    ]
      .join(" ")
      .toLowerCase(),
  };
}

/* ---------- hydration ---------- */

function sortForShowcase(list: Auction[]): Auction[] {
  const rank = (a: Auction) => (a.status === "live" ? 0 : a.status === "upcoming" ? 1 : 2);
  return [...list].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    return a.status === "upcoming" ? a.startsAt - b.startsAt : a.endsAt - b.endsAt;
  });
}

async function hydrateBidHistory(auction: Auction): Promise<Bid[]> {
  try {
    const rows = await backendApi<BackendBidHistoryItem[]>(
      `/api/v1/auctions/${auction.id}/bids`
    );
    return rows.map(
      (row): Bid => ({
        id: row.bid_id,
        auctionId: auction.id,
        bidder: row.bidder,
        bidderId: row.bidder,
        amount: Number(row.amount),
        createdAt: parseUtcMs(row.created_at),
        status: "accepted",
        isYou: false,
      })
    );
  } catch {
    return [];
  }
}

export async function bootBackendBridge(): Promise<boolean> {
  if (active) return true;
  if (!(await backendReachable(true))) return false;

  try {
    const { items } = await backendApi<{ items: BackendAuction[]; total: number }>(
      "/api/v1/auctions"
    );
    const mapped = sortForShowcase(items.map(mapBackendAuction));
    if (mapped.length === 0) return false;

    const store = useAuctionStore.getState();
    const hero =
      mapped.find((a) => a.title === "Limited Edition Chronograph") ??
      mapped.find((a) => a.status === "live") ??
      mapped[0];

    store.replaceAuctions(mapped, hero.id);

    // real accepted-bid history for live rooms (prices feed sparklines)
    for (const auction of mapped.filter((a) => a.status === "live")) {
      const bids = await hydrateBidHistory(auction);
      if (bids.length > 0) {
        useAuctionStore.getState().seedBidHistory(auction.id, bids);
      }
      connectAuctionSocket(auction.id);
    }

    active = true;
    return true;
  } catch (error) {
    console.warn("[bidforge] backend hydration failed, staying on fallback:", error);
    return false;
  }
}

/* ---------- WebSocket wiring ---------- */

const RECONNECT_MIN_MS = 500;
const RECONNECT_MAX_MS = 8000;

function connectAuctionSocket(auctionId: string): void {
  if (sockets.has(auctionId)) return;
  let socket: WebSocket | null = null;
  let delay = RECONNECT_MIN_MS;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (stopped) return;
    socket = new WebSocket(backendWsUrl(auctionId));
    socket.onopen = () => {
      delay = RECONNECT_MIN_MS;
    };
    socket.onmessage = (raw) => {
      try {
        handleWsEvent(JSON.parse(raw.data as string) as BackendWsEvent);
      } catch {
        // malformed frame — ignore, keep the socket alive
      }
    };
    socket.onclose = () => {
      if (stopped) return;
      timer = setTimeout(connect, delay);
      delay = Math.min(delay * 2, RECONNECT_MAX_MS);
    };
    socket.onerror = () => socket?.close();
  };

  connect();
  sockets.set(auctionId, () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    socket?.close();
    sockets.delete(auctionId);
  });
}

export function handleWsEvent(event: BackendWsEvent): void {
  const store = useAuctionStore.getState();
  const auctionId = event.auction_id;
  const applied = lastAppliedVersion.get(auctionId) ?? -1;

  if (event.type === "BID_ACCEPTED") {
    if (event.version <= applied) return; // duplicate/out-of-order delivery
    lastAppliedVersion.set(auctionId, event.version);
    const myId = useAuthStore.getState().backendId;
    store.applyServerBid({
      id: event.bid_id,
      auctionId,
      bidder: myId && event.bidder_public_id === myId ? "You" : `User #${hashLabel(event.bidder_public_id)}`,
      bidderId: event.bidder_public_id,
      amount: Number(event.price),
      createdAt: event.server_committed_at ? parseUtcMs(event.server_committed_at) : Date.now(),
      status: "accepted",
      isYou: Boolean(myId) && event.bidder_public_id === myId,
    });
    return;
  }
}

/** Applies a REST bid response immediately; the WS echo of the same
 * version is dropped by the version guard above. */
export function applyRestBidResponse(response: BackendBidAccepted): void {
  const myId = useAuthStore.getState().backendId;
  if (response.version <= (lastAppliedVersion.get(response.auction_id) ?? -1)) return;
  lastAppliedVersion.set(response.auction_id, response.version);
  useAuctionStore.getState().applyServerBid({
    id: response.bid_id,
    auctionId: response.auction_id,
    bidder: "You",
    bidderId: myId ?? "you",
    amount: Number(response.amount),
    createdAt: Date.now(),
    status: "accepted",
    isYou: true,
  });
}

/* ---------- bid placement ---------- */

export interface PlaceBidResult {
  ok: boolean;
  reason?: string;
  message?: string;
}

export async function placeBidViaBackend(
  auctionId: string,
  amount: number
): Promise<PlaceBidResult> {
  if (!getToken()) {
    return {
      ok: false,
      reason: "auth",
      message: "Sign in to place a bid — rooms are open to verified accounts.",
    };
  }
  const idempotencyKey =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  try {
    const accepted = await backendApi<BackendBidAccepted>(
      `/api/v1/auctions/${auctionId}/bids`,
      {
        method: "POST",
        body: { amount: amount.toFixed(2) },
        headers: { "X-Idempotency-Key": idempotencyKey },
      }
    );
    applyRestBidResponse(accepted);
    return { ok: true, message: `Bid of ₹${amount.toLocaleString("en-IN")} submitted.` };
  } catch (error: unknown) {
    const err = error as { status?: number; code?: string; body?: { detail?: { minimum_bid?: string; current_price?: string } } };
    if (err.code === "BID_TOO_LOW") {
      const detail = err.body?.detail;
      const minimum = detail?.minimum_bid ? Number(detail.minimum_bid) : null;
      return {
        ok: false,
        reason: "too_low",
        message: minimum
          ? `Minimum bid is ₹${minimum.toLocaleString("en-IN")} — the room moved first.`
          : "Bid below the current minimum.",
      };
    }
    if (err.code === "AUCTION_ENDED") {
      return { ok: false, reason: "not_live", message: "This auction has ended." };
    }
    if (err.code === "AUCTION_NOT_LIVE") {
      return { ok: false, reason: "not_live", message: "This auction is not live." };
    }
    if (err.status === 401) {
      return { ok: false, reason: "auth", message: "Your session expired — sign in again." };
    }
    return { ok: false, reason: "engine", message: "Bid engine unreachable — try again." };
  }
}

/** Pushes the visitor's optimistic pending bid into the room feed. */
export function pushOwnPendingBid(auctionId: string, amount: number): Bid {
  const bid: Bid = {
    id: `local-${Date.now().toString(36)}`,
    auctionId,
    bidder: "You",
    bidderId: useAuthStore.getState().backendId ?? "you",
    amount,
    createdAt: Date.now(),
    status: "pending",
    isYou: true,
  };
  useAuctionStore.getState().pushLocalPendingBid(bid);
  return bid;
}

/* ---------- realtime bus → bridge (rejections surface as toasts) ---------- */

let wiredBus = false;
export function wireBusToBackend(): void {
  if (wiredBus) return;
  wiredBus = true;
  realtimeBus.on("BID_REJECTED", ({ bid, reason }) => {
    if (isBackendActive() && bid.isYou) {
      // surface the engine's rejection exactly like the room UI does
      import("@/store/notifications").then(({ useNotificationsStore }) => {
        useNotificationsStore.getState().push({
          kind: "bid_rejected",
          title: "Bid rejected",
          body: reason ?? "The engine rejected this bid.",
          auctionId: bid.auctionId,
        });
      });
    }
  });
}

/* ---------- admin metrics ---------- */

export function startBackendMetricsPoll(): void {
  if (!active) return;
  const poll = async () => {
    if (useAuthStore.getState().role !== "admin") return;
    try {
      const snap = await backendApi<{
        accepted_bids: number;
        rejected_bids: number;
        ws_connections: number;
      }>("/api/v1/admin/metrics/live");
      const { useMetricsStore } = await import("@/store/metrics");
      useMetricsStore
        .getState()
        .mergeBackendMetrics(snap.accepted_bids, snap.rejected_bids, snap.ws_connections);
    } catch {
      // not admin / engine busy — ignore
    }
  };
  void poll();
  setInterval(poll, 4000);
}
