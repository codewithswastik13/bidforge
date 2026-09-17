"use client";

import { create } from "zustand";
import type { UserProfile } from "@/lib/types";
import { SEED_USER } from "@/lib/mock-data";
import { getToken, setToken } from "@/lib/backend";

type Role = "guest" | "user" | "admin";

interface PersistedSession {
  role: Role;
  userId: string;
  username: string;
}

const SESSION_KEY = "bidforge.session";

function readPersisted(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PersistedSession) : null;
  } catch {
    return null;
  }
}

function writePersisted(session: PersistedSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

interface BackendSession {
  token: string;
  userId: string;
  username: string;
  role: "BIDDER" | "ADMIN";
}

interface AuthState {
  role: Role;
  user: UserProfile | null;
  email: string;
  /** engine identity — set when the backend bridge issued a JWT */
  token: string | null;
  backendId: string | null;
  backendUsername: string | null;
  login: (email: string) => void;
  loginAdmin: (email: string) => void;
  signup: (email: string) => void;
  loginWithBackend: (session: BackendSession) => void;
  logout: () => void;
}

/**
 * Auth store. With the engine reachable, the login screens exchange real
 * credentials for a JWT via `loginWithBackend`; the mock actions
 * remain as the offline fallback. The UI only depends on `role`
 * and `user`.
 */
export const useAuthStore = create<AuthState>((set) => {
  const persisted = readPersisted();
  const restoredToken = typeof window !== "undefined" ? getToken() : null;
  const sessionValid = Boolean(persisted && restoredToken && !restoredToken.startsWith("demo-"));
  return {
    role: sessionValid && persisted ? persisted.role : "guest",
    user:
      sessionValid && persisted
        ? { ...SEED_USER, name: persisted.username }
        : null,
    email:
      sessionValid && persisted
        ? persisted.username.includes("@")
          ? persisted.username
          : `${persisted.username}@bidforge.local`
        : "",
    token: restoredToken,
    backendId: sessionValid && persisted ? persisted.userId : null,
    backendUsername: sessionValid ? persisted?.username ?? null : null,

    login: (email) =>
      set({ role: "user", email, user: SEED_USER }),
    loginAdmin: (email) =>
      set({ role: "admin", email, user: SEED_USER }),
    signup: (email) =>
      set({ role: "user", email, user: SEED_USER }),

  loginWithBackend: ({ token, userId, username, role }) => {
    setToken(token);
    const nextRole: Role = role === "ADMIN" ? "admin" : "user";
    writePersisted({ role: nextRole, userId, username });
    set({
      token,
      backendId: userId,
      backendUsername: username,
      role: nextRole,
      user: { ...SEED_USER, name: username },
      email: username.includes("@") ? username : `${username}@bidforge.local`,
    });
  },

  logout: () => {
    setToken(null);
    writePersisted(null);
    set({
      role: "guest",
      user: null,
      email: "",
      token: null,
      backendId: null,
      backendUsername: null,
    });
  },
  };
});
