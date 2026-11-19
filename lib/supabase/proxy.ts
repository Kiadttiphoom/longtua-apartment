import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { verifyToken, signToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const response = NextResponse.next({ request });

  if (sessionCookie?.value) {
    const payload = verifyToken(sessionCookie.value);
    if (payload) {
      // Re-sign if within 2 days of expiration to keep active users logged in
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp - now < 60 * 60 * 24 * 2) {
        const refreshedToken = signToken({
          sub: payload.sub,
          username: payload.username,
        });
        response.cookies.set(SESSION_COOKIE_NAME, refreshedToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    } else {
      // Invalid/expired token: clear the cookie
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
  }

  return response;
}
