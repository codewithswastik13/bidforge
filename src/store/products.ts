"use client";

import { create } from "zustand";
import type { ProductSubmission } from "@/lib/types";
import { realtimeBus } from "@/services/realtime";
import { productsApi } from "@/services/api";

interface ProductsState {
  submissions: ProductSubmission[];
  submitting: boolean;
  lastSubmittedId: string | null;

  submitProduct: (
    payload: Omit<ProductSubmission, "id" | "submittedAt" | "status">
  ) => Promise<ProductSubmission>;

  approve: (id: string) => Promise<void>;
  reject: (id: string, note: string) => Promise<void>;
  requestChanges: (id: string, note: string) => Promise<void>;
}

/**
 * Product submissions flow: seller submits → pending review →
 * admin approves / rejects / requests changes. Approved products
 * become READY FOR AUCTION and surface on the homepage.
 */
export const useProductsStore = create<ProductsState>((set, get) => ({
  submissions: [],
  submitting: false,
  lastSubmittedId: null,

  submitProduct: async (payload) => {
    set({ submitting: true });
    const sub = await productsApi.submit(payload);
    set((s) => ({
      submissions: [sub, ...s.submissions],
      submitting: false,
      lastSubmittedId: sub.id,
    }));
    return sub;
  },

  approve: async (id) => {
    const sub = get().submissions.find((s) => s.id === id);
    await import("@/services/api").then((m) => m.adminApi.approve(id));
    set((s) => ({
      submissions: s.submissions.map((x) =>
        x.id === id ? { ...x, status: "ready_for_auction" } : x
      ),
    }));
    if (sub) {
      realtimeBus.emit("PRODUCT_APPROVED", { submissionId: id, title: sub.title });
    }
  },

  reject: async (id, note) => {
    const sub = get().submissions.find((s) => s.id === id);
    await import("@/services/api").then((m) => m.adminApi.reject(id, note));
    set((s) => ({
      submissions: s.submissions.map((x) =>
        x.id === id ? { ...x, status: "rejected", adminNote: note } : x
      ),
    }));
    if (sub) {
      realtimeBus.emit("PRODUCT_REJECTED", { submissionId: id, title: sub.title, note });
    }
  },

  requestChanges: async (id, note) => {
    const sub = get().submissions.find((s) => s.id === id);
    await import("@/services/api").then((m) => m.adminApi.requestChanges(id, note));
    set((s) => ({
      submissions: s.submissions.map((x) =>
        x.id === id ? { ...x, status: "changes_requested", adminNote: note } : x
      ),
    }));
    if (sub) {
      realtimeBus.emit("PRODUCT_REJECTED", { submissionId: id, title: sub.title, note });
    }
  },
}));
