import type {
  Auction,
  PaymentMethod,
  Transaction,
  UserProfile,
  WalletAccount,
} from "./types";

/* ============================================================
 * VYRA — seed mock data
 * All timestamps are generated relative to `now` so the demo
 * always shows live countdowns. Swap with real API later.
 * ============================================================ */

export const CATEGORIES = [
  "Timepieces",
  "Sneakers",
  "Art",
  "Cameras",
  "Music",
  "Spirits",
  "Fashion",
  "Sculpture",
  "Jewellery",
  "Collectibles",
] as const;

export const SUGGESTED_SEARCHES = [
  "chronograph",
  "sneaker",
  "whisky",
  "diamond",
  "sculpture",
  "guitar",
];

interface SeedAuctionInput {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  image: string;
  basePrice: number;
  currentBid: number;
  bidIncrement: number;
  bidCount: number;
  watcherCount: number;
  status: Auction["status"];
  endsInMs?: number;
  startsInMs?: number;
  durationMs?: number;
  featured?: boolean;
  highlights?: string[];
  location: string;
  seller: Auction["seller"];
  lotNumber?: string;
  estimateLow?: number;
  estimateHigh?: number;
}

const SEEDS: SeedAuctionInput[] = [
  {
    id: "auc-chronograph",
    title: "Limited Edition Chronograph",
    description:
      "A tourbillon-grade chronograph from an Atelier run of only 88 pieces. Brushed titanium case, sapphire exhibition caseback and a hand-finished calibre with 72h power reserve. accompanied by its original certification.",
    category: "Timepieces",
    condition: "Mint — Unworn",
    image: "/products/p-watch-chronograph.png",
    basePrice: 5000,
    currentBid: 10000,
    bidIncrement: 500,
    bidCount: 247,
    watcherCount: 1290,
    status: "live",
    endsInMs: 34_000,
    featured: true,
    highlights: ["88 pieces worldwide", "Titanium case", "72h power reserve", "Certified authentic"],
    location: "Mumbai, IN",
    seller: { id: "u-101", name: "Helios Vault", rating: 4.9, verified: true },
    lotNumber: "VY-0088",
    estimateLow: 45000,
    estimateHigh: 65000,
  },
  {
    id: "auc-sneaker",
    title: "Nitro Stealth Runner — Prototype 01",
    description:
      "Factory prototype from a cancelled collaboration. Graphite knit upper with reactive cyan midsole. Size UK 9. One of one.",
    category: "Sneakers",
    condition: "New — Prototype",
    image: "/products/p-sneaker.png",
    basePrice: 12000,
    currentBid: 28500,
    bidIncrement: 500,
    bidCount: 132,
    watcherCount: 864,
    status: "live",
    endsInMs: 11 * 60_000 + 20_000,
    featured: true,
    location: "Bengaluru, IN",
    seller: { id: "u-202", name: "KicksArchive", rating: 4.8, verified: true },
    lotNumber: "VY-0121",
    estimateLow: 30000,
    estimateHigh: 46000,
  },
  {
    id: "auc-art",
    title: "Aurora Field No. 7 — Original Canvas",
    description:
      "Large-format acrylic on canvas from the Aurora Field series. Cyan and violet interference pigments over a deep charcoal ground. Signed verso.",
    category: "Art",
    condition: "Excellent",
    image: "/products/p-art.png",
    basePrice: 60000,
    currentBid: 118000,
    bidIncrement: 2000,
    bidCount: 89,
    watcherCount: 512,
    status: "live",
    endsInMs: 26 * 60_000,
    location: "New Delhi, IN",
    seller: { id: "u-303", name: "Meridian Fine Art", rating: 5.0, verified: true },
    lotNumber: "VY-0042",
    estimateLow: 130000,
    estimateHigh: 190000,
  },
  {
    id: "auc-ring",
    title: "2.1ct Fancy Blue Diamond Ring",
    description:
      "Fancy intense blue cushion-cut diamond, VS1 clarity, set in platinum with micro-pavé shoulders. GIA certified.",
    category: "Jewellery",
    condition: "New",
    image: "/products/p-ring.png",
    basePrice: 220000,
    currentBid: 465000,
    bidIncrement: 5000,
    bidCount: 64,
    watcherCount: 1300,
    status: "live",
    endsInMs: 47 * 60_000,
    featured: true,
    location: "Mumbai, IN",
    seller: { id: "u-404", name: "Aurum Estates", rating: 4.95, verified: true },
    lotNumber: "VY-0007",
    estimateLow: 520000,
    estimateHigh: 700000,
  },
  {
    id: "auc-camera",
    title: "Vintage Rangefinder Camera (1958)",
    description:
      "Fully serviced 35mm rangefinder with summarit lens. New seals, recent CLA, meter accurate. Collector grade.",
    category: "Cameras",
    condition: "Collector Grade",
    image: "/products/p-camera.png",
    basePrice: 35000,
    currentBid: 35000,
    bidIncrement: 1000,
    bidCount: 0,
    watcherCount: 290,
    status: "upcoming",
    startsInMs: 2 * 3600_000 + 31 * 60_000,
    durationMs: 45 * 60_000,
    location: "Chennai, IN",
    seller: { id: "u-505", name: "Analogue House", rating: 4.7, verified: true },
    lotNumber: "VY-0155",
    estimateLow: 48000,
    estimateHigh: 72000,
  },
  {
    id: "auc-guitar",
    title: "Signed Stage-Used Electric Guitar",
    description:
      "Played on the final night of the Neon Circuit tour and signed onstage. Includes tour-used case and provenance letter.",
    category: "Music",
    condition: "Stage-Used",
    image: "/products/p-guitar.png",
    basePrice: 80000,
    currentBid: 80000,
    bidIncrement: 2500,
    bidCount: 0,
    watcherCount: 433,
    status: "upcoming",
    startsInMs: 5 * 3600_000 + 10 * 60_000,
    durationMs: 60 * 60_000,
    location: "Pune, IN",
    seller: { id: "u-606", name: "Backline Vault", rating: 4.9, verified: true },
    lotNumber: "VY-0201",
    estimateLow: 110000,
    estimateHigh: 160000,
  },
  {
    id: "auc-whisky",
    title: "Rare Single Malt — 30 Year Release",
    description:
      "One of 500 bottles from a closed distillery. Original wooden case, hang tag and duty seal intact.",
    category: "Spirits",
    condition: "Sealed",
    image: "/products/p-whisky.png",
    basePrice: 95000,
    currentBid: 95000,
    bidIncrement: 2500,
    bidCount: 0,
    watcherCount: 387,
    status: "upcoming",
    startsInMs: 27 * 3600_000,
    durationMs: 90 * 60_000,
    location: "Goa, IN",
    seller: { id: "u-707", name: "Cask & Barrel Co.", rating: 4.85, verified: true },
    lotNumber: "VY-0233",
    estimateLow: 140000,
    estimateHigh: 210000,
  },
  {
    id: "auc-handbag",
    title: "Couture Leather Handbag — Noir",
    description:
      "Hand-strolled box calf leather with brushed gold hardware. Includes dust bag, box and boutique receipt.",
    category: "Fashion",
    condition: "Excellent — With Box",
    image: "/products/p-handbag.png",
    basePrice: 150000,
    currentBid: 236000,
    bidIncrement: 2500,
    bidCount: 71,
    watcherCount: 640,
    status: "live",
    endsInMs: 18 * 60_000 + 40_000,
    location: "Mumbai, IN",
    seller: { id: "u-808", name: "Maison Privée", rating: 4.9, verified: true },
    lotNumber: "VY-0188",
    estimateLow: 260000,
    estimateHigh: 340000,
  },
  {
    id: "auc-sculpture",
    title: "Bronze Flow Study — Edition 3/8",
    description:
      "Lost-wax cast bronze with hot patina on black marble plinth. Foundry stamped and numbered.",
    category: "Sculpture",
    condition: "Excellent",
    image: "/products/p-sculpture.png",
    basePrice: 70000,
    currentBid: 70000,
    bidIncrement: 2000,
    bidCount: 0,
    watcherCount: 221,
    status: "upcoming",
    startsInMs: 3 * 86400_000 + 4 * 3600_000,
    durationMs: 2 * 3600_000,
    location: "Kolkata, IN",
    seller: { id: "u-909", name: "Foundry Nine", rating: 4.8, verified: true },
    lotNumber: "VY-0301",
    estimateLow: 95000,
    estimateHigh: 140000,
  },
  {
    id: "auc-robot",
    title: "Collector Robot Figurine — Chromium",
    description:
      "Designer art-toy figure, matte black over chrome with UV visor. Numbered 214/500 with display case.",
    category: "Collectibles",
    condition: "New — Numbered",
    image: "/products/p-robot.png",
    basePrice: 18000,
    currentBid: 34000,
    bidIncrement: 500,
    bidCount: 118,
    watcherCount: 495,
    status: "live",
    endsInMs: 7 * 60_000 + 15_000,
    location: "Hyderabad, IN",
    seller: { id: "u-110", name: "Vertex Toys", rating: 4.75, verified: true },
    lotNumber: "VY-0277",
    estimateLow: 38000,
    estimateHigh: 55000,
  },
  {
    id: "auc-art-2",
    title: "Chromatic Drift — Diptych",
    description:
      "Paired canvases from a private collection. Sold to the highest bidder at last night's close.",
    category: "Art",
    condition: "Excellent",
    image: "/products/p-art.png",
    basePrice: 50000,
    currentBid: 96500,
    bidIncrement: 1000,
    bidCount: 143,
    watcherCount: 300,
    status: "sold",
    startsInMs: -26 * 3600_000,
    endsInMs: -24 * 3600_000,
    location: "New Delhi, IN",
    seller: { id: "u-303", name: "Meridian Fine Art", rating: 5.0, verified: true },
    lotNumber: "VY-0011",
    estimateLow: 90000,
    estimateHigh: 120000,
  },
  {
    id: "auc-sneaker-2",
    title: "Court Classic — Sample Pair",
    description:
      "Unreleased colourway sample. Auction closed below reserve and was cancelled by the consignor.",
    category: "Sneakers",
    condition: "New — Sample",
    image: "/products/p-sneaker.png",
    basePrice: 9000,
    currentBid: 8700,
    bidIncrement: 500,
    bidCount: 42,
    watcherCount: 190,
    status: "ended",
    startsInMs: -49 * 3600_000,
    endsInMs: -47 * 3600_000,
    location: "Bengaluru, IN",
    seller: { id: "u-202", name: "KicksArchive", rating: 4.8, verified: true },
    lotNumber: "VY-0099",
    estimateLow: 12000,
    estimateHigh: 18000,
  },
];

