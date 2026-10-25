"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { VariableMenu } from "@/components/ui/VariableMenu";
import { QuickTagsBar } from "@/components/ui/QuickTagsBar";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

interface AutoMessageItem {
  id: string;
  name: string;
  channelId: string;
  intervalMinutes: number;
  content: string | null;
  enabled: boolean;
  nextRunAt: string | null;
  createdAt: string;
}

export default function AutoMessagesPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [autoMessages, setAutoMessages] = useState<AutoMessageItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form State
  const [name, setName] = useState("Daily Server Reminder");
  const [channelId, setChannelId] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(720); // 12 hours
  const [content, setContent] = useState(
    "⭐ Daily Reminder: Don't forget to check out our daily events and grab your roles in {#roles}!"
  );

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
          fetch(`/api/guilds/${guildId}/auto-messages`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
        }

        if (listRes.ok) {
          const aData = await listRes.json();
          setAutoMessages(aData.autoMessages || []);
        }
      } catch {
        addToast("error", "Failed to load automated messages");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) init();
  }, [guildId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId || !name.trim() || !content.trim()) {
      addToast("warning", "Channel, schedule name, and message content are required.", "Missing fields");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch(`/api/guilds/${guildId}/auto-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          name,
          intervalMinutes,
          content,
          enabled: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create auto message");

      setAutoMessages((prev) => [data.autoMessage, ...prev]);
      addToast("success", `Scheduled message "${name}" created!`, "Created");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error creating auto message");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, currentEnabled: boolean) {
    try {
      const res = await fetch(`/api/guilds/${guildId}/auto-messages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: !currentEnabled }),
      });
      if (res.ok) {
        setAutoMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, enabled: !currentEnabled } : m))
        );
        addToast("info", !currentEnabled ? "Automated message activated." : "Automated message paused.");
      }
    } catch {
      addToast("error", "Failed to update automated message");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this scheduled message?")) return;

    try {
      const res = await fetch(`/api/guilds/${guildId}/auto-messages?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAutoMessages((prev) => prev.filter((m) => m.id !== id));
        addToast("info", "Scheduled message removed.");
      }
    } catch {
      addToast("error", "Failed to delete scheduled message");
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
        <p className="text-xs text-zinc-400">Loading automated messages module...</p>
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
            <Clock className="w-3.5 h-3.5" />
            <span>Recurring Automation</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Automated Scheduled Messages
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Broadcast recurring notices, daily questions, reminders, and community updates automatically on a custom schedule.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form */}
        <form onSubmit={handleCreate} className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-discord-blurple" />
              <span>Create Scheduled Message</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Schedule Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Daily Check-in"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Repeating Interval</label>
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                >
                  <option value={30}>Every 30 Minutes</option>
                  <option value={60}>Every 1 Hour</option>
                  <option value={180}>Every 3 Hours</option>
                  <option value={360}>Every 6 Hours</option>
                  <option value={720}>Every 12 Hours</option>
                  <option value={1440}>Every 24 Hours (Daily)</option>
                  <option value={10080}>Every Week</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Destination Channel</label>
              <ChannelSelect
                channels={channels}
                selectedChannelId={channelId}
                onSelect={(id) => setChannelId(id)}
                placeholder="Choose channel for automated messages..."
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Message Content</label>
                <VariableMenu
                  channels={channels}
                  onInsert={(v) => setContent((prev) => (prev ? prev + " " + v : v))}
                />
              </div>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple leading-relaxed"
              />
              <QuickTagsBar
                channels={channels}
                onInsert={(tag) => setContent((prev) => (prev ? prev + " " + tag : tag))}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-discord-blurple/20 cursor-pointer disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              <span>Create Scheduled Automation</span>
            </button>
          </div>

          {/* Active Auto Messages List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Active Schedules ({autoMessages.length})
            </h3>

            {autoMessages.length === 0 ? (
              <div className="p-8 rounded-2xl bg-discord-card border border-white/5 text-center text-xs text-zinc-500">
                No scheduled auto messages. Create one above!
              </div>
            ) : (
              autoMessages.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-discord-card border border-white/5 hover:border-white/10 transition flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{m.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          m.enabled
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {m.enabled ? "Active" : "Paused"}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2">{m.content}</p>

                    <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                      <span>#{channels.find((c) => c.id === m.channelId)?.name || m.channelId}</span>
                      <span>Every {m.intervalMinutes >= 60 ? `${m.intervalMinutes / 60}h` : `${m.intervalMinutes}m`}</span>
                      {m.nextRunAt && (
                        <span className="text-discord-blurple">
                          Next: {new Date(m.nextRunAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(m.id, m.enabled)}
                      className="p-1.5 rounded-lg bg-discord-dark hover:bg-white/5 text-zinc-400 hover:text-white transition"
                      title={m.enabled ? "Pause schedule" : "Activate schedule"}
                    >
                      {m.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-discord-red transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
              Live Message Preview
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
