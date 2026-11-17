const DISCORD_API_ENDPOINT = "https://discord.com/api/v10";

export const DISCORD_PERMISSIONS = {
  ADMINISTRATOR: BigInt(0x8),
  MANAGE_GUILD: BigInt(0x20),
  MANAGE_ROLES: BigInt(0x10000000),
  MANAGE_CHANNELS: BigInt(0x10),
  SEND_MESSAGES: BigInt(0x800),
  EMBED_LINKS: BigInt(0x4000),
  ATTACH_FILES: BigInt(0x8000),
  READ_MESSAGE_HISTORY: BigInt(0x10000),
  ADD_REACTIONS: BigInt(0x40),
  VIEW_CHANNEL: BigInt(0x400),
  MANAGE_MESSAGES: BigInt(0x2000),
};

// Required bot permissions calculated bitfield:
// VIEW_CHANNEL | SEND_MESSAGES | EMBED_LINKS | ATTACH_FILES | READ_MESSAGE_HISTORY | ADD_REACTIONS | MANAGE_ROLES | MANAGE_MESSAGES
export const REQUIRED_BOT_PERMISSIONS =
  DISCORD_PERMISSIONS.VIEW_CHANNEL |
  DISCORD_PERMISSIONS.SEND_MESSAGES |
  DISCORD_PERMISSIONS.EMBED_LINKS |
  DISCORD_PERMISSIONS.ATTACH_FILES |
  DISCORD_PERMISSIONS.READ_MESSAGE_HISTORY |
  DISCORD_PERMISSIONS.ADD_REACTIONS |
  DISCORD_PERMISSIONS.MANAGE_ROLES |
  DISCORD_PERMISSIONS.MANAGE_MESSAGES;

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number; // 0 = text, 2 = voice, 4 = category, 5 = announcement
  position: number;
  parent_id?: string | null;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
}

/**
 * Check if permission bitfield contains ADMINISTRATOR or MANAGE_GUILD
 */
export function hasManagePermission(permissionsStr: string, isOwner = false): boolean {
  if (isOwner) return true;
  try {
    const permissions = BigInt(permissionsStr);
    return (
      (permissions & DISCORD_PERMISSIONS.ADMINISTRATOR) === DISCORD_PERMISSIONS.ADMINISTRATOR ||
      (permissions & DISCORD_PERMISSIONS.MANAGE_GUILD) === DISCORD_PERMISSIONS.MANAGE_GUILD
    );
  } catch {
    return false;
  }
}

/**
 * Generate Discord OAuth2 Authorization URL
 */
export function getDiscordOAuthUrl(state: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const scopes = ["identify", "guilds"].join(" ");

  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri || "",
    response_type: "code",
    scope: scopes,
    state,
    prompt: "consent",
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

/**
 * Generate Bot Invite URL with calculated required permissions
 */
export function getBotInviteUrl(guildId?: string): string {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID;
  const params = new URLSearchParams({
    client_id: clientId || "",
    permissions: REQUIRED_BOT_PERMISSIONS.toString(),
    scope: "bot applications.commands",
  });

  if (guildId) {
    params.append("guild_id", guildId);
    params.append("disable_guild_select", "true");
  }

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange OAuth authorization code for Discord access token
 */
export async function exchangeOAuthCode(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Discord OAuth configuration in environment variables");
  }

  const response = await fetch(`${DISCORD_API_ENDPOINT}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to exchange code: ${response.status} ${errorBody}`);
  }

  return response.json();
}

/**
 * Fetch authenticated user from Discord API
 */
export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_ENDPOINT}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Discord user: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch authenticated user's guilds from Discord API
 */
export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const response = await fetch(`${DISCORD_API_ENDPOINT}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user guilds: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if bot is present in guild by attempting to fetch the guild using Bot token
 */
export async function checkBotInGuild(guildId: string): Promise<{ inGuild: boolean; guild?: DiscordGuild }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    return { inGuild: false };
  }

  try {
    const response = await fetch(`${DISCORD_API_ENDPOINT}/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      return { inGuild: true, guild: data };
    }
    return { inGuild: false };
  } catch {
    return { inGuild: false };
  }
}

/**
 * Fetch guild channels via Bot token
 */
