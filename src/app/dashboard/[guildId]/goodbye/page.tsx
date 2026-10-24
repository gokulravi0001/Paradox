"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  UserX,
  Save,
  Send,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { VariableMenu } from "@/components/ui/VariableMenu";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

export default function GoodbyePage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Goodbye settings
  const [enabled, setEnabled] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [message, setMessage] = useState(
    "{user.name} has left {server.name}. We now have {server.member_count} members remaining. Farewell!"
  );
  const [sendEmbed, setSendEmbed] = useState(true);
  const [embedTitle, setEmbedTitle] = useState("👋 Goodbye!");
  const [embedDescription, setEmbedDescription] = useState(
    "{user.name} has departed from our server. We wish them all the best!"
  );
  const [embedColor, setEmbedColor] = useState("#da373c");
  const [embedImageUrl, setEmbedImageUrl] = useState("");
  const [embedFooter, setEmbedFooter] = useState("Member Left • Paradox System");

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
        const [channelsRes, configRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/goodbye`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
        }

        if (configRes.ok) {
          const cfg = await configRes.json();
          if (cfg.config) {
            setEnabled(cfg.config.goodbyeEnabled || false);
            setChannelId(cfg.config.goodbyeChannelId || "");
            if (cfg.config.goodbyeMessage) setMessage(cfg.config.goodbyeMessage);

            if (cfg.config.goodbyeEmbed) {
              try {
                const parsed = JSON.parse(cfg.config.goodbyeEmbed);
                setSendEmbed(true);
                if (parsed.title) setEmbedTitle(parsed.title);
                if (parsed.description) setEmbedDescription(parsed.description);
                if (parsed.color) setEmbedColor(parsed.color);
                if (parsed.imageUrl) setEmbedImageUrl(parsed.imageUrl);
                if (parsed.footerText) setEmbedFooter(parsed.footerText);
              } catch {
                // no-op
              }
            }
          }
        }
      } catch {
        addToast("error", "Failed to load goodbye configuration");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) init();
  }, [guildId]);

  async function handleSave() {
    try {
      setSaving(true);
      const res = await fetch(`/api/guilds/${guildId}/goodbye`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goodbyeEnabled: enabled,
          goodbyeChannelId: channelId,
          goodbyeMessage: message,
          goodbyeEmbed: sendEmbed
            ? {
                title: embedTitle,
                description: embedDescription,
                color: embedColor,
                imageUrl: embedImageUrl,
                footerText: embedFooter,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      addToast("success", "Goodbye settings saved successfully!", "Saved");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error saving goodbye settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!channelId) {
      addToast("warning", "Please select a channel first.", "Missing Channel");
      return;
    }

    try {
      setTesting(true);
      const res = await fetch(`/api/guilds/${guildId}/goodbye`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          message,
          embed: sendEmbed
            ? {
                title: embedTitle,
                description: embedDescription,
                color: embedColor,
                imageUrl: embedImageUrl,
                footerText: embedFooter,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send test goodbye");

      addToast("success", "Test goodbye message posted to Discord!", "Test Sent");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error sending test message");
    } finally {
      setTesting(false);
    }
  }

  const channelMap = channels.reduce<Record<string, string>>((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-discord-blurple animate-spin" />
        <p className="text-xs text-zinc-400">Loading goodbye message module...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-discord-red text-[11px] font-bold mb-2">
            <UserX className="w-3.5 h-3.5" />
            <span>Member Departure</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Goodbye Message Builder
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Send an automated message when a member leaves your server.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !channelId}
            className="px-4 py-2 rounded-xl bg-discord-dark hover:bg-white/5 border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Test Message</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-discord-blurple/20 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Activation Toggle */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>Enable Goodbye Messages</span>
                {enabled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </span>
              <p className="text-xs text-zinc-400">
                Log or announce departing members automatically in your chosen channel.
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

          {/* Destination Channel Selector */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Goodbye Destination Channel</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-zinc-500">Target channel</span>
            </div>
            <ChannelSelect
              channels={channels}
              selectedChannelId={channelId}
              onSelect={(id) => setChannelId(id)}
              placeholder="Select a goodbye text channel..."
            />
          </div>

          {/* Message Content */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">
                Message Content (Outside Embed)
              </label>
              <VariableMenu
                channels={channels}
                onInsert={(v) => setMessage((prev) => prev + " " + v)}
              />
            </div>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. {user.name} has left {server.name}."
              className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple leading-relaxed"
            />
          </div>

          {/* Embed */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-xs font-bold text-white">Attach Rich Discord Embed</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Display a clean farewell embed card.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSendEmbed((prev) => !prev)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                  sendEmbed ? "bg-discord-blurple" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    sendEmbed ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {sendEmbed && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Embed Title</label>
                    <input
                      type="text"
                      value={embedTitle}
                      onChange={(e) => setEmbedTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={embedColor}
                        onChange={(e) => setEmbedColor(e.target.value)}
                        className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={embedColor}
                        onChange={(e) => setEmbedColor(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Description</label>
                    <VariableMenu
                      channels={channels}
                      onInsert={(v) => setEmbedDescription((prev) => prev + " " + v)}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={embedDescription}
                    onChange={(e) => setEmbedDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Banner Image URL</label>
                    <input
                      type="url"
                      value={embedImageUrl}
                      onChange={(e) => setEmbedImageUrl(e.target.value)}
                      placeholder="https://.../banner.png"
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Footer Text</label>
                    <input
                      type="text"
                      value={embedFooter}
                      onChange={(e) => setEmbedFooter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-discord-blurple" />
              Live Discord Goodbye Preview
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Updates live</span>
          </div>

          <DiscordPreview
            botName="Paradox"
            content={message}
            title={sendEmbed ? embedTitle : undefined}
            description={sendEmbed ? embedDescription : undefined}
            color={embedColor}
            imageUrl={embedImageUrl}
            footerText={sendEmbed ? embedFooter : undefined}
            timestamp={true}
            channelMap={channelMap}
          />
        </div>
      </div>
    </div>
  );
}
