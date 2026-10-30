import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  PermissionsBitField,
  ChannelType,
  TextChannel,
  Role,
  AttachmentBuilder,
  User,
  GuildMember,
} from "discord.js";
import { prisma } from "@/lib/prisma";
import {
  generateQuoteCard,
  generateAnimatedQuoteCard,
  makeImageIntoGif,
  fetchSafeImageBuffer,
  validateImageUrl,
} from "../services/imageGenerator";

export const SLASH_COMMANDS_DATA = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Explore Paradox commands, features, and dashboard link"),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency and gateway connection"),

  new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription("Get a direct link to this server's web companion dashboard"),

  new SlashCommandBuilder()
    .setName("roles")
    .setDescription("List active visual role decks and reaction roles for this server"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Display server statistics and bot permission health"),

  // 1. Specialist: Reaction Roles Command (with Multi-Mode Logic & Prerequisites)
  new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Specialist: Manage emoji reaction roles with custom mode logic")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add an emoji reaction role with specialized mode logic")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("emoji").setDescription("The emoji trigger (e.g. ⭐, 🎮)").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("The role to grant upon reacting").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("mode")
            .setDescription("Role Assignment Logic")
            .addChoices(
              { name: "Toggle (Normal claim & unclaim)", value: "TOGGLE" },
              { name: "Unique (Radio single-choice in this group)", value: "UNIQUE" },
              { name: "Verify (One-time claim only, locks in)", value: "VERIFY" },
              { name: "Reversed (Opt-out / removes role)", value: "REVERSED" }
            )
        )
        .addRoleOption((opt) =>
          opt.setName("required_role").setDescription("Prerequisite role needed to claim this role")
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The channel containing the message (defaults to current)")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
        .addStringOption((opt) =>
          opt.setName("description").setDescription("Perk description displayed on claim")
        )
        .addStringOption((opt) =>
          opt.setName("badge_url").setDescription("Custom badge image/sticker icon URL")
        )
        .addStringOption((opt) =>
          opt.setName("celebration_gif").setDescription("Animated celebration GIF URL on claim")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove an existing reaction role mapping")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("emoji").setDescription("The emoji trigger to remove").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all reaction roles configured in this server")
    )
    .addSubcommand((sub) =>
      sub.setName("clean").setDescription("Clean up deleted roles or deleted message mappings")
    )
    .addSubcommand((sub) =>
      sub
        .setName("setmode")
        .setDescription("Change role selection mode for all roles on a message")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("mode")
            .setDescription("Role Assignment Logic")
            .setRequired(true)
            .addChoices(
              { name: "Unique (Radio single-choice, auto-swaps)", value: "UNIQUE" },
              { name: "Onetime (Verify / one-time claim only)", value: "VERIFY" },
              { name: "Multirole (Free toggle, select multiple)", value: "TOGGLE" },
              { name: "Reversed (Opt-out / removes role)", value: "REVERSED" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("restrict")
        .setDescription("Set a prerequisite role restriction on a mapped role")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("The role to restrict").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("required_role").setDescription("The prerequisite role needed").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("unrestrict")
        .setDescription("Remove prerequisite requirement from a role on a message")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("The role to unrestrict").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete_deck")
        .setDescription("Delete an entire role deck and all its role mappings")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
        )
        .addBooleanOption((opt) =>
          opt.setName("delete_message").setDescription("Also delete the message from the Discord channel?")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("purge")
        .setDescription("Delete ALL reaction role mappings and decks for this server")
        .addBooleanOption((opt) =>
          opt.setName("delete_messages").setDescription("Also delete associated messages from Discord?")
        )
    ),

  // 2. Specialist: Visual Role Deck Command (Interactive Clickable Buttons & Animated GIF Header)
  new SlashCommandBuilder()
    .setName("roledeck")
    .setDescription("Specialist: Deploy interactive Visual Role Deck with buttons and banner GIF")
    .addStringOption((opt) =>
      opt.setName("title").setDescription("Title for the role panel").setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName("role1").setDescription("First role to include").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("emoji1").setDescription("Emoji for first role (e.g. 🎮)").setRequired(true)
    )
    .addRoleOption((opt) => opt.setName("role2").setDescription("Second role (optional)"))
    .addStringOption((opt) => opt.setName("emoji2").setDescription("Emoji for second role"))
    .addRoleOption((opt) => opt.setName("role3").setDescription("Third role (optional)"))
    .addStringOption((opt) => opt.setName("emoji3").setDescription("Emoji for third role"))
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Role selection behavior")
        .addChoices(
          { name: "Unique (Pick one only, automatically swaps)", value: "UNIQUE" },
          { name: "Toggle (Normal select / unselect)", value: "TOGGLE" },
          { name: "Verify (One-time claim only)", value: "VERIFY" }
        )
    )
    .addRoleOption((opt) =>
      opt.setName("required_role").setDescription("Prerequisite role needed to claim roles in this deck")
    )
    .addStringOption((opt) =>
      opt.setName("banner_gif").setDescription("Header banner image or animated GIF URL")
    )
    .addStringOption((opt) =>
      opt.setName("description").setDescription("Description text above buttons")
    )
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Destination channel (defaults to current)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    ),

  // 3. Specialist: Social Video Fixer Command
  new SlashCommandBuilder()
    .setName("videofix")
    .setDescription("Specialist: Social Video Embed Fixer (Twitter, TikTok, Instagram, Reddit, Bluesky, Threads)")
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Check video fixer status, supported providers, and settings")
    )
    .addSubcommand((sub) =>
      sub.setName("toggle").setDescription("Enable or disable video fixer server-wide")
    )
    .addSubcommand((sub) =>
      sub
        .setName("ignore")
        .setDescription("Mute/unmute video fixing in a specific channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target channel")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("deletebutton")
        .setDescription("Toggle the author 🗑️ Dismiss button on fixed previews")
        .addBooleanOption((opt) =>
          opt.setName("enabled").setDescription("Show dismiss button?").setRequired(true)
        )
    ),

  // 4. Rich Embed Publisher & Editor
  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Create or edit a rich Discord embed in any channel")
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Destination channel")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
    .addStringOption((opt) =>
      opt.setName("title").setDescription("Embed title").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("description").setDescription("Embed description text").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("message_id").setDescription("Message ID to edit (leave blank to post a new embed)")
    )
    .addStringOption((opt) =>
      opt.setName("color").setDescription("Hex color (e.g. #5865F2, #57F287, #ED4245)")
    )
    .addStringOption((opt) =>
      opt.setName("image").setDescription("Large banner image or GIF URL")
    )
    .addStringOption((opt) =>
      opt.setName("thumbnail").setDescription("Small top-right thumbnail icon URL")
    ),

  // 5. AURA Feature 1: Clickable Server Invite Embed
  new SlashCommandBuilder()
    .setName("postinvite")
    .setDescription("Post a stylish server invite embed with native preview")
    .addStringOption((opt) =>
      opt.setName("custom_message").setDescription("Custom message or tagline for the invite embed")
    )
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Channel to post the invite into (defaults to current channel)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
    .addStringOption((opt) =>
      opt.setName("invite_url").setDescription("Override custom invite URL (e.g. https://discord.gg/yourcode)")
    ),

  // 6. AURA Feature 2: Make It a GIF
  new SlashCommandBuilder()
    .setName("gif")
    .setDescription("Convert a static image into an animated GIF with neon effects")
    .addAttachmentOption((opt) =>
      opt.setName("image").setDescription("Upload a static image to animate (PNG, JPG, WEBP)")
    )
    .addStringOption((opt) =>
      opt.setName("url").setDescription("Or provide a direct image URL to animate")
    )
    .addStringOption((opt) =>
      opt
        .setName("style")
        .setDescription("Animation aesthetic style")
        .addChoices(
          { name: "Neon Pulse (Purple & Crimson)", value: "pulse" },
          { name: "Cinematic Zoom", value: "zoom" },
          { name: "Cyber Scanline", value: "scanline" }
        )
    ),

  // 7. AURA Feature 3: Make It a Quote (Photo Quote with User Avatar & Message)
  new SlashCommandBuilder()
    .setName("quote")
    .setDescription("Turn a message or text into an AURA photo quote with the user's avatar")
    .addStringOption((opt) =>
      opt.setName("quote").setDescription("Quote text to display (or leave blank if providing message ID/link)")
    )
    .addStringOption((opt) =>
      opt.setName("message").setDescription("Discord Message ID or Link to quote directly")
    )
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User whose photo and name to quote")
    )
    .addStringOption((opt) =>
      opt.setName("author").setDescription("Author or speaker name override")
    )
    .addAttachmentOption((opt) =>
      opt.setName("background").setDescription("Optional custom background image attachment")
    ),

  // 8. AURA Feature 4: Animated Quote
  new SlashCommandBuilder()
    .setName("animatedquote")
    .setDescription("Generate an animated glowing quote card GIF with user photo")
    .addStringOption((opt) =>
      opt.setName("quote").setDescription("Quote text to display (or leave blank if providing message ID/link)")
    )
    .addStringOption((opt) =>
      opt.setName("message").setDescription("Discord Message ID or Link to quote directly")
    )
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User whose photo and name to quote")
    )
    .addStringOption((opt) =>
      opt.setName("author").setDescription("Author or speaker name override")
    )
    .addAttachmentOption((opt) =>
      opt.setName("background").setDescription("Optional custom background image attachment")
    ),

  // 9. Context Menu: Right-Click Any Message -> Apps -> "Quote Message"
  new ContextMenuCommandBuilder()
    .setName("Quote Message")
    .setType(ApplicationCommandType.Message),
];

