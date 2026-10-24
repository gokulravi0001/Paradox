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

    const userAvatarUrl = auth.context!.user.avatar
      ? `https://cdn.discordapp.com/avatars/${auth.context!.user.id}/${auth.context!.user.avatar}.png?size=256`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    const resolveTags = (str?: string | null): string | undefined => {
      if (!str) return undefined;
      return str
        .replace(/{user\.mention}/g, `<@${auth.context!.user.id}>`)
        .replace(/{user\.name}/g, auth.context!.user.username)
        .replace(/{user\.avatar}/g, userAvatarUrl)
        .replace(/{user\.pfp}/g, userAvatarUrl)
        .replace(/{user\.id}/g, auth.context!.user.id)
        .replace(/{server\.name}/g, "Discord Server")
        .replace(/{server\.member_count}/g, "100");
    };

    const formattedContent = resolveTags(message || "Welcome to {server.name}, {user.mention}! 🎉 (Test Welcome Message)");

    let embedPayload = undefined;
    if (embed && (embed.title || embed.description || embed.authorName || embed.thumbnailUrl)) {
      const resolvedThumb = resolveTags(embed.thumbnailUrl);
      const resolvedImg = resolveTags(embed.imageUrl);
      const resolvedAuthorIcon = resolveTags(embed.authorIconUrl);
      const resolvedAuthorName = resolveTags(embed.authorName);

      embedPayload = {
        title: resolveTags(embed.title),
        description: resolveTags(embed.description),
        color: embed.color ? parseInt(embed.color.replace("#", ""), 16) : 0x5865f2,
        author: resolvedAuthorName
          ? {
              name: resolvedAuthorName,
              icon_url: resolvedAuthorIcon || undefined,
            }
          : undefined,
        image: resolvedImg ? { url: resolvedImg } : undefined,
        thumbnail: resolvedThumb ? { url: resolvedThumb } : undefined,
        footer: embed.footerText ? { text: resolveTags(embed.footerText) || "" } : undefined,
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
