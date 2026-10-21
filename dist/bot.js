"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/bot/index.ts
var index_exports = {};
__export(index_exports, {
  startBot: () => startBot
});
module.exports = __toCommonJS(index_exports);
var import_dotenv = __toESM(require("dotenv"));

// src/bot/client.ts
var import_discord = require("discord.js");
function createBotClient() {
  return new import_discord.Client({
    intents: [
      import_discord.GatewayIntentBits.Guilds,
      import_discord.GatewayIntentBits.GuildMessages,
      import_discord.GatewayIntentBits.MessageContent,
      import_discord.GatewayIntentBits.GuildMessageReactions,
      import_discord.GatewayIntentBits.GuildMembers
    ],
    partials: [
      import_discord.Partials.Message,
      import_discord.Partials.Channel,
      import_discord.Partials.Reaction,
      import_discord.Partials.User,
      import_discord.Partials.GuildMember
    ]
  });
}

// src/bot/events/ready.ts
var import_discord3 = require("discord.js");

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = global.prisma || new import_client.PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
});
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// src/bot/commands/index.ts
var import_discord2 = require("discord.js");
var SLASH_COMMANDS_DATA = [
  new import_discord2.SlashCommandBuilder().setName("help").setDescription("Explore Paradox commands, features, and dashboard link"),
  new import_discord2.SlashCommandBuilder().setName("ping").setDescription("Check bot latency and gateway connection"),
  new import_discord2.SlashCommandBuilder().setName("dashboard").setDescription("Get a direct link to this server's web companion dashboard"),
  new import_discord2.SlashCommandBuilder().setName("roles").setDescription("List active visual role decks and reaction roles for this server"),
  new import_discord2.SlashCommandBuilder().setName("serverinfo").setDescription("Display server statistics and bot permission health"),
  // 1. Reaction Roles Command
  new import_discord2.SlashCommandBuilder().setName("reactionrole").setDescription("Manage emoji-to-role mappings directly from Discord").addSubcommand(
    (sub) => sub.setName("add").setDescription("Add an emoji reaction role to an existing message").addStringOption(
      (opt) => opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
    ).addStringOption(
      (opt) => opt.setName("emoji").setDescription("The emoji trigger (e.g. \u2B50, \u{1F3AE})").setRequired(true)
    ).addRoleOption(
      (opt) => opt.setName("role").setDescription("The role to grant upon reacting").setRequired(true)
    ).addChannelOption(
      (opt) => opt.setName("channel").setDescription("The channel containing the message (defaults to current)").addChannelTypes(import_discord2.ChannelType.GuildText, import_discord2.ChannelType.GuildAnnouncement)
    ).addStringOption(
      (opt) => opt.setName("description").setDescription("Optional perk description for this role")
    )
  ).addSubcommand(
    (sub) => sub.setName("remove").setDescription("Remove an existing reaction role mapping").addStringOption(
      (opt) => opt.setName("message_id").setDescription("The Discord Message ID").setRequired(true)
    ).addStringOption(
      (opt) => opt.setName("emoji").setDescription("The emoji trigger to remove").setRequired(true)
    )
  ).addSubcommand(
    (sub) => sub.setName("list").setDescription("List all reaction roles configured in this server")
  ),
  // 2. Visual Role Deck Command
  new import_discord2.SlashCommandBuilder().setName("roledeck").setDescription("Deploy an interactive Visual Role Deck with clickable buttons and banner GIF").addStringOption(
    (opt) => opt.setName("title").setDescription("Title for the role panel").setRequired(true)
  ).addRoleOption(
    (opt) => opt.setName("role1").setDescription("First role to include").setRequired(true)
  ).addStringOption(
    (opt) => opt.setName("emoji1").setDescription("Emoji for first role (e.g. \u{1F3AE})").setRequired(true)
  ).addRoleOption((opt) => opt.setName("role2").setDescription("Second role (optional)")).addStringOption((opt) => opt.setName("emoji2").setDescription("Emoji for second role")).addRoleOption((opt) => opt.setName("role3").setDescription("Third role (optional)")).addStringOption((opt) => opt.setName("emoji3").setDescription("Emoji for third role")).addStringOption(
    (opt) => opt.setName("banner_gif").setDescription("URL of header banner image or animated GIF (optional)")
  ).addStringOption(
    (opt) => opt.setName("description").setDescription("Description text above buttons (optional)")
  ).addChannelOption(
    (opt) => opt.setName("channel").setDescription("Destination channel (defaults to current channel)").addChannelTypes(import_discord2.ChannelType.GuildText, import_discord2.ChannelType.GuildAnnouncement)
  ),
  // 3. Rich Embed Publisher Command
  new import_discord2.SlashCommandBuilder().setName("embed").setDescription("Create and publish a rich Discord embed to any channel").addChannelOption(
    (opt) => opt.setName("channel").setDescription("Destination channel").setRequired(true).addChannelTypes(import_discord2.ChannelType.GuildText, import_discord2.ChannelType.GuildAnnouncement)
  ).addStringOption(
    (opt) => opt.setName("title").setDescription("Embed title").setRequired(true)
  ).addStringOption(
    (opt) => opt.setName("description").setDescription("Embed description text").setRequired(true)
  ).addStringOption(
    (opt) => opt.setName("color").setDescription("Hex color (e.g. #5865F2, #57F287, #ED4245)")
  ).addStringOption(
    (opt) => opt.setName("image").setDescription("Large banner image or GIF URL")
  ).addStringOption(
    (opt) => opt.setName("thumbnail").setDescription("Small top-right thumbnail icon URL")
  ),
  // 4. Video Link Fixer Command
  new import_discord2.SlashCommandBuilder().setName("videofix").setDescription("Manage social video link fixer (Twitter, TikTok, Instagram, Reddit)").addSubcommand(
    (sub) => sub.setName("status").setDescription("Check video fixer status and enabled providers")
  ).addSubcommand(
    (sub) => sub.setName("toggle").setDescription("Enable or disable video fixer for this server")
  ).addSubcommand(
    (sub) => sub.setName("ignore").setDescription("Ignore or unignore video links in a specific channel").addChannelOption(
      (opt) => opt.setName("channel").setDescription("Target channel").setRequired(true).addChannelTypes(import_discord2.ChannelType.GuildText)
    )
  )
];
async function handleSlashCommand(interaction) {
  const { commandName, guildId, guild, client, memberPermissions } = interaction;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const isManager = memberPermissions?.has(import_discord2.PermissionsBitField.Flags.ManageGuild) || memberPermissions?.has(import_discord2.PermissionsBitField.Flags.Administrator);
  if (commandName === "ping") {
    const ping = client.ws.ping;
    const embed = new import_discord2.EmbedBuilder().setColor(5763719).setTitle("\u{1F3D3} Pong!").setDescription(`Gateway WebSocket Latency: **${ping}ms**`).setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (commandName === "help") {
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle("\u{1F916} Paradox Bot \u2014 Command & Feature Guide").setDescription(
      "Manage your server directly from Discord using **Slash Commands** or via the **Web Dashboard**!"
    ).addFields(
      {
        name: "\u{1F3AD} Reaction Roles & Role Decks",
        value: "`/reactionrole add` \u2014 Attach an emoji role to any existing message\n`/reactionrole remove` \u2014 Delete an emoji role mapping\n`/reactionrole list` \u2014 List all active server role mappings\n`/roledeck` \u2014 Deploy an interactive visual role card with clickable buttons!"
      },
      {
        name: "\u{1F4E2} Rich Discord Embeds",
        value: "`/embed` \u2014 Create and post rich embeds with custom images, colors, and channels."
      },
      {
        name: "\u{1F3A5} Social Video Embeds",
        value: "`/videofix status` \u2014 View status for Twitter, TikTok, Instagram & Reddit\n`/videofix toggle` \u2014 Enable or disable video fixer for the server\n`/videofix ignore` \u2014 Mute video fixer in specific channels"
      },
      {
        name: "\u2699\uFE0F Utilities",
        value: "`/ping` \u2014 Check latency\n`/serverinfo` \u2014 Server stats & bot health\n`/dashboard` \u2014 Web link"
      }
    ).setFooter({ text: "Paradox Bot \u2022 In-Discord Commands Ready" }).setTimestamp();
    const row = new import_discord2.ActionRowBuilder().addComponents(
      new import_discord2.ButtonBuilder().setLabel("Open Web Dashboard").setStyle(import_discord2.ButtonStyle.Link).setURL(guildId ? `${appUrl}/dashboard/${guildId}` : `${appUrl}/dashboard`)
    );
    return interaction.reply({ embeds: [embed], components: [row] });
  }
  if (commandName === "reactionrole") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "list") {
      const mappings = await prisma.reactionRole.findMany({ where: { guildId } }).catch(() => []);
      if (mappings.length === 0) {
        return interaction.reply({
          content: "No reaction roles configured in this server. Use `/reactionrole add` or `/roledeck` to create one!",
          ephemeral: true
        });
      }
      const listText = mappings.map((m) => `\u2022 ${m.emoji} **${m.roleName}** (${m.type}) in <#${m.channelId}> \u2014 Msg: \`${m.messageId}\``).join("\n");
      const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle(`\u{1F3AD} Active Reaction Roles (${mappings.length})`).setDescription(listText).setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (!isManager) {
      return interaction.reply({
        content: "\u26D4 You need the **Manage Server** permission to configure reaction roles.",
        ephemeral: true
      });
    }
    if (subcommand === "add") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const emoji = interaction.options.getString("emoji", true).trim();
      const role = interaction.options.getRole("role", true);
      const desc = interaction.options.getString("description");
      const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
      if (!targetChannel) {
        return interaction.reply({ content: "Invalid channel specified.", ephemeral: true });
      }
      const botMember = await guild.members.fetchMe().catch(() => null);
      if (!botMember || !botMember.permissions.has(import_discord2.PermissionsBitField.Flags.ManageRoles)) {
        return interaction.reply({
          content: "\u274C The bot lacks the **Manage Roles** permission.",
          ephemeral: true
        });
      }
      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `\u274C Role Hierarchy Error: **${role.name}** is higher than or equal to the bot's role. Drag the bot's role above **${role.name}** in Server Settings > Roles.`,
          ephemeral: true
        });
      }
      if (role.managed) {
        return interaction.reply({
          content: "\u274C Cannot assign managed / integration roles.",
          ephemeral: true
        });
      }
      try {
        const msg = await targetChannel.messages.fetch(messageId).catch(() => null);
        if (msg) {
          await msg.react(emoji).catch(() => null);
        }
      } catch {
      }
      await prisma.reactionRole.create({
        data: {
          guildId,
          channelId: targetChannel.id,
          messageId,
          emoji,
          roleId: role.id,
          roleName: role.name,
          description: desc || null,
          type: "REACTION"
        }
      });
      const embed = new import_discord2.EmbedBuilder().setColor(5763719).setTitle("\u2705 Reaction Role Configured!").setDescription(
        `Reacting with ${emoji} on message \`${messageId}\` in <#${targetChannel.id}> will now grant/remove the **${role.name}** role.`
      ).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (subcommand === "remove") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const emoji = interaction.options.getString("emoji", true).trim();
      const deleted = await prisma.reactionRole.deleteMany({
        where: {
          guildId,
          messageId,
          emoji
        }
      });
      if (deleted.count === 0) {
        return interaction.reply({
          content: `No reaction role mapping found with emoji ${emoji} on message \`${messageId}\`.`,
          ephemeral: true
        });
      }
      return interaction.reply({
        content: `\u2705 Successfully removed ${deleted.count} reaction role mapping(s) for message \`${messageId}\`.`
      });
    }
  }
  if (commandName === "roledeck") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    if (!isManager) {
      return interaction.reply({
        content: "\u26D4 You need the **Manage Server** permission to deploy role decks.",
        ephemeral: true
      });
    }
    const title = interaction.options.getString("title", true);
    const desc = interaction.options.getString("description") || "Click the buttons below to claim or remove roles:";
    const bannerGif = interaction.options.getString("banner_gif");
    const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
    if (!targetChannel) return interaction.reply({ content: "Invalid channel.", ephemeral: true });
    const deckRoles = [];
    const r1 = interaction.options.getRole("role1", true);
    const e1 = interaction.options.getString("emoji1", true);
    deckRoles.push({ role: r1, emoji: e1 });
    const r2 = interaction.options.getRole("role2");
    const e2 = interaction.options.getString("emoji2");
    if (r2 && e2) deckRoles.push({ role: r2, emoji: e2 });
    const r3 = interaction.options.getRole("role3");
    const e3 = interaction.options.getString("emoji3");
    if (r3 && e3) deckRoles.push({ role: r3, emoji: e3 });
    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember || !botMember.permissions.has(import_discord2.PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: "\u274C The bot lacks **Manage Roles** permission.", ephemeral: true });
    }
    for (const item of deckRoles) {
      if (item.role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `\u274C Role Hierarchy Error: **${item.role.name}** is higher than or equal to the bot's role. Please reorder roles in Discord Server Settings.`,
          ephemeral: true
        });
      }
    }
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle(`\u2728 ${title}`).setDescription(desc).setFooter({ text: "Paradox Visual Role Deck \u2022 Click below to Claim or Remove" }).setTimestamp();
    if (bannerGif) {
      embed.setImage(bannerGif);
    }
    const row = new import_discord2.ActionRowBuilder();
    for (const item of deckRoles) {
      embed.addFields({
        name: `${item.emoji} ${item.role.name}`,
        value: `Click button below to toggle`,
        inline: true
      });
      row.addComponents(
        new import_discord2.ButtonBuilder().setCustomId(`rr_role_${item.role.id}`).setLabel(item.role.name).setStyle(import_discord2.ButtonStyle.Primary)
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
          bannerUrl: bannerGif || null
        }
      });
    }
    return interaction.reply({
      content: `\u{1F389} Visual Role Deck deployed to <#${targetChannel.id}> with **${deckRoles.length}** interactive role buttons!`,
      ephemeral: true
    });
  }
  if (commandName === "embed") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    if (!isManager) {
      return interaction.reply({ content: "\u26D4 You need the **Manage Server** permission.", ephemeral: true });
    }
    const targetChannel = interaction.options.getChannel("channel", true);
    const title = interaction.options.getString("title", true);
    const description = interaction.options.getString("description", true);
    const colorHex = interaction.options.getString("color") || "#5865F2";
    const image = interaction.options.getString("image");
    const thumbnail = interaction.options.getString("thumbnail");
    const embed = new import_discord2.EmbedBuilder().setTitle(title).setDescription(description).setTimestamp();
    try {
      const cleanHex = colorHex.replace("#", "");
      embed.setColor(parseInt(cleanHex, 16));
    } catch {
      embed.setColor(5793266);
    }
    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);
    await targetChannel.send({ embeds: [embed] });
    return interaction.reply({
      content: `\u2705 Embed published successfully to <#${targetChannel.id}>!`,
      ephemeral: true
    });
  }
  if (commandName === "videofix") {
    if (!guild || !guildId) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    const config = await prisma.guildConfig.findUnique({ where: { id: guildId } }).catch(() => null);
    if (subcommand === "status") {
      const enabled = config?.videoFixerEnabled ?? true;
      let providers = ["twitter", "tiktok", "instagram", "reddit"];
      try {
        if (config?.videoFixerProviders) providers = JSON.parse(config.videoFixerProviders);
      } catch {
      }
      const embed = new import_discord2.EmbedBuilder().setColor(enabled ? 5763719 : 15548997).setTitle("\u{1F3A5} Video Link Fixer Status").setDescription(`Video Fixer is currently **${enabled ? "Active \u2705" : "Disabled \u274C"}**`).addFields({
        name: "Supported Platforms",
        value: providers.map((p) => `\u2022 **${p.toUpperCase()}**`).join("\n")
      }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (!isManager) {
      return interaction.reply({ content: "\u26D4 You need **Manage Server** permission.", ephemeral: true });
    }
    if (subcommand === "toggle") {
      const current = config?.videoFixerEnabled ?? true;
      const updated = await prisma.guildConfig.update({
        where: { id: guildId },
        data: { videoFixerEnabled: !current }
      });
      return interaction.reply({
        content: `\u{1F3A5} Video Fixer has been **${updated.videoFixerEnabled ? "Enabled \u2705" : "Disabled \u274C"}** for this server!`
      });
    }
    if (subcommand === "ignore") {
      const targetChannel = interaction.options.getChannel("channel", true);
      let ignored = [];
      try {
        if (config?.videoFixerIgnoredChannels) ignored = JSON.parse(config.videoFixerIgnoredChannels);
      } catch {
      }
      if (ignored.includes(targetChannel.id)) {
        ignored = ignored.filter((id) => id !== targetChannel.id);
        await prisma.guildConfig.update({
          where: { id: guildId },
          data: { videoFixerIgnoredChannels: JSON.stringify(ignored) }
        });
        return interaction.reply({ content: `\u2705 <#${targetChannel.id}> is now **unignored** (videos will be fixed).` });
      } else {
        ignored.push(targetChannel.id);
        await prisma.guildConfig.update({
          where: { id: guildId },
          data: { videoFixerIgnoredChannels: JSON.stringify(ignored) }
        });
        return interaction.reply({ content: `\u{1F507} <#${targetChannel.id}> is now **ignored** by the video fixer.` });
      }
    }
  }
  if (commandName === "dashboard") {
    const dashboardUrl = guildId ? `${appUrl}/dashboard/${guildId}` : `${appUrl}/dashboard`;
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle("\u2699\uFE0F Server Dashboard").setDescription(`Configure Reaction Roles, Embeds, and Video Fixer for **${guild?.name}**:`).setTimestamp();
    const row = new import_discord2.ActionRowBuilder().addComponents(
      new import_discord2.ButtonBuilder().setLabel("Open Web Dashboard").setStyle(import_discord2.ButtonStyle.Link).setURL(dashboardUrl)
    );
    return interaction.reply({ embeds: [embed], components: [row] });
  }
  if (commandName === "serverinfo") {
    if (!guild) return interaction.reply({ content: "Must be used in a server.", ephemeral: true });
    const botMember = await guild.members.fetchMe().catch(() => null);
    const botRoleName = botMember?.roles.highest.name || "None";
    const memberCount = guild.memberCount;
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle(`\u{1F4CA} Server Info: ${guild.name}`).setThumbnail(guild.iconURL() || null).addFields(
      { name: "Server ID", value: guild.id, inline: true },
      { name: "Total Members", value: `${memberCount}`, inline: true },
      { name: "Bot Highest Role", value: botRoleName, inline: true }
    ).setFooter({ text: "Paradox Bot" }).setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
}
async function handleTextCommand(message, prefix) {
  const content = message.content.slice(prefix.length).trim();
  const args = content.split(/\s+/);
  const command = args[0]?.toLowerCase();
  const guild = message.guild;
  const member = message.member;
  const isManager = member?.permissions.has(import_discord2.PermissionsBitField.Flags.ManageGuild) || member?.permissions.has(import_discord2.PermissionsBitField.Flags.Administrator);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (command === "ping") {
    const ping = message.client.ws.ping;
    return message.reply(`\u{1F3D3} Pong! WebSocket Latency: **${ping}ms**`);
  }
  if (command === "help") {
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle("\u{1F916} Paradox Bot \u2014 Help & Commands").setDescription(
      "You can configure everything directly from Discord or use the companion dashboard!"
    ).addFields(
      {
        name: "Commands",
        value: `\`${prefix}ping\` \u2014 Check latency
\`${prefix}rr add <msgId> <emoji> <@role>\` \u2014 Create reaction role
\`${prefix}rr remove <msgId> <emoji>\` \u2014 Delete reaction role
\`${prefix}embed <title> | <desc>\` \u2014 Quick embed message
\`${prefix}videofix toggle\` \u2014 Toggle social video fixer
\`${prefix}dashboard\` \u2014 Get web dashboard link`
      },
      {
        name: "Slash Commands (Recommended)",
        value: "Type **`/`** in Discord to see interactive commands: `/reactionrole`, `/roledeck`, `/embed`, `/help`!"
      }
    ).setTimestamp();
    return message.reply({ embeds: [embed] });
  }
  if (command === "rr" || command === "reactionrole") {
    if (!guild || !member) return;
    if (!isManager) {
      return message.reply("\u26D4 You need the **Manage Server** permission to configure reaction roles.");
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
      if (!botMember || !botMember.permissions.has(import_discord2.PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("\u274C The bot is missing the **Manage Roles** permission.");
      }
      if (roleMention.position >= botMember.roles.highest.position) {
        return message.reply(`\u274C **${roleMention.name}** is positioned higher than the bot's role.`);
      }
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
          type: "REACTION"
        }
      });
      return message.reply(`\u2705 Reaction role added! Reacting with ${emoji} on \`${msgId}\` will grant **${roleMention.name}**.`);
    }
    if (sub === "remove") {
      const msgId = args[2];
      const emoji = args[3];
      if (!msgId || !emoji) return message.reply(`Usage: \`${prefix}rr remove <message_id> <emoji>\``);
      await prisma.reactionRole.deleteMany({
        where: { guildId: guild.id, messageId: msgId, emoji }
      });
      return message.reply(`\u2705 Removed reaction role mapping for ${emoji} on message \`${msgId}\`.`);
    }
  }
  if (command === "embed") {
    if (!guild || !member) return;
    if (!isManager) return message.reply("\u26D4 You need the **Manage Server** permission.");
    const raw = content.slice(command.length).trim();
    const parts = raw.split("|");
    const title = parts[0]?.trim();
    const desc = parts[1]?.trim();
    if (!title || !desc) {
      return message.reply(`Usage: \`${prefix}embed <title> | <description>\``);
    }
    const embed = new import_discord2.EmbedBuilder().setColor(5793266).setTitle(title).setDescription(desc).setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }
  if (command === "dashboard") {
    const targetUrl = guild ? `${appUrl}/dashboard/${guild.id}` : `${appUrl}/dashboard`;
    return message.reply(`Configure Paradox in the web dashboard: ${targetUrl}`);
  }
  if (command === "videofix") {
    if (!guild || !member) return;
    if (args[1]?.toLowerCase() === "toggle") {
      if (!isManager) return message.reply("\u26D4 You need the **Manage Server** permission.");
      const config = await prisma.guildConfig.findUnique({ where: { id: guild.id } });
      const current = config?.videoFixerEnabled ?? true;
      const updated = await prisma.guildConfig.update({
        where: { id: guild.id },
        data: { videoFixerEnabled: !current }
      });
      return message.reply(`\u{1F3A5} Video Fixer is now **${updated.videoFixerEnabled ? "Active" : "Disabled"}**.`);
    }
  }
}

