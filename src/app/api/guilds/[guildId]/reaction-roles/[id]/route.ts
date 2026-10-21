import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { ReactionRoleSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { guildId: string; id: string } }
) {
  const { guildId, id } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const existing = await prisma.reactionRole.findUnique({
      where: { id },
    });

    if (!existing || existing.guildId !== guildId) {
      return NextResponse.json({ error: "Reaction role mapping not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = ReactionRoleSchema.partial().safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.reactionRole.update({
      where: { id },
      data: {
        ...validated.data,
      },
    });

    return NextResponse.json({ success: true, reactionRole: updated });
  } catch (err) {
    console.error(`[API:ReactionRole:PUT] Error updating:`, err);
    return NextResponse.json({ error: "Failed to update reaction role" }, { status: 500 });
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
    const existing = await prisma.reactionRole.findUnique({
      where: { id },
    });

    if (!existing || existing.guildId !== guildId) {
      return NextResponse.json({ error: "Reaction role mapping not found" }, { status: 404 });
    }

    await prisma.reactionRole.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "DELETE_REACTION_ROLE",
        details: JSON.stringify({ id, roleName: existing.roleName, emoji: existing.emoji }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[API:ReactionRole:DELETE] Error deleting:`, err);
    return NextResponse.json({ error: "Failed to delete reaction role" }, { status: 500 });
  }
}
