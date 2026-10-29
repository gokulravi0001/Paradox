import { Client, ActivityType } from "discord.js";
import { prisma } from "@/lib/prisma";
import { SLASH_COMMANDS_DATA } from "../commands";
import { ensureDatabaseSchema } from "../services/ensureDb";

export async function onReady(client: Client) {
  if (!client.user) return;
  console.log(`[Bot] Successfully connected to Discord Gateway as ${client.user.tag} (ID: ${client.user.id})`);

  client.user.setActivity("Managing servers & video embeds", { type: ActivityType.Custom });

  // 1. Register Slash Commands Globally & Per-Guild for Instant Availability
  try {
    if (client.application) {
      console.log(`[Bot] Registering slash commands globally with Discord...`);
      await client.application.commands.set(SLASH_COMMANDS_DATA);
      console.log(`[Bot] Successfully registered ${SLASH_COMMANDS_DATA.length} global slash commands!`);

      // Push directly to all connected guilds so commands appear in 0 seconds without 1-hour global cache delay!
      const connectedGuilds = await client.guilds.fetch().catch(() => null);
      if (connectedGuilds) {
        for (const [gId, oauthGuild] of connectedGuilds) {
          try {
            const guildObj = await oauthGuild.fetch();
            await guildObj.commands.set(SLASH_COMMANDS_DATA);
            console.log(`[Bot] ⚡ Instant slash commands deployed to: "${guildObj.name}"`);
          } catch (gErr: any) {
            console.warn(`[Bot] Could not push instant commands to "${oauthGuild.name}": ${gErr.message}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Bot] Failed to register slash commands:", err);
  }

  // 2. Automatically ensure database tables exist (PostgreSQL / SQLite)
  await ensureDatabaseSchema(prisma);

  // 3. Sync current guilds with database
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
