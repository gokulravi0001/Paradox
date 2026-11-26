import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import {
  DISCORD_ACTIVITIES,
  DiscordActivityKey,
  fetchGuildVoiceChannels,
  createDiscordActivityInvite,
  optimizeVoiceChannelForCinema,
} from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const voiceChannels = await fetchGuildVoiceChannels(guildId);
    return NextResponse.json({
      success: true,
      channels: voiceChannels,
      activities: Object.entries(DISCORD_ACTIVITIES).map(([key, act]) => ({
        key,
        id: act.id,
        name: act.name,
        description: act.description,
        emoji: act.emoji,
      })),
    });
  } catch (err: any) {
    console.error(`[API:Theater:GET] Error for guild ${guildId}:`, err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch voice channels" },
      { status: 500 }
    );
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
    const { action, channelId, activityKey, bitrate } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: "A voice channel must be selected." },
        { status: 400 }
      );
    }

    if (action === "launch") {
      const chosenKey = (activityKey || "WATCH_TOGETHER") as DiscordActivityKey;
      const activity = DISCORD_ACTIVITIES[chosenKey] || DISCORD_ACTIVITIES.WATCH_TOGETHER;

      const invite = await createDiscordActivityInvite(channelId, activity.id);

      // Also auto-optimize the channel
      const optimized = await optimizeVoiceChannelForCinema(channelId, { guildId }).catch(() => null);

      return NextResponse.json({
        success: true,
        inviteUrl: invite.inviteUrl,
        code: invite.code,
        activity: activity.name,
        bitrate: optimized?.newBitrate,
        videoQualityMode: optimized?.videoQualityMode,
      });
    }

    if (action === "optimize") {
      const result = await optimizeVoiceChannelForCinema(channelId, {
        guildId,
        preferredBitrate: bitrate ? Number(bitrate) : undefined,
        videoQualityMode: 2, // FULL
      });

      return NextResponse.json({
        success: true,
        channelId: result.channelId,
        name: result.name,
        oldBitrate: result.oldBitrate,
        newBitrate: result.newBitrate,
        videoQualityMode: result.videoQualityMode,
        maxTierBitrate: result.maxTierBitrate,
      });
    }

    if (action === "stream_movie") {
      const { movieId } = body;
      const movie = await prisma.movie.findFirst({
        where: { id: movieId, guildId },
      });

      if (!movie) {
        return NextResponse.json({ error: "Movie not found in server library" }, { status: 404 });
      }

      // 1. Optimize the Voice Channel for max quality & bitrate
      const optimized = await optimizeVoiceChannelForCinema(channelId, { guildId }).catch(() => null);

      // 2. Create the Discord Watch Together Activity invite
      const activity = DISCORD_ACTIVITIES.VPLAYER_TOGETHER || DISCORD_ACTIVITIES.WATCH_TOGETHER;
      const invite = await createDiscordActivityInvite(channelId, activity.id);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paradox00.netlify.app";
      const streamUrl = movie.fileUrl.startsWith("http")
        ? movie.fileUrl
        : `${appUrl}/api/guilds/${guildId}/theater/stream/${movie.id}`;

      return NextResponse.json({
        success: true,
        movie,
        inviteUrl: invite.inviteUrl,
        streamUrl,
        bitrate: optimized?.newBitrate,
        videoQualityMode: optimized?.videoQualityMode,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error(`[API:Theater:POST] Error for guild ${guildId}:`, err);
    return NextResponse.json(
      { error: err.message || "Operation failed" },
      { status: 500 }
    );
  }
}
