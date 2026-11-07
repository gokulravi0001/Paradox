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
  MessageSquare,
  Lightbulb,
  Copy,
  X,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { RoleSelect, DiscordRoleItem } from "@/components/ui/RoleSelect";
import { VariableMenu } from "@/components/ui/VariableMenu";
import { QuickTagsBar } from "@/components/ui/QuickTagsBar";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface AnnouncementResponseItem {
  id: string;
  userId: string;
  userTag: string;
  userAvatar: string | null;
  content: string;
  createdAt: string;
}

interface AnnouncementItem {
  id: string;
  channelId: string;
  title: string | null;
  content: string;
  status: string;
  mentionType: string;
  allowTyping?: boolean;
  threadName?: string | null;
  threadId?: string | null;
  adminChannelId?: string | null;
  publishedAt: string | null;
  createdAt: string;
  responses?: AnnouncementResponseItem[];
  _count?: {
    responses: number;
  };
}

export default function AnnouncementsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Typable / Discussion Options
  const [allowTyping, setAllowTyping] = useState(false);
  const [threadTitle, setThreadTitle] = useState("💬 Event Ideas / Discussion");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

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

  async function refreshChannels() {
    try {
      setRefreshing(true);
      const [channelsRes, rolesRes] = await Promise.all([
        fetch(`/api/guilds/${guildId}/channels`),
        fetch(`/api/guilds/${guildId}/roles`),
      ]);

      if (channelsRes.ok) {
        const cData = await channelsRes.json();
        setChannels(cData.channels || []);
      }

      if (rolesRes.ok) {
        const rData = await rolesRes.json();
        setRoles(rData.roles || []);
      }

      addToast("success", "Channels and roles refreshed from Discord!");
    } catch {
      addToast("error", "Failed to refresh channels.");
    } finally {
      setRefreshing(false);
    }
  }

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
          allowTyping,
          threadName: allowTyping ? threadTitle : null,
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
                onRefresh={refreshChannels}
                refreshing={refreshing}
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

          {/* Typable / Ideas Section */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Typable Announcement / Ideas Collection</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Allows server members to type and submit ideas directly via a Discord button, modal & dedicated discussion thread.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllowTyping((prev) => !prev)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                  allowTyping ? "bg-amber-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    allowTyping ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {allowTyping && (
              <div className="space-y-3 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Discussion Thread Name</label>
                  <input
                    type="text"
                    value={threadTitle}
                    onChange={(e) => setThreadTitle(e.target.value)}
                    placeholder="💬 Event Ideas / Discussion"
                    className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    How this works:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                    <li>A <strong>[💡 Type Your Idea / Feedback]</strong> button is attached directly to the announcement.</li>
                    <li>Clicking it opens Discord's native multiline text field modal for members to type their thoughts.</li>
                    <li>A <strong>temporary private channel (🔒-ideas-...)</strong> is auto-created, visible <strong>ONLY to the Server Owner & Admins</strong>.</li>
                    <li>Every submission with the member's username and avatar is logged to this private channel in real time.</li>
                    <li>Admins/Owner can close and delete the temporary channel anytime with one click using the attached <strong>[🗑️ Close Channel]</strong> button.</li>
                  </ul>
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

          {allowTyping && (
            <div className="p-3 rounded-xl bg-discord-card border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="px-3 py-1.5 rounded-lg bg-discord-blurple/80 text-white text-[11px] font-bold flex items-center gap-1.5 shadow"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                  <span>Type Your Idea / Feedback</span>
                </button>
                <span className="text-[10px] text-zinc-400">Attached to announcement message</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 pl-1 border-l-2 border-zinc-600">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white font-medium text-[11px]">{threadTitle || "💬 Event Ideas / Discussion"}</span>
                <span className="text-[10px] text-zinc-500">(Auto-created thread)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-400/90 pl-1 border-l-2 border-amber-500">
                <span className="font-bold text-[11px]">🔒 Private Admin Channel:</span>
                <span className="text-[10px] text-zinc-300">Auto-created for Owner & Admins only</span>
              </div>
            </div>
          )}

          {/* Past Announcements Feed */}
          {announcements.length > 0 && (
            <div className="p-4 rounded-2xl bg-discord-card border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Recent Announcements</span>
                <span className="text-[10px] text-zinc-500">{announcements.length} sent</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {announcements.map((a) => {
                  const ideaCount = a._count?.responses ?? a.responses?.length ?? 0;
                  return (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl bg-discord-dark/50 border border-white/5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-white truncate">{a.title || "Announcement"}</span>
                          {a.allowTyping && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Lightbulb className="w-2.5 h-2.5" />
                              Typable
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          #{channels.find((c) => c.id === a.channelId)?.name || a.channelId} • {new Date(a.createdAt).toLocaleDateString()}
                          {a.threadName && ` • Thread: ${a.threadName}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {a.allowTyping && (
                          <button
                            type="button"
                            onClick={() => setSelectedAnnouncement(a)}
                            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition"
                            title="View member ideas"
                          >
                            <Lightbulb className="w-3 h-3" />
                            <span>{ideaCount} {ideaCount === 1 ? "Idea" : "Ideas"}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-discord-red hover:bg-discord-red/10 transition"
                          title="Delete announcement record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ideas Collection Viewer Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-discord-card border border-white/10 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Member Ideas & Suggestions</h3>
                  <p className="text-[10px] text-zinc-400">
                    {selectedAnnouncement.threadName || selectedAnnouncement.title || "Announcement Discussion"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAnnouncement(null);
                  setCopiedAll(false);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ideas list */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {(!selectedAnnouncement.responses || selectedAnnouncement.responses.length === 0) ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  <Lightbulb className="w-6 h-6 mx-auto mb-2 opacity-40 text-amber-400" />
                  No ideas submitted yet. Server members can click the <strong>💡 Type Your Idea</strong> button on the Discord announcement!
                </div>
              ) : (
                selectedAnnouncement.responses.map((resp) => (
                  <div key={resp.id} className="p-3 rounded-xl bg-discord-dark/70 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        {resp.userAvatar ? (
                          <img src={resp.userAvatar} alt="" className="w-4 h-4 rounded-full" />
                        ) : (
                          <Users className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span className="font-bold text-white">@{resp.userTag}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(resp.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed pl-6">
                      {resp.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[11px] text-zinc-400">
                Total: <strong>{selectedAnnouncement.responses?.length || 0}</strong> submissions
              </span>
              <div className="flex items-center gap-2">
                {selectedAnnouncement.responses && selectedAnnouncement.responses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const allText = selectedAnnouncement.responses
                        ?.map((r) => `@${r.userTag}: ${r.content}`)
                        .join("\n\n");
                      if (allText) {
                        navigator.clipboard.writeText(allText);
                        setCopiedAll(true);
                        setTimeout(() => setCopiedAll(false), 2000);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedAll ? "Copied All!" : "Copy All Ideas"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnnouncement(null);
                    setCopiedAll(false);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-discord-blurple text-white text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
