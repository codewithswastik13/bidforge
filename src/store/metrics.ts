"use client";

import { create } from "zustand";
import type { SystemMetrics } from "@/lib/types";
import { getMetricsSnapshot, realtimeBus } from "@/services/realtime";

interface MetricsState {
  metrics: SystemMetrics;
  wired: boolean;
  subscribeRealtime: () => void;
  /** merges authoritative engine counters over the ambient snapshot */
  mergeBackendMetrics: (accepted: number, rejected: number, ws: number) => void;
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  metrics: getMetricsSnapshot(),
  wired: false,
  subscribeRealtime: () => {
    if (get().wired) return;
    set({ wired: true });
    realtimeBus.on("METRICS_TICK", ({ metrics }) => set({ metrics }));
  },
  mergeBackendMetrics: (accepted, rejected, ws) =>
    set((s) => ({
      metrics: {
        ...s.metrics,
        acceptedBids: accepted,
        rejectedBids: rejected,
        activeConnections: ws,
      },
    })),
}));
