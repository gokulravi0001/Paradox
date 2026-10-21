import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { ReactionRoleSchema } from "@/lib/validations";
import { fetchGuildRoles, fetchBotMember } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const reactionRoles = await prisma.reactionRole.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reactionRoles });
  } catch (err) {
    console.error(`[API:ReactionRoles] Error fetching reaction roles:`, err);
    return NextResponse.json({ error: "Failed to fetch reaction roles" }, { status: 500 });
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
    const validated = ReactionRoleSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { channelId, messageId, emoji, roleId, roleName, description, type, imageUrl, bannerUrl, confirmGif, buttonStyle } = validated.data;

    // 1. Verify Bot Role Hierarchy Check:
    // Bot must have a higher role position than the role being assigned!
    const [roles, botMember] = await Promise.all([
      fetchGuildRoles(guildId),
      fetchBotMember(guildId),
    ]);

    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) {
      return NextResponse.json(
        { error: "The selected role was not found in this Discord server." },
        { status: 400 }
      );
    }

    if (targetRole.managed) {
      return NextResponse.json(
        { error: "Cannot assign a managed/integration role (e.g., bot roles or booster roles)." },
        { status: 400 }
      );
    }

    if (botMember && targetRole.position >= botMember.highestPosition) {
      return NextResponse.json(
        {
          error: `Permission error: The role '${targetRole.name}' is higher than or equal to the bot's highest role. In Discord Server Settings -> Roles, please drag the bot's role ABOVE '${targetRole.name}'.`,
        },
        { status: 400 }
      );
    }

    // 2. Check for duplicate mapping on the same message
    const existing = await prisma.reactionRole.findFirst({
      where: {
        messageId,
        emoji,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Emoji '${emoji}' is already mapped to role '${existing.roleName}' on this message.` },
        { status: 409 }
      );
    }

    // 3. Save mapping in database
    const reactionRole = await prisma.reactionRole.create({
      data: {
        guildId,
        channelId,
        messageId,
        emoji,
        roleId,
        roleName: targetRole.name || roleName,
        description: description || null,
        type: type || "REACTION",
        imageUrl: imageUrl || null,
        bannerUrl: bannerUrl || null,
        confirmGif: confirmGif || null,
        buttonStyle: buttonStyle || "PRIMARY",
      },
    });

    // 4. Record audit log
    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "CREATE_REACTION_ROLE",
        details: JSON.stringify({ messageId, emoji, roleId, roleName }),
      },
    });

    return NextResponse.json({ success: true, reactionRole }, { status: 201 });
  } catch (err: unknown) {
    console.error(`[API:ReactionRoles] Error creating reaction role:`, err);
    return NextResponse.json({ error: "Failed to create reaction role mapping." }, { status: 500 });
  }
}
