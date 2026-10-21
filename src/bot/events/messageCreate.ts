import { Message, PermissionFlagsBits } from "discord.js";
import { prisma } from "@/lib/prisma";
import { extractAndTransformVideoUrls } from "../services/videoTransformer";

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
    });

    // Check if video fixer is enabled
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
    let enabledProviders: string[] = ["twitter", "tiktok", "instagram", "reddit"];
    try {
      enabledProviders = JSON.parse(config.videoFixerProviders || "[]");
    } catch {
      enabledProviders = ["twitter", "tiktok", "instagram", "reddit"];
    }

    if (enabledProviders.length === 0) return;

    // 2. Extract and transform supported video URLs
    const transformedLinks = extractAndTransformVideoUrls(message.content, enabledProviders);
    if (transformedLinks.length === 0) return;

    // 3. Post embed links
    const linksList = transformedLinks.map((t) => t.transformedUrl).join("\n");
    const replyText = `🎥 **Enhanced Video Embed** (shared by <@${message.author.id}>):\n${linksList}`;

    await message.channel.send({
      content: replyText,
      allowedMentions: { users: [] }, // Avoid unwanted pings
    });

    // 4. If bot has permission, suppress default embed on original message to avoid duplicate cluttered previews
    const botMember = message.guild.members.me;
    if (botMember && botMember.permissionsIn(message.channel.id).has(PermissionFlagsBits.ManageMessages)) {
      await message.suppressEmbeds(true).catch(() => null);
    }
  } catch (err) {
    console.error(`[Bot:VideoFixer] Error processing message in guild ${guildId}:`, err);
  }
}
