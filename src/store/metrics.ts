"use client";

import { create } from "zustand";
import type { SystemMetrics } from "@/lib/types";
import { getMetricsSnapshot, realtimeBus } from "@/services/realtime";

interface MetricsState {
  metrics: SystemMetrics;
  wired: boolean;
  subscribeRealtime: () => void;
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  metrics: getMetricsSnapshot(),
  wired: false,
  subscribeRealtime: () => {
    if (get().wired) return;
    set({ wired: true });
    realtimeBus.on("METRICS_TICK", ({ metrics }) => set({ metrics }));
  },
}));
