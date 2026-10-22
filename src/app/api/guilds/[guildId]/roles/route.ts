import { NextRequest, NextResponse } from "next/server";
import { authorizeGuildAdmin } from "@/lib/serverAuth";
import { fetchGuildRoles, fetchBotMember } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  const { guildId } = params;
  const auth = await authorizeGuildAdmin(guildId);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const [roles, botMember] = await Promise.all([
      fetchGuildRoles(guildId),
      fetchBotMember(guildId),
    ]);

    const botHighestPosition = botMember?.highestPosition ?? 0;

    const enrichedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      color: role.color ? `#${role.color.toString(16).padStart(6, "0")}` : "#99aab5",
      position: role.position,
      managed: role.managed,
      assignableByBot:
        role.name !== "@everyone" &&
        !role.managed &&
        (botHighestPosition === 0 || role.position < botHighestPosition),
    }));

    return NextResponse.json({
      roles: enrichedRoles,
      botHighestPosition,
    });
  } catch (err) {
    console.error(`[API:Roles] Error fetching roles for ${guildId}:`, err);
    return NextResponse.json({ error: "Failed to fetch guild roles" }, { status: 500 });
  }
}