const CATEGORY_KEYWORDS: Record<string, string> = {
  Timepieces: "watch timepiece chronograph wristwatch",
  Sneakers: "sneaker shoe kicks runner trainer",
  Art: "painting canvas art print",
  Cameras: "camera film rangefinder photography",
  Music: "guitar music signed stage",
  Spirits: "whisky whiskey bottle malt cask dram",
  Fashion: "handbag bag couture purse",
  Sculpture: "sculpture bronze statue cast",
  Jewellery: "ring diamond jewellery jewelry gemstone",
  Collectibles: "robot figure toy collectible figurine",
};

export function buildSeedAuctions(now = Date.now()): Auction[] {
  return SEEDS.map((s) => ({
    id: s.id,
    slug: s.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    title: s.title,
    description: s.description,
    category: s.category,
    condition: s.condition,
    images: [s.image],
    basePrice: s.basePrice,
    currentBid: s.currentBid,
    bidIncrement: s.bidIncrement,
    bidCount: s.bidCount,
    watcherCount: s.watcherCount,
    status: s.status,
    startsAt: s.startsInMs != null ? now + s.startsInMs : now + (s.endsInMs ?? 0) - (s.durationMs ?? 3600_000),
    endsAt: s.endsInMs != null ? now + s.endsInMs : now + (s.startsInMs ?? 0) + (s.durationMs ?? 3600_000),
    seller: s.seller,
    location: s.location,
    featured: s.featured,
    highlights: s.highlights,
    bidHistory: s.bidCount > 0 ? buildBidHistory(s.basePrice, s.currentBid, s.bidCount) : [],
    lotNumber: s.lotNumber,
    estimateLow: s.estimateLow,
    estimateHigh: s.estimateHigh,
    searchText: [
      s.title, s.category, s.condition, s.location, s.seller.name, s.description, s.lotNumber,
      CATEGORY_KEYWORDS[s.category] ?? "",
    ].join(" ").toLowerCase(),
  }));
}

