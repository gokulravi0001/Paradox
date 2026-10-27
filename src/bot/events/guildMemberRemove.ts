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
    const serverIcon = member.guild.iconURL({ extension: "png", size: 256 }) || "https://cdn.discordapp.com/embed/avatars/0.png";

    const replaceTags = (text?: string | null): string => {
      if (!text) return "";
      let s = text
        .replace(/{user\.mention}/g, userName)
        .replace(/{user\.name}/g, userName)
        .replace(/{user\.avatar}/g, userPfp)
        .replace(/{user\.pfp}/g, userPfp)
        .replace(/{user\.id}/g, member.id)
        .replace(/{server\.name}/g, serverName)
        .replace(/{server\.member_count}/g, memberCount)
        .replace(/{server\.icon}/g, serverIcon);

      // Resolve exact channel name tags {#channel-name} to native Discord ping <#channelId>
      for (const [, ch] of member.guild.channels.cache) {
        if (!ch) continue;
        const escaped = ch.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`\\{#[ ]*${escaped}[ ]*\\}`, "gi");
        s = s.replace(regex, `<#${ch.id}>`);
      }

      // Fallback matching for common channel tags
      if (/\{#[^}]+\}/.test(s)) {
        const findChannel = (kw: string) =>
          member.guild.channels.cache.find(
            (c) => c.isTextBased() && c.name.toLowerCase().includes(kw.toLowerCase())
          );

        const rulesCh = findChannel("rule");
        if (rulesCh) s = s.replace(/\{#[ ]*rules[^}]*[ ]*\}/gi, `<#${rulesCh.id}>`);

        const chatCh = findChannel("chat") || findChannel("general");
        if (chatCh) s = s.replace(/\{#[ ]*(general|chat)[^}]*[ ]*\}/gi, `<#${chatCh.id}>`);

        s = s.replace(/\{#(\d+)\}/g, "<#$1>");
      }

      return s;
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

        // Embed Fields
        if (raw.fields && Array.isArray(raw.fields) && raw.fields.length > 0) {
          embed.addFields(
            raw.fields.map((f: { name: string; value: string; inline?: boolean }) => ({
              name: replaceTags(f.name) || f.name,
              value: replaceTags(f.value) || f.value,
              inline: Boolean(f.inline),
            }))
          );
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
