import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getBotInviteUrl } from "@/lib/discord";
import {
  Sparkles,
  ShieldCheck,
  Video,
  Smile,
  Layers,
  ArrowRight,
  ExternalLink,
  Bot,
  Lock,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = await getSession();
  const inviteUrl = getBotInviteUrl();

  return (
    <div className="flex-1 flex flex-col">
      {/* Header / Navbar */}
      <header className="border-b border-discord-card bg-discord-darker/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/pfp.png"
              alt="Paradox Bot"
              className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-discord-blurple/25 border border-white/10 ring-1 ring-white/10"
            />
            <span className="font-extrabold text-xl tracking-tight text-white">
              Paradox <span className="text-discord-blurple text-xs font-semibold px-2 py-0.5 rounded-full bg-discord-blurple/10 border border-discord-blurple/20">Bot</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-xs text-discord-muted hover:text-white transition hidden md:inline-block"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-discord-muted hover:text-white transition hidden md:inline-block"
            >
              Privacy
            </Link>

            {sessionUser ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-discord-blurple hover:bg-discord-blurple/90 text-white font-medium text-sm transition shadow-md shadow-discord-blurple/25"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <a
                href="/api/auth/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-discord-blurple hover:bg-discord-blurple/90 text-white font-medium text-sm transition shadow-md shadow-discord-blurple/25"
              >
                Sign In with Discord
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-discord-blurple/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-discord-card border border-white/10 text-xs font-medium text-discord-muted mb-6">
          <img src="/pfp.png" alt="Paradox" className="w-4 h-4 rounded-full object-cover" />
          <span>Next-Generation Discord Server Management & Video Enhancements</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl">
          Power up your Discord with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-discord-blurple via-indigo-300 to-discord-fuchsia">
            reaction roles, embeds, and video fixes
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-discord-muted max-w-2xl leading-relaxed">
          Manage roles seamlessly with hierarchy checks, publish stunning live-previewed embeds, and fix broken social
          media video links automatically without ever storing media files.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {sessionUser ? (
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-semibold text-base transition shadow-xl shadow-discord-blurple/30 flex items-center gap-2"
            >
              Open Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <a
              href="/api/auth/login"
              className="px-6 py-3.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-semibold text-base transition shadow-xl shadow-discord-blurple/30 flex items-center gap-2"
            >
              Login with Discord <ArrowRight className="w-5 h-5" />
            </a>
          )}

          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-xl bg-discord-card hover:bg-discord-card/80 border border-white/10 text-white font-semibold text-base transition flex items-center gap-2"
          >
            Add Bot to Server <ExternalLink className="w-4 h-4 text-discord-muted" />
          </a>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-discord-muted">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-discord-green" />
            <span>Role Hierarchy Guard</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-discord-green" />
            <span>Interactive Live Embed Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-discord-green" />
            <span>Zero Media Proxying / Rehosting</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-discord-green" />
            <span>OAuth2 Strict Server Authorization</span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 bg-discord-darker border-y border-discord-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white">Production-Ready Discord Utilities</h2>
            <p className="mt-4 text-discord-muted text-sm sm:text-base">
              Engineered with Discord.js v14 and modern web standards. Built for speed, safety, and effortless server administration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Reaction Roles */}
            <div className="p-6 rounded-2xl bg-discord-card border border-white/5 hover:border-discord-blurple/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-discord-blurple/10 border border-discord-blurple/20 flex items-center justify-center text-discord-blurple mb-5 group-hover:scale-110 transition">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Reaction Roles</h3>
              <p className="text-sm text-discord-muted leading-relaxed mb-4">
                Let members assign themselves roles by reacting to messages. Full role hierarchy validation prevents accidental
                privilege escalation, with graceful handling for deleted messages and missing permissions.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-discord-blurple" />
                  Unicode & custom emoji support
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-discord-blurple" />
                  Bot position hierarchy enforcement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-discord-blurple" />
                  Real-time role revocation on unreact
                </li>
              </ul>
            </div>

            {/* Feature 2: Rich Embeds */}
            <div className="p-6 rounded-2xl bg-discord-card border border-white/5 hover:border-discord-blurple/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-discord-fuchsia/10 border border-discord-fuchsia/20 flex items-center justify-center text-discord-fuchsia mb-5 group-hover:scale-110 transition">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Embed Designer & Publisher</h3>
              <p className="text-sm text-discord-muted leading-relaxed mb-4">
                Design custom Discord embeds in an interactive live editor. Real-time character limit validation prevents API
                errors before publishing directly to any channel.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-discord-fuchsia" />
                  Live Discord-identical visual preview
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-discord-fuchsia" />
                  Enforces 256/4096/6000 limit rules
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-discord-fuchsia" />
                  Inline field grid & color palette
                </li>
              </ul>
            </div>

            {/* Feature 3: Link-to-Video Embeds */}
            <div className="p-6 rounded-2xl bg-discord-card border border-white/5 hover:border-discord-blurple/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-discord-green/10 border border-discord-green/20 flex items-center justify-center text-discord-green mb-5 group-hover:scale-110 transition">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Link-to-Video Embeds</h3>
              <p className="text-sm text-discord-muted leading-relaxed mb-4">
                Transform links from X/Twitter, TikTok, Instagram, and Reddit into inline playable video previews. No video
                storage or proxying: pure provider rewrite routing.
              </p>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-discord-green" />
                  Provider toggles (Twitter, TikTok, Insta, Reddit)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-discord-green" />
                  Per-server channel ignore filters
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-discord-green" />
                  Respects &lt;suppressed&gt; link syntax
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Reliability Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-gradient-to-br from-discord-card to-discord-darker border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> Hardened Enterprise Security
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Built with server-side authorization at every level
            </h3>
            <p className="text-sm text-discord-muted leading-relaxed">
              Every single dashboard API route validates that the signed-in user holds the <code>Manage Server</code> or{" "}
              <code>Administrator</code> permission. Session secrets and Discord tokens never touch client scripts, and
              OAuth2 callbacks are protected against CSRF via cryptographic state cookies.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
            {sessionUser ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-discord-blurple hover:bg-discord-blurple/90 text-white font-semibold text-sm transition shadow-lg text-center"
              >
                Go to Server Dashboard
              </Link>
            ) : (
              <a
                href="/api/auth/login"
                className="px-6 py-3 rounded-xl bg-discord-blurple hover:bg-discord-blurple/90 text-white font-semibold text-sm transition shadow-lg text-center"
              >
                Sign In with Discord
              </a>
            )}
            <Link
              href="/privacy"
              className="px-6 py-3 rounded-xl bg-discord-dark hover:bg-discord-card text-white font-semibold text-sm transition border border-white/5 text-center"
            >
              Read Privacy Policy
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-discord-card bg-discord-darker py-8 px-4 sm:px-6 lg:px-8 text-xs text-discord-muted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-discord-blurple" />
            <span className="text-white font-semibold">Paradox Bot</span>
            <span>&copy; {new Date().getFullYear()} [OPERATOR_LEGAL_NAME].</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <a
              href="https://discord.com/developers/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Discord API Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
