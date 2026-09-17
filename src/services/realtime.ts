/* ============================================================
 * VYRA — Realtime layer
 *
 * A typed event bus that mirrors the future socket.io event
 * contract. Today it is driven by a local simulation engine;
 * tomorrow, `startSimulation()` can be replaced by a real
 * socket connection emitting the exact same event names.
 * ============================================================ */

import type { Bid, SystemMetrics } from "@/lib/types";
import { pick, randBetween } from "@/lib/format";
import { RIVAL_NAMES } from "@/lib/mock-data";

/* ---------- payloads ---------- */

export interface BidEventPayload {
  auctionId: string;
  bid: Bid;
  newCurrentBid?: number;
  reason?: string;
}

export interface ExtendedPayload {
  auctionId: string;
  addedMs: number;
  newEndsAt: number;
}

export interface StartedPayload {
  auctionId: string;
}

export interface EndedPayload {
  auctionId: string;
  winnerName: string;
  finalPrice: number;
}

export interface WalletPayload {
  reason: string;
}

export interface MetricsPayload {
  metrics: SystemMetrics;
}

export interface ReminderPayload {
  reminderId: string;
  auctionId: string;
  title: string;
}

export interface ProductPayload {
  submissionId: string;
  title: string;
  note?: string;
}

interface EventMap {
  BID_RECEIVED: BidEventPayload;
  BID_ACCEPTED: BidEventPayload;
  BID_REJECTED: BidEventPayload;
  PRICE_UPDATED: { auctionId: string; previous: number; current: number };
  AUCTION_EXTENDED: ExtendedPayload;
  AUCTION_STARTED: StartedPayload;
  AUCTION_ENDED: EndedPayload;
  WALLET_UPDATED: WalletPayload;
  TRANSACTION_COMPLETED: { txId: string; title: string };
  PRODUCT_APPROVED: ProductPayload;
  PRODUCT_REJECTED: ProductPayload;
  REMINDER_TRIGGERED: ReminderPayload;
  // internal (simulation only, replace by server ticks later)
  METRICS_TICK: MetricsPayload;
}

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void;

class RealtimeBus {
  private handlers = new Map<keyof EventMap, Set<Handler<never>>>();
  private connected = false;

  connect() {
    this.connected = true;
  }
  disconnect() {
    this.connected = false;
  }
  isConnected() {
    return this.connected;
  }

  on<K extends keyof EventMap>(event: K, handler: Handler<K>) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<K>) {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of set) (h as Handler<K>)(payload);
  }
}

export const realtimeBus = new RealtimeBus();

/* ============================================================
 * Simulation engine
 * ============================================================ */

const EXTENSION_WINDOW_MS = 45_000;   // bids inside this window extend the auction
export const EXTENSION_AMOUNT_MS = 15_000;

interface EngineState {
  rivalTimer: ReturnType<typeof setTimeout> | null;
  metricsTimer: ReturnType<typeof setInterval> | null;
  running: boolean;
}

const engine: EngineState = {
  rivalTimer: null,
  metricsTimer: null,
  running: false,
};

let metrics: SystemMetrics = {
  requestsPerSec: 2400,
  activeConnections: 1284,
  avgLatencyMs: 21,
  bidsPerSec: 5,
  acceptedBids: 184203,
  rejectedBids: 1129,
  queueDepth: 3,
  dbStatus: "operational",
  wsStatus: "operational",
  queueStatus: "operational",
  txVolumeINR: 48200000,
  history: {
    // deterministic seed series — identical on server & client (no hydration mismatch);
    // the simulation engine's random walk takes over after the first ticks.
    rps: Array.from({ length: 40 }, (_, i) => Math.round(2300 + Math.sin(i / 3) * 160 + Math.cos(i * 1.7) * 60)),
    latency: Array.from({ length: 40 }, (_, i) => Math.round((20 + Math.sin(i / 4) * 6 + Math.sin(i * 2.3) * 3) * 10) / 10),
    bps: Array.from({ length: 40 }, (_, i) => Math.round((5 + Math.sin(i / 2.5) * 2) * 10) / 10),
  },
};

export function getMetricsSnapshot(): SystemMetrics {
  return metrics;
}

function makeRivalBid(auctionId: string, currentBid: number, increment: number): Bid {
  const mult = pick([1, 1, 1, 2, 2, 3]);
  const amount = currentBid + increment * mult;
  const now = Date.now();
  return {
    id: `bid_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    auctionId,
    bidder: pick(RIVAL_NAMES),
    bidderId: `rival_${Math.floor(randBetween(1000, 9999))}`,
    amount,
    createdAt: now,
    status: "pending",
  };
}

function nextRivalDelay(): number {
  return randBetween(1600, 4200);
}

/**
 * Starts the local realtime simulation. Safe to call once from the
 * app shell. Replace this with a socket.io connection later — the
 * event names emitted here are exactly the production event contract.
 */
export function startSimulation(opts?: { heroAuctionId?: string }) {
  if (engine.running) return;
  engine.running = true;
  realtimeBus.connect();

  const heroAuctionId = opts?.heroAuctionId ?? "auc-chronograph";

  /* ---- global 1s tick: metrics stream ---- */
  engine.metricsTimer = setInterval(() => {
    metrics = {
      ...metrics,
      requestsPerSec: Math.round(
        Math.max(1800, Math.min(3400, metrics.requestsPerSec + randBetween(-90, 100)))
      ),
      activeConnections: Math.round(
        Math.max(900, Math.min(2200, metrics.activeConnections + randBetween(-24, 26)))
      ),
      avgLatencyMs:
        Math.round(Math.max(9, Math.min(48, metrics.avgLatencyMs + randBetween(-2.4, 2.4))) * 10) /
        10,
      bidsPerSec: Math.max(1, Math.min(12, Math.round(metrics.bidsPerSec + randBetween(-1.4, 1.5)))),
      acceptedBids: metrics.acceptedBids + Math.round(randBetween(2, 7)),
      rejectedBids: metrics.rejectedBids + (Math.random() < 0.18 ? 1 : 0),
      queueDepth: Math.max(0, Math.round(metrics.queueDepth + randBetween(-2, 2))),
      txVolumeINR: metrics.txVolumeINR + Math.round(randBetween(4000, 60000)),
      history: {
        rps: [...metrics.history.rps.slice(1), metrics.requestsPerSec],
        latency: [...metrics.history.latency.slice(1), metrics.avgLatencyMs],
        bps: [...metrics.history.bps.slice(1), metrics.bidsPerSec],
      },
    };
    realtimeBus.emit("METRICS_TICK", { metrics });
  }, 1000);

  /* ---- rival bidding engine (lazy store read, no import cycle) ---- */
  const rivalTick = () => {
    import("@/store/auctions").then(({ useAuctionStore }) => {
      const store = useAuctionStore.getState();
      const liveAuctions = store.auctions.filter((a) => a.status === "live");
      for (const a of liveAuctions) {
        const chance = a.id === heroAuctionId ? 0.55 : 0.18;
        if (Math.random() > chance) continue;
        const bid = makeRivalBid(a.id, a.currentBid, a.bidIncrement);
        realtimeBus.emit("BID_RECEIVED", { auctionId: a.id, bid });
      }
    });
    engine.rivalTimer = setTimeout(rivalTick, nextRivalDelay());
  };
  engine.rivalTimer = setTimeout(rivalTick, 1500);
}

export function stopSimulation() {
  if (engine.rivalTimer) clearTimeout(engine.rivalTimer);
  if (engine.metricsTimer) clearInterval(engine.metricsTimer);
  engine.running = false;
  realtimeBus.disconnect();
}
