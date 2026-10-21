// Paradox Discord Bot Entrypoint
// Optimized for BotHosting.net, Discloud, Pterodactyl, and VPS environments
require("dotenv").config();

console.log("=========================================");
console.log("  Starting Paradox Discord Bot Service   ");
console.log("=========================================");

try {
  const bot = require("./dist/bot.js");
  if (typeof bot.startBot === "function") {
    bot.startBot().catch((err) => {
      console.error("[Bot] Fatal error starting bot:", err);
      process.exit(1);
    });
  }
} catch (err) {
  console.error("Failed to load bot module:", err);
  process.exit(1);
}
