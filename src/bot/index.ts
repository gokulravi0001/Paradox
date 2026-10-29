import dotenv from "dotenv";
dotenv.config();

import { createBotClient } from "./client";
import { onReady } from "./events/ready";
import { onMessageCreate } from "./events/messageCreate";
import { onMessageReactionAdd } from "./events/messageReactionAdd";
import { onMessageReactionRemove } from "./events/messageReactionRemove";
import { onInteractionCreate } from "./events/interactionCreate";
import { onGuildMemberAdd } from "./events/guildMemberAdd";
import { onGuildMemberRemove } from "./events/guildMemberRemove";
export { SLASH_COMMANDS_DATA } from "./commands";

export async function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token || token === "your_discord_bot_token_here" || token.startsWith("dummy_")) {
    console.warn("\n=======================================================");
    console.warn("⚠️  [Bot] DISCORD_BOT_TOKEN is not configured or is a placeholder.");
    console.warn("⚠️  The Discord Bot client cannot connect to the gateway.");
    console.warn("⚠️  Please set a valid bot token in your .env file to enable live Discord events.");
    console.warn("=======================================================\n");
    return null;
  }

  const client = createBotClient();

  // Register Event Listeners
  client.once("ready", () => onReady(client));
  client.on("messageCreate", onMessageCreate);
  client.on("messageReactionAdd", onMessageReactionAdd);
  client.on("messageReactionRemove", onMessageReactionRemove);
  client.on("interactionCreate", onInteractionCreate);
  client.on("guildMemberAdd", onGuildMemberAdd);
  client.on("guildMemberRemove", onGuildMemberRemove);

  // Error and Reconnect handling
  client.on("error", (error) => {
    console.error("[Bot] Discord client error encountered:", error.message);
  });

  client.on("warn", (warning) => {
    console.warn("[Bot] Discord client warning:", warning);
  });

  client.on("shardDisconnect", (event, shardId) => {
    console.warn(`[Bot] Shard ${shardId} disconnected with code ${event.code}. Discord.js will attempt reconnection...`);
  });

  client.on("shardReconnecting", (shardId) => {
    console.log(`[Bot] Shard ${shardId} reconnecting to Discord Gateway...`);
  });

  client.on("shardResume", (shardId, replayedEvents) => {
    console.log(`[Bot] Shard ${shardId} resumed connection. Replayed ${replayedEvents} events.`);
  });

  try {
    await client.login(token);
    return client;
  } catch (error) {
    console.error("[Bot] Failed to log in with provided DISCORD_BOT_TOKEN:", error);
    return null;
  }
}

// When executed directly via `npm run bot` or `tsx src/bot/index.ts`
if (require.main === module) {
  startBot().catch((err) => {
    console.error("[Bot] Fatal startup error:", err);
    process.exit(1);
  });
}
