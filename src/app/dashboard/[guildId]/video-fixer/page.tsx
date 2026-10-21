"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Video,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  Info,
  ExternalLink,
  Slash,
} from "lucide-react";
import { SUPPORTED_PROVIDERS, VideoProviderId } from "@/bot/services/videoTransformer";

interface Channel {
  id: string;
  name: string;
}

export default function VideoFixerConfigPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);

  // Settings State
  const [enabled, setEnabled] = useState(true);
  const [activeProviders, setActiveProviders] = useState<VideoProviderId[]>([
    "twitter",
    "tiktok",
    "instagram",
    "reddit",
  ]);
  const [ignoredChannels, setIgnoredChannels] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [channelsRes, settingsRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/settings`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
        }

        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          setEnabled(sData.videoFixerEnabled ?? true);
          setActiveProviders(sData.videoFixerProviders || ["twitter", "tiktok", "instagram", "reddit"]);
          setIgnoredChannels(sData.videoFixerIgnoredChannels || []);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load video settings.");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) {
      loadData();
    }
  }, [guildId]);

  function toggleProvider(providerId: VideoProviderId) {
    if (activeProviders.includes(providerId)) {
      setActiveProviders(activeProviders.filter((p) => p !== providerId));
    } else {
      setActiveProviders([...activeProviders, providerId]);
    }
  }

  function toggleIgnoredChannel(channelId: string) {
    if (ignoredChannels.includes(channelId)) {
      setIgnoredChannels(ignoredChannels.filter((c) => c !== channelId));
    } else {
      setIgnoredChannels([...ignoredChannels, channelId]);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/guilds/${guildId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoFixerEnabled: enabled,
          videoFixerProviders: activeProviders,
          videoFixerIgnoredChannels: ignoredChannels,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update video fixer settings.");
      }

      setSuccess("Link-to-video embed settings updated successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 flex justify-center py-20 text-discord-muted">
        <Loader2 className="w-8 h-8 animate-spin text-discord-green" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <Video className="w-8 h-8 text-discord-green" />
          <span>Link-to-Video Embeds</span>
        </h1>
        <p className="text-sm text-discord-muted mt-1">
          Convert links from social media platforms into native inline playable video embeds, without downloading or
          storing media.
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

      {/* Zero Proxy Policy Banner */}
      <div className="p-4 rounded-xl bg-discord-card border border-white/5 flex items-start gap-3 text-xs text-discord-muted">
        <ShieldCheck className="w-5 h-5 text-discord-green flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Direct URL Rewrite Architecture: </span>
          Paradox never downloads, rehosts, or proxies user media content on our servers. Links are transformed into
          standardized embed-friendly URLs (e.g. <code>fxtwitter.com</code>, <code>tiktxk.com</code>) so Discord can embed
          native video players securely.
        </div>
      </div>

      {/* Master Enable Card */}
      <div className="p-6 rounded-2xl bg-discord-card border border-white/5 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">Enable Video Link Fixer</h2>
          <p className="text-xs text-discord-muted">
            Automatically transform supported video links posted in non-ignored channels.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-discord-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-discord-green" />
        </label>
      </div>

      {/* Supported Providers Configuration */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Supported Video Providers</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(SUPPORTED_PROVIDERS) as VideoProviderId[]).map((pid) => {
            const provider = SUPPORTED_PROVIDERS[pid];
            const isChecked = activeProviders.includes(pid);

            return (
              <div
                key={pid}
                className={`p-6 rounded-2xl bg-discord-card border transition flex flex-col justify-between space-y-4 ${
                  isChecked ? "border-white/10" : "border-white/5 opacity-60"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">{provider.name}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!enabled}
                        onChange={() => toggleProvider(pid)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-discord-dark rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-discord-green" />
                    </label>
                  </div>

                  <p className="text-xs text-discord-muted">{provider.description}</p>

                  <div className="text-[11px] font-mono text-discord-green bg-discord-dark px-2.5 py-1 rounded-md inline-block">
                    Target Domain: {provider.targetDomain}
                  </div>

                  {/* Provider Limitations Box */}
                  <div className="p-3 rounded-xl bg-discord-dark border border-white/5 space-y-1.5 text-[11px]">
                    <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-discord-yellow" /> Provider Limitations:
                    </div>
                    <ul className="list-disc pl-4 text-discord-muted space-y-0.5">
                      {provider.limitations.map((limit, idx) => (
                        <li key={idx}>{limit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ignored Channels Section */}
      <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Ignored Channels</h2>
          <p className="text-xs text-discord-muted mt-1">
            The bot will ignore video links posted in these channels (e.g. serious discussions, bot command channels).
          </p>
        </div>

        {channels.length === 0 ? (
          <p className="text-xs text-discord-muted">No text channels detected.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2">
            {channels.map((c) => {
              const isIgnored = ignoredChannels.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleIgnoredChannel(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition flex items-center justify-between ${
                    isIgnored
                      ? "bg-discord-red/10 border-discord-red/40 text-discord-red"
                      : "bg-discord-dark border-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span className="truncate">#{c.name}</span>
                  {isIgnored && <Slash className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-discord-green hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-discord-green/20"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
