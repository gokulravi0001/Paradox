import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RoleInput {
  roleName: string;
  emoji?: string;
  description?: string;
  imageUrl?: string;
  confirmGif?: string;
  buttonStyle?: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER";
}

// Preset rich library of aesthetic Discord media GIFs
const AESTHETIC_BANNERS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2JvZTVocndobnIycmlpcXRvMXc2MHphZXcyejkyOW8xMWVlaGtwYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oKIPnAiaMCws8nOsE/giphy.gif",
  "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif",
  "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
];

const CELEBRATION_GIFS = [
  "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
  "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif",
];

const BADGE_ICONS: Record<string, string> = {
  gamer: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  streamer: "https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif",
  vip: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
  artist: "https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif",
  announcements: "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
};

// Known theme heuristics
const ROLE_SUGGESTIONS: Record<string, { emoji: string; desc: string; style: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER" }> = {
  gamer: { emoji: "🎮", desc: "Access game rooms, matchmaking pings & tournament alerts.", style: "PRIMARY" },
  gaming: { emoji: "🎮", desc: "Access game rooms, matchmaking pings & tournament alerts.", style: "PRIMARY" },
  vip: { emoji: "👑", desc: "Exclusive VIP lounge, priority voice channels & custom badge.", style: "SUCCESS" },
  premium: { emoji: "⭐", desc: "Supporter lounge access, exclusive giveaways & special perks.", style: "SUCCESS" },
  streamer: { emoji: "🎙️", desc: "Live stream notifications, creator room & self-promo perks.", style: "PRIMARY" },
  content: { emoji: "🎥", desc: "Get notified when new videos and streams go live.", style: "PRIMARY" },
  artist: { emoji: "🎨", desc: "Access the showcase gallery, art critique & collaboration chats.", style: "SECONDARY" },
  musician: { emoji: "🎵", desc: "Jam sessions, music production talk & listening parties.", style: "SECONDARY" },
  announcements: { emoji: "🔔", desc: "Crucial server news, major updates & special event alerts.", style: "DANGER" },
  events: { emoji: "🎉", desc: "Weekly community game nights, movie screenings & trivia.", style: "PRIMARY" },
  giveaways: { emoji: "🎁", desc: "Instant notifications for nitro, games & gift card giveaways.", style: "SUCCESS" },
  moderator: { emoji: "🛡️", desc: "Server protection, moderation commands & staff lounge access.", style: "DANGER" },
  helper: { emoji: "🤝", desc: "Assisting community members and answering server questions.", style: "SUCCESS" },
  developer: { emoji: "💻", desc: "Code discussion, bot dev, tech talk & project collabs.", style: "SECONDARY" },
  anime: { emoji: "✨", desc: "Anime discussions, seasonal watchalongs & manga chat.", style: "PRIMARY" },
  hangout: { emoji: "☕", desc: "Casual chat, daily check-ins & wholesome vibes.", style: "SECONDARY" },
  nightowl: { emoji: "🌙", desc: "Late-night voice channels, relaxed talks & evening pings.", style: "SECONDARY" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, prompt, roles: customRoles } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // If Gemini API Key is provided, attempt to use Gemini for custom generation
    if (apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an expert Discord server designer. Generate a JSON output for a Discord ${
                        type === "embed" ? "rich embed" : "visual role deck"
                      }.
Prompt: "${prompt || "Community Roles"}"
${customRoles ? `Custom roles to include: ${JSON.stringify(customRoles)}` : ""}

Return ONLY valid raw JSON with this exact schema:
${
  type === "embed"
    ? `{
  "title": string,
  "description": string,
  "color": string (hex like #5865F2),
  "authorName": string,
  "footerText": string,
  "imageUrl": string (valid image URL or empty),
  "thumbnailUrl": string (valid image URL or empty),
  "fields": [ { "name": string, "value": string, "inline": boolean } ]
}`
    : `{
  "title": string,
  "description": string,
  "color": string (hex like #5865F2),
  "bannerUrl": string (image/gif URL),
  "type": "BUTTON",
  "roles": [
    {
      "roleName": string,
      "emoji": string,
      "description": string,
      "imageUrl": string,
      "confirmGif": string,
      "buttonStyle": "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER"
    }
  ]
}`
}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json();
          const candidate = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            const parsed = JSON.parse(candidate);
            return NextResponse.json({ success: true, data: parsed, engine: "gemini" });
          }
        }
      } catch (geminiErr) {
        console.warn("[API:AI] Gemini request failed, using intelligent built-in generator:", geminiErr);
      }
    }

    // Built-in Intelligent Generative Engine
    if (type === "embed") {
      const cleanPrompt = (prompt || "Welcome to our Community!").trim();
      const isRules = /rule|policy|guideline/i.test(cleanPrompt);
      const isEvent = /event|tourney|game night|party/i.test(cleanPrompt);
      const isAnnounce = /update|announce|maintenance|patch/i.test(cleanPrompt);

      let title = `✨ ${cleanPrompt.slice(0, 80)}`;
      let description = `Welcome to the official community announcement! Please read the details below.`;
      let color = "#5865F2";
      let fields = [
        { name: "📌 Highlights", value: "Key information and upcoming activities for everyone.", inline: false },
        { name: "💬 Need Support?", value: "Reach out in #help-desk or ping our moderation team.", inline: true },
        { name: "🔗 Quick Links", value: "[Official Website](https://paradox-nine-kappa.vercel.app)", inline: true },
      ];

      if (isRules) {
        title = "📜 Server Rules & Guidelines";
        description = "To ensure a safe, welcoming, and fun environment for all members, please review and abide by our core rules.";
        color = "#ED4245";
        fields = [
          { name: "1️⃣ Mutual Respect", value: "Harassment, hate speech, toxicity, and bullying will result in an immediate ban.", inline: false },
          { name: "2️⃣ No Spam or Self-Promo", value: "Keep advertising to designated showcase channels only.", inline: false },
          { name: "3️⃣ Discord Terms of Service", value: "All members must adhere to Discord Community Guidelines.", inline: false },
        ];
      } else if (isEvent) {
        title = "🎉 Community Event & Game Night";
        description = "Get ready! We are hosting a special community event this weekend with custom prizes and voice channel games!";
        color = "#57F287";
        fields = [
          { name: "🕒 Event Time", value: "Saturday at 7:00 PM EST / 4:00 PM PST", inline: true },
          { name: "🎮 Location", value: "Main Stage Voice Channel", inline: true },
          { name: "🏆 Prizes", value: "Discord Nitro + Exclusive Event Winner Role", inline: false },
        ];
      } else if (isAnnounce) {
        title = "📢 Important Server Update";
        description = "We have rolled out new features, server improvements, and updated roles across the community.";
        color = "#EB459E";
        fields = [
          { name: "🚀 What is New?", value: "Upgraded bot systems, improved reaction roles, and new channels.", inline: false },
          { name: "✨ Feedback", value: "Share your thoughts and suggestions in #feedback-and-ideas.", inline: false },
        ];
      }

      return NextResponse.json({
        success: true,
        data: {
          title,
          description,
          color,
          authorName: "Paradox Community",
          footerText: "Paradox • Powered by AI Embed Engine",
          imageUrl: AESTHETIC_BANNERS[0],
          thumbnailUrl: "",
          fields,
        },
        engine: "builtin",
      });
    }

    // Role Deck Generation
    const rawRolesList: RoleInput[] = [];

    // If user passed specific roles list
    if (Array.isArray(customRoles) && customRoles.length > 0) {
      for (const r of customRoles) {
        const name = (r.roleName || "").trim();
        if (!name) continue;
        const lower = name.toLowerCase();
        const matched = Object.entries(ROLE_SUGGESTIONS).find(([k]) => lower.includes(k));

        rawRolesList.push({
          roleName: name,
          emoji: r.emoji || matched?.[1].emoji || "⭐",
          description: r.description || matched?.[1].desc || `Unlock ${name} perks and channel access.`,
          imageUrl: r.imageUrl || BADGE_ICONS[matched?.[0] || ""] || "",
          confirmGif: r.confirmGif || CELEBRATION_GIFS[Math.floor(Math.random() * CELEBRATION_GIFS.length)],
          buttonStyle: r.buttonStyle || matched?.[1].style || "PRIMARY",
        });
      }
    } else {
      // Parse from prompt string (e.g. "Gamer, VIP, Artist, Announcements")
      const promptStr = (prompt || "Gamer, VIP, Streamer, Announcements").trim();
      const splits = promptStr.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);

      const items = splits.length > 0 ? splits : ["Gamer", "VIP", "Streamer", "Announcements"];

      for (const item of items) {
        const lower = item.toLowerCase();
        const matched = Object.entries(ROLE_SUGGESTIONS).find(([k]) => lower.includes(k));

        rawRolesList.push({
          roleName: item,
          emoji: matched?.[1].emoji || "✨",
          description: matched?.[1].desc || `Unlock ${item} community permissions and pings.`,
          imageUrl: BADGE_ICONS[matched?.[0] || ""] || "",
          confirmGif: CELEBRATION_GIFS[Math.floor(Math.random() * CELEBRATION_GIFS.length)],
          buttonStyle: matched?.[1].style || "PRIMARY",
        });
      }
    }

    const title = `✨ Choose Your Community Roles & Perks`;
    const description = `Select the notification and activity roles below that match your interests. Roles grant custom channel access, exclusive badges, and event pings!`;
    const color = "#5865F2";
    const bannerUrl = AESTHETIC_BANNERS[0];

    return NextResponse.json({
      success: true,
      data: {
        title,
        description,
        color,
        bannerUrl,
        type: "BUTTON",
        roles: rawRolesList.slice(0, 25),
      },
      engine: "builtin",
    });
  } catch (err: unknown) {
    console.error("[API:AI] Error generating content:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate AI content" },
      { status: 500 }
    );
  }
}
