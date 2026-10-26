"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Smile,
  UserCheck,
  UserX,
  Pin,
  Clock,
  Radio,
  Video,
  ChevronDown,
  CheckCircle2,
  Bot,
  Zap,
  Lock,
  Flame,
  Globe,
  Sliders,
  Users,
  Hash,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "embeds" | "welcome" | "sticky">("roles");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const BOT_INVITE_URL =
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ||
    "https://discord.com/oauth2/authorize?client_id=1562343989322190938&permissions=268561472&scope=bot+applications.commands";

  const faqs = [
    {
      q: "What permissions does Paradox require in my server?",
      a: "Paradox only requests essential permissions like Manage Roles, Send Messages, and Embed Links. It respects Discord's strict role hierarchy and will never attempt to assign roles positioned higher than its own bot role.",
    },
    {
      q: "Does Paradox support unique (single-choice) reaction roles?",
      a: "Yes! Paradox supports Unique mode (selecting a new role automatically revokes the previous selection), Multi-role mode, and One-time claim modes with full support for button and dropdown decks.",
    },
    {
      q: "Can I show member profile pictures (PFP) in welcome and goodbye cards?",
      a: "Absolutely! Paradox features 1-click dynamic tags like {user.avatar} and {user.name} that resolve to the joining or departing member's high-resolution Discord avatar and username in real time.",
    },
    {
      q: "How does the Live Embed Builder work?",
      a: "Our visual Embed Builder updates pixel-for-pixel in real-time as you type, complete with author headers, markdown parsing, custom HEX colors, fields, timestamps, and destination channel targeting.",
    },
    {
      q: "Is the dashboard secure for server administrators?",
      a: "Yes. All configuration actions are strictly authenticated via Discord OAuth2 and verified server-side against Discord's Manage Server or Administrator permissions. Bot tokens and sensitive credentials never touch the browser.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans selection:bg-[#5865F2] selection:text-white">
      {/* Top Ambient Glow Accent */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#5865F2]/10 via-[#5865F2]/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0c]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/pfp.png"
                alt="Paradox Bot"
                className="w-11 h-11 rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-[#5865F2]/50 transition shadow-lg shadow-[#5865F2]/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://cdn.discordapp.com/embed/avatars/0.png";
                }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0a0a0c]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white group-hover:text-white transition">
                  PARADOX
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/30">
                  Dashboard
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Discord Server Management</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-400">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#showcase" className="hover:text-white transition">
              Live Showcase
            </a>
            <a href="#faq" className="hover:text-white transition">
              FAQ
            </a>
            <a
              href="https://discord.com/developers/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition flex items-center gap-1"
            >
              API Docs <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <a
              href={BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition cursor-pointer"
            >
              <span>Add to Server</span>
            </a>
            <Link
              href="/api/auth/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-[#5865F2]/25 transition cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Login with Discord</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-8 backdrop-blur-md shadow-inner">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5865F2] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5865F2]"></span>
          </span>
          <span className="text-zinc-200 font-semibold">Paradox Bot Dashboard 2.0</span>
          <span className="text-zinc-500">•</span>
          <span className="text-[#5865F2] font-semibold">Live in Production</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.1]">
          The Professional Dashboard for Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5865F2] via-sky-400 to-[#EB459E]">
            Discord Community.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-zinc-400 max-w-3xl leading-relaxed">
          Configure reaction roles, build pixel-accurate embeds with live simulator previews, personalize
          welcome greetings with newcomer PFP avatars, and manage scheduled messages effortlessly through
          an ultra-sleek dark interface.
        </p>

        {/* Primary Hero CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/api/auth/login"
            className="px-8 py-4 rounded-2xl bg-[#5865F2] hover:bg-indigo-600 text-white font-extrabold text-sm sm:text-base transition shadow-2xl shadow-[#5865F2]/40 flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Open Server Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href={BOT_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-sm sm:text-base border border-white/10 transition shadow-xl flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Bot className="w-5 h-5 text-[#5865F2]" />
            <span>Invite Paradox Bot</span>
          </a>
        </div>

        {/* Trust & Highlights Bar */}
        <div className="mt-14 pt-10 border-t border-white/5 w-full grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl text-center">
          <div className="space-y-1">
            <div className="text-2xl font-black text-white">100%</div>
            <div className="text-xs text-zinc-400">OAuth2 Verified Security</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-emerald-400">0 ms</div>
            <div className="text-xs text-zinc-400">Live Simulator Delay</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-indigo-400">1-Click</div>
            <div className="text-xs text-zinc-400">{"{user.avatar}"} PFP Tags</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-[#EB459E]">15+</div>
            <div className="text-xs text-zinc-400">Server Modules</div>
          </div>
        </div>
      </section>

      {/* Live Interactive Showcase Section */}
      <section id="showcase" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            See Exactly What Paradox Delivers
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Switch between modules to preview the exact visual output rendered directly inside Discord channels.
          </p>
        </div>

        {/* Showcase Switcher Tabs */}
        <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-zinc-900/80 border border-white/5 max-w-2xl mx-auto mb-8 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setActiveTab("roles")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "roles"
                ? "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Reaction Roles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("embeds")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "embeds"
                ? "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Embed Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("welcome")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "welcome"
                ? "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Member Onboarding</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sticky")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "sticky"
                ? "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Sticky Notices</span>
          </button>
        </div>

        {/* Simulator Card Box */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-zinc-900/60 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
          {/* Discord Message Shell */}
          <div className="rounded-2xl bg-[#313338] p-5 text-zinc-200 font-sans shadow-inner border border-white/5 space-y-4">
            {/* Bot Header */}
            <div className="flex items-start gap-3.5">
              <img
                src="/pfp.png"
                alt="Paradox"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-zinc-800 ring-1 ring-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://cdn.discordapp.com/embed/avatars/0.png";
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm">Paradox</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#5865F2] text-white uppercase tracking-wider">
                    APP
                  </span>
                  <span className="text-[11px] text-[#949ba4]">Today at 12:00 PM</span>
                </div>

                {/* Tab 1: Reaction Roles Preview */}
                {activeTab === "roles" && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-zinc-300">
                      Choose your vanity notification roles below to stay updated with server updates!
                    </p>
                    <div className="rounded-xl border-l-4 border-[#5865F2] bg-[#2b2d31] p-4 space-y-2">
                      <div className="font-bold text-white text-sm">🎭 Server Notification Roles</div>
                      <p className="text-xs text-zinc-300">
                        Click a button to claim or switch roles. Configured in <strong>Unique Choice</strong> mode.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <span>📢 Announcements</span>
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-[#5865F2] text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>🎁 Giveaways</span>
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <span>🎮 Game Night</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Embed Builder Preview */}
                {activeTab === "embeds" && (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl border-l-4 border-[#EB459E] bg-[#2b2d31] p-4 space-y-3 overflow-hidden">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                        <img
                          src="/pfp.png"
                          alt=""
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>Paradox Community • Official</span>
                      </div>
                      <div className="font-bold text-white text-base">
                        🚀 Version 2.0 Web Dashboard Released!
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        We have completely overhauled the web configuration interface. Administrators can
                        now manage 15+ modules with real-time limit checks and dynamic tag insertion.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold text-zinc-300">Channel Destination</div>
                          <div className="text-xs text-sky-400 font-mono">#announcements</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold text-zinc-300">Deployment Status</div>
                          <div className="text-xs text-emerald-400 font-semibold">Active &amp; Published</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-400 pt-1">
                        Paradox Bot • Today at 12:00 PM
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Member Onboarding Preview */}
                {activeTab === "welcome" && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-zinc-300">
                      Welcome to <span className="font-bold text-white">Paradox Community</span>,{" "}
                      <span className="text-sky-400 font-mono">@Alex</span>! 🎉 We now have{" "}
                      <strong>1,248</strong> members.
                    </p>
                    <div className="rounded-xl border-l-4 border-emerald-500 bg-[#2b2d31] p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        <img
                          src="https://cdn.discordapp.com/embed/avatars/1.png"
                          alt="Alex Avatar"
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500/50"
                        />
                        <span>Alex joined the server!</span>
                      </div>
                      <img
                        src="https://cdn.discordapp.com/embed/avatars/1.png"
                        alt="Member Avatar Preview"
                        className="w-16 h-16 rounded-xl object-cover float-right ml-3 mb-2 ring-1 ring-white/10"
                      />
                      <div className="text-xs text-zinc-300 leading-relaxed">
                        Glad to have you aboard! Make sure to:
                        <br />• Check out guidelines in{" "}
                        <span className="text-sky-400 font-mono">#rules</span>
                        <br />• Pick your roles in{" "}
                        <span className="text-sky-400 font-mono">#roles</span>
                        <br />• Say hi in{" "}
                        <span className="text-sky-400 font-mono">#general</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 pt-2 clear-both">
                        Auto-assigned role: <span className="text-emerald-400">@Member</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Sticky Notices Preview */}
                {activeTab === "sticky" && (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <Pin className="w-3.5 h-3.5" />
                        <span>Sticky Channel Notice</span>
                      </div>
                      <p className="text-xs text-zinc-200 leading-relaxed">
                        📌 Please keep all discussion relevant to development and bug reports. Off-topic chat belongs
                        in <span className="text-sky-400 font-mono">#off-topic</span>.
                      </p>
                      <div className="text-[10px] text-zinc-400">
                        Automatically stays at the bottom of the channel as members chat.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Built for Modern Communities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Comprehensive Management Features
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
            Everything your administrators need to organize, welcome, and engage server members with minimal effort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-7 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-[#5865F2]/40 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center text-[#5865F2] group-hover:scale-110 transition">
              <Smile className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Advanced Reaction Roles</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Configure button panels and dropdown decks. Supports Unique mode (auto-revoking previous selections),
              multi-role claiming, custom server emojis, and role hierarchy safety.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-[#EB459E]/40 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-[#EB459E]/10 border border-[#EB459E]/20 flex items-center justify-center text-[#EB459E] group-hover:scale-110 transition">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Visual Embed Builder</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Design stunning Discord embeds with live Discord markdown preview. Supports author details, inline fields,
              custom HEX colors, banners, and editing existing bot embeds by message ID.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-emerald-500/40 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Member PFP Onboarding</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dynamically showcase newcomers&apos; Discord profile picture and username in welcome embeds with 1-click{" "}
              <code className="text-emerald-400 font-mono">{"{user.avatar}"}</code> tags, auto-assign roles, and send DMs.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/40 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <Pin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Sticky Channel Notices</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Keep critical rules or reminders pinned at the very bottom of active channels. Paradox automatically reposts
              the sticky notice as new conversation messages flow in.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-7 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-sky-500/40 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Automated Message Scheduler</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Broadcast recurring reminders, community guidelines, or social links on customizable hourly, daily, or
              weekly intervals across designated text channels.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-7 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-indigo-500/40 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Social Video Link Fixer</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instantly converts broken Twitter/X, Instagram, TikTok, and Reddit links into inline playable video embeds
              using zero proxy storage for complete server privacy.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-white/5 w-full">
        <div className="text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-zinc-400">Everything you need to know about setting up and using Paradox.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-zinc-900/60 border border-white/5 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition"
                >
                  <span className="text-sm font-bold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? "rotate-180 text-[#5865F2]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-zinc-300 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-950/60 via-zinc-900 to-zinc-950 border border-[#5865F2]/30 p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#5865F2]/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight relative">
            Ready to Elevate Your Discord Server?
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto relative leading-relaxed">
            Join administrators managing their communities with Paradox. Setup takes less than 60 seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 relative">
            <Link
              href="/api/auth/login"
              className="px-8 py-3.5 rounded-xl bg-[#5865F2] hover:bg-indigo-600 text-white font-bold text-sm transition shadow-xl shadow-[#5865F2]/30 flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Sign In with Discord</span>
            </Link>
            <a
              href={BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm border border-white/10 transition flex items-center gap-2 cursor-pointer"
            >
              <span>Add to Discord</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-[#08080a] py-12 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/pfp.png"
              alt="Paradox"
              className="w-7 h-7 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://cdn.discordapp.com/embed/avatars/0.png";
              }}
            />
            <span className="font-extrabold text-sm text-white">PARADOX</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} Paradox Bot. All rights reserved.</span>
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
            <a
              href="https://github.com/gokulravi0001/Paradox"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
