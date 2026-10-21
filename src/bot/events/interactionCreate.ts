import {
  Interaction,
  GuildMember,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import { prisma } from "@/lib/prisma";
import { handleSlashCommand } from "../commands";

export async function onInteractionCreate(interaction: Interaction) {
  // 1. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction).catch((err) => {
      console.error("[Bot:SlashCommand] Error executing slash command:", err);
    });
    return;
  }

  // Only process button clicks and select menus in guilds
  if (!interaction.inGuild() || !interaction.guild) return;

  if (interaction.isButton()) {
    // Dismiss video preview button
    if (interaction.customId.startsWith("rr_del_video_")) {
      const authorId = interaction.customId.replace("rr_del_video_", "");
      const isAuthor = interaction.user.id === authorId;
      const isMod =
        interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages) ||
        interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);

      if (isAuthor || isMod) {
        await interaction.message.delete().catch(() => null);
        return;
      } else {
        return interaction.reply({
          content: "❌ Only the author who shared this link or server moderators can dismiss this preview.",
          ephemeral: true,
        });
      }
    }

    if (interaction.customId.startsWith("rr_role_")) {
      const roleId = interaction.customId.replace("rr_role_", "");
      await handleRoleToggle(interaction, roleId);
    }
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith("rr_select_")) {
      const selectedRoleId = interaction.values[0];
      if (selectedRoleId) {
        await handleRoleToggle(interaction, selectedRoleId);
      }
    }
  }
}

async function handleRoleToggle(interaction: any, roleId: string) {
  try {
    const guild = interaction.guild;
    const member = interaction.member as GuildMember;

    if (!member || !guild) {
      return interaction.reply({
        content: "Could not retrieve your server member profile.",
        ephemeral: true,
      });
    }

    // 1. Fetch Target Role
    const role = await guild.roles.fetch(roleId).catch(() => null);
    if (!role) {
      return interaction.reply({
        content: "⚠️ The selected role no longer exists in this server.",
        ephemeral: true,
      });
    }

    // 2. Validate Bot Permissions & Hierarchy
    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({
        content: "⚠️ The bot lacks the **Manage Roles** permission to assign this role.",
        ephemeral: true,
      });
    }

    if (role.position >= botMember.roles.highest.position) {
      return interaction.reply({
        content: `⚠️ Role Hierarchy Conflict: **${role.name}** is positioned higher than or equal to the bot's highest role. An administrator must move the bot's role above **${role.name}**.`,
        ephemeral: true,
      });
    }

    // 3. Find Visual Configuration in Database
    const mapping = await prisma.reactionRole.findFirst({
      where: {
        guildId: guild.id,
        roleId: role.id,
      },
    });

    const mode = mapping?.mode || "TOGGLE";

    // 4. Prerequisite Check (if requiredRoleId is set)
    if (mapping?.requiredRoleId && !member.roles.cache.has(mapping.requiredRoleId)) {
      return interaction.reply({
        content: `🔒 **Prerequisite Required:** You must have the <@&${mapping.requiredRoleId}> role before you can claim **${role.name}**.`,
        ephemeral: true,
      });
    }

    const hasRole = member.roles.cache.has(role.id);

    // MODE: VERIFY (One-time claim only)
    if (mode === "VERIFY") {
      if (hasRole) {
        return interaction.reply({
          content: `✅ You have already verified and claimed the **${role.name}** role.`,
          ephemeral: true,
        });
      }
      await member.roles.add(role, "Paradox Verification role claim");
      return sendRoleClaimResponse(interaction, role, mapping);
    }

    // MODE: REVERSED (Removes role upon click)
    if (mode === "REVERSED") {
      if (hasRole) {
        await member.roles.remove(role, "Paradox Reversed role unclaim");
        return sendRoleRemoveResponse(interaction, role, mapping);
      } else {
        return interaction.reply({
          content: `ℹ️ You do not currently have the **${role.name}** role.`,
          ephemeral: true,
        });
      }
    }

    // MODE: UNIQUE (Radio single-choice: removes other roles in same panel)
    if (mode === "UNIQUE") {
      if (hasRole) {
        await member.roles.remove(role, "Paradox Unique role toggle");
        return sendRoleRemoveResponse(interaction, role, mapping);
      } else {
        // Remove other sibling roles linked to this message
        if (mapping?.messageId) {
          const siblingMappings = await prisma.reactionRole.findMany({
            where: {
              guildId: guild.id,
              messageId: mapping.messageId,
              roleId: { not: role.id },
            },
          });

          for (const sib of siblingMappings) {
            if (member.roles.cache.has(sib.roleId)) {
              await member.roles.remove(sib.roleId, "Paradox Unique mode swap").catch(() => null);
            }
          }
        }

        await member.roles.add(role, "Paradox Unique mode claim");
        return sendRoleClaimResponse(interaction, role, mapping);
      }
    }

    // MODE: TOGGLE (Default)
    if (hasRole) {
      await member.roles.remove(role, "Visual Role Deck unclaim");
      return sendRoleRemoveResponse(interaction, role, mapping);
    } else {
      await member.roles.add(role, "Visual Role Deck claim");
      return sendRoleClaimResponse(interaction, role, mapping);
    }
  } catch (err: unknown) {
    console.error("[Bot:RoleInteraction] Error toggling role:", err);
    if (!interaction.replied) {
      return interaction.reply({
        content: "An unexpected error occurred while processing your role selection.",
        ephemeral: true,
      });
    }
  }
}

async function sendRoleClaimResponse(interaction: any, role: any, mapping: any) {
  const addEmbed = new EmbedBuilder()
    .setColor(role.color || 0x5865f2)
    .setTitle(`✨ Role Claimed: ${role.name}`)
    .setDescription(
      mapping?.description
        ? `You received the **${role.name}** role!\n\n**Perks & Details:**\n${mapping.description}`
        : `You have successfully received the **${role.name}** role.`
    )
    .setTimestamp();

  if (mapping?.imageUrl) {
    addEmbed.setThumbnail(mapping.imageUrl);
  }

  if (mapping?.confirmGif) {
    addEmbed.setImage(mapping.confirmGif);
  } else if (mapping?.imageUrl && !mapping?.confirmGif) {
    addEmbed.setImage(mapping.imageUrl);
  }

  return interaction.reply({
    embeds: [addEmbed],
    ephemeral: true,
  });
}

async function sendRoleRemoveResponse(interaction: any, role: any, mapping: any) {
  const removeEmbed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle(`Role Removed: ${role.name}`)
    .setDescription(`You have removed the **${role.name}** role from your profile.`)
    .setTimestamp();

  if (mapping?.imageUrl) {
    removeEmbed.setThumbnail(mapping.imageUrl);
  }

  return interaction.reply({
    embeds: [removeEmbed],
    ephemeral: true,
  });
}
