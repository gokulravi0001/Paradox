import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { fetchDiscordMessage, fetchGuildChannels } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  const messageId = searchParams.get("messageId");

  if (!channelId || !messageId) {
    return NextResponse.json(
      { error: "Both channelId and messageId query parameters are required" },
      { status: 400 }
    );
  }

  // Resolve channel
  let resolvedChannelId = channelId.trim().replace(/^#/, "");
  if (!/^\d{17,21}$/.test(resolvedChannelId)) {
    const channels = await fetchGuildChannels(guildId);
    const match = channels.find(
      (c) => c.id === resolvedChannelId || c.name.toLowerCase() === resolvedChannelId.toLowerCase()
    );
    if (match) {
      resolvedChannelId = match.id;
    }
  }

  const result = await fetchDiscordMessage(resolvedChannelId, messageId.trim());

  if (!result.success || !result.message) {
    return NextResponse.json(
      { error: result.error || "Failed to fetch message from Discord" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    channelId: resolvedChannelId,
    messageId: messageId.trim(),
    message: result.message,
  });
}