// src/bot/services/ensureDb.ts
async function ensureDatabaseSchema(prisma2) {
  try {
    console.log("[Database] Checking and ensuring database tables exist...");
    await prisma2.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL,
        "discriminator" TEXT,
        "avatar" TEXT,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "tokenExpiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma2.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GuildConfig" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "icon" TEXT,
        "botJoined" BOOLEAN NOT NULL DEFAULT true,
        "prefix" TEXT NOT NULL DEFAULT '!',
        "videoFixerEnabled" BOOLEAN NOT NULL DEFAULT true,
        "videoFixerProviders" TEXT NOT NULL DEFAULT '["twitter","tiktok","instagram","reddit"]',
        "videoFixerIgnoredChannels" TEXT NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma2.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReactionRole" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guildId" TEXT NOT NULL REFERENCES "GuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "channelId" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "emoji" TEXT NOT NULL,
        "roleId" TEXT NOT NULL,
        "roleName" TEXT NOT NULL,
        "description" TEXT,
        "type" TEXT NOT NULL DEFAULT 'REACTION',
        "imageUrl" TEXT,
        "bannerUrl" TEXT,
        "confirmGif" TEXT,
        "buttonStyle" TEXT DEFAULT 'PRIMARY',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma2.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmbedTemplate" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guildId" TEXT NOT NULL REFERENCES "GuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "name" TEXT NOT NULL DEFAULT 'Untitled Embed',
        "title" TEXT,
        "description" TEXT,
        "url" TEXT,
        "color" TEXT DEFAULT '#5865F2',
        "authorName" TEXT,
        "authorUrl" TEXT,
        "authorIconUrl" TEXT,
        "footerText" TEXT,
        "footerIconUrl" TEXT,
        "timestamp" BOOLEAN NOT NULL DEFAULT false,
        "thumbnailUrl" TEXT,
        "imageUrl" TEXT,
        "fields" TEXT NOT NULL DEFAULT '[]',
        "lastPublishedChannelId" TEXT,
        "lastPublishedMessageId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma2.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "guildId" TEXT NOT NULL REFERENCES "GuildConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "details" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma2.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ReactionRole_guildId_idx" ON "ReactionRole"("guildId");
    `).catch(() => null);
    await prisma2.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ReactionRole_messageId_idx" ON "ReactionRole"("messageId");
    `).catch(() => null);
    await prisma2.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EmbedTemplate_guildId_idx" ON "EmbedTemplate"("guildId");
    `).catch(() => null);
    await prisma2.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AuditLog_guildId_idx" ON "AuditLog"("guildId");
    `).catch(() => null);
    console.log("[Database] All tables and indexes are ready!");
  } catch (err) {
    console.error("[Database] Automatic schema verification warning:", err);
  }
}

