"use client";

import { backendReachable } from "@/lib/backend";
import { BackendAuthProvider } from "./backendProvider";
import { DemoAuthProvider } from "./demoProvider";
import type { AuthProvider } from "./types";

export * from "./types";

let provider: AuthProvider | null = null;

/**
 * Resolve the active auth provider: the real bid engine when it answers,
 * the local demo provider when it doesn't. Resolved once per page load —
 * restart the engine and reload to switch modes.
 */
export async function getAuthProvider(): Promise<AuthProvider> {
  if (provider) return provider;
  provider = (await backendReachable(true)) ? new BackendAuthProvider() : new DemoAuthProvider();
  return provider;
}

export { AuthError } from "./types";