function buildBidHistory(base: number, current: number, count: number): number[] {
  const points = 18;
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const eased = Math.pow(t, 1.6);
    const noise = 1 + (Math.sin(i * 2.7 + base) * 0.012);
    out.push(Math.round((base + (current - base) * eased) * noise));
  }
  out[points - 1] = current;
  return out;
}

/* ---------------- user / wallet / tx seeds ---------------- */

export const SEED_USER: UserProfile = {
  id: "u-you",
  name: "Aarav Mehta",
  handle: "@aarav.bids",
  email: "aarav.m@vyra.example",
  phone: "+91 ••••• 48210",
  joinedAt: Date.now() - 212 * 86400_000,
  kycVerified: true,
  avatarTone: "cyan",
  stats: {
    auctionsParticipated: 34,
    auctionsWon: 7,
    totalBids: 412,
    totalSpent: 682500,
  },
};

export function buildSeedWallets(): WalletAccount[] {
  return [
    {
      id: "w-inr",
      type: "inr",
      label: "INR Wallet",
      subtitle: "Primary bidding balance",
      available: 124500,
      locked: 15000,
      currency: "INR",
      icon: "wallet",
    },
    {
      id: "w-usdt",
      type: "usdt",
      label: "Crypto Wallet",
      subtitle: "USDT · Tether",
      available: 320,
      locked: 0,
      currency: "USDT",
      icon: "coins",
    },
    {
      id: "w-upi",
      type: "upi",
      label: "UPI",
      subtitle: "aarav@okvyra",
      available: 0,
      locked: 0,
      currency: "INR",
      icon: "smartphone",
    },
    {
      id: "w-bank",
      type: "bank",
      label: "Bank Transfer",
      subtitle: "HDFC ••4821",
      available: 0,
      locked: 0,
      currency: "INR",
      icon: "landmark",
    },
  ];
}

