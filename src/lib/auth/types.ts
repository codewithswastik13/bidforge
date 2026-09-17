/* ============================================================
 * BIDFORGE — auth provider seam
 *
 * The single seam between the auth UI and any real backend, ported
 * from the merged login design. Implementations:
 *   - BackendAuthProvider: the FastAPI bid engine (JWT, real users)
 *   - DemoAuthProvider:    offline fallback (localStorage users)
 * Swap or extend here — no UI component needs to change.
 * ============================================================ */

export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthResult {
  user: AuthUser;
  /** Opaque session token — the backend provider returns a real JWT. */
  token?: string;
}

export interface PasswordCredentials {
  email: string;
  password: string;
}

export interface SignUpInput extends PasswordCredentials {
  name: string;
}

export interface AdminCredentials {
  /** Organizer identifier (demo: ananta@bit). */
  userId: string;
  password: string;
}

export interface AuthProvider {
  signInWithPassword(input: PasswordCredentials): Promise<AuthResult>;
  signUpWithPassword(input: SignUpInput): Promise<AuthResult>;
  signInWithGoogle(): Promise<AuthResult>;
  signInAsAdmin(input: AdminCredentials): Promise<AuthResult>;
}

export type AuthErrorCode =
  | 'auth/invalid-email'
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/invalid-credentials'
  | 'auth/email-in-use'
  | 'auth/weak-password'
  | 'auth/popup-failed'
  | 'auth/invalid-admin-code'
  | 'auth/not-admin'
  | 'auth/google-unavailable'
  | 'auth/unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** "alice@bidforge.local" -> "alice"; plain "alice" passes through. */
export function usernameFromIdentity(identity: string): string {
  const trimmed = identity.trim();
  return trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
}
