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
import { HelpView } from "@/components/views/HelpView";
import { useRouterStore } from "@/store/router";
import { useAuthStore } from "@/store/auth";
import AuthTransition from "@/components/auth/AuthTransition";
import OrganizerLoginPage from "@/components/auth/OrganizerLoginPage";
import { useAuctionStore } from "@/store/auctions";
import { useWalletStore } from "@/store/wallet";
import { useNotificationsStore } from "@/store/notifications";
import { useMetricsStore } from "@/store/metrics";
import { startSimulation } from "@/services/realtime";
import { bootBackendBridge, wireBusToBackend, startBackendMetricsPoll } from "@/services/backend-bridge";
import { stopRivalEngine } from "@/services/realtime";

/**
 * App shell — the single mounted route. Owns the view router,
 * boots the realtime simulation once, and drives the global 1s
 * clock that every countdown derives from. When the real bid
 * engine answers the health probe, the bridge takes over auction
 * state and the simulated rival engine stands down.
 */
export function AppShell() {
  const route = useRouterStore((s) => s.route);
  const navigate = useRouterStore((s) => s.navigate);
  const role = useAuthStore((s) => s.role);

  /* admin route guard — unauthenticated/non-admin sessions never see
     the console; they land on the organizer sign-in instead */
  useEffect(() => {
    if (route.view === "admin" && role !== "admin") {
      navigate("organizer");
    }
  }, [route.view, role, navigate]);

  /* boot: init stores + wire realtime subscriptions + start engine */
  useEffect(() => {
    useAuctionStore.getState().init();
    useWalletStore.getState().subscribeRealtime();
    useNotificationsStore.getState().subscribeRealtime();
    useMetricsStore.getState().subscribeRealtime();
    wireBusToBackend();
    startSimulation({ heroAuctionId: "auc-chronograph" });

    // real engine? hydrate from it, open WebSockets, stop fake rivals.
    // Retries cover backend restarts / slow cold starts — the site
    // self-heals into live mode without a reload.
    let attempts = 0;
    const tryBridge = () => {
      attempts += 1;
      void bootBackendBridge().then((live) => {
        if (live) {
          stopRivalEngine();
          startBackendMetricsPoll();
        } else if (attempts < 10) {
          setTimeout(tryBridge, 3000);
        }
      });
    };
    tryBridge();

    const timer = setInterval(() => {
      useAuctionStore.getState().tick(Date.now());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const key = route.view === "auction" ? `auction-${route.params.id}` : route.view;

  /* the auth experiences are full-screen takeovers — no app chrome */
  const immersiveView = route.view === "auth" || route.view === "organizer";

  return (
    <div className="noise relative flex min-h-screen flex-col">
      {!immersiveView && <Navbar />}
      {!immersiveView && <NotificationCenter />}
      {!immersiveView && <SearchCommand />}

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
            {route.view === "organizer" && <OrganizerLoginPage />}
            {route.view === "auth" && <AuthTransition />}
            {route.view === "help" && <HelpView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {!immersiveView && <Footer />}
      {!immersiveView && <MobileNav />}
    </div>
  );
}
