import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "longtua_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string; // auth_user_id
  username?: string;
  iat?: number;
  exp?: number;
}

function getSecretKey(): string {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing AUTH_SESSION_SECRET in environment variables.");
    }
    // Development fallback
    return "longtua-dev-secret-key-32-chars-long-minimum!";
  }
  return secret;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function signToken(payload: SessionPayload): string {
  const secret = getSecretKey();
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: SessionPayload = {
    ...payload,
    iat: payload.iat || now,
    exp: payload.exp || now + SESSION_MAX_AGE_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(data);
  const signature = base64UrlEncode(hmac.digest("base64"));

  return `${data}.${signature}`;
}

export function verifyToken(token: string): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const secret = getSecretKey();
  const data = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(data);
  const expectedSignature = base64UrlEncode(hmac.digest("base64"));

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Read the current session in Server Actions / Server Components
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyToken(cookie.value);
}

/**
 * Compatibility helper matching Supabase's `supabase.auth.getClaims()`
 */
export async function getClaims(): Promise<{
  data: { claims: { sub: string } | null };
  error: null;
}> {
  const session = await getSession();
  return {
    data: {
      claims: session?.sub ? { sub: session.sub } : null,
    },
    error: null,
  };
}

/**
 * Set the session cookie in Server Actions / Route Handlers
 */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clear the session cookie on logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
