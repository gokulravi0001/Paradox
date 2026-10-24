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

    let mentionPrefix = "";
    if (mentionType === "EVERYONE") mentionPrefix = "@everyone\n";
    if (mentionType === "HERE") mentionPrefix = "@here\n";
    if (mentionType === "ROLE" && mentionRoleId) mentionPrefix = `<@&${mentionRoleId}>\n`;

    let publishedMessageId = null;

    if (publishNow) {
      const fullContent = mentionPrefix + (content || "");

      let embedData = undefined;
      if (embed && (embed.title || embed.description)) {
        embedData = {
          title: embed.title || undefined,
          description: embed.description || undefined,
          color: embed.color ? parseInt(embed.color.replace("#", ""), 16) : 0x5865f2,
          image: embed.imageUrl ? { url: embed.imageUrl } : undefined,
          thumbnail: embed.thumbnailUrl ? { url: embed.thumbnailUrl } : undefined,
          footer: embed.footerText ? { text: embed.footerText } : undefined,
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
