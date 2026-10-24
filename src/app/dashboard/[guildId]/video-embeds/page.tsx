"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Film,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  Sparkles,
  Shield,
  Layers,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

interface Platform {
  id: string;
  name: string;
  domain: string;
  color: string;
  icon: string;
}

const SUPPORTED_PLATFORMS: Platform[] = [
  { id: "twitter", name: "X / Twitter", domain: "twitter.com, x.com", color: "#1DA1F2", icon: "🐦" },
  { id: "tiktok", name: "TikTok", domain: "tiktok.com", color: "#FE2C55", icon: "🎵" },
  { id: "instagram", name: "Instagram Reels", domain: "instagram.com", color: "#E1306C", icon: "📸" },
  { id: "reddit", name: "Reddit Videos", domain: "reddit.com", color: "#FF4500", icon: "🤖" },
  { id: "bluesky", name: "Bluesky", domain: "bsky.app", color: "#0085FF", icon: "🦋" },
  { id: "threads", name: "Threads", domain: "threads.net", color: "#FFFFFF", icon: "🧵" },
  { id: "youtube", name: "YouTube Shorts", domain: "youtube.com, youtu.be", color: "#FF0000", icon: "▶️" },
];

export default function VideoEmbedsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Settings
  const [enabled, setEnabled] = useState(true);
  const [activeProviders, setActiveProviders] = useState<string[]>([
    "twitter",
    "tiktok",
    "instagram",
    "reddit",
    "bluesky",
    "threads",
    "youtube",
  ]);
  const [ignoredChannels, setIgnoredChannels] = useState<string[]>([]);
  const [deleteButton, setDeleteButton] = useState(true);

  function addToast(type: ToastMessage["type"], message: string, title?: string) {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
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
          if (sData.videoFixerProviders) {
            setActiveProviders(sData.videoFixerProviders);
          }
          if (sData.videoFixerIgnoredChannels) {
            setIgnoredChannels(sData.videoFixerIgnoredChannels);
          }
          setDeleteButton(sData.videoFixerDeleteButton ?? true);
        }
      } catch {
        addToast("error", "Failed to load video embed settings");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) init();
  }, [guildId]);

  function toggleProvider(id: string) {
    if (activeProviders.includes(id)) {
      setActiveProviders(activeProviders.filter((p) => p !== id));
    } else {
      setActiveProviders([...activeProviders, id]);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const res = await fetch(`/api/guilds/${guildId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoFixerEnabled: enabled,
          videoFixerProviders: activeProviders,
          videoFixerIgnoredChannels: ignoredChannels,
          videoFixerDeleteButton: deleteButton,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      addToast("success", "Video embed configuration saved successfully!", "Saved");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error saving configuration");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-discord-blurple animate-spin" />
        <p className="text-xs text-zinc-400">Loading video embed configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-discord-blurple/10 border border-discord-blurple/20 text-discord-blurple text-[11px] font-bold mb-2">
            <Film className="w-3.5 h-3.5" />
            <span>Native Media Embedder</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Video Link Embed Configuration
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Automatically transform broken video links from Twitter/X, TikTok, Instagram, and Reddit into playable in-Discord video players.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-discord-blurple/20 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Configuration</span>
        </button>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Main Enable Toggle */}
        <div className="p-5 rounded-2xl bg-discord-card border border-white/5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <span>Automatic Video Link Embedding</span>
              {enabled && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              )}
            </span>
            <p className="text-xs text-zinc-400">
              When members share video links, Paradox automatically embeds full playable videos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((prev) => !prev)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
              enabled ? "bg-discord-blurple" : "bg-zinc-700"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Supported Platforms Grid */}
        <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Supported Video Platforms</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Choose which social media links should automatically generate playable video embeds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUPPORTED_PLATFORMS.map((platform) => {
              const isActive = activeProviders.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => toggleProvider(platform.id)}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                    isActive
                      ? "bg-discord-dark border-discord-blurple/50 shadow-sm"
                      : "bg-discord-dark/50 border-white/5 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{platform.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{platform.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{platform.domain}</div>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                      isActive
                        ? "bg-discord-blurple border-discord-blurple text-white"
                        : "border-white/20 bg-transparent"
                    }`}
                  >
                    {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Author Dismiss / Delete Button Toggle */}
        <div className="p-5 rounded-2xl bg-discord-card border border-white/5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-white">Message Author Dismiss Button</span>
            <p className="text-xs text-zinc-400">
              Attach a small 🗑️ button to video embeds allowing the original sender to dismiss or delete the embed if desired.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteButton((prev) => !prev)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
              deleteButton ? "bg-discord-blurple" : "bg-zinc-700"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                deleteButton ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Excluded Channels */}
        <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white">Ignored / Excluded Channels</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select channels where automatic video link conversion should be disabled.
            </p>
          </div>

          <ChannelSelect
            channels={channels.filter((c) => !ignoredChannels.includes(c.id))}
            selectedChannelId=""
            onSelect={(id) => {
              if (!ignoredChannels.includes(id)) {
                setIgnoredChannels([...ignoredChannels, id]);
              }
            }}
            placeholder="Add an excluded channel..."
          />

          {ignoredChannels.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {ignoredChannels.map((id) => {
                const ch = channels.find((c) => c.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-discord-dark border border-white/10 text-xs text-white"
                  >
                    <span>#{ch?.name || id}</span>
                    <button
                      type="button"
                      onClick={() => setIgnoredChannels(ignoredChannels.filter((cId) => cId !== id))}
                      className="text-zinc-500 hover:text-discord-red transition"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
