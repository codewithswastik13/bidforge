/* ============================================================
 * BIDFORGE — Backend client (FastAPI rtb-auction-engine)
 *
 * Typed fetch wrapper + WebSocket URL helper for the real-time
 * auction backend that now backs this app. Contract mirrors
 * backend/app/api/routes (see backend/README notes):
 *   POST /api/v1/auth/{register,login}          -> TokenResponse
 *   GET  /api/v1/auctions[/{id}][/bids]          -> auction data
 *   POST /api/v1/auctions/{id}/bids              -> place bid
 *   WS   /ws/auctions/{id}                       -> live events
 * All money values cross the API as 2-decimal strings.
 * ============================================================ */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TOKEN_KEY = "bidforge_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/* ---------- wire types (backend pydantic schemas) ---------- */

export interface BackendAuction {
  auction_id: string;
  title: string;
  description: string | null;
  starting_price: string;
  min_increment: string;
  current_price: string;
  version: number;
  status: "UPCOMING" | "LIVE" | "ENDED";
  current_winner: string | null;
  starts_at: string;
  ends_at: string;
}

export interface BackendBidHistoryItem {
  bid_id: string;
  bidder: string;
  amount: string;
  version: number;
  created_at: string;
}

export interface BackendBidAccepted {
  accepted: boolean;
  bid_id: string;
  auction_id: string;
  amount: string;
  version: number;
  current_price: string;
  replay: boolean;
}

export interface BackendBidRejected {
  accepted: false;
  code: string;
  attempted_amount?: string;
  current_price?: string;
  minimum_bid?: string;
  version?: number;
}

export interface BackendTokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  role: "BIDDER" | "ADMIN";
}

export interface BackendLiveMetrics {
  accepted_bids: number;
  rejected_bids: number;
  errors: number;
  db_lock_waits: number;
  db_deadlocks: number;
  ws_connections: number;
}

export type BackendWsEvent = {
  type: "BID_ACCEPTED";
  auction_id: string;
  bid_id: string;
  price: string;
  version: number;
  bidder_public_id: string;
  server_committed_at?: string;
};

/* ---------- fetch wrapper ---------- */

export class BackendError extends Error {
  status: number;
  code?: string;
  body?: unknown;

  constructor(status: number, message: string, code?: string, body?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

interface ApiOptions {
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
}

export async function backendApi<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, auth = true } = options;

  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // backend probes must fail fast when the engine is down
    signal: AbortSignal.timeout(8000),
  });

  const text = await resp.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!resp.ok) {
    const detail =
      payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const nested =
      "detail" in detail && typeof detail.detail === "object" && detail.detail !== null
        ? (detail.detail as Record<string, unknown>)
        : detail;
    const code = typeof nested.code === "string" ? nested.code : undefined;
    const message =
      typeof nested.detail === "string"
        ? nested.detail
        : code ?? `Request failed with status ${resp.status}`;
    throw new BackendError(resp.status, message, code, payload);
  }

  return payload as T;
}

export function backendWsUrl(auctionId: string): string {
  const wsBase = API_URL.replace(/^http/, "ws");
  return `${wsBase}/ws/auctions/${auctionId}`;
}

/** Backend serializes naive-UTC datetimes without a zone suffix; parse as UTC. */
export function parseUtcMs(iso: string): number {
  return Date.parse(iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`);
}

/* ---------- health probe ---------- */

let healthCache: { ok: boolean; checkedAt: number } | null = null;

export async function backendReachable(force = false): Promise<boolean> {
  if (!force && healthCache && Date.now() - healthCache.checkedAt < 10_000) {
    return healthCache.ok;
  }
  let ok = false;
  try {
    const resp = await fetch(`${API_URL}/health/live`, {
      signal: AbortSignal.timeout(1800),
    });
    ok = resp.ok;
  } catch {
    ok = false;
  }
  healthCache = { ok, checkedAt: Date.now() };
  return ok;
}
