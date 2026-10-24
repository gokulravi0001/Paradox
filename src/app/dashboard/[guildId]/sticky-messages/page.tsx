"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Pin,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { VariableMenu } from "@/components/ui/VariableMenu";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

interface StickyMessageItem {
  id: string;
  channelId: string;
  messageId: string | null;
  content: string | null;
  enabled: boolean;
  createdAt: string;
}

export default function StickyMessagesPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [stickies, setStickies] = useState<StickyMessageItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form State
  const [channelId, setChannelId] = useState("");
  const [content, setContent] = useState(
    "📌 **Important Notice:** Please keep all discussions in this channel related to community gaming. Check {#rules} for guidelines!"
  );
  const [postNow, setPostNow] = useState(true);

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
        const [channelsRes, listRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/sticky-messages`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
        }

        if (listRes.ok) {
          const sData = await listRes.json();
          setStickies(sData.stickyMessages || []);
        }
      } catch {
        addToast("error", "Failed to load sticky messages");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) init();
  }, [guildId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId || !content.trim()) {
      addToast("warning", "Channel and sticky content are required.", "Missing fields");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/guilds/${guildId}/sticky-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          content,
          enabled: true,
          postNow,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set sticky message");

      // Replace or insert into state
      setStickies((prev) => {
        const filtered = prev.filter((s) => s.channelId !== channelId);
        return [data.stickyMessage, ...filtered];
      });

      addToast("success", "Sticky message saved and pinned to channel!", "Saved");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error saving sticky message");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this sticky message?")) return;

    try {
      const res = await fetch(`/api/guilds/${guildId}/sticky-messages?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStickies((prev) => prev.filter((s) => s.id !== id));
        addToast("info", "Sticky message deleted.");
      }
    } catch {
      addToast("error", "Failed to delete sticky message");
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
        <p className="text-xs text-zinc-400">Loading sticky messages module...</p>
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
            <Pin className="w-3.5 h-3.5" />
            <span>Channel Focus</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Sticky Messages
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pin dynamic messages at the bottom of channels. As new chat messages arrive, Paradox automatically reposts the sticky notice so it stays in sight.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-discord-blurple" />
              <span>Configure Sticky Channel Message</span>
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Target Channel</label>
              <ChannelSelect
                channels={channels}
                selectedChannelId={channelId}
                onSelect={(id) => setChannelId(id)}
                placeholder="Choose channel for sticky notice..."
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Sticky Notice Content</label>
                <VariableMenu
                  channels={channels}
                  onInsert={(v) => setContent((prev) => prev + " " + v)}
                />
              </div>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-400">Post initial sticky message immediately to channel</span>
              <input
                type="checkbox"
                checked={postNow}
                onChange={(e) => setPostNow(e.target.checked)}
                className="w-4 h-4 rounded bg-discord-dark border-white/20 text-discord-blurple cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-discord-blurple/20 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Pin Sticky Message to Channel</span>
            </button>
          </div>

          {/* Active Sticky Messages List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Active Channel Stickies ({stickies.length})
            </h3>

            {stickies.length === 0 ? (
              <div className="p-8 rounded-2xl bg-discord-card border border-white/5 text-center text-xs text-zinc-500">
                No active sticky messages. Create one above!
              </div>
            ) : (
              stickies.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl bg-discord-card border border-white/5 hover:border-white/10 transition flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        #{channels.find((c) => c.id === s.channelId)?.name || s.channelId}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        Sticky Active
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{s.content}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-discord-red transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </form>

        {/* Right Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-discord-blurple" />
              Live Sticky Notice Preview
            </span>
          </div>

          <DiscordPreview
            botName="Paradox"
            content={content}
            channelMap={channelMap}
          />
        </div>
      </div>
    </div>
  );
}
