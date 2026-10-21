import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, SessionUser } from "./auth";
import { fetchUserGuilds, hasManagePermission, DiscordGuild } from "./discord";

export interface AuthorizedGuildContext {
  user: SessionUser;
  guild: DiscordGuild;
}

/**
 * Validates that the request has an active session AND that the user
 * holds ADMINISTRATOR or MANAGE_GUILD permissions in the specified guild.
 */
export async function authorizeGuildAdmin(
  guildId: string
): Promise<{ errorResponse?: NextResponse; context?: AuthorizedGuildContext }> {
  const user = await getSession();

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized. Please log in with Discord." },
        { status: 401 }
      ),
    };
  }

  try {
    // Fetch current user's guilds using their OAuth access token to ensure real-time permission check
    const guilds = await fetchUserGuilds(user.accessToken);
    const targetGuild = guilds.find((g) => g.id === guildId);

    if (!targetGuild) {
      return {
        errorResponse: NextResponse.json(
          { error: "Guild not found or you are not a member of this server." },
          { status: 404 }
        ),
      };
    }

    const authorized = hasManagePermission(targetGuild.permissions, targetGuild.owner);
    if (!authorized) {
      return {
        errorResponse: NextResponse.json(
          { error: "Forbidden. You lack 'Manage Server' or 'Administrator' permission for this server." },
          { status: 403 }
        ),
      };
    }

    return {
      context: {
        user,
        guild: targetGuild,
      },
    };
  } catch (err: unknown) {
    console.error(`[Auth] Permission validation failed for user ${user.id} in guild ${guildId}:`, err);
    return {
      errorResponse: NextResponse.json(
        { error: "Failed to verify server permissions with Discord. Session may have expired." },
        { status: 401 }
      ),
    };
  }
}