// src/bot/events/ready.ts
async function onReady(client) {
  if (!client.user) return;
  console.log(`[Bot] Successfully connected to Discord Gateway as ${client.user.tag} (ID: ${client.user.id})`);
  client.user.setActivity("Managing servers & video embeds", { type: import_discord3.ActivityType.Custom });
  try {
    if (client.application) {
      console.log(`[Bot] Registering slash commands with Discord...`);
      await client.application.commands.set(SLASH_COMMANDS_DATA);
      console.log(`[Bot] Successfully registered ${SLASH_COMMANDS_DATA.length} slash commands!`);
    }
  } catch (err) {
    console.error("[Bot] Failed to register slash commands:", err);
  }
  await ensureDatabaseSchema(prisma);
  try {
    const guilds = await client.guilds.fetch();
    console.log(`[Bot] Synchronizing ${guilds.size} connected guild(s) with database...`);
    for (const oauthGuild of Array.from(guilds.values())) {
      await prisma.guildConfig.upsert({
        where: { id: oauthGuild.id },
        update: {
          name: oauthGuild.name,
          icon: oauthGuild.icon,
          botJoined: true
        },
        create: {
          id: oauthGuild.id,
          name: oauthGuild.name,
          icon: oauthGuild.icon,
          botJoined: true
        }
      });
    }
    console.log(`[Bot] Guild synchronization complete.`);
  } catch (err) {
    console.error("[Bot] Failed to sync guilds on ready:", err);
  }
}

