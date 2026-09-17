"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchCommand } from "@/components/layout/SearchCommand";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { HomeView } from "@/components/views/HomeView";
import { AuctionsView } from "@/components/views/AuctionsView";
import { AuctionView } from "@/components/views/AuctionView";
import { WalletView } from "@/components/views/WalletView";
import { ProfileView } from "@/components/views/ProfileView";
import { SellView } from "@/components/views/SellView";
import { AdminView } from "@/components/views/AdminView";
import { AuthView } from "@/components/views/AuthView";
import { HelpView } from "@/components/views/HelpView";
import { useRouterStore } from "@/store/router";
import { useAuctionStore } from "@/store/auctions";
import { useWalletStore } from "@/store/wallet";
import { useNotificationsStore } from "@/store/notifications";
import { useMetricsStore } from "@/store/metrics";
import { startSimulation } from "@/services/realtime";

/**
 * App shell — the single mounted route. Owns the view router,
 * boots the realtime simulation once, and drives the global 1s
 * clock that every countdown derives from.
 */
export function AppShell() {
  const route = useRouterStore((s) => s.route);

  /* boot: init stores + wire realtime subscriptions + start engine */
  useEffect(() => {
    useAuctionStore.getState().init();
    useWalletStore.getState().subscribeRealtime();
    useNotificationsStore.getState().subscribeRealtime();
    useMetricsStore.getState().subscribeRealtime();
    startSimulation({ heroAuctionId: "auc-chronograph" });

    const timer = setInterval(() => {
      useAuctionStore.getState().tick(Date.now());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const key = route.view === "auction" ? `auction-${route.params.id}` : route.view;

  return (
    <div className="noise relative flex min-h-screen flex-col">
      <Navbar />
      <NotificationCenter />
      <SearchCommand />

      <main className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.985, filter: "blur(10px)" }}
            animate={{
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              /* clear transform/filter after settling so position:fixed
                 descendants (mobile sticky bid bar) anchor to the viewport */
              transitionEnd: { transform: "none", filter: "none" },
            }}
            exit={{ opacity: 0, scale: 1.01, filter: "blur(10px)" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            {route.view === "home" && <HomeView />}
            {route.view === "auctions" && <AuctionsView />}
            {route.view === "auction" && <AuctionView auctionId={route.params.id ?? "auc-chronograph"} />}
            {route.view === "wallet" && <WalletView />}
            {route.view === "profile" && <ProfileView />}
            {route.view === "sell" && <SellView />}
            {route.view === "admin" && <AdminView />}
            {route.view === "auth" && <AuthView />}
            {route.view === "help" && <HelpView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
