import { GuildMember, PartialGuildMember, EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "@/lib/prisma";

export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
  if (member.user?.bot) return;

  const guildId = member.guild.id;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { id: guildId },
    }).catch(() => null);

    if (!config || !config.goodbyeEnabled || !config.goodbyeChannelId) return;

    const channel = member.guild.channels.cache.get(config.goodbyeChannelId) as TextChannel | undefined;
    if (!channel || !channel.isTextBased()) return;

    const userPfp = member.user
      ? member.user.displayAvatarURL({ extension: "png", size: 256 })
      : "https://cdn.discordapp.com/embed/avatars/0.png";
    const userName = member.user?.username || "A member";
    const serverName = member.guild.name;
    const memberCount = String(member.guild.memberCount);

    const replaceTags = (text?: string | null): string => {
      if (!text) return "";
      return text
        .replace(/{user\.mention}/g, userName)
        .replace(/{user\.name}/g, userName)
        .replace(/{user\.avatar}/g, userPfp)
        .replace(/{user\.pfp}/g, userPfp)
        .replace(/{user\.id}/g, member.id)
        .replace(/{server\.name}/g, serverName)
        .replace(/{server\.member_count}/g, memberCount);
    };

    const messageContent = config.goodbyeMessage ? replaceTags(config.goodbyeMessage) : undefined;
    let embed: EmbedBuilder | undefined = undefined;

    if (config.goodbyeEmbed) {
      try {
        const raw = JSON.parse(config.goodbyeEmbed);
        embed = new EmbedBuilder();

        if (raw.title) embed.setTitle(replaceTags(raw.title));
        if (raw.description) embed.setDescription(replaceTags(raw.description));
        if (raw.color) {
          embed.setColor(parseInt(raw.color.replace("#", ""), 16) || 0xda373c);
        } else {
          embed.setColor(0xda373c);
        }

        // Member PFP and Name in Author
        if (raw.authorName) {
          embed.setAuthor({
            name: replaceTags(raw.authorName),
            iconURL: raw.authorIconUrl ? replaceTags(raw.authorIconUrl) : userPfp,
          });
        }

        // Member PFP in Thumbnail
        if (raw.thumbnailUrl) {
          const thumb = replaceTags(raw.thumbnailUrl);
          if (thumb.includes("http")) embed.setThumbnail(thumb);
        }

        if (raw.imageUrl) {
          const img = replaceTags(raw.imageUrl);
          if (img.includes("http")) embed.setImage(img);
        }

        if (raw.footerText) {
          embed.setFooter({ text: replaceTags(raw.footerText) });
        }
        embed.setTimestamp();
      } catch (err) {
        console.error("[Bot:Goodbye] Error parsing goodbye embed:", err);
      }
    }

    if (messageContent || embed) {
      await channel.send({
        content: messageContent || undefined,
        embeds: embed ? [embed] : undefined,
      }).catch((err) => {
        console.error(`[Bot:Goodbye] Failed to send goodbye message to #${channel.name}:`, err.message);
      });
    }
  } catch (err) {
    console.error("[Bot:Goodbye] Error processing guildMemberRemove:", err);
  }
}
