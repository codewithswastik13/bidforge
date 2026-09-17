"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Coins,
  HelpCircle,
  Menu,
  Search,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react";
import { BidforgeMark } from "@/components/shared/BidforgeMark";
import { useSearchStore } from "@/components/layout/SearchCommand";
import { useRouterStore } from "@/store/router";
import { useWalletStore } from "@/store/wallet";
import { useNotificationsStore } from "@/store/notifications";
import { useAuthStore } from "@/store/auth";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Auctions", view: "auctions" as const },
  { label: "Explore", view: "auctions" as const },
  { label: "How It Works", view: "home" as const, anchor: "how-it-works" },
  { label: "Sell", view: "sell" as const },
  { label: "Help", view: "help" as const },
];

/**
 * Premium sticky navbar — compacts on scroll, carries the LIVE
 * engine pill, search trigger, wallet balance, notifications and
 * profile. Anchors scroll on the home view.
 */
export function Navbar() {
  const navigate = useRouterStore((s) => s.navigate);
  const route = useRouterStore((s) => s.route);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inr = useWalletStore((s) => s.accounts.find((a) => a.type === "inr"));
  const unread = useNotificationsStore((s) => s.notifications.filter((n) => !n.read).length);
  const setPanelOpen = useNotificationsStore((s) => s.setPanelOpen);
  const role = useAuthStore((s) => s.role);
  const setOpen = useSearchStore((s) => s.setOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go(item: (typeof NAV)[number]) {
    setMobileOpen(false);
    if (item.anchor) {
      if (route.view !== "home") navigate("home");
      setTimeout(() => {
        document.getElementById(item.anchor!)?.scrollIntoView({ behavior: "smooth" });
      }, 60);
      return;
    }
    navigate(item.view);
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 transition-all duration-500 sm:px-8",
          scrolled ? "py-2.5" : "py-4"
        )}
      >
        <div
          className={cn(
            "flex w-full items-center justify-between gap-4 rounded-2xl px-4 transition-all duration-500",
            scrolled
              ? "glass-strong border border-white/8 py-2 shadow-[0_18px_50px_-20px_oklch(0_0_0/0.7)]"
              : "border border-transparent py-2.5"
          )}
        >
          {/* brand */}
          <button
            onClick={() => navigate("home")}
            className="group flex items-center gap-2.5"
            aria-label="BIDFORGE home"
          >
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-300/25 to-violet-400/20 blur-[6px] transition-opacity group-hover:opacity-100" />
              <BidforgeMark className="relative h-[19px] w-[19px]" />
            </span>
            <span className="font-display text-[15px] font-bold tracking-[0.28em] text-white">
              BIDFORGE
              <span className="ml-1.5 hidden text-[9px] font-semibold tracking-[0.3em] text-white/35 sm:inline">
                AUCTIONS
              </span>
            </span>
            <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[9px] font-bold tracking-[0.18em] text-rose-300">
              <span className="live-dot h-1 w-1 rounded-full bg-rose-400" /> LIVE
            </span>
          </button>

          {/* center nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <button
                key={item.label}
                onClick={() => go(item)}
                className={cn(
                  "rounded-full px-4 py-2 text-[12.5px] font-medium tracking-wide text-white/60 transition-all duration-300 hover:bg-white/[0.06] hover:text-white",
                  route.view === item.view && !item.anchor && "bg-white/[0.07] text-white"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* right cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setOpen(true)}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-white/60 transition-all hover:border-cyan-300/30 hover:text-cyan-200"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
              <span className="hidden text-xs font-medium md:inline">Search</span>
              <kbd className="hidden rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-semibold text-white/40 md:inline">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => navigate("wallet")}
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-white/70 transition-all hover:border-emerald-300/30 hover:text-emerald-200 sm:flex"
              aria-label="Wallet"
            >
              <Wallet className="h-4 w-4" />
              <span className="font-num text-xs font-semibold">{formatINR(inr?.available ?? 0)}</span>
            </button>

            <button
              onClick={() => setPanelOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-all hover:border-cyan-300/30 hover:text-cyan-200"
              aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-400 px-1 text-[9px] font-bold text-black">
                  {unread}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate(role === "admin" ? "admin" : "profile")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-all hover:border-cyan-300/30 hover:text-cyan-200"
              aria-label="Profile"
            >
              <User className="h-4 w-4" />
            </button>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 lg:hidden"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-4 mt-1 overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.15_0.014_285/0.96)] p-2 shadow-2xl backdrop-blur-2xl lg:hidden"
            aria-label="Mobile"
          >
            {NAV.map((item) => (
              <button
                key={item.label}
                onClick={() => go(item)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
                {item.view === "sell" && <Coins className="h-4 w-4 text-cyan-300/60" />}
                {item.view === "help" && <HelpCircle className="h-4 w-4 text-white/30" />}
              </button>
            ))}
            <div className="my-1 h-px bg-white/8" />
            <button
              onClick={() => {
                setMobileOpen(false);
                navigate("wallet");
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white/75 hover:bg-white/[0.06]"
            >
              <Wallet className="h-4 w-4 text-emerald-300/80" /> Wallet · {formatINR(inr?.available ?? 0)}
            </button>
            <button
              onClick={() => {
                setMobileOpen(false);
                navigate("admin");
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white/75 hover:bg-white/[0.06]"
            >
              <ShieldCheck className="h-4 w-4 text-violet-300/80" /> Admin console
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
