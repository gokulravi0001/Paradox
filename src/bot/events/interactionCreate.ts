import {
  Interaction,
  GuildMember,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import { prisma } from "@/lib/prisma";

export async function onInteractionCreate(interaction: Interaction) {
  // Only process button clicks and select menus in guilds
  if (!interaction.inGuild() || !interaction.guild) return;

  if (interaction.isButton()) {
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

    const hasRole = member.roles.cache.has(role.id);

    if (hasRole) {
      // Remove Role
      await member.roles.remove(role, "Visual Role Deck unclaim");

      const removeEmbed = new EmbedBuilder()
        .setColor(0xed4245) // Red
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
    } else {
      // Add Role
      await member.roles.add(role, "Visual Role Deck claim");

      const addEmbed = new EmbedBuilder()
        .setColor(role.color || 0x5865f2)
        .setTitle(`✨ Role Claimed: ${role.name}`)
        .setDescription(
          mapping?.description
            ? `You received the **${role.name}** role!\n\n**Perks & Details:**\n${mapping.description}`
            : `You have successfully received the **${role.name}** role.`
        )
        .setTimestamp();

      // Show custom role badge / sticker if set
      if (mapping?.imageUrl) {
        addEmbed.setThumbnail(mapping.imageUrl);
      }

      // Show animated celebration GIF if configured
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