// src/bot/events/messageCreate.ts
var import_discord4 = require("discord.js");

// src/bot/services/videoTransformer.ts
function extractAndTransformVideoUrls(content, enabledProviders = ["twitter", "tiktok", "instagram", "reddit"]) {
  if (!content || typeof content !== "string") return [];
  const results = [];
  const activeProviders = new Set(enabledProviders);
  const urlRegex = /(?<!<)\bhttps?:\/\/[^\s<>]+(?!\>)/gi;
  const matches = content.match(urlRegex);
  if (!matches) return [];
  for (const rawUrl of matches) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname;
      if (activeProviders.has("twitter")) {
        const isTwitter = host === "twitter.com" || host === "www.twitter.com" || host === "x.com" || host === "www.x.com";
        const isAlreadyTransformed = host.includes("fxtwitter") || host.includes("vxtwitter") || host.includes("fixupx");
        if (isTwitter && !isAlreadyTransformed) {
          const statusMatch = pathname.match(/^\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/);
          if (statusMatch) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "fxtwitter.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "twitter"
            });
            continue;
          }
        }
      }
      if (activeProviders.has("tiktok")) {
        const isStandardTikTok = host === "tiktok.com" || host === "www.tiktok.com";
        const isShortTikTok = host === "vm.tiktok.com" || host === "vt.tiktok.com";
        const isAlreadyTransformed = host.includes("tiktxk") || host.includes("vxtiktok");
        if (!isAlreadyTransformed) {
          if (isStandardTikTok && (pathname.includes("/video/") || pathname.includes("/photo/"))) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "tiktxk.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "tiktok"
            });
            continue;
          } else if (isShortTikTok && pathname.length > 1) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "tiktxk.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "tiktok"
            });
            continue;
          }
        }
      }
      if (activeProviders.has("instagram")) {
        const isInstagram = host === "instagram.com" || host === "www.instagram.com";
        const isAlreadyTransformed = host.includes("ddinstagram");
        if (isInstagram && !isAlreadyTransformed) {
          const instaMatch = pathname.match(/^\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/);
          if (instaMatch) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "ddinstagram.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "instagram"
            });
            continue;
          }
        }
      }
      if (activeProviders.has("reddit")) {
        const isReddit = host === "reddit.com" || host === "www.reddit.com" || host === "old.reddit.com";
        const isAlreadyTransformed = host.includes("rxddit");
        if (isReddit && !isAlreadyTransformed) {
          const redditMatch = pathname.match(/^\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)/);
          if (redditMatch) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "rxddit.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "reddit"
            });
            continue;
          }
        }
      }
    } catch {
      continue;
    }
  }
  return results;
}

