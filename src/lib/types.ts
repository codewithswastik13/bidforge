/* ============================================================
 * VYRA — Domain types
 * Frontend-only contracts designed to mirror future backend APIs.
 * ============================================================ */

export type AuctionStatus = "live" | "upcoming" | "ended" | "sold" | "cancelled";

export type ProductVerificationStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "ready_for_auction";

export interface Bid {
  id: string;
  auctionId: string;
  bidder: string;          // "User #4821" or "You"
  bidderId: string;
  amount: number;
  createdAt: number;       // epoch ms
  status: "accepted" | "rejected" | "pending";
  isYou?: boolean;
}

export interface Auction {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  images: string[];
  basePrice: number;
  currentBid: number;
  bidIncrement: number;
  bidCount: number;
  watcherCount: number;
  status: AuctionStatus;
  startsAt: number;        // epoch ms
  endsAt: number;          // epoch ms
  seller: { id: string; name: string; rating: number; verified: boolean };
  location: string;
  featured?: boolean;
  highlights?: string[];
  bidHistory: number[];    // recent accepted bid amounts (for sparkline)
  lotNumber?: string;
  estimateLow?: number;
  estimateHigh?: number;
  /** precomputed lowercase haystack for client-side search (server full-text later) */
  searchText: string;
}

export interface WalletAccount {
  id: string;
  type: "inr" | "usdt" | "upi" | "bank";
  label: string;
  subtitle: string;
  available: number;
  locked: number;
  currency: "INR" | "USDT";
  icon: string;
}

export type TxStatus = "completed" | "pending" | "failed";
export type TxType =
  | "deposit"
  | "withdrawal"
  | "bid_lock"
  | "bid_settlement"
  | "conversion"
  | "refund";

export interface Transaction {
  id: string;
  type: TxType;
  title: string;
  subtitle: string;
  amount: number;          // positive = credit, negative = debit
  currency: "INR" | "USDT";
  status: TxStatus;
  createdAt: number;
  method?: string;
}

export interface PaymentMethod {
  id: string;
  kind: "upi" | "bank" | "inr_wallet" | "crypto_wallet" | "usdt";
  label: string;
  detail: string;
  isDefault: boolean;
  verified: boolean;
}

export interface UserNotification {
  id: string;
  kind:
    | "reminder_triggered"
    | "auction_started"
    | "outbid"
    | "bid_accepted"
    | "bid_rejected"
    | "auction_won"
    | "wallet_updated"
    | "product_approved"
    | "product_rejected"
    | "system";
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  auctionId?: string;
}

export interface Reminder {
  id: string;
  auctionId: string;
  offsetMinutes: number;   // minutes before start
  createdAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  phone: string;
  joinedAt: number;
  kycVerified: boolean;
  avatarTone: string;      // gradient tone key
  stats: {
    auctionsParticipated: number;
    auctionsWon: number;
    totalBids: number;
    totalSpent: number;
  };
}

export interface ProductSubmission {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  basePrice: number;
  auctionDate: number;      // requested date
  capturedImage: string;    // dataURL from camera
  submittedAt: number;
  status: ProductVerificationStatus;
  adminNote?: string;
}

/* ---------- Realtime event model (mirrors future socket.io events) ---------- */

export type RealtimeEventName =
  | "AUCTION_STARTED"
  | "BID_RECEIVED"
  | "BID_ACCEPTED"
  | "BID_REJECTED"
  | "PRICE_UPDATED"
  | "AUCTION_EXTENDED"
  | "AUCTION_ENDED"
  | "WALLET_UPDATED"
  | "TRANSACTION_COMPLETED"
  | "PRODUCT_APPROVED"
  | "PRODUCT_REJECTED"
  | "REMINDER_TRIGGERED";

export interface BidEventPayload {
  auctionId: string;
  bid: Bid;
  newCurrentBid: number;
  extendedMs?: number;
}

export interface PriceUpdatePayload {
  auctionId: string;
  previous: number;
  current: number;
}

export interface SystemMetrics {
  requestsPerSec: number;
  activeConnections: number;
  avgLatencyMs: number;
  bidsPerSec: number;
  acceptedBids: number;
  rejectedBids: number;
  queueDepth: number;
  dbStatus: "operational";
  wsStatus: "operational";
  queueStatus: "operational";
  txVolumeINR: number;
  history: {
    rps: number[];
    latency: number[];
    bps: number[];
  };
}

/* ---------- API service contracts (future backend surface) ---------- */

export interface AuctionListFilters {
  status?: AuctionStatus | "all";
  category?: string;
  query?: string;
}

export interface ConvertQuote {
  fromAmount: number;
  rate: number;
  fee: number;
  estimatedINR: number;
}
