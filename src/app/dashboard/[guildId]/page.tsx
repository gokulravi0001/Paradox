"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Smile,
  Layers,
  Video,
  Settings,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
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
    videoFixerProviders: string[];
    videoFixerIgnoredChannels: string[];
    reactionRolesCount: number;
    embedTemplatesCount: number;
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
      <div className="p-8 space-y-6">
        <div className="h-8 bg-discord-card rounded-lg w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-discord-card rounded-2xl animate-pulse" />
          <div className="h-32 bg-discord-card rounded-2xl animate-pulse" />
          <div className="h-32 bg-discord-card rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span>{data.guild.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-discord-muted mt-1">
            Server ID: <code className="font-mono text-slate-300">{data.guild.id}</code>
          </p>
        </div>

        <div>
          <a
            href={data.guild.inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-discord-card hover:bg-discord-card/80 border border-white/10 text-white font-medium text-xs sm:text-sm transition shadow-sm"
          >
            <span>Re-invite / Sync Bot</span>
            <ExternalLink className="w-4 h-4 text-discord-muted" />
          </a>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Reaction Roles Card */}
        <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-discord-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Reaction Roles</span>
            <Smile className="w-5 h-5 text-discord-blurple" />
          </div>
          <p className="text-3xl font-extrabold text-white">{data.config.reactionRolesCount}</p>
          <p className="text-xs text-discord-muted">Active emoji-to-role mappings</p>
        </div>

        {/* Embed Templates Card */}
        <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-discord-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Embed Templates</span>
            <Layers className="w-5 h-5 text-discord-fuchsia" />
          </div>
          <p className="text-3xl font-extrabold text-white">{data.config.embedTemplatesCount}</p>
          <p className="text-xs text-discord-muted">Saved rich Discord embed templates</p>
        </div>

        {/* Video Fixer Status Card */}
        <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-discord-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Link-to-Video Embeds</span>
            <Video className="w-5 h-5 text-discord-green" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                data.config.videoFixerEnabled ? "bg-emerald-400" : "bg-zinc-500"
              }`}
            />
            <p className="text-2xl font-extrabold text-white">
              {data.config.videoFixerEnabled ? "Active" : "Disabled"}
            </p>
          </div>
          <p className="text-xs text-discord-muted">
            {data.config.videoFixerProviders.length} active provider(s)
          </p>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Configuration Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Reaction Roles Quick Link */}
          <Link
            href={`/dashboard/${guildId}/reaction-roles`}
            className="p-6 rounded-2xl bg-discord-card/70 border border-white/5 hover:border-discord-blurple/50 hover:bg-discord-card transition flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-discord-blurple/10 border border-discord-blurple/20 flex items-center justify-center text-discord-blurple group-hover:scale-105 transition">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Reaction Roles</h3>
              <p className="text-xs text-discord-muted leading-relaxed">
                Configure messages where members can react to claim roles automatically, complete with role hierarchy
                protection.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-discord-blurple group-hover:underline">
              <span>Manage Reaction Roles</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Embed Builder Quick Link */}
          <Link
            href={`/dashboard/${guildId}/embeds`}
            className="p-6 rounded-2xl bg-discord-card/70 border border-white/5 hover:border-discord-fuchsia/50 hover:bg-discord-card transition flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-discord-fuchsia/10 border border-discord-fuchsia/20 flex items-center justify-center text-discord-fuchsia group-hover:scale-105 transition">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Embed Builder</h3>
              <p className="text-xs text-discord-muted leading-relaxed">
                Design custom rich messages with title, description, color, images, author, and publish instantly to any
                server channel.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-discord-fuchsia group-hover:underline">
              <span>Open Embed Builder</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Video Fixer Quick Link */}
          <Link
            href={`/dashboard/${guildId}/video-fixer`}
            className="p-6 rounded-2xl bg-discord-card/70 border border-white/5 hover:border-discord-green/50 hover:bg-discord-card transition flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-discord-green/10 border border-discord-green/20 flex items-center justify-center text-discord-green group-hover:scale-105 transition">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Link-to-Video Embeds</h3>
              <p className="text-xs text-discord-muted leading-relaxed">
                Transform links from X/Twitter, TikTok, Instagram, and Reddit into playable inline previews, with per-channel ignore lists.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-discord-green group-hover:underline">
              <span>Configure Video Fixer</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Permissions & Security Summary */}
      <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Discord Bot Permission Requirements & Role Hierarchy</span>
        </div>
        <p className="text-xs text-discord-muted leading-relaxed">
          For reaction roles to operate successfully, ensure the Paradox bot role in your Discord Server Settings has
          the <strong className="text-white">Manage Roles</strong> permission. Additionally, Discord enforces role hierarchy:
          the bot can only assign roles that are positioned <strong className="text-white">below</strong> the bot&apos;s highest role
          in the role hierarchy list.
        </p>
      </div>
    </div>
  );
}
