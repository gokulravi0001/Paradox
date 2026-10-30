"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  UserCheck,
  Save,
  Send,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Shield,
  Layers,
  Hash,
  User,
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Palette,
  RefreshCw,
  Check,
  Sliders,
  Link2,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { RoleSelect, DiscordRoleItem } from "@/components/ui/RoleSelect";
import { VariableMenu } from "@/components/ui/VariableMenu";
import { QuickTagsBar } from "@/components/ui/QuickTagsBar";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { EmbedLinkModal } from "@/components/ui/EmbedLinkModal";
import { DISCORD_LIMITS } from "@/lib/validations";

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

const PRESET_COLORS = [
  { name: "Electric Blue", hex: "#5865F2" },
  { name: "Emerald Green", hex: "#57F287" },
  { name: "Amber Gold", hex: "#FEE75C" },
  { name: "Crimson Red", hex: "#ED4245" },
  { name: "Neon Pink", hex: "#EB459E" },
  { name: "Cyber Cyan", hex: "#06B6D4" },
  { name: "Royal Purple", hex: "#8B5CF6" },
  { name: "Pitch Dark", hex: "#2B2D31" },
];

const WELCOME_QUICK_TEMPLATES = [
  {
    id: "friendly",
    name: "🎉 Friendly Welcome",
    badge: "Recommended",
    desc: "Warm greeting with guidelines, role selection, and general chat links.",
    title: "👋 Welcome to {server.name}!",
    description:
      "Hey {user.mention}, welcome to the server! We are thrilled to have you here 🎉\n\nMake sure to read the guidelines in {#rules-and-info} and grab your roles in {#roles} to unlock community channels!",
    color: "#5865F2",
    authorName: "New Member Arrived",
    authorIconUrl: "{user.avatar}",
    thumbnailUrl: "{user.avatar}",
    imageUrl: "",
    footerText: "Member #{server.member_count} • Enjoy your stay!",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "📜 Read Rules", value: "Visit {#rules-and-info}", inline: true },
      { name: "🎭 Get Roles", value: "Head to {#roles}", inline: true },
      { name: "💬 Chat Now", value: "Say hi in {#general}", inline: true },
    ],
  },
  {
    id: "rules",
    name: "🛡️ Rules & Verify",
    badge: "Structured",
    desc: "Directs new members to complete verification and review rules.",
    title: "🛡️ Welcome to {server.name} Guidelines",
    description:
      "Welcome {user.mention}! Before chatting, please check our server guidelines in {#rules-and-info} and review the announcements in {#announcements}.",
    color: "#57F287",
    authorName: "{server.name} Staff",
    authorIconUrl: "{server.icon}",
    thumbnailUrl: "{server.icon}",
    imageUrl: "",
    footerText: "Follow rules & enjoy • Paradox Security",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "📜 Server Rules", value: "Check {#rules-and-info}", inline: true },
      { name: "📢 Announcements", value: "Follow {#announcements}", inline: true },
      { name: "💬 General Chat", value: "Say hi in {#general}", inline: true },
    ],
  },
  {
    id: "minimal",
    name: "✨ Clean & Minimal",
    badge: "Simple",
    desc: "Compact embed without heavy clutter, fast and beautiful.",
    title: "Welcome {user.name}!",
    description: "Welcome {user.mention} to {server.name}! Glad to have you with us.",
    color: "#8B5CF6",
    authorName: "{user.name}",
    authorIconUrl: "{user.avatar}",
    thumbnailUrl: "{user.avatar}",
    imageUrl: "",
    footerText: "Member #{server.member_count}",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "💬 General Chat", value: "Say hi in {#general}", inline: true },
    ],
  },
];

const SAMPLE_USER_AVATAR = "https://cdn.discordapp.com/embed/avatars/1.png";
const SAMPLE_SERVER_ICON = "https://cdn.discordapp.com/embed/avatars/0.png";
const BOT_AVATAR = "/pfp.png";

