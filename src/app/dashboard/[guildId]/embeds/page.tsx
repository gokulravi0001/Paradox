"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Layers,
  Send,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  Bot,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { DISCORD_LIMITS } from "@/lib/validations";
import { DiscordMarkdown } from "@/lib/discordMarkdown";

interface Channel {
  id: string;
  name: string;
}

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface EmbedTemplate {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  url: string | null;
  color: string | null;
  authorName: string | null;
  authorUrl: string | null;
  authorIconUrl: string | null;
  footerText: string | null;
  footerIconUrl: string | null;
  timestamp: boolean;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  fields: EmbedField[];
  updatedAt: string;
}

const PRESET_COLORS = [
  { name: "Blurple", hex: "#5865F2" },
  { name: "Green", hex: "#57F287" },
  { name: "Yellow", hex: "#FEE75C" },
  { name: "Red", hex: "#ED4245" },
  { name: "Fuchsia", hex: "#EB459E" },
  { name: "Dark", hex: "#2B2D31" },
];

export default function EmbedBuilderPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [templates, setTemplates] = useState<EmbedTemplate[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelMode, setChannelMode] = useState<"select" | "custom">("select");
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Form Fields
  const [templateName, setTemplateName] = useState("Server Announcement");
  const [title, setTitle] = useState("Welcome to our Server!");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState(
    "We are thrilled to have you here. Please make sure to check out the rules and verify your roles."
  );
  const [color, setColor] = useState("#5865F2");
  const [authorName, setAuthorName] = useState("Paradox Community");
  const [authorUrl, setAuthorUrl] = useState("");
  const [authorIconUrl, setAuthorIconUrl] = useState("");
  const [footerText, setFooterText] = useState("Paradox Bot • Server Management");
  const [footerIconUrl, setFooterIconUrl] = useState("");
  const [timestamp, setTimestamp] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [fields, setFields] = useState<EmbedField[]>([
    { name: "Rules Channel", value: "#rules-and-info", inline: true },
    { name: "Roles Setup", value: "React below for roles", inline: true },
  ]);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, tRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/embeds`),
        ]);

        if (cRes.ok) {
          const cData = await cRes.json();
          setChannels(cData.channels || []);
          if (cData.channels?.length > 0) {
            setSelectedChannelId(cData.channels[0].id);
            setChannelName(cData.channels[0].name);
          }
        }

        if (tRes.ok) {
          const tData = await tRes.json();
          setTemplates(tData.embeds || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [guildId]);

  // Compute character count for Discord limit meter
  const totalCharacters =
    (title?.length || 0) +
    (description?.length || 0) +
    (authorName?.length || 0) +
    (footerText?.length || 0) +
    fields.reduce((acc, f) => acc + (f.name?.length || 0) + (f.value?.length || 0), 0);

  function addField() {
    if (fields.length >= DISCORD_LIMITS.FIELDS_MAX) return;
    setFields([...fields, { name: "New Field", value: "Field value", inline: false }]);
  }

  function updateField(index: number, key: keyof EmbedField, val: any) {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: val };
    setFields(updated);
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
  }

  function loadTemplate(t: EmbedTemplate) {
    setActiveTemplateId(t.id);
    setTemplateName(t.name);
    setTitle(t.title || "");
    setUrl(t.url || "");
    setDescription(t.description || "");
    setColor(t.color || "#5865F2");
    setAuthorName(t.authorName || "");
    setAuthorUrl(t.authorUrl || "");
    setAuthorIconUrl(t.authorIconUrl || "");
    setFooterText(t.footerText || "");
    setFooterIconUrl(t.footerIconUrl || "");
    setTimestamp(!!t.timestamp);
    setThumbnailUrl(t.thumbnailUrl || "");
    setImageUrl(t.imageUrl || "");
    setFields(t.fields || []);
    setSuccess(`Loaded template "${t.name}"`);
  }

  const embedPayload = {
    name: templateName,
    title: title.trim() || undefined,
    url: url.trim() || undefined,
    description: description.trim() || undefined,
    color: color.trim() || undefined,
    authorName: authorName.trim() || undefined,
    authorUrl: authorUrl.trim() || undefined,
    authorIconUrl: authorIconUrl.trim() || undefined,
    footerText: footerText.trim() || undefined,
    footerIconUrl: footerIconUrl.trim() || undefined,
    timestamp,
    thumbnailUrl: thumbnailUrl.trim() || undefined,
    imageUrl: imageUrl.trim() || undefined,
    fields,
  };

  async function handleSaveTemplate() {
    setError(null);
    setValidationErrors([]);
    setSuccess(null);
    setSaving(true);

    try {
      const urlPath = activeTemplateId
        ? `/api/guilds/${guildId}/embeds/${activeTemplateId}`
        : `/api/guilds/${guildId}/embeds`;
      const method = activeTemplateId ? "PUT" : "POST";

      const res = await fetch(urlPath, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(embedPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          setValidationErrors(data.details);
        } else {
          setError(data.error || "Failed to save template.");
        }
        return;
      }

      setSuccess("Embed template saved successfully!");
      if (!activeTemplateId) {
        setTemplates([data.embed, ...templates]);
        setActiveTemplateId(data.embed.id);
      } else {
        setTemplates(templates.map((t) => (t.id === activeTemplateId ? data.embed : t)));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving embed template");
    } finally {
      setSaving(false);
    }
  }

  function handleChannelInput(raw: string) {
    const trimmed = raw.trim();
    const cleanName = trimmed.replace(/^#/, "");
    const match = channels.find(
      (c) => c.id === trimmed || c.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (match) {
      setSelectedChannelId(match.id);
      setChannelName(match.name);
    } else {
      setSelectedChannelId(trimmed);
      setChannelName(cleanName);
    }
  }

  async function handleAiGenerateEmbed() {
    try {
      setAiGenerating(true);
      setError(null);
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "embed",
          prompt: aiPrompt.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || "Failed to generate AI embed");
      }
      const g = json.data;
      if (g.title) setTitle(g.title);
      if (g.description) setDescription(g.description);
      if (g.color) setColor(g.color);
      if (g.authorName) setAuthorName(g.authorName);
      if (g.footerText) setFooterText(g.footerText);
      if (g.imageUrl) setImageUrl(g.imageUrl);
      if (g.thumbnailUrl) setThumbnailUrl(g.thumbnailUrl);
      if (Array.isArray(g.fields) && g.fields.length > 0) setFields(g.fields);
      setAiModalOpen(false);
      setSuccess("✨ AI Embed generated! Review live preview on the right.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error generating AI embed");
    } finally {
      setAiGenerating(false);
    }
  }

  async function handlePublish() {
    setError(null);
    setValidationErrors([]);
    setSuccess(null);

    const targetChannel = selectedChannelId || channelName.trim();
    if (!targetChannel) {
      setError("Please select or type a target channel to publish to.");
      return;
    }

    try {
      setPublishing(true);
      const res = await fetch(`/api/guilds/${guildId}/embeds/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: targetChannel,
          embed: embedPayload,
          templateId: activeTemplateId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          setValidationErrors(data.details);
        } else {
          setError(data.error || "Failed to publish embed to Discord.");
        }
        return;
      }

      setSuccess(`🎉 Embed successfully published to selected channel! (Message ID: ${data.messageId})`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error publishing embed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Title & AI Generator Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-discord-fuchsia" />
            <span>Discord Embed Builder &amp; Live Preview</span>
          </h1>
          <p className="text-sm text-discord-muted mt-1">
            Compose rich Discord embeds with real-time limit validation, inspect the pixel-accurate preview, and publish
            instantly to any channel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAiModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-discord-blurple to-discord-fuchsia hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-discord-fuchsia/20 transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-discord-yellow" />
          <span>✨ AI Generate Embed</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl border border-discord-red/40 bg-discord-red/10 text-discord-red flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl border border-discord-red/40 bg-discord-red/10 text-discord-red space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Embed Limits Exceeded:
          </p>
          <ul className="list-disc pl-5 text-xs space-y-1">
            {validationErrors.map((e, idx) => (
              <li key={idx}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Embed Editor Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-6">
            {/* Top Toolbar: Template Name & Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-sm text-white focus:outline-none focus:border-discord-fuchsia"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Publish to Channel
                </label>
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-sm text-white focus:outline-none focus:border-discord-fuchsia"
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Author Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-discord-muted uppercase tracking-wider">Author</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Author Name"
                  maxLength={DISCORD_LIMITS.AUTHOR_NAME_MAX}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-discord-muted focus:outline-none focus:border-discord-fuchsia"
                />
                <input
                  type="text"
                  placeholder="Author URL"
                  value={authorUrl}
                  onChange={(e) => setAuthorUrl(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-discord-muted focus:outline-none focus:border-discord-fuchsia"
                />
                <input
                  type="text"
                  placeholder="Author Icon URL"
                  value={authorIconUrl}
                  onChange={(e) => setAuthorIconUrl(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-discord-muted focus:outline-none focus:border-discord-fuchsia"
                />
              </div>
            </div>

            {/* Title & URL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-discord-muted uppercase tracking-wider">Title</h3>
                <span className="text-[11px] text-discord-muted font-mono">
                  {title.length}/{DISCORD_LIMITS.TITLE_MAX}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Embed Title"
                  maxLength={DISCORD_LIMITS.TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white placeholder-discord-muted focus:outline-none focus:border-discord-fuchsia"
                />
                <input
                  type="text"
                  placeholder="Title Link URL (https://...)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white placeholder-discord-muted focus:outline-none focus:border-discord-fuchsia"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-discord-muted uppercase tracking-wider">Description</h3>
                <span className="text-[11px] text-discord-muted font-mono">
                  {description.length}/{DISCORD_LIMITS.DESCRIPTION_MAX}
                </span>
              </div>
              <textarea
                rows={4}
                placeholder="Markdown description..."
                maxLength={DISCORD_LIMITS.DESCRIPTION_MAX}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white placeholder-discord-muted focus:outline-none focus:border-discord-fuchsia"
              />
            </div>

            {/* Color Selector */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-discord-muted uppercase tracking-wider">Embed Color</h3>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-28 px-3 py-2 rounded-lg bg-discord-dark border border-white/10 text-xs font-mono text-white focus:outline-none"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setColor(p.hex)}
                      className="w-6 h-6 rounded-md border border-white/10 transition hover:scale-110"
                      style={{ backgroundColor: p.hex }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-discord-muted uppercase tracking-wider">Media URLs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Thumbnail URL (top-right small icon)"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-discord-muted focus:outline-none focus:border-discord-fuchsia"
                />
                <input
                  type="text"
                  placeholder="Image URL (large banner image)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-discord-muted focus:outline-none focus:border-discord-fuchsia"
                />
              </div>
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-discord-muted uppercase tracking-wider">
                  Fields ({fields.length}/{DISCORD_LIMITS.FIELDS_MAX})
                </h3>
                <button
                  type="button"
                  onClick={addField}
                  disabled={fields.length >= DISCORD_LIMITS.FIELDS_MAX}
                  className="px-2.5 py-1 rounded-lg bg-discord-dark hover:bg-white/5 text-xs text-discord-blurple font-medium border border-white/5 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Field
                </button>
              </div>

              {fields.map((field, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-discord-dark border border-white/5 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-discord-muted font-mono">Field #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeField(idx)}
                      className="text-discord-muted hover:text-discord-red transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Field Title"
                      maxLength={DISCORD_LIMITS.FIELD_NAME_MAX}
                      value={field.name}
                      onChange={(e) => updateField(idx, "name", e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-discord-card border border-white/10 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Field Value"
                      maxLength={DISCORD_LIMITS.FIELD_VALUE_MAX}
                      value={field.value}
                      onChange={(e) => updateField(idx, "value", e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-discord-card border border-white/10 text-xs text-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={field.inline}
                      onChange={(e) => updateField(idx, "inline", e.target.checked)}
                      className="rounded bg-discord-card border-white/10 text-discord-fuchsia focus:ring-0"
                    />
                    <span>Display inline</span>
                  </label>
                </div>
              ))}
            </div>

            {/* Footer & Timestamp */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-discord-muted uppercase tracking-wider">Footer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Footer Text"
                  maxLength={DISCORD_LIMITS.FOOTER_TEXT_MAX}
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-discord-muted focus:outline-none focus:border-discord-fuchsia"
                />
                <input
                  type="text"
                  placeholder="Footer Icon URL"
                  value={footerIconUrl}
                  onChange={(e) => setFooterIconUrl(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-discord-muted focus:outline-none focus:border-discord-fuchsia"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={timestamp}
                  onChange={(e) => setTimestamp(e.target.checked)}
                  className="rounded bg-discord-card border-white/10 text-discord-fuchsia focus:ring-0"
                />
                <span>Include current timestamp</span>
              </label>
            </div>

            {/* Discord Total Character Limit Meter */}
            <div className="p-3 rounded-xl bg-discord-dark border border-white/5 flex items-center justify-between text-xs">
              <span className="text-discord-muted">Total Characters</span>
              <span
                className={`font-mono font-bold ${
                  totalCharacters > DISCORD_LIMITS.TOTAL_CHAR_MAX
                    ? "text-discord-red"
                    : "text-slate-300"
                }`}
              >
                {totalCharacters} / {DISCORD_LIMITS.TOTAL_CHAR_MAX}
              </span>
            </div>

            {/* Target Channel & Action Buttons */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="p-3.5 rounded-xl bg-discord-dark border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Destination Channel
                  </label>
                  <button
                    type="button"
                    onClick={() => setChannelMode(channelMode === "select" ? "custom" : "select")}
                    className="text-xs text-discord-blurple hover:underline font-normal"
                  >
                    {channelMode === "select" ? "⌨️ Type Name or ID" : "📋 Choose from list"}
                  </button>
                </div>

                {channelMode === "custom" ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Type channel name (e.g. general) or paste Channel ID"
                      value={channelName || selectedChannelId}
                      onChange={(e) => handleChannelInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-discord-card border border-white/10 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-discord-fuchsia"
                    />
                    <div className="flex items-center justify-between text-[11px] text-discord-muted">
                      <span>Channel: <strong className="text-white">#{channelName || selectedChannelId || "None"}</strong></span>
                      <span>ID: <code className="text-discord-yellow">{selectedChannelId || "Resolves on publish"}</code></span>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedChannelId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedChannelId(val);
                      const match = channels.find((c) => c.id === val);
                      if (match) setChannelName(match.name);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-discord-card border border-white/10 text-xs text-white focus:outline-none focus:border-discord-fuchsia"
                  >
                    <option value="">-- Choose a Channel --</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        #{c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-discord-dark hover:bg-white/5 border border-white/10 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Template</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-6 py-2.5 rounded-xl bg-discord-fuchsia hover:bg-pink-600 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-discord-fuchsia/20 cursor-pointer"
                >
                  {publishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Publish to Discord</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Discord Preview & Saved Templates (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Container */}
          <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                <Eye className="w-4 h-4 text-discord-blurple" /> Live Discord Client Preview
              </div>
              <span className="text-[10px] text-discord-muted bg-discord-dark px-2 py-0.5 rounded">
                Dark Mode
              </span>
            </div>

            {/* Discord Message Simulator */}
            <div className="bg-[#313338] p-4 rounded-xl text-slate-100 font-sans text-sm space-y-2 select-none shadow-inner">
              {/* Message Header (Bot Name & Tag) */}
              <div className="flex items-center gap-2.5">
                <img
                  src="/pfp.png"
                  alt="Paradox"
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
                />
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-white text-sm">Paradox</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#5865F2] text-white font-bold leading-none uppercase">
                    APP
                  </span>
                  <span className="text-[11px] text-[#949ba4]">Today at 12:00 PM</span>
                </div>
              </div>

              {/* The Embed Box */}
              <div
                className="ml-11 border-l-4 rounded bg-[#2b2d31] p-3.5 space-y-3 max-w-full"
                style={{ borderLeftColor: color || "#5865F2" }}
              >
                {/* Author */}
                {authorName && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    {authorIconUrl && (
                      <img
                        src={authorIconUrl}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    <span>{authorName}</span>
                  </div>
                )}

                {/* Title */}
                {title && (
                  <div className="font-bold text-white text-base">
                    {url ? (
                      <span className="text-[#00a8fc] hover:underline cursor-pointer">
                        {title}
                      </span>
                    ) : (
                      title
                    )}
                  </div>
                )}

                {/* Description */}
                {description && (
                  <div className="text-xs text-[#dbdee1] leading-relaxed">
                    <DiscordMarkdown content={description} />
                  </div>
                )}

                {/* Fields */}
                {fields.length > 0 && (
                  <div className="grid grid-cols-12 gap-2 pt-1">
                    {fields.map((f, i) => (
                      <div
                        key={i}
                        className={`${f.inline ? "col-span-4" : "col-span-12"} space-y-0.5`}
                      >
                        <div className="text-[11px] font-bold text-[#dbdee1]">{f.name}</div>
                        <div className="text-xs text-[#b5bac1]">
                          <DiscordMarkdown content={f.value} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Banner */}
                {imageUrl && (
                  <div className="pt-2">
                    <img
                      src={imageUrl}
                      alt=""
                      className="rounded-lg max-h-48 w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}

                {/* Footer & Timestamp */}
                {(footerText || timestamp) && (
                  <div className="flex items-center gap-2 pt-2 text-[10px] text-[#949ba4]">
                    {footerIconUrl && (
                      <img
                        src={footerIconUrl}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    <span>{footerText}</span>
                    {footerText && timestamp && <span>•</span>}
                    {timestamp && <span>Today at 12:00 PM</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Saved Templates Box */}
          <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Saved Templates ({templates.length})</span>
            </h3>

            {templates.length === 0 ? (
              <p className="text-xs text-discord-muted">No templates saved yet.</p>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-discord-dark border border-white/5 hover:border-discord-fuchsia/40 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white text-xs">{t.name}</div>
                      <div className="text-[10px] text-discord-muted truncate max-w-[200px]">
                        {t.title || "No Title"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadTemplate(t)}
                      className="px-2.5 py-1 rounded-lg bg-discord-card hover:bg-white/10 text-xs text-discord-fuchsia font-medium border border-white/5"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Modal for Embed Builder */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-discord-card border border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <Sparkles className="w-5 h-5 text-discord-fuchsia" />
                <span>AI Embed Generator</span>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="text-discord-muted hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-discord-muted leading-relaxed">
              Describe what kind of announcement or message you want to compose (e.g. <em>&quot;Server rules announcement with 3 clean rule points&quot;</em> or <em>&quot;Weekly Minecraft Game Night event with time, prize, and voice channel info&quot;</em>). The AI will design a complete Discord embed with titles, descriptions, theme colors, and structured fields!
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Describe the Embed Topic or Purpose
              </label>
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Welcome announcement for new members with server guidelines, key channels, and Discord invite link"
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-discord-fuchsia"
              />
            </div>

            {/* Quick Inspiration Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "📜 Server Rules", text: "Server rules with 4 clear guidelines on respect, no spam, Discord TOS, and staff discretion" },
                  { label: "🎉 Game Night Event", text: "Weekly community gaming tournament this Saturday at 7 PM EST with Discord Nitro prizes" },
                  { label: "📢 Major Server Update", text: "Important server update announcing new visual role decks, improved bot commands, and channels" },
                  { label: "🎁 Nitro Giveaway", text: "Special community giveaway for 1 Month Discord Nitro ending in 48 hours" },
                  { label: "✨ New Member Welcome", text: "Welcome guide for new server members with rules channel, roles setup, and introduction chat" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAiPrompt(preset.text)}
                    className="px-2.5 py-1 rounded-lg bg-discord-dark hover:bg-white/10 border border-white/5 text-[11px] text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-discord-dark hover:bg-white/5 border border-white/10 text-xs font-semibold text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={aiGenerating}
                onClick={handleAiGenerateEmbed}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-discord-blurple to-discord-fuchsia hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-discord-fuchsia/20 transition cursor-pointer"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-discord-yellow" />
                    <span>Generate Embed</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
