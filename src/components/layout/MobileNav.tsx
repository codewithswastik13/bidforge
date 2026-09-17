"use client";

import { Gavel, HelpCircle, LayoutGrid, User, Wallet } from "lucide-react";
import { useRouterStore } from "@/store/router";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Home", icon: Gavel, view: "home" as const },
  { label: "Auctions", icon: LayoutGrid, view: "auctions" as const },
  { label: "Wallet", icon: Wallet, view: "wallet" as const },
  { label: "Profile", icon: User, view: "profile" as const },
  { label: "Help", icon: HelpCircle, view: "help" as const },
];

/**
 * Mobile bottom navigation — thumb-friendly, always-available
 * access to the core destinations.
 */
export function MobileNav() {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const active = route.view === "auction" ? "auctions" : route.view;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[oklch(0.13_0.012_285/0.92)] pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden"
      aria-label="Mobile bottom navigation"
    >
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.view)}
            className={cn(
              "flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              active === item.view ? "text-cyan-300" : "text-white/45"
            )}
            aria-current={active === item.view ? "page" : undefined}
          >
            <item.icon className={cn("h-5 w-5", active === item.view && "drop-shadow-[0_0_8px_oklch(0.82_0.14_205/0.6)]")} />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
