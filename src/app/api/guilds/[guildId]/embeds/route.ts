import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { EmbedSchema, validateDiscordEmbed } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const embeds = await prisma.embedTemplate.findMany({
      where: { guildId },
      orderBy: { updatedAt: "desc" },
    });

    const parsed = embeds.map((e) => ({
      ...e,
      fields: JSON.parse(e.fields || "[]"),
    }));

    return NextResponse.json({ embeds: parsed });
  } catch (err) {
    console.error(`[API:Embeds] Error fetching embed templates:`, err);
    return NextResponse.json({ error: "Failed to fetch embed templates" }, { status: 500 });
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
    const validated = EmbedSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Discord embed limit checks
    const embedValidation = validateDiscordEmbed(data);
    if (!embedValidation.valid) {
      return NextResponse.json(
        { error: "Discord Embed Limit Exceeded", details: embedValidation.errors },
        { status: 400 }
      );
    }

    const template = await prisma.embedTemplate.create({
      data: {
        guildId,
        name: data.name,
        title: data.title || null,
        description: data.description || null,
        url: data.url || null,
        color: data.color || "#5865F2",
        authorName: data.authorName || null,
        authorUrl: data.authorUrl || null,
        authorIconUrl: data.authorIconUrl || null,
        footerText: data.footerText || null,
        footerIconUrl: data.footerIconUrl || null,
        timestamp: !!data.timestamp,
        thumbnailUrl: data.thumbnailUrl || null,
        imageUrl: data.imageUrl || null,
        fields: JSON.stringify(data.fields || []),
      },
    });

    return NextResponse.json(
      {
        success: true,
        embed: {
          ...template,
          fields: JSON.parse(template.fields),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(`[API:Embeds:POST] Error creating embed template:`, err);
    return NextResponse.json({ error: "Failed to save embed template" }, { status: 500 });
  }
}
