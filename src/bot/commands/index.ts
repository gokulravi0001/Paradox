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

  // 1. Reaction Roles Command
  new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Manage emoji-to-role mappings directly from Discord")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add an emoji reaction role to an existing message")
        .addStringOption((opt) =>
          opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("emoji").setDescription("The emoji trigger (e.g. ⭐, 🎮)").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("The role to grant upon reacting").setRequired(true)
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The channel containing the message (defaults to current)")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
        .addStringOption((opt) =>
          opt.setName("description").setDescription("Optional perk description for this role")
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
    ),

  // 2. Visual Role Deck Command
  new SlashCommandBuilder()
    .setName("roledeck")
    .setDescription("Deploy an interactive Visual Role Deck with clickable buttons and banner GIF")
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
      opt.setName("banner_gif").setDescription("URL of header banner image or animated GIF (optional)")
    )
    .addStringOption((opt) =>
      opt.setName("description").setDescription("Description text above buttons (optional)")
    )
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Destination channel (defaults to current channel)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    ),

  // 3. Rich Embed Publisher Command
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

  // 4. Video Link Fixer Command
  new SlashCommandBuilder()
    .setName("videofix")
    .setDescription("Manage social video link fixer (Twitter, TikTok, Instagram, Reddit)")
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Check video fixer status and enabled providers")
    )
    .addSubcommand((sub) =>
      sub.setName("toggle").setDescription("Enable or disable video fixer for this server")
    )
    .addSubcommand((sub) =>
      sub
        .setName("ignore")
        .setDescription("Ignore or unignore video links in a specific channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target channel")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    ),
];

/**
 * Handle slash command execution
 */
