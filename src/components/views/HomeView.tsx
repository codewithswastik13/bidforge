"use client";

import { Hero } from "@/components/home/Hero";
import { LiveShowcase } from "@/components/home/LiveShowcase";
import { AuctionsToday } from "@/components/home/AuctionsToday";
import { HowItWorks } from "@/components/home/HowItWorks";
import { LiveSystem } from "@/components/home/LiveSystem";
import { SellCTA, TrustSection, FinalCTA } from "@/components/home/Sections";
import { UpcomingAuctions } from "@/components/home/UpcomingAuctions";
import { useAuctionList } from "@/hooks/use-vyra";

/**
 * 01 Hero (3D) → 02 Live showcase → 03 Auctions today →
 * 04 How it works → 05 Live system → 06 Sell CTA → 07 Trust →
 * 08 Upcoming → 09 Final CTA
 */
export function HomeView() {
  const auctions = useAuctionList();

  return (
    <>
      <Hero />
      <LiveShowcase />
      <AuctionsToday auctions={auctions} />
      <HowItWorks />
      <LiveSystem />
      <SellCTA />
      <TrustSection />
      <UpcomingAuctions auctions={auctions} />
      <FinalCTA />
    </>
  );
}
