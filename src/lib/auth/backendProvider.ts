"use client";

import { backendApi, backendReachable, type BackendTokenResponse } from "@/lib/backend";
import {
  AuthError,
  usernameFromIdentity,
  type AdminCredentials,
  type AuthProvider,
  type AuthResult,
  type PasswordCredentials,
  type SignUpInput,
} from "./types";

function toAuthError(error: unknown, fallbackMessage: string): AuthError {
  const err = error as { status?: number; code?: string };
  if (err?.status === 401) {
    return new AuthError("auth/invalid-credentials", "Incorrect user ID or password.");
  }
  if (err?.status === 409) {
    return new AuthError("auth/email-in-use", "An account with this name already exists. Try signing in.");
  }
  return new AuthError("auth/unknown", fallbackMessage);
}

function toResult(session: BackendTokenResponse): AuthResult {
  return {
    user: {
      id: session.user_id,
      email: `${session.username}@bidforge.local`,
      name: session.username,
      role: session.role === "ADMIN" ? "admin" : "user",
    },
    token: session.access_token,
  };
}

/**
 * Talks to the FastAPI bid engine: real JWT sessions, real user rows,
 * real ADMIN role checks. Organizer sign-in is the same login endpoint —
 * the provider simply rejects non-ADMIN accounts.
 */
export class BackendAuthProvider implements AuthProvider {
  async signInWithPassword({ email, password }: PasswordCredentials): Promise<AuthResult> {
    try {
      const session = await backendApi<BackendTokenResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { username: usernameFromIdentity(email), password },
        auth: false,
      });
      return toResult(session);
    } catch (error) {
      throw toAuthError(error, "Unable to sign in right now — try again.");
    }
  }

  async signUpWithPassword({ email, password }: SignUpInput): Promise<AuthResult> {
    try {
      const session = await backendApi<BackendTokenResponse>("/api/v1/auth/register", {
        method: "POST",
        body: { username: usernameFromIdentity(email), password },
        auth: false,
      });
      return toResult(session);
    } catch (error) {
      throw toAuthError(error, "Unable to create the account right now — try again.");
    }
  }

  async signInWithGoogle(): Promise<AuthResult> {
    // OAuth needs a registered client id + redirect endpoint on the engine;
    // surfaced honestly instead of silently faking a session.
    throw new AuthError(
      "auth/google-unavailable",
      "Google sign-in isn't wired to the engine yet — use email and password.",
    );
  }

  async signInAsAdmin({ userId, password }: AdminCredentials): Promise<AuthResult> {
    try {
      const session = await backendApi<BackendTokenResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { username: userId.trim(), password },
        auth: false,
      });
      if (session.role !== "ADMIN") {
        throw new AuthError("auth/not-admin", "This account doesn't have organizer access.");
      }
      return toResult(session);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw toAuthError(error, "Unable to verify organizer access — try again.");
    }
  }
}

export async function isBackendAuthAvailable(): Promise<boolean> {
  return backendReachable();
}
