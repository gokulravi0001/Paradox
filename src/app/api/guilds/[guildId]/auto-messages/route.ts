import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const autoMessages = await prisma.autoMessage.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ autoMessages });
  } catch (err) {
    console.error("[API:AutoMessages:GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch auto messages" }, { status: 500 });
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
    const { channelId, name, intervalMinutes = 60, content, embed, enabled = true } = body;

    if (!channelId || !name) {
      return NextResponse.json({ error: "Channel and message name are required." }, { status: 400 });
    }

    const nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000);

    const autoMessage = await prisma.autoMessage.create({
      data: {
        guildId,
        channelId,
        name,
        intervalMinutes: Number(intervalMinutes),
        content: content || null,
        embed: embed ? JSON.stringify(embed) : null,
        enabled: Boolean(enabled),
        nextRunAt: nextRun,
      },
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "CREATE_AUTO_MESSAGE",
        details: JSON.stringify({ name, channelId, intervalMinutes }),
      },
    });

    return NextResponse.json({ success: true, autoMessage }, { status: 201 });
  } catch (err) {
    console.error("[API:AutoMessages:POST] Error:", err);
    return NextResponse.json({ error: "Failed to create auto message" }, { status: 500 });
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
    const { id, enabled, intervalMinutes, content, name } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updated = await prisma.autoMessage.update({
      where: { id },
      data: {
        ...(enabled !== undefined ? { enabled: Boolean(enabled) } : {}),
        ...(intervalMinutes ? { intervalMinutes: Number(intervalMinutes) } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(name ? { name } : {}),
      },
    });

    return NextResponse.json({ success: true, autoMessage: updated });
  } catch (err) {
    console.error("[API:AutoMessages:PUT] Error:", err);
    return NextResponse.json({ error: "Failed to update auto message" }, { status: 500 });
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
    await prisma.autoMessage.deleteMany({
      where: { id, guildId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API:AutoMessages:DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to delete auto message" }, { status: 500 });
  }
}
