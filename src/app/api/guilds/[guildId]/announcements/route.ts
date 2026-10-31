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
    const announcements = await prisma.announcement.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ announcements });
  } catch (err) {
    console.error("[API:Announcements:GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
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
    const {
      channelId,
      title,
      content = "",
      embed,
      mentionType = "NONE",
      mentionRoleId,
      publishNow = true,
      scheduledAt,
    } = body;

    if (!channelId) {
      return NextResponse.json({ error: "Destination channel is required." }, { status: 400 });
    }

    const targetGuild = auth.context!.guild;
    const serverName = targetGuild?.name || "Discord Server";
    const userDisplayName = auth.context!.user.global_name || auth.context!.user.username;
    const userAvatarUrl = auth.context!.user.avatar
      ? `https://cdn.discordapp.com/avatars/${auth.context!.user.id}/${auth.context!.user.avatar}.png?size=256`
      : "https://cdn.discordapp.com/embed/avatars/0.png";
    const serverIconUrl = targetGuild?.icon
      ? `https://cdn.discordapp.com/icons/${targetGuild.id}/${targetGuild.icon}.png?size=256`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    const resolveTags = (str?: string | null): string | undefined => {
      if (!str) return undefined;
      return str
        .replace(/{user\.mention}/g, `<@${auth.context!.user.id}>`)
        .replace(/{user\.displayName}/gi, userDisplayName)
        .replace(/{user\.display_name}/gi, userDisplayName)
        .replace(/{user\.name}/g, userDisplayName)
        .replace(/{user\.username}/g, auth.context!.user.username)
        .replace(/{user\.tag}/g, `@${auth.context!.user.username}`)
        .replace(/{user\.handle}/g, `@${auth.context!.user.username}`)
        .replace(/{user\.avatar}/g, userAvatarUrl)
        .replace(/{user\.pfp}/g, userAvatarUrl)
        .replace(/{user\.id}/g, auth.context!.user.id)
        .replace(/{server\.name}/g, serverName)
        .replace(/{server\.icon}/g, serverIconUrl);
    };

    let mentionPrefix = "";
    if (mentionType === "EVERYONE") mentionPrefix = "@everyone\n";
    if (mentionType === "HERE") mentionPrefix = "@here\n";
    if (mentionType === "ROLE" && mentionRoleId) mentionPrefix = `<@&${mentionRoleId}>\n`;

    let publishedMessageId = null;

    if (publishNow) {
      const fullContent = mentionPrefix + (resolveTags(content) || "");

      let embedData = undefined;
      if (embed && (embed.title || embed.description || embed.authorName)) {
        let resAuthor = resolveTags(embed.authorName);
        if (resAuthor) resAuthor = resAuthor.replace(/<@!?\d+>/g, `@${userDisplayName}`);
        let resTitle = resolveTags(embed.title);
        if (resTitle) resTitle = resTitle.replace(/<@!?\d+>/g, `@${userDisplayName}`);

        embedData = {
          title: resTitle || undefined,
          description: resolveTags(embed.description) || undefined,
          color: embed.color ? parseInt(embed.color.replace("#", ""), 16) : 0x5865f2,
          author: resAuthor ? { name: resAuthor, icon_url: resolveTags(embed.authorIconUrl) || userAvatarUrl } : undefined,
          image: embed.imageUrl ? { url: resolveTags(embed.imageUrl) } : undefined,
          thumbnail: embed.thumbnailUrl ? { url: resolveTags(embed.thumbnailUrl) } : undefined,
          footer: embed.footerText ? { text: resolveTags(embed.footerText) } : undefined,
          timestamp: embed.timestamp ? new Date().toISOString() : undefined,
        };
      }

      const res = await postDiscordMessage(channelId, {
        content: fullContent || undefined,
        embeds: embedData ? [embedData] : undefined,
      });

      publishedMessageId = res.id;
    }

    const announcement = await prisma.announcement.create({
      data: {
        guildId,
        channelId,
        title: title || "Broadcast Announcement",
        content: content || "",
        embed: embed ? JSON.stringify(embed) : null,
        mentionType,
        mentionRoleId: mentionRoleId || null,
        status: publishNow ? "PUBLISHED" : scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: publishNow ? new Date() : null,
        messageId: publishedMessageId,
      },
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: publishNow ? "PUBLISH_ANNOUNCEMENT" : "DRAFT_ANNOUNCEMENT",
        details: JSON.stringify({
          channelId,
          title,
          mentionType,
          messageId: publishedMessageId,
        }),
      },
    });

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (err: unknown) {
    console.error("[API:Announcements:POST] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process announcement" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
  }

  try {
    await prisma.announcement.deleteMany({
      where: { id, guildId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API:Announcements:DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
