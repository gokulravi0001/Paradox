import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_CONFIG, signSession } from "@/lib/auth";
import { exchangeOAuthCode, fetchDiscordUser } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Handle Discord authorization cancel/error
  if (error) {
    console.warn(`[OAuth] Authorization error: ${error} - ${errorDescription}`);
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/?error=Missing+authorization+code+or+state`);
  }

  // Verify anti-CSRF state cookie
  const storedState = request.cookies.get(AUTH_COOKIE_CONFIG.stateCookieName)?.value;
  if (!storedState || storedState !== state) {
    console.warn("[OAuth] State mismatch or expired state cookie");
    return NextResponse.redirect(`${baseUrl}/?error=Invalid+session+state.+Please+try+logging+in+again.`);
  }

  try {
    // Exchange authorization code for access and refresh tokens
    const tokenData = await exchangeOAuthCode(code);

    // Fetch user profile from Discord
    const discordUser = await fetchDiscordUser(tokenData.access_token);

    // Upsert user in database
    const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    await prisma.user.upsert({
      where: { id: discordUser.id },
      update: {
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt,
      },
      create: {
        id: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt,
      },
    });

    // Create session token
    const sessionJwt = signSession({
      id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
      accessToken: tokenData.access_token,
    });

    const redirectResponse = NextResponse.redirect(`${baseUrl}/dashboard`);

    // Set session cookie
    redirectResponse.cookies.set(
      AUTH_COOKIE_CONFIG.sessionCookieName,
      sessionJwt,
      AUTH_COOKIE_CONFIG.cookieOptions
    );

    // Clear state cookie
    redirectResponse.cookies.delete(AUTH_COOKIE_CONFIG.stateCookieName);

    return redirectResponse;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[OAuth] Callback exception:", errorMsg);
    return NextResponse.redirect(`${baseUrl}/?error=Failed+to+complete+Discord+sign-in.+Please+try+again.`);
  }
}
