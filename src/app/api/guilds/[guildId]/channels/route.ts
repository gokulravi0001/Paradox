import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { fetchGuildChannels } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const channels = await fetchGuildChannels(guildId);
    return NextResponse.json({ channels });
  } catch (err) {
    console.error(`[API:Channels] Error fetching channels for ${guildId}:`, err);
    return NextResponse.json({ error: "Failed to fetch guild channels" }, { status: 500 });
  }
}