// src/bot/events/messageCreate.ts
async function onMessageCreate(message) {
  if (message.author.bot || message.webhookId) return;
  if (!message.guild || !("send" in message.channel)) return;
  const guildId = message.guild.id;
  const channelId = message.channel.id;
  try {
    const config = await prisma.guildConfig.findUnique({
      where: { id: guildId }
    }).catch(() => null);
    const prefix = config?.prefix || "!";
    if (message.content.startsWith(prefix)) {
      await handleTextCommand(message, prefix);
      return;
    }
    if (!config || !config.videoFixerEnabled) return;
    let ignoredChannels = [];
    try {
      ignoredChannels = JSON.parse(config.videoFixerIgnoredChannels || "[]");
    } catch {
      ignoredChannels = [];
    }
    if (ignoredChannels.includes(channelId)) return;
    let enabledProviders = ["twitter", "tiktok", "instagram", "reddit"];
    try {
      enabledProviders = JSON.parse(config.videoFixerProviders || "[]");
    } catch {
      enabledProviders = ["twitter", "tiktok", "instagram", "reddit"];
    }
    if (enabledProviders.length === 0) return;
    const transformedLinks = extractAndTransformVideoUrls(message.content, enabledProviders);
    if (transformedLinks.length === 0) return;
    const linksList = transformedLinks.map((t) => t.transformedUrl).join("\n");
    const replyText = `\u{1F3A5} **Enhanced Video Embed** (shared by <@${message.author.id}>):
${linksList}`;
    await message.channel.send({
      content: replyText,
      allowedMentions: { users: [] }
      // Avoid unwanted pings
    });
    const botMember = message.guild.members.me;
    if (botMember && botMember.permissionsIn(message.channel.id).has(import_discord4.PermissionFlagsBits.ManageMessages)) {
      await message.suppressEmbeds(true).catch(() => null);
    }
  } catch (err) {
    console.error(`[Bot:MessageCreate] Error processing message in guild ${guildId}:`, err);
  }
}

