import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { VideoFixerSettingsSchema, GuildSettingsSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { id: guildId },
    });

    if (!config) {
      return NextResponse.json({ error: "Guild configuration not found" }, { status: 404 });
    }

    return NextResponse.json({
      prefix: config.prefix,
      videoFixerEnabled: config.videoFixerEnabled,
      videoFixerProviders: JSON.parse(config.videoFixerProviders || "[]"),
      videoFixerIgnoredChannels: JSON.parse(config.videoFixerIgnoredChannels || "[]"),
    });
  } catch (err) {
    console.error(`[API:Settings:GET] Error:`, err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    // Validate video fixer settings if provided
    if ("videoFixerEnabled" in body || "videoFixerProviders" in body || "videoFixerIgnoredChannels" in body) {
      const fixerValidated = VideoFixerSettingsSchema.safeParse({
        videoFixerEnabled: body.videoFixerEnabled,
        videoFixerProviders: body.videoFixerProviders,
        videoFixerIgnoredChannels: body.videoFixerIgnoredChannels,
      });

      if (!fixerValidated.success) {
        return NextResponse.json(
          { error: "Invalid video fixer settings", details: fixerValidated.error.flatten() },
          { status: 400 }
        );
      }

      updateData.videoFixerEnabled = fixerValidated.data.videoFixerEnabled;
      updateData.videoFixerProviders = JSON.stringify(fixerValidated.data.videoFixerProviders);
      updateData.videoFixerIgnoredChannels = JSON.stringify(fixerValidated.data.videoFixerIgnoredChannels);
    }

    // Validate prefix if provided
    if ("prefix" in body) {
      const prefixValidated = GuildSettingsSchema.safeParse({ prefix: body.prefix });
      if (!prefixValidated.success) {
        return NextResponse.json(
          { error: "Invalid prefix", details: prefixValidated.error.flatten() },
          { status: 400 }
        );
      }
      updateData.prefix = prefixValidated.data.prefix;
    }

    const updated = await prisma.guildConfig.update({
      where: { id: guildId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "UPDATE_SETTINGS",
        details: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        prefix: updated.prefix,
        videoFixerEnabled: updated.videoFixerEnabled,
        videoFixerProviders: JSON.parse(updated.videoFixerProviders),
        videoFixerIgnoredChannels: JSON.parse(updated.videoFixerIgnoredChannels),
      },
    });
  } catch (err) {
    console.error(`[API:Settings:PUT] Error:`, err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
