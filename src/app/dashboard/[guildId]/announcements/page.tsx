"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Megaphone,
  Send,
  Sparkles,
  Loader2,
  AlertTriangle,
  Clock,
  Trash2,
  CheckCircle2,
  Users,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { RoleSelect, DiscordRoleItem } from "@/components/ui/RoleSelect";
import { VariableMenu } from "@/components/ui/VariableMenu";
import { QuickTagsBar } from "@/components/ui/QuickTagsBar";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface AnnouncementItem {
  id: string;
  channelId: string;
  title: string | null;
  content: string;
  status: string;
  mentionType: string;
  publishedAt: string | null;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [roles, setRoles] = useState<DiscordRoleItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Form State
  const [channelId, setChannelId] = useState("");
  const [mentionType, setMentionType] = useState<"NONE" | "EVERYONE" | "HERE" | "ROLE">("NONE");
  const [mentionRoleId, setMentionRoleId] = useState("");
  const [content, setContent] = useState("Hey everyone! We have an exciting community update to share.");
  const [attachEmbed, setAttachEmbed] = useState(true);
  const [embedTitle, setEmbedTitle] = useState("📢 Server Announcement");
  const [embedDescription, setEmbedDescription] = useState(
    "Check out what's new in our community this week! Let us know your thoughts in {#general}."
  );
  const [embedColor, setEmbedColor] = useState("#5865F2");
  const [embedImageUrl, setEmbedImageUrl] = useState("");

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
        const [channelsRes, rolesRes, listRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/roles`),
          fetch(`/api/guilds/${guildId}/announcements`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
        }

        if (rolesRes.ok) {
          const rData = await rolesRes.json();
          setRoles(rData.roles || []);
        }

        if (listRes.ok) {
          const aData = await listRes.json();
          setAnnouncements(aData.announcements || []);
        }
      } catch {
        addToast("error", "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) init();
  }, [guildId]);

  async function handleSend() {
    setConfirmOpen(false);

    if (!channelId) {
      addToast("warning", "Please select an announcement channel.", "Missing Channel");
      return;
    }

    try {
      setPublishing(true);
      const res = await fetch(`/api/guilds/${guildId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          content,
          mentionType,
          mentionRoleId: mentionType === "ROLE" ? mentionRoleId : null,
          publishNow: true,
          embed: attachEmbed
            ? {
                title: embedTitle,
                description: embedDescription,
                color: embedColor,
                imageUrl: embedImageUrl,
                timestamp: true,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish announcement");

      setAnnouncements((prev) => [data.announcement, ...prev]);
      addToast("success", "Announcement published successfully to Discord!", "Published");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error publishing announcement");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/guilds/${guildId}/announcements?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        addToast("info", "Announcement removed from logs.");
      }
    } catch {
      addToast("error", "Failed to delete announcement record");
    }
  }

  const channelMap = channels.reduce<Record<string, string>>((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  const previewMention =
    mentionType === "EVERYONE"
      ? "@everyone "
      : mentionType === "HERE"
      ? "@here "
      : mentionType === "ROLE" && mentionRoleId
      ? `@${roles.find((r) => r.id === mentionRoleId)?.name || "Role"} `
      : "";

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-discord-blurple animate-spin" />
        <p className="text-xs text-zinc-400">Loading announcement studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Broadcast Announcement?"
        message={`Are you sure you want to broadcast this announcement to Discord?\n\n• Target: #${channels.find((c) => c.id === channelId)?.name || channelId}\n• Mentions: ${mentionType}${
          mentionType === "EVERYONE" ? " (⚠️ Will notify all server members!)" : ""
        }`}
        confirmLabel="Broadcast Now"
        isDestructive={mentionType === "EVERYONE"}
        isLoading={publishing}
        onConfirm={handleSend}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-discord-blurple/10 border border-discord-blurple/20 text-discord-blurple text-[11px] font-bold mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Server Broadcasts</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Announcement Builder
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Publish broadcast messages and rich embeds to your announcement channels with mention controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={publishing || !channelId}
          className="px-5 py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-discord-blurple/20 cursor-pointer disabled:opacity-50"
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Broadcast Announcement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Channel & Mentions */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white">Destination Channel</label>
              <ChannelSelect
                channels={channels}
                selectedChannelId={channelId}
                onSelect={(id) => setChannelId(id)}
                placeholder="Choose announcement channel..."
              />
            </div>

            {/* Mention Control */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white">Audience Ping / Mention</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setMentionType("NONE")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    mentionType === "NONE"
                      ? "bg-discord-blurple border-discord-blurple text-white shadow"
                      : "bg-discord-dark border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  No Ping
                </button>
                <button
                  type="button"
                  onClick={() => setMentionType("HERE")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    mentionType === "HERE"
                      ? "bg-amber-600 border-amber-600 text-white shadow"
                      : "bg-discord-dark border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  @here
                </button>
                <button
                  type="button"
                  onClick={() => setMentionType("EVERYONE")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    mentionType === "EVERYONE"
                      ? "bg-discord-red border-discord-red text-white shadow"
                      : "bg-discord-dark border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  @everyone
                </button>
                <button
                  type="button"
                  onClick={() => setMentionType("ROLE")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    mentionType === "ROLE"
                      ? "bg-discord-blurple border-discord-blurple text-white shadow"
                      : "bg-discord-dark border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  Role Ping
                </button>
              </div>

              {mentionType === "EVERYONE" && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-discord-red text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Warning: @everyone will send a notification to every member in the server!</span>
                </div>
              )}

              {mentionType === "ROLE" && (
                <div className="pt-2">
                  <RoleSelect
                    roles={roles}
                    selectedRoleId={mentionRoleId}
                    onSelect={(id) => setMentionRoleId(id)}
                    placeholder="Choose role to ping..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Announcement Text */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">Announcement Message Text</label>
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

          {/* Embed */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-xs font-bold text-white">Attach Rich Embed Card</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Enhance the announcement with an eye-catching embed card.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAttachEmbed((prev) => !prev)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                  attachEmbed ? "bg-discord-blurple" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    attachEmbed ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {attachEmbed && (
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
                    <label className="text-xs font-semibold text-zinc-300">Color</label>
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
                      onInsert={(v) => setEmbedDescription((prev) => (prev ? prev + " " + v : v))}
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={embedDescription}
                    onChange={(e) => setEmbedDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple leading-relaxed"
                  />
                  <QuickTagsBar
                    channels={channels}
                    onInsert={(tag) => setEmbedDescription((prev) => (prev ? prev + " " + tag : tag))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Banner Image URL</label>
                  <input
                    type="url"
                    value={embedImageUrl}
                    onChange={(e) => setEmbedImageUrl(e.target.value)}
                    placeholder="https://.../announcement.gif"
                    className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                  />
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
              Live Announcement Preview
            </span>
          </div>

          <DiscordPreview
            botName="Paradox"
            content={previewMention + content}
            title={attachEmbed ? embedTitle : undefined}
            description={attachEmbed ? embedDescription : undefined}
            color={embedColor}
            imageUrl={embedImageUrl}
            timestamp={true}
            channelMap={channelMap}
          />

          {/* Past Announcements Feed */}
          {announcements.length > 0 && (
            <div className="p-4 rounded-2xl bg-discord-card border border-white/5 space-y-3">
              <span className="text-xs font-bold text-white">Recent Announcements</span>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-xl bg-discord-dark/50 border border-white/5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{a.title || "Announcement"}</div>
                      <div className="text-[10px] text-zinc-500">
                        #{channels.find((c) => c.id === a.channelId)?.name || a.channelId} • {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="p-1 rounded text-zinc-500 hover:text-discord-red transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
