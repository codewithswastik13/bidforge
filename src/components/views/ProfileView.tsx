"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  Gavel,
  Gavel as GavelIcon,
  Heart,
  KeyRound,
  PackageCheck,
  Receipt,
  ShieldCheck,
  Star,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useNotifications, useUser } from "@/hooks/use-vyra";
import { useWallet } from "@/hooks/use-vyra";
import { useAuctionList } from "@/hooks/use-vyra";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import { SEED_USER } from "@/lib/mock-data";
import { formatINR, timeAgo } from "@/lib/format";
import { formatDateTime } from "@/lib/format";
import { useNow } from "@/hooks/use-vyra";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const TABS = [
  { key: "bidding", label: "Bidding history", icon: Gavel },
  { key: "won", label: "Won auctions", icon: Trophy },
  { key: "transactions", label: "Transactions", icon: Receipt },
  { key: "saved", label: "Saved auctions", icon: Heart },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "payments", label: "Payment methods", icon: Star },
  { key: "security", label: "Security", icon: KeyRound },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ProfileView() {
  const logout = useAuthStore((s) => s.logout);
  const { user } = useUser();
  const profile = user ?? SEED_USER; // demo-режим: гостю показываем сид-профиль
  const [tab, setTab] = useState<TabKey>("bidding");
  const auctions = useAuctionList();
  const { transactions, paymentMethods } = useWallet();
  const { reminders } = useNotifications();
  const navigate = useRouterStore((s) => s.navigate);
  const now = useNow();

  const won = auctions.filter((a) => a.status === "sold");
  const saved = auctions.filter((a) => a.featured);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 lg:pt-36">
      {/* header card */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="glass relative overflow-hidden rounded-[1.75rem] p-7 sm:p-9">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[80px]" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-300/20 to-violet-400/15 font-display text-2xl font-bold text-cyan-200">
            {(profile.name).split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{profile.name}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-300">
                <ShieldCheck className="h-3 w-3" /> VERIFIED IDENTITY
              </span>
            </div>
            <p className="font-num mt-1.5 text-sm text-white/45">
              {profile.handle} · member since {new Date(profile.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* stats */}
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { l: "Auctions participated", v: String(profile.stats.auctionsParticipated), icon: GavelIcon, tone: "text-cyan-300" },
            { l: "Auctions won", v: String(profile.stats.auctionsWon), icon: Trophy, tone: "text-amber-300" },
            { l: "Total bids", v: String(profile.stats.totalBids), icon: Gavel, tone: "text-violet-300" },
            { l: "Total spent", v: formatINR(profile.stats.totalSpent), icon: Receipt, tone: "text-emerald-300" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <s.icon className={cn("h-4 w-4", s.tone)} />
              <p className="font-num mt-2.5 text-xl font-semibold text-white/95">{s.v}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">{s.l}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* personal info strip */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }} className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { icon: User, l: "Email", v: profile.email },
          { icon: KeyRound, l: "Phone", v: profile.phone },
          { icon: ShieldCheck, l: "KYC status", v: "Verified · PAN + Aadhaar" },
        ].map((f) => (
          <div key={f.l} className="glass flex items-center gap-3.5 rounded-2xl px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-cyan-200">
              <f.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{f.l}</p>
              <p className="font-num truncate text-[13px] text-white/85">{f.v}</p>
            </div>
          </div>
        ))}
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
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* tab content */}
      <div className="glass mt-5 rounded-2xl p-5 sm:p-6">
        {tab === "bidding" && (
          <div className="space-y-2.5">
            {auctions.filter((a) => a.status === "live").slice(0, 4).map((a) => (
              <HistoryRow key={a.id} title={a.title} sub={`Live room · ${a.bidCount} bids · ${formatINR(a.currentBid)} high`} amount={a.currentBid} onClick={() => navigate("auction", { id: a.id })} />
            ))}
          </div>
        )}
        {tab === "won" && (
          <div className="space-y-2.5">
            {won.map((a) => (
              <HistoryRow key={a.id} title={a.title} sub={`Won ${formatDateTime(a.endsAt)} · settled from INR Wallet`} amount={a.currentBid} win onClick={() => navigate("auction", { id: a.id })} />
            ))}
            {won.length === 0 && <Empty text="No wins yet — your trophies will appear here." />}
          </div>
        )}
        {tab === "transactions" && (
          <div className="space-y-2.5">
            {transactions.map((t) => (
              <HistoryRow key={t.id} title={t.title} sub={`${t.subtitle} · ${timeAgo(t.createdAt, now)}`} amount={t.amount} status={t.status} />
            ))}
          </div>
        )}
        {tab === "saved" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {saved.map((a) => (
              <button key={a.id} onClick={() => navigate("auction", { id: a.id })} className="flex items-center gap-3.5 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left transition-colors hover:border-cyan-300/25">
                { }
                <img src={a.images[0]} alt={a.title} className="h-14 w-14 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/90">{a.title}</p>
                  <p className="font-num text-[11px] text-cyan-200/80">{formatINR(a.currentBid)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {tab === "reminders" && (
          <div className="space-y-2.5">
            {reminders.map((r) => {
              const a = auctions.find((x) => x.id === r.auctionId);
              return (
                <div key={r.id} className="flex items-center gap-3.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <Bell className="h-4 w-4 shrink-0 text-cyan-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/90">{a?.title ?? "Auction"}</p>
                    <p className="font-num text-[11px] text-white/35">fires {r.offsetMinutes} min before start</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                </div>
              );
            })}
            {reminders.length === 0 && <Empty text="No active reminders. Set one from any upcoming auction." />}
          </div>
        )}
        {tab === "payments" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center gap-3.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
                <PackageCheck className="h-4 w-4 shrink-0 text-cyan-300/80" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/90">{pm.label}</p>
                  <p className="font-num text-[11px] text-white/35">{pm.detail}</p>
                </div>
                {pm.isDefault && <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-[9px] font-bold text-cyan-300">DEFAULT</span>}
              </div>
            ))}
          </div>
        )}
        {tab === "security" && (
          <div className="space-y-3">
            {[
              { l: "Two-factor authentication", d: "OTP over SMS + email on every login", on: true },
              { l: "Bid confirmation", d: "Require confirmation above ₹1,00,000", on: true },
              { l: "Login alerts", d: "Email on new device sign-in", on: true },
              { l: "Session timeout", d: "Auto sign-out after 30 minutes idle", on: false },
            ].map((s) => (
              <div key={s.l} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-white/90">{s.l}</p>
                  <p className="text-[11px] text-white/40">{s.d}</p>
                </div>
                <button
                  onClick={() => toast(`${s.l} ${s.on ? "disabled" : "enabled"}`)}
                  className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", s.on ? "bg-cyan-300/80" : "bg-white/12")}
                  aria-label={`Toggle ${s.l}`}
                >
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", s.on ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                logout();
                toast.success("Signed out", { description: "Your session has ended — sign in to bid again." });
                navigate("home");
              }}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/[0.07] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-rose-300/90 transition-all hover:border-rose-400/45 hover:bg-rose-500/[0.12]"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({
  title,
  sub,
  amount,
  win,
  status,
  onClick,
}: {
  title: string;
  sub: string;
  amount: number;
  win?: boolean;
  status?: "completed" | "pending" | "failed";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left transition-colors hover:border-cyan-300/25"
    >
      <span className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
        win ? "border-amber-300/30 bg-amber-300/10 text-amber-300" : "border-white/10 bg-white/[0.05] text-white/60"
      )}>
        {win ? <Trophy className="h-4 w-4" /> : <Gavel className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/90">{title}</p>
        <p className="font-num truncate text-[11px] text-white/35">{sub}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-num text-sm font-semibold text-white/90">
          {amount >= 0 ? formatINR(amount) : `−${formatINR(Math.abs(amount))}`}
        </p>
        {status && (
          <span className={cn(
            "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider",
            status === "completed" ? "bg-emerald-400/10 text-emerald-300" : status === "pending" ? "bg-amber-300/10 text-amber-300" : "bg-rose-400/10 text-rose-300"
          )}>
            {status.toUpperCase()}
          </span>
        )}
      </div>
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/35">{text}</p>;
}
