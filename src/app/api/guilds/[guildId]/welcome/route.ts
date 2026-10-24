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
        welcomeEnabled: true,
        welcomeChannelId: true,
        welcomeMessage: true,
        welcomeEmbed: true,
        welcomeDmEnabled: true,
        welcomeDmMessage: true,
        welcomeRoleId: true,
      },
    });

    return NextResponse.json({
      config: config || {
        welcomeEnabled: false,
        welcomeChannelId: null,
        welcomeMessage: "Welcome to {server.name}, {user.mention}! 🎉",
        welcomeEmbed: null,
        welcomeDmEnabled: false,
        welcomeDmMessage: null,
        welcomeRoleId: null,
      },
    });
  } catch (err) {
    console.error("[API:Welcome:GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch welcome config" }, { status: 500 });
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
    const {
      welcomeEnabled,
      welcomeChannelId,
      welcomeMessage,
      welcomeEmbed,
      welcomeDmEnabled,
      welcomeDmMessage,
      welcomeRoleId,
    } = body;

    const updated = await prisma.guildConfig.upsert({
      where: { id: guildId },
      update: {
        welcomeEnabled: Boolean(welcomeEnabled),
        welcomeChannelId: welcomeChannelId || null,
        welcomeMessage: welcomeMessage || null,
        welcomeEmbed: welcomeEmbed ? JSON.stringify(welcomeEmbed) : null,
        welcomeDmEnabled: Boolean(welcomeDmEnabled),
        welcomeDmMessage: welcomeDmMessage || null,
        welcomeRoleId: welcomeRoleId || null,
      },
      create: {
        id: guildId,
        name: "Discord Server",
        welcomeEnabled: Boolean(welcomeEnabled),
        welcomeChannelId: welcomeChannelId || null,
        welcomeMessage: welcomeMessage || null,
        welcomeEmbed: welcomeEmbed ? JSON.stringify(welcomeEmbed) : null,
        welcomeDmEnabled: Boolean(welcomeDmEnabled),
        welcomeDmMessage: welcomeDmMessage || null,
        welcomeRoleId: welcomeRoleId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "UPDATE_WELCOME_CONFIG",
        details: JSON.stringify({ welcomeEnabled, welcomeChannelId }),
      },
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    console.error("[API:Welcome:PUT] Error:", err);
    return NextResponse.json({ error: "Failed to save welcome configuration" }, { status: 500 });
  }
}

// Test send welcome message to channel
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

    // Resolve variables for test
    const formattedContent = (message || "Welcome to {server.name}, {user.mention}! 🎉 (Test Welcome Message)")
      .replace(/{user\.mention}/g, `<@${auth.context!.user.id}>`)
      .replace(/{user\.name}/g, auth.context!.user.username)
      .replace(/{server\.name}/g, "Discord Server")
      .replace(/{server\.member_count}/g, "100");

    let embedPayload = undefined;
    if (embed && (embed.title || embed.description)) {
      embedPayload = {
        title: embed.title || undefined,
        description: embed.description
          ?.replace(/{user\.mention}/g, `<@${auth.context!.user.id}>`)
          .replace(/{user\.name}/g, auth.context!.user.username)
          .replace(/{server\.name}/g, "Discord Server"),
        color: embed.color ? parseInt(embed.color.replace("#", ""), 16) : 0x5865f2,
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
    console.error("[API:Welcome:POST:Test] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send test welcome message" },
      { status: 500 }
    );
  }
}
