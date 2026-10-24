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
    const rules = await prisma.rule.findMany({
      where: { guildId },
      orderBy: { ruleNumber: "asc" },
    });

    return NextResponse.json({ rules });
  } catch (err) {
    console.error("[API:Rules:GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch server rules" }, { status: 500 });
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
    const { title, description, emoji = "📌", section = "General", ruleNumber } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    const count = await prisma.rule.count({ where: { guildId } });
    const finalNumber = ruleNumber || count + 1;

    const rule = await prisma.rule.create({
      data: {
        guildId,
        title,
        description,
        emoji,
        section,
        ruleNumber: finalNumber,
      },
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "CREATE_RULE",
        details: JSON.stringify({ title, ruleNumber: finalNumber }),
      },
    });

    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (err) {
    console.error("[API:Rules:POST] Error:", err);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}

// Publish rules to a Discord Channel
export async function PUT(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const { channelId, embedTitle = "📜 Official Server Rules", color = "#5865F2" } = body;

    if (!channelId) {
      return NextResponse.json({ error: "Destination channel is required" }, { status: 400 });
    }

    const rules = await prisma.rule.findMany({
      where: { guildId },
      orderBy: { ruleNumber: "asc" },
    });

    if (rules.length === 0) {
      return NextResponse.json({ error: "No rules to publish. Create some rules first!" }, { status: 400 });
    }

    // Construct Discord Embed fields from rules
    const fields = rules.map((r) => ({
      name: `${r.emoji || "📌"} Rule #${r.ruleNumber}: ${r.title}`,
      value: r.description,
      inline: false,
    }));

    const result = await postDiscordMessage(channelId, {
      embeds: [
        {
          title: embedTitle,
          description: "Please read and follow all community guidelines to keep our server safe and enjoyable for everyone.",
          color: parseInt(color.replace("#", ""), 16),
          fields,
          footer: { text: "Server Rules • Updated by Staff" },
          timestamp: new Date().toISOString(),
        },
      ],
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "PUBLISH_RULES",
        details: JSON.stringify({ channelId, messageId: result.id, rulesCount: rules.length }),
      },
    });

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (err: unknown) {
    console.error("[API:Rules:PUT:Publish] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to publish rules" },
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
    return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
  }

  try {
    await prisma.rule.deleteMany({
      where: { id, guildId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API:Rules:DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
