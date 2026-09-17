"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Gavel,
  LayoutDashboard,
  MessageSquareWarning,
  Radio,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Sparkline } from "@/components/shared/Sparkline";
import { useAdmin } from "@/hooks/use-vyra";
import { useAuctionList, useNow } from "@/hooks/use-vyra";
import { useProductsStore } from "@/store/products";
import { useWalletStore } from "@/store/wallet";
import type { ProductSubmission } from "@/lib/types";
import { formatDateTime, formatDHM, formatINR, formatNum, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Tab = "overview" | "verification" | "auctions" | "users" | "transactions" | "health";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "verification", label: "Product verification", icon: ClipboardCheck },
  { key: "auctions", label: "Live auctions", icon: Gavel },
  { key: "users", label: "Users", icon: Users },
  { key: "transactions", label: "Transactions", icon: Wallet },
  { key: "health", label: "System health", icon: Activity },
];

const STATUS_CHIP: Record<ProductSubmission["status"], { label: string; cls: string }> = {
  pending_review: { label: "PENDING REVIEW", cls: "text-amber-300 border-amber-300/30 bg-amber-300/10" },
  approved: { label: "APPROVED", cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  ready_for_auction: { label: "READY FOR AUCTION", cls: "text-cyan-300 border-cyan-300/30 bg-cyan-300/10" },
  rejected: { label: "REJECTED", cls: "text-rose-300 border-rose-400/30 bg-rose-400/10" },
  changes_requested: { label: "CHANGES REQUESTED", cls: "text-violet-300 border-violet-400/30 bg-violet-400/10" },
};

export function AdminView() {
  const [tab, setTab] = useState<Tab>("overview");
  const { submissions, metrics } = useAdmin();
  const auctions = useAuctionList();
  const transactions = useWalletStore((s) => s.transactions);
  const now = useNow();

  const pending = submissions.filter((s) => s.status === "pending_review");
  const liveAuctions = auctions.filter((a) => a.status === "live");

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-28 sm:px-6 lg:pt-32">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-violet-300/90">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin console
          </p>
          <h1 className="font-display mt-2.5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Operations control
          </h1>
        </div>
        <div className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="ping-ring text-emerald-400 absolute inset-0 rounded-full opacity-60" />
            <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300/90">All systems operational</span>
        </div>
      </motion.div>

      {/* tabs */}
      <div className="no-scrollbar mt-8 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all",
              tab === t.key
                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/85"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.key === "verification" && pending.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-black">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-6"
        >
          {/* ---------- OVERVIEW ---------- */}
          {tab === "overview" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Active auctions" value={String(liveAuctions.length)} sub={`${auctions.filter((a) => a.status === "upcoming").length} upcoming`} icon={Gavel} tone="cyan" />
                <Metric label="Live bidders" value={formatNum(metrics.activeConnections)} sub="concurrent sockets" icon={Radio} tone="violet" spark={metrics.history.rps.slice(-20)} />
                <Metric label="Bids / second" value={metrics.bidsPerSec.toFixed(1)} sub={`${formatNum(metrics.acceptedBids)} accepted today`} icon={Activity} tone="emerald" spark={metrics.history.bps.slice(-20)} />
                <Metric label="Avg bid latency" value={`${metrics.avgLatencyMs.toFixed(1)}ms`} sub="p99 · 38ms" icon={Clock3} tone="amber" spark={metrics.history.latency.slice(-20)} />
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <Metric label="Successful bids" value={formatNum(metrics.acceptedBids)} sub="lifetime" icon={CheckCircle2} tone="emerald" />
                <Metric label="Rejected bids" value={formatNum(metrics.rejectedBids)} sub="validation failures" icon={Ban} tone="red" />
                <Metric label="Transaction volume" value={formatINR(metrics.txVolumeINR)} sub="rolling 24h" icon={Wallet} tone="cyan" />
              </div>

              {/* verification preview */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display flex items-center gap-2 text-base font-semibold text-white">
                    <ClipboardCheck className="h-4 w-4 text-amber-300" /> Verification queue
                  </h3>
                  <button onClick={() => setTab("verification")} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                    Open queue →
                  </button>
                </div>
                {pending.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/35">
                    Queue is clear — no products awaiting review.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    {pending.slice(0, 3).map((s) => (
                      <VerificationRow key={s.id} sub={s} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------- VERIFICATION ---------- */}
          {tab === "verification" && (
            <div className="space-y-4">
              {submissions.length === 0 && (
                <div className="glass rounded-2xl px-6 py-16 text-center">
                  <p className="font-display text-lg text-white/70">No submissions yet</p>
                  <p className="mt-2 text-sm text-white/40">
                    Products submitted by sellers appear here for verification.
                  </p>
                </div>
              )}
              {submissions.map((s) => (
                <VerificationCard key={s.id} sub={s} />
              ))}
            </div>
          )}

          {/* ---------- LIVE AUCTIONS ---------- */}
          {tab === "auctions" && (
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.18em] text-white/35">
                    <th className="px-5 py-4 font-semibold">Lot</th>
                    <th className="hidden px-5 py-4 font-semibold sm:table-cell">Status</th>
                    <th className="px-5 py-4 font-semibold">Current bid</th>
                    <th className="hidden px-5 py-4 font-semibold md:table-cell">Bids</th>
                    <th className="px-5 py-4 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.slice(0, 10).map((a) => (
                    <tr key={a.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-white/90">{a.title}</p>
                        <p className="font-num text-[11px] text-white/35">{a.lotNumber}</p>
                      </td>
                      <td className="hidden px-5 py-3.5 sm:table-cell">
                        <span className={cn("rounded-full border px-2 py-1 text-[9px] font-bold tracking-wider",
                          a.status === "live" ? "border-rose-400/30 bg-rose-400/10 text-rose-300" : a.status === "upcoming" ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-300" : "border-white/10 text-white/40")}>
                          {a.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-num px-5 py-3.5 text-white/85">{formatINR(a.currentBid)}</td>
                      <td className="font-num hidden px-5 py-3.5 text-white/60 md:table-cell">{a.bidCount}</td>
                      <td className="font-num px-5 py-3.5 text-white/60">
                        {a.status === "live" ? formatDHM(Math.max(0, a.endsAt - now)) : a.status === "upcoming" ? `in ${formatDHM(Math.max(0, a.startsAt - now))}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---------- USERS ---------- */}
          {tab === "users" && (
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.18em] text-white/35">
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">KYC</th>
                    <th className="hidden px-5 py-4 font-semibold sm:table-cell">Bids</th>
                    <th className="px-5 py-4 font-semibold">Total spent</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Aarav Mehta", "@aarav.bids", true, 412, 682500],
                    ["Diya Kapoor", "@diya.k", true, 318, 451200],
                    ["Kabir Rao", "@kabir.r", true, 240, 388900],
                    ["Ishita Sen", "@ishita.s", false, 96, 121400],
                    ["Rohan Verma", "@rohan.v", true, 187, 275600],
                  ].map(([name, handle, kyc, bids, spent]) => (
                    <tr key={String(handle)} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-white/90">{name}</p>
                        <p className="font-num text-[11px] text-white/35">{handle}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {kyc ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>
                        ) : (
                          <span className="text-amber-300">Pending</span>
                        )}
                      </td>
                      <td className="font-num hidden px-5 py-3.5 text-white/60 sm:table-cell">{formatNum(Number(bids))}</td>
                      <td className="font-num px-5 py-3.5 text-white/85">{formatINR(Number(spent))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---------- TRANSACTIONS ---------- */}
          {tab === "transactions" && (
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.18em] text-white/35">
                    <th className="px-5 py-4 font-semibold">Transaction</th>
                    <th className="hidden px-5 py-4 font-semibold sm:table-cell">Method</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-white/90">{t.title}</p>
                        <p className="font-num text-[11px] text-white/35">{formatDateTime(t.createdAt)}</p>
                      </td>
                      <td className="hidden px-5 py-3.5 text-white/55 sm:table-cell">{t.method}</td>
                      <td className={cn("font-num px-5 py-3.5 font-semibold", t.amount >= 0 ? "text-emerald-300" : "text-white/85")}>
                        {t.amount >= 0 ? "+" : "−"}₹{Math.abs(t.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("rounded-full border px-2 py-1 text-[9px] font-bold tracking-wider",
                          t.status === "completed" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : t.status === "pending" ? "border-amber-300/30 bg-amber-300/10 text-amber-300" : "border-rose-400/30 bg-rose-400/10 text-rose-300")}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ---------- SYSTEM HEALTH ---------- */}
          {tab === "health" && (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <HealthCard title="Requests / sec" data={metrics.history.rps} stroke="var(--vyra-cyan)" value={formatNum(metrics.requestsPerSec)} status="operational" />
                <HealthCard title="Bid latency (ms)" data={metrics.history.latency} stroke="var(--vyra-amber)" value={`${metrics.avgLatencyMs.toFixed(1)}ms`} status="operational" />
                <HealthCard title="Bids / sec" data={metrics.history.bps} stroke="var(--vyra-green)" value={metrics.bidsPerSec.toFixed(1)} status="operational" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <HealthTile icon={Radio} label="WebSocket" value={`${formatNum(metrics.activeConnections)} sockets`} ok />
                <HealthTile icon={Activity} label="Queue" value={`depth ${metrics.queueDepth}`} ok />
                <HealthTile icon={CheckCircle2} label="Accepted bids" value={formatNum(metrics.acceptedBids)} ok />
                <HealthTile icon={Ban} label="Rejected bids" value={formatNum(metrics.rejectedBids)} ok />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------------- pieces ---------------- */

const TONES = {
  cyan: "border-cyan-300/25 bg-cyan-300/[0.07] text-cyan-200",
  violet: "border-violet-400/25 bg-violet-400/[0.07] text-violet-200",
  emerald: "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200",
  amber: "border-amber-300/25 bg-amber-300/[0.07] text-amber-200",
  red: "border-rose-400/25 bg-rose-400/[0.07] text-rose-200",
} as const;

function Metric({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  spark,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof TONES;
  spark?: number[];
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", TONES[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="font-num mt-2 text-2xl font-semibold text-white/95">{value}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-[11px] text-white/35">{sub}</p>
        {spark && spark.length > 1 && <Sparkline data={spark} width={90} height={26} stroke="currentColor" className="text-cyan-300/70" fill={false} />}
      </div>
    </div>
  );
}

function HealthCard({ title, data, stroke, value, status }: { title: string; data: number[]; stroke: string; value: string; status: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">{title}</p>
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </div>
      <p className="font-num mt-2 text-2xl font-semibold text-white/95">{value}</p>
      <Sparkline data={data} width={260} height={52} stroke={stroke} className="mt-3 w-full" />
      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-emerald-300/70">{status}</p>
    </div>
  );
}

function HealthTile({ icon: Icon, label, value, ok }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; ok: boolean }) {
  return (
    <div className="glass flex items-center gap-3.5 rounded-2xl p-4">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", ok ? TONES.emerald : TONES.amber)}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{label}</p>
        <p className="font-num text-sm font-semibold text-white/90">{value}</p>
      </div>
      <span className={cn("live-dot ml-auto h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-400" : "bg-amber-400")} />
    </div>
  );
}

function VerificationRow({ sub }: { sub: ProductSubmission }) {
  const approve = useProductsStore((s) => s.approve);
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
      { }
      <img src={sub.capturedImage} alt={sub.title} className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/90">{sub.title}</p>
        <p className="font-num text-[11px] text-white/35">{sub.sellerName} · {timeAgo(sub.submittedAt)}</p>
      </div>
      <button
        onClick={() => {
          approve(sub.id);
          toast.success("Product approved", { description: `${sub.title} is now READY FOR AUCTION` });
        }}
        className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-400/20"
      >
        Approve
      </button>
    </div>
  );
}

function VerificationCard({ sub }: { sub: ProductSubmission }) {
  const approve = useProductsStore((s) => s.approve);
  const reject = useProductsStore((s) => s.reject);
  const requestChanges = useProductsStore((s) => s.requestChanges);
  const [note, setNote] = useState("");
  const chip = STATUS_CHIP[sub.status];
  const decided = sub.status !== "pending_review";

  return (
    <motion.div layout className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        { }
        <img src={sub.capturedImage} alt={sub.title} className="h-44 w-44 shrink-0 rounded-2xl border border-white/12 object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.14em]", chip.cls)}>{chip.label}</span>
            <span className="font-num text-[11px] text-white/35">Submitted {formatDateTime(sub.submittedAt)}</span>
          </div>
          <h3 className="font-display mt-3 text-lg font-semibold text-white">{sub.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/50">{sub.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Seller", sub.sellerName],
              ["Category", `${sub.category}`],
              ["Base price", formatINR(sub.basePrice)],
              ["Requested date", formatDateTime(sub.auctionDate)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">{k}</p>
                <p className="font-num mt-0.5 truncate text-[12px] text-white/85">{v}</p>
              </div>
            ))}
          </div>

          {!decided ? (
            <div className="mt-5">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note to the seller (required for reject / changes)"
                className="vyra-input !py-2.5 !text-[13px]"
              />
              <div className="mt-3 flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    approve(sub.id);
                    toast.success("Approved — READY FOR AUCTION", { description: sub.title });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-black transition-transform hover:scale-[1.03]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  onClick={() => {
                    requestChanges(sub.id, note || "Please retake the verification photo with better lighting.");
                    toast("Changes requested", { description: sub.title });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-400/10 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-violet-200 hover:bg-violet-400/20"
                >
                  <MessageSquareWarning className="h-3.5 w-3.5" /> Request changes
                </button>
                <button
                  onClick={() => {
                    reject(sub.id, note || "Listing does not meet verification standards.");
                    toast.error("Listing rejected", { description: sub.title });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-400/10 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-rose-200 hover:bg-rose-400/20"
                >
                  <Ban className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          ) : (
            sub.adminNote && (
              <p className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs text-white/50">
                <span className="font-semibold text-white/70">Review note:</span> {sub.adminNote}
              </p>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