/**
 * Resolves a Discord message from a raw message ID or a full Discord message URL.
 */
async function resolveMessageFromInput(channel: TextChannel, input: string): Promise<Message | null> {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Check if it's a full discord message link (https://discord.com/channels/:guildId/:channelId/:messageId)
  const linkMatch = trimmed.match(/discord\.com\/channels\/\d+\/(\d+)\/(\d+)/);
  if (linkMatch) {
    const chId = linkMatch[1];
    const msgId = linkMatch[2];
    try {
      const ch = await channel.guild.channels.fetch(chId).catch(() => null);
      if (ch && "messages" in ch) {
        return await (ch as TextChannel).messages.fetch(msgId).catch(() => null);
      }
    } catch {}
  }

  // 2. Direct message ID lookup in current channel
  try {
    return await channel.messages.fetch(trimmed).catch(() => null);
  } catch {}

  return null;
}

/**
 * Handle slash command execution & context menu actions
 */
export async function handleSlashCommand(interaction: ChatInputCommandInteraction | any) {
  const { commandName, guildId, guild, client, memberPermissions } = interaction;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const isManager =
    memberPermissions?.has(PermissionsBitField.Flags.ManageGuild) ||
    memberPermissions?.has(PermissionsBitField.Flags.Administrator);

  // /ping
  if (commandName === "ping") {
    const ping = client.ws.ping;
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("🏓 Pong!")
      .setDescription(`Gateway WebSocket Latency: **${ping}ms**`)
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }

  // /help
  if (commandName === "help") {
    const config = guildId ? await prisma.guildConfig.findUnique({ where: { id: guildId } }).catch(() => null) : null;
    const prefix = config?.prefix || "$";

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🤖 Paradox Specialist Bot — Features & Commands")
      .setDescription(
        "Paradox is a dual-specialist bot built for **Visual Role Decks & Reaction Roles** and **High-Performance Social Video Link Fixes**.\n\n" +
        `Command Prefix: \`${prefix}\` | Slash Commands: \`/\``
      )
      .addFields(
        {
          name: "🎭 1. Visual Role Decks & Reaction Roles Specialist",
          value:
            "`/reactionrole add` — Configure reaction role with custom modes (`TOGGLE`, `UNIQUE`, `VERIFY`, `REVERSED`)\n" +
            "`/reactionrole remove` — Delete reaction role\n" +
            "`/reactionrole clean` — Purge deleted message/role records\n" +
            "`/roledeck` — Deploy visual card with clickable buttons & animated banner GIF\n" +
            `\`${prefix}rr add <msgId> <emoji> <@role> [mode]\` — Quick text command`,
        },
        {
          name: "🎥 2. Social Video Embed Fixer Specialist",
          value:
            "Supports: **X/Twitter**, **TikTok**, **Instagram Reels**, **Reddit**, **Bluesky**, **Threads**.\n" +
            "`/videofix status` — View fixer health & providers\n" +
            "`/videofix toggle` — Enable/disable server-wide\n" +
            "`/videofix ignore` — Mute in specific channels\n" +
            "`/videofix deletebutton` — Toggle 🗑️ author dismiss button\n" +
            `\`${prefix}videofix toggle\` — Quick text toggle`,
        },
        {
          name: "📢 3. Embeds & Utilities",
          value:
            "`/embed` — Post rich embed messages\n" +
            `\`${prefix}prefix <newPrefix>\` — Change server prefix\n` +
            "`/serverinfo` — Server stats & bot role position\n" +
            "`/dashboard` — Web dashboard link",
        },
        {
          name: "✨ 4. Creative & Community Tools",
          value:
            "`/postinvite [message] [channel] [url]` — Staff: Post branded invite embed & native preview\n" +
            "`/gif <image|url> [style]` — Transform a static picture into an animated GIF\n" +
            "`/quote <quote> [author] [background]` — Generate an AURA quote card image\n" +
            "`/animatedquote <quote> [author] [background]` — Generate an animated glowing quote card GIF",
        }
      )
      .setFooter({ text: "Paradox • Specialist Discord Bot" })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Open Web Dashboard")
        .setStyle(ButtonStyle.Link)
        .setURL(guildId ? `${appUrl}/dashboard/${guildId}` : `${appUrl}/dashboard`)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  // /reactionrole
  if (commandName === "reactionrole") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "list") {
      const mappings = await prisma.reactionRole.findMany({ where: { guildId } }).catch(() => []);
      if (mappings.length === 0) {
        return interaction.reply({
          content: "No reaction roles configured yet. Use `/reactionrole add` or `/roledeck`!",
          ephemeral: true,
        });
      }

      const listText = mappings
        .map(
          (m) =>
            `• ${m.emoji} **${m.roleName}** [Mode: \`${m.mode || "TOGGLE"}\`] in <#${m.channelId}> — Msg: \`${m.messageId}\``
        )
        .join("\n");

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎭 Active Reaction Roles (${mappings.length})`)
        .setDescription(listText)
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!isManager) {
      return interaction.reply({
        content: "⛔ You need the **Manage Server** permission to configure reaction roles.",
        ephemeral: true,
      });
    }

    if (subcommand === "clean") {
      const all = await prisma.reactionRole.findMany({ where: { guildId } });
      let purged = 0;
      for (const m of all) {
        const roleExists = guild.roles.cache.has(m.roleId);
        if (!roleExists) {
          await prisma.reactionRole.delete({ where: { id: m.id } });
          purged++;
        }
      }
      return interaction.reply({ content: `🧹 Cleaned up **${purged}** orphaned role mapping(s).`, ephemeral: true });
    }

    if (subcommand === "add") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const emoji = interaction.options.getString("emoji", true).trim();
      const role = interaction.options.getRole("role", true) as Role;
      const mode = interaction.options.getString("mode") || "TOGGLE";
      const requiredRole = interaction.options.getRole("required_role");
      const desc = interaction.options.getString("description");
      const badgeUrl = interaction.options.getString("badge_url");
      const celebrationGif = interaction.options.getString("celebration_gif");
      const targetChannel =
        (interaction.options.getChannel("channel") as TextChannel) ||
        (interaction.channel as TextChannel);

      if (!targetChannel) return interaction.reply({ content: "Invalid channel.", ephemeral: true });

      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.reply({ content: "❌ Bot lacks **Manage Roles** permission.", ephemeral: true });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `❌ Role Hierarchy Error: **${role.name}** is higher than or equal to the bot's role. Drag the bot's role above **${role.name}** in Server Settings.`,
          ephemeral: true,
        });
      }

      if (role.managed) {
        return interaction.reply({ content: "❌ Cannot assign managed / integration roles.", ephemeral: true });
      }

      // Add reaction to message
      try {
        const msg = await targetChannel.messages.fetch(messageId).catch(() => null);
        if (msg) await msg.react(emoji).catch(() => null);
      } catch {}

      await prisma.reactionRole.create({
        data: {
          guildId,
          channelId: targetChannel.id,
          messageId,
          emoji,
          roleId: role.id,
          roleName: role.name,
          description: desc || null,
          type: "REACTION",
          mode,
          requiredRoleId: requiredRole?.id || null,
          imageUrl: badgeUrl || null,
          confirmGif: celebrationGif || null,
        },
      });

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("✅ Reaction Role Configured!")
        .setDescription(
          `Reacting with ${emoji} on message \`${messageId}\` will assign **${role.name}**.\n\n` +
          `• **Mode:** \`${mode}\`\n` +
          (requiredRole ? `• **Prerequisite:** Requires <@&${requiredRole.id}>\n` : "") +
          (desc ? `• **Perks:** ${desc}` : "")
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "remove") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const emoji = interaction.options.getString("emoji", true).trim();

      const deleted = await prisma.reactionRole.deleteMany({
        where: { guildId, messageId, emoji },
      });

      return interaction.reply({
        content: `✅ Removed ${deleted.count} mapping(s) for ${emoji} on message \`${messageId}\`.`,
        ephemeral: true,
      });
    }

    if (subcommand === "setmode") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const newMode = interaction.options.getString("mode", true);

      const updated = await prisma.reactionRole.updateMany({
        where: { guildId, messageId },
        data: { mode: newMode },
      });

      if (updated.count === 0) {
        return interaction.reply({
          content: `⚠️ No reaction roles found on message \`${messageId}\`.`,
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `✅ Successfully updated **${updated.count}** role mapping(s) on message \`${messageId}\` to mode **\`${newMode}\`**!`,
      });
    }

    if (subcommand === "restrict") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const targetRole = interaction.options.getRole("role", true);
      const reqRole = interaction.options.getRole("required_role", true);

      const updated = await prisma.reactionRole.updateMany({
        where: { guildId, messageId, roleId: targetRole.id },
        data: { requiredRoleId: reqRole.id },
      });

      if (updated.count === 0) {
        return interaction.reply({
          content: `⚠️ No mapping found for role **${targetRole.name}** on message \`${messageId}\`.`,
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `🔒 **Restriction Enabled:** Members now require <@&${reqRole.id}> to claim **${targetRole.name}** on message \`${messageId}\`.`,
      });
    }

    if (subcommand === "unrestrict") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const targetRole = interaction.options.getRole("role", true);

      const updated = await prisma.reactionRole.updateMany({
        where: { guildId, messageId, roleId: targetRole.id },
        data: { requiredRoleId: null },
      });

      return interaction.reply({
        content: `🔓 **Restriction Removed:** Anyone can now claim **${targetRole.name}** on message \`${messageId}\`.`,
      });
    }

    if (subcommand === "delete_deck") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const deleteMessage = interaction.options.getBoolean("delete_message") || false;

      const mappings = await prisma.reactionRole.findMany({
        where: { guildId, messageId },
      });

      if (mappings.length === 0) {
        return interaction.reply({
          content: `⚠️ No role deck found matching Message ID \`${messageId}\`.`,
          ephemeral: true,
        });
      }

      const count = mappings.length;
      const channelId = mappings[0].channelId;

      if (deleteMessage && channelId) {
        try {
          const ch = await guild.channels.fetch(channelId).catch(() => null);
          if (ch && "messages" in ch) {
            const msg = await (ch as TextChannel).messages.fetch(messageId).catch(() => null);
            if (msg) await msg.delete().catch(() => null);
          }
        } catch {}
      }

      await prisma.reactionRole.deleteMany({
        where: { guildId, messageId },
      });

      return interaction.reply({
        content: `🗑️ **Role Deck Deleted:** Removed all **${count}** role mapping(s) from message \`${messageId}\`${deleteMessage ? " and deleted the Discord message" : ""}!`,
      });
    }

    if (subcommand === "purge") {
      const deleteMessages = interaction.options.getBoolean("delete_messages") || false;

      if (deleteMessages) {
        const distinctMessages = await prisma.reactionRole.findMany({
          where: { guildId },
          select: { channelId: true, messageId: true },
          distinct: ["channelId", "messageId"],
        });

        for (const m of distinctMessages) {
          if (m.channelId && m.messageId) {
            try {
              const ch = await guild.channels.fetch(m.channelId).catch(() => null);
              if (ch && "messages" in ch) {
                const msg = await (ch as TextChannel).messages.fetch(m.messageId).catch(() => null);
                if (msg) await msg.delete().catch(() => null);
              }
            } catch {}
          }
        }
      }

      const deleted = await prisma.reactionRole.deleteMany({
        where: { guildId },
      });

      return interaction.reply({
        content: `🧹 **Purge Complete:** Successfully deleted all **${deleted.count}** reaction role mappings and decks in this server${deleteMessages ? " and deleted their Discord messages" : ""}!`,
      });
    }
  }

  // /roledeck
  if (commandName === "roledeck") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    if (!isManager) return interaction.reply({ content: "⛔ You need the **Manage Server** permission.", ephemeral: true });

    const title = interaction.options.getString("title", true);
    const desc = interaction.options.getString("description") || "Click the buttons below to claim or remove roles:";
    const mode = interaction.options.getString("mode") || "TOGGLE";
    const requiredRole = interaction.options.getRole("required_role");
    const bannerGif = interaction.options.getString("banner_gif");
    const targetChannel =
      (interaction.options.getChannel("channel") as TextChannel) ||
      (interaction.channel as TextChannel);

    if (!targetChannel) return interaction.reply({ content: "Invalid channel.", ephemeral: true });

    const deckRoles: { role: Role; emoji: string }[] = [];
    const r1 = interaction.options.getRole("role1", true) as Role;
    const e1 = interaction.options.getString("emoji1", true);
    deckRoles.push({ role: r1, emoji: e1 });

    const r2 = interaction.options.getRole("role2") as Role;
    const e2 = interaction.options.getString("emoji2");
    if (r2 && e2) deckRoles.push({ role: r2, emoji: e2 });

    const r3 = interaction.options.getRole("role3") as Role;
    const e3 = interaction.options.getString("emoji3");
    if (r3 && e3) deckRoles.push({ role: r3, emoji: e3 });

    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: "❌ Bot lacks **Manage Roles** permission.", ephemeral: true });
    }

    for (const item of deckRoles) {
      if (item.role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `❌ Role Hierarchy Error: **${item.role.name}** is higher than or equal to the bot's role.`,
          ephemeral: true,
        });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`✨ ${title}`)
      .setDescription(desc)
      .setFooter({ text: `Paradox Role Deck • Mode: ${mode}` })
      .setTimestamp();

    if (bannerGif) embed.setImage(bannerGif);

    const row = new ActionRowBuilder<ButtonBuilder>();
    for (const item of deckRoles) {
      embed.addFields({
        name: `${item.emoji} ${item.role.name}`,
        value: "Click button below to toggle",
        inline: true,
      });

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`rr_role_${item.role.id}`)
          .setLabel(item.role.name)
          .setStyle(ButtonStyle.Primary)
      );
    }

    const sentMsg = await targetChannel.send({ embeds: [embed], components: [row] });

    for (const item of deckRoles) {
      await prisma.reactionRole.create({
        data: {
          guildId,
          channelId: targetChannel.id,
          messageId: sentMsg.id,
          emoji: item.emoji,
          roleId: item.role.id,
          roleName: item.role.name,
          type: "BUTTON",
          mode,
          requiredRoleId: requiredRole?.id || null,
          bannerUrl: bannerGif || null,
        },
      });
    }

    return interaction.reply({
      content: `🎉 Visual Role Deck deployed to <#${targetChannel.id}> with mode \`${mode}\`!`,
      ephemeral: true,
    });
  }

  // /videofix
  if (commandName === "videofix") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });

    const subcommand = interaction.options.getSubcommand();
    const config = await prisma.guildConfig.findUnique({ where: { id: guildId } }).catch(() => null);

    if (subcommand === "status") {
      const enabled = config?.videoFixerEnabled ?? true;
      const deleteBtn = config?.videoFixerDeleteButton ?? true;
      let providers = ["twitter", "tiktok", "instagram", "reddit", "bluesky", "threads"];
      try {
        if (config?.videoFixerProviders) providers = JSON.parse(config.videoFixerProviders);
      } catch {}

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x57f287 : 0xed4245)
        .setTitle("🎥 Specialist: Social Video Fixer Engine")
        .setDescription(
          `Status: **${enabled ? "Active ✅" : "Disabled ❌"}**\n` +
          `Author Dismiss Button: **${deleteBtn ? "Enabled 🗑️" : "Disabled"}**`
        )
        .addFields({
          name: "Supported Platforms",
          value: providers.map((p) => `• **${p.toUpperCase()}**`).join("\n"),
        })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (!isManager) return interaction.reply({ content: "⛔ You need **Manage Server** permission.", ephemeral: true });

    if (subcommand === "toggle") {
      const current = config?.videoFixerEnabled ?? true;
      const updated = await prisma.guildConfig.update({
        where: { id: guildId },
        data: { videoFixerEnabled: !current },
      });
      return interaction.reply({
        content: `🎥 Video Fixer is now **${updated.videoFixerEnabled ? "Enabled ✅" : "Disabled ❌"}**!`,
      });
    }

    if (subcommand === "deletebutton") {
      const enabled = interaction.options.getBoolean("enabled", true);
      await prisma.guildConfig.update({
        where: { id: guildId },
        data: { videoFixerDeleteButton: enabled },
      });
      return interaction.reply({
        content: `🗑️ Author Dismiss Button is now **${enabled ? "Enabled" : "Disabled"}**.`,
      });
    }

    if (subcommand === "ignore") {
      const targetChannel = interaction.options.getChannel("channel", true);
      let ignored: string[] = [];
      try {
        if (config?.videoFixerIgnoredChannels) ignored = JSON.parse(config.videoFixerIgnoredChannels);
      } catch {}

      if (ignored.includes(targetChannel.id)) {
        ignored = ignored.filter((id) => id !== targetChannel.id);
        await prisma.guildConfig.update({
          where: { id: guildId },
          data: { videoFixerIgnoredChannels: JSON.stringify(ignored) },
        });
        return interaction.reply({ content: `✅ <#${targetChannel.id}> is now **unignored**.` });
      } else {
        ignored.push(targetChannel.id);
        await prisma.guildConfig.update({
          where: { id: guildId },
          data: { videoFixerIgnoredChannels: JSON.stringify(ignored) },
        });
        return interaction.reply({ content: `🔇 <#${targetChannel.id}> is now **ignored**.` });
      }
    }
  }

  // /embed
  if (commandName === "embed") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    if (!isManager) return interaction.reply({ content: "⛔ You need the **Manage Server** permission.", ephemeral: true });

    const targetChannel = interaction.options.getChannel("channel", true) as TextChannel;
    const title = interaction.options.getString("title", true);
    const description = interaction.options.getString("description", true);
    const messageId = interaction.options.getString("message_id");
    const colorHex = interaction.options.getString("color") || "#5865F2";
    const image = interaction.options.getString("image");
    const thumbnail = interaction.options.getString("thumbnail");

    const embed = new EmbedBuilder().setTitle(title).setDescription(description).setTimestamp();

    try {
      embed.setColor(parseInt(colorHex.replace("#", ""), 16));
    } catch {
      embed.setColor(0x5865f2);
    }

    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);

    if (messageId && messageId.trim()) {
      const targetMsg = await targetChannel.messages.fetch(messageId.trim()).catch(() => null);
      if (!targetMsg) {
        return interaction.reply({
          content: `❌ Could not find message \`${messageId.trim()}\` in <#${targetChannel.id}>. Make sure the message exists in this channel.`,
          ephemeral: true,
        });
      }
      if (targetMsg.author.id !== client.user?.id) {
        return interaction.reply({
          content: `❌ Paradox can only edit embed messages sent by Paradox itself.`,
          ephemeral: true,
        });
      }
      await targetMsg.edit({ embeds: [embed] });
      return interaction.reply({
        content: `✅ Successfully edited embed for message \`${messageId.trim()}\` in <#${targetChannel.id}>!`,
        ephemeral: true,
      });
    }

    const sent = await targetChannel.send({ embeds: [embed] });
    return interaction.reply({
      content: `✅ Embed published to <#${targetChannel.id}>! (Message ID: \`${sent.id}\`)`,
      ephemeral: true,
    });
  }

  // /dashboard
  if (commandName === "dashboard") {
    const dashboardUrl = guildId ? `${appUrl}/dashboard/${guildId}` : `${appUrl}/dashboard`;
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("⚙️ Server Dashboard")
      .setDescription(`Configure Paradox for **${guild?.name}**:`)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel("Open Web Dashboard").setStyle(ButtonStyle.Link).setURL(dashboardUrl)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  // /serverinfo
  if (commandName === "serverinfo") {
    if (!guild) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });

    const botMember = await guild.members.fetchMe().catch(() => null);
    const botRoleName = botMember?.roles.highest.name || "None";

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 Server Info: ${guild.name}`)
      .setThumbnail(guild.iconURL() || null)
      .addFields(
        { name: "Server ID", value: guild.id, inline: true },
        { name: "Total Members", value: `${guild.memberCount}`, inline: true },
        { name: "Bot Role", value: botRoleName, inline: true }
      )
      .setFooter({ text: "Paradox Bot" })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // /postinvite (AURA Feature 1: Clickable Server Invite Embed)
  if (commandName === "postinvite") {
    if (!guild || !guildId) {
      return interaction.reply({ content: "❌ This command can only be used inside a server.", ephemeral: true });
    }

    if (!isManager) {
      return interaction.reply({
        content: "⛔ You need the **Manage Server** or **Administrator** permission to post server invites.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const customMessage = interaction.options.getString("custom_message");
    const overrideUrl = interaction.options.getString("invite_url");
    const targetChannel =
      (interaction.options.getChannel("channel") as TextChannel) ||
      (interaction.channel as TextChannel);

    if (!targetChannel) {
      return interaction.editReply({ content: "❌ Target channel not found or invalid." });
    }

    // Determine Invite URL dynamically
    let inviteUrl = overrideUrl?.trim();

    if (!inviteUrl) {
      // 1. Check if server has a vanity URL
      if (guild.vanityURLCode) {
        inviteUrl = `https://discord.gg/${guild.vanityURLCode}`;
      } else {
        // 2. Try fetching existing permanent invite
        try {
          const existingInvites = await guild.invites.fetch();
          const permanentInvite = existingInvites.find(
            (inv) => !inv.temporary && (inv.maxAge === 0 || inv.maxAge === null)
          );
          if (permanentInvite) {
            inviteUrl = permanentInvite.url;
          }
        } catch {
          // Fall through to creating a new invite
        }

        // 3. Create a new permanent invite for the target channel
        if (!inviteUrl) {
          try {
            const newInvite = await targetChannel.createInvite({
              maxAge: 0,
              maxUses: 0,
              unique: false,
              reason: `Aura /postinvite executed by ${interaction.user.tag}`,
            });
            inviteUrl = newInvite.url;
          } catch (err: any) {
            return interaction.editReply({
              content: `❌ Could not dynamically create an invite link: ${err.message}. Please provide an invite URL in the \`invite_url\` parameter or grant the bot **Create Instant Invite** permissions.`,
            });
          }
        }
      }
    }

    // Server branding colors: Purple (#8B5CF6 / 0x8B5CF6) with Red (#EF4444) accents
    const serverName = guild.name;
    const serverIcon = guild.iconURL({ size: 512 });
    const defaultTagline = "Enter the Aura. Find your people. Make memories.";
    const descriptionText = customMessage?.trim() || defaultTagline;

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle(`✨ Welcome to ${serverName}`)
      .setURL(inviteUrl)
      .setDescription(
        `**${descriptionText}**\n\n` +
        `Click the title above or the button below to enter **${serverName}**!\n\n` +
        `🔗 **Invite Link:** [${inviteUrl}](${inviteUrl})`
      )
      .setFooter({
        text: `${serverName} • Click title or button to join`,
        iconURL: serverIcon || undefined,
      })
      .setTimestamp();

    if (serverIcon) {
      embed.setThumbnail(serverIcon);
    }

    const bannerUrl = guild.bannerURL({ size: 1024 }) || guild.splashURL({ size: 1024 });
    if (bannerUrl) {
      embed.setImage(bannerUrl);
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Join ${serverName}`)
        .setStyle(ButtonStyle.Link)
        .setURL(inviteUrl)
        .setEmoji("🚀")
    );

    try {
      // Send the embed AND the raw invite link in content so Discord renders its native interactive server invite preview card
      await targetChannel.send({
        content: `${inviteUrl}\n*Enter the Aura. Find your people. Make memories.*`,
        embeds: [embed],
        components: [row],
      });

      return interaction.editReply({
        content: `✅ Branded server invite successfully posted to <#${targetChannel.id}>!\n*(Note: Discord's native preview widget is rendered automatically by Discord clients and its appearance is controlled by Discord).*`,
      });
    } catch (err: any) {
      return interaction.editReply({
        content: `❌ Failed to post invite to <#${targetChannel.id}>: ${err.message}. Make sure the bot has **Send Messages** and **Embed Links** permissions in that channel.`,
      });
    }
  }

  // /gif (AURA Feature 2: Make It a GIF)
  if (commandName === "gif") {
    const attachment = interaction.options.getAttachment("image");
    const url = interaction.options.getString("url");
    const style = (interaction.options.getString("style") as "pulse" | "zoom" | "scanline") || "pulse";

    if (!attachment && !url) {
      return interaction.reply({
        content: "❌ Please provide either an image attachment or a direct image URL.",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      let imageBuffer: Buffer;

      if (attachment) {
        if (!attachment.contentType?.startsWith("image/")) {
          return interaction.editReply({
            content: "❌ The attached file must be an image (PNG, JPG, WEBP).",
          });
        }
        if (attachment.size > 8 * 1024 * 1024) {
          return interaction.editReply({
            content: "❌ Image size exceeds the 8 MB maximum limit.",
          });
        }
        imageBuffer = await fetchSafeImageBuffer(attachment.url, 8 * 1024 * 1024);
      } else {
        const check = validateImageUrl(url!);
        if (!check.valid) {
          return interaction.editReply({
            content: `❌ Invalid or unsafe image URL: ${check.reason}`,
          });
        }
        imageBuffer = await fetchSafeImageBuffer(url!, 8 * 1024 * 1024);
      }

      const gifBuffer = await makeImageIntoGif(imageBuffer, style);
      const fileAttachment = new AttachmentBuilder(gifBuffer, { name: "aura-animated.gif" });

      return interaction.editReply({
        content: `✨ **Animated GIF Ready!** (Style: \`${style}\`)`,
        files: [fileAttachment],
      });
    } catch (err: any) {
      return interaction.editReply({
        content: `❌ Failed to generate animated GIF: ${err.message || "Unknown error occurred"}`,
      });
    }
  }

  // Helper to resolve raw Discord mentions (<@123>, <#123>, <@&123>) into readable display names
  async function resolveMentionsToNames(text: string, guild: any): Promise<string> {
    if (!text) return text;
    let res = text;

    // Resolve user mentions <@123456> or <@!123456>
    const userMentions = Array.from(res.matchAll(/<@!?(\d+)>/g));
    for (const m of userMentions) {
      const id = m[1];
      let name: string | null = null;
      if (guild) {
        const member = guild.members.cache.get(id) || (await guild.members.fetch(id).catch(() => null));
        name = member?.displayName || member?.user?.globalName || member?.user?.username || null;
      }
      if (!name && guild?.client) {
        const user = await guild.client.users.fetch(id).catch(() => null);
        name = user?.globalName || user?.username || null;
      }
      res = res.replace(m[0], `@${name || "User"}`);
    }

    // Resolve channel mentions <#123456>
    if (guild) {
      res = res.replace(/<#(\d+)>/g, (full, id) => {
        const ch = guild.channels.cache.get(id);
        return ch ? `#${ch.name}` : full;
      });

      // Resolve role mentions <@&123456>
      res = res.replace(/<@&(\d+)>/g, (full, id) => {
        const role = guild.roles.cache.get(id);
        return role ? `@${role.name}` : full;
      });
    }

    return res;
  }

  // /quote, /animatedquote, or Context Menu "Quote Message" (AURA Quote with User Avatar & Text)
  if (commandName === "quote" || commandName === "Quote Message" || commandName === "animatedquote") {
    const isAnimated = commandName === "animatedquote";
    const isContextMenu = (interaction as any).isMessageContextMenuCommand?.() || commandName === "Quote Message";

    await interaction.deferReply();

    try {
      let targetMsg: Message | null = null;
      let quoteText: string | null = null;
      let targetUser: User | null = null;
      let authorOverride: string | null = null;
      let bgAttachment: any = null;

      if (isContextMenu) {
        targetMsg = (interaction as any).targetMessage as Message;
      } else {
        const messageInput = interaction.options.getString("message");
        if (messageInput) {
          targetMsg = await resolveMessageFromInput(interaction.channel as TextChannel, messageInput);
          if (!targetMsg) {
            return interaction.editReply({
              content: `❌ Could not find message \`${messageInput}\`. Please make sure the message exists in this server and channel.`,
            });
          }
        }
        targetUser = interaction.options.getUser("user");
        quoteText = interaction.options.getString("quote");
        authorOverride = interaction.options.getString("author");
        bgAttachment = interaction.options.getAttachment("background");
      }

      let authorUser: User = interaction.user;
      const initialMember = interaction.member as GuildMember | null;
      let authorName: string =
        initialMember?.displayName ||
        interaction.user.globalName ||
        interaction.user.username;
      let authorTag: string = interaction.user.username;
      let avatarUrl: string =
        initialMember?.displayAvatarURL({ extension: "png", size: 512 }) ||
        interaction.user.displayAvatarURL({ extension: "png", size: 512 });
      let timestamp: string | undefined = undefined;

      if (targetMsg) {
        quoteText =
          quoteText ||
          targetMsg.content ||
          (targetMsg.attachments.size > 0 ? "[Photo / Attachment]" : "[Quoted Message]");
        authorUser = targetMsg.author;
        const msgMember = targetMsg.member || (await guild?.members.fetch(targetMsg.author.id).catch(() => null));
        authorName = msgMember?.displayName || targetMsg.author.globalName || targetMsg.author.username;
        authorTag = targetMsg.author.username;
        avatarUrl =
          msgMember?.displayAvatarURL({ extension: "png", size: 512 }) ||
          targetMsg.author.displayAvatarURL({ extension: "png", size: 512 });
        timestamp = targetMsg.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } else if (targetUser) {
        authorUser = targetUser;
        const targetMember = await guild?.members.fetch(targetUser.id).catch(() => null);
        authorName = targetMember?.displayName || targetUser.globalName || targetUser.username;
        authorTag = targetUser.username;
        avatarUrl =
          targetMember?.displayAvatarURL({ extension: "png", size: 512 }) ||
          targetUser.displayAvatarURL({ extension: "png", size: 512 });
      }

      // Resolve authorOverride if user passes a mention like <@123456>, ID, or custom name
      if (authorOverride && authorOverride.trim()) {
        const rawOverride = authorOverride.trim();
        const mentionMatch = rawOverride.match(/<@!?(\d+)>/);
        const idToLookup = mentionMatch ? mentionMatch[1] : /^\d{17,20}$/.test(rawOverride) ? rawOverride : null;

        if (idToLookup) {
          const member = await guild?.members.fetch(idToLookup).catch(() => null);
          const user = member?.user || (await client.users.fetch(idToLookup).catch(() => null));
          if (member) {
            authorUser = member.user;
            authorName = member.displayName;
            authorTag = member.user.username;
            if (!bgAttachment) avatarUrl = member.displayAvatarURL({ extension: "png", size: 512 });
          } else if (user) {
            authorUser = user;
            authorName = user.globalName || user.username;
            authorTag = user.username;
            if (!bgAttachment) avatarUrl = user.displayAvatarURL({ extension: "png", size: 512 });
          }
        } else {
          const cleanName = rawOverride.replace(/^@/, "").toLowerCase();
          const memberMatch = guild?.members.cache.find(
            (m) =>
              m.displayName.toLowerCase() === cleanName ||
              m.user.username.toLowerCase() === cleanName ||
              m.user.globalName?.toLowerCase() === cleanName
          );
          if (memberMatch) {
            authorUser = memberMatch.user;
            authorName = memberMatch.displayName;
            authorTag = memberMatch.user.username;
            if (!bgAttachment) avatarUrl = memberMatch.displayAvatarURL({ extension: "png", size: 512 });
          } else {
            authorName = rawOverride.replace(/^@/, "");
          }
        }
      }

      // Ensure authorName never retains raw <@id> syntax
      authorName = await resolveMentionsToNames(authorName, guild);
      if (/<@!?\d+>/.test(authorName)) {
        authorName = authorTag || "Anonymous";
      }

      if (!quoteText || !quoteText.trim()) {
        return interaction.editReply({
          content: "❌ Quote text is required. Please provide text in the `quote` option or specify a message to quote.",
        });
      }

      // Resolve any Discord mentions inside the quote text into readable names
      const cleanQuote = await resolveMentionsToNames(quoteText.trim(), guild);
      const maxLength = isAnimated ? 600 : 1000;
      if (cleanQuote.length > maxLength) {
        return interaction.editReply({
          content: `❌ Quote text is too long! Please keep it under ${maxLength} characters.`,
        });
      }

      let bgBuffer: Buffer | undefined;
      if (bgAttachment) {
        if (!bgAttachment.contentType?.startsWith("image/")) {
          return interaction.editReply({
            content: "❌ Background must be an image file (PNG, JPG, WEBP).",
          });
        }
        if (bgAttachment.size > 8 * 1024 * 1024) {
          return interaction.editReply({
            content: "❌ Background image size exceeds the 8 MB maximum limit.",
          });
        }
        bgBuffer = await fetchSafeImageBuffer(bgAttachment.url, 8 * 1024 * 1024);
      }

      if (isAnimated) {
        const gifBuffer = await generateAnimatedQuoteCard({
          text: cleanQuote,
          author: authorName,
          authorTag,
          avatarUrl,
          bgBuffer,
          serverName: guild?.name,
          timestamp,
        });

        const fileAttachment = new AttachmentBuilder(gifBuffer, { name: "aura-animated-quote.gif" });
        return interaction.editReply({
          content: `✨ **Animated Quote by ${authorName}**`,
          files: [fileAttachment],
        });
      } else {
        const cardBuffer = await generateQuoteCard({
          text: cleanQuote,
          author: authorName,
          authorTag,
          avatarUrl,
          bgBuffer,
          serverName: guild?.name,
          timestamp,
        });

        const fileAttachment = new AttachmentBuilder(cardBuffer, { name: "aura-quote.png" });
        return interaction.editReply({
          content: `📜 **Quote by ${authorName}**`,
          files: [fileAttachment],
        });
      }
    } catch (err: any) {
      return interaction.editReply({
        content: `❌ Failed to generate quote card: ${err.message || "Unknown error occurred"}`,
      });
    }
  }
}