// src/bot/services/reactionRoleService.ts
function normalizeEmoji(reaction) {
  if (reaction.emoji.id) {
    return `${reaction.emoji.name}:${reaction.emoji.id}`;
  }
  return reaction.emoji.name || "";
}
async function handleReactionAdd(reaction, user) {
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
        emoji: emojiKey
      }
    });
    if (!mapping) {
      return { success: false, action: "skipped", error: "No mapping found" };
    }
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return { success: false, action: "skipped", error: "Guild member not found" };
    }
    const role = await guild.roles.fetch(mapping.roleId).catch(() => null);
    if (!role) {
      console.warn(`[ReactionRoles] Role ${mapping.roleId} not found in guild ${guild.id}.`);
      return { success: false, action: "skipped", error: "Role deleted or not found" };
    }
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
        error: "Target role is higher than or equal to bot's highest role"
      };
    }
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role, "Reaction role assigned");
      return { success: true, action: "added", roleName: role.name };
    }
    return { success: true, action: "skipped", roleName: role.name };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ReactionRoles] Error assigning role: ${errorMsg}`);
    return { success: false, action: "skipped", error: errorMsg };
  }
}
async function handleReactionRemove(reaction, user) {
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
        emoji: emojiKey
      }
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
        error: "Target role is higher than or equal to bot's highest role"
      };
    }
    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role, "Reaction role removed");
      return { success: true, action: "removed", roleName: role.name };
    }
    return { success: true, action: "skipped", roleName: role.name };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ReactionRoles] Error removing role: ${errorMsg}`);
    return { success: false, action: "skipped", error: errorMsg };
  }
}

