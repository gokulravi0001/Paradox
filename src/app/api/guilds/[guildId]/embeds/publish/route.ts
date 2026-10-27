import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { formatToDiscordEmbedApi, validateDiscordEmbed } from "@/lib/validations";
import { publishDiscordEmbed, editDiscordEmbed, fetchGuildChannels } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const { channelId, messageId, embed, content, templateId } = body;

    if (!channelId) {
      return NextResponse.json({ error: "Destination channel is required" }, { status: 400 });
    }

    if (!embed) {
      return NextResponse.json({ error: "Embed payload is required" }, { status: 400 });
    }

    // 1. Resolve channel by name or ID
    let resolvedChannelId = channelId.trim().replace(/^#/, "");
    const channels = await fetchGuildChannels(guildId);
    const targetChannel = channels.find((c) => c.id === resolvedChannelId || c.name.toLowerCase() === resolvedChannelId.toLowerCase());
    if (targetChannel) {
      resolvedChannelId = targetChannel.id;
    } else if (!/^\d{17,21}$/.test(resolvedChannelId)) {
      return NextResponse.json(
        { error: `The channel '${channelId}' was not found. Please verify the channel name or paste the channel ID.` },
        { status: 400 }
      );
    }

    // 2. Validate Embed Limits
    const validation = validateDiscordEmbed(embed);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Discord embed limit exceeded", details: validation.errors },
        { status: 400 }
      );
    }

    // 2.5 Resolve dynamic placeholder tags ({user.avatar}, {server.name}, etc.)
    const userAvatarUrl = auth.context!.user.avatar
      ? `https://cdn.discordapp.com/avatars/${auth.context!.user.id}/${auth.context!.user.avatar}.png?size=256`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    const targetGuild = auth.context!.guild;
    const serverName = targetGuild?.name || "Discord Server";
    const serverIconUrl = targetGuild?.icon
      ? `https://cdn.discordapp.com/icons/${targetGuild.id}/${targetGuild.icon}.png?size=256`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    const resolveTags = (str?: string | null): string | undefined => {
      if (!str) return undefined;
      let s = str
        .replace(/{user\.mention}/g, `<@${auth.context!.user.id}>`)
        .replace(/{user\.name}/g, auth.context!.user.username)
        .replace(/{user\.avatar}/g, userAvatarUrl)
        .replace(/{user\.pfp}/g, userAvatarUrl)
        .replace(/{user\.id}/g, auth.context!.user.id)
        .replace(/{server\.name}/g, serverName)
        .replace(/{server\.icon}/g, serverIconUrl);

      // Resolve channel name tags like {#rules} to Discord's native <#channelId>
      for (const ch of channels) {
        const escaped = ch.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`\\{#[ ]*${escaped}[ ]*\\}`, "gi");
        s = s.replace(regex, `<#${ch.id}>`);
      }

      // Fuzzy fallback for preset template tags (rules, roles, general, announcements)
      if (/\{#[^}]+\}/.test(s)) {
        const findChannel = (kw: string) =>
          channels.find((c) => c.name.toLowerCase().includes(kw.toLowerCase()));

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

    const resolvedEmbed = {
      ...embed,
      title: resolveTags(embed.title),
      description: resolveTags(embed.description),
      authorName: resolveTags(embed.authorName),
      authorIconUrl: resolveTags(embed.authorIconUrl),
      thumbnailUrl: resolveTags(embed.thumbnailUrl),
      imageUrl: resolveTags(embed.imageUrl),
      footerText: resolveTags(embed.footerText),
      footerIconUrl: resolveTags(embed.footerIconUrl),
      fields: embed.fields?.map((f: { name: string; value: string; inline?: boolean }) => ({
        ...f,
        name: resolveTags(f.name) || f.name,
        value: resolveTags(f.value) || f.value,
      })),
    };

    // 3. Format payload for Discord API
    const formattedEmbed = formatToDiscordEmbedApi(resolvedEmbed);
    const resolvedContent = resolveTags(content);

    // 4. Publish or Edit message
    const isEdit = Boolean(messageId && messageId.trim().length > 0);
    const result = isEdit
      ? await editDiscordEmbed(resolvedChannelId, messageId.trim(), formattedEmbed, resolvedContent)
      : await publishDiscordEmbed(resolvedChannelId, formattedEmbed, resolvedContent);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || (isEdit ? "Failed to update existing embed in Discord" : "Failed to publish embed to Discord") },
        { status: 400 }
      );
    }

    // 5. Update template metadata if templateId was passed
    if (templateId) {
      await prisma.embedTemplate.update({
        where: { id: templateId },
        data: {
          lastPublishedChannelId: channelId,
          lastPublishedMessageId: result.messageId,
        },
      }).catch(() => null);
    }

    // 6. Record audit log
    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: isEdit ? "EDIT_EMBED" : "PUBLISH_EMBED",
        details: JSON.stringify({
          channelId,
          messageId: result.messageId,
          isEdit,
          title: embed.title || "Untitled Embed",
        }),
      },
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      channelId,
      isEdit,
    });
  } catch (err: unknown) {
    console.error(`[API:PublishEmbed] Error:`, err);
    return NextResponse.json({ error: "Failed to publish embed." }, { status: 500 });
  }
}
