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
    const giveaways = await prisma.giveaway.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ giveaways });
  } catch (err) {
    console.error("[API:Giveaways:GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch giveaways" }, { status: 500 });
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
      prize,
      description,
      winnersCount = 1,
      durationMinutes = 60,
      endsAt: customEndsAt,
      requiredRoleId,
    } = body;

    if (!channelId || !prize) {
      return NextResponse.json({ error: "Channel and prize are required." }, { status: 400 });
    }

    const calculatedEndsAt = customEndsAt
      ? new Date(customEndsAt)
      : new Date(Date.now() + durationMinutes * 60 * 1000);

    const endTimestampSeconds = Math.floor(calculatedEndsAt.getTime() / 1000);

    // Post Discord Giveaway Embed with Button
    const res = await postDiscordMessage(channelId, {
      embeds: [
        {
          title: `🎉 GIVEAWAY: ${prize}`,
          description: [
            description || "Click the button below to enter the giveaway!",
            "",
            `• **Winners:** ${winnersCount}`,
            `• **Ends:** <t:${endTimestampSeconds}:R> (<t:${endTimestampSeconds}:F>)`,
            requiredRoleId ? `• **Requirement:** Must have <@&${requiredRoleId}>` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          color: 0x5865f2,
          footer: { text: "Paradox Giveaways • Good Luck!" },
          timestamp: calculatedEndsAt.toISOString(),
        },
      ],
      components: [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 1, // Primary Blurple
              label: "Enter Giveaway",
              emoji: { name: "🎉" },
              custom_id: `giveaway_enter_${Date.now()}`,
            },
          ],
        },
      ],
    });

    const giveaway = await prisma.giveaway.create({
      data: {
        guildId,
        channelId,
        messageId: res.id,
        prize,
        description: description || null,
        winnersCount: Number(winnersCount),
        endsAt: calculatedEndsAt,
        requiredRoleId: requiredRoleId || null,
        status: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "START_GIVEAWAY",
        details: JSON.stringify({ prize, channelId, messageId: res.id }),
      },
    });

    return NextResponse.json({ success: true, giveaway }, { status: 201 });
  } catch (err: unknown) {
    console.error("[API:Giveaways:POST] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start giveaway" },
      { status: 500 }
    );
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
    const { id, action } = body; // action = "END" | "REROLL"

    const giveaway = await prisma.giveaway.findFirst({
      where: { id, guildId },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
    }

    if (action === "END") {
      const updated = await prisma.giveaway.update({
        where: { id },
        data: { status: "ENDED" },
      });
      return NextResponse.json({ success: true, giveaway: updated });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API:Giveaways:PUT] Error:", err);
    return NextResponse.json({ error: "Failed to update giveaway" }, { status: 500 });
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
    return NextResponse.json({ error: "Giveaway ID is required" }, { status: 400 });
  }

  try {
    await prisma.giveaway.deleteMany({
      where: { id, guildId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API:Giveaways:DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to delete giveaway" }, { status: 500 });
  }
}
