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
    const userDisplayName = member.displayName || member.user.globalName || member.user.username;
    const userName = member.user.username;
    const userMention = `<@${member.id}>`;
    const serverName = member.guild.name;
    const memberCount = String(member.guild.memberCount);
    const serverIcon = member.guild.iconURL({ extension: "png", size: 256 }) || "https://cdn.discordapp.com/embed/avatars/0.png";

    const replaceTags = (text?: string | null): string => {
      if (!text) return "";
      let s = text
        .replace(/{user\.mention}/g, userMention)
        .replace(/{user\.displayName}/gi, userDisplayName)
        .replace(/{user\.display_name}/gi, userDisplayName)
        .replace(/{user\.name}/g, userDisplayName)
        .replace(/{user\.username}/g, userName)
        .replace(/{user\.tag}/g, `@${userName}`)
        .replace(/{user\.handle}/g, `@${userName}`)
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

      // Fallback matching for common preset channel tags (rules, roles, general, announce)
      if (/\{#[^}]+\}/.test(s)) {
        const findChannel = (kw: string) =>
          member.guild.channels.cache.find(
            (c) => c.isTextBased() && c.name.toLowerCase().includes(kw.toLowerCase())
          );

        const rulesCh = findChannel("rule");
        if (rulesCh) s = s.replace(/\{#[ ]*rules[^}]*[ ]*\}/gi, `<#${rulesCh.id}>`);

        const rolesCh = findChannel("role");
        if (rolesCh) s = s.replace(/\{#[ ]*roles[^}]*[ ]*\}/gi, `<#${rolesCh.id}>`);

        const chatCh = findChannel("chat") || findChannel("general");
        if (chatCh) s = s.replace(/\{#[ ]*(general|chat)[^}]*[ ]*\}/gi, `<#${chatCh.id}>`);

        const announceCh = findChannel("announc");
        if (announceCh) s = s.replace(/\{#[ ]*announc[^}]*[ ]*\}/gi, `<#${announceCh.id}>`);

        s = s.replace(/\{#(\d+)\}/g, "<#$1>");
      }

      return s;
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

            if (raw.title) {
              let titleHeader = replaceTags(raw.title);
              titleHeader = titleHeader.replace(/<@!?\d+>/g, `@${userDisplayName}`);
              embed.setTitle(titleHeader);
            }
            if (raw.description) embed.setDescription(replaceTags(raw.description));
            if (raw.color) {
              embed.setColor(parseInt(raw.color.replace("#", ""), 16) || 0x5865f2);
            } else {
              embed.setColor(0x5865f2);
            }

            // Member PFP and Name in Author
            if (raw.authorName) {
              let authorHeader = replaceTags(raw.authorName);
              // In Discord Embed Author Header, <@id> does not format as a mention; it shows literal <@id>.
              // Convert any raw mentions in the author header to @DisplayName
              authorHeader = authorHeader.replace(/<@!?\d+>/g, `@${userDisplayName}`);
              embed.setAuthor({
                name: authorHeader,
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
              embed.setFooter({
                text: replaceTags(raw.footerText),
                iconURL: raw.footerIconUrl ? replaceTags(raw.footerIconUrl) : undefined,
              });
            }

            // Embed Fields (Rules, Roles, Chat channel pings, etc.)
            if (raw.fields && Array.isArray(raw.fields) && raw.fields.length > 0) {
              const validFields = raw.fields
                .map((f: { name: string; value: string; inline?: boolean }) => ({
                  name: (replaceTags(f.name) || f.name || "Field").slice(0, 256),
                  value: (replaceTags(f.value) || f.value || "—").slice(0, 1024),
                  inline: Boolean(f.inline),
                }))
                .filter((f: { name: string; value: string }) => f.name.trim().length > 0 && f.value.trim().length > 0);

              if (validFields.length > 0) {
                embed.addFields(validFields);
              }
            }

            if (raw.timestamp) {
              embed.setTimestamp();
            }
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
