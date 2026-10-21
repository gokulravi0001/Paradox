import { NextResponse } from "next/server";
import { generateOAuthState, AUTH_COOKIE_CONFIG } from "@/lib/auth";
import { getDiscordOAuthUrl } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = generateOAuthState();
  const oauthUrl = getDiscordOAuthUrl(state);

  const response = NextResponse.redirect(oauthUrl);

  // Store state in secure HTTP-only cookie for verification in callback
  response.cookies.set(
    AUTH_COOKIE_CONFIG.stateCookieName,
    state,
    AUTH_COOKIE_CONFIG.stateCookieOptions
  );

  return response;
}
