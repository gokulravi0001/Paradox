import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  PermissionsBitField,
  ChannelType,
  TextChannel,
  Role,
} from "discord.js";
import { prisma } from "@/lib/prisma";

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
          { name: "Toggle (Normal select / unselect)", value: "TOGGLE" },
          { name: "Unique (Pick one only, automatically swaps)", value: "UNIQUE" },
          { name: "Verify (One-time claim only)", value: "VERIFY" }
        )
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

  // 4. Rich Embed Publisher
  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Create and publish a rich Discord embed to any channel")
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
      opt.setName("color").setDescription("Hex color (e.g. #5865F2, #57F287, #ED4245)")
    )
    .addStringOption((opt) =>
      opt.setName("image").setDescription("Large banner image or GIF URL")
    )
    .addStringOption((opt) =>
      opt.setName("thumbnail").setDescription("Small top-right thumbnail icon URL")
    ),
];

/**
 * Handle slash command execution
 */
export async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
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
  }

  // /roledeck
  if (commandName === "roledeck") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    if (!isManager) return interaction.reply({ content: "⛔ You need the **Manage Server** permission.", ephemeral: true });

    const title = interaction.options.getString("title", true);
    const desc = interaction.options.getString("description") || "Click the buttons below to claim or remove roles:";
    const mode = interaction.options.getString("mode") || "TOGGLE";
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

    await targetChannel.send({ embeds: [embed] });

    return interaction.reply({ content: `✅ Embed published to <#${targetChannel.id}>!`, ephemeral: true });
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
          name: "🎭 Roles Commands",
          value:
            `\`${prefix}rr add <msgId> <emoji> <@role> [TOGGLE|UNIQUE|VERIFY]\` — Add reaction role\n` +
            `\`${prefix}rr remove <msgId> <emoji>\` — Remove mapping\n` +
            `\`${prefix}rr list\` — List active mappings\n` +
            `\`${prefix}rr clean\` — Clean deleted roles`,
        },
        {
          name: "🎥 Video Fixer Commands",
          value:
            `\`${prefix}videofix status\` — Fixer status & platforms\n` +
            `\`${prefix}videofix toggle\` — Toggle on/off\n` +
            `\`${prefix}videofix deletebtn <on|off>\` — Toggle author 🗑️ button`,
        },
        {
          name: "📢 Utilities",
          value:
            `\`${prefix}prefix <newPrefix>\` — Change server prefix\n` +
            `\`${prefix}embed <title> | <description>\` — Post quick embed\n` +
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

    if (sub === "remove") {
      const msgId = args[2];
      const emoji = args[3];
      if (!msgId || !emoji) return message.reply(`Usage: \`${prefix}rr remove <message_id> <emoji>\``);

      await prisma.reactionRole.deleteMany({
        where: { guildId: guild.id, messageId: msgId, emoji },
      });
      return message.reply(`✅ Removed mapping for ${emoji} on message \`${msgId}\`.`);
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

  // $embed <title> | <description>
  if (command === "embed") {
    if (!guild || !member) return;
    if (!isManager) return message.reply("⛔ You need **Manage Server** permission.");

    const raw = content.slice(command.length).trim();
    const parts = raw.split("|");
    const title = parts[0]?.trim();
    const desc = parts[1]?.trim();

    if (!title || !desc) {
      return message.reply(`Usage: \`${prefix}embed <title> | <description>\``);
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