export async function fetchGuildChannels(guildId: string): Promise<DiscordChannel[]> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    return [];
  }

  try {
    const response = await fetch(`${DISCORD_API_ENDPOINT}/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[fetchGuildChannels] Discord error for ${guildId}: ${response.status}`);
      return [];
    }

    const channels: DiscordChannel[] = await response.json();
    return channels.filter((c) => c.type === 0 || c.type === 5);
  } catch (err) {
    console.error(`[fetchGuildChannels] Exception:`, err);
    return [];
  }
}

/**
 * Fetch guild roles via Bot token
 */
export async function fetchGuildRoles(guildId: string): Promise<DiscordRole[]> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    console.warn(`[fetchGuildRoles] No valid bot token for ${guildId}`);
    return [];
  }

  try {
    const response = await fetch(`${DISCORD_API_ENDPOINT}/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[fetchGuildRoles] Discord error for ${guildId}: ${response.status} ${errText}`);
      return [];
    }

    const roles: DiscordRole[] = await response.json();
    if (!Array.isArray(roles)) {
      console.error(`[fetchGuildRoles] Expected array, got:`, roles);
      return [];
    }
    return roles.sort((a, b) => b.position - a.position);
  } catch (err) {
    console.error(`[fetchGuildRoles] Exception:`, err);
    return [];
  }
}

/**
 * Fetch bot member in guild to inspect its highest role position
 */
export async function fetchBotMember(
  guildId: string,
  existingRoles?: DiscordRole[]
): Promise<{ id: string; roles: string[]; highestPosition: number } | null> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    return null;
  }

  try {
    // Discord API v10 supports @me to fetch current bot's guild member
    const memberRes = await fetch(`${DISCORD_API_ENDPOINT}/guilds/${guildId}/members/@me`, {
      headers: { Authorization: `Bot ${botToken}` },
      cache: "no-store",
    });

    if (!memberRes.ok) {
      return null;
    }

    const member = await memberRes.json();
    const roleIds: string[] = member.roles || [];
    const rolesList = existingRoles || (await fetchGuildRoles(guildId));

    let highestPosition = 0;
    for (const role of rolesList) {
      if (roleIds.includes(role.id) && role.position > highestPosition) {
        highestPosition = role.position;
      }
    }

    return {
      id: member.user?.id || "",
      roles: roleIds,
      highestPosition,
    };
  } catch (err) {
    console.error(`[fetchBotMember] Exception:`, err);
    return null;
  }
}

/**
 * Publish embed message to Discord channel
 */
export async function publishDiscordEmbed(
  channelId: string,
  embedData: Record<string, unknown>,
  content?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    return { success: false, error: "Bot token not configured or invalid." };
  }

  try {
    const response = await fetch(`${DISCORD_API_ENDPOINT}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: content || undefined,
        embeds: [embedData],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      let msg = err.message || `Discord API error: ${response.status}`;
      if (err.code === 50013 || err.message?.includes("Missing Permissions")) {
        msg = "Missing Permissions: Paradox needs 'View Channel', 'Send Messages', and 'Embed Links' permissions in this channel. In Discord, edit the channel permissions and grant Paradox access.";
      }
      return {
        success: false,
        error: msg,
      };
    }

    const created = await response.json();
    return { success: true, messageId: created.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to publish embed to channel",
    };
  }
}

/**
 * Send full message payload (content, embeds, components) to Discord channel
 */
export async function postDiscordMessage(
  channelId: string,
  body: {
    content?: string;
    embeds?: Record<string, unknown>[];
    components?: Record<string, unknown>[];
  }
): Promise<{ id: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    throw new Error("Bot token not configured or invalid.");
  }

  const response = await fetch(`${DISCORD_API_ENDPOINT}/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    let msg = err.message || `Discord API error: ${response.status}`;
    if (err.code === 50013 || err.message?.includes("Missing Permissions")) {
      msg = "Missing Permissions: Paradox needs 'View Channel', 'Send Messages', and 'Embed Links' permissions in this channel.";
    }
    throw new Error(msg);
  }

  return response.json();
}

/**
 * Create a public thread on a Discord message for member replies / typing ideas
 */
