import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { EmbedSchema, validateDiscordEmbed } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string; id: string } }
) {
  const { guildId, id } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const embed = await prisma.embedTemplate.findUnique({
      where: { id },
    });

    if (!embed || embed.guildId !== guildId) {
      return NextResponse.json({ error: "Embed template not found" }, { status: 404 });
    }

    return NextResponse.json({
      embed: {
        ...embed,
        fields: JSON.parse(embed.fields || "[]"),
      },
    });
  } catch (err) {
    console.error(`[API:Embed:GET] Error:`, err);
    return NextResponse.json({ error: "Failed to retrieve embed" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { guildId: string; id: string } }
) {
  const { guildId, id } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const existing = await prisma.embedTemplate.findUnique({
      where: { id },
    });

    if (!existing || existing.guildId !== guildId) {
      return NextResponse.json({ error: "Embed template not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = EmbedSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const data = validated.data;
    const embedValidation = validateDiscordEmbed(data);
    if (!embedValidation.valid) {
      return NextResponse.json(
        { error: "Discord Embed Limit Exceeded", details: embedValidation.errors },
        { status: 400 }
      );
    }

    const updated = await prisma.embedTemplate.update({
      where: { id },
      data: {
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

    return NextResponse.json({
      success: true,
      embed: {
        ...updated,
        fields: JSON.parse(updated.fields),
      },
    });
  } catch (err) {
    console.error(`[API:Embed:PUT] Error updating:`, err);
    return NextResponse.json({ error: "Failed to update embed template" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { guildId: string; id: string } }
) {
  const { guildId, id } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const existing = await prisma.embedTemplate.findUnique({
      where: { id },
    });

    if (!existing || existing.guildId !== guildId) {
      return NextResponse.json({ error: "Embed template not found" }, { status: 404 });
    }

    await prisma.embedTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[API:Embed:DELETE] Error deleting:`, err);
    return NextResponse.json({ error: "Failed to delete embed template" }, { status: 500 });
  }
}
