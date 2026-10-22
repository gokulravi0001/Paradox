import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { formatToDiscordEmbedApi, validateDiscordEmbed } from "@/lib/validations";
import { publishDiscordEmbed, fetchGuildChannels } from "@/lib/discord";

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
    const { channelId, embed, content, templateId } = body;

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

    // 3. Format payload for Discord API
    const formattedEmbed = formatToDiscordEmbedApi(embed);

    // 4. Publish message
    const result = await publishDiscordEmbed(resolvedChannelId, formattedEmbed, content);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to publish embed to Discord" },
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
        action: "PUBLISH_EMBED",
        details: JSON.stringify({
          channelId,
          messageId: result.messageId,
          title: embed.title || "Untitled Embed",
        }),
      },
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      channelId,
    });
  } catch (err: unknown) {
    console.error(`[API:PublishEmbed] Error:`, err);
    return NextResponse.json({ error: "Failed to publish embed." }, { status: 500 });
  }
}
