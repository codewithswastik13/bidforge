"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Rows3, Search } from "lucide-react";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { useAuctionList } from "@/hooks/use-vyra";
import type { AuctionStatus } from "@/lib/types";
import { CATEGORIES } from "@/lib/mock-data";
import { useRouterStore } from "@/store/router";
import { cn } from "@/lib/utils";

const FILTERS: { key: AuctionStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live now" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ended", label: "Ended" },
  { key: "sold", label: "Sold" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Auctions marketplace — filterable, searchable grid. Reads the
 * router's category/query params (used by global search deep-links).
 */
export function AuctionsView() {
  const route = useRouterStore((s) => s.route);
  const auctions = useAuctionList();
  const [status, setStatus] = useState<AuctionStatus | "all">("all");
  const [category, setCategory] = useState<string>(route.params.category ?? "");
  const [query, setQuery] = useState(route.params.query ?? "");
  const [dense, setDense] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auctions.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (category && a.category !== category) return false;
      if (q && !a.searchText.includes(q)) return false;
      return true;
    });
  }, [auctions, status, category, query]);

  const usedCategories = useMemo(
    () => CATEGORIES.filter((c) => auctions.some((a) => a.category === c)),
    [auctions]
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 lg:pt-36">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="flex flex-wrap items-end justify-between gap-6"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/80">Marketplace</p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            The auction floor
          </h1>
          <p className="mt-3 max-w-lg text-[15px] text-[oklch(0.62_0.01_260)]">
            Every room, every lot — live countdowns, verified sellers and instant bidding.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="glass flex items-center gap-2 rounded-full px-4 py-2.5">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lots…"
              className="w-40 bg-transparent text-sm text-white/85 outline-none placeholder:text-white/30"
              aria-label="Search lots"
            />
          </div>
          <button
            onClick={() => setDense((v) => !v)}
            className="glass flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:text-cyan-200"
            aria-label={dense ? "Comfortable grid" : "Dense grid"}
          >
            {dense ? <Rows3 className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        className="no-scrollbar mt-8 flex items-center gap-2 overflow-x-auto pb-1"
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-300",
              status === f.key
                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white/85"
            )}
          >
            {f.key === "live" && (
              <span className="live-dot mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-400 align-middle" />
            )}
            {f.label}
          </button>
        ))}
        <span className="mx-2 h-5 w-px shrink-0 bg-white/10" />
        <button
          onClick={() => setCategory("")}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all",
            !category
              ? "border-white/30 bg-white/10 text-white"
              : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/85"
          )}
        >
          All categories
        </button>
        {usedCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(category === c ? "" : c)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all",
              category === c
                ? "border-violet-400/40 bg-violet-400/10 text-violet-200"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/85"
            )}
          >
            {c}
          </button>
        ))}
      </motion.div>

      <p className="font-num mt-6 text-xs text-white/35">
        {filtered.length} lot{filtered.length === 1 ? "" : "s"} found
      </p>

      <motion.div layout className={cn("mt-4 grid gap-5", dense ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3")}>
        <AnimatePresence mode="popLayout">
          {filtered.map((a) => (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <AuctionCard auction={a} className="h-full" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-white/12 py-20 text-center">
          <p className="font-display text-lg text-white/60">No lots match your filters</p>
          <p className="mt-2 text-sm text-white/35">Try clearing the search or switching category.</p>
          <button
            onClick={() => {
              setStatus("all");
              setCategory("");
              setQuery("");
            }}
            className="mt-6 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-cyan-200"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
