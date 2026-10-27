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
  ChevronUp,
  Search,
  X,
  Shield,
  Palette,
  RefreshCw,
  Check,
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

const GOODBYE_QUICK_TEMPLATES = [
  {
    id: "standard",
    name: "👋 Standard Farewell",
    badge: "Recommended",
    desc: "Polite departure message wishing member all the best.",
    title: "👋 Farewell {user.name}!",
    description:
      "{user.name} has departed from our server. We wish them all the best on their journey!",
    color: "#DA373C",
    authorName: "{user.name}",
    authorIconUrl: "{user.avatar}",
    thumbnailUrl: "{user.avatar}",
    imageUrl: "",
    footerText: "Member Left • Paradox System",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "📊 Server Stats", value: "{server.member_count} members remaining", inline: true },
      { name: "🛡️ Notice", value: "Roles & permissions revoked", inline: true },
    ],
  },
  {
    id: "stats",
    name: "📊 Member Stats Log",
    badge: "Detailed",
    desc: "Clean audit log style departure with current community count.",
    title: "Member Departed",
    description:
      "**{user.name}** left the server.\nTotal community members remaining: **{server.member_count}**.",
    color: "#ED4245",
    authorName: "Server Audit Logs",
    authorIconUrl: "{server.icon}",
    thumbnailUrl: "{server.icon}",
    imageUrl: "",
    footerText: "Departure Logged • Paradox Moderation",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "👥 Members Count", value: "{server.member_count}", inline: true },
    ],
  },
  {
    id: "minimal",
    name: "✨ Clean & Minimal",
    badge: "Simple",
    desc: "Short single-line departure message without heavy fields.",
    title: "Goodbye {user.name}",
    description: "{user.name} left {server.name}.",
    color: "#2B2D31",
    authorName: "{user.name}",
    authorIconUrl: "{user.avatar}",
    thumbnailUrl: "{user.avatar}",
    imageUrl: "",
    footerText: "Farewell",
    footerIconUrl: "{server.icon}",
    fields: [],
  },
];

const SAMPLE_USER_AVATAR = "https://cdn.discordapp.com/embed/avatars/1.png";
const SAMPLE_SERVER_ICON = "https://cdn.discordapp.com/embed/avatars/0.png";
const BOT_AVATAR = "/pfp.png";

