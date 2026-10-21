"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Settings,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Bot,
  RotateCcw,
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
  };
}

export default function ServerSettingsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guild, setGuild] = useState<GuildDetails["guild"] | null>(null);
  const [prefix, setPrefix] = useState("!");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/guilds/${guildId}`);
        if (res.ok) {
          const data: GuildDetails = await res.json();
          setGuild(data.guild);
          setPrefix(data.config.prefix || "!");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [guildId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/guilds/${guildId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update server settings");
      }

      setSuccess("Server settings saved successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 flex justify-center py-20 text-discord-muted">
        <Loader2 className="w-8 h-8 animate-spin text-discord-blurple" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-discord-muted" />
          <span>General Server Settings</span>
        </h1>
        <p className="text-sm text-discord-muted mt-1">
          Manage general bot configuration and permission parameters for this Discord server.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl border border-discord-red/40 bg-discord-red/10 text-discord-red flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Prefix Form */}
      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Command Prefix
          </label>
          <div className="max-w-xs">
            <input
              type="text"
              maxLength={5}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-discord-blurple"
            />
          </div>
          <p className="text-xs text-discord-muted">
            The character prefix used for text commands in this server (e.g. <code>!</code>, <code>?</code>).
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold text-sm transition flex items-center gap-2 shadow-md shadow-discord-blurple/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Bot Permission & Health Information */}
      <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <ShieldCheck className="w-5 h-5 text-discord-blurple" />
          <span>Bot Installation & Permissions</span>
        </div>

        <p className="text-xs text-discord-muted leading-relaxed">
          The bot requires permissions to assign roles, read channel message history, and send rich embeds. If the bot
          is experiencing permission errors, you can re-authorize it using the invite link below:
        </p>

        {guild?.inviteUrl && (
          <div className="pt-2">
            <a
              href={guild.inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-discord-dark hover:bg-white/5 border border-white/10 text-white font-medium text-xs transition"
            >
              <span>Re-Authorize Bot Permissions</span>
              <ExternalLink className="w-4 h-4 text-discord-muted" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