export async function createDiscordMessageThread(
  channelId: string,
  messageId: string,
  name: string
): Promise<{ id: string; name: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    throw new Error("Bot token not configured or invalid.");
  }

  const cleanName = (name || "💬 Event Ideas / Discussion").slice(0, 100);

  const response = await fetch(
    `${DISCORD_API_ENDPOINT}/channels/${channelId}/messages/${messageId}/threads`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: cleanName,
        auto_archive_duration: 1440, // 24 hours
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    console.warn("[Discord:CreateThread] Warning creating thread:", err);
    throw new Error(err.message || `Discord thread creation failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Edit existing embed message in Discord channel
 */
export async function editDiscordEmbed(
  channelId: string,
  messageId: string,
  embedData: Record<string, unknown>,
  content?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    return { success: false, error: "Bot token not configured or invalid." };
  }

  try {
    const response = await fetch(`${DISCORD_API_ENDPOINT}/channels/${channelId}/messages/${messageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: content || undefined,
        embeds: [embedData],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      let msg = err.message || `Discord API error: ${response.status}`;
      if (err.code === 10008) {
        msg = "Unknown Message: The message ID was not found in this channel or was deleted.";
      } else if (err.code === 50005) {
        msg = "Cannot Edit Message: Paradox can only edit messages sent by Paradox itself.";
      } else if (err.code === 50013 || err.message?.includes("Missing Permissions")) {
        msg = "Missing Permissions: Paradox lacks permission to access or edit messages in this channel.";
      }
      return {
        success: false,
        error: msg,
      };
    }

    const updated = await response.json();
    return { success: true, messageId: updated.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to edit embed message",
    };
  }
}

/**
 * Fetch an existing Discord message from a channel
 */
export async function fetchDiscordMessage(
  channelId: string,
  messageId: string
): Promise<{ success: boolean; message?: any; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    return { success: false, error: "Bot token not configured or invalid." };
  }

  try {
    const response = await fetch(`${DISCORD_API_ENDPOINT}/channels/${channelId}/messages/${messageId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      let msg = err.message || `Discord API error: ${response.status}`;
      if (err.code === 10008) {
        msg = "Unknown Message: The message ID does not exist in this channel.";
      }
      return { success: false, error: msg };
    }

    const message = await response.json();
    return { success: true, message };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch message from Discord",
    };
  }
}

/**
 * Delete a message from a Discord channel
 */
export async function deleteDiscordMessage(
  channelId: string,
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    return { success: false, error: "Bot token not configured or invalid." };
  }

  try {
    const response = await fetch(`${DISCORD_API_ENDPOINT}/channels/${channelId}/messages/${messageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      return { success: false, error: err.message || `Discord API error: ${response.status}` };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete message from Discord",
    };
  }
}


/**
 * Create a temporary private channel in Discord visible only to Server Admins & Owner
 */
