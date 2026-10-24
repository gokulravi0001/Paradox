import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { postDiscordMessage } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { id: guildId },
      select: {
        goodbyeEnabled: true,
        goodbyeChannelId: true,
        goodbyeMessage: true,
        goodbyeEmbed: true,
      },
    });

    return NextResponse.json({
      config: config || {
        goodbyeEnabled: false,
        goodbyeChannelId: null,
        goodbyeMessage: "{user.name} has left {server.name}. We now have {server.member_count} members remaining.",
        goodbyeEmbed: null,
      },
    });
  } catch (err) {
    console.error("[API:Goodbye:GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch goodbye config" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const { goodbyeEnabled, goodbyeChannelId, goodbyeMessage, goodbyeEmbed } = body;

    const updated = await prisma.guildConfig.upsert({
      where: { id: guildId },
      update: {
        goodbyeEnabled: Boolean(goodbyeEnabled),
        goodbyeChannelId: goodbyeChannelId || null,
        goodbyeMessage: goodbyeMessage || null,
        goodbyeEmbed: goodbyeEmbed ? JSON.stringify(goodbyeEmbed) : null,
      },
      create: {
        id: guildId,
        name: "Discord Server",
        goodbyeEnabled: Boolean(goodbyeEnabled),
        goodbyeChannelId: goodbyeChannelId || null,
        goodbyeMessage: goodbyeMessage || null,
        goodbyeEmbed: goodbyeEmbed ? JSON.stringify(goodbyeEmbed) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "UPDATE_GOODBYE_CONFIG",
        details: JSON.stringify({ goodbyeEnabled, goodbyeChannelId }),
      },
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    console.error("[API:Goodbye:PUT] Error:", err);
    return NextResponse.json({ error: "Failed to save goodbye configuration" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const { channelId, message, embed } = body;

    if (!channelId) {
      return NextResponse.json({ error: "Please select a channel first." }, { status: 400 });
    }

    const formattedContent = (message || "{user.name} has left {server.name}. (Test Goodbye Message)")
      .replace(/{user\.name}/g, auth.context!.user.username)
      .replace(/{server\.name}/g, "Discord Server")
      .replace(/{server\.member_count}/g, "99");

    let embedPayload = undefined;
    if (embed && (embed.title || embed.description)) {
      embedPayload = {
        title: embed.title || undefined,
        description: embed.description
          ?.replace(/{user\.name}/g, auth.context!.user.username)
          .replace(/{server\.name}/g, "Discord Server"),
        color: embed.color ? parseInt(embed.color.replace("#", ""), 16) : 0xda373c,
        image: embed.imageUrl ? { url: embed.imageUrl } : undefined,
        thumbnail: embed.thumbnailUrl ? { url: embed.thumbnailUrl } : undefined,
        footer: embed.footerText ? { text: embed.footerText } : undefined,
      };
    }

    const result = await postDiscordMessage(channelId, {
      content: formattedContent,
      embeds: embedPayload ? [embedPayload] : undefined,
    });

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (err: unknown) {
    console.error("[API:Goodbye:POST:Test] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send test goodbye message" },
      { status: 500 }
    );
  }
}
