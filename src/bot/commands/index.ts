import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
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
    .setName("videofix")
    .setDescription("Check video link fixer status for Twitter, TikTok, Instagram & Reddit"),
  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Display server statistics and bot permission health"),
];

/**
 * Handle slash command execution
 */
export async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  const { commandName, guildId, guild, client } = interaction;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (commandName === "ping") {
    const ping = client.ws.ping;
    const embed = new EmbedBuilder()
      .setColor(0x57f287) // Green
      .setTitle("🏓 Pong!")
      .setDescription(`Gateway WebSocket Latency: **${ping}ms**`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "help") {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🤖 Paradox Bot — Command & Feature Guide")
      .setDescription(
        "Welcome to **Paradox**! A modern Discord administration bot with visual role decks, rich embed designer, and social video fixes."
      )
      .addFields(
        {
          name: "🎨 Visual Role Decks",
          value:
            "Create interactive role panels with animated banner GIFs, custom badge stickers, and celebration claim GIFs via the web dashboard.",
        },
        {
          name: "🎥 Social Video Link Fixer",
          value:
            "Automatically transforms video links from **X/Twitter**, **TikTok**, **Instagram Reels**, and **Reddit** into inline playable videos.",
        },
        {
          name: "⚡ Commands",
          value:
            "`/help` — Show this guide\n`/ping` — Check latency\n`/dashboard` — Open server dashboard\n`/roles` — View active role setups\n`/videofix` — Video fixer status\n`/serverinfo` — Server stats & bot health",
        }
      )
      .setFooter({ text: "Paradox Bot • Web Dashboard Companion" })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Open Web Dashboard")
        .setStyle(ButtonStyle.Link)
        .setURL(guildId ? `${appUrl}/dashboard/${guildId}` : `${appUrl}/dashboard`),
      new ButtonBuilder()
        .setLabel("Documentation & Privacy")
        .setStyle(ButtonStyle.Link)
        .setURL(`${appUrl}/privacy`)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  if (commandName === "dashboard") {
    if (!guildId) {
      return interaction.reply({
        content: `Open the global dashboard at: ${appUrl}/dashboard`,
        ephemeral: true,
      });
    }

    const dashboardUrl = `${appUrl}/dashboard/${guildId}`;
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("⚙️ Server Dashboard")
      .setDescription(`Configure Reaction Roles, Embeds, and Video Fixer for **${guild?.name}**:`)
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Manage Server in Dashboard")
        .setStyle(ButtonStyle.Link)
        .setURL(dashboardUrl)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  if (commandName === "videofix") {
    if (!guildId) return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });

    const config = await prisma.guildConfig.findUnique({ where: { id: guildId } }).catch(() => null);
    const enabled = config?.videoFixerEnabled ?? true;
    let providers = ["twitter", "tiktok", "instagram", "reddit"];
    try {
      if (config?.videoFixerProviders) providers = JSON.parse(config.videoFixerProviders);
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(enabled ? 0x57f287 : 0xed4245)
      .setTitle("🎥 Link-to-Video Embed Status")
      .setDescription(
        `Video Fixer is currently **${enabled ? "Active ✅" : "Disabled ❌"}** in this server.`
      )
      .addFields(
        {
          name: "Supported Providers",
          value: providers.map((p) => `• **${p.toUpperCase()}**`).join("\n") || "None enabled",
        },
        {
          name: "Configuration",
          value: `Admins can toggle providers and ignore channels in the [Web Dashboard](${appUrl}/dashboard/${guildId}/video-fixer).`,
        }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "roles") {
    if (!guildId) return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });

    const mappings = await prisma.reactionRole.findMany({ where: { guildId } }).catch(() => []);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("✨ Active Server Role Setups")
      .setDescription(
        mappings.length === 0
          ? "No visual role decks or reaction roles configured yet. Create one in the [Web Dashboard]!"
          : `This server has **${mappings.length}** active role mapping(s):`
      )
      .setTimestamp();

    if (mappings.length > 0) {
      const summary = mappings
        .slice(0, 15)
        .map((m) => `• ${m.emoji} **${m.roleName}** (${m.type || "REACTION"}) in <#${m.channelId}>`)
        .join("\n");
      embed.addFields({ name: "Configured Roles", value: summary });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Open Visual Role Studio")
        .setStyle(ButtonStyle.Link)
        .setURL(`${appUrl}/dashboard/${guildId}/reaction-roles`)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  if (commandName === "serverinfo") {
    if (!guild) return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });

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
 * Handle prefix text commands (!help, !ping, etc.)
 */
export async function handleTextCommand(message: Message, prefix: string) {
  const content = message.content.slice(prefix.length).trim();
  const args = content.split(/\s+/);
  const command = args[0]?.toLowerCase();
  const guild = message.guild;
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
        "You can use both **Slash Commands** (`/help`, `/ping`, `/dashboard`) or **Prefix Commands** (`!help`, `!ping`)!"
      )
      .addFields(
        {
          name: "Commands",
          value:
            `\`${prefix}help\` — Show this guide\n` +
            `\`${prefix}ping\` — Check bot latency\n` +
            `\`${prefix}dashboard\` — Get web dashboard link\n` +
            `\`${prefix}roles\` — List configured roles\n` +
            `\`${prefix}videofix\` — Social video fixer status`,
        },
        {
          name: "Web Companion Dashboard",
          value: `Manage all settings at: [${appUrl}/dashboard](${appUrl}/dashboard)`,
        }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  if (command === "dashboard") {
    const targetUrl = guild ? `${appUrl}/dashboard/${guild.id}` : `${appUrl}/dashboard`;
    return message.reply(`Configure Paradox in the web dashboard: ${targetUrl}`);
  }

  if (command === "roles") {
    if (!guild) return;
    const mappings = await prisma.reactionRole.findMany({ where: { guildId: guild.id } }).catch(() => []);
    if (mappings.length === 0) {
      return message.reply(`No reaction roles configured yet. Create one at: ${appUrl}/dashboard/${guild.id}/reaction-roles`);
    }
    const summary = mappings.slice(0, 10).map((m) => `• ${m.emoji} **${m.roleName}**`).join("\n");
    return message.reply(`**Active Roles:**\n${summary}\n\nManage in dashboard: ${appUrl}/dashboard/${guild.id}/reaction-roles`);
  }

  if (command === "videofix") {
    if (!guild) return;
    const config = await prisma.guildConfig.findUnique({ where: { id: guild.id } }).catch(() => null);
    const enabled = config?.videoFixerEnabled ?? true;
    return message.reply(`🎥 Video Fixer is currently **${enabled ? "Active" : "Disabled"}** for this server.`);
  }
}
