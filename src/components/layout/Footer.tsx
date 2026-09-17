"use client";

import { Github, Instagram, Linkedin, Twitter } from "lucide-react";
import { BidforgeMark } from "@/components/shared/BidforgeMark";
import { useRouterStore, type AppView } from "@/store/router";

const COLUMNS: { title: string; links: { label: string; view?: AppView; anchor?: string }[] }[] = [
  {
    title: "Marketplace",
    links: [
      { label: "Auctions", view: "auctions" },
      { label: "Explore", view: "auctions" },
      { label: "Sell with BIDFORGE", view: "sell" },
      { label: "Wallet", view: "wallet" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "How It Works", view: "home", anchor: "how-it-works" },
      { label: "Help Center", view: "help" },
      { label: "Contact", view: "help" },
      { label: "Admin Console", view: "organizer" },
    ],
  },
  {
    title: "Legal & Trust",
    links: [
      { label: "Terms", view: "help" },
      { label: "Privacy", view: "help" },
      { label: "Security", view: "help" },
      { label: "System Status", view: "home", anchor: "live-system" },
    ],
  },
];

export function Footer() {
  const navigate = useRouterStore((s) => s.navigate);

  function go(link: (typeof COLUMNS)[number]["links"][number]) {
    if (link.anchor) {
      if (link.view !== "home") navigate(link.view ?? "home");
      setTimeout(() => {
        document.getElementById(link.anchor!)?.scrollIntoView({ behavior: "smooth" });
      }, 80);
      return;
    }
    if (link.view) navigate(link.view);
  }

  return (
    <footer className="relative mt-auto border-t border-white/8 bg-[oklch(0.11_0.012_285/0.7)] pb-28 pt-14 lg:pb-14">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <button onClick={() => navigate("home")} className="flex items-center gap-2.5" aria-label="BIDFORGE home">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/25 bg-gradient-to-br from-cyan-300/15 to-violet-400/10">
                <BidforgeMark className="h-[18px] w-[18px]" />
              </span>
              <span className="font-display text-base font-bold tracking-[0.28em] text-white">
                BIDFORGE <span className="text-[10px] font-semibold tracking-[0.3em] text-white/40">AUCTIONS</span>
              </span>
            </button>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/45">
              The real-time auction house. Bid faster, compete live, secure every transaction — a
              marketplace engineered for speed and trust.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                <button
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50 transition-all hover:border-cyan-300/30 hover:text-cyan-200"
                  aria-label="Social link"
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <button
                        onClick={() => go(l)}
                        className="text-[13px] text-white/55 transition-colors hover:text-cyan-200"
                      >
                        {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row">
          <p className="text-[11px] text-white/30">© {new Date().getFullYear()} BIDFORGE Auctions. All rights reserved.</p>
          <button
            onClick={() => {
              document.getElementById("live-system")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-3.5 py-1.5"
            aria-label="System status — all systems operational"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="ping-ring text-emerald-400 absolute inset-0 rounded-full opacity-60" />
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/90">
              All systems operational
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