export async function createDiscordAdminChannel(
  guildId: string,
  channelName: string,
  ownerId?: string,
  options?: { topic?: string; parentId?: string }
): Promise<{ id: string; name: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    throw new Error("Bot token not configured or invalid.");
  }

  // 1. Fetch guild roles to grant VIEW_CHANNEL to roles with ADMINISTRATOR or MANAGE_GUILD
  const roles = await fetchGuildRoles(guildId).catch(() => []);
  const adminRoleIds = roles
    .filter((r) => {
      try {
        const perms = BigInt(r.permissions);
        return (
          (perms & DISCORD_PERMISSIONS.ADMINISTRATOR) === DISCORD_PERMISSIONS.ADMINISTRATOR ||
          (perms & DISCORD_PERMISSIONS.MANAGE_GUILD) === DISCORD_PERMISSIONS.MANAGE_GUILD
        );
      } catch {
        return false;
      }
    })
    .map((r) => r.id);

  // 2. Build permission overwrites:
  // - @everyone (roleId = guildId): Deny VIEW_CHANNEL (1024)
  // - Admin roles: Allow VIEW_CHANNEL (1024) | SEND_MESSAGES (2048) | READ_MESSAGE_HISTORY (65536)
  // - Owner: Allow VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY
  const permissionOverwrites: any[] = [
    {
      id: guildId,
      type: 0, // role
      allow: "0",
      deny: "1024", // VIEW_CHANNEL
    },
  ];

  for (const roleId of adminRoleIds) {
    permissionOverwrites.push({
      id: roleId,
      type: 0, // role
      allow: "68608", // VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY
      deny: "0",
    });
  }

  if (ownerId) {
    permissionOverwrites.push({
      id: ownerId,
      type: 1, // member
      allow: "68608",
      deny: "0",
    });
  }

  // Also allow Bot member explicitly
  const botMember = await fetchBotMember(guildId).catch(() => null);
  if (botMember?.id) {
    permissionOverwrites.push({
      id: botMember.id,
      type: 1, // member
      allow: "117824", // VIEW_CHANNEL | SEND_MESSAGES | EMBED_LINKS | ATTACH_FILES | READ_MESSAGE_HISTORY | MANAGE_CHANNELS
      deny: "0",
    });
  }

  const cleanName = channelName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 85);

  const finalName = cleanName.startsWith("ideas-") ? `🔒-${cleanName}` : `🔒-ideas-${cleanName}`;

  const response = await fetch(`${DISCORD_API_ENDPOINT}/guilds/${guildId}/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: finalName,
      type: 0, // GuildText
      topic:
        options?.topic ||
        "Temporary private channel for announcement responses. Visible only to Admins and the Server Owner.",
      parent_id: options?.parentId || undefined,
      permission_overwrites: permissionOverwrites,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    console.warn("[Discord:CreateAdminChannel] Error:", err);
    throw new Error(err.message || `Failed to create admin channel: ${response.status}`);
  }

  return response.json();
}

/**
 * Official Discord Activity Application IDs
 */
export const DISCORD_ACTIVITIES = {
  WATCH_TOGETHER: {
    id: "880218394199220274",
    name: "Watch Together (YouTube)",
    description: "Watch YouTube videos, movies, and playlists synchronized in HD with friends in VC.",
    emoji: "🍿",
  },
  VPLAYER_TOGETHER: {
    id: "755600276941176913",
    name: "Watch Together (Official)",
    description: "Synchronized embedded video player inside Discord Voice Channel.",
    emoji: "🎬",
  },
  GARTIC_PHONE: {
    id: "1007373375591141447",
    name: "Gartic Phone",
    description: "The telephone game with voice and drawings.",
    emoji: "🎨",
  },
  PUTT_PARTY: {
    id: "945737671529947148",
    name: "Putt Party",
    description: "Multiplayer mini-golf tournament in voice chat.",
    emoji: "⛳",
  },
  POKER_NIGHT: {
    id: "755827207812677713",
    name: "Poker Night",
    description: "Texas Hold'em poker in voice channel.",
    emoji: "🃏",
  },
  CHESS_IN_THE_PARK: {
    id: "832012774040141894",
    name: "Chess in the Park",
    description: "Multiplayer chess board in voice channel.",
    emoji: "♟️",
  },
} as const;

export type DiscordActivityKey = keyof typeof DISCORD_ACTIVITIES;

/**
 * Fetch voice channels for a guild
 */
export async function fetchGuildVoiceChannels(guildId: string): Promise<DiscordChannel[]> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) return [];

  try {
    const response = await fetch(`${DISCORD_API_ENDPOINT}/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!response.ok) return [];
    const channels: DiscordChannel[] = await response.json();
    return channels
      .filter((c) => c.type === 2 || c.type === 13) // Voice (2) or Stage (13)
      .sort((a, b) => a.position - b.position);
  } catch (err) {
    console.error("[fetchGuildVoiceChannels] Error:", err);
    return [];
  }
}

/**
 * Generate a Discord Activity Invite Link in a Voice Channel
 * Creates target_type: 2 (Embedded Application) invite
 */
