import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "fallback-insecure-secret-for-dev-only-32-chars!";
const SESSION_COOKIE_NAME = "paradox_session";
const STATE_COOKIE_NAME = "paradox_oauth_state";

export interface SessionUser {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string | null;
  avatar?: string | null;
  accessToken: string;
}

export interface SessionPayload {
  user: SessionUser;
  exp: number;
  iat: number;
}

/**
 * Sign a session payload into a JWT token
 */
export function signSession(user: SessionUser): string {
  return jwt.sign({ user }, SESSION_SECRET, { expiresIn: "7d" });
}

/**
 * Verify and decode a JWT session token
 */
export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SESSION_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Get current session user from Next.js server context
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  const payload = verifySession(sessionCookie);
  if (!payload || !payload.user) return null;
  return payload.user;
}

/**
 * Generate a cryptographically secure random state parameter for OAuth2
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(24).toString("hex");
}

export const AUTH_COOKIE_CONFIG = {
  sessionCookieName: SESSION_COOKIE_NAME,
  stateCookieName: STATE_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  stateCookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  },
};
