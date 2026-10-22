"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Smile,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Hash,
  ShieldAlert,
  Sparkles,
  Image as ImageIcon,
  Film,
  Send,
  Eye,
  Layers,
  Bot,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { DiscordMarkdown } from "@/lib/discordMarkdown";

interface Channel {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  managed: boolean;
  assignableByBot: boolean;
}

interface ReactionRoleItem {
  id: string;
  channelId: string;
  messageId: string;
  emoji: string;
  roleId: string;
  roleName: string;
  description: string | null;
  type: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  confirmGif: string | null;
  buttonStyle: string | null;
  createdAt: string;
}

interface VisualRoleItem {
  roleId: string;
  roleName: string;
  emoji: string;
  description: string;
  imageUrl: string;
  confirmGif: string;
  buttonStyle: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER";
  customInput?: boolean;
}

export default function ReactionRolesPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [activeTab, setActiveTab] = useState<"deck" | "single">("deck");
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [reactionRoles, setReactionRoles] = useState<ReactionRoleItem[]>([]);

  // Studio Deck State
  const [deckChannelId, setDeckChannelId] = useState("");
  const [deckChannelName, setDeckChannelName] = useState("");
  const [deckChannelMode, setDeckChannelMode] = useState<"select" | "custom">("select");
  const [deckTitle, setDeckTitle] = useState("✨ Unlock Your Roles & Perks");
  const [deckDescription, setDeckDescription] = useState(
    "Choose your notification and community roles below. Each role grants special channel access and custom perks!"
  );
  const [deckColor, setDeckColor] = useState("#5865F2");
  const [deckBannerUrl, setDeckBannerUrl] = useState(
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2JvZTVocndobnIycmlpcXRvMXc2MHphZXcyejkyOW8xMWVlaGtwYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oKIPnAiaMCws8nOsE/giphy.gif"
  );
  const [deckType, setDeckType] = useState<"BUTTON" | "REACTION" | "SELECT_MENU">("BUTTON");

  // AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiChannelId, setAiChannelId] = useState("");
  const [aiSelectedRoleIds, setAiSelectedRoleIds] = useState<string[]>([]);

  // Bulk Role Picker State
  const [serverRolePickerOpen, setServerRolePickerOpen] = useState(false);
  const [bulkSelectedRoleIds, setBulkSelectedRoleIds] = useState<string[]>([]);
  const [roleSearchQuery, setRoleSearchQuery] = useState("");

  const [deckRoles, setDeckRoles] = useState<VisualRoleItem[]>([
    {
      roleId: "",
      roleName: "Gamer",
      emoji: "🎮",
      description: "Access gaming channels, tournaments, and matchmaking pings.",
      imageUrl: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
      confirmGif: "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
      buttonStyle: "PRIMARY",
    },
    {
      roleId: "",
      roleName: "Announcements",
      emoji: "🔔",
      description: "Get notified for major community updates and live stream alerts.",
      imageUrl: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif",
      confirmGif: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
      buttonStyle: "SUCCESS",
    },
  ]);

  // Single Reaction Role State
  const [singleChannelId, setSingleChannelId] = useState("");
  const [singleChannelName, setSingleChannelName] = useState("");
  const [singleChannelMode, setSingleChannelMode] = useState<"select" | "custom">("select");
  const [singleMessageId, setSingleMessageId] = useState("");
  const [singleEmoji, setSingleEmoji] = useState("⭐");
  const [singleRoleId, setSingleRoleId] = useState("");
  const [singleRoleName, setSingleRoleName] = useState("");
  const [singleRoleMode, setSingleRoleMode] = useState<"select" | "custom">("select");
  const [singleRoleCustomInput, setSingleRoleCustomInput] = useState("");
  const [singleDesc, setSingleDesc] = useState("");
  const [singleBadgeUrl, setSingleBadgeUrl] = useState("");
  const [singleConfirmGif, setSingleConfirmGif] = useState("");

  const [deploying, setDeploying] = useState(false);
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [refreshingRoles, setRefreshingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function reloadRoles() {
    try {
      setRefreshingRoles(true);
      setError(null);
      const res = await fetch(`/api/guilds/${guildId}/roles`);
      if (res.ok) {
        const data = await res.json();
        const loaded: Role[] = data.roles || [];
        setRoles(loaded);
        if (loaded.length > 0) {
          setSuccess(`✅ Successfully refreshed ${loaded.length} roles from Discord!`);
        } else {
          setError("Discord returned 0 roles. You can type role names directly.");
        }
      } else {
        setError("Failed to fetch roles from Discord API. You can still type role names directly.");
      }
    } catch {
      setError("Network error fetching roles. You can still type role names directly.");
    } finally {
      setRefreshingRoles(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);

        const [channelsRes, rolesRes, listRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/roles`),
          fetch(`/api/guilds/${guildId}/reaction-roles`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
          if (cData.channels?.length > 0) {
            setDeckChannelId(cData.channels[0].id);
            setDeckChannelName(cData.channels[0].name);
            setSingleChannelId(cData.channels[0].id);
            setSingleChannelName(cData.channels[0].name);
          }
        }

        if (rolesRes.ok) {
          const rData = await rolesRes.json();
          const loadedRoles: Role[] = rData.roles || [];
          setRoles(loadedRoles);

          const preferredRoles = loadedRoles.filter((r) => r.assignableByBot);
          const pool = preferredRoles.length > 0 ? preferredRoles : loadedRoles;
          if (pool.length > 0) {
            setSingleRoleId(pool[0].id);
            setSingleRoleName(pool[0].name);
            setSingleRoleCustomInput(pool[0].name);
            setDeckRoles((prev) =>
              prev.map((item, idx) => ({
                ...item,
                roleId: pool[idx % pool.length]?.id || pool[0].id,
                roleName: pool[idx % pool.length]?.name || pool[0].name,
              }))
            );
          }
        }

        if (listRes.ok) {
          const lData = await listRes.json();
          setReactionRoles(lData.reactionRoles || []);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load roles.");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) {
      init();
    }
  }, [guildId]);

  function updateDeckRole(index: number, key: keyof VisualRoleItem, value: any) {
    const updated = [...deckRoles];
    if (key === "roleId") {
      const match = roles.find((r) => r.id === value || r.name.toLowerCase() === String(value).toLowerCase());
      updated[index] = {
        ...updated[index],
        roleId: match ? match.id : value,
        roleName: match ? match.name : updated[index].roleName || "Role",
      };
    } else {
      updated[index] = { ...updated[index], [key]: value };
    }
    setDeckRoles(updated);
  }

  function handleCustomRoleInput(index: number, raw: string) {
    const trimmed = raw.trim();
    const updated = [...deckRoles];

    const byId = roles.find((r) => r.id === trimmed);
    if (byId) {
      updated[index] = {
        ...updated[index],
        roleId: byId.id,
        roleName: byId.name,
      };
      setDeckRoles(updated);
      return;
    }

    const byName = roles.find((r) => r.name.toLowerCase() === trimmed.toLowerCase());
    if (byName) {
      updated[index] = {
        ...updated[index],
        roleId: byName.id,
        roleName: byName.name,
      };
      setDeckRoles(updated);
      return;
    }

    if (/^\d{17,21}$/.test(trimmed)) {
      updated[index] = {
        ...updated[index],
        roleId: trimmed,
      };
    } else {
      updated[index] = {
        ...updated[index],
        roleName: raw,
        roleId: trimmed,
      };
    }
    setDeckRoles(updated);
  }

  function handleSingleCustomRoleInput(raw: string) {
    setSingleRoleCustomInput(raw);
    const trimmed = raw.trim();

    const byId = roles.find((r) => r.id === trimmed);
    if (byId) {
      setSingleRoleId(byId.id);
      setSingleRoleName(byId.name);
      return;
    }

    const byName = roles.find((r) => r.name.toLowerCase() === trimmed.toLowerCase());
    if (byName) {
      setSingleRoleId(byName.id);
      setSingleRoleName(byName.name);
      return;
    }

    if (/^\d{17,21}$/.test(trimmed)) {
      setSingleRoleId(trimmed);
    } else {
      setSingleRoleName(raw);
      setSingleRoleId(trimmed);
    }
  }

  function handleDeckChannelInput(raw: string) {
    const trimmed = raw.trim();
    const cleanName = trimmed.replace(/^#/, "");

    const byId = channels.find((c) => c.id === trimmed);
    if (byId) {
      setDeckChannelId(byId.id);
      setDeckChannelName(byId.name);
      return;
    }

    const byName = channels.find((c) => c.name.toLowerCase() === cleanName.toLowerCase());
    if (byName) {
      setDeckChannelId(byName.id);
      setDeckChannelName(byName.name);
      return;
    }

    const cleanTarget = cleanName.toLowerCase().replace(/[\s\-_•^⭐*#]/g, "");
    if (cleanTarget) {
      const fuzzy = channels.find((c) => {
        const cClean = c.name.toLowerCase().replace(/[\s\-_•^⭐*#]/g, "");
        return cClean === cleanTarget || cClean.includes(cleanTarget) || cleanTarget.includes(cClean);
      });
      if (fuzzy) {
        setDeckChannelId(fuzzy.id);
        setDeckChannelName(fuzzy.name);
        return;
      }
    }

    setDeckChannelId(trimmed);
    setDeckChannelName(cleanName);
  }

  function handleSingleChannelInput(raw: string) {
    const trimmed = raw.trim();
    const cleanName = trimmed.replace(/^#/, "");

    const byId = channels.find((c) => c.id === trimmed);
    if (byId) {
      setSingleChannelId(byId.id);
      setSingleChannelName(byId.name);
      return;
    }

    const byName = channels.find((c) => c.name.toLowerCase() === cleanName.toLowerCase());
    if (byName) {
      setSingleChannelId(byName.id);
      setSingleChannelName(byName.name);
      return;
    }

    const cleanTarget = cleanName.toLowerCase().replace(/[\s\-_•^⭐*#]/g, "");
    if (cleanTarget) {
      const fuzzy = channels.find((c) => {
        const cClean = c.name.toLowerCase().replace(/[\s\-_•^⭐*#]/g, "");
        return cClean === cleanTarget || cClean.includes(cleanTarget) || cleanTarget.includes(cClean);
      });
      if (fuzzy) {
        setSingleChannelId(fuzzy.id);
        setSingleChannelName(fuzzy.name);
        return;
      }
    }

    setSingleChannelId(trimmed);
    setSingleChannelName(cleanName);
  }

  async function handleAiGenerateDeck() {
    try {
      setAiGenerating(true);
      setError(null);

      // 1. Sync target channel if chosen in AI modal
      if (aiChannelId) {
        setDeckChannelId(aiChannelId);
        const match = channels.find((c) => c.id === aiChannelId);
        if (match) setDeckChannelName(match.name);
      }

      // 2. Prepare roles payload: prioritize checked server roles if selected
      let rolesPayloadToSend: any = undefined;
      if (aiSelectedRoleIds.length > 0) {
        const checked = roles.filter((r) => aiSelectedRoleIds.includes(r.id));
        rolesPayloadToSend = checked.map((r) => ({
          roleId: r.id,
          roleName: r.name,
          emoji: "⭐",
          description: `Unlock ${r.name} role and community permissions.`,
        }));
      }

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "role_deck",
          prompt: aiPrompt.trim() || undefined,
          roles: rolesPayloadToSend,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || "Failed to generate AI role deck");
      }

      const generated = json.data;
      if (generated.title) setDeckTitle(generated.title);
      if (generated.description) setDeckDescription(generated.description);
      if (generated.color) setDeckColor(generated.color);
      if (generated.bannerUrl) setDeckBannerUrl(generated.bannerUrl);
      if (generated.type) setDeckType(generated.type);

      if (Array.isArray(generated.roles) && generated.roles.length > 0) {
        const mappedRoles: VisualRoleItem[] = generated.roles.map((gr: any) => {
          const match = roles.find(
            (r) => r.id === gr.roleId || r.name.toLowerCase() === gr.roleName.toLowerCase()
          );
          return {
            roleId: match?.id || gr.roleId || "",
            roleName: match?.name || gr.roleName || "Role",
            emoji: gr.emoji || "✨",
            description: gr.description || "",
            imageUrl: gr.imageUrl || "",
            confirmGif: gr.confirmGif || "",
            buttonStyle: gr.buttonStyle || "PRIMARY",
            customInput: !match,
          };
        });
        setDeckRoles(mappedRoles);
      }

      setAiModalOpen(false);
      setSuccess("✨ Channel & Role Deck configured! Review the details and click Deploy.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to run AI generation");
    } finally {
      setAiGenerating(false);
    }
  }

  function applyBulkSelectedRoles() {
    if (bulkSelectedRoleIds.length === 0) {
      setServerRolePickerOpen(false);
      return;
    }

    const selected = roles.filter((r) => bulkSelectedRoleIds.includes(r.id));
    const newItems: VisualRoleItem[] = selected.map((r) => ({
      roleId: r.id,
      roleName: r.name,
      emoji: "⭐",
      description: `Unlock ${r.name} role and community perks.`,
      imageUrl: "",
      confirmGif: "",
      buttonStyle: "PRIMARY",
      customInput: false,
    }));

    setDeckRoles(newItems);
    setServerRolePickerOpen(false);
    setSuccess(`✅ Loaded ${newItems.length} server roles into the deck!`);
  }

  function addDeckRole() {
    if (deckRoles.length >= 25) return;
    const fallback = roles.length > 0 ? roles[0] : null;
    setDeckRoles([
      ...deckRoles,
      {
        roleId: fallback?.id || "",
        roleName: fallback?.name || "New Role",
        emoji: "⭐",
        description: "Unlock special community perks.",
        imageUrl: "",
        confirmGif: "",
        buttonStyle: "PRIMARY",
        customInput: false,
      },
    ]);
  }

  function removeDeckRole(index: number) {
    setDeckRoles(deckRoles.filter((_, i) => i !== index));
  }

  async function handleDeployDeck(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!deckChannelId) {
      setError("Please select a target channel.");
      return;
    }

    if (deckRoles.length === 0) {
      setError("Please add at least one role to deploy.");
      return;
    }

    // Verify all role cards have an identifier
    for (let i = 0; i < deckRoles.length; i++) {
      const r = deckRoles[i];
      if (!r.roleId && !r.roleName) {
        setError(`Role Card #${i + 1} needs a Role Name or Role ID.`);
        return;
      }
    }

    try {
      setDeploying(true);
      const sanitizedRoles = deckRoles.map((dr) => ({
        roleId: dr.roleId ? dr.roleId.trim() : undefined,
        roleName: dr.roleName.trim(),
        emoji: dr.emoji ? dr.emoji.trim() : "⭐",
        description: dr.description?.trim() || undefined,
        imageUrl: dr.imageUrl?.trim() || undefined,
        confirmGif: dr.confirmGif?.trim() || undefined,
        buttonStyle: dr.buttonStyle || "PRIMARY",
      }));

      const res = await fetch(`/api/guilds/${guildId}/reaction-roles/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: deckChannelId.trim(),
          title: deckTitle.trim(),
          description: deckDescription.trim() || undefined,
          color: deckColor,
          bannerUrl: deckBannerUrl.trim() || undefined,
          type: deckType,
          roles: sanitizedRoles,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details && data.details.fieldErrors) {
          const fieldMsgs = Object.entries(data.details.fieldErrors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
            .join(" | ");
          throw new Error(`Validation failed: ${fieldMsgs}`);
        }
        throw new Error(data.error || "Failed to deploy visual role deck.");
      }

      setSuccess(
        `🎉 Paradox Visual Role Deck deployed successfully to selected channel! (Message ID: ${data.messageId})`
      );

      // Refresh mappings list
      const listRes = await fetch(`/api/guilds/${guildId}/reaction-roles`);
      if (listRes.ok) {
        const lData = await listRes.json();
        setReactionRoles(lData.reactionRoles || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error deploying role deck");
    } finally {
      setDeploying(false);
    }
  }

  async function handleCreateSingle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const effectiveRoleId = singleRoleId || singleRoleCustomInput.trim();
    const effectiveRoleName = singleRoleName || singleRoleCustomInput.trim() || "Role";

    if (!effectiveRoleId && !effectiveRoleName) {
      setError("Please select or type a target role name or role ID.");
      return;
    }

    try {
      setSubmittingSingle(true);
      const res = await fetch(`/api/guilds/${guildId}/reaction-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: singleChannelId,
          messageId: singleMessageId.trim(),
          emoji: singleEmoji.trim(),
          roleId: effectiveRoleId,
          roleName: effectiveRoleName,
          description: singleDesc.trim() || undefined,
          type: "REACTION",
          imageUrl: singleBadgeUrl.trim() || undefined,
          confirmGif: singleConfirmGif.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to attach reaction role.");
      }

      setSuccess("Reaction role attached successfully!");
      setReactionRoles([data.reactionRole, ...reactionRoles]);
      setSingleMessageId("");
      setSingleDesc("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error attaching reaction role");
    } finally {
      setSubmittingSingle(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this role mapping?")) return;

    try {
      const res = await fetch(`/api/guilds/${guildId}/reaction-roles/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReactionRoles(reactionRoles.filter((item) => item.id !== id));
        setSuccess("Role mapping removed.");
      }
    } catch {
      setError("Failed to delete role mapping.");
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-discord-blurple/10 border border-discord-blurple/20 text-discord-blurple text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Paradox Exclusive Feature
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <Smile className="w-8 h-8 text-discord-blurple" />
          <span>Visual Role Decks & Reaction Roles</span>
        </h1>
        <p className="text-sm text-discord-muted mt-1 max-w-3xl">
          Unlike ordinary bots that only post plain emojis, Paradox lets you design <strong>rich visual role decks</strong> with
          animated banner GIFs, interactive buttons, custom role badges, and celebratory claim GIFs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 space-x-4">
        <button
          onClick={() => setActiveTab("deck")}
          className={`pb-3 px-2 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === "deck"
              ? "border-discord-blurple text-white"
              : "border-transparent text-discord-muted hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 text-discord-blurple" />
          <span>Visual Role Deck Studio</span>
        </button>

        <button
          onClick={() => setActiveTab("single")}
          className={`pb-3 px-2 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === "single"
              ? "border-discord-blurple text-white"
              : "border-transparent text-discord-muted hover:text-white"
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Link to Existing Message</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl border border-discord-red/40 bg-discord-red/10 text-discord-red flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* TAB 1: Visual Role Deck Studio */}
      {activeTab === "deck" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleDeployDeck} className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-6">
              <div className="border-b border-white/5 pb-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-discord-blurple" /> Visual Role Deck Builder
                  </h2>
                  <p className="text-xs text-discord-muted mt-1">
                    Design a visually striking role panel with animated images, GIFs, and interactive controls.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-discord-blurple to-discord-fuchsia hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-discord-blurple/25 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-discord-yellow" />
                    <span>✨ AI Auto-Build</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeployDeck()}
                    disabled={deploying}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition cursor-pointer"
                  >
                    {deploying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deploying...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>🚀 Deploy to Discord</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Channel & Display Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Target Channel
                    </label>
                    <button
                      type="button"
                      onClick={() => setDeckChannelMode(deckChannelMode === "select" ? "custom" : "select")}
                      className="text-xs text-discord-blurple hover:underline font-normal"
                    >
                      {deckChannelMode === "select" ? "⌨️ Type Name or ID" : "📋 Choose from list"}
                    </button>
                  </div>

                  {deckChannelMode === "custom" ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Type channel name (e.g. general) or paste Channel ID"
                        value={deckChannelName || deckChannelId}
                        onChange={(e) => handleDeckChannelInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-discord-blurple"
                      />
                      <div className="flex items-center justify-between text-[11px] text-discord-muted">
                        <span>Channel: <strong className="text-white">#{deckChannelName || deckChannelId || "None"}</strong></span>
                        <span>ID: <code className="text-discord-yellow">{deckChannelId || "Resolves on deploy"}</code></span>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={deckChannelId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDeckChannelId(val);
                        const match = channels.find((c) => c.id === val);
                        if (match) setDeckChannelName(match.name);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white focus:outline-none focus:border-discord-blurple"
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Interaction Style
                  </label>
                  <select
                    value={deckType}
                    onChange={(e) => setDeckType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white focus:outline-none focus:border-discord-blurple"
                  >
                    <option value="BUTTON">Interactive Discord Buttons (Recommended)</option>
                    <option value="SELECT_MENU">Dropdown Role Select Menu</option>
                    <option value="REACTION">Classic Reaction Emojis</option>
                  </select>
                </div>
              </div>

              {/* Title & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Deck Title
                  </label>
                  <input
                    type="text"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white focus:outline-none focus:border-discord-blurple"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={deckColor}
                      onChange={(e) => setDeckColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={deckColor}
                      onChange={(e) => setDeckColor(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Panel Description
                </label>
                <textarea
                  rows={2}
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                />
              </div>

              {/* Header Banner Image / Animated GIF */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-discord-blurple" />
                  <span>Header Banner Image or Animated GIF URL</span>
                </label>
                <input
                  type="text"
                  placeholder="https://... (Supports GIFs, Discord CDN, Tenor, Giphy, Imgur)"
                  value={deckBannerUrl}
                  onChange={(e) => setDeckBannerUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white font-mono placeholder-discord-muted focus:outline-none focus:border-discord-blurple"
                />
              </div>

              {/* Roles Deck List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-discord-muted uppercase tracking-wider">
                    Roles in Deck ({deckRoles.length}/25)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={refreshingRoles}
                      onClick={reloadRoles}
                      className="px-2 py-1 rounded-lg bg-discord-dark hover:bg-white/5 text-xs text-zinc-400 hover:text-white border border-white/5 flex items-center gap-1 disabled:opacity-50 transition cursor-pointer"
                      title="Fetch latest roles from Discord"
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshingRoles ? "animate-spin text-discord-blurple" : ""}`} />
                      <span>{refreshingRoles ? "Fetching..." : "Refresh Roles"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkSelectedRoleIds(deckRoles.map((dr) => dr.roleId).filter(Boolean));
                        setServerRolePickerOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-discord-blurple/20 hover:bg-discord-blurple/30 text-xs text-discord-blurple font-semibold border border-discord-blurple/30 flex items-center gap-1 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> 📋 Select Server Roles
                    </button>
                    <button
                      type="button"
                      onClick={addDeckRole}
                      className="px-2.5 py-1 rounded-lg bg-discord-dark hover:bg-white/5 text-xs text-discord-blurple font-semibold border border-white/5 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Card
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {deckRoles.map((dr, idx) => {
                    const matchedRole = roles.find((r) => r.id === dr.roleId);
                    const isTooHigh = matchedRole && !matchedRole.assignableByBot;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-discord-dark border border-white/5 space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-discord-blurple" />
                            Role Card #{idx + 1}
                          </span>
                          {deckRoles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDeckRole(idx)}
                              className="text-discord-muted hover:text-discord-red transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Role Select & Emoji */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-discord-muted uppercase font-semibold">Target Server Role</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...deckRoles];
                                  updated[idx] = { ...updated[idx], customInput: !updated[idx].customInput };
                                  setDeckRoles(updated);
                                }}
                                className="text-[10px] text-discord-blurple hover:underline font-medium"
                              >
                                {dr.customInput || roles.length === 0 ? "📋 Choose from list" : "⌨️ Type Name or Role ID"}
                              </button>
                            </div>

                            {dr.customInput || roles.length === 0 ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  placeholder="Type role name (e.g. Gamer) or paste Role ID"
                                  value={dr.roleId ? (dr.roleName && dr.roleName !== "Role" ? `${dr.roleName}` : dr.roleId) : dr.roleName}
                                  onChange={(e) => handleCustomRoleInput(idx, e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-discord-card border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple font-mono"
                                />
                                <div className="flex items-center justify-between text-[10px] text-discord-muted">
                                  <span>Role: <strong className="text-white">{dr.roleName}</strong></span>
                                  <span>ID: <code className="text-discord-yellow">{dr.roleId || "Resolves on deploy"}</code></span>
                                </div>
                              </div>
                            ) : (
                              <select
                                value={dr.roleId}
                                onChange={(e) => updateDeckRole(idx, "roleId", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-discord-card border border-white/10 text-xs text-white"
                              >
                                <option value="">-- Choose a Role --</option>
                                {roles.map((r) => (
                                  <option
                                    key={r.id}
                                    value={r.id}
                                    className="text-white bg-[#2b2d31]"
                                  >
                                    {r.name} {!r.assignableByBot && roles.some(x => x.assignableByBot) ? "⚠️ (Check Position)" : ""}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div>
                            <label className="text-[10px] text-discord-muted uppercase">Emoji / Icon</label>
                            <input
                              type="text"
                              value={dr.emoji}
                              onChange={(e) => updateDeckRole(idx, "emoji", e.target.value)}
                              placeholder="e.g. 🎮 or name:id"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-discord-card border border-white/10 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Perks / Description */}
                        <div>
                          <label className="text-[10px] text-discord-muted uppercase">Role Perks & Description</label>
                          <input
                            type="text"
                            value={dr.description}
                            onChange={(e) => updateDeckRole(idx, "description", e.target.value)}
                            placeholder="e.g. Unlocks access to #vip and private events"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-discord-card border border-white/10 text-xs text-white"
                          />
                        </div>

                        {/* Media: Custom Badge Image / Sticker & Claim Celebration GIF */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] text-discord-muted uppercase flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-discord-blurple" />
                              <span>Role Badge / Sticker GIF URL</span>
                            </label>
                            <input
                              type="text"
                              value={dr.imageUrl}
                              onChange={(e) => updateDeckRole(idx, "imageUrl", e.target.value)}
                              placeholder="https://... (Badge / Sticker icon)"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-discord-card border border-white/10 text-xs text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-discord-muted uppercase flex items-center gap-1">
                              <Film className="w-3 h-3 text-discord-fuchsia" />
                              <span>Claim Celebration GIF URL</span>
                            </label>
                            <input
                              type="text"
                              value={dr.confirmGif}
                              onChange={(e) => updateDeckRole(idx, "confirmGif", e.target.value)}
                              placeholder="https://... (Animated GIF on claim)"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-discord-card border border-white/10 text-xs text-white font-mono"
                            />
                          </div>
                        </div>

                        {/* Button Color if BUTTON mode */}
                        {deckType === "BUTTON" && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] text-discord-muted uppercase">Button Style:</span>
                            {(["PRIMARY", "SUCCESS", "SECONDARY", "DANGER"] as const).map((style) => (
                              <button
                                key={style}
                                type="button"
                                onClick={() => updateDeckRole(idx, "buttonStyle", style)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                                  dr.buttonStyle === style
                                    ? "ring-2 ring-white"
                                    : "opacity-60"
                                } ${
                                  style === "PRIMARY"
                                    ? "bg-discord-blurple text-white"
                                    : style === "SUCCESS"
                                    ? "bg-discord-green text-black"
                                    : style === "SECONDARY"
                                    ? "bg-zinc-600 text-white"
                                    : "bg-discord-red text-white"
                                }`}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                        )}

                        {isTooHigh && (
                          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>This role is higher than the bot in Discord. Move bot role above it.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit / Deploy Button */}
              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={deploying}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-discord-blurple to-indigo-600 hover:from-discord-blurple/90 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition flex items-center gap-2 shadow-lg shadow-discord-blurple/30"
                >
                  {deploying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deploying Deck to Discord...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Deploy Visual Role Deck to Channel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Discord Client Simulation (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                  <Eye className="w-4 h-4 text-discord-blurple" /> Live Discord Deck Simulation
                </div>
                <button
                  type="button"
                  onClick={() => handleDeployDeck()}
                  disabled={deploying}
                  className="px-3 py-1 rounded-lg bg-discord-blurple hover:bg-discord-blurple/90 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  {deploying ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Deploying...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>🚀 Deploy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Discord Message Simulator */}
              <div className="bg-[#313338] p-4 rounded-xl text-slate-100 font-sans text-sm space-y-3 select-none shadow-inner">
                {/* Header */}
                <div className="flex items-center gap-2.5">
                  <img
                    src="/pfp.png"
                    alt="Paradox"
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
                  />
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-white text-sm">Paradox</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#5865F2] text-white font-bold uppercase">
                      APP
                    </span>
                    <span className="text-[11px] text-[#949ba4]">Today at 12:00 PM</span>
                  </div>
                </div>

                {/* Embed Body */}
                <div
                  className="ml-11 border-l-4 rounded bg-[#2b2d31] p-3.5 space-y-3"
                  style={{ borderLeftColor: deckColor || "#5865F2" }}
                >
                  <div className="font-bold text-white text-base">{deckTitle || "Role Deck"}</div>
                  {deckDescription && (
                    <div className="text-xs text-[#dbdee1] leading-relaxed">
                      <DiscordMarkdown content={deckDescription} />
                    </div>
                  )}

                  {/* Header Banner Image or GIF */}
                  {deckBannerUrl && (
                    <div className="pt-1">
                      <img
                        src={deckBannerUrl}
                        alt="Deck Banner"
                        className="rounded-lg max-h-48 w-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}

                  {/* Fields list */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {deckRoles.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        {r.imageUrl && (
                          <img
                            src={r.imageUrl}
                            alt=""
                            className="w-6 h-6 rounded object-cover flex-shrink-0 mt-0.5"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        )}
                        <div>
                          <div className="font-semibold text-white">
                            {r.emoji} {r.roleName}
                          </div>
                          <div className="text-[11px] text-[#949ba4]">{r.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="text-[10px] text-[#949ba4] pt-2">
                    Paradox Visual Role Deck • Click to Claim or Remove
                  </div>
                </div>

                {/* Component Buttons / Menu simulation */}
                <div className="ml-11 pt-1">
                  {deckType === "BUTTON" && (
                    <div className="flex flex-wrap gap-2">
                      {deckRoles.map((r, i) => {
                        let btnBg = "bg-[#5865F2] hover:bg-[#4752c4]";
                        if (r.buttonStyle === "SUCCESS") btnBg = "bg-[#248046] hover:bg-[#1a6334]";
                        if (r.buttonStyle === "SECONDARY") btnBg = "bg-[#4e5058] hover:bg-[#6d6f78]";
                        if (r.buttonStyle === "DANGER") btnBg = "bg-[#da373c] hover:bg-[#a12828]";

                        return (
                          <button
                            key={i}
                            type="button"
                            className={`px-3 py-1.5 rounded text-xs font-medium text-white flex items-center gap-1.5 shadow transition ${btnBg}`}
                          >
                            <span>{r.emoji}</span>
                            <span>{r.roleName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {deckType === "SELECT_MENU" && (
                    <div className="w-full p-2.5 rounded bg-[#2b2d31] border border-white/10 text-xs text-[#949ba4] flex items-center justify-between">
                      <span>Select a role to claim or remove...</span>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  )}

                  {deckType === "REACTION" && (
                    <div className="flex gap-2">
                      {deckRoles.map((r, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1 rounded bg-[#2b2d31] border border-white/10 text-xs flex items-center gap-1.5 text-white"
                        >
                          <span>{r.emoji}</span>
                          <span className="text-[10px] text-discord-muted">1</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Link to Existing Message */}
      {activeTab === "single" && (
        <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Hash className="w-5 h-5 text-discord-blurple" /> Attach to Existing Discord Message
            </h2>
            <p className="text-xs text-discord-muted mt-1">
              Link an emoji reaction trigger to any message already posted in your Discord server.
            </p>
          </div>

          <form onSubmit={handleCreateSingle} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Target Channel
                  </label>
                  <button
                    type="button"
                    onClick={() => setSingleChannelMode(singleChannelMode === "select" ? "custom" : "select")}
                    className="text-xs text-discord-blurple hover:underline font-normal"
                  >
                    {singleChannelMode === "select" ? "⌨️ Type Name or ID" : "📋 Choose from list"}
                  </button>
                </div>

                {singleChannelMode === "custom" ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Type channel name (e.g. general) or paste Channel ID"
                      value={singleChannelName || singleChannelId}
                      onChange={(e) => handleSingleChannelInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-discord-blurple"
                    />
                    <div className="flex items-center justify-between text-[11px] text-discord-muted">
                      <span>Channel: <strong className="text-white">#{singleChannelName || singleChannelId || "None"}</strong></span>
                      <span>ID: <code className="text-discord-yellow">{singleChannelId || "Resolves on attach"}</code></span>
                    </div>
                  </div>
                ) : (
                  <select
                    value={singleChannelId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSingleChannelId(val);
                      const match = channels.find((c) => c.id === val);
                      if (match) setSingleChannelName(match.name);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white"
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Message ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 112233445566778899"
                  value={singleMessageId}
                  onChange={(e) => setSingleMessageId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm font-mono text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Emoji Trigger
                </label>
                <input
                  type="text"
                  value={singleEmoji}
                  onChange={(e) => setSingleEmoji(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Target Role
                  </label>
                  <button
                    type="button"
                    onClick={() => setSingleRoleMode(singleRoleMode === "select" ? "custom" : "select")}
                    className="text-xs text-discord-blurple hover:underline font-normal"
                  >
                    {singleRoleMode === "select" ? "⌨️ Type Name or Role ID" : "📋 Choose from list"}
                  </button>
                </div>

                {singleRoleMode === "custom" ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Type role name (e.g. Member) or paste Role ID"
                      value={singleRoleCustomInput}
                      onChange={(e) => handleSingleCustomRoleInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-discord-blurple"
                    />
                    <div className="flex items-center justify-between text-xs text-discord-muted">
                      <span>Name: <strong className="text-white">{singleRoleName || "None"}</strong></span>
                      <span>ID: <code className="text-discord-yellow">{singleRoleId || "Enter Role ID"}</code></span>
                    </div>
                  </div>
                ) : (
                  <select
                    value={singleRoleId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSingleRoleId(val);
                      const match = roles.find((r) => r.id === val);
                      if (match) {
                        setSingleRoleName(match.name);
                        setSingleRoleCustomInput(match.name);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white"
                  >
                    <option value="">-- Choose a Role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id} className="text-white bg-[#2b2d31]">
                        {r.name} {!r.assignableByBot && roles.some((x) => x.assignableByBot) ? "⚠️ (Check Position)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Role Perks / Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Access to special gaming channels"
                value={singleDesc}
                onChange={(e) => setSingleDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-discord-blurple" /> Badge / Sticker GIF URL
                </label>
                <input
                  type="text"
                  placeholder="https://... (Shown in embed)"
                  value={singleBadgeUrl}
                  onChange={(e) => setSingleBadgeUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-discord-fuchsia" /> Celebration GIF URL
                </label>
                <input
                  type="text"
                  placeholder="https://... (Shown on claim)"
                  value={singleConfirmGif}
                  onChange={(e) => setSingleConfirmGif(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submittingSingle}
                className="px-6 py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-semibold text-sm transition"
              >
                {submittingSingle ? "Saving..." : "Save Mapping"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Mappings Table */}
      <div className="p-6 rounded-2xl bg-discord-card border border-white/5 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center justify-between">
          <span>Active Role Mappings & Decks</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-discord-dark text-discord-muted">
            {reactionRoles.length} Active
          </span>
        </h2>

        {loading ? (
          <div className="py-12 flex justify-center text-discord-muted">
            <Loader2 className="w-6 h-6 animate-spin text-discord-blurple" />
          </div>
        ) : reactionRoles.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm text-discord-muted">No reaction role mappings deployed yet.</p>
            <p className="text-xs text-discord-muted">
              Use the Visual Role Deck Studio above to deploy your first interactive role panel!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 text-discord-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Media / Icon</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Channel / Message</th>
                  <th className="pb-3">Visual Media</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reactionRoles.map((item) => {
                  const channel = channels.find((c) => c.id === item.channelId);
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-2">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-white/10"
                            />
                          ) : (
                            <span className="text-xl">{item.emoji}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-discord-dark border border-white/10 text-white font-medium">
                          <span className="w-2 h-2 rounded-full bg-discord-blurple" />
                          {item.roleName}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.type === "BUTTON"
                              ? "bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30"
                              : item.type === "SELECT_MENU"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          {item.type || "REACTION"}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-discord-muted">
                        <div>#{channel?.name || item.channelId}</div>
                        <div className="text-[10px] text-zinc-500">Msg: {item.messageId}</div>
                      </td>
                      <td className="py-3.5 text-discord-muted text-[11px]">
                        <div className="flex items-center gap-2">
                          {item.bannerUrl && (
                            <span className="px-1.5 py-0.5 rounded bg-discord-dark border border-white/5 text-[10px] text-discord-blurple">
                              Banner
                            </span>
                          )}
                          {item.confirmGif && (
                            <span className="px-1.5 py-0.5 rounded bg-discord-dark border border-white/5 text-[10px] text-discord-fuchsia">
                              Claim GIF
                            </span>
                          )}
                          {!item.bannerUrl && !item.confirmGif && (
                            <span className="text-zinc-600 italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-discord-muted hover:text-discord-red hover:bg-discord-red/10 transition"
                          title="Delete role mapping"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Modal for Role Deck */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-discord-card border border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <Sparkles className="w-5 h-5 text-discord-blurple" />
                <span>AI Auto-Build Role Deck</span>
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
              Configure your <strong>Target Channel</strong> and select your <strong>Server Roles</strong> together. You can check off roles directly from your server, or type custom roles with emojis!
            </p>

            {/* 1. Target Channel Selection */}
            <div className="space-y-1.5 p-3 rounded-xl bg-discord-dark border border-white/5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>📍 1. Target Channel</span>
                <span className="text-[10px] text-discord-muted font-normal">Where to post the embed</span>
              </label>
              <select
                value={aiChannelId || deckChannelId}
                onChange={(e) => {
                  setAiChannelId(e.target.value);
                  setDeckChannelId(e.target.value);
                  const match = channels.find((c) => c.id === e.target.value);
                  if (match) setDeckChannelName(match.name);
                }}
                className="w-full px-3 py-2 rounded-xl bg-discord-card border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
              >
                <option value="">-- Choose a Channel --</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Server Roles Checklist */}
            <div className="space-y-1.5 p-3 rounded-xl bg-discord-dark border border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-discord-blurple" />
                  <span>2. Pick Server Roles ({aiSelectedRoleIds.length} Selected)</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAiSelectedRoleIds(roles.filter((r) => r.name !== "@everyone").map((r) => r.id))}
                    className="text-[10px] text-discord-blurple hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button
                    type="button"
                    onClick={() => setAiSelectedRoleIds([])}
                    className="text-[10px] text-discord-muted hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-36 overflow-y-auto p-1.5 rounded-lg bg-discord-card border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {roles
                  .filter((r) => r.name !== "@everyone")
                  .map((r) => {
                    const isChecked = aiSelectedRoleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-xs border transition ${
                          isChecked
                            ? "bg-discord-blurple/20 border-discord-blurple/50 text-white font-semibold"
                            : "border-transparent text-zinc-300 hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setAiSelectedRoleIds(aiSelectedRoleIds.filter((id) => id !== r.id));
                            } else {
                              setAiSelectedRoleIds([...aiSelectedRoleIds, r.id]);
                            }
                          }}
                          className="rounded bg-discord-dark border-white/20 text-discord-blurple focus:ring-0"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: r.color || "#99aab5" }}
                        />
                        <span className="truncate">{r.name}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* 3. Theme or Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                3. Custom Theme, Prompt or Extra Roles
              </label>
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Choose Which color you want your username to be, or Gaming squad roles"
                className="w-full px-3.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple"
              />
            </div>

            {/* Quick Inspiration Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    label: "🎮 Gaming Squads",
                    text: "Valorant 🎯 Ranked 5-stack alerts, Minecraft ⛏️ SMP server IP & builds, Fortnite ⚡ Battle pass XP grind, Gamer 🎮 General LFG pings",
                  },
                  {
                    label: "👑 VIP & Supporters",
                    text: "VIP Member 👑 Exclusive lounge & priority voice, Server Booster 🚀 Custom color roles & nitro giveaways, Supporter ⭐ Special supporter badge",
                  },
                  {
                    label: "🔔 Notification Pings",
                    text: "Announcements 📢 Major server news & updates, Events 🎉 Weekly game nights & tournaments, Giveaways 🎁 Nitro & steam game alerts",
                  },
                  {
                    label: "🌸 Anime & Community",
                    text: "Anime Fans 🌸 Seasonal watch party pings, Manga Readers 📖 Release alerts & discussions, Artists 🎨 Creative showcase gallery",
                  },
                  {
                    label: "🛡️ Staff & Moderation",
                    text: "Server Admin ⚔️ Server administration & security, Moderator 🛡️ Chat moderation & safety, Helper 🤝 Community guide & ticket support",
                  },
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
                onClick={handleAiGenerateDeck}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-discord-blurple to-discord-fuchsia hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-discord-blurple/25 transition cursor-pointer"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating &amp; Applying...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-discord-yellow" />
                    <span>Apply Channel &amp; Roles</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Server Role Picker Modal */}
      {serverRolePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-discord-card border border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <CheckCircle2 className="w-5 h-5 text-discord-blurple" />
                <span>Select Roles from Discord Server</span>
              </div>
              <button
                type="button"
                onClick={() => setServerRolePickerOpen(false)}
                className="text-discord-muted hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-discord-muted">
              Check all the roles you want to include in this visual deck. They will be added with their exact Discord IDs.
            </p>

            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                placeholder="Search server roles..."
                value={roleSearchQuery}
                onChange={(e) => setRoleSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple"
              />
              <button
                type="button"
                onClick={() => setBulkSelectedRoleIds(roles.filter((r) => r.name !== "@everyone").map((r) => r.id))}
                className="px-2.5 py-1.5 rounded-lg bg-discord-dark hover:bg-white/5 text-[11px] font-semibold text-discord-blurple border border-white/5 whitespace-nowrap"
              >
                Check All
              </button>
              <button
                type="button"
                onClick={() => setBulkSelectedRoleIds([])}
                className="px-2.5 py-1.5 rounded-lg bg-discord-dark hover:bg-white/5 text-[11px] text-zinc-400 hover:text-white border border-white/5 whitespace-nowrap"
              >
                Clear
              </button>
            </div>

            {roles.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-discord-muted">No roles loaded yet from Discord.</p>
                <button
                  type="button"
                  disabled={refreshingRoles}
                  onClick={reloadRoles}
                  className="px-3.5 py-1.5 rounded-lg bg-discord-blurple hover:bg-discord-blurple/90 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingRoles ? "animate-spin" : ""}`} />
                  <span>{refreshingRoles ? "Refreshing..." : "Load Roles from Discord"}</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-64 p-2 rounded-xl bg-discord-dark border border-white/5 space-y-1">
                {roles
                  .filter((r) => r.name !== "@everyone")
                  .filter((r) => r.name.toLowerCase().includes(roleSearchQuery.toLowerCase()))
                  .map((r) => {
                    const isChecked = bulkSelectedRoleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs border transition ${
                          isChecked
                            ? "bg-discord-blurple/20 border-discord-blurple/50 text-white font-semibold"
                            : "border-transparent text-zinc-300 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setBulkSelectedRoleIds(bulkSelectedRoleIds.filter((id) => id !== r.id));
                              } else {
                                setBulkSelectedRoleIds([...bulkSelectedRoleIds, r.id]);
                              }
                            }}
                            className="rounded bg-discord-card border-white/20 text-discord-blurple focus:ring-0"
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: r.color || "#99aab5" }}
                          />
                          <span className="truncate">{r.name}</span>
                        </div>
                        {!r.assignableByBot && roles.some((x) => x.assignableByBot) && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            Above Bot
                          </span>
                        )}
                      </label>
                    );
                  })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-discord-muted">
                {bulkSelectedRoleIds.length} roles selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setServerRolePickerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-discord-dark hover:bg-white/5 text-xs text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyBulkSelectedRoles}
                  className="px-5 py-2 rounded-xl bg-discord-blurple hover:bg-discord-blurple/90 text-white font-bold text-xs"
                >
                  Load {bulkSelectedRoleIds.length} Roles to Deck
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
