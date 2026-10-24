import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getBotInviteUrl } from "@/lib/discord";
import {
  Sparkles,
  ShieldCheck,
  Film,
  Smile,
  Palette,
  ArrowRight,
  ExternalLink,
  Bot,
  UserCheck,
  Scroll,
  Megaphone,
  Calendar,
  Gift,
  Clock,
  Pin,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Zap,
} from "lucide-react";
import { DiscordPreview } from "@/components/ui/DiscordPreview";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = await getSession();
  const inviteUrl = getBotInviteUrl();

  const features = [
    {
      icon: Smile,
      title: "Visual Role Decks & Single Choice",
      desc: "Deploy interactive role buttons with single-choice radio modes, one-time claim verification, and bot hierarchy safeguards.",
      color: "from-blue-500/20 to-indigo-500/20 text-discord-blurple",
    },
    {
      icon: Palette,
      title: "Advanced Embed Builder",
      desc: "Create and publish pixel-perfect Discord embeds with author icons, inline fields, custom hex color pickers, and live staging.",
      color: "from-purple-500/20 to-pink-500/20 text-purple-400",
    },
    {
      icon: UserCheck,
      title: "Dynamic Welcome & Goodbye",
      desc: "Greet newcomers automatically with dynamic mentions, server statistics, multi-channel references, and auto-role assignments.",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400",
    },
    {
      icon: Scroll,
      title: "Server Rules Management",
      desc: "Structure official community guidelines with numbered rules, custom emojis, and one-click direct publishing to Discord.",
      color: "from-amber-500/20 to-orange-500/20 text-amber-400",
    },
    {
      icon: Megaphone,
      title: "Broadcast Announcements",
      desc: "Broadcast formatted announcements across channels with audience ping controls, role mentions, and confirmation warnings.",
      color: "from-rose-500/20 to-red-500/20 text-discord-red",
    },
    {
      icon: Gift,
      title: "Automated Giveaways",
      desc: "Host interactive giveaways with one-click enter buttons, role prerequisites, live end countdowns, and automatic winner selection.",
      color: "from-pink-500/20 to-fuchsia-500/20 text-pink-400",
    },
    {
      icon: Calendar,
      title: "Community Scheduled Events",
      desc: "Schedule voice channel tournaments and community gaming sessions with automatic broadcast alerts and time zone handling.",
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-400",
    },
    {
      icon: Film,
      title: "Native Video Link Previews",
      desc: "Automatically transform broken social links from X/Twitter, TikTok, Instagram, and Reddit into playable in-Discord video players.",
      color: "from-indigo-500/20 to-blue-500/20 text-blue-400",
    },
    {
      icon: Clock,
      title: "Recurring Auto & Sticky Notices",
      desc: "Schedule recurring hourly or daily messages, or pin dynamic sticky notices at the bottom of busy community chat channels.",
      color: "from-teal-500/20 to-emerald-500/20 text-teal-400",
    },
  ];

  const faqs = [
    {
      q: "How do I add Paradox to my Discord server?",
      a: "Click 'Add to Discord' above, log in with your Discord account, select your server, and authorize the bot. You need 'Manage Server' or 'Administrator' permissions.",
    },
    {
      q: "Do I need to type bot commands in Discord?",
      a: "No! The entire purpose of the Paradox Dashboard is to let you manage embeds, roles, welcome greetings, and announcements through a modern web interface without typing cryptic commands.",
    },
    {
      q: "How does the bot role hierarchy check work?",
      a: "Discord requires bots to have a higher role position than the roles they assign. Paradox automatically detects role positions and warns you in the dashboard so permissions never fail.",
    },
    {
      q: "Can I mention multiple channels in welcome or announcement messages?",
      a: "Yes! The dynamic channel selector lets you insert multiple channel links (e.g. {#rules}, {#roles}, {#general}) that automatically format into clickable Discord channel pills.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#08090d] text-zinc-100 font-sans selection:bg-discord-blurple/30 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#08090d]/85 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-discord-blurple to-indigo-700 flex items-center justify-center shadow-lg shadow-discord-blurple/20 group-hover:scale-105 transition">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              <span>PARADOX</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-discord-blurple/15 text-discord-blurple border border-discord-blurple/30">
                PRO
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#preview" className="hover:text-white transition">Live Preview</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
          </nav>

          <div className="flex items-center gap-3">
            {sessionUser ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-bold text-xs transition shadow-lg shadow-discord-blurple/25"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <a
                href="/api/auth/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-bold text-xs transition shadow-lg shadow-discord-blurple/25"
              >
                <span>Login with Discord</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-discord-blurple/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-discord-card border border-white/10 text-xs font-semibold text-zinc-300 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-discord-blurple" />
          <span>Next-Generation Discord Server Management & Visual Studio</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.1]">
          The Ultimate Visual Dashboard for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-discord-blurple via-indigo-300 to-blue-400">
            Discord Communities
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          Manage reaction roles, stage live-previewed embeds, automate dynamic welcome greetings with channel chips, publish rules, and run community giveaways through an intuitive graphical dashboard.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 font-extrabold text-sm transition shadow-xl flex items-center gap-2 group cursor-pointer"
          >
            <Bot className="w-4 h-4 text-discord-blurple" />
            <span>Add to Discord</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-950 transition" />
          </a>

          {sessionUser ? (
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-2xl bg-discord-blurple hover:bg-indigo-600 text-white font-extrabold text-sm transition shadow-xl shadow-discord-blurple/25 flex items-center gap-2 cursor-pointer"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <a
              href="/api/auth/login"
              className="px-6 py-3 rounded-2xl bg-discord-blurple hover:bg-indigo-600 text-white font-extrabold text-sm transition shadow-xl shadow-discord-blurple/25 flex items-center gap-2 cursor-pointer"
            >
              <span>Manage Servers</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Live Interactive Embed Preview in Hero */}
        <div id="preview" className="mt-14 w-full max-w-3xl text-left">
          <div className="p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent shadow-2xl">
            <div className="p-3 sm:p-5 rounded-[22px] bg-[#12131a] border border-white/5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs text-zinc-400">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Discord Message Preview
                </span>
                <span className="font-mono text-[11px] text-discord-blurple">Interactive UI</span>
              </div>

              <DiscordPreview
                botName="Paradox"
                content="Welcome to our community! Make sure to grab your roles below and check our guidelines 🎉"
                title="✨ Unlock Your Roles & Perks"
                description="Choose your notification and gaming roles. Each role grants special channel access and matchmaking pings!\n\n• Visit `{#rules}` for our guidelines\n• Head over to `{#introductions}` to say hi"
                color="#5865F2"
                imageUrl="https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif"
                footerText="Paradox Role Studio • Real-time Sync"
                timestamp={true}
                buttons={[
                  { label: "Gamer", emoji: "🎮", style: "PRIMARY" },
                  { label: "Announcements", emoji: "🔔", style: "SUCCESS" },
                  { label: "Events", emoji: "🏆", style: "SECONDARY" },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-discord-blurple/10 text-discord-blurple text-[11px] font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Complete Bot Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Everything your server needs in one dashboard
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Eliminate complex syntax and manage your Discord bot through an ultra-clean, modern SaaS interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-discord-card border border-white/5 hover:border-white/15 transition-all duration-200 hover:-translate-y-1 space-y-3 group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center`}>
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-discord-blurple transition">
                {feat.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-zinc-400">
            Common questions about setting up and configuring Paradox.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-2"
            >
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-discord-blurple flex-shrink-0" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-[#050608] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-discord-blurple flex items-center justify-center font-bold text-white">
              P
            </div>
            <div>
              <span className="font-extrabold text-white text-sm">PARADOX</span>
              <p className="text-[11px] text-zinc-500">Next-Gen Discord Bot & Management Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href={inviteUrl} target="_blank" rel="noreferrer" className="hover:text-white transition">
              Invite Bot
            </a>
            <Link href="/dashboard" className="hover:text-white transition">
              Dashboard
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover:text-white transition">
              Support Discord
            </a>
          </div>

          <p className="text-[11px]">
            &copy; {new Date().getFullYear()} Paradox. Not affiliated with Discord Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
