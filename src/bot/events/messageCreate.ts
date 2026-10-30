import {
  Message,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  TextChannel,
} from "discord.js";
import { prisma } from "@/lib/prisma";
import { extractAndTransformVideoUrls } from "../services/videoTransformer";
import { handleTextCommand } from "../commands";

/**
 * Handles user chat messages containing <a href="LINK">TEXT</a>
 * Converts them into pure blue clickable text [TEXT](<LINK>) in Discord without embed cards.
 */
async function handleHtmlLinkBridge(message: Message, convertedContent: string) {
  const channel = message.channel;
  const guild = message.guild;
  if (!guild || !("send" in channel)) return;

  const botMember = guild.members.me;
  const isThread = channel.isThread();
  const parentChannel = isThread ? (channel.parent as TextChannel | null) : (channel as TextChannel);

  const canManageWebhooks =
    parentChannel &&
    botMember?.permissionsIn(parentChannel.id).has(PermissionFlagsBits.ManageWebhooks);
  const canManageMessages =
    botMember?.permissionsIn(channel.id).has(PermissionFlagsBits.ManageMessages);

  // 1. Send via Webhook with user's name & avatar (native blue clickable text)
  if (canManageWebhooks && parentChannel) {
    try {
      const webhooks = await parentChannel.fetchWebhooks().catch(() => null);
      let webhook = webhooks?.find((wh) => wh.owner?.id === message.client.user?.id);

      if (!webhook) {
        webhook = await parentChannel
          .createWebhook({
            name: "Paradox Link Bridge",
            avatar: message.client.user?.displayAvatarURL(),
          })
          .catch(() => null);
      }

      if (webhook) {
        const attachments = Array.from(message.attachments.values()).map((att) => att.url);
        const sendOptions: any = {
          content: convertedContent,
          username:
            message.member?.displayName ||
            message.author.globalName ||
            message.author.username,
          avatarURL: message.author.displayAvatarURL(),
          flags: [MessageFlags.SuppressEmbeds],
          allowedMentions: { parse: ["users", "roles", "everyone"] },
        };

        if (isThread) {
          sendOptions.threadId = channel.id;
        }

        if (attachments.length > 0) {
          sendOptions.files = attachments;
        }

        await webhook.send(sendOptions);

        if (canManageMessages) {
          await message.delete().catch(() => null);
        }
        return;
      }
    } catch (err) {
      console.error("[Bot:HtmlLinkBridge] Webhook send error, falling back:", err);
    }
  }

  // 2. Fallback: Bot sends message with username attribution and deletes original
  if (canManageMessages) {
    try {
      await message.delete().catch(() => null);
      await channel.send({
        content: `**${message.member?.displayName || message.author.username}**: ${convertedContent}`,
        flags: [MessageFlags.SuppressEmbeds],
        allowedMentions: { parse: ["users"] },
      });
      return;
    } catch {}
  }

  // 3. Fallback: Reply with the converted blue link
  await message
    .reply({
      content: convertedContent,
      flags: [MessageFlags.SuppressEmbeds],
      allowedMentions: { repliedUser: false },
    })
    .catch(() => null);
}

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

    // 2. Check for Prefix Commands (supports server prefix as well as standard $ or ! or .)
    const isCustomPrefix = message.content.startsWith(prefix);
    const isFallbackPrefix =
      message.content.startsWith("$") ||
      message.content.startsWith("!") ||
      message.content.startsWith(".");
    const usedPrefix = isCustomPrefix ? prefix : isFallbackPrefix ? message.content[0] : null;

    if (usedPrefix) {
      await handleTextCommand(message, usedPrefix);
      return;
    }

    // 3. Process HTML-style links: <a href="LINK">TEXT</a>
    const htmlLinkRegex = /<a\s+[^>]*href=["']?([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/a>/gi;
    if (htmlLinkRegex.test(message.content)) {
      const convertedContent = message.content.replace(htmlLinkRegex, (_, url, text) => {
        let cleanUrl = String(url).trim();
        if (
          !cleanUrl.startsWith("http://") &&
          !cleanUrl.startsWith("https://") &&
          !cleanUrl.startsWith("discord://")
        ) {
          cleanUrl = `https://${cleanUrl}`;
        }
        return `[${String(text).trim()}](<${cleanUrl}>)`;
      });

      await handleHtmlLinkBridge(message, convertedContent);
      return;
    }

    // 4. Process Video Embed Fixer if enabled
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
