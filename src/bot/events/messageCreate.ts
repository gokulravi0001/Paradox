import {
  Message,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { prisma } from "@/lib/prisma";
import { extractAndTransformVideoUrls } from "../services/videoTransformer";
import { handleTextCommand } from "../commands";

export async function onMessageCreate(message: Message) {
  // Ignore bot messages and webhooks
  if (message.author.bot || message.webhookId) return;
  if (!message.guild || !("send" in message.channel)) return;

  const guildId = message.guild.id;
  const channelId = message.channel.id;

  try {
    // 1. Fetch guild configuration from database
    const config = await prisma.guildConfig.findUnique({
      where: { id: guildId },
    }).catch(() => null);

    // Default prefix is now $
    const prefix = config?.prefix || "$";

    // 2. Check for Prefix Commands (e.g. $help, $ping, $rr, $roledeck, $embed, $videofix)
    if (message.content.startsWith(prefix)) {
      await handleTextCommand(message, prefix);
      return;
    }

    // 3. Process Video Embed Fixer if enabled
    if (!config || !config.videoFixerEnabled) return;

    // Check if channel is ignored
    let ignoredChannels: string[] = [];
    try {
      ignoredChannels = JSON.parse(config.videoFixerIgnoredChannels || "[]");
    } catch {
      ignoredChannels = [];
    }

    if (ignoredChannels.includes(channelId)) return;

    // Get enabled providers
    let enabledProviders: string[] = ["twitter", "tiktok", "instagram", "reddit", "bluesky", "threads"];
    try {
      if (config.videoFixerProviders) {
        enabledProviders = JSON.parse(config.videoFixerProviders);
      }
    } catch {
      enabledProviders = ["twitter", "tiktok", "instagram", "reddit", "bluesky", "threads"];
    }

    if (enabledProviders.length === 0) return;

    // Extract and transform supported video URLs
    const transformedLinks = extractAndTransformVideoUrls(message.content, enabledProviders);
    if (transformedLinks.length === 0) return;

    // Post embed links with optional 🗑️ delete button for author
    const linksList = transformedLinks.map((t) => t.transformedUrl).join("\n");
    const replyText = `🎥 **Enhanced Video Embed** (shared by <@${message.author.id}>):\n${linksList}`;

    const sendPayload: Record<string, unknown> = {
      content: replyText,
      allowedMentions: { users: [] },
    };

    if (config.videoFixerDeleteButton !== false) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`rr_del_video_${message.author.id}`)
          .setLabel("Dismiss Preview")
          .setEmoji("🗑️")
          .setStyle(ButtonStyle.Secondary)
      );
      sendPayload.components = [row];
    }

    await message.channel.send(sendPayload as any);

    // If bot has permission, suppress default embed on original message to avoid duplicate cluttered previews
    const botMember = message.guild.members.me;
    if (botMember && botMember.permissionsIn(message.channel.id).has(PermissionFlagsBits.ManageMessages)) {
      await message.suppressEmbeds(true).catch(() => null);
    }
  } catch (err) {
    console.error(`[Bot:MessageCreate] Error processing message in guild ${guildId}:`, err);
  }
}
