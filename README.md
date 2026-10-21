# Paradox — Production Discord Bot & Web Companion Dashboard

<p align="center">
  <img src="assets/avatar.png" alt="Paradox Discord Bot Avatar" width="180" height="180" style="border-radius: 50%;" />
  <br />
  <strong>Sleek, Secure Discord Server Administration & Video Embeds</strong>
</p>

Paradox is a production-ready Discord bot and full-stack web dashboard that allows authorized Discord server administrators to configure **Reaction Roles**, design and publish **Rich Discord Embeds** with real-time live preview, and automatically enhance **Link-to-Video Embeds** (Twitter/X, TikTok, Instagram Reels, Reddit) into inline playable video previews without ever rehosting or proxying video media.

---

## Architecture & Technology Stack

- **Web Dashboard & API:** [Next.js 14](https://nextjs.org/) (App Router) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - *Why Next.js?* Unifies client UI, server-side data fetching, and secure API routes in a single robust codebase. Zero frontend-backend impedance mismatch.
- **Bot Engine:** [Discord.js v14](https://discord.js.org/)
  - Direct connection to the Discord Gateway using WebSockets. Utilizes Partials (`Message`, `Channel`, `Reaction`, `User`) to ensure reaction role events trigger accurately on uncached messages.
- **Database & ORM:** [Prisma ORM](https://www.prisma.io/)
  - Preconfigured with **SQLite** for instant zero-dependency local startup (`dev.db`).
  - Seamlessly migrates to **PostgreSQL** in production by swapping the datasource provider in `prisma/schema.prisma`.
- **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
  - Custom Discord dark mode theme tokens, responsive layouts, accessible controls, and Discord-accurate live embed preview simulator.
- **Authentication & Security:** Discord OAuth2 (`identify`, `guilds`)
  - Cryptographically secure anti-CSRF state tokens stored in HTTP-only cookies.
  - Signed, tamper-proof session JWT cookies (`SameSite=Lax`, `HttpOnly`).
  - Strict server-side permission checks (`ADMINISTRATOR` or `MANAGE_GUILD`) enforced on **every** API mutation and read.
- **Testing:** [Vitest](https://vitest.dev/)
  - Comprehensive unit test suite verifying Discord permission bitwise calculations, embed limit validations, URL transformation logic, and session security.

---

## Discord Bot Features

### 1. Paradox Visual Role Decks & Reaction Roles (Signature Feature)
- **Unlike Ordinary Bots:** Traditional reaction role bots (like Carl-bot or Dyno) only support plain text messages with standard emoji reactions beneath them. Paradox introduces **Visual Role Decks** that stand out completely:
  - **Animated Banner GIFs & Images:** Deploy rich panels with custom animated banner GIFs (from Giphy, Tenor, Imgur, or Discord CDN) or high-res artwork.
  - **Role Badges & Stickers:** Attach custom badge icons, stickers, or level GIFs to each individual role card.
  - **Ephemeral Claim Celebration GIFs:** When a user clicks a button to claim a role, the bot sends a personalized, ephemeral celebration card displaying the role's unique animated GIF (e.g. celebration confetti, level-up badge, animated gaming artwork) and lists the role's exclusive perks!
  - **Multiple Interaction Styles:**
    - **Interactive Discord Buttons:** Native clickable buttons styled with custom emojis, colors (Blurple Primary, Green Success, Gray Secondary, Red Danger), and labels.
    - **Dropdown Role Select Menus:** Clean, compact interactive select menus with emoji icons and perk descriptions.
    - **Classic Reaction Emojis:** Auto-reacts to the visual message.
  - **One-Click Channel Deployment:** Admins design the deck in the visual studio with a live Discord simulation preview and deploy it directly to any channel in one click—no manual copying and pasting of message IDs required.
- **Role Hierarchy Guard:** Before saving and before assigning roles, Paradox verifies that the target role is positioned **below** the bot's highest role in Discord. If an admin selects a role equal to or higher than the bot's role, the dashboard displays a clear warning explaining how to reorder roles in Discord Server Settings.
- **Resilience:** Gracefully handles deleted roles, deleted messages, or missing bot permissions (`50013 Missing Permissions`) without crashing.

### 2. Rich Discord Embed Builder & Live Preview
- Full-featured dashboard embed designer supporting:
  - Embed title & clickable title URL
  - Description (with multiline text and Markdown formatting)
  - Color palette (hex picker + Discord Blurple, Green, Yellow, Red, Fuchsia presets)
  - Author details (name, author link URL, avatar icon URL)
  - Footer details (text, footer icon URL)
  - Toggleable timestamp
  - Thumbnail URL (top right) and Image URL (large main banner)
  - Dynamic fields builder with inline column toggling
- **Discord Limit Validator:** Displays real-time character meters and blocks publishing if Discord limits are exceeded:
  - Title: max 256 characters
  - Description: max 4,096 characters
  - Fields: max 25 fields (name max 256, value max 1,024)
  - Footer: max 2,048 characters
  - Author Name: max 256 characters
  - Total combined characters across all embed elements: max 6,000 characters
- **Live Preview:** A pixel-accurate replica of the Discord dark theme client showing exact borders, field alignment, and typography.
- Direct publishing to any selected text/announcement channel via Discord REST API.

### 3. Link-to-Video Embeds (Social Video Fixer)
- Inspired by services such as Keto, Clipify, and Fixupx. When users share video links that Discord does not natively embed cleanly, Paradox transforms them into Discord-compatible inline video preview links.
- **Zero-Storage / Zero-Proxy Architecture:** Paradox **never** downloads, buffers, caches, or proxies video files. It exclusively rewrites public URLs to reliable open web preview proxies.
- **Supported Providers:**
  - **X / Twitter:** `twitter.com` and `x.com` ➔ `fxtwitter.com`
  - **TikTok:** `tiktok.com` (desktop) and `vm.tiktok.com` (mobile shortlinks) ➔ `tiktxk.com`
  - **Instagram:** Reels (`/reel/`) and video posts (`/p/`) ➔ `ddinstagram.com`
  - **Reddit:** Post links (`reddit.com/r/...`) ➔ `rxddit.com`
- **Safety Rules:**
  - Ignores links already converted (e.g. `fxtwitter.com`, `ddinstagram.com`).
  - Ignores links wrapped in angle brackets `<https://...>` (Discord's Markdown syntax to suppress embeds).
  - Ignores bots and webhooks.
  - Suppresses duplicate embeds on original messages if the bot holds `Manage Messages` permissions.
- **Configurability:**
  - Global master toggle per server.
  - Per-provider toggles (e.g. enable TikTok and Twitter, disable Reddit).
  - Per-channel ignore list (e.g. mute video fixing in `#announcements` or `#bot-commands`).
  - Clear dashboard documentation on provider limitations (private accounts, age-restricted media, live streams).

---

## Required Discord Bot Permissions

When creating and inviting the bot, request the following permissions bitfield:

| Permission | Bit Value | Reason |
| :--- | :--- | :--- |
| **View Channels** | `0x400` | Read channel lists and detect messages |
| **Send Messages** | `0x800` | Post video embed links and bot responses |
| **Embed Links** | `0x4000` | Publish rich embeds designed in dashboard |
| **Attach Files** | `0x8000` | Required for media preview embeds |
| **Read Message History** | `0x10000` | Fetch messages to inspect reactions |
| **Add Reactions** | `0x40` | Place reaction emoji triggers on messages |
| **Manage Roles** | `0x10000000` | Assign/remove roles for reaction roles |
| **Manage Messages** | `0x2000` | Suppress broken default previews on fixed links |

**Calculated Permissions Bitfield:** `285280272` (or Administrator `8`).

---

## Getting Started & Setup

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm**
- A **Discord Account** and access to the [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Clone and Install Dependencies
```bash
git clone <repository_url>
cd Paradox
npm install
```

### 3. Configure Discord Developer Portal

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. **General Information:** Copy the **Application ID** (this is your `DISCORD_CLIENT_ID` and `NEXT_PUBLIC_DISCORD_CLIENT_ID`).
3. **OAuth2 -> General:**
   - Click **Reset Secret** and copy the secret (`DISCORD_CLIENT_SECRET`).
   - Under **Redirects**, click **Add Redirect** and add:
     ```
     http://localhost:3000/api/auth/callback
     ```
     *(In production, replace `http://localhost:3000` with your domain).*
4. **Bot:**
   - Click **Add Bot** (or navigate to the Bot tab).
   - Click **Reset Token** and copy the bot token (`DISCORD_BOT_TOKEN`).
   - Under **Privileged Gateway Intents**, enable:
     - **Server Members Intent** (required for fetching members and assigning roles)
     - **Message Content Intent** (required for video link detection)

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your credentials:
```env
# Discord Application & Bot Credentials
DISCORD_CLIENT_ID="your_discord_application_id"
NEXT_PUBLIC_DISCORD_CLIENT_ID="your_discord_application_id"
DISCORD_CLIENT_SECRET="your_discord_oauth2_secret"
DISCORD_BOT_TOKEN="your_discord_bot_token"
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/callback"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Session Security (Generate a random 32+ character key)
SESSION_SECRET="generate-a-secure-random-32-byte-string-here"

# Database (Default: local SQLite file)
DATABASE_URL="file:./dev.db"

PORT=3000
NODE_ENV="development"
```

### 5. Initialize the Database
Run Prisma to create the SQLite database schema:
```bash
npm run db:push
```

### 6. Run the Application

#### Option A: Run the Web Dashboard
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option B: Run the Discord Bot
In a separate terminal:
```bash
npm run bot
# Or with auto-reload during development:
npm run bot:dev
```

#### Option C: Production Build & Start
```bash
npm run build
npm run start
```

---

## Hosting the Bot on BotHosting / Pterodactyl / VPS

If you are hosting the bot on **BotHosting.net**, **Discloud**, **Pterodactyl**, or any Node.js container host linked via GitHub:

1. **Main File / Entrypoint:** Set to `index.js` (or use the start script `npm run start:bot`).
2. **Environment Variables:** Set your production values directly in your hosting dashboard:
   - `DISCORD_BOT_TOKEN`: Your bot token from the Discord Developer Portal
   - `DISCORD_CLIENT_ID`: Your Discord application ID
   - `DISCORD_CLIENT_SECRET`: Your OAuth2 client secret
   - `SESSION_SECRET`: A 32+ character random secret string
   - `DATABASE_URL`: `"file:./dev.db"` (or a PostgreSQL connection string)
3. **Database Initialization:** Run `npm run db:push` in the host console (or post-install hook) before starting.
4. **Custom Avatar:** The bot profile picture is included in [`assets/avatar.png`](assets/avatar.png) and [`public/pfp.png`](public/pfp.png) ready to be uploaded in Discord Developer Portal -> General Information / Bot avatar.

---

## Automated Test Suite

Paradox includes automated unit tests covering all mission-critical logic:
```bash
npm test
```
The test suite verifies:
- `permissions.test.ts`: Verifies bitwise `ADMINISTRATOR` and `MANAGE_GUILD` permission evaluation and edge cases.
- `validations.test.ts`: Verifies embed limits (title, description, fields count, individual field length, total 6,000 character limit, and hex color parsing).
- `videoTransformer.test.ts`: Tests Twitter/X, TikTok, Instagram Reels, and Reddit link transformation, handling already converted URLs, and embed suppression `<URL>`.
- `auth.test.ts`: Tests cryptographic state generation and JWT session encryption.

---

## Legal & Trust Pages (Operator Review)

Before launching the website and bot publicly, the bot operator must review and customize the legal draft pages:
- **Terms of Service:** [`src/app/terms/page.tsx`](file:///d:/Paradox/src/app/terms/page.tsx) (Route: `/terms`)
- **Privacy Policy:** [`src/app/privacy/page.tsx`](file:///d:/Paradox/src/app/privacy/page.tsx) (Route: `/privacy`)

Both documents include prominent placeholders:
- `[OPERATOR_LEGAL_NAME]` — Name of your organization or legal entity
- `[CONTACT_EMAIL]` — Support / privacy inquiry email
- `[BUSINESS_ADDRESS]` — Physical address or registered jurisdiction
- `[EFFECTIVE_DATE]` — Launch or policy effective date

---

## Security Architecture

1. **OAuth2 CSRF Protection:** Generates a 48-character hex cryptographic random state string stored in an HTTP-only cookie during `/api/auth/login`, validated strictly upon callback.
2. **Session Integrity:** Tokens are signed using HMAC-SHA256 with `SESSION_SECRET` and stored in `HttpOnly`, `SameSite=Lax` cookies. Discord secrets and bot tokens are **never** exposed to client browsers.
3. **Multi-Tenant Server Authorization:** Every API endpoint verifies that the authenticated user possesses `ADMINISTRATOR` or `MANAGE_GUILD` on the target Discord server. Unauthorized requests receive `403 Forbidden`.
4. **Role Hierarchy Defense:** Reaction roles cannot assign roles higher than or equal to the bot's highest role, preventing privilege escalation.
5. **Zero Media Storing:** Video link transformation operates purely via URL rewriting to open proxy utilities; no media bytes pass through or are saved to your infrastructure.
