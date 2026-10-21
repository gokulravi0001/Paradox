import { Guild, GuildMember, MessageReaction, User as DiscordUser } from "discord.js";
import { prisma } from "@/lib/prisma";

export interface RoleAssignmentResult {
  success: boolean;
  action: "added" | "removed" | "skipped";
  roleName?: string;
  error?: string;
}

/**
 * Normalize emoji representation for consistent database storage and comparison
 */
export function normalizeEmoji(reaction: MessageReaction): string {
  if (reaction.emoji.id) {
    // Custom emoji: name:id
    return `${reaction.emoji.name}:${reaction.emoji.id}`;
  }
  // Unicode emoji
  return reaction.emoji.name || "";
}

/**
 * Handle user adding a reaction
 */
export async function handleReactionAdd(
  reaction: MessageReaction,
  user: DiscordUser
): Promise<RoleAssignmentResult> {
  if (user.bot) return { success: false, action: "skipped", error: "User is bot" };

  const message = reaction.message;
  const guild = message.guild;
  if (!guild) return { success: false, action: "skipped", error: "Not in a guild" };

  const emojiKey = normalizeEmoji(reaction);

  try {
    // 1. Find mapping in DB
    const mapping = await prisma.reactionRole.findFirst({
      where: {
        guildId: guild.id,
        messageId: message.id,
        emoji: emojiKey,
      },
    });

    if (!mapping) {
      return { success: false, action: "skipped", error: "No mapping found" };
    }

    // 2. Fetch GuildMember
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return { success: false, action: "skipped", error: "Guild member not found" };
    }

    // 3. Fetch Role
    const role = await guild.roles.fetch(mapping.roleId).catch(() => null);
    if (!role) {
      console.warn(`[ReactionRoles] Role ${mapping.roleId} not found in guild ${guild.id}.`);
      return { success: false, action: "skipped", error: "Role deleted or not found" };
    }

    // 4. Validate bot permissions and hierarchy
    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember) {
      return { success: false, action: "skipped", error: "Bot member not found" };
    }

    if (!botMember.permissions.has("ManageRoles")) {
      console.warn(`[ReactionRoles] Bot is missing 'Manage Roles' permission in ${guild.name} (${guild.id})`);
      return { success: false, action: "skipped", error: "Bot lacks Manage Roles permission" };
    }

    if (role.position >= botMember.roles.highest.position) {
      console.warn(
        `[ReactionRoles] Role hierarchy violation: ${role.name} (${role.position}) >= bot highest role (${botMember.roles.highest.position})`
      );
      return {
        success: false,
        action: "skipped",
        error: "Target role is higher than or equal to bot's highest role",
      };
    }

    // 5. Add role if user doesn't already have it
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role, "Reaction role assigned");
      return { success: true, action: "added", roleName: role.name };
    }

    return { success: true, action: "skipped", roleName: role.name };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ReactionRoles] Error assigning role: ${errorMsg}`);
    return { success: false, action: "skipped", error: errorMsg };
  }
}

/**
 * Handle user removing a reaction
 */
export async function handleReactionRemove(
  reaction: MessageReaction,
  user: DiscordUser
): Promise<RoleAssignmentResult> {
  if (user.bot) return { success: false, action: "skipped", error: "User is bot" };

  const message = reaction.message;
  const guild = message.guild;
  if (!guild) return { success: false, action: "skipped", error: "Not in a guild" };

  const emojiKey = normalizeEmoji(reaction);

  try {
    const mapping = await prisma.reactionRole.findFirst({
      where: {
        guildId: guild.id,
        messageId: message.id,
        emoji: emojiKey,
      },
    });

    if (!mapping) return { success: false, action: "skipped", error: "No mapping found" };

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return { success: false, action: "skipped", error: "Guild member not found" };

    const role = await guild.roles.fetch(mapping.roleId).catch(() => null);
    if (!role) return { success: false, action: "skipped", error: "Role not found" };

    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember || !botMember.permissions.has("ManageRoles")) {
      return { success: false, action: "skipped", error: "Bot lacks Manage Roles permission" };
    }

    if (role.position >= botMember.roles.highest.position) {
      return {
        success: false,
        action: "skipped",
        error: "Target role is higher than or equal to bot's highest role",
      };
    }

    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role, "Reaction role removed");
      return { success: true, action: "removed", roleName: role.name };
    }

    return { success: true, action: "skipped", roleName: role.name };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ReactionRoles] Error removing role: ${errorMsg}`);
    return { success: false, action: "skipped", error: errorMsg };
  }
}
