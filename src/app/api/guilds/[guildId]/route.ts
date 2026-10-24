import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { checkBotInGuild, getBotInviteUrl } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  const targetGuild = auth.context!.guild;

  try {
    // Check bot presence
    const botCheck = await checkBotInGuild(guildId);

    // Upsert guild configuration record
    const config = await prisma.guildConfig.upsert({
      where: { id: guildId },
      update: {
        name: targetGuild.name,
        icon: targetGuild.icon,
        botJoined: botCheck.inGuild,
      },
      create: {
        id: guildId,
        name: targetGuild.name,
        icon: targetGuild.icon,
        botJoined: botCheck.inGuild,
      },
      include: {
        _count: {
          select: {
            reactionRoles: true,
            embedTemplates: true,
            rules: true,
            announcements: true,
            events: true,
            giveaways: true,
            autoMessages: true,
            stickyMessages: true,
            auditLogs: true,
          },
        },
      },
    });

    const iconUrl = targetGuild.icon
      ? `https://cdn.discordapp.com/icons/${guildId}/${targetGuild.icon}.webp?size=128`
      : null;

    let parsedProviders: string[] = ["twitter", "tiktok", "instagram", "reddit"];
    try {
      parsedProviders = JSON.parse(config.videoFixerProviders);
    } catch {
      parsedProviders = ["twitter", "tiktok", "instagram", "reddit"];
    }

    let parsedIgnoredChannels: string[] = [];
    try {
      parsedIgnoredChannels = JSON.parse(config.videoFixerIgnoredChannels);
    } catch {
      parsedIgnoredChannels = [];
    }

    return NextResponse.json({
      guild: {
        id: targetGuild.id,
        name: targetGuild.name,
        icon: iconUrl,
        owner: targetGuild.owner,
        botInstalled: botCheck.inGuild,
        inviteUrl: getBotInviteUrl(guildId),
      },
      config: {
        prefix: config.prefix,
        videoFixerEnabled: config.videoFixerEnabled,
        videoFixerProviders: parsedProviders,
        videoFixerIgnoredChannels: parsedIgnoredChannels,
        welcomeEnabled: config.welcomeEnabled,
        welcomeChannelId: config.welcomeChannelId,
        goodbyeEnabled: config.goodbyeEnabled,
        goodbyeChannelId: config.goodbyeChannelId,
        reactionRolesCount: config._count.reactionRoles,
        embedTemplatesCount: config._count.embedTemplates,
        rulesCount: config._count.rules,
        announcementsCount: config._count.announcements,
        eventsCount: config._count.events,
        giveawaysCount: config._count.giveaways,
        autoMessagesCount: config._count.autoMessages,
        stickyMessagesCount: config._count.stickyMessages,
        auditLogsCount: config._count.auditLogs,
      },
    });
  } catch (err: unknown) {
    console.error(`[API:Guild] Failed to get guild ${guildId}:`, err);
    return NextResponse.json({ error: "Failed to load guild data." }, { status: 500 });
  }
}
