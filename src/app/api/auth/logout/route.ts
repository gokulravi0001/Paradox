import { NextResponse } from "next/server";
import { AUTH_COOKIE_CONFIG } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = NextResponse.redirect(`${baseUrl}/`);
  response.cookies.delete(AUTH_COOKIE_CONFIG.sessionCookieName);
  return response;
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = NextResponse.redirect(`${baseUrl}/`);
  response.cookies.delete(AUTH_COOKIE_CONFIG.sessionCookieName);
  return response;
}
