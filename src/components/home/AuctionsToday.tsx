"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { SectionHeading } from "@/components/shared/Sparkline";
import type { Auction } from "@/lib/types";

/**
 * "Auctions happening today" — draggable premium carousel.
 * Cards are driven entirely by the auctions store, so admin
 * additions appear here automatically.
 */
export function AuctionsToday({ auctions }: { auctions: Auction[] }) {
  const live = auctions.filter((a) => a.status === "live" || a.status === "upcoming").slice(0, 9);
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const raf = useRef<number>(0);

  const sync = useCallback(() => {
    if (!embla) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      setCanPrev(embla.canScrollPrev());
      setCanNext(embla.canScrollNext());
    });
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    sync();
    embla.on("select", sync).on("reInit", sync);
    return () => cancelAnimationFrame(raf.current);
  }, [embla, sync]);

  return (
    <section id="auctions-today" className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          kicker="Happening today"
          title={
            <>
              Auctions happening <span className="text-gradient">today</span>
            </>
          }
          sub="Live rooms are open right now. Upcoming lots are accepting reminders — be there when the clock starts."
        />
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => embla?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Previous auctions"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 backdrop-blur-md transition-all hover:border-cyan-300/40 hover:text-cyan-200 disabled:opacity-30 disabled:hover:border-white/12 disabled:hover:text-white/70"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => embla?.scrollNext()}
            disabled={!canNext}
            aria-label="Next auctions"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 backdrop-blur-md transition-all hover:border-cyan-300/40 hover:text-cyan-200 disabled:opacity-30 disabled:hover:border-white/12 disabled:hover:text-white/70"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <div className="mask-fade-x mt-10 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5 py-4">
          {live.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.06, 0.4) }}
              className="min-w-0 shrink-0 basis-[85%] sm:basis-[46%] lg:basis-[31.5%] xl:basis-[29%]"
            >
              <AuctionCard auction={a} className="h-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
