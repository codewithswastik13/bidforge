"use client";

import { create } from "zustand";
import type { UserProfile } from "@/lib/types";
import { SEED_USER } from "@/lib/mock-data";

type Role = "guest" | "user" | "admin";

interface AuthState {
  role: Role;
  user: UserProfile | null;
  email: string;
  login: (email: string) => void;
  loginAdmin: (email: string) => void;
  signup: (email: string) => void;
  logout: () => void;
}

/**
 * Mock auth. The real authentication backend plugs in later;
 * the UI only depends on `role` and `user`.
 */
export const useAuthStore = create<AuthState>((set) => ({
  role: "guest",
  user: null,
  email: "",

  login: (email) =>
    set({ role: "user", email, user: SEED_USER }),
  loginAdmin: (email) =>
    set({ role: "admin", email, user: SEED_USER }),
  signup: (email) =>
    set({ role: "user", email, user: SEED_USER }),
  logout: () =>
    set({ role: "guest", user: null, email: "" }),
}));
