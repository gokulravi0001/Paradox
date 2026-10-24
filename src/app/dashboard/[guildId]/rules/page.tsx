"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Scroll,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Loader2,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { VariableMenu } from "@/components/ui/VariableMenu";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

interface RuleItem {
  id: string;
  ruleNumber: number;
  title: string;
  description: string;
  emoji: string;
  section: string;
}

export default function RulesPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Publish target
  const [channelId, setChannelId] = useState("");
  const [embedTitle, setEmbedTitle] = useState("📜 Official Community Rules & Guidelines");
  const [embedColor, setEmbedColor] = useState("#5865F2");

  // New Rule Modal / State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEmoji, setNewEmoji] = useState("📌");
  const [newSection, setNewSection] = useState("General");
  const [addingRule, setAddingRule] = useState(false);

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
        const [channelsRes, rulesRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/rules`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
        }

        if (rulesRes.ok) {
          const rData = await rulesRes.json();
          setRules(rData.rules || []);
        }
      } catch {
        addToast("error", "Failed to load rules");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) init();
  }, [guildId]);

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      addToast("warning", "Please provide both a title and description.", "Missing fields");
      return;
    }

    try {
      setAddingRule(true);
      const res = await fetch(`/api/guilds/${guildId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          emoji: newEmoji,
          section: newSection,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create rule");

      setRules((prev) => [...prev, data.rule]);
      setNewTitle("");
      setNewDesc("");
      addToast("success", `Rule #${data.rule.ruleNumber} created!`, "Added");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error creating rule");
    } finally {
      setAddingRule(false);
    }
  }

  async function handleDeleteRule(id: string) {
    if (!confirm("Are you sure you want to remove this rule?")) return;

    try {
      const res = await fetch(`/api/guilds/${guildId}/rules?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
        addToast("info", "Rule removed from list.");
      }
    } catch {
      addToast("error", "Failed to delete rule");
    }
  }

  async function handlePublish() {
    if (!channelId) {
      addToast("warning", "Please select a channel to publish the rules to.", "Missing Channel");
      return;
    }
    if (rules.length === 0) {
      addToast("warning", "Add at least one rule before publishing.", "No Rules");
      return;
    }

    try {
      setPublishing(true);
      const res = await fetch(`/api/guilds/${guildId}/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          embedTitle,
          color: embedColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish rules");

      addToast("success", "Official Rules successfully published to Discord!", "Published");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error publishing rules");
    } finally {
      setPublishing(false);
    }
  }

  const channelMap = channels.reduce<Record<string, string>>((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  const previewFields = rules.map((r) => ({
    name: `${r.emoji} Rule #${r.ruleNumber}: ${r.title}`,
    value: r.description,
    inline: false,
  }));

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-discord-blurple animate-spin" />
        <p className="text-xs text-zinc-400">Loading server rules module...</p>
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
            <Scroll className="w-3.5 h-3.5" />
            <span>Server Guidelines</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Rules Builder & Publisher
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Build clear, numbered community guidelines and publish formatted embeds directly to your rules channel.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || rules.length === 0 || !channelId}
          className="px-5 py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-discord-blurple/20 cursor-pointer disabled:opacity-50"
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Publish Rules to Channel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Rules Management & Creator */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Channel & Style */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white">Target Discord Channel</label>
                <ChannelSelect
                  channels={channels}
                  selectedChannelId={channelId}
                  onSelect={(id) => setChannelId(id)}
                  placeholder="Select rules channel..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white">Embed Title</label>
                <input
                  type="text"
                  value={embedTitle}
                  onChange={(e) => setEmbedTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                />
              </div>
            </div>
          </div>

          {/* Add New Rule Form */}
          <form
            onSubmit={handleAddRule}
            className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-discord-blurple" />
              <span>Add New Community Rule</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400">Emoji</label>
                <input
                  type="text"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  placeholder="📌"
                  className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white text-center focus:outline-none focus:border-discord-blurple"
                />
              </div>
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400">Rule Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Treat Everyone with Respect"
                  className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-400">Rule Description</label>
                <VariableMenu
                  channels={channels}
                  onInsert={(v) => setNewDesc((prev) => prev + " " + v)}
                  label="Mention Channel"
                />
              </div>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Harassment, hate speech, spam, or toxic behavior will not be tolerated..."
                className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={addingRule}
              className="px-4 py-2 rounded-xl bg-discord-dark hover:bg-white/5 border border-white/10 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {addingRule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Add to Rules List</span>
            </button>
          </form>

          {/* Current Rules List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Server Rules ({rules.length})
            </h3>

            {rules.length === 0 ? (
              <div className="p-8 rounded-2xl bg-discord-card border border-white/5 text-center text-xs text-zinc-500">
                No rules created yet. Use the form above to add your first rule!
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl bg-discord-card border border-white/5 hover:border-white/10 transition flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-lg flex-shrink-0 pt-0.5">{rule.emoji}</span>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          Rule #{rule.ruleNumber}: {rule.title}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {rule.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-discord-red hover:bg-discord-red/10 transition opacity-0 group-hover:opacity-100 flex-shrink-0 cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Live Rules Discord Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-discord-blurple" />
              Live Published Rules Preview
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">{rules.length} rules loaded</span>
          </div>

          <DiscordPreview
            botName="Paradox"
            title={embedTitle}
            description="Please read and follow all community guidelines to keep our server safe and enjoyable for everyone."
            color={embedColor}
            fields={previewFields}
            footerText="Server Rules • Updated by Staff"
            timestamp={true}
            channelMap={channelMap}
          />
        </div>
      </div>
    </div>
  );
}
