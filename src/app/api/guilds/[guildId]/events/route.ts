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
    const events = await prisma.event.findMany({
      where: { guildId },
      orderBy: { startsAt: "asc" },
    });

    return NextResponse.json({ events });
  } catch (err) {
    console.error("[API:Events:GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
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
      title,
      description,
      startsAt,
      endsAt,
      location,
      voiceChannelId,
      channelId, // announcement destination channel
      imageUrl,
      timeZone = "UTC",
      announceNow = false,
    } = body;

    if (!title || !startsAt) {
      return NextResponse.json({ error: "Title and start date/time are required." }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        guildId,
        channelId: channelId || null,
        title,
        description: description || null,
        location: location || null,
        voiceChannelId: voiceChannelId || null,
        imageUrl: imageUrl || null,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        timeZone,
        status: "SCHEDULED",
      },
    });

    if (announceNow && channelId) {
      await postDiscordMessage(channelId, {
        embeds: [
          {
            title: `📅 Event Announcement: ${title}`,
            description: description || "Join us for our upcoming server event!",
            color: 0x5865f2,
            fields: [
              {
                name: "⏰ Start Time",
                value: `<t:${Math.floor(new Date(startsAt).getTime() / 1000)}:F> (<t:${Math.floor(new Date(startsAt).getTime() / 1000)}:R>)`,
                inline: true,
              },
              {
                name: "📍 Location",
                value: voiceChannelId ? `<#${voiceChannelId}>` : location || "Discord Server",
                inline: true,
              },
            ],
            image: imageUrl ? { url: imageUrl } : undefined,
            footer: { text: "Community Events • Paradox" },
          },
        ],
      }).catch(() => null);
    }

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "CREATE_EVENT",
        details: JSON.stringify({ title, startsAt, location }),
      },
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (err: unknown) {
    console.error("[API:Events:POST] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create event" },
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
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  try {
    await prisma.event.deleteMany({
      where: { id, guildId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API:Events:DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