export default function GoodbyePage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string; color?: number }[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Template selection & Simplified mode
  const [selectedTemplateId, setSelectedTemplateId] = useState("standard");
  const [showAdvancedStyling, setShowAdvancedStyling] = useState(false);

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
    { name: "🛡️ Notice", value: "Roles & permissions revoked", inline: true },
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

  async function refreshChannels() {
    try {
      setRefreshing(true);
      const [cRes, rRes] = await Promise.all([
        fetch(`/api/guilds/${guildId}/channels`),
        fetch(`/api/guilds/${guildId}/roles`),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setChannels(cData.channels || []);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setRoles(rData.roles || []);
      }
      addToast("success", "Channels and roles refreshed!");
    } catch {
      addToast("error", "Failed to refresh channels.");
    } finally {
      setRefreshing(false);
    }
  }

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

  function applyGoodbyeTemplate(tplId: string) {
    setSelectedTemplateId(tplId);
    const tpl = GOODBYE_QUICK_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setEmbedTitle(tpl.title);
    setEmbedDescription(tpl.description);
    setEmbedColor(tpl.color);
    setEmbedAuthorName(tpl.authorName);
    setEmbedAuthorIconUrl(tpl.authorIconUrl);
    setEmbedThumbnailUrl(tpl.thumbnailUrl);
    setEmbedImageUrl(tpl.imageUrl);
    setEmbedFooter(tpl.footerText);
    setEmbedFooterIconUrl(tpl.footerIconUrl);
    setFields(tpl.fields);
    addToast("info", `Applied ${tpl.name} template!`);
  }

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

  function addChannelField(target: DiscordChannelItem | string) {
    if (fields.length >= DISCORD_LIMITS.FIELDS_MAX) {
      addToast("warning", `Maximum ${DISCORD_LIMITS.FIELDS_MAX} fields allowed.`);
      return;
    }
    const ch = typeof target === "string" ? channels.find((c) => c.id === target || c.name === target) : target;
    const chName = ch ? ch.name : (typeof target === "string" ? target : target.name);
    const chId = ch ? ch.id : (typeof target === "string" ? "" : target.id);
    const mention = chId ? `<#${chId}>` : `{#${chName}}`;
    const newField: EmbedField = {
      name: `🔗 #${chName}`,
      value: `Check ${mention}`,
      inline: true,
    };
    setFields([...fields, newField]);
    addToast("success", `Added pinged field for #${chName}`);
  }

  function linkChannelToField(index: number, chIdentifier: string) {
    if (!chIdentifier) return;
    const current = fields[index];
    if (!current) return;

    const ch = channels.find((c) => c.id === chIdentifier || c.name.toLowerCase() === chIdentifier.toLowerCase());
    const chName = ch ? ch.name : chIdentifier;
    const mention = ch ? `<#${ch.id}>` : `{#${chIdentifier}}`;

    let newValue = current.value;
    if (/<#\d+>|\{#[^}]+\}/.test(newValue)) {
      newValue = newValue.replace(/<#\d+>|\{#[^}]+\}/g, mention);
    } else if (!newValue.trim() || newValue === "Field content") {
      newValue = `Visit ${mention}`;
    } else {
      newValue = `${newValue} (${mention})`;
    }

    let newName = current.name;
    if (!newName.trim() || newName === "New Field") {
      newName = `🔗 #${chName}`;
    }

    const updated = [...fields];
    updated[index] = { ...updated[index], name: newName, value: newValue };
    setFields(updated);
    addToast("success", `Linked #${chName} (ping) to Field #${index + 1}`);
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
            onClick={refreshChannels}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-discord-dark hover:bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
            title="Refresh channels from Discord"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-discord-blurple" : ""}`} />
            <span>Sync</span>
          </button>
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
              onRefresh={refreshChannels}
              refreshing={refreshing}
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
                  Pick a ready-to-use farewell template or customize colors and fields.
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
                {/* 1. READY-TO-USE TEMPLATES (1-CLICK) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                      Choose Ready Template (1-Click)
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Instantly configures farewell text, colors &amp; fields
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {GOODBYE_QUICK_TEMPLATES.map((tpl) => {
                      const isSelected = selectedTemplateId === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyGoodbyeTemplate(tpl.id)}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected
                              ? "bg-rose-600/20 border-rose-500 shadow-md shadow-rose-600/10 ring-1 ring-rose-500/50"
                              : "bg-discord-dark/60 border-white/5 hover:border-white/20"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white">{tpl.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                                {tpl.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                              {tpl.desc}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-rose-300 font-medium">
                            <Check className={`w-3 h-3 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                            <span>{isSelected ? "Active Preset" : "Apply Preset"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. EMBED TITLE & COLOR */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
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

                {/* 3. DESCRIPTION & 3 PLUS TOOLBAR */}
                <div className="space-y-2">
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
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={refreshChannels}
                                  disabled={refreshing}
                                  title="Refresh channels from Discord"
                                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowChannelDropdown(false)}
                                  className="text-zinc-500 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
                                      insertIntoDescription(`<#${c.id}>`);
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
                          <span>Add Variable</span>
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
                                {["{user.mention}", "{user.name}", "{user.avatar}", "{user.id}"].map((t) => (
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
                                {["{server.name}", "{server.icon}", "{server.member_count}"].map((t) => (
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

                  {/* 1-Click Server Channel Quick Chips */}
                  {textChannels.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                        <Hash className="w-3 h-3 text-indigo-400" />
                        Quick Insert Channel:
                      </span>
                      {textChannels.slice(0, 6).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => insertIntoDescription(`<#${c.id}>`)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-discord-dark hover:bg-indigo-600/30 hover:text-indigo-200 text-zinc-300 border border-white/5 transition cursor-pointer font-medium"
                          title={`Mention #${c.name}`}
                        >
                          #{c.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={refreshChannels}
                        disabled={refreshing}
                        className="text-[10px] p-1 rounded-md text-zinc-500 hover:text-white transition"
                        title="Refresh channels"
                      >
                        <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. EMBED FIELDS SECTION */}
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
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={refreshChannels}
                                  disabled={refreshing}
                                  title="Refresh channels from Discord"
                                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowAddChannelFieldDropdown(false)}
                                  className="text-zinc-500 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
                                      addChannelField(c);
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
                      const idMatch = f.value.match(/<#(\d+)>/);
                      const tagMatch = f.value.match(/\{#([a-zA-Z0-9_\-]+)\}/);
                      let linkedChannelId = "";
                      let linkedChannelName = "";

                      if (idMatch) {
                        linkedChannelId = idMatch[1];
                        const found = channels.find((c) => c.id === idMatch[1]);
                        linkedChannelName = found ? found.name : idMatch[1];
                      } else if (tagMatch) {
                        const found = channels.find((c) => c.name.toLowerCase() === tagMatch[1].toLowerCase());
                        linkedChannelId = found ? found.id : "";
                        linkedChannelName = tagMatch[1];
                      }

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
                                Select Channel for this Field (Ping)
                              </span>
                              {linkedChannelName ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                                  Linked Ping: #{linkedChannelName}
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">Optional channel ping</span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              {/* Channel Select Dropdown + Refresh Button */}
                              <div className="flex-1 flex items-center gap-1.5">
                                <div className="flex-1 relative">
                                  <select
                                    value={linkedChannelId || linkedChannelName}
                                    onChange={(e) => linkChannelToField(idx, e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer appearance-none"
                                  >
                                    <option value="">Choose channel to ping in this field...</option>
                                    {textChannels.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        #{c.name} {c.type === 5 ? "(Announcement)" : ""}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={refreshChannels}
                                  disabled={refreshing}
                                  title="Refresh channels from Discord"
                                  className="p-1.5 rounded-lg bg-discord-dark border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition cursor-pointer flex-shrink-0"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-rose-400" : ""}`} />
                                </button>
                              </div>

                              {/* Quick Action Buttons */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ch = linkedChannelId ? channels.find((c) => c.id === linkedChannelId) : textChannels[0];
                                    const mention = ch ? `<#${ch.id}>` : (linkedChannelName ? `{#${linkedChannelName}}` : "channel");
                                    const chName = ch ? ch.name : (linkedChannelName || "channel");
                                    updateField(idx, "value", `Check ${mention}`);
                                    addToast("success", `Set Field #${idx + 1} to Check #${chName}`);
                                  }}
                                  disabled={!linkedChannelName && textChannels.length === 0}
                                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-medium transition cursor-pointer disabled:opacity-40"
                                >
                                  Set "Check #{linkedChannelName || "channel"}"
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ch = linkedChannelId ? channels.find((c) => c.id === linkedChannelId) : textChannels[0];
                                    const mention = ch ? `<#${ch.id}>` : `{#${linkedChannelName || "channel"}}`;
                                    const cur = f.value || "";
                                    updateField(idx, "value", cur ? `${cur} ${mention}` : mention);
                                    addToast("success", `Inserted channel ping`);
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

                {/* 5. COLLAPSIBLE ADVANCED STYLING & MEDIA */}
                <div className="pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedStyling(!showAdvancedStyling)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs font-semibold text-zinc-200 transition cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-rose-400" />
                      <span>Advanced Media &amp; Custom Styling</span>
                      <span className="text-[10px] text-zinc-500 font-normal">
                        (Avatars, Banners, Author Header &amp; Footer)
                      </span>
                    </div>
                    {showAdvancedStyling ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>

                  {showAdvancedStyling && (
                    <div className="mt-3 p-4 rounded-2xl bg-discord-dark/50 border border-white/5 space-y-4 animate-in fade-in duration-150">
                      {/* PFP & Icon Bar */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                          Profile Picture (PFP) &amp; Icon Fast Picker:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEmbedThumbnailUrl("{user.avatar}");
                              addToast("success", "Set Member PFP as Thumbnail");
                            }}
                            className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-left hover:border-rose-500/40 transition cursor-pointer flex items-center gap-2"
                          >
                            <img src={SAMPLE_USER_AVATAR} alt="User Avatar" className="w-6 h-6 rounded-full" />
                            <div>
                              <span className="text-xs font-semibold text-white block">Departing Member</span>
                              <span className="text-[10px] text-zinc-400">As Thumbnail</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEmbedThumbnailUrl("{server.icon}");
                              addToast("success", "Set Server Icon as Thumbnail");
                            }}
                            className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-left hover:border-rose-500/40 transition cursor-pointer flex items-center gap-2"
                          >
                            <img src={SAMPLE_SERVER_ICON} alt="Server Icon" className="w-6 h-6 rounded-full" />
                            <div>
                              <span className="text-xs font-semibold text-white block">Server Icon</span>
                              <span className="text-[10px] text-zinc-400">As Thumbnail</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEmbedThumbnailUrl(BOT_AVATAR);
                              addToast("success", "Set Paradox Bot as Thumbnail");
                            }}
                            className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-left hover:border-rose-500/40 transition cursor-pointer flex items-center gap-2"
                          >
                            <img src={BOT_AVATAR} alt="Bot Avatar" className="w-6 h-6 rounded-full" onError={(e) => { (e.target as any).src = SAMPLE_SERVER_ICON; }} />
                            <div>
                              <span className="text-xs font-semibold text-white block">Paradox Bot</span>
                              <span className="text-[10px] text-zinc-400">As Thumbnail</span>
                            </div>
                          </button>
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

                      {/* Preset Color Pills */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-zinc-300 block">Preset Colors</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setEmbedColor(c.hex)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-discord-dark hover:bg-white/10 text-[10px] font-medium text-zinc-300 border border-white/5 transition cursor-pointer"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span>{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Thumbnail & Banner Image URLs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-300">
                            Thumbnail URL (Top Right)
                          </label>
                          <input
                            type="text"
                            value={embedThumbnailUrl}
                            onChange={(e) => setEmbedThumbnailUrl(e.target.value)}
                            placeholder="e.g. {user.avatar} or image URL"
                            className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-300">
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
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-300">Footer Text</label>
                          <input
                            type="text"
                            value={embedFooter}
                            onChange={(e) => setEmbedFooter(e.target.value.slice(0, 2048))}
                            placeholder="e.g. Member Left • Paradox Goodbye"
                            className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-300">
                            Footer Icon URL
                          </label>
                          <input
                            type="text"
                            value={embedFooterIconUrl}
                            onChange={(e) => setEmbedFooterIconUrl(e.target.value)}
                            placeholder="e.g. {server.icon} or image URL"
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
