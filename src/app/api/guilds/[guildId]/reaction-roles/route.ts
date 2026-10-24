import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { ReactionRoleSchema } from "@/lib/validations";
import { fetchGuildRoles, fetchBotMember, fetchGuildChannels, deleteDiscordMessage, DiscordChannel } from "@/lib/discord";

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

    const { channelId, messageId, emoji, roleId, roleName, description, type, mode = "TOGGLE", requiredRoleId, imageUrl, bannerUrl, confirmGif, buttonStyle } = validated.data;

    let resolvedChannelId = channelId.trim().replace(/^#/, "");
    if (!/^\d{17,21}$/.test(resolvedChannelId)) {
      const guildChannels = await fetchGuildChannels(guildId);
      const match = guildChannels.find(
        (c: DiscordChannel) => c.name.toLowerCase() === resolvedChannelId.toLowerCase() || c.id === resolvedChannelId
      );
      if (match) {
        resolvedChannelId = match.id;
      }
    }

    // 1. Verify Bot Role Hierarchy Check:
    // Bot must have a higher role position than the role being assigned!
    const [roles, botMember] = await Promise.all([
      fetchGuildRoles(guildId),
      fetchBotMember(guildId),
    ]);

    let targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole && roleName) {
      targetRole = roles.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
    }
    if (!targetRole && roleId) {
      targetRole = roles.find((r) => r.name.toLowerCase() === roleId.toLowerCase());
    }
    if (!targetRole) {
      return NextResponse.json(
        { error: "The specified role was not found in this Discord server. Please check the role name or role ID." },
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
        channelId: resolvedChannelId,
        messageId,
        emoji,
        roleId,
        roleName: targetRole.name || roleName,
        description: description || null,
        type: type || "REACTION",
        mode: mode || "TOGGLE",
        requiredRoleId: requiredRoleId || null,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("messageId");
  const purge = searchParams.get("purge") === "true";
  const deleteDiscord =
    searchParams.get("deleteDiscord") === "true" ||
    searchParams.get("deleteDiscordMessage") === "true";

  try {
    if (messageId) {
      // Find all roles linked to this message/deck
      const mappings = await prisma.reactionRole.findMany({
        where: { guildId, messageId },
      });

      if (mappings.length === 0) {
        return NextResponse.json(
          { error: "No mappings found for this message ID" },
          { status: 404 }
        );
      }

      const channelId = mappings[0].channelId;

      if (deleteDiscord && channelId) {
        await deleteDiscordMessage(channelId, messageId).catch(() => null);
      }

      const deleted = await prisma.reactionRole.deleteMany({
        where: { guildId, messageId },
      });

      await prisma.auditLog.create({
        data: {
          guildId,
          userId: auth.context!.user.id,
          action: "DELETE_ROLE_DECK",
          details: JSON.stringify({ messageId, count: deleted.count, deleteDiscord }),
        },
      });

      return NextResponse.json({
        success: true,
        deletedCount: deleted.count,
        messageId,
      });
    }

    if (purge) {
      if (deleteDiscord) {
        // Collect distinct channelId & messageId pairs
        const distinctMessages = await prisma.reactionRole.findMany({
          where: { guildId },
          select: { channelId: true, messageId: true },
          distinct: ["channelId", "messageId"],
        });

        for (const m of distinctMessages) {
          if (m.channelId && m.messageId) {
            await deleteDiscordMessage(m.channelId, m.messageId).catch(() => null);
          }
        }
      }

      const deleted = await prisma.reactionRole.deleteMany({
        where: { guildId },
      });

      await prisma.auditLog.create({
        data: {
          guildId,
          userId: auth.context!.user.id,
          action: "PURGE_REACTION_ROLES",
          details: JSON.stringify({ count: deleted.count, deleteDiscord }),
        },
      });

      return NextResponse.json({
        success: true,
        deletedCount: deleted.count,
        purged: true,
      });
    }

    return NextResponse.json(
      { error: "Missing messageId or purge parameter" },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("[API:ReactionRoles:DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to delete role mappings" }, { status: 500 });
  }
}
