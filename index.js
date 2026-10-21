// Paradox Discord Bot Entrypoint
// Designed for bot hosting providers (e.g. BotHosting.net, Discloud, Pterodactyl, Railway, etc.)
require("dotenv").config();
const { spawn } = require("child_process");

console.log("=========================================");
console.log("  Starting Paradox Discord Bot Service   ");
console.log("=========================================");

const botProcess = spawn("npx", ["tsx", "src/bot/index.ts"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

botProcess.on("error", (err) => {
  console.error("Failed to start bot process:", err);
  process.exit(1);
});

botProcess.on("exit", (code) => {
  if (code !== 0) {
    console.error(`Bot process exited with code ${code}`);
  }
  process.exit(code || 0);
});
