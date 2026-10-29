// Dedicated Slash Command Deployment Utility for AURA / Paradox Bot
require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { SLASH_COMMANDS_DATA } = require("./dist/bot.js");

async function deploy() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token || token === "your_discord_bot_token_here" || token.startsWith("dummy_")) {
    console.error("\n=======================================================");
    console.error("❌  ERROR: DISCORD_BOT_TOKEN is missing or is a placeholder in your .env file!");
    console.error("👉  Please open .env and set your real Discord Bot Token:");
    console.error('    DISCORD_BOT_TOKEN="your_actual_bot_token_here"');
    console.error("=======================================================\n");
    process.exit(1);
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log("=========================================");
    console.log("   AURA Slash Commands Deployment Tool   ");
    console.log("=========================================\n");

    console.log("🔄 Contacting Discord API...");
    const botUser = await rest.get(Routes.user("@me"));
    const clientId = botUser.id;
    console.log(`✅ Authenticated as: ${botUser.username}#${botUser.discriminator} (ID: ${clientId})`);

    const commandPayload = SLASH_COMMANDS_DATA.map((cmd) =>
      typeof cmd.toJSON === "function" ? cmd.toJSON() : cmd
    );

    const guildIdArg = process.argv[2];

    if (guildIdArg) {
      // Instant Guild-Specific Deployment
      console.log(`⚡ Deploying ${commandPayload.length} slash commands INSTANTLY to Guild ID: ${guildIdArg}...`);
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildIdArg),
        { body: commandPayload }
      );
      console.log(`🎉 Successfully registered ${data.length} instant slash commands in guild ${guildIdArg}!\n`);
    } else {
      // Global Deployment
      console.log(`🚀 Deploying ${commandPayload.length} slash commands globally to Discord...`);
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commandPayload }
      );
      console.log(`🎉 Successfully registered ${data.length} global slash commands!\n`);
      console.log("💡 Tip: Global commands may take a few minutes to sync across all servers.");
      console.log("   To register them INSTANTLY to your server right now, run:");
      console.log(`   node deploy-commands.js YOUR_SERVER_ID\n`);
    }

    console.log("📋 Registered Commands:");
    commandPayload.forEach((c) => console.log(`   • ${c.type === 3 ? "Message Context Menu" : "Slash"}: /${c.name}`));

    console.log("\n🔗 Bot Invite Link (Ensure the bot has the 'applications.commands' scope):");
    console.log(`   https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=277025508416&scope=bot%20applications.commands\n`);

  } catch (err) {
    console.error("\n❌ Deployment failed:", err.message || err);
    if (err.status === 401) {
      console.error("👉 Reason: Invalid Discord Bot Token. Please check your DISCORD_BOT_TOKEN in .env.");
    }
  }
}

deploy();
