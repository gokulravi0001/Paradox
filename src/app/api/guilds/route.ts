import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchUserGuilds, hasManagePermission, checkBotInGuild, getBotInviteUrl } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch user guilds from Discord
    const userGuilds = await fetchUserGuilds(user.accessToken);

    // 2. Filter only guilds where user has MANAGE_GUILD or ADMINISTRATOR
    const manageableGuilds = userGuilds.filter((g) =>
      hasManagePermission(g.permissions, g.owner)
    );

    // 3. Query known guilds from database
    const dbGuilds = await prisma.guildConfig.findMany({
      where: {
        id: { in: manageableGuilds.map((g) => g.id) },
      },
    });
    const dbGuildMap = new Map(dbGuilds.map((g) => [g.id, g]));

    // 4. Enrich with bot presence status and invite URLs
    const results = await Promise.all(
      manageableGuilds.map(async (guild) => {
        const dbRecord = dbGuildMap.get(guild.id);
        let botInstalled = dbRecord ? dbRecord.botJoined : false;

        // If not marked in DB, perform a quick check with Discord API
        if (!botInstalled) {
          const check = await checkBotInGuild(guild.id);
          botInstalled = check.inGuild;
          if (botInstalled && !dbRecord) {
            await prisma.guildConfig.create({
              data: {
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                botJoined: true,
              },
            }).catch(() => null);
          }
        }

        const iconUrl = guild.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=128`
          : null;

        return {
          id: guild.id,
          name: guild.name,
          icon: iconUrl,
          owner: guild.owner,
          botInstalled,
          inviteUrl: getBotInviteUrl(guild.id),
        };
      })
    );

    return NextResponse.json({ guilds: results });
  } catch (err: unknown) {
    console.error("[API:Guilds] Error fetching user guilds:", err);
    return NextResponse.json(
      { error: "Failed to fetch guilds from Discord. Access token may have expired." },
      { status: 500 }
    );
  }
}
