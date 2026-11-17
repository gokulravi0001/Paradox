require("dotenv").config();
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

console.log("=================================================");
console.log("   Paradox All-in-One Service (Web + Discord Bot) ");
console.log("=================================================");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT, 10) || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// 1. Prepare and start Next.js web dashboard
app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error occurred handling", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    })
      .once("error", (err) => {
        console.error("[Web] Server error:", err);
        process.exit(1);
      })
      .listen(port, () => {
        console.log(`🌐 [Web] Dashboard listening on http://${hostname}:${port}`);
      });

    // 2. Start Discord Bot in the same process
    try {
      const bot = require("./dist/bot.js");
      if (typeof bot.startBot === "function") {
        console.log("🤖 [Bot] Connecting to Discord Gateway...");
        bot
          .startBot()
          .then(() => {
            console.log("✅ [Bot] Discord Gateway connected successfully!");
          })
          .catch((err) => {
            console.error("❌ [Bot] Error starting bot:", err);
          });
      }
    } catch (botErr) {
      console.error("❌ [Bot] Failed to load bot bundle:", botErr);
    }
  })
  .catch((err) => {
    console.error("❌ [Web] Failed to prepare Next.js app:", err);
    process.exit(1);
  });
