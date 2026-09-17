"use client";

import { create } from "zustand";
import { useEffect, useMemo, useState } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { ArrowRight, Bell, Clock3, Hash, TrendingUp, User } from "lucide-react";
import { BidforgeMark } from "@/components/shared/BidforgeMark";
import { toast } from "sonner";
import { useAuctionStore } from "@/store/auctions";
import { useRouterStore } from "@/store/router";
import { useNotificationsStore } from "@/store/notifications";
import { useNow } from "@/hooks/use-vyra";
import { formatCountdown, formatDate, formatINR } from "@/lib/format";
import { SUGGESTED_SEARCHES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/* global open state so the navbar / hotkey can toggle the palette */
interface SearchStore {
  open: boolean;
  setOpen: (open: boolean) => void;
}
export const useSearchStore = create<SearchStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function SearchCommand() {
  const open = useSearchStore((s) => s.open);
  const setOpen = useSearchStore((s) => s.setOpen);
  const auctions = useAuctionStore((s) => s.auctions);
  const navigate = useRouterStore((s) => s.navigate);
  const setReminder = useNotificationsStore((s) => s.setReminder);
  const reminders = useNotificationsStore((s) => s.reminders);
  const now = useNow();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  /* hotkey */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  /* debounced search */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 160);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    const q = debounced;
    const match = (s: string) => s.toLowerCase().includes(q);
    const products = auctions.filter(
      (a) => !q || a.searchText.includes(q) || match(a.status)
    );
    const categories = q
      ? [...new Set(auctions.map((a) => a.category))].filter(match).slice(0, 4)
      : [];
    const sellers = q
      ? [...new Map(auctions.map((a) => [a.seller.name, a.seller])).values()]
          .filter((s) => match(s.name))
          .slice(0, 3)
      : [];
    return { products: products.slice(0, 8), categories, sellers };
  }, [auctions, debounced]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      className="glass-strong max-w-xl overflow-hidden rounded-2xl border-white/10 bg-[oklch(0.16_0.014_285/0.92)] !backdrop-blur-2xl"
    >
      <div className="relative">
        <CommandInput
          placeholder="Search products, auctions or categories..."
          value={query}
          onValueChange={setQuery}
          className="!border-0 !text-sm"
        />
      </div>
      <CommandList className="thin-scroll max-h-[60vh] px-1.5 pb-1.5">
        <CommandEmpty className="py-10 text-center text-sm text-white/40">
          No results for “{query}”. Try “watch”, “art” or “whisky”.
        </CommandEmpty>

        {!query && (
          <CommandGroup heading="Try searching" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-white/35">
            <div className="flex flex-wrap gap-1.5 px-2 pb-2 pt-1">
              {SUGGESTED_SEARCHES.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 transition-all hover:border-cyan-300/30 hover:text-cyan-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </CommandGroup>
        )}

        {results.categories.length > 0 && (
          <CommandGroup heading="Categories" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-white/35">
            {results.categories.map((c) => (
              <CommandItem
                key={c}
                value={`cat-${c}`}
                onSelect={() => {
                  setOpen(false);
                  navigate("auctions", { category: c });
                }}
                className="!rounded-lg !px-3 !py-2.5 !text-sm text-white/80 aria-selected:!bg-white/[0.06] aria-selected:!text-white"
              >
                <Hash className="mr-2 h-3.5 w-3.5 text-cyan-300/70" />
                {c}
                <ArrowRight className="ml-auto h-3 w-3 text-white/25" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.sellers.length > 0 && (
          <CommandGroup heading="Sellers" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-white/35">
            {results.sellers.map((s) => (
              <CommandItem
                key={s.id}
                value={`seller-${s.id}`}
                onSelect={() => {
                  setOpen(false);
                  navigate("auctions", { query: s.name });
                }}
                className="!rounded-lg !px-3 !py-2.5 !text-sm text-white/80 aria-selected:!bg-white/[0.06]"
              >
                <User className="mr-2 h-3.5 w-3.5 text-violet-300/70" />
                {s.name}
                <span className="font-num ml-auto text-[10px] text-white/30">★ {s.rating}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.products.length > 0 && (
          <>
            <CommandSeparator className="!bg-white/6" />
            <CommandGroup heading={query ? "Products & auctions" : "Live & upcoming"} className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-white/35">
              {results.products.map((a) => {
                const upcoming = a.status === "upcoming";
                const hasReminder = reminders.some((r) => r.auctionId === a.id);
                const target = upcoming ? a.startsAt : a.endsAt;
                return (
                  <CommandItem
                    key={a.id}
                    value={`p-${a.id}-${a.title}`}
                    onSelect={() => {
                      setOpen(false);
                      navigate("auction", { id: a.id });
                    }}
                    className="!rounded-xl !px-3 !py-2.5 aria-selected:!bg-white/[0.06]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      { }
                      <img src={a.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-white/10 object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13px] font-medium text-white/90">{a.title}</p>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider",
                              a.status === "live"
                                ? "bg-rose-400/15 text-rose-300"
                                : upcoming
                                  ? "bg-cyan-300/15 text-cyan-300"
                                  : "bg-white/10 text-white/45"
                            )}
                          >
                            {a.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-white/40">
                          <span className="font-num text-cyan-200/90">{formatINR(a.currentBid)}</span>
                          <span className="font-num">base {formatINR(a.basePrice)}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-2.5 w-2.5" />
                            {upcoming ? formatDate(a.startsAt) : `${formatCountdown(Math.max(0, target - now))} left`}
                          </span>
                        </p>
                      </div>
                      {upcoming && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            (e as unknown as MouseEvent).preventDefault?.();
                            setReminder(a.id, a.title, a.startsAt, 15);
                            toast.success("Reminder set", { description: `${a.title} · 15 minutes before` });
                          }}
                          className={cn(
                            "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold tracking-wide transition-all",
                            hasReminder
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                              : "border-white/12 bg-white/[0.04] text-white/60 hover:border-cyan-300/40 hover:text-cyan-200"
                          )}
                          aria-label="Set reminder"
                        >
                          <Bell className="h-3 w-3" />
                          {hasReminder ? "SET" : "REMIND"}
                        </button>
                      )}
                      {!upcoming && a.status === "live" && (
                        <span className="font-num flex shrink-0 items-center gap-1 text-[10px] text-white/30">
                          <TrendingUp className="h-3 w-3" /> {a.bidCount}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>

      <div className="flex items-center justify-between border-t border-white/8 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[10px] text-white/30">
          <BidforgeMark className="h-3 w-3" /> BIDFORGE global search
        </span>
        <span className="font-num text-[10px] text-white/25">esc to close</span>
      </div>
    </CommandDialog>
  );
}
