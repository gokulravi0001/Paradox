import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RoleItem {
  roleName: string;
  emoji: string;
  description: string;
  imageUrl?: string;
  confirmGif?: string;
  buttonStyle: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER";
}

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

// Aesthetic curated GIF banners
const THEME_BANNERS = {
  gaming: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2JvZTVocndobnIycmlpcXRvMXc2MHphZXcyejkyOW8xMWVlaGtwYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oKIPnAiaMCws8nOsE/giphy.gif",
  anime: "https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif",
  vip: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
  galaxy: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  rules: "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
  giveaway: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
  community: "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif",
};

const CELEBRATION_GIFS = [
  "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
  "https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif",
];

// Rich role taxonomy database
const ROLE_DICTIONARY: Record<
  string,
  { emoji: string; desc: string; style: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER" }
> = {
  gamer: { emoji: "🎮", desc: "Access game lobbies, matchmaking pings & tournament updates.", style: "PRIMARY" },
  gaming: { emoji: "🎮", desc: "Access game lobbies, matchmaking pings & tournament updates.", style: "PRIMARY" },
  valorant: { emoji: "🎯", desc: "Ranked 5-stack alerts, custom scrims & agent discussions.", style: "PRIMARY" },
  minecraft: { emoji: "⛏️", desc: "SMP server IP access, build showcases & community events.", style: "PRIMARY" },
  roblox: { emoji: "🧱", desc: "Roblox game nights, group alerts & trade discussions.", style: "PRIMARY" },
  fortnite: { emoji: "⚡", desc: "Squad fill pings, battle pass XP grinds & item shop alerts.", style: "PRIMARY" },
  genshin: { emoji: "✨", desc: "Co-op farming, banner pulls & artifact showcase.", style: "PRIMARY" },
  anime: { emoji: "🌸", desc: "Seasonal watch parties, episode discussions & manga chat.", style: "PRIMARY" },
  manga: { emoji: "📖", desc: "Manga & manhwa recommendations, spoilers & releases.", style: "SECONDARY" },
  vip: { emoji: "👑", desc: "VIP lounge access, priority voice channels & exclusive badge.", style: "SUCCESS" },
  booster: { emoji: "🚀", desc: "Server booster perks, exclusive giveaways & color roles.", style: "SUCCESS" },
  supporter: { emoji: "⭐", desc: "Special community supporter channel & badge perks.", style: "SUCCESS" },
  premium: { emoji: "💎", desc: "Elite member perks, custom embed access & priority support.", style: "SUCCESS" },
  verified: { emoji: "✅", desc: "Access to community text & voice channels after verification.", style: "SUCCESS" },
  announcements: { emoji: "📢", desc: "Major server updates, patch notes & critical alerts.", style: "DANGER" },
  pings: { emoji: "🔔", desc: "Daily pings for server activities, polls & questions.", style: "PRIMARY" },
  events: { emoji: "🎉", desc: "Weekly movie nights, trivia, tournaments & community contests.", style: "PRIMARY" },
  giveaways: { emoji: "🎁", desc: "Instant notifications for Discord Nitro & game giveaways.", style: "SUCCESS" },
  artist: { emoji: "🎨", desc: "Creative gallery showcase, art critique & commission chats.", style: "SECONDARY" },
  musician: { emoji: "🎵", desc: "Jam sessions, music production talk & listening parties.", style: "SECONDARY" },
  streamer: { emoji: "🎙️", desc: "Live stream notifications, self-promotion channel & creator room.", style: "PRIMARY" },
  content: { emoji: "🎥", desc: "Get notified when new videos and streams go live.", style: "PRIMARY" },
  developer: { emoji: "💻", desc: "Coding discussions, bot dev, open-source projects & tech talk.", style: "SECONDARY" },
  coder: { emoji: "🖥️", desc: "Programming help, code reviews & project collaborations.", style: "SECONDARY" },
  moderator: { emoji: "🛡️", desc: "Server safety, moderation commands & staff lounge access.", style: "DANGER" },
  admin: { emoji: "⚔️", desc: "Server administration, bot configurations & management.", style: "DANGER" },
  helper: { emoji: "🤝", desc: "Community assistance, ticket answering & newcomer welcomes.", style: "SUCCESS" },
  nightowl: { emoji: "🌙", desc: "Late-night voice channels, relaxed talks & evening pings.", style: "SECONDARY" },
  chatter: { emoji: "💬", desc: "General casual chat, wholesome vibes & daily check-ins.", style: "SECONDARY" },
  he_him: { emoji: "🔹", desc: "Pronouns: He / Him", style: "SECONDARY" },
  she_her: { emoji: "🌸", desc: "Pronouns: She / Her", style: "SECONDARY" },
  they_them: { emoji: "⭐", desc: "Pronouns: They / Them", style: "SECONDARY" },
  any_pronouns: { emoji: "✨", desc: "Pronouns: Any Pronouns", style: "SECONDARY" },
};

function extractEmoji(text: string): { emoji: string; cleanText: string } {
  const emojiRegex = /(\p{Extended_Pictographic}|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83E[\uDD00-\uDDFF])/u;
  const match = text.match(emojiRegex);
  if (match) {
    const emoji = match[0];
    const cleanText = text.replace(emoji, "").replace(/\s+/g, " ").trim();
    return { emoji, cleanText };
  }
  return { emoji: "", cleanText: text };
}

function parseRolesFromPrompt(prompt: string): RoleItem[] {
  const lines = prompt
    .split(/[\n;]+/)
    .map((l: string) => l.trim())
    .filter(Boolean);

  const parsedRoles: RoleItem[] = [];

  for (const line of lines) {
    const commaParts = line.includes(",") ? line.split(",").map((s: string) => s.trim()).filter(Boolean) : [line];

    for (const part of commaParts) {
      if (!part) continue;

      let roleName = "";
      let emoji = "";
      let description = "";

      if (part.includes("|")) {
        const segments = part.split("|").map((s) => s.trim());
        roleName = segments[0] || "Role";
        const emMatch = extractEmoji(segments[1] || "");
        emoji = emMatch.emoji || segments[1] || "✨";
        description = segments[2] || "";
      } else if (part.includes(":") || part.includes(" - ")) {
        const sep = part.includes(":") ? ":" : " - ";
        const [left, ...rest] = part.split(sep);
        const right = rest.join(sep).trim();
        const emMatch = extractEmoji(left);
        emoji = emMatch.emoji;
        roleName = emMatch.cleanText;
        description = right;
      } else {
        const emMatch = extractEmoji(part);
        emoji = emMatch.emoji;
        roleName = emMatch.cleanText;
      }

      roleName = roleName.replace(/^[\d+.)\-*•>\s]+/, "").trim();
      if (!roleName) continue;

      const lower = roleName.toLowerCase().replace(/[^a-z0-9_]/g, "");
      const dictMatch = Object.entries(ROLE_DICTIONARY).find(
        ([k]) => lower.includes(k) || k.includes(lower)
      );

      if (!emoji) {
        emoji = dictMatch ? dictMatch[1].emoji : "⭐";
      }

      if (!description) {
        description = dictMatch
          ? dictMatch[1].desc
          : `Click below to toggle the ${roleName} role and unlock permissions.`;
      }

      let buttonStyle: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER" = dictMatch
        ? dictMatch[1].style
        : "PRIMARY";

      if (/mod|admin|staff|owner|rule|danger/i.test(roleName)) {
        buttonStyle = "DANGER";
      } else if (/vip|boost|supporter|premium|verify|check/i.test(roleName)) {
        buttonStyle = "SUCCESS";
      } else if (/chat|member|casual|color|pronoun/i.test(roleName)) {
        buttonStyle = "SECONDARY";
      }

      parsedRoles.push({
        roleName,
        emoji,
        description,
        confirmGif: CELEBRATION_GIFS[Math.floor(Math.random() * CELEBRATION_GIFS.length)],
        buttonStyle,
      });

      if (parsedRoles.length >= 25) break;
    }

    if (parsedRoles.length >= 25) break;
  }

  if (parsedRoles.length === 0) {
    return [
      {
        roleName: "Gamer",
        emoji: "🎮",
        description: "Access gaming channels, LFG alerts & scrim pings.",
        buttonStyle: "PRIMARY",
        confirmGif: CELEBRATION_GIFS[0],
      },
      {
        roleName: "VIP Member",
        emoji: "👑",
        description: "Unlock exclusive VIP lounge, badge & supporter perks.",
        buttonStyle: "SUCCESS",
        confirmGif: CELEBRATION_GIFS[1],
      },
      {
        roleName: "Announcements",
        emoji: "🔔",
        description: "Receive critical server updates, events & notifications.",
        buttonStyle: "DANGER",
        confirmGif: CELEBRATION_GIFS[2],
      },
      {
        roleName: "Events & Giveaways",
        emoji: "🎉",
        description: "Instant notifications for Discord Nitro & game nights.",
        buttonStyle: "PRIMARY",
        confirmGif: CELEBRATION_GIFS[3],
      },
    ];
  }

  return parsedRoles;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, prompt, roles: customRoles } = body;
    const cleanPrompt = (prompt || "").trim();

    // 1. External AI Engine (Gemini API) if configured
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const isEmbed = type === "embed";
        const systemPrompt = isEmbed
          ? `You are an expert Discord community designer. Generate a rich, aesthetic Discord Embed in JSON format based on the user's prompt. Use clean Discord markdown with blockquotes (> ), bold titles, and bullet points. Output ONLY raw JSON matching this schema:
{
  "title": string,
  "description": string,
  "color": string (hex e.g. #5865F2, #57F287, #EB459E, #FEE75C, #ED4245),
  "authorName": string,
  "footerText": string,
  "imageUrl": string,
  "thumbnailUrl": string,
  "fields": [ { "name": string, "value": string, "inline": boolean } ]
}`
          : `You are an expert Discord community designer. Generate a Visual Role Deck in JSON format based on the user's prompt. Output ONLY raw JSON matching this schema:
{
  "title": string,
  "description": string,
  "color": string (hex code),
  "bannerUrl": string (gif/image url),
  "type": "BUTTON",
  "roles": [
    {
      "roleName": string,
      "emoji": string (single unicode emoji),
      "description": string,
      "buttonStyle": "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER"
    }
  ]
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    { text: `User Prompt: ${cleanPrompt || "Community Roles"}` },
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
        console.warn("[API:AI] Gemini request fallback to advanced built-in engine:", geminiErr);
      }
    }

    // 2. High-Performance Built-in Semantic AI Engine
    if (type === "embed") {
      const lower = cleanPrompt.toLowerCase();
      const isRules = /rule|policy|guideline|conduct/i.test(lower);
      const isEvent = /event|tourney|tournament|game night|party|match/i.test(lower);
      const isAnnounce = /update|announce|maintenance|patch|changelog|news/i.test(lower);
      const isGiveaway = /giveaway|nitro|win|prize|contest/i.test(lower);
      const isWelcome = /welcome|join|member|verify|onboard/i.test(lower);

      let title = "✨ Server Announcement";
      let description = "> Welcome to our official community update! Please read the highlights below.";
      let color = "#5865F2";
      let banner = THEME_BANNERS.community;
      let fields: EmbedField[] = [];

      const bulletLines = cleanPrompt
        .split(/[\n]+/)
        .map((l: string) => l.trim())
        .filter((l: string) => /^(\d+[\.\)]|[-*•>])\s+/.test(l));

      if (isRules) {
        title = "📜 Server Rules & Code of Conduct";
        description = "> **Welcome!** To ensure a friendly, safe, and fun community for everyone, all members must abide by the guidelines below.";
        color = "#ED4245";
        banner = THEME_BANNERS.rules;

        if (bulletLines.length > 0) {
          fields = bulletLines.slice(0, 10).map((line: string, idx: number) => ({
            name: `Rule #${idx + 1}`,
            value: line.replace(/^(\d+[\.\)]|[-*•>])\s+/, ""),
            inline: false,
          }));
        } else {
          fields = [
            {
              name: "1️⃣ Mutual Respect & Zero Harassment",
              value: "Hate speech, discrimination, toxicity, and harassment will result in an instant ban without warning.",
              inline: false,
            },
            {
              name: "2️⃣ No Spam or Unauthorized Self-Promotion",
              value: "Keep advertisements, Discord invites, and links to designated showcase channels only.",
              inline: false,
            },
            {
              name: "3️⃣ Discord Terms of Service",
              value: "All members must follow the official [Discord Community Guidelines](https://discord.com/guidelines).",
              inline: false,
            },
            {
              name: "4️⃣ Staff Discretion",
              value: "Follow instructions from moderators and administrators at all times.",
              inline: false,
            },
          ];
        }
      } else if (isEvent) {
        title = "🎉 Community Event & Game Night";
        description = `> **Get hyped!** We are hosting a special community tournament and gaming session. Join voice chat and compete for prizes!\n\n${cleanPrompt ? `*${cleanPrompt}*` : ""}`;
        color = "#57F287";
        banner = THEME_BANNERS.gaming;
        fields = [
          { name: "🕒 Event Schedule", value: "This Weekend at **7:00 PM EST**", inline: true },
          { name: "📍 Event Stage", value: "Voice Channel: **Stage 1**", inline: true },
          { name: "🏆 Rewards", value: "Discord Nitro + Exclusive Event Champion Role", inline: false },
          { name: "📝 How to Join", value: "React below or join the voice lobby 10 minutes early.", inline: false },
        ];
      } else if (isGiveaway) {
        title = "🎁 Special Community Giveaway!";
        description = `> **Exciting news!** We are giving away exclusive perks to celebrate our growing community.\n\n${cleanPrompt ? `*${cleanPrompt}*` : ""}`;
        color = "#FEE75C";
        banner = THEME_BANNERS.giveaway;
        fields = [
          { name: "🎁 Prize", value: "**1 Month Discord Nitro + VIP Perks**", inline: true },
          { name: "⏳ Ends In", value: "48 Hours", inline: true },
          { name: "🎯 Entry Requirements", value: "• Be an active member\n• React below to enter", inline: false },
        ];
      } else if (isAnnounce) {
        title = "📢 Server Update & Patch Notes";
        description = `> We have rolled out significant improvements, bot upgrades, and new community channels.\n\n${cleanPrompt ? `*${cleanPrompt}*` : ""}`;
        color = "#EB459E";
        banner = THEME_BANNERS.galaxy;
        fields = [
          { name: "🚀 What is New?", value: "• Interactive Visual Role Decks\n• Upgraded high-speed bot backend\n• Enhanced anti-spam protection", inline: false },
          { name: "💬 Questions & Suggestions", value: "Leave your thoughts in the suggestions channel!", inline: false },
        ];
      } else if (isWelcome) {
        title = "✨ Welcome to the Community!";
        description = "> We are thrilled to have you here! Make yourself at home, introduce yourself, and pick up your roles.";
        color = "#5865F2";
        banner = THEME_BANNERS.community;
        fields = [
          { name: "📜 Rules & Info", value: "Check #rules to stay informed.", inline: true },
          { name: "🎭 Pick Your Roles", value: "Visit #roles to customize your profile.", inline: true },
          { name: "💬 Start Chatting", value: "Say hello in #general-chat!", inline: false },
        ];
      } else {
        title = `✨ ${cleanPrompt.slice(0, 70) || "Server Announcement"}`;
        description = `> ${cleanPrompt || "Welcome to the server! Read through the information below."}`;
        color = "#5865F2";
        banner = THEME_BANNERS.galaxy;

        if (bulletLines.length > 0) {
          fields = bulletLines.slice(0, 8).map((line: string, idx: number) => ({
            name: `📌 Section ${idx + 1}`,
            value: line.replace(/^(\d+[\.\)]|[-*•>])\s+/, ""),
            inline: false,
          }));
        } else {
          fields = [
            { name: "📌 Key Highlights", value: cleanPrompt || "All essential community details and activities.", inline: false },
            { name: "💬 Support & Help", value: "Ping our staff team or open a ticket if you need assistance.", inline: true },
            { name: "🌐 Official Links", value: "[Paradox Dashboard](https://paradox-nine-kappa.vercel.app)", inline: true },
          ];
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          title,
          description,
          color,
          authorName: "Paradox Community",
          footerText: "Paradox • Live Discord Embed",
          imageUrl: banner,
          thumbnailUrl: "",
          fields,
        },
        engine: "builtin-pro",
      });
    }

    // 3. Visual Role Deck Generator
    let rolesList: RoleItem[] = [];

    if (cleanPrompt) {
      rolesList = parseRolesFromPrompt(cleanPrompt);
    } else if (Array.isArray(customRoles) && customRoles.length > 0) {
      rolesList = customRoles.map((r: any) => ({
        roleName: r.roleName || "Role",
        emoji: r.emoji || "✨",
        description: r.description || `Unlock ${r.roleName} perks.`,
        buttonStyle: r.buttonStyle || "PRIMARY",
        confirmGif: r.confirmGif || CELEBRATION_GIFS[0],
      }));
    } else {
      rolesList = parseRolesFromPrompt("Gamer 🎮, VIP 👑, Announcements 🔔, Events 🎉");
    }

    const promptText = (cleanPrompt || rolesList.map((r: RoleItem) => r.roleName).join(" ")).toLowerCase();

    let deckTitle = "✨ Choose Your Community Roles & Perks";
    let deckDescription =
      "> **Welcome to Role Selection!** Select the notification and activity roles below that match your interests.\n> Click any button below to instantly claim or remove a role.";
    let deckColor = "#5865F2";
    let deckBanner = THEME_BANNERS.community;

    if (/game|valorant|minecraft|roblox|fortnite|steam|play/i.test(promptText)) {
      deckTitle = "🎮 Gaming Squads & Matchmaking Roles";
      deckDescription =
        "> **Squad Up!** Select your favorite games to get notified when members are looking for group (LFG) or hosting custom matches.\n> Click a button below to toggle a role.";
      deckColor = "#5865F2";
      deckBanner = THEME_BANNERS.gaming;
    } else if (/anime|manga|genshin|waifu|japan/i.test(promptText)) {
      deckTitle = "🌸 Anime, Manga & Watchalong Roles";
      deckDescription =
        "> **Join the Watch Party!** Grab your roles to join weekly anime watch parties, manga discussions, and art sharing.\n> Click a button below to toggle.";
      deckColor = "#EB459E";
      deckBanner = THEME_BANNERS.anime;
    } else if (/vip|premium|booster|supporter|tier/i.test(promptText)) {
      deckTitle = "👑 Supporter Perks & Elite Roles";
      deckDescription =
        "> **Exclusive Perks!** Special server roles granting access to private lounges, priority voice channels, and exclusive giveaways.";
      deckColor = "#FEE75C";
      deckBanner = THEME_BANNERS.vip;
    } else if (/mod|admin|staff|crew|lead/i.test(promptText)) {
      deckTitle = "🛡️ Server Staff & Access Roles";
      deckDescription =
        "> **Staff Management Deck.** Authorize access to moderation tools, security channels, and internal staff operations.";
      deckColor = "#ED4245";
      deckBanner = THEME_BANNERS.rules;
    } else if (/ping|alert|announce|news|update/i.test(promptText)) {
      deckTitle = "🔔 Notification & Ping Preferences";
      deckDescription =
        "> **Customize Your Pings!** Choose which server announcements, event alerts, and giveaway pings you want to receive.";
      deckColor = "#57F287";
      deckBanner = THEME_BANNERS.galaxy;
    }

    return NextResponse.json({
      success: true,
      data: {
        title: deckTitle,
        description: deckDescription,
        color: deckColor,
        bannerUrl: deckBanner,
        type: "BUTTON",
        roles: rolesList.slice(0, 25),
      },
      engine: "builtin-pro",
    });
  } catch (err: unknown) {
    console.error("[API:AI] Error generating content:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate AI content" },
      { status: 500 }
    );
  }
}
