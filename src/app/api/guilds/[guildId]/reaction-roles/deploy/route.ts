import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { VisualRoleDeckDeploySchema } from "@/lib/validations";
import { fetchGuildRoles, fetchBotMember, fetchGuildChannels, DiscordChannel } from "@/lib/discord";

export const dynamic = "force-dynamic";

const DISCORD_API_ENDPOINT = "https://discord.com/api/v10";

function parseEmojiForDiscord(rawEmoji: string): { name: string; id?: string } | undefined {
  if (!rawEmoji) return undefined;
  const trimmed = rawEmoji.trim();

  // Custom emoji format: <:name:id> or <a:name:id> or name:id
  const customMatch = trimmed.match(/^<a?:([a-zA-Z0-9_]+):([0-9]+)>$/);
  if (customMatch) {
    return { name: customMatch[1], id: customMatch[2] };
  }

  const nameIdMatch = trimmed.match(/^([a-zA-Z0-9_]+):([0-9]+)$/);
  if (nameIdMatch) {
    return { name: nameIdMatch[1], id: nameIdMatch[2] };
  }

  // Unicode emoji
  return { name: trimmed };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    return NextResponse.json(
      { error: "Bot token is not configured or is a placeholder." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validated = VisualRoleDeckDeploySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { channelId, title, description, color, bannerUrl, type, mode = "TOGGLE", showRoleFields = true, roles } = validated.data;

    // 0. Resolve channel: accept channel name (with or without #) or numeric ID
    let resolvedChannelId = channelId.trim().replace(/^#/, "");
    if (!/^\d{17,21}$/.test(resolvedChannelId)) {
      const guildChannels = await fetchGuildChannels(guildId);
      const cleanTarget = resolvedChannelId.toLowerCase().replace(/[\s\-_•^⭐*#]/g, "");

      const match = guildChannels.find((c: DiscordChannel) => {
        if (c.id === resolvedChannelId) return true;
        if (c.name.toLowerCase() === resolvedChannelId.toLowerCase()) return true;
        const cleanName = c.name.toLowerCase().replace(/[\s\-_•^⭐*#]/g, "");
        if (cleanName && cleanTarget && (cleanName === cleanTarget || cleanName.includes(cleanTarget) || cleanTarget.includes(cleanName))) return true;
        return false;
      });

      if (match) {
        resolvedChannelId = match.id;
      } else {
        return NextResponse.json(
          { error: `Channel '${channelId}' was not found in this Discord server. Please select it from the dropdown or paste the numeric Channel ID (Right-click channel in Discord -> Copy Channel ID).` },
          { status: 400 }
        );
      }
    }

    // 1. Verify Bot Permissions & Role Hierarchy for ALL requested roles
    const [guildRoles, botMember] = await Promise.all([
      fetchGuildRoles(guildId),
      fetchBotMember(guildId),
    ]);

    const botHighest = botMember?.highestPosition ?? 0;
    for (const r of roles) {
      let match = r.roleId ? guildRoles.find((gr) => gr.id === r.roleId) : undefined;

      if (!match && r.roleName) {
        match = guildRoles.find((gr) => gr.name.toLowerCase() === r.roleName.toLowerCase());
        if (!match) {
          const cleanReq = r.roleName.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (cleanReq) {
            match = guildRoles.find((gr) => {
              const cleanGr = gr.name.toLowerCase().replace(/[^a-z0-9]/g, "");
              return cleanGr === cleanReq || cleanGr.includes(cleanReq) || cleanReq.includes(cleanGr);
            });
          }
        }
        if (match) {
          r.roleId = match.id;
          r.roleName = match.name;
        }
      }

      const currentRoleId = r.roleId;
      if (!match && currentRoleId) {
        match = guildRoles.find((gr) => gr.name.toLowerCase() === currentRoleId.toLowerCase() || gr.id === currentRoleId);
        if (match) {
          r.roleId = match.id;
          r.roleName = match.name;
        }
      }

      if (!match) {
        return NextResponse.json(
          { error: `Role '${r.roleName || r.roleId}' does not exist in this Discord server. Please check the role name in Server Settings -> Roles or select it from the list.` },
          { status: 400 }
        );
      }
      if (match.managed) {
        return NextResponse.json(
          { error: `Role '${match.name}' is an integration/managed role and cannot be assigned.` },
          { status: 400 }
        );
      }
      if (botHighest > 0 && match.position >= botHighest) {
        return NextResponse.json(
          {
            error: `Hierarchy violation: Role '${match.name}' is higher than or equal to the bot's highest role. In Discord Server Settings -> Roles, please drag the bot's role above '${match.name}'.`,
          },
          { status: 400 }
        );
      }
    }

    // 2. Build the Visual Embed
    const embedColor = parseInt(color.replace("#", ""), 16);

    // If showRoleFields is true, include the role fields.
    // If r.description is empty, use invisible zero-width space "\u200b" so Discord doesn't show any repetitive subtitle!
    const embedFields = showRoleFields
      ? roles.map((r) => ({
          name: `${r.emoji} ${r.roleName}`,
          value: r.description && r.description.trim().length > 0 ? r.description.trim() : "\u200b",
          inline: true,
        }))
      : [];

    let footerText = "Paradox Visual Role Deck • Click to Claim or Remove";
    if (mode === "UNIQUE") {
      footerText = "Paradox Visual Role Deck • Select 1 Role (Switching revokes previous)";
    } else if (mode === "VERIFY") {
      footerText = "Paradox Visual Role Deck • One-Time Claim (Verification)";
    } else if (mode === "REVERSED") {
      footerText = "Paradox Visual Role Deck • Click to Remove Role";
    }

    const embedPayload: Record<string, unknown> = {
      title,
      description: description || undefined,
      color: embedColor,
      footer: {
        text: footerText,
      },
      timestamp: new Date().toISOString(),
    };

    if (embedFields.length > 0) {
      embedPayload.fields = embedFields;
    }

    if (bannerUrl) {
      embedPayload.image = { url: bannerUrl };
    }

    // 3. Build Components (Buttons or Select Menu)
    const components: any[] = [];

    if (type === "BUTTON") {
      // Up to 5 buttons per ActionRow, max 5 rows (25 buttons)
      const rows: any[] = [];
      for (let i = 0; i < roles.length; i += 5) {
        const slice = roles.slice(i, i + 5);
        const actionRow = {
          type: 1, // ActionRow
          components: slice.map((r) => {
            let styleNum = 1; // Primary
            if (r.buttonStyle === "SECONDARY") styleNum = 2;
            if (r.buttonStyle === "SUCCESS") styleNum = 3;
            if (r.buttonStyle === "DANGER") styleNum = 4;

            const parsedEmoji = parseEmojiForDiscord(r.emoji);

            return {
              type: 2, // Button
              style: styleNum,
              label: r.roleName.slice(0, 80),
              emoji: parsedEmoji,
              custom_id: `rr_role_${r.roleId}`,
            };
          }),
        };
        rows.push(actionRow);
      }
      components.push(...rows);
    } else if (type === "SELECT_MENU") {
      components.push({
        type: 1,
        components: [
          {
            type: 3, // StringSelect
            custom_id: "rr_select_menu",
            placeholder: "Select a role to claim or remove...",
            options: roles.slice(0, 25).map((r) => ({
              label: r.roleName.slice(0, 100),
              value: r.roleId as string,
              description: r.description ? r.description.slice(0, 100) : undefined,
              emoji: parseEmojiForDiscord(r.emoji),
            })),
          },
        ],
      });
    }

    // 4. Send Message to Channel via Discord API
    const postPayload: Record<string, unknown> = {
      embeds: [embedPayload],
    };
    if (components.length > 0) {
      postPayload.components = components;
    }

    const discordRes = await fetch(`${DISCORD_API_ENDPOINT}/channels/${resolvedChannelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postPayload),
    });

    if (!discordRes.ok) {
      const errJson = await discordRes.json().catch(() => ({}));
      let friendlyError = errJson.message || `Discord API error: ${discordRes.statusText}`;

      if (errJson.code === 50013 || errJson.message?.includes("Missing Permissions")) {
        friendlyError = `Missing Permissions: Paradox cannot post in this channel. In Discord, right-click the channel -> Edit Channel -> Permissions -> Add Paradox (or bot role) and turn ON 'View Channel', 'Send Messages', and 'Embed Links'.`;
      } else if (errJson.code === 50001) {
        friendlyError = `Missing Access: Paradox cannot access this channel. Please grant Paradox permission to view this channel.`;
      }

      return NextResponse.json(
        {
          error: friendlyError,
          details: errJson,
        },
        { status: 400 }
      );
    }

    const createdMsg = await discordRes.json();
    const messageId = createdMsg.id;

    // 5. If Mode is REACTION, add reactions sequentially
    if (type === "REACTION") {
      for (const r of roles) {
        try {
          const encodedEmoji = encodeURIComponent(r.emoji);
          await fetch(
            `${DISCORD_API_ENDPOINT}/channels/${resolvedChannelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`,
            {
              method: "PUT",
              headers: { Authorization: `Bot ${botToken}` },
            }
          );
        } catch {
          // Continue adding remaining reactions
        }
      }
    }

    // 6. Save Mappings in Database
    for (const r of roles) {
      await prisma.reactionRole.create({
        data: {
          guildId,
          channelId: resolvedChannelId,
          messageId,
          emoji: r.emoji,
          roleId: r.roleId as string,
          roleName: r.roleName,
          description: r.description || null,
          type,
          mode: mode || "TOGGLE",
          imageUrl: r.imageUrl || null,
          bannerUrl: bannerUrl || null,
          confirmGif: r.confirmGif || null,
          buttonStyle: r.buttonStyle || "PRIMARY",
        },
      });
    }

    // 7. Audit Log
    await prisma.auditLog.create({
      data: {
        guildId,
        userId: auth.context!.user.id,
        action: "DEPLOY_VISUAL_ROLE_DECK",
        details: JSON.stringify({
          channelId,
          messageId,
          type,
          mode: mode || "TOGGLE",
          roleCount: roles.length,
          title,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      messageId,
      channelId,
      roleCount: roles.length,
    });
  } catch (err: unknown) {
    console.error("[API:VisualRoleDeck:Deploy] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to deploy visual role deck." },
      { status: 500 }
    );
  }
}
