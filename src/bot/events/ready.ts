import { Client, ActivityType } from "discord.js";
import { prisma } from "@/lib/prisma";

export async function onReady(client: Client) {
  if (!client.user) return;
  console.log(`[Bot] Successfully connected to Discord Gateway as ${client.user.tag} (ID: ${client.user.id})`);

  client.user.setActivity("Managing servers & video embeds", { type: ActivityType.Custom });

  // Sync current guilds with database
  try {
    const guilds = await client.guilds.fetch();
    console.log(`[Bot] Synchronizing ${guilds.size} connected guild(s) with database...`);

    for (const oauthGuild of Array.from(guilds.values())) {
      await prisma.guildConfig.upsert({
        where: { id: oauthGuild.id },
        update: {
          name: oauthGuild.name,
          icon: oauthGuild.icon,
          botJoined: true,
        },
        create: {
          id: oauthGuild.id,
          name: oauthGuild.name,
          icon: oauthGuild.icon,
          botJoined: true,
        },
      });
    }
    console.log(`[Bot] Guild synchronization complete.`);
  } catch (err) {
    console.error("[Bot] Failed to sync guilds on ready:", err);
  }
}
