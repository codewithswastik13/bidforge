"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const HeroScene = dynamic(() => import("./HeroScene").then((m) => m.HeroScene), {
  ssr: false,
  loading: () => null,
});

/**
 * Lazily mounts the 3D scene after first paint so the hero copy
 * renders instantly (code-splitting + no SSR for WebGL).
 */
export function HeroCanvas() {
  const [mounted, setMounted] = useState(false);
  const [quality, setQuality] = useState<"high" | "low">(() => {
    if (typeof window === "undefined") return "high";
    const lowPower =
      window.matchMedia("(max-width: 768px)").matches ||
      (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4);
    return lowPower ? "low" : "high";
  });
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window === "undefined" ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const mqMobile = window.matchMedia("(max-width: 768px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowPower = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4;
    const apply = () => setQuality(mqMobile.matches || lowPower ? "low" : "high");
    const applyMotion = () => setReducedMotion(mqReduce.matches);
    mqMobile.addEventListener("change", apply);
    mqReduce.addEventListener("change", applyMotion);

    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.02,
    });
    io.observe(document.documentElement);

    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      mqMobile.removeEventListener("change", apply);
      mqReduce.removeEventListener("change", applyMotion);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0"
      style={{ visibility: visible ? "visible" : "hidden" }}
      aria-hidden
    >
      {mounted && <HeroScene quality={quality} reducedMotion={reducedMotion} />}
    </motion.div>
  );
}
