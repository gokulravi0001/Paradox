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

  const response = await fetch(`${DISCORD_API_ENDPOINT}/guilds/${guildId}/channels`, {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const channels: DiscordChannel[] = await response.json();
  // Filter for text channels (0) and announcement channels (5)
  return channels.filter((c) => c.type === 0 || c.type === 5);
}

/**
 * Fetch guild roles via Bot token
 */
export async function fetchGuildRoles(guildId: string): Promise<DiscordRole[]> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken || botToken.startsWith("dummy_")) {
    return [];
  }

  const response = await fetch(`${DISCORD_API_ENDPOINT}/guilds/${guildId}/roles`, {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const roles: DiscordRole[] = await response.json();
  // Sort descending by position (highest role first)
  return roles.sort((a, b) => b.position - a.position);
}

/**
 * Fetch bot member in guild to inspect its highest role position
 */
export async function fetchBotMember(guildId: string): Promise<{ id: string; roles: string[]; highestPosition: number } | null> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const botClientId = process.env.DISCORD_CLIENT_ID;
  if (!botToken || !botClientId || botToken.startsWith("dummy_")) {
    return null;
  }

  try {
    const [memberRes, rolesRes] = await Promise.all([
      fetch(`${DISCORD_API_ENDPOINT}/guilds/${guildId}/members/${botClientId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      }),
      fetchGuildRoles(guildId),
    ]);

    if (!memberRes.ok) return null;
    const member = await memberRes.json();
    const roleIds: string[] = member.roles || [];

    let highestPosition = 0;
    for (const role of rolesRes) {
      if (roleIds.includes(role.id) && role.position > highestPosition) {
        highestPosition = role.position;
      }
    }

    return {
      id: botClientId,
      roles: roleIds,
      highestPosition,
    };
  } catch {
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
      return {
        success: false,
        error: err.message || `Discord API error: ${response.status}`,
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