// src/bot/events/messageReactionAdd.ts
async function onMessageReactionAdd(reaction, user) {
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (user.partial) {
      await user.fetch();
    }
    if (user.bot) return;
    await handleReactionAdd(reaction, user);
  } catch (err) {
    console.error("[Bot:ReactionAdd] Error handling reaction add:", err);
  }
}

// src/bot/events/messageReactionRemove.ts
async function onMessageReactionRemove(reaction, user) {
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (user.partial) {
      await user.fetch();
    }
    if (user.bot) return;
    await handleReactionRemove(reaction, user);
  } catch (err) {
    console.error("[Bot:ReactionRemove] Error handling reaction remove:", err);
  }
}

// src/bot/events/interactionCreate.ts
var import_discord5 = require("discord.js");
async function onInteractionCreate(interaction) {
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction).catch((err) => {
      console.error("[Bot:SlashCommand] Error executing slash command:", err);
    });
    return;
  }
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
async function handleRoleToggle(interaction, roleId) {
  try {
    const guild = interaction.guild;
    const member = interaction.member;
    if (!member || !guild) {
      return interaction.reply({
        content: "Could not retrieve your server member profile.",
        ephemeral: true
      });
    }
    const role = await guild.roles.fetch(roleId).catch(() => null);
    if (!role) {
      return interaction.reply({
        content: "\u26A0\uFE0F The selected role no longer exists in this server.",
        ephemeral: true
      });
    }
    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!botMember || !botMember.permissions.has(import_discord5.PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({
        content: "\u26A0\uFE0F The bot lacks the **Manage Roles** permission to assign this role.",
        ephemeral: true
      });
    }
    if (role.position >= botMember.roles.highest.position) {
      return interaction.reply({
        content: `\u26A0\uFE0F Role Hierarchy Conflict: **${role.name}** is positioned higher than or equal to the bot's highest role. An administrator must move the bot's role above **${role.name}**.`,
        ephemeral: true
      });
    }
    const mapping = await prisma.reactionRole.findFirst({
      where: {
        guildId: guild.id,
        roleId: role.id
      }
    });
    const hasRole = member.roles.cache.has(role.id);
    if (hasRole) {
      await member.roles.remove(role, "Visual Role Deck unclaim");
      const removeEmbed = new import_discord5.EmbedBuilder().setColor(15548997).setTitle(`Role Removed: ${role.name}`).setDescription(`You have removed the **${role.name}** role from your profile.`).setTimestamp();
      if (mapping?.imageUrl) {
        removeEmbed.setThumbnail(mapping.imageUrl);
      }
      return interaction.reply({
        embeds: [removeEmbed],
        ephemeral: true
      });
    } else {
      await member.roles.add(role, "Visual Role Deck claim");
      const addEmbed = new import_discord5.EmbedBuilder().setColor(role.color || 5793266).setTitle(`\u2728 Role Claimed: ${role.name}`).setDescription(
        mapping?.description ? `You received the **${role.name}** role!

**Perks & Details:**
${mapping.description}` : `You have successfully received the **${role.name}** role.`
      ).setTimestamp();
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
        ephemeral: true
      });
    }
  } catch (err) {
    console.error("[Bot:RoleInteraction] Error toggling role:", err);
    if (!interaction.replied) {
      return interaction.reply({
        content: "An unexpected error occurred while processing your role selection.",
        ephemeral: true
      });
    }
  }
}

