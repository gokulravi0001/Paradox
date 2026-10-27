"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Smile,
  Palette,
  Film,
  Settings,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  UserCheck,
  UserX,
  Scroll,
  Megaphone,
  Calendar,
  Gift,
  Clock,
  Pin,
  Bot,
  Plus,
  History,
  Activity,
  AlertTriangle,
} from "lucide-react";

interface GuildDetails {
  guild: {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    botInstalled: boolean;
    inviteUrl: string;
  };
  config: {
    prefix: string;
    videoFixerEnabled: boolean;
    welcomeEnabled: boolean;
    goodbyeEnabled: boolean;
    reactionRolesCount: number;
    embedTemplatesCount: number;
    rulesCount: number;
    announcementsCount: number;
    eventsCount: number;
    giveawaysCount: number;
    autoMessagesCount: number;
    stickyMessagesCount: number;
    auditLogsCount: number;
  };
}

export default function GuildOverviewPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [data, setData] = useState<GuildDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/guilds/${guildId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [guildId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-discord-card rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-discord-card rounded-2xl animate-pulse" />
          <div className="h-28 bg-discord-card rounded-2xl animate-pulse" />
          <div className="h-28 bg-discord-card rounded-2xl animate-pulse" />
          <div className="h-28 bg-discord-card rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const quickActions = [
    { label: "Visual Embed", href: `/dashboard/${guildId}/embeds`, icon: Palette, color: "text-discord-blurple" },
    { label: "Reaction Role", href: `/dashboard/${guildId}/reaction-roles`, icon: Smile, color: "text-amber-400" },
    { label: "Announcement", href: `/dashboard/${guildId}/announcements`, icon: Megaphone, color: "text-emerald-400" },
    { label: "Giveaway", href: `/dashboard/${guildId}/giveaways`, icon: Gift, color: "text-pink-400" },
    { label: "Schedule Event", href: `/dashboard/${guildId}/events`, icon: Calendar, color: "text-cyan-400" },
    { label: "Setup Welcome", href: `/dashboard/${guildId}/welcome`, icon: UserCheck, color: "text-indigo-400" },
  ];

  const modules = [
    {
      title: "Reaction Roles",
      desc: "Interactive button menus & visual role decks",
      href: `/dashboard/${guildId}/reaction-roles`,
      count: `${data.config.reactionRolesCount} Active Mappings`,
      icon: Smile,
      status: data.config.reactionRolesCount > 0 ? "Configured" : "Not Setup",
      color: "border-indigo-500/30",
    },
    {
      title: "Visual Embeds",
      desc: "Rich Discord messages, author icons, and templates",
      href: `/dashboard/${guildId}/embeds`,
      count: `${data.config.embedTemplatesCount} Saved Templates`,
      icon: Palette,
      status: data.config.embedTemplatesCount > 0 ? "Active" : "Ready",
      color: "border-purple-500/30",
    },
    {
      title: "Welcome System",
      desc: "Automated onboarding greetings with channel chips",
      href: `/dashboard/${guildId}/welcome`,
      count: data.config.welcomeEnabled ? "Active Onboarding" : "Disabled",
      icon: UserCheck,
      status: data.config.welcomeEnabled ? "Active" : "Disabled",
      color: data.config.welcomeEnabled ? "border-emerald-500/30" : "border-white/5",
    },
    {
      title: "Goodbye System",
      desc: "Departing member notices & member count logs",
      href: `/dashboard/${guildId}/goodbye`,
      count: data.config.goodbyeEnabled ? "Active Departure Notice" : "Disabled",
      icon: UserX,
      status: data.config.goodbyeEnabled ? "Active" : "Disabled",
      color: data.config.goodbyeEnabled ? "border-rose-500/30" : "border-white/5",
    },
    {
      title: "Server Rules",
      desc: "Structured community guidelines published to Discord",
      href: `/dashboard/${guildId}/rules`,
      count: `${data.config.rulesCount} Rules Defined`,
      icon: Scroll,
      status: data.config.rulesCount > 0 ? "Published" : "Draft",
      color: "border-amber-500/30",
    },
    {
      title: "Broadcast Announcements",
      desc: "Channel broadcasts with role and audience pings",
      href: `/dashboard/${guildId}/announcements`,
      count: `${data.config.announcementsCount} Sent Broadcasts`,
      icon: Megaphone,
      status: "Ready",
      color: "border-blue-500/30",
    },
    {
      title: "Scheduled Events",
      desc: "Voice channel hangouts, gaming, and calendar alerts",
      href: `/dashboard/${guildId}/events`,
      count: `${data.config.eventsCount} Events Scheduled`,
      icon: Calendar,
      status: "Active",
      color: "border-cyan-500/30",
    },
    {
      title: "Giveaways",
      desc: "Automated reward countdowns and button entries",
      href: `/dashboard/${guildId}/giveaways`,
      count: `${data.config.giveawaysCount} Giveaways`,
      icon: Gift,
      status: "Active",
      color: "border-pink-500/30",
    },
    {
      title: "Video Embed Fixer",
      desc: "Twitter/X, TikTok, Instagram & Reddit video playback",
      href: `/dashboard/${guildId}/video-embeds`,
      count: data.config.videoFixerEnabled ? "All Platforms Enabled" : "Disabled",
      icon: Film,
      status: data.config.videoFixerEnabled ? "Active" : "Disabled",
      color: "border-discord-blurple/30",
    },
    {
      title: "Automated Messages",
      desc: "Repeating recurring notices & scheduled reminders",
      href: `/dashboard/${guildId}/auto-messages`,
      count: `${data.config.autoMessagesCount} Active Schedules`,
      icon: Clock,
      status: data.config.autoMessagesCount > 0 ? "Running" : "Idle",
      color: "border-emerald-500/30",
    },
    {
      title: "Sticky Messages",
      desc: "Pinned messages auto-reposted at the bottom of channels",
      href: `/dashboard/${guildId}/sticky-messages`,
      count: `${data.config.stickyMessagesCount} Pinned Channels`,
      icon: Pin,
      status: data.config.stickyMessagesCount > 0 ? "Active" : "Idle",
      color: "border-amber-500/30",
    },
    {
      title: "Audit Logs",
      desc: "Complete administrative trail of dashboard actions",
      href: `/dashboard/${guildId}/logs`,
      count: `${data.config.auditLogsCount} Recorded Actions`,
      icon: History,
      status: "Logged",
      color: "border-zinc-700/30",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Hero Server Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#12141c] via-[#0d0e14] to-[#1a1226] border border-white/10 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-discord-blurple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {data.guild.icon ? (
              <img
                src={data.guild.icon}
                alt=""
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/10 object-cover shadow-xl flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-discord-blurple to-indigo-800 flex items-center justify-center font-black text-2xl text-white shadow-xl flex-shrink-0">
                {data.guild.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {data.guild.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Bot Connected
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Server ID: {data.guild.id} • Prefix: <span className="text-white font-bold">{data.config.prefix}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={data.guild.inviteUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition flex items-center gap-1.5"
            >
              <span>Sync Bot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href={`/dashboard/${guildId}/settings`}
              className="px-4 py-2 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-discord-blurple/20"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Server Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Studio Builders: Reaction Roles & Embed Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reaction Roles Studio Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#181a24] to-[#12141c] border border-indigo-500/20 hover:border-indigo-500/40 transition shadow-xl space-y-4 relative overflow-hidden group">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Smile className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Reaction Roles Studio</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    5-Step Wizard
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Build auto-swapping roles, interactive buttons, and dropdown menus.
                </p>
              </div>
            </div>

            <Link
              href={`/dashboard/${guildId}/reaction-roles`}
              className="px-4 py-2 rounded-xl bg-discord-blurple hover:bg-discord-blurple/90 text-white font-bold text-xs shadow-md shadow-discord-blurple/25 transition flex items-center gap-1.5 flex-shrink-0"
            >
              <span>Open Studio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-discord-dark border border-white/5 text-zinc-300 flex items-center gap-1">
              📍 Step 1: Channel
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-discord-dark border border-white/5 text-zinc-300 flex items-center gap-1">
              🔘 Step 2: Buttons / Menus
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-discord-dark border border-white/5 text-zinc-300 flex items-center gap-1">
              👑 Step 3: Unique / Multi-Choice
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-discord-dark border border-white/5 text-zinc-300 flex items-center gap-1">
              🎭 Max 25 Roles
            </span>
          </div>
        </div>

        {/* Visual Embeds Studio Card with Embed Type Launchers */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1e172a] to-[#12141c] border border-purple-500/20 hover:border-purple-500/40 transition shadow-xl space-y-4 relative overflow-hidden group">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Visual Embeds Studio</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Live Simulator
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Craft rich Discord embeds with avatar/server PFP bars and tag tools.
                </p>
              </div>
            </div>

            <Link
              href={`/dashboard/${guildId}/embeds`}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition flex items-center gap-1.5 flex-shrink-0"
            >
              <span>Open Studio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Direct Embed Type Options */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Launch With Tailored Embed Type:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "👋 Welcome", type: "welcome", color: "hover:border-indigo-500/50 hover:text-indigo-300" },
                { label: "👋 Goodbye", type: "goodbye", color: "hover:border-rose-500/50 hover:text-rose-300" },
                { label: "📢 Announcement", type: "announcement", color: "hover:border-amber-500/50 hover:text-amber-300" },
                { label: "📜 Rules", type: "rules", color: "hover:border-emerald-500/50 hover:text-emerald-300" },
                { label: "📅 Event", type: "event", color: "hover:border-cyan-500/50 hover:text-cyan-300" },
                { label: "🎁 Giveaway", type: "giveaway", color: "hover:border-pink-500/50 hover:text-pink-300" },
                { label: "🛡️ Verify / Roles", type: "verify", color: "hover:border-purple-500/50 hover:text-purple-300" },
              ].map((opt) => (
                <Link
                  key={opt.type}
                  href={`/dashboard/${guildId}/embeds?type=${opt.type}`}
                  className={`text-xs px-2.5 py-1 rounded-lg bg-discord-dark border border-white/10 text-zinc-300 transition ${opt.color}`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Quick Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((qa) => (
            <Link
              key={qa.label}
              href={qa.href}
              className="p-3.5 rounded-2xl bg-discord-card border border-white/5 hover:border-discord-blurple/40 hover:bg-discord-dark transition flex items-center gap-2.5 group"
            >
              <qa.icon className={`w-4 h-4 ${qa.color} group-hover:scale-110 transition flex-shrink-0`} />
              <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                {qa.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Modules Dashboard Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Available Bot Modules & Capabilities
          </span>
          <span className="text-xs font-semibold text-discord-blurple">
            12 of 12 Online
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className="p-5 rounded-2xl bg-discord-card border border-white/5 hover:border-white/15 hover:bg-discord-dark/70 transition space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-discord-dark border border-white/5 group-hover:border-discord-blurple/30 transition">
                    <m.icon className="w-5 h-5 text-discord-blurple group-hover:text-white transition" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-discord-blurple transition">
                      {m.title}
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {m.count}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition" />
              </div>

              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {m.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
