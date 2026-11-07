import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { postDiscordMessage, createDiscordMessageThread, createDiscordAdminChannel } from "@/lib/discord";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const announcements = await prisma.announcement.findMany({
      where: { guildId },
      include: {
        responses: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ announcements });
  } catch (err) {
    console.error("[API:Announcements:GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const {
      channelId,
      title,
      content = "",
      embed,
      mentionType = "NONE",
      mentionRoleId,
      publishNow = true,
      scheduledAt,
      allowTyping = false,
      threadName,
    } = body;

    if (!channelId) {
      return NextResponse.json({ error: "Destination channel is required." }, { status: 400 });
    }

    const targetGuild = auth.context!.guild;
    const serverName = targetGuild?.name || "Discord Server";
    const userDisplayName = auth.context!.user.global_name || auth.context!.user.username;
    const userAvatarUrl = auth.context!.user.avatar
      ? `https://cdn.discordapp.com/avatars/${auth.context!.user.id}/${auth.context!.user.avatar}.png?size=256`
      : "https://cdn.discordapp.com/embed/avatars/0.png";
    const serverIconUrl = targetGuild?.icon
      ? `https://cdn.discordapp.com/icons/${targetGuild.id}/${targetGuild.icon}.png?size=256`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    const resolveTags = (str?: string | null): string | undefined => {
      if (!str) return undefined;
      return str
        .replace(/{user\.mention}/g, `<@${auth.context!.user.id}>`)
        .replace(/{user\.displayName}/gi, userDisplayName)
        .replace(/{user\.display_name}/gi, userDisplayName)
        .replace(/{user\.name}/g, userDisplayName)
        .replace(/{user\.username}/g, auth.context!.user.username)
        .replace(/{user\.tag}/g, `@${auth.context!.user.username}`)
        .replace(/{user\.handle}/g, `@${auth.context!.user.username}`)
        .replace(/{user\.avatar}/g, userAvatarUrl)
        .replace(/{user\.pfp}/g, userAvatarUrl)
        .replace(/{user\.id}/g, auth.context!.user.id)
        .replace(/{server\.name}/g, serverName)
        .replace(/{server\.icon}/g, serverIconUrl);
    };

    let mentionPrefix = "";
    if (mentionType === "EVERYONE") mentionPrefix = "@everyone\n";
    if (mentionType === "HERE") mentionPrefix = "@here\n";
    if (mentionType === "ROLE" && mentionRoleId) mentionPrefix = `<@&${mentionRoleId}>\n`;

    const announcementId = crypto.randomUUID();
    let publishedMessageId: string | null = null;
    let createdThreadId: string | null = null;
    let createdAdminChannelId: string | null = null;
    const cleanThreadTitle = (threadName?.trim() || "💬 Event Ideas / Discussion").slice(0, 100);
    const mediaUrl = resolveTags(embed?.imageUrl || body.imageUrl);

    if (publishNow) {
      const fullContent = mentionPrefix + (resolveTags(content) || "");

      let embedData = undefined;
      if (embed && (embed.title || embed.description || embed.authorName)) {
        let resAuthor = resolveTags(embed.authorName);
        if (resAuthor) resAuthor = resAuthor.replace(/<@!?\d+>/g, `@${userDisplayName}`);
        let resTitle = resolveTags(embed.title);
        if (resTitle) resTitle = resTitle.replace(/<@!?\d+>/g, `@${userDisplayName}`);

        embedData = {
          title: resTitle || undefined,
          description: resolveTags(embed.description) || undefined,
          color: embed.color ? parseInt(embed.color.replace("#", ""), 16) : 0x5865f2,
          author: resAuthor ? { name: resAuthor, icon_url: resolveTags(embed.authorIconUrl) || userAvatarUrl } : undefined,
          image: mediaUrl ? { url: mediaUrl } : undefined,
          thumbnail: embed.thumbnailUrl ? { url: resolveTags(embed.thumbnailUrl) } : undefined,
          footer: embed.footerText ? { text: resolveTags(embed.footerText) } : undefined,
          timestamp: embed.timestamp ? new Date().toISOString() : undefined,
        };
      } else if (mediaUrl) {
        embedData = {
          image: { url: mediaUrl },
        };
      }

      // If typable announcement is enabled, attach interactive button component
      let components: Record<string, unknown>[] | undefined = undefined;
      if (allowTyping) {
        components = [
          {
            type: 1, // ActionRow
            components: [
              {
                type: 2, // Button
                style: 1, // Primary (Blurple)
                custom_id: `announcement_idea_${announcementId}`,
                label: "💡 Type Your Idea / Feedback",
                emoji: { name: "💡" },
              },
            ],
          },
        ];
      }

      const res = await postDiscordMessage(channelId, {
        content: fullContent || undefined,
        embeds: embedData ? [embedData] : undefined,
        components,
      });

      publishedMessageId = res.id;

      // If typable announcement is enabled, create a public discussion thread directly under the message
      if (allowTyping && publishedMessageId) {
        try {
          const threadRes = await createDiscordMessageThread(channelId, publishedMessageId, cleanThreadTitle);
          createdThreadId = threadRes.id;

          // Post welcoming starter message inside the thread so members can type directly
          await postDiscordMessage(createdThreadId, {
            content: `👋 **Welcome to the discussion thread for this announcement!**\nType your event ideas, suggestions, and feedback below, or click the **💡 Type Your Idea** button above to submit feedback directly! 👇`,
          }).catch(() => null);
        } catch (threadErr: any) {
          console.warn("[Announcements:Thread] Notice: Could not create public thread:", threadErr?.message);
        }
      }

      // If typable announcement is enabled, also create the temporary private channel for Admins & Owner
      if (allowTyping && publishedMessageId) {
        try {
          const ownerId = (targetGuild as any)?.owner_id || undefined;
          const adminChanRes = await createDiscordAdminChannel(
            guildId,
            cleanThreadTitle || "event-ideas",
            ownerId,
            {
              topic: "Temporary private channel for announcement responses. Visible only to Admins and the Server Owner.",
            }
          );
          createdAdminChannelId = adminChanRes.id;

          await postDiscordMessage(createdAdminChannelId, {
            embeds: [
              {
                title: "🔒 Temporary Admin & Owner Response Log",
                description:
                  `This private channel was automatically created to log member responses for the announcement posted in <#${channelId}>.\n\n` +
                  `• **Access:** Only Server Owner & Administrators have permission to view this channel.\n` +
                  `• **Submissions:** Whenever a member clicks **[💡 Type Your Idea / Feedback]** on the announcement and submits the text field, their response will appear here in real time.\n\n` +
                  `*When the event/collection is complete, click the red button below to close and delete this channel.*`,
                color: 0xf59e0b,
                footer: { text: "Paradox • Temporary Admin Log" },
                timestamp: new Date().toISOString(),
              },
            ],
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 4,
                    custom_id: `delete_temp_channel_${announcementId}`,
                    label: "🗑️ Close & Delete Temporary Channel",
                  },
                ],
              },
            ],
          }).catch(() => null);
        } catch (adminChanErr: any) {
          console.warn("[Announcements:AdminChannel] Notice: Could not create admin channel:", adminChanErr?.message);
        }
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        id: announcementId,
        guildId,
        channelId,
        title: title || "Broadcast Announcement",
        content: content || "",
        embed: embed ? JSON.stringify(embed) : mediaUrl ? JSON.stringify({ imageUrl: mediaUrl }) : null,
        mentionType,
        mentionRoleId: mentionRoleId || null,
        status: publishNow ? "PUBLISHED" : scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: publishNow ? new Date() : null,
        messageId: publishedMessageId,
        allowTyping: Boolean(allowTyping),
        threadName: allowTyping ? cleanThreadTitle : null,
        threadId: createdThreadId,
        adminChannelId: createdAdminChannelId,
      },
      include: {
        responses: true,
        _count: {
          select: { responses: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: publishNow ? "PUBLISH_ANNOUNCEMENT" : "DRAFT_ANNOUNCEMENT",
        details: JSON.stringify({
          channelId,
          title,
          mentionType,
          messageId: publishedMessageId,
        }),
      },
    });

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (err: unknown) {
    console.error("[API:Announcements:POST] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process announcement" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
  }

  try {
    await prisma.announcement.deleteMany({
      where: { id, guildId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API:Announcements:DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
