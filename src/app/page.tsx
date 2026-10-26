"use client";

import React from "react";
import Link from "next/link";
import {
  Bot,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Smile,
  Layers,
  UserCheck,
  Pin,
  Clock,
  Video,
} from "lucide-react";

export default function HomePage() {
  const BOT_INVITE_URL =
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ||
    "https://discord.com/oauth2/authorize?client_id=1562343989322190938&permissions=268561472&scope=bot+applications.commands";

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 flex flex-col justify-between font-sans selection:bg-[#5865F2] selection:text-white relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-[#5865F2]/20 via-[#5865F2]/5 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-indigo-600/10 blur-[150px] pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img
            src="/pfp.png"
            alt="Paradox Bot"
            className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 shadow-md shadow-[#5865F2]/20"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://cdn.discordapp.com/embed/avatars/0.png";
            }}
          />
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight text-white">PARADOX</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/30 uppercase tracking-wider">
              Bot
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={BOT_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
          >
            <span>Invite Bot</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
          <Link
            href="/api/auth/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-[#5865F2]/25 transition cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Login with Discord</span>
          </Link>
        </div>
      </header>

      {/* Main Center Stage: Logo, Description & OAuth2 Login */}
      <main className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center text-center my-auto z-10">
        {/* Prominent Bot Logo Showcase */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#5865F2] via-sky-500 to-[#EB459E] rounded-3xl opacity-35 blur-xl group-hover:opacity-60 transition duration-500 animate-pulse" />
          <div className="relative p-2 rounded-3xl bg-[#0f1017] border border-white/10 shadow-2xl">
            <img
              src="/pfp.png"
              alt="Paradox Bot Logo"
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover ring-2 ring-white/15 shadow-inner"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://cdn.discordapp.com/embed/avatars/0.png";
              }}
            />
            <span className="absolute bottom-4 right-4 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#0f1017] shadow-lg shadow-emerald-500/50" />
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 mb-6 backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-zinc-200">Online &amp; Operational</span>
          <span className="text-zinc-500">•</span>
          <span className="text-emerald-400 font-bold">Discord OAuth2 Ready</span>
        </div>

        {/* Bot Name */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
          PARADOX{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5865F2] to-sky-400">
            DASHBOARD
          </span>
        </h1>

        {/* Bot Description */}
        <p className="mt-5 text-base sm:text-xl text-zinc-400 max-w-2xl leading-relaxed">
          The ultimate companion dashboard for your Discord bot. Configure unique reaction roles,
          build live rich embeds, personalize newcomer greetings with dynamic member avatar tags, and
          manage your server visually without typing a single slash command.
        </p>

        {/* Primary Action Buttons (OAuth2 Login & Bot Invite) */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/api/auth/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#5865F2] hover:bg-indigo-600 text-white font-extrabold text-base transition shadow-2xl shadow-[#5865F2]/40 flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Bot className="w-5 h-5" />
            <span>Login with Discord (OAuth2)</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <a
            href={BOT_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-base border border-white/10 transition shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Add Bot to Discord</span>
            <ExternalLink className="w-4 h-4 text-zinc-400" />
          </a>
        </div>

        {/* Feature Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl">
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
            <Smile className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>Unique Reaction Roles</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-[#EB459E]" />
            <span>Live Embed Builder</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{"{user.avatar}"} Member PFPs</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
            <Pin className="w-3.5 h-3.5 text-amber-400" />
            <span>Sticky Channel Notices</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Auto Message Scheduler</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span>Social Video Fixes</span>
          </div>
        </div>

        {/* Security Assurance Card */}
        <div className="mt-10 p-4 rounded-2xl bg-zinc-900/40 border border-white/5 max-w-md flex items-center gap-3 text-left">
          <ShieldCheck className="w-7 h-7 text-emerald-400 flex-shrink-0" />
          <div className="text-xs text-zinc-400">
            <span className="font-bold text-white block">Official Discord OAuth2 Protection</span>
            Server settings are restricted to users with Manage Server or Administrator permissions.
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full border-t border-white/5 py-6 px-6 text-xs text-zinc-500 z-10 bg-[#06070a]/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/pfp.png"
              alt="Paradox"
              className="w-5 h-5 rounded-md object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://cdn.discordapp.com/embed/avatars/0.png";
              }}
            />
            <span className="font-bold text-white">PARADOX</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} Discord Bot Dashboard</span>
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
              Discord API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