export function buildSeedTransactions(now = Date.now()): Transaction[] {
  return [
    {
      id: "tx-901",
      type: "bid_settlement",
      title: "Auction settlement — Chromatic Drift",
      subtitle: "Won lot VY-0011",
      amount: -96500,
      currency: "INR",
      status: "completed",
      createdAt: now - 22 * 3600_000,
      method: "INR Wallet",
    },
    {
      id: "tx-902",
      type: "conversion",
      title: "Converted 150 USDT → INR",
      subtitle: "Rate ₹83.00 · fee 0.5%",
      amount: 12450,
      currency: "INR",
      status: "completed",
      createdAt: now - 26 * 3600_000,
      method: "USDT → INR Wallet",
    },
    {
      id: "tx-903",
      type: "deposit",
      title: "UPI top-up",
      subtitle: "aarav@okvyra",
      amount: 50000,
      currency: "INR",
      status: "completed",
      createdAt: now - 30 * 3600_000,
      method: "UPI",
    },
    {
      id: "tx-904",
      type: "bid_lock",
      title: "Funds locked — Nitro Stealth Runner",
      subtitle: "Active bid security",
      amount: -15000,
      currency: "INR",
      status: "pending",
      createdAt: now - 2 * 3600_000,
      method: "INR Wallet",
    },
    {
      id: "tx-905",
      type: "deposit",
      title: "Bank transfer top-up",
      subtitle: "NEFT ••4821",
      amount: 25000,
      currency: "INR",
      status: "pending",
      createdAt: now - 40 * 60_000,
      method: "Bank Transfer",
    },
    {
      id: "tx-906",
      type: "withdrawal",
      title: "Withdrawal to bank",
      subtitle: "Returned unused bid lock",
      amount: -8000,
      currency: "INR",
      status: "failed",
      createdAt: now - 3 * 86400_000,
      method: "Bank Transfer",
    },
  ];
}

export function buildSeedPaymentMethods(): PaymentMethod[] {
  return [
    { id: "pm-1", kind: "upi", label: "UPI", detail: "aarav@okvyra", isDefault: true, verified: true },
    { id: "pm-2", kind: "bank", label: "HDFC Bank", detail: "Savings ••4821", isDefault: false, verified: true },
    { id: "pm-3", kind: "inr_wallet", label: "INR Wallet", detail: "Primary bidding balance", isDefault: false, verified: true },
    { id: "pm-4", kind: "crypto_wallet", label: "Crypto Wallet", detail: "USDT · TRC-20", isDefault: false, verified: true },
    { id: "pm-5", kind: "usdt", label: "USDT Card", detail: "Virtual · ••7788", isDefault: false, verified: false },
  ];
}

export const RIVAL_NAMES = [
  "User #4821", "User #7319", "User #1042", "User #9988", "User #2043",
  "User #6634", "User #3917", "User #8125", "User #5561", "User #1177",
  "User #9034", "User #2468",
];

export const USDT_RATE_BASE = 83.0;