/**
 * Handle prefix text commands ($help, $ping, $rr, $roledeck, $videofix, $embed, $prefix)
 */
export async function handleTextCommand(message: Message, prefix: string) {
  const content = message.content.slice(prefix.length).trim();
  const args = content.split(/\s+/);
  const command = args[0]?.toLowerCase();
  const guild = message.guild;
  const member = message.member;
  const isManager =
    member?.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
    member?.permissions.has(PermissionsBitField.Flags.Administrator);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (command === "ping") {
    const ping = message.client.ws.ping;
    return message.reply(`🏓 Pong! WebSocket Latency: **${ping}ms**`);
  }

  // $quote or $q (Make it a quote by replying to any message)
  if (command === "quote" || command === "q") {
    let targetMsg: Message | null = null;
    let quoteText: string | null = null;

    // 1. Check if user replied to a message
    if (message.reference?.messageId) {
      try {
        targetMsg = await message.fetchReference().catch(() => null);
        if (!targetMsg && message.channel && "messages" in message.channel) {
          targetMsg = await (message.channel as TextChannel).messages.fetch(message.reference.messageId).catch(() => null);
        }
      } catch {}

      if (args.length > 1) {
        quoteText = args.slice(1).join(" ");
      }
    } else if (args[1]) {
      // 2. Check if user provided message link or ID
      targetMsg = await resolveMessageFromInput(message.channel as TextChannel, args[1]);
      if (!targetMsg) {
        quoteText = args.slice(1).join(" ");
      }
    }

    let authorUser: User = message.author;
    let authorName: string = message.member?.displayName || message.author.globalName || message.author.username;
    let authorTag: string = message.author.username;
    let avatarUrl: string =
      message.member?.displayAvatarURL({ extension: "png", size: 512, forceStatic: true }) ||
      message.author.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });

    if (targetMsg) {
      quoteText =
        quoteText ||
        targetMsg.content ||
        (targetMsg.attachments.size > 0 ? "[Photo / Attachment]" : "[Quoted Message]");
      authorUser = targetMsg.author;
      const targetMember = targetMsg.member || (await guild?.members.fetch(targetMsg.author.id).catch(() => null));
      authorName = targetMember?.displayName || targetMsg.author.globalName || targetMsg.author.username;
      authorTag = targetMsg.author.username;
      avatarUrl =
        targetMember?.displayAvatarURL({ extension: "png", size: 512, forceStatic: true }) ||
        targetMsg.author.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
    } else if (message.mentions.users.size > 0) {
      const mentionedMember = message.mentions.members?.first();
      const mentionedUser = message.mentions.users.first()!;
      authorUser = mentionedUser;
      authorName = mentionedMember?.displayName || mentionedUser.globalName || mentionedUser.username;
      authorTag = mentionedUser.username;
      avatarUrl =
        mentionedMember?.displayAvatarURL({ extension: "png", size: 512, forceStatic: true }) ||
        mentionedUser.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
      quoteText = args.slice(1).join(" ").replace(/<@!?\d+>/g, "").trim();
    }

    if (!quoteText || !quoteText.trim()) {
      return message.reply(`💡 **Usage:** Reply to any message and type \`${prefix}quote\` to turn it into a photo quote!`);
    }

    authorName = await resolveMentionsToNames(authorName, guild);
    if (/<@!?\d+>/.test(authorName)) {
      authorName = authorTag || "Anonymous";
    }

    const cleanQuote = await resolveMentionsToNames(quoteText.trim(), guild);

    await message.channel.sendTyping().catch(() => null);

    try {
      const cardBuffer = await generateQuoteCard({
        text: cleanQuote,
        author: authorName,
        authorTag,
        avatarUrl,
        serverName: guild?.name,
      });

      const fileAttachment = new AttachmentBuilder(cardBuffer, { name: "quote.png" });
      return message.reply({ files: [fileAttachment] });
    } catch (err: any) {
      console.error("[Bot:Quote] Error generating quote card:", err);
      return message.reply(`❌ Failed to generate quote card: ${err.message}`);
    }
  }

  if (command === "help") {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🤖 Paradox Specialist Bot — Command Guide")
      .setDescription(
        `Current Server Prefix: \`${prefix}\`\n\n` +
        "Paradox is optimized for **Visual Roles** and **Social Video Fixes**."
      )
      .addFields(
        {
          name: "🎭 Roles & Reaction Commands",
          value:
            `\`${prefix}rr unique <msgId> <emoji> <@role>\` — Single-choice role (auto-swaps)\n` +
            `\`${prefix}rr onetime <msgId> <emoji> <@role>\` — One-time claim (verification lock)\n` +
            `\`${prefix}rr multi <msgId> <emoji> <@role>\` — Multi-role (toggle freely)\n` +
            `\`${prefix}rr restrict <msgId> <emoji> <@role> <@reqRole>\` — Restricted role\n` +
            `\`${prefix}rr setmode <msgId> <unique|onetime|multi>\` — Switch message mode\n` +
            `\`${prefix}rr remove <msgId> <emoji>\` — Remove mapping\n` +
            `\`${prefix}rr deletedeck <msgId> [--discord]\` — Delete entire deck & roles\n` +
            `\`${prefix}rr purge [--discord]\` — Purge all role mappings in server\n` +
            `\`${prefix}rr list\` — List active mappings`,
        },
        {
          name: "🎥 Video Fixer Commands",
          value:
            `\`${prefix}videofix status\` — Fixer status & platforms\n` +
            `\`${prefix}videofix toggle\` — Toggle on/off\n` +
            `\`${prefix}videofix deletebtn <on|off>\` — Toggle author 🗑️ button`,
        },
        {
          name: "📢 Embeds & Utilities",
          value:
            `\`${prefix}embed <title> | <description>\` — Post quick embed\n` +
            `\`${prefix}embed edit <msgId> <title> | <description>\` — Edit existing embed\n` +
            `\`${prefix}prefix <newPrefix>\` — Change server prefix\n` +
            `\`${prefix}dashboard\` — Web dashboard link`,
        }
      )
      .setFooter({ text: "Type '/' to use interactive Discord slash commands!" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // $prefix <new_prefix>
  if (command === "prefix") {
    if (!guild || !member) return;
    if (!isManager) return message.reply("⛔ You need the **Manage Server** permission to change prefix.");

    const newPrefix = args[1]?.trim();
    if (!newPrefix || newPrefix.length > 5) {
      return message.reply(`Usage: \`${prefix}prefix <newPrefix>\` (1-5 characters)`);
    }

    await prisma.guildConfig.update({
      where: { id: guild.id },
      data: { prefix: newPrefix },
    });

    return message.reply(`✅ Command prefix updated! The new prefix is now \`${newPrefix}\` (e.g. \`${newPrefix}help\`).`);
  }

  // $rr / $reactionrole
  if (command === "rr" || command === "reactionrole") {
    if (!guild || !member) return;
    if (!isManager) return message.reply("⛔ You need the **Manage Server** permission.");

    const sub = args[1]?.toLowerCase();

    if (sub === "add") {
      const msgId = args[2];
      const emoji = args[3];
      const roleMention = message.mentions.roles.first() || guild.roles.cache.get(args[4]);
      const mode = (args[5]?.toUpperCase() as any) || "TOGGLE";

      if (!msgId || !emoji || !roleMention) {
        return message.reply(
          `Usage: \`${prefix}rr add <message_id> <emoji> <@role> [TOGGLE|UNIQUE|VERIFY]\``
        );
      }

      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("❌ The bot is missing **Manage Roles** permission.");
      }

      if (roleMention.position >= botMember.roles.highest.position) {
        return message.reply(`❌ **${roleMention.name}** is positioned higher than the bot's role.`);
      }

      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) await targetMsg.react(emoji).catch(() => null);

      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: roleMention.id,
          roleName: roleMention.name,
          type: "REACTION",
          mode,
        },
      });

      return message.reply(
        `✅ Reaction role configured with mode \`${mode}\`! Reacting with ${emoji} grants **${roleMention.name}**.`
      );
    }

    // $rr unique <msgId> <emoji> <@role>
    if (sub === "unique") {
      const msgId = args[2];
      const emoji = args[3];
      const roleMention = message.mentions.roles.first() || guild.roles.cache.get(args[4]);

      if (!msgId || !emoji || !roleMention) {
        return message.reply(`Usage: \`${prefix}rr unique <message_id> <emoji> <@role>\`\n*Selecting this role will revoke any previously equipped role in this panel.*`);
      }

      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("❌ The bot is missing **Manage Roles** permission.");
      }
      if (roleMention.position >= botMember.roles.highest.position) {
        return message.reply(`❌ **${roleMention.name}** is positioned higher than the bot's role.`);
      }

      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) await targetMsg.react(emoji).catch(() => null);

      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: roleMention.id,
          roleName: roleMention.name,
          type: "REACTION",
          mode: "UNIQUE",
        },
      });

      return message.reply(`🔘 **Unique Role Configured:** Reacting with ${emoji} gives **${roleMention.name}** and revokes other roles in this group!`);
    }

    // $rr onetime <msgId> <emoji> <@role>
    if (sub === "onetime" || sub === "verify") {
      const msgId = args[2];
      const emoji = args[3];
      const roleMention = message.mentions.roles.first() || guild.roles.cache.get(args[4]);

      if (!msgId || !emoji || !roleMention) {
        return message.reply(`Usage: \`${prefix}rr onetime <message_id> <emoji> <@role>\`\n*Members can claim this role only once; cannot be removed.*`);
      }

      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("❌ The bot is missing **Manage Roles** permission.");
      }
      if (roleMention.position >= botMember.roles.highest.position) {
        return message.reply(`❌ **${roleMention.name}** is positioned higher than the bot's role.`);
      }

      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) await targetMsg.react(emoji).catch(() => null);

      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: roleMention.id,
          roleName: roleMention.name,
          type: "REACTION",
          mode: "VERIFY",
        },
      });

      return message.reply(`🔒 **One-Time Role Configured:** Reacting with ${emoji} grants **${roleMention.name}** permanently (verification lock)!`);
    }

    // $rr multi <msgId> <emoji> <@role>
    if (sub === "multi" || sub === "multirole") {
      const msgId = args[2];
      const emoji = args[3];
      const roleMention = message.mentions.roles.first() || guild.roles.cache.get(args[4]);

      if (!msgId || !emoji || !roleMention) {
        return message.reply(`Usage: \`${prefix}rr multi <message_id> <emoji> <@role>\`\n*Members can toggle multiple roles freely.*`);
      }

      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("❌ The bot is missing **Manage Roles** permission.");
      }
      if (roleMention.position >= botMember.roles.highest.position) {
        return message.reply(`❌ **${roleMention.name}** is positioned higher than the bot's role.`);
      }

      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) await targetMsg.react(emoji).catch(() => null);

      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: roleMention.id,
          roleName: roleMention.name,
          type: "REACTION",
          mode: "TOGGLE",
        },
      });

      return message.reply(`🔁 **Multi-Role Configured:** Reacting with ${emoji} toggles **${roleMention.name}**.`);
    }

    // $rr restrict <msgId> <emoji> <@role> <@required_role>
    if (sub === "restrict") {
      const msgId = args[2];
      const emoji = args[3];
      const rolesMentioned = message.mentions.roles;
      const targetRole = rolesMentioned.first() || guild.roles.cache.get(args[4]);
      const requiredRole = rolesMentioned.size > 1 ? rolesMentioned.at(1) : guild.roles.cache.get(args[5]);

      if (!msgId || !emoji || !targetRole || !requiredRole) {
        return message.reply(`Usage: \`${prefix}rr restrict <message_id> <emoji> <@targetRole> <@requiredRole>\`\n*Requires members to have @requiredRole before they can claim @targetRole.*`);
      }

      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("❌ The bot is missing **Manage Roles** permission.");
      }
      if (targetRole.position >= botMember.roles.highest.position) {
        return message.reply(`❌ **${targetRole.name}** is positioned higher than the bot's role.`);
      }

      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) await targetMsg.react(emoji).catch(() => null);

      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: targetRole.id,
          roleName: targetRole.name,
          type: "REACTION",
          mode: "TOGGLE",
          requiredRoleId: requiredRole.id,
        },
      });

      return message.reply(`🛡️ **Restricted Role Configured:** Reacting with ${emoji} grants **${targetRole.name}**, but ONLY if the member already has **${requiredRole.name}**!`);
    }

    // $rr setmode <msgId> <unique|onetime|multi|reversed>
    if (sub === "setmode" || sub === "mode") {
      const msgId = args[2];
      const rawMode = args[3]?.toLowerCase();
      let modeToSet = "TOGGLE";

      if (rawMode === "unique" || rawMode === "radio") modeToSet = "UNIQUE";
      else if (rawMode === "onetime" || rawMode === "verify") modeToSet = "VERIFY";
      else if (rawMode === "multi" || rawMode === "toggle") modeToSet = "TOGGLE";
      else if (rawMode === "reversed" || rawMode === "remove") modeToSet = "REVERSED";
      else {
        return message.reply(`Usage: \`${prefix}rr setmode <message_id> <unique|onetime|multi|reversed>\``);
      }

      const updated = await prisma.reactionRole.updateMany({
        where: { guildId: guild.id, messageId: msgId },
        data: { mode: modeToSet },
      });

      if (updated.count === 0) {
        return message.reply(`⚠️ No reaction role mappings found for message \`${msgId}\`.`);
      }

      return message.reply(`✅ Updated **${updated.count}** role mapping(s) on message \`${msgId}\` to mode **\`${modeToSet}\`**!`);
    }

    if (sub === "remove") {
      const msgId = args[2];
      const emoji = args[3];
      if (!msgId || !emoji) return message.reply(`Usage: \`${prefix}rr remove <message_id> <emoji>\``);

      await prisma.reactionRole.deleteMany({
        where: { guildId: guild.id, messageId: msgId, emoji },
      });
      return message.reply(`✅ Removed mapping for ${emoji} on message \`${msgId}\`.`);
    }

    // $rr deletedeck <msgId> [--discord]
    if (sub === "deletedeck" || sub === "deldeck") {
      const msgId = args[2]?.trim();
      const deleteMsg = args[3]?.toLowerCase() === "--discord" || args[3]?.toLowerCase() === "true";

      if (!msgId) {
        return message.reply(`Usage: \`${prefix}rr deletedeck <message_id> [--discord]\`\n*(Add \`--discord\` to also delete the message from the channel)*`);
      }

      const mappings = await prisma.reactionRole.findMany({
        where: { guildId: guild.id, messageId: msgId },
      });

      if (mappings.length === 0) {
        return message.reply(`⚠️ No role deck found matching Message ID \`${msgId}\`.`);
      }

      const count = mappings.length;
      const channelId = mappings[0].channelId;

      if (deleteMsg && channelId) {
        try {
          const ch = await guild.channels.fetch(channelId).catch(() => null);
          if (ch && "messages" in ch) {
            const msg = await (ch as TextChannel).messages.fetch(msgId).catch(() => null);
            if (msg) await msg.delete().catch(() => null);
          }
        } catch {}
      }

      await prisma.reactionRole.deleteMany({
        where: { guildId: guild.id, messageId: msgId },
      });

      return message.reply(`🗑️ **Role Deck Deleted:** Removed all **${count}** role mapping(s) from message \`${msgId}\`${deleteMsg ? " and deleted the Discord message" : ""}!`);
    }

    // $rr purge [--discord] / $rr deleteall
    if (sub === "purge" || sub === "deleteall") {
      const deleteMsgs = args[2]?.toLowerCase() === "--discord" || args[2]?.toLowerCase() === "true";

      if (deleteMsgs) {
        const distinctMessages = await prisma.reactionRole.findMany({
          where: { guildId: guild.id },
          select: { channelId: true, messageId: true },
          distinct: ["channelId", "messageId"],
        });

        for (const m of distinctMessages) {
          if (m.channelId && m.messageId) {
            try {
              const ch = await guild.channels.fetch(m.channelId).catch(() => null);
              if (ch && "messages" in ch) {
                const msg = await (ch as TextChannel).messages.fetch(m.messageId).catch(() => null);
                if (msg) await msg.delete().catch(() => null);
              }
            } catch {}
          }
        }
      }

      const deleted = await prisma.reactionRole.deleteMany({
        where: { guildId: guild.id },
      });

      return message.reply(`🧹 **Purge Complete:** Successfully deleted all **${deleted.count}** reaction role mappings and decks in this server${deleteMsgs ? " and deleted their Discord messages" : ""}!`);
    }

    if (sub === "clean") {
      const all = await prisma.reactionRole.findMany({ where: { guildId: guild.id } });
      let purged = 0;
      for (const m of all) {
        if (!guild.roles.cache.has(m.roleId)) {
          await prisma.reactionRole.delete({ where: { id: m.id } });
          purged++;
        }
      }
      return message.reply(`🧹 Cleaned up **${purged}** deleted role mapping(s).`);
    }

    if (sub === "list") {
      const all = await prisma.reactionRole.findMany({ where: { guildId: guild.id } });
      if (all.length === 0) return message.reply("No reaction roles configured yet.");
      const summary = all.map((m) => `• ${m.emoji} **${m.roleName}** (\`${m.mode || "TOGGLE"}\`)`).join("\n");
      return message.reply(`**Active Roles:**\n${summary}`);
    }
  }

  // $videofix
  if (command === "videofix") {
    if (!guild || !member) return;
    const sub = args[1]?.toLowerCase();

    if (sub === "toggle") {
      if (!isManager) return message.reply("⛔ You need **Manage Server** permission.");
      const config = await prisma.guildConfig.findUnique({ where: { id: guild.id } });
      const current = config?.videoFixerEnabled ?? true;
      const updated = await prisma.guildConfig.update({
        where: { id: guild.id },
        data: { videoFixerEnabled: !current },
      });
      return message.reply(`🎥 Video Fixer is now **${updated.videoFixerEnabled ? "Active" : "Disabled"}**.`);
    }

    if (sub === "deletebtn") {
      if (!isManager) return message.reply("⛔ You need **Manage Server** permission.");
      const val = args[2]?.toLowerCase() === "on";
      await prisma.guildConfig.update({
        where: { id: guild.id },
        data: { videoFixerDeleteButton: val },
      });
      return message.reply(`🗑️ Author dismiss button is now **${val ? "Enabled" : "Disabled"}**.`);
    }

    // Default: status
    const config = await prisma.guildConfig.findUnique({ where: { id: guild.id } });
    const enabled = config?.videoFixerEnabled ?? true;
    return message.reply(
      `🎥 **Social Video Fixer Engine:** ${enabled ? "Active ✅" : "Disabled ❌"}\n` +
      `Supported: Twitter/X, TikTok, Instagram Reels, Reddit, Bluesky, Threads`
    );
  }

  // $embed <title> | <description> OR $embed edit <messageId> <title> | <description>
  if (command === "embed") {
    if (!guild || !member) return;
    if (!isManager) return message.reply("⛔ You need **Manage Server** permission.");

    const raw = content.slice(command.length).trim();

    // Check for $embed edit <messageId> <title> | <desc>
    if (raw.toLowerCase().startsWith("edit")) {
      const editRaw = raw.slice(4).trim();
      const firstSpaceIdx = editRaw.indexOf(" ");
      if (firstSpaceIdx === -1) {
        return message.reply(`Usage: \`${prefix}embed edit <message_id> <title> | <description>\``);
      }

      const msgId = editRaw.slice(0, firstSpaceIdx).trim();
      const contentRest = editRaw.slice(firstSpaceIdx).trim();
      const parts = contentRest.split("|");
      const title = parts[0]?.trim();
      const desc = parts[1]?.trim();

      if (!msgId || !title || !desc) {
        return message.reply(`Usage: \`${prefix}embed edit <message_id> <title> | <description>\``);
      }

      // Check current channel or find across guild text channels
      let targetMsg: Message | null = await message.channel.messages.fetch(msgId).catch(() => null);
      if (!targetMsg) {
        for (const ch of guild.channels.cache.values()) {
          if (ch.isTextBased() && "messages" in ch) {
            targetMsg = await ch.messages.fetch(msgId).catch(() => null);
            if (targetMsg) break;
          }
        }
      }

      if (!targetMsg) {
        return message.reply(`❌ Message \`${msgId}\` was not found. Make sure the message exists in a channel Paradox can read.`);
      }

      if (targetMsg.author.id !== message.client.user?.id) {
        return message.reply(`❌ Paradox can only edit embed messages originally sent by Paradox itself.`);
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(title)
        .setDescription(desc)
        .setTimestamp();

      await targetMsg.edit({ embeds: [embed] });
      return message.reply(`✅ Successfully updated embed for message \`${msgId}\`!`);
    }

    const parts = raw.split("|");
    const title = parts[0]?.trim();
    const desc = parts[1]?.trim();

    if (!title || !desc) {
      return message.reply(`Usage: \`${prefix}embed <title> | <description>\`\nOr to edit: \`${prefix}embed edit <message_id> <title> | <description>\``);
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(title)
      .setDescription(desc)
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }

  if (command === "dashboard") {
    return message.reply(`Manage Paradox in the web dashboard: ${appUrl}/dashboard/${guild?.id}`);
  }
}
