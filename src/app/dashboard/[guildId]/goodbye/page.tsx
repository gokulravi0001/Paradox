"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  UserX,
  Save,
  Send,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Hash,
  User,
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronDown,
  Search,
  X,
  Shield,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { VariableMenu } from "@/components/ui/VariableMenu";
import { QuickTagsBar } from "@/components/ui/QuickTagsBar";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { DISCORD_LIMITS } from "@/lib/validations";

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

const PRESET_COLORS = [
  { name: "Crimson Red", hex: "#ED4245" },
  { name: "Dark Red", hex: "#DA373C" },
  { name: "Electric Blue", hex: "#5865F2" },
  { name: "Emerald Green", hex: "#57F287" },
  { name: "Amber Gold", hex: "#FEE75C" },
  { name: "Neon Pink", hex: "#EB459E" },
  { name: "Cyber Cyan", hex: "#06B6D4" },
  { name: "Pitch Dark", hex: "#2B2D31" },
];

const SAMPLE_USER_AVATAR = "https://cdn.discordapp.com/embed/avatars/1.png";
const SAMPLE_SERVER_ICON = "https://cdn.discordapp.com/embed/avatars/0.png";
const BOT_AVATAR = "/pfp.png";

export default function GoodbyePage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string; color?: number }[]>([]);
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
    "{user.name} has departed from our server. We wish them all the best on their journey!"
  );
  const [embedColor, setEmbedColor] = useState("#da373c");
  const [embedAuthorName, setEmbedAuthorName] = useState("{user.name}");
  const [embedAuthorIconUrl, setEmbedAuthorIconUrl] = useState("{user.avatar}");
  const [embedThumbnailUrl, setEmbedThumbnailUrl] = useState("{user.avatar}");
  const [embedImageUrl, setEmbedImageUrl] = useState("");
  const [embedFooter, setEmbedFooter] = useState("Member Left • Paradox System");
  const [embedFooterIconUrl, setEmbedFooterIconUrl] = useState("{server.icon}");
  const [embedTimestamp, setEmbedTimestamp] = useState(true);

  // Embed Fields State
  const [fields, setFields] = useState<EmbedField[]>([
    { name: "📊 Server Stats", value: "{server.member_count} members remaining", inline: true },
    { name: "🛡️ Notice", value: "Roles and permissions revoked", inline: true },
  ]);

  // 3-Plus Dropdown States for Embed Description
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Add Channel Field States
  const [showAddChannelFieldDropdown, setShowAddChannelFieldDropdown] = useState(false);
  const [channelFieldSearch, setChannelFieldSearch] = useState("");

  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  function addToast(type: ToastMessage["type"], toastMessage: string, title?: string) {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message: toastMessage, title }]);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const textChannels = channels.filter(
    (c) => c.type === 0 || c.type === 5 || c.type === undefined
  );

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [channelsRes, rolesRes, configRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/roles`),
          fetch(`/api/guilds/${guildId}/goodbye`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
        }

        if (rolesRes.ok) {
          const rData = await rolesRes.json();
          setRoles(rData.roles || []);
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
                if (parsed.authorName !== undefined) setEmbedAuthorName(parsed.authorName || "");
                if (parsed.authorIconUrl !== undefined) setEmbedAuthorIconUrl(parsed.authorIconUrl || "");
                if (parsed.imageUrl !== undefined) setEmbedImageUrl(parsed.imageUrl || "");
                if (parsed.thumbnailUrl !== undefined) setEmbedThumbnailUrl(parsed.thumbnailUrl || "");
                if (parsed.footerText !== undefined) setEmbedFooter(parsed.footerText || "");
                if (parsed.footerIconUrl !== undefined) setEmbedFooterIconUrl(parsed.footerIconUrl || "");
                if (parsed.timestamp !== undefined) setEmbedTimestamp(Boolean(parsed.timestamp));
                if (parsed.fields && Array.isArray(parsed.fields) && parsed.fields.length > 0) {
                  setFields(parsed.fields);
                }
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

  // Insert helper for description textarea
  function insertIntoDescription(textToInsert: string) {
    const textarea = descTextareaRef.current;
    if (!textarea) {
      setEmbedDescription((prev) => (prev ? prev + " " + textToInsert : textToInsert));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prevVal = embedDescription;
    const before = prevVal.substring(0, start);
    const after = prevVal.substring(end);

    const newVal = before + textToInsert + after;
    setEmbedDescription(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 50);

    addToast("success", `Inserted ${textToInsert}`);
  }

  // Field Management Helpers
  function addField() {
    if (fields.length >= DISCORD_LIMITS.FIELDS_MAX) {
      addToast("warning", `Maximum ${DISCORD_LIMITS.FIELDS_MAX} fields allowed.`);
      return;
    }
    setFields([...fields, { name: "New Field", value: "Field content", inline: true }]);
  }

  function addChannelField(chName: string) {
    if (fields.length >= DISCORD_LIMITS.FIELDS_MAX) {
      addToast("warning", `Maximum ${DISCORD_LIMITS.FIELDS_MAX} fields allowed.`);
      return;
    }
    const newField: EmbedField = {
      name: `🔗 #${chName}`,
      value: `Check {#${chName}}`,
      inline: true,
    };
    setFields([...fields, newField]);
    addToast("success", `Added field for #${chName}`);
  }

  function linkChannelToField(index: number, chName: string) {
    if (!chName) return;
    const current = fields[index];
    if (!current) return;

    const tag = `{#${chName}}`;
    let newValue = current.value;
    if (/\{#[^}]+\}/.test(newValue)) {
      newValue = newValue.replace(/\{#[^}]+\}/g, tag);
    } else if (!newValue.trim() || newValue === "Field content") {
      newValue = `Visit ${tag}`;
    } else {
      newValue = `${newValue} (${tag})`;
    }

    let newName = current.name;
    if (!newName.trim() || newName === "New Field") {
      newName = `🔗 #${chName}`;
    }

    const updated = [...fields];
    updated[index] = { ...updated[index], name: newName, value: newValue };
    setFields(updated);
    addToast("success", `Linked #${chName} to Field #${index + 1}`);
  }

  function updateField(index: number, key: keyof EmbedField, val: any) {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: val };
    setFields(updated);
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
  }

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
                authorName: embedAuthorName || null,
                authorIconUrl: embedAuthorIconUrl || null,
                imageUrl: embedImageUrl || null,
                thumbnailUrl: embedThumbnailUrl || null,
                footerText: embedFooter || null,
                footerIconUrl: embedFooterIconUrl || null,
                timestamp: embedTimestamp,
                fields,
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
                authorName: embedAuthorName || null,
                authorIconUrl: embedAuthorIconUrl || null,
                imageUrl: embedImageUrl || null,
                thumbnailUrl: embedThumbnailUrl || null,
                footerText: embedFooter || null,
                footerIconUrl: embedFooterIconUrl || null,
                timestamp: embedTimestamp,
                fields,
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
            Send an automated farewell when a member leaves your server.
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
                onInsert={(v) => setMessage((prev) => (prev ? prev + " " + v : v))}
              />
            </div>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. {user.name} has left {server.name}."
              className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple leading-relaxed"
            />
            <QuickTagsBar
              channels={channels}
              onInsert={(tag) => setMessage((prev) => (prev ? prev + " " + tag : tag))}
            />
          </div>

          {/* Embed */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-xs font-bold text-white">Attach Rich Discord Embed</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Display a clean farewell embed card with channel chips, fields, and images.
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
              <div className="space-y-5 animate-in fade-in">
                {/* 1. DEDICATED PROFILE PICTURE (PFP) & ICON BAR */}
                <div className="p-4 rounded-2xl bg-discord-dark/70 border border-rose-500/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-400" />
                      Profile Picture (PFP) &amp; Icon Fast Picker
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30">
                      1-Click Apply
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {/* User Avatar */}
                    <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={SAMPLE_USER_AVATAR}
                          alt="User Avatar"
                          className="w-7 h-7 rounded-full bg-black/40 border border-white/10"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-white block truncate">
                            Departing Member
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{"{user.avatar}"}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEmbedThumbnailUrl("{user.avatar}");
                            addToast("success", "Set Member PFP as Thumbnail");
                          }}
                          className="text-[10px] py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/30 font-medium transition cursor-pointer text-center"
                        >
                          As Thumbnail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmbedAuthorIconUrl("{user.avatar}");
                            if (!embedAuthorName) setEmbedAuthorName("{user.name}");
                            addToast("success", "Set Member PFP as Author Icon");
                          }}
                          className="text-[10px] py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/30 font-medium transition cursor-pointer text-center"
                        >
                          As Header
                        </button>
                      </div>
                    </div>

                    {/* Server Icon */}
                    <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={SAMPLE_SERVER_ICON}
                          alt="Server Icon"
                          className="w-7 h-7 rounded-full bg-black/40 border border-white/10"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-white block truncate">
                            Server Icon
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{"{server.icon}"}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEmbedThumbnailUrl("{server.icon}");
                            addToast("success", "Set Server Icon as Thumbnail");
                          }}
                          className="text-[10px] py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/30 font-medium transition cursor-pointer text-center"
                        >
                          As Thumbnail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmbedFooterIconUrl("{server.icon}");
                            addToast("success", "Set Server Icon as Footer");
                          }}
                          className="text-[10px] py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/30 font-medium transition cursor-pointer text-center"
                        >
                          As Footer
                        </button>
                      </div>
                    </div>

                    {/* Bot Avatar */}
                    <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={BOT_AVATAR}
                          alt="Bot PFP"
                          className="w-7 h-7 rounded-full bg-black/40 border border-white/10"
                          onError={(e) => {
                            (e.target as any).src = SAMPLE_SERVER_ICON;
                          }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-white block truncate">
                            Paradox Bot
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">/pfp.png</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEmbedThumbnailUrl(BOT_AVATAR);
                            addToast("success", "Set Paradox Bot PFP as Thumbnail");
                          }}
                          className="text-[10px] py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/30 font-medium transition cursor-pointer text-center"
                        >
                          As Thumbnail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmbedAuthorIconUrl(BOT_AVATAR);
                            setEmbedAuthorName("Paradox System");
                            addToast("success", "Set Paradox Bot as Header");
                          }}
                          className="text-[10px] py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/30 font-medium transition cursor-pointer text-center"
                        >
                          As Header
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Author Header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">
                      Author Header Name
                    </label>
                    <input
                      type="text"
                      value={embedAuthorName}
                      onChange={(e) => setEmbedAuthorName(e.target.value)}
                      placeholder="e.g. {user.name} or Member Left"
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-300">
                      Author Header Icon URL
                    </label>
                    <input
                      type="text"
                      value={embedAuthorIconUrl}
                      onChange={(e) => setEmbedAuthorIconUrl(e.target.value)}
                      placeholder="e.g. {user.avatar} or image URL"
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                {/* Embed Title & Accent Color */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Embed Title</label>
                    <input
                      type="text"
                      value={embedTitle}
                      onChange={(e) => setEmbedTitle(e.target.value.slice(0, 256))}
                      placeholder="e.g. 👋 Farewell!"
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={embedColor}
                        onChange={(e) => setEmbedColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={embedColor}
                        onChange={(e) => setEmbedColor(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white font-mono uppercase focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Color Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
                    Colors:
                  </span>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setEmbedColor(c.hex)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-discord-dark hover:bg-white/10 text-[10px] font-medium text-zinc-300 border border-white/5 transition cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>

                {/* Description & 3 PLUS TOOLBAR */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-zinc-300">
                      Embed Description
                    </label>

                    {/* 3 PLUS TOOLBAR */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 1. PLUS CHANNEL TOOL */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowChannelDropdown(!showChannelDropdown);
                            setShowRoleDropdown(false);
                            setShowTagDropdown(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <Hash className="w-3.5 h-3.5" />
                          <span>Add Channel</span>
                        </button>

                        {showChannelDropdown && (
                          <div className="absolute right-0 mt-2 w-72 p-3 rounded-2xl bg-[#1e1f22] border border-white/15 shadow-2xl z-50 space-y-2 animate-in fade-in duration-100">
                            <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2">
                              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                                Insert Channel Mention
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowChannelDropdown(false)}
                                className="text-zinc-500 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={channelSearch}
                                onChange={(e) => setChannelSearch(e.target.value)}
                                placeholder="Filter server channels..."
                                className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                              {channels
                                .filter((c) => c.type !== 4)
                                .filter((c) =>
                                  !channelSearch.trim() ||
                                  c.name.toLowerCase().includes(channelSearch.toLowerCase())
                                )
                                .map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      insertIntoDescription(`{#${c.name}}`);
                                      setShowChannelDropdown(false);
                                      setChannelSearch("");
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-600/30 hover:text-indigo-200 text-zinc-300 text-xs transition cursor-pointer text-left"
                                  >
                                    <Hash className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                    <span className="truncate flex-1 font-medium">#{c.name}</span>
                                    {c.type === 5 && (
                                      <span className="text-[10px] text-zinc-500 flex-shrink-0">Announce</span>
                                    )}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. PLUS ROLE TOOL */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRoleDropdown(!showRoleDropdown);
                            setShowChannelDropdown(false);
                            setShowTagDropdown(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <Shield className="w-3.5 h-3.5" />
                          <span>Add Role</span>
                        </button>

                        {showRoleDropdown && (
                          <div className="absolute right-0 mt-2 w-72 p-3 rounded-2xl bg-[#1e1f22] border border-white/15 shadow-2xl z-50 space-y-2 animate-in fade-in duration-100">
                            <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2">
                              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-amber-400" />
                                Insert Role Mention
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowRoleDropdown(false)}
                                className="text-zinc-500 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={roleSearch}
                                onChange={(e) => setRoleSearch(e.target.value)}
                                placeholder="Filter server roles..."
                                className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                              {roles
                                .filter((r) => r.name !== "@everyone")
                                .filter((r) =>
                                  !roleSearch.trim() ||
                                  r.name.toLowerCase().includes(roleSearch.toLowerCase())
                                )
                                .map((r) => (
                                  <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                      insertIntoDescription(`@${r.name}`);
                                      setShowRoleDropdown(false);
                                      setRoleSearch("");
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-amber-600/30 hover:text-amber-200 text-zinc-300 text-xs transition cursor-pointer text-left"
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor: r.color ? (r.color.toString().startsWith("#") ? r.color.toString() : `#${r.color}`) : "#99aab5",
                                      }}
                                    />
                                    <span className="truncate font-medium">{r.name}</span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. PLUS VARIABLE / TAG TOOL */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowTagDropdown(!showTagDropdown);
                            setShowChannelDropdown(false);
                            setShowRoleDropdown(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Add Variable / Tag</span>
                        </button>

                        {showTagDropdown && (
                          <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl bg-[#1e1f22] border border-white/15 shadow-2xl z-50 space-y-3 animate-in fade-in duration-100">
                            <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2">
                              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                Dynamic Placeholders
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowTagDropdown(false)}
                                className="text-zinc-500 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* User Tags */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                                👤 User Tags:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {["{user.mention}", "{user.name}", "{user.avatar}", "{user.id}", "{user.pfp}"].map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                      insertIntoDescription(t);
                                      setShowTagDropdown(false);
                                    }}
                                    className="text-[11px] px-2 py-0.5 rounded bg-discord-dark hover:bg-purple-600 hover:text-white text-zinc-300 border border-white/5 font-mono transition cursor-pointer"
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Server Tags */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                                🏰 Server Tags:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {["{server.name}", "{server.icon}", "{server.member_count}", "{server.id}"].map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                      insertIntoDescription(t);
                                      setShowTagDropdown(false);
                                    }}
                                    className="text-[11px] px-2 py-0.5 rounded bg-discord-dark hover:bg-purple-600 hover:text-white text-zinc-300 border border-white/5 font-mono transition cursor-pointer"
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description Textarea */}
                  <textarea
                    ref={descTextareaRef}
                    rows={4}
                    value={embedDescription}
                    onChange={(e) => setEmbedDescription(e.target.value.slice(0, 4096))}
                    placeholder="Provide departure farewell message..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500 leading-relaxed resize-y"
                  />
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                    <span>Supports Discord markdown, variables, and channel mentions</span>
                    <span>{embedDescription.length}/4096</span>
                  </div>
                </div>

                {/* 2. EMBED FIELDS SECTION (PRO BUILDER) */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <span>Embed Fields ({fields.length}/{DISCORD_LIMITS.FIELDS_MAX})</span>
                    </label>

                    <div className="flex items-center gap-2 relative">
                      {/* Standard Add Field */}
                      <button
                        type="button"
                        onClick={addField}
                        disabled={fields.length >= DISCORD_LIMITS.FIELDS_MAX}
                        className="text-xs px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Field</span>
                      </button>

                      {/* Add Channel Field Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowAddChannelFieldDropdown(!showAddChannelFieldDropdown)}
                          disabled={fields.length >= DISCORD_LIMITS.FIELDS_MAX}
                          className="text-xs px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <Hash className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Add Channel Field</span>
                          <ChevronDown className="w-3 h-3 text-indigo-300 ml-0.5" />
                        </button>

                        {showAddChannelFieldDropdown && (
                          <div className="absolute right-0 mt-2 w-72 p-3 rounded-2xl bg-[#1e1f22] border border-white/15 shadow-2xl z-50 space-y-2 animate-in fade-in duration-100">
                            <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2">
                              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                                Select Channel for Field
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowAddChannelFieldDropdown(false)}
                                className="text-zinc-500 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={channelFieldSearch}
                                onChange={(e) => setChannelFieldSearch(e.target.value)}
                                placeholder="Search server channels..."
                                className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                              {textChannels
                                .filter(
                                  (c) =>
                                    !channelFieldSearch.trim() ||
                                    c.name.toLowerCase().includes(channelFieldSearch.toLowerCase())
                                )
                                .map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      addChannelField(c.name);
                                      setShowAddChannelFieldDropdown(false);
                                      setChannelFieldSearch("");
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-600/30 hover:text-indigo-200 text-zinc-300 text-xs transition cursor-pointer text-left"
                                  >
                                    <Hash className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                    <span className="truncate flex-1 font-medium">#{c.name}</span>
                                    {c.type === 5 && (
                                      <span className="text-[10px] text-zinc-500 flex-shrink-0">Announce</span>
                                    )}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fields List */}
                  <div className="space-y-3">
                    {fields.map((f, idx) => {
                      const channelMatch = f.value.match(/\{#([a-zA-Z0-9_\-]+)\}/);
                      const linkedChannelName = channelMatch ? channelMatch[1] : "";

                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-discord-dark/70 border border-white/10 space-y-3"
                        >
                          {/* Field Title & Inline & Delete */}
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={f.name}
                              onChange={(e) => updateField(idx, "name", e.target.value.slice(0, 256))}
                              placeholder="Field Title..."
                              className="w-full px-3 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                            />
                            <label className="flex items-center gap-1.5 text-xs text-zinc-400 select-none cursor-pointer flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={f.inline}
                                onChange={(e) => updateField(idx, "inline", e.target.checked)}
                                className="rounded border-zinc-700 text-rose-600 focus:ring-0"
                              />
                              Inline
                            </label>
                            <button
                              type="button"
                              onClick={() => removeField(idx)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Channel Selecting Option for this Field */}
                          <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5 text-rose-400" />
                                Select Channel for this Field
                              </span>
                              {linkedChannelName ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                                  Linked: #{linkedChannelName}
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">Optional channel link</span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              {/* Channel Select Dropdown */}
                              <div className="flex-1 relative">
                                <select
                                  value={linkedChannelName}
                                  onChange={(e) => linkChannelToField(idx, e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer appearance-none"
                                >
                                  <option value="">Choose channel to link to this field...</option>
                                  {textChannels.map((c) => (
                                    <option key={c.id} value={c.name}>
                                      #{c.name} {c.type === 5 ? "(Announcement)" : ""}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              </div>

                              {/* Quick Action Buttons */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetCh = linkedChannelName || (textChannels[0]?.name ?? "general");
                                    updateField(idx, "value", `Check {#${targetCh}}`);
                                    addToast("success", `Set Field #${idx + 1} to Check #${targetCh}`);
                                  }}
                                  disabled={!linkedChannelName && textChannels.length === 0}
                                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-medium transition cursor-pointer disabled:opacity-40"
                                >
                                  Set "Check #{linkedChannelName || "channel"}"
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetCh = linkedChannelName || (textChannels[0]?.name ?? "general");
                                    const tag = `{#${targetCh}}`;
                                    const cur = f.value || "";
                                    updateField(idx, "value", cur ? `${cur} ${tag}` : tag);
                                    addToast("success", `Inserted ${tag}`);
                                  }}
                                  disabled={!linkedChannelName && textChannels.length === 0}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-[11px] font-semibold transition cursor-pointer disabled:opacity-40"
                                >
                                  Insert Mention
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Field Content textarea */}
                          <div className="space-y-1">
                            <textarea
                              value={f.value}
                              onChange={(e) => updateField(idx, "value", e.target.value.slice(0, 1024))}
                              rows={2}
                              placeholder="Field content..."
                              className="w-full px-3 py-2 rounded-lg bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 resize-y"
                            />
                            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                              <span>Supports Discord markdown and channel mentions</span>
                              <span>{f.value.length}/1024</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Media Links with PFP and Icon Fast Insert */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Thumbnail Image URL (Top Right)
                    </label>
                    <input
                      type="text"
                      value={embedThumbnailUrl}
                      onChange={(e) => setEmbedThumbnailUrl(e.target.value)}
                      placeholder="e.g. {user.avatar} or image URL..."
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Large Banner Image URL
                    </label>
                    <input
                      type="text"
                      value={embedImageUrl}
                      onChange={(e) => setEmbedImageUrl(e.target.value)}
                      placeholder="https://.../banner.gif"
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                {/* Footer and Timestamp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Footer Text</label>
                    <input
                      type="text"
                      value={embedFooter}
                      onChange={(e) => setEmbedFooter(e.target.value.slice(0, 2048))}
                      placeholder="e.g. Member Left • Paradox Goodbye"
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Footer Icon URL
                    </label>
                    <input
                      type="text"
                      value={embedFooterIconUrl}
                      onChange={(e) => setEmbedFooterIconUrl(e.target.value)}
                      placeholder="e.g. {server.icon} or image URL..."
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={embedTimestamp}
                      onChange={(e) => setEmbedTimestamp(e.target.checked)}
                      className="rounded border-zinc-700 text-rose-600 focus:ring-0"
                    />
                    <span>Include Timestamp in Footer</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Discord Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-discord-blurple" />
              Live Discord Message Preview
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Updates live</span>
          </div>

          <DiscordPreview
            botName="Paradox"
            content={message}
            title={sendEmbed ? embedTitle : undefined}
            description={sendEmbed ? embedDescription : undefined}
            color={embedColor}
            authorName={sendEmbed ? embedAuthorName : undefined}
            authorIconUrl={sendEmbed ? embedAuthorIconUrl : undefined}
            imageUrl={sendEmbed ? embedImageUrl : undefined}
            thumbnailUrl={sendEmbed ? embedThumbnailUrl : undefined}
            footerText={sendEmbed ? embedFooter : undefined}
            footerIconUrl={sendEmbed ? embedFooterIconUrl : undefined}
            timestamp={embedTimestamp}
            fields={sendEmbed ? fields : []}
            channelMap={channelMap}
          />

          <div className="p-4 rounded-xl bg-discord-dark/60 border border-white/5 space-y-2 text-xs text-zinc-400">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>💡 Dynamic Placeholders Supported</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              When sent to Discord, <code className="text-rose-400 font-mono">{"{user.name}"}</code> resolves to the departed member&apos;s username, and channel tags like <code className="text-rose-400 font-mono">{"{#channel}"}</code> become interactive Discord channel links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
