"use client";

import { create } from "zustand";

export type AppView =
  | "home"
  | "auctions"
  | "auction"
  | "wallet"
  | "profile"
  | "sell"
  | "admin"
  | "auth"
  | "help";

export interface RouteState {
  view: AppView;
  params: Record<string, string>;
}

interface RouterStore {
  route: RouteState;
  history: RouteState[];
  /** view we came from — used for cinematic "return" transitions */
  navigate: (view: AppView, params?: Record<string, string>) => void;
  back: () => void;
}

export const useRouterStore = create<RouterStore>((set, get) => ({
  route: { view: "home", params: {} },
  history: [],

  navigate: (view, params = {}) => {
    const current = get().route;
    if (current.view === view && JSON.stringify(current.params) === JSON.stringify(params)) return;
    set((s) => ({
      route: { view, params },
      history: [...s.history.slice(-20), current],
    }));
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
  },

  back: () => {
    const h = [...get().history];
    const prev = h.pop();
    if (!prev) {
      get().navigate("home");
      return;
    }
    set({ route: prev, history: h });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
  },
}));
