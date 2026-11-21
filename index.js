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

// Auto Keep-Alive Loop: Pings the public Render URL every 4 minutes to prevent idle sleep
const https = require("https");
const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes
const RENDER_EXTERNAL_URL =
  process.env.RENDER_EXTERNAL_URL || "https://paradox-discord-bot.onrender.com";

function pingSelf() {
  if (!RENDER_EXTERNAL_URL) return;
  https
    .get(RENDER_EXTERNAL_URL, (res) => {
      console.log(`[KeepAlive] Pinged ${RENDER_EXTERNAL_URL} -> Status ${res.statusCode}`);
    })
    .on("error", (err) => {
      console.warn("[KeepAlive] Self-ping notice:", err.message);
    });
}

// Start keepalive loop
setTimeout(() => {
  pingSelf();
  setInterval(pingSelf, PING_INTERVAL);
}, 60 * 1000);

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
