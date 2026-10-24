"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { RoleSelect, DiscordRoleItem } from "@/components/ui/RoleSelect";
import { VariableMenu } from "@/components/ui/VariableMenu";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

export default function WelcomePage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [roles, setRoles] = useState<DiscordRoleItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Welcome settings state
  const [enabled, setEnabled] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [message, setMessage] = useState(
    "Welcome to {server.name}, {user.mention}! 🎉 Please make sure to check out our guidelines and introduce yourself!"
  );
  const [sendEmbed, setSendEmbed] = useState(true);
  const [embedTitle, setEmbedTitle] = useState("👋 Welcome to our Community!");
  const [embedDescription, setEmbedDescription] = useState(
    "We are thrilled to have you here, {user.mention}! Check out our channels to get started:\n\n• Read the rules in {#rules}\n• Grab your vanity roles in {#roles}\n• Introduce yourself in {#general}"
  );
  const [embedColor, setEmbedColor] = useState("#5865F2");
  const [embedAuthorName, setEmbedAuthorName] = useState("{user.name}");
  const [embedAuthorIconUrl, setEmbedAuthorIconUrl] = useState("{user.avatar}");
  const [useUserAvatarThumb, setUseUserAvatarThumb] = useState(true);
  const [embedImageUrl, setEmbedImageUrl] = useState("");
  const [embedThumbnailUrl, setEmbedThumbnailUrl] = useState("{user.avatar}");
  const [embedFooter, setEmbedFooter] = useState("Member Joined • Paradox System");

  // Welcome DM & Auto-role
  const [dmEnabled, setDmEnabled] = useState(false);
  const [dmMessage, setDmMessage] = useState(
    "Hey {user.name}! Welcome to {server.name}. If you need any assistance, reach out to staff!"
  );
  const [autoRoleId, setAutoRoleId] = useState("");

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
                if (parsed.imageUrl) setEmbedImageUrl(parsed.imageUrl);
                if (parsed.thumbnailUrl !== undefined) {
                  setEmbedThumbnailUrl(parsed.thumbnailUrl || "");
                  setUseUserAvatarThumb(
                    parsed.thumbnailUrl?.includes("{user.avatar}") ||
                    parsed.thumbnailUrl?.includes("{user.pfp}")
                  );
                }
                if (parsed.footerText) setEmbedFooter(parsed.footerText);
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
                thumbnailUrl: useUserAvatarThumb ? "{user.avatar}" : embedThumbnailUrl || null,
                footerText: embedFooter,
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
                thumbnailUrl: useUserAvatarThumb ? "{user.avatar}" : embedThumbnailUrl || null,
                footerText: embedFooter,
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

  // Build channel map for preview
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
            Greet new members automatically with custom text, rich embeds, channel chips, and auto-roles.
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
                onInsert={(v) => setMessage((prev) => prev + " " + v)}
              />
            </div>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Welcome {user.mention} to {server.name}!! 🎉"
              className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple leading-relaxed"
            />
            <p className="text-[11px] text-zinc-500">
              Tip: Use the Insert Variable button to mention users, server stats, or insert multiple channel links!
            </p>
          </div>

          {/* Rich Embed Toggle & Customizer */}
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-xs font-bold text-white">Attach Rich Discord Embed</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Send a formatted visual card with title, description, and images.
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
                {/* Member PFP & Name Personalization Card */}
                <div className="p-4 rounded-xl bg-discord-dark/70 border border-discord-blurple/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-discord-blurple" />
                      <span>Member PFP &amp; Name Personalization</span>
                    </div>
                    <span className="text-[10px] font-mono text-discord-blurple px-2 py-0.5 rounded bg-discord-blurple/10 border border-discord-blurple/20">
                      Dynamic Discord Avatar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !useUserAvatarThumb;
                        setUseUserAvatarThumb(next);
                        if (next) setEmbedThumbnailUrl("{user.avatar}");
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        useUserAvatarThumb
                          ? "bg-discord-blurple/15 border-discord-blurple text-white"
                          : "bg-discord-dark border-white/5 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">🖼️ Member PFP as Thumbnail</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Embed thumbnail shows newcomer&apos;s avatar</div>
                      </div>
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          useUserAvatarThumb ? "text-discord-blurple" : "text-zinc-600"
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (embedAuthorName) {
                          setEmbedAuthorName("");
                          setEmbedAuthorIconUrl("");
                        } else {
                          setEmbedAuthorName("{user.name}");
                          setEmbedAuthorIconUrl("{user.avatar}");
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        Boolean(embedAuthorName)
                          ? "bg-discord-blurple/15 border-discord-blurple text-white"
                          : "bg-discord-dark border-white/5 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">👤 Member Name in Header</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Author header displays member name &amp; avatar</div>
                      </div>
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          Boolean(embedAuthorName) ? "text-discord-blurple" : "text-zinc-600"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Embed Title & Color */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Embed Title</label>
                    <input
                      type="text"
                      value={embedTitle}
                      onChange={(e) => setEmbedTitle(e.target.value)}
                      placeholder="e.g. 👋 Welcome aboard!"
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

                {/* Embed Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Description</label>
                    <VariableMenu
                      channels={channels}
                      onInsert={(v) => setEmbedDescription((prev) => prev + " " + v)}
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={embedDescription}
                    onChange={(e) => setEmbedDescription(e.target.value)}
                    placeholder="Provide onboarding instructions and channel links..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple leading-relaxed"
                  />
                </div>

                {/* Media Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Banner Image URL</label>
                    <input
                      type="url"
                      value={embedImageUrl}
                      onChange={(e) => setEmbedImageUrl(e.target.value)}
                      placeholder="https://.../banner.gif"
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Thumbnail URL</label>
                    <input
                      type="url"
                      value={embedThumbnailUrl}
                      onChange={(e) => setEmbedThumbnailUrl(e.target.value)}
                      placeholder="https://.../logo.png"
                      className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Footer Text</label>
                  <input
                    type="text"
                    value={embedFooter}
                    onChange={(e) => setEmbedFooter(e.target.value)}
                    placeholder="e.g. Paradox Welcome • Server Community"
                    className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                  />
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
                <textarea
                  rows={2}
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                  placeholder="Direct message greeting..."
                  className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
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
            imageUrl={embedImageUrl}
            thumbnailUrl={sendEmbed ? (useUserAvatarThumb ? "{user.avatar}" : embedThumbnailUrl) : undefined}
            footerText={sendEmbed ? embedFooter : undefined}
            timestamp={true}
            channelMap={channelMap}
          />

          <div className="p-4 rounded-xl bg-discord-dark/60 border border-white/5 space-y-2 text-xs text-zinc-400">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>💡 Dynamic Placeholders Supported</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              When sent to Discord, <code className="text-discord-blurple font-mono">{"{user.mention}"}</code> resolves to the newcomer&apos;s mention, and channel tags like <code className="text-discord-blurple font-mono">{"<#channelId>"}</code> become clickable Discord channel links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
