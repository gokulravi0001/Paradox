import { GuildMember, EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "@/lib/prisma";

export async function onGuildMemberAdd(member: GuildMember) {
  if (member.user.bot) return;

  const guildId = member.guild.id;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { id: guildId },
    }).catch(() => null);

    if (!config) return;

    const userPfp = member.user.displayAvatarURL({ extension: "png", size: 256 });
    const userName = member.user.username;
    const userMention = `<@${member.id}>`;
    const serverName = member.guild.name;
    const memberCount = String(member.guild.memberCount);

    const replaceTags = (text?: string | null): string => {
      if (!text) return "";
      return text
        .replace(/{user\.mention}/g, userMention)
        .replace(/{user\.name}/g, userName)
        .replace(/{user\.avatar}/g, userPfp)
        .replace(/{user\.pfp}/g, userPfp)
        .replace(/{user\.id}/g, member.id)
        .replace(/{server\.name}/g, serverName)
        .replace(/{server\.member_count}/g, memberCount);
    };

    // 1. Assign Auto-Role on join if configured
    if (config.welcomeRoleId) {
      await member.roles.add(config.welcomeRoleId).catch((err) => {
        console.warn(`[Bot:Welcome] Failed to assign auto-role ${config.welcomeRoleId} to ${member.user.tag}:`, err.message);
      });
    }

    // 2. Send Welcome Channel Message
    if (config.welcomeEnabled && config.welcomeChannelId) {
      const channel = member.guild.channels.cache.get(config.welcomeChannelId) as TextChannel | undefined;
      if (channel && channel.isTextBased()) {
        const messageContent = config.welcomeMessage ? replaceTags(config.welcomeMessage) : undefined;
        let embed: EmbedBuilder | undefined = undefined;

        if (config.welcomeEmbed) {
          try {
            const raw = JSON.parse(config.welcomeEmbed);
            embed = new EmbedBuilder();

            if (raw.title) embed.setTitle(replaceTags(raw.title));
            if (raw.description) embed.setDescription(replaceTags(raw.description));
            if (raw.color) {
              embed.setColor(parseInt(raw.color.replace("#", ""), 16) || 0x5865f2);
            } else {
              embed.setColor(0x5865f2);
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

            // Main Banner Image
            if (raw.imageUrl) {
              const img = replaceTags(raw.imageUrl);
              if (img.includes("http")) embed.setImage(img);
            }

            if (raw.footerText) {
              embed.setFooter({ text: replaceTags(raw.footerText) });
            }
            embed.setTimestamp();
          } catch (err) {
            console.error("[Bot:Welcome] Error parsing welcome embed:", err);
          }
        }

        if (messageContent || embed) {
          await channel.send({
            content: messageContent || undefined,
            embeds: embed ? [embed] : undefined,
          }).catch((err) => {
            console.error(`[Bot:Welcome] Failed to send welcome message to #${channel.name}:`, err.message);
          });
        }
      }
    }

    // 3. Send Welcome Direct Message (DM)
    if (config.welcomeDmEnabled && config.welcomeDmMessage) {
      const dmText = replaceTags(config.welcomeDmMessage);
      await member.send(dmText).catch(() => {
        // User may have DMs closed from server members
      });
    }
  } catch (err) {
    console.error("[Bot:Welcome] Error processing guildMemberAdd:", err);
  }
}