export default function WelcomePage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [roles, setRoles] = useState<DiscordRoleItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Template selection & Simplified mode
  const [selectedTemplateId, setSelectedTemplateId] = useState("friendly");
  const [showAdvancedStyling, setShowAdvancedStyling] = useState(false);

  // Welcome settings state
  const [enabled, setEnabled] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [message, setMessage] = useState(
    "Welcome to {server.name}, {user.mention}! 🎉 Please make sure to check out our guidelines and introduce yourself!"
  );
  const [sendEmbed, setSendEmbed] = useState(true);
  const [embedTitle, setEmbedTitle] = useState("👋 Welcome to our Community!");
  const [embedDescription, setEmbedDescription] = useState(
    "We are thrilled to have you here, {user.mention}! Check out our channels to get started:\n\n• Read the guidelines in {#rules-and-info}\n• Grab your vanity roles in {#roles}\n• Introduce yourself in {#general}"
  );
  const [embedColor, setEmbedColor] = useState("#5865F2");
  const [embedAuthorName, setEmbedAuthorName] = useState("New Member Arrived");
  const [embedAuthorIconUrl, setEmbedAuthorIconUrl] = useState("{user.avatar}");
  const [embedThumbnailUrl, setEmbedThumbnailUrl] = useState("{user.avatar}");
  const [embedImageUrl, setEmbedImageUrl] = useState("");
  const [embedFooter, setEmbedFooter] = useState("Member Joined • Paradox System");
  const [embedFooterIconUrl, setEmbedFooterIconUrl] = useState("{server.icon}");
  const [embedTimestamp, setEmbedTimestamp] = useState(true);

  // Embed Fields State
  const [fields, setFields] = useState<EmbedField[]>([
    { name: "📜 Read Rules", value: "Visit {#rules-and-info}", inline: true },
    { name: "🎭 Get Roles", value: "Head to {#roles}", inline: true },
    { name: "💬 Chat Now", value: "Say hi in {#general}", inline: true },
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

  // Embed Link Modal States
  const [showEmbedLinkModal, setShowEmbedLinkModal] = useState(false);
  const [targetFieldForModal, setTargetFieldForModal] = useState<number | null>(null);

  // Description Textarea Ref for precise cursor insertion
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Welcome DM & Auto-role
  const [dmEnabled, setDmEnabled] = useState(false);
  const [dmMessage, setDmMessage] = useState(
    "Hey {user.name}! Welcome to {server.name}. If you need any assistance, reach out to staff!"
  );
  const [autoRoleId, setAutoRoleId] = useState("");

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
      addToast("success", "Channels and roles refreshed from Discord!");
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
          fetch(`/api/guilds/${guildId}/welcome`),
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
            setEnabled(cfg.config.welcomeEnabled || false);
            setChannelId(cfg.config.welcomeChannelId || "");
            if (cfg.config.welcomeMessage) setMessage(cfg.config.welcomeMessage);
            setDmEnabled(cfg.config.welcomeDmEnabled || false);
            if (cfg.config.welcomeDmMessage) setDmMessage(cfg.config.welcomeDmMessage);
            if (cfg.config.welcomeRoleId) setAutoRoleId(cfg.config.welcomeRoleId);

            if (cfg.config.welcomeEmbed) {
              try {
                const parsed = JSON.parse(cfg.config.welcomeEmbed);
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
        addToast("error", "Failed to load welcome configuration");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) init();
  }, [guildId]);

  // Apply a ready-to-use template with real channel ping resolution
  function applyWelcomeTemplate(tplId: string) {
    setSelectedTemplateId(tplId);
    const tpl = WELCOME_QUICK_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;

    const findCh = (kw: string) => channels.find((c) => c.name.toLowerCase().includes(kw.toLowerCase()));
    const rulesCh = findCh("rule");
    const rolesCh = findCh("role");
    const chatCh = findCh("chat") || findCh("general");
    const announceCh = findCh("announc");

    const resolveTplChannels = (val: string) => {
      let res = val;
      if (rulesCh) res = res.replace(/\{#[ ]*rules[^}]*[ ]*\}/gi, `<#${rulesCh.id}>`);
      if (rolesCh) res = res.replace(/\{#[ ]*roles[^}]*[ ]*\}/gi, `<#${rolesCh.id}>`);
      if (chatCh) res = res.replace(/\{#[ ]*(general|chat)[^}]*[ ]*\}/gi, `<#${chatCh.id}>`);
      if (announceCh) res = res.replace(/\{#[ ]*announc[^}]*[ ]*\}/gi, `<#${announceCh.id}>`);
      return res;
    };

    setEmbedTitle(tpl.title);
    setEmbedDescription(resolveTplChannels(tpl.description));
    setEmbedColor(tpl.color);
    setEmbedAuthorName(tpl.authorName);
    setEmbedAuthorIconUrl(tpl.authorIconUrl);
    setEmbedThumbnailUrl(tpl.thumbnailUrl);
    setEmbedImageUrl(tpl.imageUrl);
    setEmbedFooter(tpl.footerText);
    setEmbedFooterIconUrl(tpl.footerIconUrl);
    setFields(
      tpl.fields.map((f) => ({
        ...f,
        value: resolveTplChannels(f.value),
      }))
    );
    addToast("info", `Applied ${tpl.name} template with active server channel pings!`);
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
    const isRule = chName.includes("rule");
    const isRole = chName.includes("role");
    const isAnnounce = chName.includes("announc");
    const isChat = chName.includes("chat") || chName.includes("general");
    const icon = isRule ? "📜" : isRole ? "🎭" : isAnnounce ? "📢" : isChat ? "💬" : "🔗";
    const mention = chId ? `<#${chId}>` : `{#${chName}}`;
    const newField: EmbedField = {
      name: `${icon} #${chName}`,
      value: `Visit ${mention}`,
      inline: true,
    };
    setFields([...fields, newField]);
    addToast("success", `Added pinged field for #${chName}`);
  }

  function addQuickWelcomeField(fallbackKeyword: string, title: string, templateVal: string) {
    if (fields.length >= DISCORD_LIMITS.FIELDS_MAX) {
      addToast("warning", `Maximum ${DISCORD_LIMITS.FIELDS_MAX} fields allowed.`);
      return;
    }
    const matched = channels.find((c) =>
      c.name.toLowerCase().includes(fallbackKeyword.toLowerCase())
    );
    const mention = matched ? `<#${matched.id}>` : `{#${fallbackKeyword}}`;
    const chName = matched ? matched.name : fallbackKeyword;
    const finalVal = templateVal.replace(/<#\d+>|\{#[^}]+\}/, mention);
    setFields([
      ...fields,
      {
        name: title,
        value: finalVal,
        inline: true,
      },
    ]);
    addToast("success", `Added "${title}" pinging #${chName}`);
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
      newValue = `${newValue} (Visit ${mention})`;
    }

    let newName = current.name;
    if (!newName.trim() || newName === "New Field") {
      const isRule = chName.includes("rule");
      const isRole = chName.includes("role");
      const isAnnounce = chName.includes("announc");
      const isChat = chName.includes("chat") || chName.includes("general");
      const icon = isRule ? "📜" : isRole ? "🎭" : isAnnounce ? "📢" : isChat ? "💬" : "🔗";
      newName = `${icon} #${chName}`;
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
      const res = await fetch(`/api/guilds/${guildId}/welcome`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcomeEnabled: enabled,
          welcomeChannelId: channelId,
          welcomeMessage: message,
          welcomeEmbed: sendEmbed
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
          welcomeDmEnabled: dmEnabled,
          welcomeDmMessage: dmMessage,
          welcomeRoleId: autoRoleId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      addToast("success", "Welcome settings saved successfully!", "Saved");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error saving welcome settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!channelId) {
      addToast("warning", "Please select a destination channel first.", "Missing Channel");
      return;
    }

    try {
      setTesting(true);
      const res = await fetch(`/api/guilds/${guildId}/welcome`, {
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
      if (!res.ok) throw new Error(data.error || "Failed to send test welcome");

      addToast("success", "Test welcome message posted to Discord!", "Test Sent");
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
        <p className="text-xs text-zinc-400">Loading welcome message module...</p>
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
            <UserCheck className="w-3.5 h-3.5" />
            <span>Community Onboarding</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Welcome Message Builder
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Greet new members automatically with ready-to-use templates, channel chips, and auto-roles.
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
        {/* Left Form: Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Activation Toggle */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>Enable Welcome Messages</span>
                {enabled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </span>
              <p className="text-xs text-zinc-400">
                Post an automated greeting in your server whenever a new member joins.
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
                <span>Welcome Destination Channel</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-zinc-500">Where greetings get sent</span>
            </div>
            <ChannelSelect
              channels={channels}
              selectedChannelId={channelId}
              onSelect={(id) => setChannelId(id)}
              onRefresh={refreshChannels}
              refreshing={refreshing}
              placeholder="Select a welcome text channel..."
            />
          </div>

          {/* Message Content & Multiple Channel Mentions */}
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
              placeholder="e.g. Welcome {user.mention} to {server.name}!! 🎉"
              className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple leading-relaxed"
            />
            {/* 1-Click Quick Tags Bar */}
            <QuickTagsBar
              channels={channels}
              onInsert={(tag) => setMessage((prev) => (prev ? prev + " " + tag : tag))}
            />
          </div>

          {/* Rich Embed Toggle & Customizer */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-xs font-bold text-white">Attach Rich Discord Embed</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Pick a ready-to-use template or customize colors, channels, and images.
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
                {/* 1. READY-TO-USE 1-CLICK TEMPLATES */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Choose Ready Template (1-Click)
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Instantly configures text, colors &amp; fields
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {WELCOME_QUICK_TEMPLATES.map((tpl) => {
                      const isSelected = selectedTemplateId === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyWelcomeTemplate(tpl.id)}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected
                              ? "bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-600/10 ring-1 ring-indigo-500/50"
                              : "bg-discord-dark/60 border-white/5 hover:border-white/20"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white">{tpl.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                                {tpl.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                              {tpl.desc}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-indigo-300 font-medium">
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
                      placeholder="e.g. 👋 Welcome to our Community!"
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white font-medium focus:outline-none focus:border-purple-500"
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
                        className="w-full px-2.5 py-1.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white font-mono uppercase focus:outline-none focus:border-purple-500"
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
                                      insertIntoDescription(`<@&${r.id}>`);
                                      setShowRoleDropdown(false);
                                      setRoleSearch("");
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-amber-600/30 hover:text-amber-200 text-zinc-300 text-xs transition cursor-pointer text-left"
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{
                                        backgroundColor: r.color ? (r.color.startsWith("#") ? r.color : `#${r.color}`) : "#99aab5",
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

                      {/* 4. Embed Link Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setTargetFieldForModal(null);
                          setShowEmbedLinkModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition cursor-pointer shadow-sm"
                        title="Insert Clickable Embed Link: [Text](URL)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Embed Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Description Textarea */}
                  <textarea
                    ref={descTextareaRef}
                    rows={4}
                    value={embedDescription}
                    onChange={(e) => setEmbedDescription(e.target.value.slice(0, 4096))}
                    placeholder="Provide onboarding instructions and channel links..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed resize-y"
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

                {/* 4. EMBED FIELDS SECTION (PRO BUILDER) */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <span>Embed Fields ({fields.length}/{DISCORD_LIMITS.FIELDS_MAX})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                        Guide New Members
                      </span>
                    </label>

                    <div className="flex items-center gap-2 relative">
                      {/* Standard Add Field */}
                      <button
                        type="button"
                        onClick={addField}
                        disabled={fields.length >= DISCORD_LIMITS.FIELDS_MAX}
                        className="text-xs px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
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
                              {textChannels.length === 0 && (
                                <p className="text-xs text-zinc-500 text-center py-2">No channels found</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Add Link Field */}
                      <button
                        type="button"
                        onClick={() => {
                          setTargetFieldForModal(-1);
                          setShowEmbedLinkModal(true);
                        }}
                        disabled={fields.length >= DISCORD_LIMITS.FIELDS_MAX}
                        className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 font-bold border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        title="Add a new field containing a clickable link: [Text](URL)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Add Link Field</span>
                      </button>
                    </div>
                  </div>

                  {/* Welcome Guide Channel Fields 1-Click Shortcut Bar */}
                  <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        Quick Add Guidance Channels
                      </span>
                      <span className="text-[10px] text-indigo-300">
                        1-click add guidance channels for newcomers
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addQuickWelcomeField("rules", "📜 Read Rules", "Visit {#rules}")}
                        className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer font-medium"
                      >
                        + 📜 Rules Field
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuickWelcomeField("roles", "🎭 Pick Roles", "Head to {#roles}")}
                        className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 transition flex items-center gap-1 cursor-pointer font-medium"
                      >
                        + 🎭 Roles Field
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuickWelcomeField("general", "💬 Say Hi", "Say hi in {#general}")}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer font-medium"
                      >
                        + 💬 Chat Field
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuickWelcomeField("announcements", "📢 Announcements", "Check {#announcements}")}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition flex items-center gap-1 cursor-pointer font-medium"
                      >
                        + 📢 Announcements Field
                      </button>
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
                              placeholder="Field Title (e.g. 📜 Rules)..."
                              className="w-full px-3 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                            />
                            <label className="flex items-center gap-1.5 text-xs text-zinc-400 select-none cursor-pointer flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={f.inline}
                                onChange={(e) => updateField(idx, "inline", e.target.checked)}
                                className="rounded border-zinc-700 text-purple-600 focus:ring-0"
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
                          <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5 text-purple-400" />
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
                                    className="w-full px-3 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 cursor-pointer appearance-none"
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
                                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-purple-400" : ""}`} />
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
                                    updateField(idx, "value", `Visit ${mention}`);
                                    addToast("success", `Set Field #${idx + 1} to Visit #${chName}`);
                                  }}
                                  disabled={!linkedChannelName && textChannels.length === 0}
                                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-medium transition cursor-pointer disabled:opacity-40"
                                >
                                  Set "Visit #{linkedChannelName || "channel"}"
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
                                  className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[11px] font-semibold transition cursor-pointer disabled:opacity-40"
                                >
                                  Insert Mention
                                </button>
                              </div>
                            </div>

                            {/* Quick Channel Chips */}
                            {textChannels.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                <span className="text-[10px] text-zinc-500 font-medium">Quick link:</span>
                                {textChannels.slice(0, 6).map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => linkChannelToField(idx, c.id)}
                                    className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                                      linkedChannelId === c.id || linkedChannelName === c.name
                                        ? "bg-purple-600 text-white border-purple-500"
                                        : "bg-discord-dark hover:bg-purple-600/30 hover:text-white text-zinc-400 border-white/5"
                                    }`}
                                  >
                                    #{c.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Field Content textarea */}
                          <div className="space-y-1">
                            <textarea
                              value={f.value}
                              onChange={(e) => updateField(idx, "value", e.target.value.slice(0, 1024))}
                              rows={2}
                              placeholder="Field content (e.g. Visit {#rules-and-info} to get started)..."
                              className="w-full px-3 py-2 rounded-lg bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 resize-y"
                            />
                            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                              <div className="flex items-center gap-2">
                                <span>Supports Discord markdown & channel mentions</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetFieldForModal(idx);
                                    setShowEmbedLinkModal(true);
                                  }}
                                  className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer transition"
                                  title="Insert clickable embed link: [Text](URL)"
                                >
                                  <Link2 className="w-3 h-3" />
                                  <span>Embed Link</span>
                                </button>
                              </div>
                              <span>{f.value.length}/1024</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. COLLAPSIBLE ADVANCED STYLING & MEDIA (Keeps the form simple & uncluttered!) */}
                <div className="pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedStyling(!showAdvancedStyling)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs font-semibold text-zinc-200 transition cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-400" />
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
                            className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-left hover:border-purple-500/40 transition cursor-pointer flex items-center gap-2"
                          >
                            <img src={SAMPLE_USER_AVATAR} alt="User Avatar" className="w-6 h-6 rounded-full" />
                            <div>
                              <span className="text-xs font-semibold text-white block">Member Avatar</span>
                              <span className="text-[10px] text-zinc-400">As Thumbnail</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEmbedThumbnailUrl("{server.icon}");
                              addToast("success", "Set Server Icon as Thumbnail");
                            }}
                            className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-left hover:border-purple-500/40 transition cursor-pointer flex items-center gap-2"
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
                            className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-left hover:border-purple-500/40 transition cursor-pointer flex items-center gap-2"
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
                            placeholder="e.g. {user.name} or New Member"
                            className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
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
                            className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
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
                            className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
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
                            className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
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
                            placeholder="e.g. Member Joined • Paradox Welcome"
                            className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
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
                            className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={embedTimestamp}
                            onChange={(e) => setEmbedTimestamp(e.target.checked)}
                            className="rounded border-zinc-700 text-purple-600 focus:ring-0"
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

          {/* Auto-Role on Join & Welcome DM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto Role */}
            <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Shield className="w-4 h-4 text-discord-blurple" />
                <span>Auto-Role on Join</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Automatically assign this role to new members when they join.
              </p>
              <RoleSelect
                roles={roles}
                selectedRoleId={autoRoleId}
                onSelect={(id) => setAutoRoleId(id)}
                placeholder="Choose auto-assign role..."
              />
            </div>

            {/* Welcome DM */}
            <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Direct Message (DM)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDmEnabled((prev) => !prev)}
                  className={`w-9 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    dmEnabled ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      dmEnabled ? "translate-x-4.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Send a private direct message greeting to user in DMs.
              </p>
              {dmEnabled && (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={dmMessage}
                    onChange={(e) => setDmMessage(e.target.value)}
                    placeholder="Direct message greeting..."
                    className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <QuickTagsBar
                    channels={channels}
                    onInsert={(tag) => setDmMessage((prev) => (prev ? prev + " " + tag : tag))}
                  />
                </div>
              )}
            </div>
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
              When sent to Discord, <code className="text-discord-blurple font-mono">{"{user.mention}"}</code> resolves to the newcomer&apos;s mention, and channel tags like <code className="text-discord-blurple font-mono">{"{#rules}"}</code> or <code className="text-discord-blurple font-mono">{"<#channelId>"}</code> become interactive Discord channel links.
            </p>
          </div>
        </div>
      </div>

      {/* Embed Link Modal (Text + Link) */}
      <EmbedLinkModal
        isOpen={showEmbedLinkModal}
        onClose={() => {
          setShowEmbedLinkModal(false);
          setTargetFieldForModal(null);
        }}
        onInsert={(markdown) => {
          if (targetFieldForModal === -1) {
            // Add as new field
            if (fields.length >= DISCORD_LIMITS.FIELDS_MAX) {
              addToast("warning", `Maximum ${DISCORD_LIMITS.FIELDS_MAX} fields allowed.`);
              return;
            }
            setFields([
              ...fields,
              {
                name: "🔗 Link",
                value: markdown,
                inline: true,
              },
            ]);
            addToast("success", "Added new field with clickable link!");
          } else if (targetFieldForModal !== null && targetFieldForModal >= 0) {
            // Append to existing field
            const cur = fields[targetFieldForModal]?.value || "";
            updateField(targetFieldForModal, "value", cur ? `${cur} ${markdown}` : markdown);
            addToast("success", `Added link to Field #${targetFieldForModal + 1}!`);
          } else {
            // Insert into description
            insertIntoDescription(markdown);
            addToast("success", "Added clickable link to embed description!");
          }
        }}
      />
    </div>
  );
}
