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
    const stickyMessages = await prisma.stickyMessage.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ stickyMessages });
  } catch (err) {
    console.error("[API:StickyMessages:GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch sticky messages" }, { status: 500 });
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
    const { channelId, content, embed, enabled = true, postNow = true } = body;

    if (!channelId || (!content && !embed)) {
      return NextResponse.json({ error: "Channel and content or embed are required." }, { status: 400 });
    }

    let messageId: string | null = null;

    if (postNow) {
      let embedData = undefined;
      if (embed && (embed.title || embed.description)) {
        embedData = {
          title: embed.title || undefined,
          description: embed.description || undefined,
          color: embed.color ? parseInt(embed.color.replace("#", ""), 16) : 0x5865f2,
        };
      }

      const res = await postDiscordMessage(channelId, {
        content: content ? `📌 **Sticky Message:**\n${content}` : undefined,
        embeds: embedData ? [embedData] : undefined,
      }).catch(() => null);

      if (res) messageId = res.id;
    }

    const sticky = await prisma.stickyMessage.upsert({
      where: { channelId },
      update: {
        content: content || null,
        embed: embed ? JSON.stringify(embed) : null,
        enabled: Boolean(enabled),
        messageId,
      },
      create: {
        guildId,
        channelId,
        content: content || null,
        embed: embed ? JSON.stringify(embed) : null,
        enabled: Boolean(enabled),
        messageId,
      },
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "SET_STICKY_MESSAGE",
        details: JSON.stringify({ channelId, enabled }),
      },
    });

    return NextResponse.json({ success: true, stickyMessage: sticky });
  } catch (err) {
    console.error("[API:StickyMessages:POST] Error:", err);
    return NextResponse.json({ error: "Failed to save sticky message" }, { status: 500 });
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
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await prisma.stickyMessage.deleteMany({
      where: { id, guildId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API:StickyMessages:DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to delete sticky message" }, { status: 500 });
  }
}
