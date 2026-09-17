"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Coins,
  Info,
  Landmark,
  Lock,
  Plus,
  ShieldCheck,
  Smartphone,
  Star,
  Trash2,
  Wallet as WalletIcon,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { walletApi } from "@/services/api";
import { useWallet } from "@/hooks/use-vyra";
import { useWalletStore } from "@/store/wallet";
import { timeAgo } from "@/lib/format";
import type { ConvertQuote, PaymentMethod, TxStatus } from "@/lib/types";
import { useNow } from "@/hooks/use-vyra";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const ICONS = {
  wallet: WalletIcon,
  coins: Coins,
  smartphone: Smartphone,
  landmark: Landmark,
} as const;

const STATUS_STYLE: Record<TxStatus, string> = {
  completed: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
  pending: "text-amber-300 bg-amber-300/10 border-amber-300/25",
  failed: "text-rose-300 bg-rose-400/10 border-rose-400/25",
};

export function WalletView() {
  const { accounts, transactions, paymentMethods, converting, inr, usdt, availableForBidding } = useWallet();
  const convertUsdToInr = useWalletStore((s) => s.convertUsdToInr);
  const topUp = useWalletStore((s) => s.topUp);
  const setDefault = useWalletStore((s) => s.setDefaultPaymentMethod);
  const remove = useWalletStore((s) => s.removePaymentMethod);
  const now = useNow();

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 lg:pt-36">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/80">Wallet</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Funds & settlement
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-[oklch(0.62_0.01_260)]">
          One balance for bidding, one for crypto. INR Wallet funds are available the moment a
          room opens.
        </p>
      </motion.div>

      {/* balance cards */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {accounts.map((a, i) => {
          const Icon = ICONS[a.icon as keyof typeof ICONS] ?? WalletIcon;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE, delay: i * 0.07 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-colors",
                a.type === "inr"
                  ? "border-cyan-300/25 bg-gradient-to-br from-cyan-300/[0.09] to-transparent"
                  : a.type === "usdt"
                    ? "border-emerald-300/20 bg-gradient-to-br from-emerald-300/[0.07] to-transparent"
                    : "border-white/8 bg-white/[0.025]"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border",
                  a.type === "inr" ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
                    : a.type === "usdt" ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                    : "border-white/10 bg-white/[0.05] text-white/70"
                )}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="font-num text-[10px] uppercase tracking-widest text-white/30">{a.currency}</span>
              </div>
              <p className="mt-4 text-xs font-semibold text-white/60">{a.label}</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <AnimatedNumber
                  value={a.available}
                  currency={a.currency === "INR"}
                  className="text-2xl font-semibold text-white/95"
                />
                {a.currency === "USDT" && <span className="text-sm text-white/45">USDT</span>}
              </div>
              {a.type === "inr" ? (
                <div className="mt-3 space-y-1 border-t border-white/8 pt-3 text-[11px]">
                  <p className="flex items-center justify-between text-white/40">
                    <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span>
                    <span className="font-num text-white/70">₹{a.locked.toLocaleString("en-IN")}</span>
                  </p>
                  <p className="flex items-center justify-between text-cyan-200/80">
                    <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" /> Ready to bid</span>
                    <span className="font-num font-semibold">{formatReady(availableForBidding)}</span>
                  </p>
                </div>
              ) : a.type === "usdt" ? (
                <p className="mt-3 border-t border-white/8 pt-3 text-[11px] text-white/40">
                  ≈ {formatReady((inr ? 0 : 0) + Math.round(a.available * 83))} INR value
                </p>
              ) : (
                <p className="mt-3 border-t border-white/8 pt-3 text-[11px] text-white/35">{a.subtitle}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* ---------- converter ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          className="glass rounded-[1.5rem] p-6"
          aria-label="USDT to INR converter"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display flex items-center gap-2.5 text-lg font-semibold text-white">
              <ArrowLeftRight className="h-4.5 w-4.5 text-emerald-300" />
              Convert USDT → INR
            </h2>
            <span className="font-num rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/60">
              1 USDT ≈ ₹83.0
            </span>
          </div>

          <ConverterForm usdtBalance={usdt?.available ?? 0} converting={converting} onConvert={convertUsdToInr} />

          {/* funds readiness */}
          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4.5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
              <Info className="h-3.5 w-3.5" /> Keep funds ready before the auction begins
            </p>
            <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-white/55">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                Wallet funds can be used immediately — bids land with zero processing delay.
              </li>
              <li className="flex gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/80" />
                UPI and bank transfers may take additional processing time before they are usable.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                If funds are not available when a bid is submitted, the transaction may fail or the bid may be rejected.
              </li>
            </ul>
          </div>

          {/* quick top-up */}
          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Quick top-up</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[5000, 10000, 25000].map((v) => (
                <button
                  key={v}
                  onClick={async () => {
                    await topUp(v, "UPI");
                    toast.success(`Top-up of ₹${v.toLocaleString("en-IN")} initiated`, { description: "UPI · usually instant" });
                  }}
                  className="font-num rounded-lg border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 transition-all hover:border-emerald-300/40 hover:text-emerald-200"
                >
                  +₹{v.toLocaleString("en-IN")}
                </button>
              ))}
              <button
                onClick={async () => {
                  await topUp(20000, "Bank Transfer");
                  toast("Bank transfer initiated", { description: "NEFT transfers settle in 30–120 min" });
                }}
                className="rounded-lg border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 transition-all hover:border-cyan-300/40 hover:text-cyan-200"
              >
                <Plus className="mr-1 inline h-3 w-3" /> Bank NEFT
              </button>
            </div>
          </div>
        </motion.section>

        {/* ---------- transactions ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.22 }}
          className="glass rounded-[1.5rem] p-6"
          aria-label="Recent transactions"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Recent transactions</h2>
            <span className="font-num text-[11px] text-white/35">{transactions.length} records</span>
          </div>

          <div className="thin-scroll mt-4 max-h-[430px] space-y-2 overflow-y-auto pr-1">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3.5 rounded-xl border border-white/6 bg-white/[0.03] px-4 py-3">
                <span className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                  t.amount >= 0 ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.05] text-white/60"
                )}>
                  {t.amount >= 0 ? <ArrowDown className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white/90">{t.title}</p>
                  <p className="font-num truncate text-[10.5px] text-white/35">
                    {t.subtitle} · {timeAgo(t.createdAt, now)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("font-num text-[13px] font-semibold", t.amount >= 0 ? "text-emerald-300" : "text-white/85")}>
                    {t.amount >= 0 ? "+" : "−"}{t.currency === "INR" ? "₹" : ""}{Math.abs(t.amount).toLocaleString("en-IN")}{t.currency === "USDT" ? " USDT" : ""}
                  </p>
                  <span className={cn("mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider", STATUS_STYLE[t.status])}>
                    {t.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* ---------- payment methods ---------- */}
      <motion.section
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.28 }}
        className="mt-6"
        aria-label="Payment methods"
      >
        <div className="glass rounded-[1.5rem] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Payment methods</h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-white/40">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300/80" /> Managed & encrypted by your provider
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paymentMethods.map((pm: PaymentMethod) => (
              <div
                key={pm.id}
                className={cn(
                  "group flex items-center gap-3.5 rounded-2xl border p-4 transition-colors",
                  pm.isDefault ? "border-cyan-300/30 bg-cyan-300/[0.06]" : "border-white/8 bg-white/[0.025] hover:border-white/18"
                )}
              >
                <PaymentIcon kind={pm.kind} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white/90">
                    {pm.label}
                    {pm.isDefault && <Star className="h-3 w-3 fill-cyan-300 text-cyan-300" />}
                  </p>
                  <p className="truncate text-[11px] text-white/40">{pm.detail}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                  {!pm.isDefault && (
                    <button
                      onClick={() => {
                        setDefault(pm.id);
                        toast.success(`${pm.label} set as default`);
                      }}
                      className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold text-white/60 hover:text-cyan-200"
                      aria-label={`Set ${pm.label} as default`}
                    >
                      Default
                    </button>
                  )}
                  {!pm.isDefault && (
                    <button
                      onClick={() => {
                        remove(pm.id);
                        toast(`${pm.label} removed`);
                      }}
                      className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:border-rose-400/40 hover:text-rose-300"
                      aria-label={`Remove ${pm.label}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function formatReady(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function PaymentIcon({ kind }: { kind: PaymentMethod["kind"] }) {
  const map = {
    upi: Smartphone,
    bank: Landmark,
    inr_wallet: WalletIcon,
    crypto_wallet: Coins,
    usdt: Banknote,
  } as const;
  const Icon = map[kind];
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-cyan-200/90">
      <Icon className="h-4.5 w-4.5" />
    </span>
  );
}

/* ---------------- converter form ---------------- */

function ConverterForm({
  usdtBalance,
  converting,
  onConvert,
}: {
  usdtBalance: number;
  converting: boolean;
  onConvert: (n: number) => Promise<{ ok: boolean; inrCredited?: number; error?: string }>;
}) {
  const [amount, setAmount] = useState("100");
  const [quote, setQuote] = useState<ConvertQuote | null>(null);
  const n = parseFloat(amount) || 0;

  useEffect(() => {
    let live = true;
    const t = setTimeout(async () => {
      const q = await walletApi.quote(n);
      if (live) setQuote(q);
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [n]);

  return (
    <div className="mt-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="usdt-amt" className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            You convert
          </label>
          <button
            onClick={() => setAmount(String(usdtBalance))}
            className="font-num text-[10px] font-semibold text-cyan-300/90 hover:text-cyan-200"
          >
            MAX {usdtBalance} USDT
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <Coins className="h-5 w-5 text-emerald-300" />
          <input
            id="usdt-amt"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className="font-num w-full bg-transparent text-2xl font-semibold tabular text-white outline-none"
            placeholder="0"
          />
          <span className="font-num text-sm text-white/40">USDT</span>
        </div>
      </div>

      <div className="relative my-2 flex justify-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-[oklch(0.16_0.014_285/0.9)] text-cyan-300">
          <ArrowDown className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">You receive</p>
        <div className="mt-2 flex items-center justify-between">
          <AnimatedNumber
            value={quote?.estimatedINR ?? Math.round(n * 83)}
            className="text-2xl font-semibold text-emerald-200"
          />
          <span className="font-num text-sm text-white/40">INR</span>
        </div>
      </div>

      <div className="mt-3.5 space-y-1.5 text-[11px] text-white/45">
        <p className="flex justify-between">
          <span>Current conversion rate</span>
          <span className="font-num text-white/75">1 USDT = ₹{(quote?.rate ?? 83).toFixed(2)}</span>
        </p>
        <p className="flex justify-between">
          <span>Estimated amount</span>
          <span className="font-num text-white/75">₹{(quote?.estimatedINR ?? 0).toLocaleString("en-IN")}</span>
        </p>
        <p className="flex justify-between">
          <span>Conversion fee (0.5%)</span>
          <span className="font-num text-white/75">₹{(quote?.fee ?? 0).toLocaleString("en-IN")}</span>
        </p>
      </div>

      <button
        disabled={converting || n <= 0 || n > usdtBalance}
        onClick={async () => {
          const res = await onConvert(n);
          if (res.ok) {
            toast.success(`Converted ${n} USDT → ₹${res.inrCredited?.toLocaleString("en-IN")}`, {
              description: "INR Wallet credited — ready for bidding",
            });
          } else {
            toast.error("Conversion failed", { description: res.error });
          }
        }}
        className={cn(
          "btn-shimmer mt-4 w-full rounded-xl py-3.5 text-[12px] font-bold uppercase tracking-[0.18em] transition-all",
          converting
            ? "cursor-wait bg-white/10 text-white/50"
            : "bg-gradient-to-r from-emerald-300 to-emerald-400 text-[oklch(0.13_0.02_260)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
        )}
      >
        {converting ? "Converting…" : "Convert"}
      </button>
      <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-white/30">
        <ChevronRight className="h-3 w-3" /> Live rates arrive from the exchange API at settlement time.
      </p>
    </div>
  );
}
