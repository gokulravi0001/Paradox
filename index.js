// Paradox Discord Bot Entrypoint
// Optimized for Render, BotHosting.net, Discloud, Pterodactyl, and VPS environments
require("dotenv").config();
const http = require("http");

console.log("=========================================");
console.log("  Starting Paradox Discord Bot Service   ");
console.log("=========================================");

// Lightweight HTTP server for Render / PaaS health checks & keep-alive
const PORT = process.env.PORT || 10000;
const healthServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "online",
      service: "Paradox Discord Bot",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  );
});

healthServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[HealthCheck] HTTP server listening on port ${PORT}`);
});

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