// src/bot/index.ts
import_dotenv.default.config();
async function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || token === "your_discord_bot_token_here" || token.startsWith("dummy_")) {
    console.warn("\n=======================================================");
    console.warn("\u26A0\uFE0F  [Bot] DISCORD_BOT_TOKEN is not configured or is a placeholder.");
    console.warn("\u26A0\uFE0F  The Discord Bot client cannot connect to the gateway.");
    console.warn("\u26A0\uFE0F  Please set a valid bot token in your .env file to enable live Discord events.");
    console.warn("=======================================================\n");
    return null;
  }
  const client = createBotClient();
  client.once("ready", () => onReady(client));
  client.on("messageCreate", onMessageCreate);
  client.on("messageReactionAdd", onMessageReactionAdd);
  client.on("messageReactionRemove", onMessageReactionRemove);
  client.on("interactionCreate", onInteractionCreate);
  client.on("error", (error) => {
    console.error("[Bot] Discord client error encountered:", error.message);
  });
  client.on("warn", (warning) => {
    console.warn("[Bot] Discord client warning:", warning);
  });
  client.on("shardDisconnect", (event, shardId) => {
    console.warn(`[Bot] Shard ${shardId} disconnected with code ${event.code}. Discord.js will attempt reconnection...`);
  });
  client.on("shardReconnecting", (shardId) => {
    console.log(`[Bot] Shard ${shardId} reconnecting to Discord Gateway...`);
  });
  client.on("shardResume", (shardId, replayedEvents) => {
    console.log(`[Bot] Shard ${shardId} resumed connection. Replayed ${replayedEvents} events.`);
  });
  try {
    await client.login(token);
    return client;
  } catch (error) {
    console.error("[Bot] Failed to log in with provided DISCORD_BOT_TOKEN:", error);
    return null;
  }
}
if (require.main === module) {
  startBot().catch((err) => {
    console.error("[Bot] Fatal startup error:", err);
    process.exit(1);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  startBot
});
