import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { postDiscordMessage, fetchGuildChannels } from "@/lib/discord";

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
      select: {
        welcomeEnabled: true,
        welcomeChannelId: true,
        welcomeMessage: true,
        welcomeEmbed: true,
        welcomeDmEnabled: true,
        welcomeDmMessage: true,
        welcomeRoleId: true,
      },
    });

    return NextResponse.json({
      config: config || {
        welcomeEnabled: false,
        welcomeChannelId: null,
        welcomeMessage: "Welcome to {server.name}, {user.mention}! 🎉",
        welcomeEmbed: null,
        welcomeDmEnabled: false,
        welcomeDmMessage: null,
        welcomeRoleId: null,
      },
    });
  } catch (err) {
    console.error("[API:Welcome:GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch welcome config" }, { status: 500 });
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
    const {
      welcomeEnabled,
      welcomeChannelId,
      welcomeMessage,
      welcomeEmbed,
      welcomeDmEnabled,
      welcomeDmMessage,
      welcomeRoleId,
    } = body;

    const updated = await prisma.guildConfig.upsert({
      where: { id: guildId },
      update: {
        welcomeEnabled: Boolean(welcomeEnabled),
        welcomeChannelId: welcomeChannelId || null,
        welcomeMessage: welcomeMessage || null,
        welcomeEmbed: welcomeEmbed ? JSON.stringify(welcomeEmbed) : null,
        welcomeDmEnabled: Boolean(welcomeDmEnabled),
        welcomeDmMessage: welcomeDmMessage || null,
        welcomeRoleId: welcomeRoleId || null,
      },
      create: {
        id: guildId,
        name: "Discord Server",
        welcomeEnabled: Boolean(welcomeEnabled),
        welcomeChannelId: welcomeChannelId || null,
        welcomeMessage: welcomeMessage || null,
        welcomeEmbed: welcomeEmbed ? JSON.stringify(welcomeEmbed) : null,
        welcomeDmEnabled: Boolean(welcomeDmEnabled),
        welcomeDmMessage: welcomeDmMessage || null,
        welcomeRoleId: welcomeRoleId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "UPDATE_WELCOME_CONFIG",
        details: JSON.stringify({ welcomeEnabled, welcomeChannelId }),
      },
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    console.error("[API:Welcome:PUT] Error:", err);
    return NextResponse.json({ error: "Failed to save welcome configuration" }, { status: 500 });
  }
}

// Test send welcome message to channel
export async function POST(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const { channelId, message, embed } = body;

    if (!channelId) {
      return NextResponse.json({ error: "Please select a channel first." }, { status: 400 });
    }

    const userAvatarUrl = auth.context!.user.avatar
      ? `https://cdn.discordapp.com/avatars/${auth.context!.user.id}/${auth.context!.user.avatar}.png?size=256`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    const channels = await fetchGuildChannels(guildId).catch(() => []);

    const resolveTags = (str?: string | null): string | undefined => {
      if (!str) return undefined;
      let s = str
        .replace(/{user\.mention}/g, `<@${auth.context!.user.id}>`)
        .replace(/{user\.name}/g, auth.context!.user.username)
        .replace(/{user\.avatar}/g, userAvatarUrl)
        .replace(/{user\.pfp}/g, userAvatarUrl)
        .replace(/{user\.id}/g, auth.context!.user.id)
        .replace(/{server\.name}/g, "Discord Server")
        .replace(/{server\.member_count}/g, "100")
        .replace(/{server\.icon}/g, "https://cdn.discordapp.com/embed/avatars/0.png");

      for (const ch of channels) {
        const escaped = ch.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`\\{#[ ]*${escaped}[ ]*\\}`, "gi");
        s = s.replace(regex, `<#${ch.id}>`);
      }

      // Fuzzy fallback for preset template tags
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

    const formattedContent = resolveTags(message || "Welcome to {server.name}, {user.mention}! 🎉 (Test Welcome Message)");

    let embedPayload = undefined;
    if (embed && (embed.title || embed.description || embed.authorName || embed.thumbnailUrl || (embed.fields && embed.fields.length > 0))) {
      const resolvedThumb = resolveTags(embed.thumbnailUrl);
      const resolvedImg = resolveTags(embed.imageUrl);
      const resolvedAuthorIcon = resolveTags(embed.authorIconUrl);
      const resolvedAuthorName = resolveTags(embed.authorName);
      const resolvedFooterIcon = resolveTags(embed.footerIconUrl);

      embedPayload = {
        title: resolveTags(embed.title),
        description: resolveTags(embed.description),
        color: embed.color ? parseInt(embed.color.replace("#", ""), 16) : 0x5865f2,
        author: resolvedAuthorName
          ? {
              name: resolvedAuthorName,
              icon_url: resolvedAuthorIcon || undefined,
            }
          : undefined,
        image: resolvedImg ? { url: resolvedImg } : undefined,
        thumbnail: resolvedThumb ? { url: resolvedThumb } : undefined,
        footer: embed.footerText
          ? {
              text: resolveTags(embed.footerText) || "",
              icon_url: resolvedFooterIcon || undefined,
            }
          : undefined,
        timestamp: embed.timestamp ? new Date().toISOString() : undefined,
        fields: embed.fields?.map((f: { name: string; value: string; inline?: boolean }) => ({
          name: resolveTags(f.name) || f.name,
          value: resolveTags(f.value) || f.value,
          inline: Boolean(f.inline),
        })),
      };
    }

    const result = await postDiscordMessage(channelId, {
      content: formattedContent,
      embeds: embedPayload ? [embedPayload] : undefined,
    });

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (err: unknown) {
    console.error("[API:Welcome:POST:Test] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send test welcome message" },
      { status: 500 }
    );
  }
}
