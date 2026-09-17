"use client";

import {
  AuthError,
  type AuthErrorCode,
  usernameFromIdentity,
  type AdminCredentials,
  type AuthProvider,
  type AuthResult,
  type PasswordCredentials,
  type SignUpInput,
} from "./types";

const USERS_KEY = "bidforge.demoUsers";
const DELAY_MIN_MS = 650;
const DELAY_MAX_MS = 1150;

/**
 * Offline fallback so the sign-in experience works with the engine down.
 * The organizer identity mirrors the seeded backend account; a real
 * deployment verifies this server-side (BackendAuthProvider does).
 */
const DEMO_ORGANIZER = {
  userId: "ananta@bit",
  password: "synora#2026",
};

interface DemoUser {
  id: string;
  username: string;
  name: string;
  password: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function networkDelay(): number {
  return DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
}

function readUsers(): DemoUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as DemoUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: DemoUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function fail(code: AuthErrorCode, message: string): never {
  throw new AuthError(code, message);
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `u_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/** Frontend-only provider simulating latency; users persist in localStorage. */
export class DemoAuthProvider implements AuthProvider {
  async signInWithPassword({ email, password }: PasswordCredentials): Promise<AuthResult> {
    await sleep(networkDelay());
    const username = usernameFromIdentity(email);
    const user = readUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) fail("auth/user-not-found", "No account found for this email. Create one below.");
    if (user.password !== password) fail("auth/invalid-credentials", "Incorrect email or password.");
    return { user: { id: user.id, email: email.trim(), name: user.name, role: "user" }, token: "demo-token" };
  }

  async signUpWithPassword({ name, email, password }: SignUpInput): Promise<AuthResult> {
    await sleep(networkDelay());
    const username = usernameFromIdentity(email);
    const users = readUsers();
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      fail("auth/email-in-use", "An account with this email already exists. Try signing in.");
    }
    const user: DemoUser = { id: uuid(), username, name: name.trim(), password };
    users.push(user);
    writeUsers(users);
    return { user: { id: user.id, email: email.trim(), name: user.name, role: "user" }, token: "demo-token" };
  }

  async signInWithGoogle(): Promise<AuthResult> {
    throw new AuthError(
      "auth/google-unavailable",
      "Google sign-in isn't available in this demo — use email and password.",
    );
  }

  async signInAsAdmin({ userId, password }: AdminCredentials): Promise<AuthResult> {
    await sleep(networkDelay());
    const idOk = userId.trim().toLowerCase() === DEMO_ORGANIZER.userId;
    const passOk = password === DEMO_ORGANIZER.password;
    if (!idOk || !passOk) fail("auth/invalid-admin-code", "Invalid user ID or password.");
    return {
      user: { id: "organizer", email: "organizer@bidforge.local", name: "Organizer", role: "admin" },
      token: "demo-admin-token",
    };
  }
}