export async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  const { commandName, guildId, guild, client, memberPermissions } = interaction;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Check Admin / Manage Server permission helper
  const isManager =
    memberPermissions?.has(PermissionsBitField.Flags.ManageGuild) ||
    memberPermissions?.has(PermissionsBitField.Flags.Administrator);

  // ----------------------------------------------------
  // /ping
  // ----------------------------------------------------
  if (commandName === "ping") {
    const ping = client.ws.ping;
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("🏓 Pong!")
      .setDescription(`Gateway WebSocket Latency: **${ping}ms**`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  // ----------------------------------------------------
  // /help
  // ----------------------------------------------------
  if (commandName === "help") {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🤖 Paradox Bot — Command & Feature Guide")
      .setDescription(
        "Manage your server directly from Discord using **Slash Commands** or via the **Web Dashboard**!"
      )
      .addFields(
        {
          name: "🎭 Reaction Roles & Role Decks",
          value:
            "`/reactionrole add` — Attach an emoji role to any existing message\n" +
            "`/reactionrole remove` — Delete an emoji role mapping\n" +
            "`/reactionrole list` — List all active server role mappings\n" +
            "`/roledeck` — Deploy an interactive visual role card with clickable buttons!",
        },
        {
          name: "📢 Rich Discord Embeds",
          value: "`/embed` — Create and post rich embeds with custom images, colors, and channels.",
        },
        {
          name: "🎥 Social Video Embeds",
          value:
            "`/videofix status` — View status for Twitter, TikTok, Instagram & Reddit\n" +
            "`/videofix toggle` — Enable or disable video fixer for the server\n" +
            "`/videofix ignore` — Mute video fixer in specific channels",
        },
        {
          name: "⚙️ Utilities",
          value: "`/ping` — Check latency\n`/serverinfo` — Server stats & bot health\n`/dashboard` — Web link",
        }
      )
      .setFooter({ text: "Paradox Bot • In-Discord Commands Ready" })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Open Web Dashboard")
        .setStyle(ButtonStyle.Link)
        .setURL(guildId ? `${appUrl}/dashboard/${guildId}` : `${appUrl}/dashboard`)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  // ----------------------------------------------------
  // /reactionrole (add, remove, list)
  // ----------------------------------------------------
  if (commandName === "reactionrole") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "list") {
      const mappings = await prisma.reactionRole.findMany({ where: { guildId } }).catch(() => []);
      if (mappings.length === 0) {
        return interaction.reply({
          content: "No reaction roles configured in this server. Use `/reactionrole add` or `/roledeck` to create one!",
          ephemeral: true,
        });
      }

      const listText = mappings
        .map((m) => `• ${m.emoji} **${m.roleName}** (${m.type}) in <#${m.channelId}> — Msg: \`${m.messageId}\``)
        .join("\n");

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎭 Active Reaction Roles (${mappings.length})`)
        .setDescription(listText)
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Require Manage Guild for mutations
    if (!isManager) {
      return interaction.reply({
        content: "⛔ You need the **Manage Server** permission to configure reaction roles.",
        ephemeral: true,
      });
    }

    if (subcommand === "add") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const emoji = interaction.options.getString("emoji", true).trim();
      const role = interaction.options.getRole("role", true) as Role;
      const desc = interaction.options.getString("description");
      const targetChannel =
        (interaction.options.getChannel("channel") as TextChannel) ||
        (interaction.channel as TextChannel);

      if (!targetChannel) {
        return interaction.reply({ content: "Invalid channel specified.", ephemeral: true });
      }

      // Hierarchy Check
      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.reply({
          content: "❌ The bot lacks the **Manage Roles** permission.",
          ephemeral: true,
        });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `❌ Role Hierarchy Error: **${role.name}** is higher than or equal to the bot's role. Drag the bot's role above **${role.name}** in Server Settings > Roles.`,
          ephemeral: true,
        });
      }

      if (role.managed) {
        return interaction.reply({
          content: "❌ Cannot assign managed / integration roles.",
          ephemeral: true,
        });
      }

      // Attempt to react to the message
      try {
        const msg = await targetChannel.messages.fetch(messageId).catch(() => null);
        if (msg) {
          await msg.react(emoji).catch(() => null);
        }
      } catch {}

      // Save to Database
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
        },
      });

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("✅ Reaction Role Configured!")
        .setDescription(
          `Reacting with ${emoji} on message \`${messageId}\` in <#${targetChannel.id}> will now grant/remove the **${role.name}** role.`
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "remove") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const emoji = interaction.options.getString("emoji", true).trim();

      const deleted = await prisma.reactionRole.deleteMany({
        where: {
          guildId,
          messageId,
          emoji,
        },
      });

      if (deleted.count === 0) {
        return interaction.reply({
          content: `No reaction role mapping found with emoji ${emoji} on message \`${messageId}\`.`,
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `✅ Successfully removed ${deleted.count} reaction role mapping(s) for message \`${messageId}\`.`,
      });
    }
  }

  // ----------------------------------------------------
  // /roledeck (Deploy interactive visual buttons & GIF panel)
  // ----------------------------------------------------
  if (commandName === "roledeck") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });

    if (!isManager) {
      return interaction.reply({
        content: "⛔ You need the **Manage Server** permission to deploy role decks.",
        ephemeral: true,
      });
    }

    const title = interaction.options.getString("title", true);
    const desc = interaction.options.getString("description") || "Click the buttons below to claim or remove roles:";
    const bannerGif = interaction.options.getString("banner_gif");
    const targetChannel =
      (interaction.options.getChannel("channel") as TextChannel) ||
      (interaction.channel as TextChannel);

    if (!targetChannel) return interaction.reply({ content: "Invalid channel.", ephemeral: true });

    // Collect roles
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

    // Hierarchy check
    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: "❌ The bot lacks **Manage Roles** permission.", ephemeral: true });
    }

    for (const item of deckRoles) {
      if (item.role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `❌ Role Hierarchy Error: **${item.role.name}** is higher than or equal to the bot's role. Please reorder roles in Discord Server Settings.`,
          ephemeral: true,
        });
      }
    }

    // Build embed
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`✨ ${title}`)
      .setDescription(desc)
      .setFooter({ text: "Paradox Visual Role Deck • Click below to Claim or Remove" })
      .setTimestamp();

    if (bannerGif) {
      embed.setImage(bannerGif);
    }

    // Build buttons
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (const item of deckRoles) {
      embed.addFields({
        name: `${item.emoji} ${item.role.name}`,
        value: `Click button below to toggle`,
        inline: true,
      });

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`rr_role_${item.role.id}`)
          .setLabel(item.role.name)
          .setStyle(ButtonStyle.Primary)
      );
    }

    // Send to channel
    const sentMsg = await targetChannel.send({ embeds: [embed], components: [row] });

    // Save all to database
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
          bannerUrl: bannerGif || null,
        },
      });
    }

    return interaction.reply({
      content: `🎉 Visual Role Deck deployed to <#${targetChannel.id}> with **${deckRoles.length}** interactive role buttons!`,
      ephemeral: true,
    });
  }

  // ----------------------------------------------------
  // /embed
  // ----------------------------------------------------
  if (commandName === "embed") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });

    if (!isManager) {
      return interaction.reply({ content: "⛔ You need the **Manage Server** permission.", ephemeral: true });
    }

    const targetChannel = interaction.options.getChannel("channel", true) as TextChannel;
    const title = interaction.options.getString("title", true);
    const description = interaction.options.getString("description", true);
    const colorHex = interaction.options.getString("color") || "#5865F2";
    const image = interaction.options.getString("image");
    const thumbnail = interaction.options.getString("thumbnail");

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();

    try {
      const cleanHex = colorHex.replace("#", "");
      embed.setColor(parseInt(cleanHex, 16));
    } catch {
      embed.setColor(0x5865f2);
    }

    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);

    await targetChannel.send({ embeds: [embed] });

    return interaction.reply({
      content: `✅ Embed published successfully to <#${targetChannel.id}>!`,
      ephemeral: true,
    });
  }

  // ----------------------------------------------------
  // /videofix (status, toggle, ignore)
  // ----------------------------------------------------
  if (commandName === "videofix") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });

    const subcommand = interaction.options.getSubcommand();
    const config = await prisma.guildConfig.findUnique({ where: { id: guildId } }).catch(() => null);

    if (subcommand === "status") {
      const enabled = config?.videoFixerEnabled ?? true;
      let providers = ["twitter", "tiktok", "instagram", "reddit"];
      try {
        if (config?.videoFixerProviders) providers = JSON.parse(config.videoFixerProviders);
      } catch {}

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x57f287 : 0xed4245)
        .setTitle("🎥 Video Link Fixer Status")
        .setDescription(`Video Fixer is currently **${enabled ? "Active ✅" : "Disabled ❌"}**`)
        .addFields({
          name: "Supported Platforms",
          value: providers.map((p) => `• **${p.toUpperCase()}**`).join("\n"),
        })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (!isManager) {
      return interaction.reply({ content: "⛔ You need **Manage Server** permission.", ephemeral: true });
    }

    if (subcommand === "toggle") {
      const current = config?.videoFixerEnabled ?? true;
      const updated = await prisma.guildConfig.update({
        where: { id: guildId },
        data: { videoFixerEnabled: !current },
      });

      return interaction.reply({
        content: `🎥 Video Fixer has been **${updated.videoFixerEnabled ? "Enabled ✅" : "Disabled ❌"}** for this server!`,
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
        return interaction.reply({ content: `✅ <#${targetChannel.id}> is now **unignored** (videos will be fixed).` });
      } else {
        ignored.push(targetChannel.id);
        await prisma.guildConfig.update({
          where: { id: guildId },
          data: { videoFixerIgnoredChannels: JSON.stringify(ignored) },
        });
        return interaction.reply({ content: `🔇 <#${targetChannel.id}> is now **ignored** by the video fixer.` });
      }
    }
  }

  // ----------------------------------------------------
  // /dashboard
  // ----------------------------------------------------
  if (commandName === "dashboard") {
    const dashboardUrl = guildId ? `${appUrl}/dashboard/${guildId}` : `${appUrl}/dashboard`;
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("⚙️ Server Dashboard")
      .setDescription(`Configure Reaction Roles, Embeds, and Video Fixer for **${guild?.name}**:`)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Open Web Dashboard")
        .setStyle(ButtonStyle.Link)
        .setURL(dashboardUrl)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  // ----------------------------------------------------
  // /serverinfo
  // ----------------------------------------------------
  if (commandName === "serverinfo") {
    if (!guild) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });

    const botMember = await guild.members.fetchMe().catch(() => null);
    const botRoleName = botMember?.roles.highest.name || "None";
    const memberCount = guild.memberCount;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 Server Info: ${guild.name}`)
      .setThumbnail(guild.iconURL() || null)
      .addFields(
        { name: "Server ID", value: guild.id, inline: true },
        { name: "Total Members", value: `${memberCount}`, inline: true },
        { name: "Bot Highest Role", value: botRoleName, inline: true }
      )
      .setFooter({ text: "Paradox Bot" })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
}

/**
 * Handle prefix text commands (!help, !ping, !rr, !embed, etc.)
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
      .setTitle("🤖 Paradox Bot — Help & Commands")
      .setDescription(
        "You can configure everything directly from Discord or use the companion dashboard!"
      )
      .addFields(
        {
          name: "Commands",
          value:
            `\`${prefix}ping\` — Check latency\n` +
            `\`${prefix}rr add <msgId> <emoji> <@role>\` — Create reaction role\n` +
            `\`${prefix}rr remove <msgId> <emoji>\` — Delete reaction role\n` +
            `\`${prefix}embed <title> | <desc>\` — Quick embed message\n` +
            `\`${prefix}videofix toggle\` — Toggle social video fixer\n` +
            `\`${prefix}dashboard\` — Get web dashboard link`,
        },
        {
          name: "Slash Commands (Recommended)",
          value: "Type **`/`** in Discord to see interactive commands: `/reactionrole`, `/roledeck`, `/embed`, `/help`!",
        }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // !rr add <messageId> <emoji> <@role>
  if (command === "rr" || command === "reactionrole") {
    if (!guild || !member) return;
    if (!isManager) {
      return message.reply("⛔ You need the **Manage Server** permission to configure reaction roles.");
    }

    const sub = args[1]?.toLowerCase();
    if (sub === "add") {
      const msgId = args[2];
      const emoji = args[3];
      const roleMention = message.mentions.roles.first() || guild.roles.cache.get(args[4]);

      if (!msgId || !emoji || !roleMention) {
        return message.reply(`Usage: \`${prefix}rr add <message_id> <emoji> <@role>\``);
      }

      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("❌ The bot is missing the **Manage Roles** permission.");
      }

      if (roleMention.position >= botMember.roles.highest.position) {
        return message.reply(`❌ **${roleMention.name}** is positioned higher than the bot's role.`);
      }

      // Add reaction to message
      const targetMsg = await message.channel.messages.fetch(msgId).catch(() => null);
      if (targetMsg) {
        await targetMsg.react(emoji).catch(() => null);
      }

      await prisma.reactionRole.create({
        data: {
          guildId: guild.id,
          channelId: message.channel.id,
          messageId: msgId,
          emoji,
          roleId: roleMention.id,
          roleName: roleMention.name,
          type: "REACTION",
        },
      });

      return message.reply(`✅ Reaction role added! Reacting with ${emoji} on \`${msgId}\` will grant **${roleMention.name}**.`);
    }

    if (sub === "remove") {
      const msgId = args[2];
      const emoji = args[3];
      if (!msgId || !emoji) return message.reply(`Usage: \`${prefix}rr remove <message_id> <emoji>\``);

      await prisma.reactionRole.deleteMany({
        where: { guildId: guild.id, messageId: msgId, emoji },
      });
      return message.reply(`✅ Removed reaction role mapping for ${emoji} on message \`${msgId}\`.`);
    }
  }

  // !embed <title> | <description>
  if (command === "embed") {
    if (!guild || !member) return;
    if (!isManager) return message.reply("⛔ You need the **Manage Server** permission.");

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
    const targetUrl = guild ? `${appUrl}/dashboard/${guild.id}` : `${appUrl}/dashboard`;
    return message.reply(`Configure Paradox in the web dashboard: ${targetUrl}`);
  }

  if (command === "videofix") {
    if (!guild || !member) return;
    if (args[1]?.toLowerCase() === "toggle") {
      if (!isManager) return message.reply("⛔ You need the **Manage Server** permission.");
      const config = await prisma.guildConfig.findUnique({ where: { id: guild.id } });
      const current = config?.videoFixerEnabled ?? true;
      const updated = await prisma.guildConfig.update({
        where: { id: guild.id },
        data: { videoFixerEnabled: !current },
      });
      return message.reply(`🎥 Video Fixer is now **${updated.videoFixerEnabled ? "Active" : "Disabled"}**.`);
    }
  }
}