export async function createDiscordActivityInvite(
  channelId: string,
  applicationId: string,
  options?: { maxAge?: number; maxUses?: number }
): Promise<{
  code: string;
  inviteUrl: string;
  channelId: string;
  applicationId: string;
}> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    throw new Error("Discord Bot token not configured or invalid.");
  }

  const response = await fetch(`${DISCORD_API_ENDPOINT}/channels/${channelId}/invites`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      max_age: options?.maxAge ?? 86400, // 24 hours
      max_uses: options?.maxUses ?? 0, // unlimited
      target_type: 2, // 2 = Embedded Application / Activity
      target_application_id: applicationId,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    console.warn("[Discord:CreateActivityInvite] Error:", err);
    let msg = err.message || `Failed to create activity invite: ${response.status}`;
    if (err.code === 50013 || msg.includes("Missing Permissions")) {
      msg = "Missing Permissions: Paradox needs 'Create Instant Invite' and 'Use Embedded Activities' permissions in this voice channel.";
    }
    throw new Error(msg);
  }

  const data = await response.json();
  const code = data.code;
  const inviteUrl = `https://discord.gg/${code}`;

  return {
    code,
    inviteUrl,
    channelId,
    applicationId,
  };
}

/**
 * Optimizes Voice Channel Bitrate & Video Quality Mode for Cinema / Movie Streaming
 * Discord video_quality_mode:
 * 1 = AUTO (Default, Discord aggressively compresses down to 360p/480p on bandwidth jitter)
 * 2 = FULL (Forces full 720p/1080p high quality without auto-downscaling)
 */
export async function optimizeVoiceChannelForCinema(
  channelId: string,
  options?: {
    guildId?: string;
    preferredBitrate?: number;
    videoQualityMode?: number;
  }
): Promise<{
  channelId: string;
  name: string;
  oldBitrate?: number;
  newBitrate: number;
  videoQualityMode: number;
  maxTierBitrate: number;
}> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    throw new Error("Discord Bot token not configured or invalid.");
  }

  // 1. Fetch channel details to know current bitrate & guild
  let currentBitrate = 64000;
  let channelName = "voice-channel";
  let guildId = options?.guildId;

  try {
    const chRes = await fetch(`${DISCORD_API_ENDPOINT}/channels/${channelId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (chRes.ok) {
      const chData = await chRes.json();
      currentBitrate = chData.bitrate || 64000;
      channelName = chData.name || "voice-channel";
      if (!guildId && chData.guild_id) {
        guildId = chData.guild_id;
      }
    }
  } catch {}

  // 2. Determine max bitrate from guild boost tier
  // Tier 0: 96,000 bps
  // Tier 1: 128,000 bps
  // Tier 2: 256,000 bps
  // Tier 3: 384,000 bps
  let maxTierBitrate = 96000;

  if (guildId) {
    try {
      const gRes = await fetch(`${DISCORD_API_ENDPOINT}/guilds/${guildId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (gRes.ok) {
        const gData = await gRes.json();
        const tier = gData.premium_tier || 0;
        if (tier === 3) maxTierBitrate = 384000;
        else if (tier === 2) maxTierBitrate = 256000;
        else if (tier === 1) maxTierBitrate = 128000;
        else maxTierBitrate = 96000;
      }
    } catch {}
  }

  const targetBitrate = options?.preferredBitrate
    ? Math.min(options.preferredBitrate, maxTierBitrate)
    : maxTierBitrate;

  const targetQualityMode = options?.videoQualityMode ?? 2; // 2 = FULL

  // 3. Patch the voice channel
  const patchRes = await fetch(`${DISCORD_API_ENDPOINT}/channels/${channelId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bitrate: targetBitrate,
      video_quality_mode: targetQualityMode,
    }),
  });

  if (!patchRes.ok) {
    // If setting maxBitrate fails due to guild tier restriction, try 96000 fallback
    if (targetBitrate > 96000) {
      const fallbackRes = await fetch(`${DISCORD_API_ENDPOINT}/channels/${channelId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bitrate: 96000,
          video_quality_mode: targetQualityMode,
        }),
      });

      if (fallbackRes.ok) {
        return {
          channelId,
          name: channelName,
          oldBitrate: currentBitrate,
          newBitrate: 96000,
          videoQualityMode: targetQualityMode,
          maxTierBitrate: 96000,
        };
      }
    }

    const err = await patchRes.json().catch(() => ({ message: patchRes.statusText }));
    console.warn("[Discord:OptimizeVoiceChannel] Error:", err);
    throw new Error(err.message || `Failed to optimize voice channel: ${patchRes.status}`);
  }

  return {
    channelId,
    name: channelName,
    oldBitrate: currentBitrate,
    newBitrate: targetBitrate,
    videoQualityMode: targetQualityMode,
    maxTierBitrate,
  };
}
