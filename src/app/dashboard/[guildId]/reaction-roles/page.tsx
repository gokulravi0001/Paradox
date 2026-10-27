"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Smile,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Hash,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Edit3,
  ListFilter,
  Layers,
  ShieldAlert,
  Bot,
  Sliders,
  CheckSquare,
  Square,
  Radio,
  ToggleLeft,
  Lock,
  Palette,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { RoleSelect, DiscordRoleItem } from "@/components/ui/RoleSelect";
import { QuickTagsBar } from "@/components/ui/QuickTagsBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { DiscordMarkdown } from "@/lib/discordMarkdown";

interface ReactionRoleItem {
  id: string;
  channelId: string;
  messageId: string;
  emoji: string;
  roleId: string;
  roleName: string;
  description: string | null;
  type: string;
  mode?: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  confirmGif: string | null;
  buttonStyle: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER" | string | null;
  createdAt: string;
}

interface ConfiguredRole {
  roleId: string;
  roleName: string;
  emoji: string;
  buttonStyle: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER";
  description: string;
}

const PRESET_COLORS = [
  { name: "Electric Blue", hex: "#5865F2" },
  { name: "Blurple Dark", hex: "#4752C4" },
  { name: "Emerald Green", hex: "#10B981" },
  { name: "Crimson Red", hex: "#EF4444" },
  { name: "Amber Gold", hex: "#F59E0B" },
  { name: "Royal Purple", hex: "#8B5CF6" },
  { name: "Cyber Cyan", hex: "#06B6D4" },
  { name: "Pitch Charcoal", hex: "#1F2937" },
];

export default function ReactionRolesPage() {
  const params = useParams();
  const guildId = params.guildId as string;
  const router = useRouter();

  // Primary Tab state: create wizard vs edit existing vs view/delete deployed
  const [activeTab, setActiveTab] = useState<"create" | "edit" | "view">("create");

  // Server Data
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [roles, setRoles] = useState<DiscordRoleItem[]>([]);
  const [reactionRoles, setReactionRoles] = useState<ReactionRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Wizard Step (1 to 5)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Wizard Form State
  const [targetChannelId, setTargetChannelId] = useState("");
  const [targetChannelName, setTargetChannelName] = useState("");
  const [reactionType, setReactionType] = useState<"BUTTON" | "SELECT_MENU" | "REACTION">("BUTTON");
  const [assignmentMode, setAssignmentMode] = useState<"UNIQUE" | "TOGGLE" | "VERIFY">("UNIQUE");
  const [embedColor, setEmbedColor] = useState("#5865F2");
  const [embedTitle, setEmbedTitle] = useState("✨ Unlock Your Roles & Perks");
  const [embedDescription, setEmbedDescription] = useState(
    "Choose your notification and community roles below. Each role grants special channel access and custom perks in **{server.name}**!"
  );
  const [bannerUrl, setBannerUrl] = useState("");
  const [configuredRoles, setConfiguredRoles] = useState<ConfiguredRole[]>([
    {
      roleId: "",
      roleName: "",
      emoji: "⭐",
      buttonStyle: "PRIMARY",
      description: "",
    },
  ]);

  // Edit Existing Message State
  const [editSelectedMessageId, setEditSelectedMessageId] = useState("");
  const [editChannelId, setEditChannelId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("#5865F2");
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [editType, setEditType] = useState<"BUTTON" | "SELECT_MENU" | "REACTION">("BUTTON");
  const [editMode, setEditMode] = useState<"UNIQUE" | "TOGGLE" | "VERIFY">("TOGGLE");
  const [editRoles, setEditRoles] = useState<ConfiguredRole[]>([]);
  const [isFetchingEditMessage, setIsFetchingEditMessage] = useState(false);
  const [editLoaded, setEditLoaded] = useState(false);

  // View / Delete Tab State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "single" | "selected" | "purge";
    messageId?: string;
    count?: number;
  } | null>(null);
  const [deleteDiscordMessage, setDeleteDiscordMessage] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status & Feedback
  const [deploying, setDeploying] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function addToast(type: "success" | "error" | "warning" | "info", message: string, title?: string) {
    setToasts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        message,
        title,
      },
    ]);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // Load guild data
  async function loadData() {
    try {
      setRefreshing(true);
      const [channelsRes, rolesRes, rrRes] = await Promise.all([
        fetch(`/api/guilds/${guildId}/channels`),
        fetch(`/api/guilds/${guildId}/roles`),
        fetch(`/api/guilds/${guildId}/reaction-roles`),
      ]);

      if (channelsRes.ok) {
        const cJson = await channelsRes.json();
        setChannels(cJson.channels || []);
      }
      if (rolesRes.ok) {
        const rJson = await rolesRes.json();
        setRoles(rJson.roles || []);
      }
      if (rrRes.ok) {
        const rrJson = await rrRes.json();
        setReactionRoles(rrJson.reactionRoles || []);
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Failed to load guild data from server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [guildId]);

  // Group reaction roles by messageId for View/Delete and Edit selection
  const groupedDecks = useMemo(() => {
    const map = new Map<
      string,
      {
        messageId: string;
        channelId: string;
        type: string;
        mode: string;
        bannerUrl: string | null;
        createdAt: string;
        roles: ReactionRoleItem[];
      }
    >();

    for (const item of reactionRoles) {
      if (!map.has(item.messageId)) {
        map.set(item.messageId, {
          messageId: item.messageId,
          channelId: item.channelId,
          type: item.type || "BUTTON",
          mode: item.mode || "TOGGLE",
          bannerUrl: item.bannerUrl,
          createdAt: item.createdAt,
          roles: [],
        });
      }
      map.get(item.messageId)!.roles.push(item);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reactionRoles]);

  // Filtered decks for View Tab
  const filteredDecks = useMemo(() => {
    if (!searchQuery.trim()) return groupedDecks;
    const q = searchQuery.toLowerCase();
    return groupedDecks.filter((deck) => {
      const channel = channels.find((c) => c.id === deck.channelId);
      const channelMatch = channel && channel.name.toLowerCase().includes(q);
      const messageMatch = deck.messageId.includes(q);
      const roleMatch = deck.roles.some((r) => r.roleName.toLowerCase().includes(q));
      return channelMatch || messageMatch || roleMatch;
    });
  }, [groupedDecks, searchQuery, channels]);

  // -------------------------------------------------------------
  // Role Deck Helpers (Max 25 Limit)
  // -------------------------------------------------------------
  function handleAddRole() {
    if (configuredRoles.length >= 25) {
      addToast("warning", "Discord limits embeds to a maximum of 25 roles (5 rows of 5 buttons or 25 menu options).");
      return;
    }
    setConfiguredRoles((prev) => [
      ...prev,
      {
        roleId: "",
        roleName: "",
        emoji: "⭐",
        buttonStyle: "PRIMARY",
        description: "",
      },
    ]);
  }

  function handleUpdateRole(index: number, updates: Partial<ConfiguredRole>) {
    setConfiguredRoles((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  }

  function handleRemoveRole(index: number) {
    if (configuredRoles.length <= 1) {
      addToast("warning", "A reaction role embed must have at least 1 role.");
      return;
    }
    setConfiguredRoles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddEditRole() {
    if (editRoles.length >= 25) {
      addToast("warning", "Discord limits embeds to a maximum of 25 roles.");
      return;
    }
    setEditRoles((prev) => [
      ...prev,
      {
        roleId: "",
        roleName: "",
        emoji: "⭐",
        buttonStyle: "PRIMARY",
        description: "",
      },
    ]);
  }

  function handleUpdateEditRole(index: number, updates: Partial<ConfiguredRole>) {
    setEditRoles((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  }

  function handleRemoveEditRole(index: number) {
    if (editRoles.length <= 1) {
      addToast("warning", "A reaction role embed must have at least 1 role.");
      return;
    }
    setEditRoles((prev) => prev.filter((_, i) => i !== index));
  }

  // -------------------------------------------------------------
  // Load Existing Message for Editing
  // -------------------------------------------------------------
  async function loadExistingMessage(messageIdToLoad: string, channelIdHint?: string) {
    if (!messageIdToLoad.trim()) {
      addToast("warning", "Please provide a valid Discord Message ID to load.");
      return;
    }

    try {
      setIsFetchingEditMessage(true);
      setEditLoaded(false);

      // Find from grouped decks first to obtain channel and roles
      const localDeck = groupedDecks.find((d) => d.messageId === messageIdToLoad.trim());
      const channelIdToUse = channelIdHint || (localDeck ? localDeck.channelId : targetChannelId || "");

      if (!channelIdToUse) {
        addToast("error", "Channel ID required to locate the message in Discord.");
        return;
      }

      setEditSelectedMessageId(messageIdToLoad.trim());
      setEditChannelId(channelIdToUse);

      if (localDeck) {
        setEditType((localDeck.type as any) || "BUTTON");
        setEditMode((localDeck.mode as any) || "TOGGLE");
        setEditBannerUrl(localDeck.bannerUrl || "");
        setEditRoles(
          localDeck.roles.map((r) => ({
            roleId: r.roleId,
            roleName: r.roleName,
            emoji: r.emoji || "⭐",
            buttonStyle: (r.buttonStyle as any) || "PRIMARY",
            description: r.description || "",
          }))
        );
      }

      // Fetch live Discord message content to get embed title and description
      const res = await fetch(
        `/api/guilds/${guildId}/embeds/fetch-message?channelId=${channelIdToUse}&messageId=${messageIdToLoad.trim()}`
      );

      if (res.ok) {
        const json = await res.json();
        const msg = json.message;
        if (msg && msg.embeds && msg.embeds.length > 0) {
          const firstEmbed = msg.embeds[0];
          setEditTitle(firstEmbed.title || "Reaction Roles");
          setEditDescription(firstEmbed.description || "");
          if (firstEmbed.color !== undefined) {
            setEditColor(`#${firstEmbed.color.toString(16).padStart(6, "0")}`);
          }
          if (firstEmbed.image?.url) {
            setEditBannerUrl(firstEmbed.image.url);
          }
        }
      }

      setEditLoaded(true);
      setActiveTab("edit");
      addToast("success", `Loaded message ${messageIdToLoad.trim()} successfully!`);
    } catch (err) {
      console.error(err);
      addToast("error", "Failed to fetch message details from Discord.");
    } finally {
      setIsFetchingEditMessage(false);
    }
  }

  // -------------------------------------------------------------
  // Deploy New Reaction Role Deck (Wizard Step 5)
  // -------------------------------------------------------------
  async function handleDeployNewDeck() {
    if (!targetChannelId) {
      addToast("error", "Please select a destination channel in Step 1.");
      setWizardStep(1);
      return;
    }
    if (!embedTitle.trim()) {
      addToast("error", "Please enter an embed title in Step 4.");
      setWizardStep(4);
      return;
    }
    if (configuredRoles.length === 0) {
      addToast("error", "Please add at least 1 role in Step 5.");
      return;
    }

    // Validate roles have valid names/IDs
    for (let i = 0; i < configuredRoles.length; i++) {
      const r = configuredRoles[i];
      if (!r.roleId && !r.roleName.trim()) {
        addToast("error", `Role #${i + 1} has no role selected or name specified.`);
        return;
      }
    }

    try {
      setDeploying(true);
      const payload = {
        channelId: targetChannelId,
        title: embedTitle.trim(),
        description: embedDescription.trim() || undefined,
        color: embedColor,
        bannerUrl: bannerUrl.trim() || null,
        type: reactionType,
        mode: assignmentMode,
        roles: configuredRoles.map((r) => ({
          roleId: r.roleId || undefined,
          roleName: r.roleName.trim() || "Role",
          emoji: r.emoji.trim() || "⭐",
          description: r.description.trim() || null,
          buttonStyle: r.buttonStyle,
        })),
      };

      const res = await fetch(`/api/guilds/${guildId}/reaction-roles/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Deployment failed");
      }

      addToast("success", `Reaction role deck deployed to #${targetChannelName || targetChannelId} with ${json.roleCount} roles!`);
      // Reload reaction roles
      await loadData();
      // Switch to view tab
      setActiveTab("view");
    } catch (err: any) {
      console.error(err);
      addToast("error", err.message || "Failed to deploy reaction role embed.");
    } finally {
      setDeploying(false);
    }
  }

  // -------------------------------------------------------------
  // Save & Update Existing Message (Edit Tab)
  // -------------------------------------------------------------
  async function handleUpdateExistingDeck() {
    if (!editSelectedMessageId || !editChannelId) {
      addToast("error", "Missing message ID or channel ID.");
      return;
    }
    if (!editTitle.trim()) {
      addToast("error", "Please enter an embed title.");
      return;
    }
    if (editRoles.length === 0) {
      addToast("error", "Please add at least 1 role.");
      return;
    }

    try {
      setUpdating(true);
      const payload = {
        channelId: editChannelId,
        messageId: editSelectedMessageId,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        color: editColor,
        bannerUrl: editBannerUrl.trim() || null,
        type: editType,
        mode: editMode,
        roles: editRoles.map((r) => ({
          roleId: r.roleId || undefined,
          roleName: r.roleName.trim() || "Role",
          emoji: r.emoji.trim() || "⭐",
          description: r.description.trim() || null,
          buttonStyle: r.buttonStyle,
        })),
      };

      const res = await fetch(`/api/guilds/${guildId}/reaction-roles/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Update failed");
      }

      addToast("success", `Message ${editSelectedMessageId} and its roles were updated successfully in Discord!`);
      await loadData();
      setActiveTab("view");
    } catch (err: any) {
      console.error(err);
      addToast("error", err.message || "Failed to update Discord embed.");
    } finally {
      setUpdating(false);
    }
  }

  // -------------------------------------------------------------
  // Delete Handlers
  // -------------------------------------------------------------
  async function executeDelete() {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);

      if (deleteTarget.type === "single" && deleteTarget.messageId) {
        const queryParams = new URLSearchParams({
          messageId: deleteTarget.messageId,
          deleteDiscord: deleteDiscordMessage ? "true" : "false",
        });
        const res = await fetch(`/api/guilds/${guildId}/reaction-roles?${queryParams.toString()}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "Failed to delete deck");
        }
        addToast("success", `Deleted reaction role deck ${deleteTarget.messageId}`);
      } else if (deleteTarget.type === "selected" && selectedDecks.length > 0) {
        // Collect all reaction role item IDs belonging to the selected message IDs
        const idsToDelete = reactionRoles
          .filter((rr) => selectedDecks.includes(rr.messageId))
          .map((rr) => rr.id);

        const res = await fetch(`/api/guilds/${guildId}/reaction-roles`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: idsToDelete }),
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "Failed to delete selected decks");
        }
        addToast("success", `Deleted ${selectedDecks.length} selected reaction role decks`);
        setSelectedDecks([]);
      } else if (deleteTarget.type === "purge") {
        const queryParams = new URLSearchParams({
          purge: "true",
          deleteDiscord: deleteDiscordMessage ? "true" : "false",
        });
        const res = await fetch(`/api/guilds/${guildId}/reaction-roles?${queryParams.toString()}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "Failed to purge reaction roles");
        }
        addToast("success", "Successfully deleted all reaction roles from this server.");
        setSelectedDecks([]);
      }

      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      addToast("error", err.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleSelectAll() {
    if (selectedDecks.length === filteredDecks.length) {
      setSelectedDecks([]);
    } else {
      setSelectedDecks(filteredDecks.map((d) => d.messageId));
    }
  }

  function toggleDeckSelection(messageId: string) {
    setSelectedDecks((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]
    );
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // -------------------------------------------------------------
  // Live Simulator Colors & Button Classes
  // -------------------------------------------------------------
  function getDiscordButtonClass(style: string) {
    switch (style) {
      case "SUCCESS":
        return "bg-[#2D7D46] hover:bg-[#276B3C] text-white border-transparent";
      case "DANGER":
        return "bg-[#ED4245] hover:bg-[#DA3736] text-white border-transparent";
      case "SECONDARY":
        return "bg-[#4E5058] hover:bg-[#6D6F78] text-white border-transparent";
      case "PRIMARY":
      default:
        return "bg-[#5865F2] hover:bg-[#4752C4] text-white border-transparent";
    }
  }

  // Active display channel
  const displayChannelName =
    channels.find((c) => c.id === targetChannelId)?.name || targetChannelName || "select-channel";

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-discord-blurple/10 border border-discord-blurple/20 text-discord-blurple shadow-lg shadow-discord-blurple/5">
              <Smile className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                Reaction Roles Studio
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30 font-medium">
                  v2.0
                </span>
              </h1>
              <p className="text-sm text-zinc-400">
                Create interactive button decks, dropdown menus, and auto-swapping reaction roles.
              </p>
            </div>
          </div>
        </div>

        {/* Global Refresh and Stats */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-discord-card border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition text-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Sync Discord
          </button>
        </div>
      </div>

      {/* Primary Action Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-discord-card border border-white/10">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer select-none ${
            activeTab === "create"
              ? "bg-discord-blurple text-white shadow-md shadow-discord-blurple/25"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Plus className="w-4 h-4" />
          Create Reaction Role (Wizard)
        </button>

        <button
          onClick={() => setActiveTab("edit")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer select-none ${
            activeTab === "edit"
              ? "bg-discord-blurple text-white shadow-md shadow-discord-blurple/25"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Edit Existing Embed
        </button>

        <button
          onClick={() => setActiveTab("view")}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer select-none ${
            activeTab === "view"
              ? "bg-discord-blurple text-white shadow-md shadow-discord-blurple/25"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className="w-4 h-4" />
          View Created Roles
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-zinc-300">
            {groupedDecks.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CREATE REACTION ROLE (5-STEP WIZARD) */}
      {/* ========================================================================= */}
      {activeTab === "create" && (
        <div className="space-y-8">
          {/* 5-Step Progress Stepper */}
          <div className="p-4 sm:p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                Setup Progress: Step {wizardStep} of 5
              </span>
              <span className="text-xs text-discord-blurple font-medium">
                {wizardStep === 1 && "Destination Channel"}
                {wizardStep === 2 && "Reaction Role Type"}
                {wizardStep === 3 && "Assignment Behavior"}
                {wizardStep === 4 && "Embed Appearance"}
                {wizardStep === 5 && `Roles Setup (${configuredRoles.length}/25)`}
              </span>
            </div>

            {/* Stepper Pill Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { step: 1, label: "1. Channel", icon: Hash },
                { step: 2, label: "2. Type", icon: Sliders },
                { step: 3, label: "3. Behavior", icon: Radio },
                { step: 4, label: "4. Embed", icon: Palette },
                { step: 5, label: `5. Roles (${configuredRoles.length}/25)`, icon: Smile },
              ].map((item) => {
                const Icon = item.icon;
                const isCurrent = wizardStep === item.step;
                const isPassed = wizardStep > item.step;
                return (
                  <button
                    key={item.step}
                    onClick={() => setWizardStep(item.step as any)}
                    className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      isCurrent
                        ? "bg-discord-blurple text-white border-discord-blurple shadow-md shadow-discord-blurple/20"
                        : isPassed
                        ? "bg-discord-blurple/10 text-discord-blurple border-discord-blurple/30 hover:bg-discord-blurple/20"
                        : "bg-discord-dark/50 text-zinc-400 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main 2-Column Layout: Left Wizard Step / Right Live Embed Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: ACTIVE STEP CONFIGURATION */}
            <div className="lg:col-span-7 space-y-6">
              {/* STEP 1: DESTINATION CHANNEL */}
              {wizardStep === 1 && (
                <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-6 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-discord-blurple/10 text-discord-blurple text-xs font-semibold">
                      <Hash className="w-3.5 h-3.5" /> Step 1 of 5
                    </div>
                    <h2 className="text-xl font-bold text-white">Select Destination Channel</h2>
                    <p className="text-sm text-zinc-400">
                      Choose which text or announcement channel will receive this reaction role embed.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Target Discord Channel <span className="text-discord-red">*</span>
                    </label>
                    <ChannelSelect
                      channels={channels}
                      selectedChannelId={targetChannelId}
                      onSelect={(id, name) => {
                        setTargetChannelId(id);
                        setTargetChannelName(name);
                      }}
                      placeholder="Search or pick a channel (e.g. #roles)..."
                      onRefresh={loadData}
                      refreshing={refreshing}
                    />

                    {targetChannelId ? (
                      <div className="p-3.5 rounded-2xl bg-discord-dark/60 border border-white/5 flex items-center justify-between text-xs text-zinc-300">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Selected channel: <strong className="text-white">#{displayChannelName}</strong>
                        </span>
                        <span className="font-mono text-zinc-500">ID: {targetChannelId}</span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        Please select a channel to unlock the next steps.
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                      onClick={() => {
                        if (!targetChannelId) {
                          addToast("warning", "Please select a channel first.");
                          return;
                        }
                        setWizardStep(2);
                      }}
                      disabled={!targetChannelId}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-discord-blurple hover:bg-discord-blurple/90 text-white font-semibold text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-discord-blurple/20"
                    >
                      Next: Choose Role Type
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: REACTION ROLE TYPE */}
              {wizardStep === 2 && (
                <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-6 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-discord-blurple/10 text-discord-blurple text-xs font-semibold">
                      <Sliders className="w-3.5 h-3.5" /> Step 2 of 5
                    </div>
                    <h2 className="text-xl font-bold text-white">What Kind of Reaction Role?</h2>
                    <p className="text-sm text-zinc-400">
                      Choose the visual interactive component members will use to claim or toggle roles.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* BUTTON TYPE */}
                    <div
                      onClick={() => setReactionType("BUTTON")}
                      className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 select-none ${
                        reactionType === "BUTTON"
                          ? "bg-discord-blurple/10 border-discord-blurple ring-1 ring-discord-blurple/50 shadow-lg shadow-discord-blurple/10"
                          : "bg-discord-dark/50 border-white/5 hover:border-white/15 hover:bg-discord-dark"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-discord-blurple text-white">
                            <CheckSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">Interactive Buttons (Recommended)</h3>
                            <p className="text-xs text-zinc-400">
                              Modern Discord buttons placed neatly under the embed message.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold">
                          Fast & Responsive
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 pl-11">
                        Allows custom colors (Blurple, Grey, Green, Red), emoji icons, and supports up to 25 buttons in 5 rows!
                      </p>
                    </div>

                    {/* SELECT MENU TYPE */}
                    <div
                      onClick={() => setReactionType("SELECT_MENU")}
                      className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 select-none ${
                        reactionType === "SELECT_MENU"
                          ? "bg-discord-blurple/10 border-discord-blurple ring-1 ring-discord-blurple/50 shadow-lg shadow-discord-blurple/10"
                          : "bg-discord-dark/50 border-white/5 hover:border-white/15 hover:bg-discord-dark"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-purple-600 text-white">
                            <ListFilter className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">Dropdown Select Menu</h3>
                            <p className="text-xs text-zinc-400">
                              A clean collapsible dropdown menu beneath the embed.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-semibold">
                          Ultra Clean
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 pl-11">
                        Keeps channels uncluttered. Each dropdown item displays an emoji, role name, and optional description.
                      </p>
                    </div>

                    {/* CLASSIC REACTION TYPE */}
                    <div
                      onClick={() => setReactionType("REACTION")}
                      className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 select-none ${
                        reactionType === "REACTION"
                          ? "bg-discord-blurple/10 border-discord-blurple ring-1 ring-discord-blurple/50 shadow-lg shadow-discord-blurple/10"
                          : "bg-discord-dark/50 border-white/5 hover:border-white/15 hover:bg-discord-dark"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-amber-500 text-white">
                            <Smile className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">Classic Emoji Reactions</h3>
                            <p className="text-xs text-zinc-400">
                              Paradox reacts to the message and users click emojis.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-semibold">
                          Classic
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 pl-11">
                        Standard Discord emoji reactions added directly to the embed message.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Channel
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-discord-blurple hover:bg-discord-blurple/90 text-white font-semibold text-sm transition cursor-pointer shadow-lg shadow-discord-blurple/20"
                    >
                      Next: Choose Role Behavior
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ASSIGNMENT BEHAVIOR / MODE */}
              {wizardStep === 3 && (
                <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-6 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-discord-blurple/10 text-discord-blurple text-xs font-semibold">
                      <Radio className="w-3.5 h-3.5" /> Step 3 of 5
                    </div>
                    <h2 className="text-xl font-bold text-white">Choose Role Behavior & Limits</h2>
                    <p className="text-sm text-zinc-400">
                      Determine whether members can pick only one unique role, multiple roles, or restricted verification.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* UNIQUE ROLE (RADIO) */}
                    <div
                      onClick={() => setAssignmentMode("UNIQUE")}
                      className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 select-none ${
                        assignmentMode === "UNIQUE"
                          ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10"
                          : "bg-discord-dark/50 border-white/5 hover:border-white/15 hover:bg-discord-dark"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-amber-500 text-white">
                            <Radio className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">👑 Unique Role (Single Choice / Radio)</h3>
                            <p className="text-xs text-zinc-400">
                              Members can only have 1 role from this panel at a time.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold">
                          Auto-Swapping
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 pl-11">
                        When a member selects a new role from this panel, Paradox automatically removes their previous sibling role. Perfect for Team colors, Level tiers, and Age verification!
                      </p>
                    </div>

                    {/* MULTIPLE CHOICE (TOGGLE) */}
                    <div
                      onClick={() => setAssignmentMode("TOGGLE")}
                      className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 select-none ${
                        assignmentMode === "TOGGLE"
                          ? "bg-discord-blurple/10 border-discord-blurple ring-1 ring-discord-blurple/50 shadow-lg shadow-discord-blurple/10"
                          : "bg-discord-dark/50 border-white/5 hover:border-white/15 hover:bg-discord-dark"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-discord-blurple text-white">
                            <ToggleLeft className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">🔀 Multiple Choice (Multi-Select / Toggle)</h3>
                            <p className="text-xs text-zinc-400">
                              Members can freely claim or unclaim multiple roles.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-discord-blurple/20 text-discord-blurple font-semibold">
                          Checkbox Style
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 pl-11">
                        Click once to add the role, click again to remove it. Ideal for Game pings, Stream notifications, Giveaway pings, and optional hobby channels.
                      </p>
                    </div>

                    {/* RESTRICTED / ONE-TIME CLAIM */}
                    <div
                      onClick={() => setAssignmentMode("VERIFY")}
                      className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 select-none ${
                        assignmentMode === "VERIFY"
                          ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10"
                          : "bg-discord-dark/50 border-white/5 hover:border-white/15 hover:bg-discord-dark"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">🔒 Restricted / One-Time Verification</h3>
                            <p className="text-xs text-zinc-400">
                              Once claimed, the role is permanent and cannot be unselected.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold">
                          Verification
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 pl-11">
                        Ideal for Server Rules acceptance, Community Membership unlock, or Captcha verification. Members click to verify and keep the role permanently.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Type
                    </button>
                    <button
                      onClick={() => setWizardStep(4)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-discord-blurple hover:bg-discord-blurple/90 text-white font-semibold text-sm transition cursor-pointer shadow-lg shadow-discord-blurple/20"
                    >
                      Next: Embed Appearance
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: EMBED COLOR, TITLE & DESCRIPTION */}
              {wizardStep === 4 && (
                <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-6 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-discord-blurple/10 text-discord-blurple text-xs font-semibold">
                      <Palette className="w-3.5 h-3.5" /> Step 4 of 5
                    </div>
                    <h2 className="text-xl font-bold text-white">Customize Embed Appearance</h2>
                    <p className="text-sm text-zinc-400">
                      Design the header, description, and color strip of your reaction role embed message.
                    </p>
                  </div>

                  {/* EMBED COLOR PICKER */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Embed Accent Color</span>
                      <span className="font-mono text-zinc-400">{embedColor}</span>
                    </label>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setEmbedColor(c.hex)}
                          className={`w-8 h-8 rounded-xl transition flex items-center justify-center cursor-pointer ${
                            embedColor.toLowerCase() === c.hex.toLowerCase()
                              ? "ring-2 ring-white scale-110 shadow-lg"
                              : "hover:scale-105 opacity-80 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {embedColor.toLowerCase() === c.hex.toLowerCase() && (
                            <Check className="w-4 h-4 text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                      {/* Custom Color Input */}
                      <div className="flex items-center gap-2 ml-2">
                        <input
                          type="color"
                          value={embedColor}
                          onChange={(e) => setEmbedColor(e.target.value)}
                          className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer p-0"
                          title="Custom Hex Picker"
                        />
                        <input
                          type="text"
                          value={embedColor}
                          onChange={(e) => setEmbedColor(e.target.value)}
                          placeholder="#5865F2"
                          className="w-24 px-3 py-1.5 rounded-xl bg-discord-dark border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-discord-blurple"
                        />
                      </div>
                    </div>
                  </div>

                  {/* EMBED TITLE */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Embed Title <span className="text-discord-red">*</span>
                      </label>
                      <span className="text-xs text-zinc-500">{embedTitle.length}/256</span>
                    </div>
                    <input
                      type="text"
                      value={embedTitle}
                      onChange={(e) => setEmbedTitle(e.target.value.slice(0, 256))}
                      placeholder="e.g. ✨ Unlock Your Roles & Perks"
                      className="w-full px-4 py-3 rounded-2xl bg-discord-dark border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple text-sm"
                    />
                  </div>

                  {/* EMBED DESCRIPTION */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Embed Description
                      </label>
                      <span className="text-xs text-zinc-500">{embedDescription.length}/4096</span>
                    </div>
                    <textarea
                      value={embedDescription}
                      onChange={(e) => setEmbedDescription(e.target.value.slice(0, 4096))}
                      rows={4}
                      placeholder="Provide helpful instructions for your members..."
                      className="w-full px-4 py-3 rounded-2xl bg-discord-dark border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple text-sm resize-y"
                    />

                    {/* Quick Tags Bar */}
                    <div className="pt-1">
                      <span className="text-xs text-zinc-400 block mb-1.5 font-medium">
                        Quick Variables (click to insert):
                      </span>
                      <QuickTagsBar
                        channels={channels}
                        variant="all"
                        onInsert={(tag) => setEmbedDescription((prev) => prev + " " + tag)}
                      />
                    </div>
                  </div>

                  {/* OPTIONAL BANNER URL */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5" /> Optional Banner Image / GIF URL
                    </label>
                    <input
                      type="url"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://media.giphy.com/media/.../giphy.gif"
                      className="w-full px-4 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple text-sm font-mono text-xs"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => setWizardStep(3)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Behavior
                    </button>
                    <button
                      onClick={() => {
                        if (!embedTitle.trim()) {
                          addToast("warning", "Please provide an embed title.");
                          return;
                        }
                        setWizardStep(5);
                      }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-discord-blurple hover:bg-discord-blurple/90 text-white font-semibold text-sm transition cursor-pointer shadow-lg shadow-discord-blurple/20"
                    >
                      Next: Configure Roles (Max 25)
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: ADD ROLES (MAX 25 LIMIT) */}
              {wizardStep === 5 && (
                <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-discord-blurple/10 text-discord-blurple text-xs font-semibold">
                        <Smile className="w-3.5 h-3.5" /> Step 5 of 5
                      </div>
                      <h2 className="text-xl font-bold text-white">Add Roles (Max 25 Limit)</h2>
                      <p className="text-sm text-zinc-400">
                        Select which server roles members can unlock from this panel.
                      </p>
                    </div>

                    {/* Role Counter Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-discord-dark border border-white/10">
                      <span className="text-xs text-zinc-400 font-semibold">Roles Added:</span>
                      <span
                        className={`text-sm font-bold font-mono px-2 py-0.5 rounded-md ${
                          configuredRoles.length >= 25
                            ? "bg-discord-red/20 text-discord-red border border-discord-red/30"
                            : "bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30"
                        }`}
                      >
                        {configuredRoles.length} / 25
                      </span>
                    </div>
                  </div>

                  {/* Roles List */}
                  <div className="space-y-4">
                    {configuredRoles.map((roleItem, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-2xl bg-discord-dark/70 border border-white/10 hover:border-white/20 transition space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px]">
                              {index + 1}
                            </span>
                            Role #{index + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveRole(index)}
                            disabled={configuredRoles.length <= 1}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-discord-red hover:bg-discord-red/10 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Remove Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Role Selector & Emoji Input */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Role Selector Dropdown */}
                          <div className="sm:col-span-8">
                            <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                              Server Role
                            </label>
                            <RoleSelect
                              roles={roles}
                              selectedRoleId={roleItem.roleId}
                              onSelect={(roleId, roleName) =>
                                handleUpdateRole(index, { roleId, roleName })
                              }
                              placeholder="Choose server role..."
                              onRefresh={loadData}
                              refreshing={refreshing}
                            />
                          </div>

                          {/* Emoji Input */}
                          <div className="sm:col-span-4">
                            <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                              Emoji
                            </label>
                            <input
                              type="text"
                              value={roleItem.emoji}
                              onChange={(e) => handleUpdateRole(index, { emoji: e.target.value })}
                              placeholder="⭐ or :fire:"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white text-sm focus:outline-none focus:border-discord-blurple"
                            />
                          </div>
                        </div>

                        {/* Optional Button Style or Description */}
                        {reactionType === "BUTTON" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                                Button Color Style
                              </label>
                              <select
                                value={roleItem.buttonStyle}
                                onChange={(e) =>
                                  handleUpdateRole(index, {
                                    buttonStyle: e.target.value as any,
                                  })
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-discord-blurple cursor-pointer"
                              >
                                <option value="PRIMARY">Blurple (Primary)</option>
                                <option value="SECONDARY">Grey (Secondary)</option>
                                <option value="SUCCESS">Green (Success)</option>
                                <option value="DANGER">Red (Danger)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                                Optional Label Override
                              </label>
                              <input
                                type="text"
                                value={roleItem.roleName}
                                onChange={(e) =>
                                  handleUpdateRole(index, { roleName: e.target.value })
                                }
                                placeholder="Custom button text..."
                                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-discord-blurple"
                              />
                            </div>
                          </div>
                        )}

                        {reactionType === "SELECT_MENU" && (
                          <div className="pt-1">
                            <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                              Menu Subtitle / Description (Optional)
                            </label>
                            <input
                              type="text"
                              value={roleItem.description}
                              onChange={(e) =>
                                handleUpdateRole(index, { description: e.target.value.slice(0, 100) })
                              }
                              placeholder="Short description shown inside dropdown..."
                              className="w-full px-3.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-discord-blurple"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Role Button (Capped at 25) */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAddRole}
                      disabled={configuredRoles.length >= 25}
                      className="w-full py-3.5 rounded-2xl border-2 border-dashed border-white/15 hover:border-discord-blurple/50 hover:bg-discord-blurple/5 text-zinc-300 hover:text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
                    >
                      <Plus className="w-4 h-4" />
                      {configuredRoles.length >= 25
                        ? "Maximum 25 Roles Reached (Discord Limit)"
                        : `Add Another Role (${configuredRoles.length}/25)`}
                    </button>
                  </div>

                  {/* Deployment Actions */}
                  <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      onClick={() => setWizardStep(4)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Embed
                    </button>

                    <button
                      onClick={handleDeployNewDeck}
                      disabled={deploying}
                      className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-discord-blurple to-indigo-600 hover:from-discord-blurple/90 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-discord-blurple/25 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                    >
                      {deploying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Deploying to Discord...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          🚀 Deploy Reaction Role Embed to Discord
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: STICKY LIVE DISCORD SIMULATOR PREVIEW */}
            <div className="lg:col-span-5 sticky top-24 space-y-4">
              <div className="p-4 rounded-3xl bg-discord-card border border-white/10 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Live Discord Simulator
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 bg-discord-dark px-2.5 py-1 rounded-lg border border-white/5">
                    #{displayChannelName}
                  </span>
                </div>

                {/* Discord Message Simulator */}
                <div className="bg-[#313338] rounded-2xl p-4 text-white space-y-3 shadow-inner">
                  {/* Bot Author Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-discord-blurple flex-shrink-0 relative">
                      <Image
                        src="/pfp.png"
                        alt="Paradox Bot"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          // fallback
                          (e.target as any).style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">Paradox</span>
                        <span className="text-[10px] bg-[#5865F2] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          BOT
                        </span>
                        <span className="text-[11px] text-[#949BA4]">Today at 12:00 PM</span>
                      </div>
                    </div>
                  </div>

                  {/* Embed Container with Left Color Strip */}
                  <div
                    className="ml-0 sm:ml-12 rounded-lg bg-[#2B2D31] p-4 space-y-3 border-l-4 transition-colors"
                    style={{ borderLeftColor: embedColor }}
                  >
                    {/* Embed Title */}
                    {embedTitle && (
                      <h4 className="font-bold text-base text-white hover:underline cursor-pointer">
                        {embedTitle}
                      </h4>
                    )}

                    {/* Embed Description */}
                    {embedDescription ? (
                      <div className="text-sm text-[#DBDEE1] leading-relaxed break-words">
                        <DiscordMarkdown content={embedDescription} />
                      </div>
                    ) : (
                      <p className="text-xs text-[#949BA4] italic">
                        (No description provided yet)
                      </p>
                    )}

                    {/* Banner Image Preview */}
                    {bannerUrl && (
                      <div className="rounded-lg overflow-hidden max-h-48 relative border border-white/5">
                        <img
                          src={bannerUrl}
                          alt="Banner Preview"
                          className="w-full object-cover max-h-48"
                          onError={(e) => {
                            (e.target as any).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* UNDER EMBED: BUTTONS / SELECT MENU / REACTIONS */}
                  <div className="ml-0 sm:ml-12 space-y-2 pt-1">
                    {/* BUTTON TYPE SIMULATION */}
                    {reactionType === "BUTTON" && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {configuredRoles.map((r, i) => (
                          <div
                            key={i}
                            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 select-none transition shadow-sm ${getDiscordButtonClass(
                              r.buttonStyle
                            )}`}
                          >
                            <span>{r.emoji || "⭐"}</span>
                            <span className="truncate">{r.roleName || `Role ${i + 1}`}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SELECT MENU SIMULATION */}
                    {reactionType === "SELECT_MENU" && (
                      <div className="p-3 rounded-lg bg-[#1E1F22] border border-[#3F4147] flex items-center justify-between text-xs text-[#949BA4] select-none">
                        <span>Select a role to claim ({configuredRoles.length} available)...</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}

                    {/* CLASSIC REACTION SIMULATION */}
                    {reactionType === "REACTION" && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {configuredRoles.map((r, i) => (
                          <div
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-[#2B2D31] hover:bg-[#35373C] border border-[#3F4147] text-xs font-medium flex items-center gap-1.5 select-none text-zinc-300"
                          >
                            <span>{r.emoji || "⭐"}</span>
                            <span className="text-[11px] text-[#949BA4]">1</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulator Mode Badges */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <strong>Mode:</strong>
                    <span className="text-zinc-200">
                      {assignmentMode === "UNIQUE"
                        ? "👑 Unique (Single Choice)"
                        : assignmentMode === "TOGGLE"
                        ? "🔀 Toggle (Multi-Select)"
                        : "🔒 Verify (One-Time)"}
                    </span>
                  </span>
                  <span>
                    Limit: <strong className="text-zinc-200">{configuredRoles.length} / 25 roles</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EDIT EXISTING EMBED */}
      {/* ========================================================================= */}
      {activeTab === "edit" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Message Selector & Fetcher Header */}
          <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-discord-blurple" />
                Edit Existing Reaction Role Embed
              </h2>
              <p className="text-sm text-zinc-400">
                Update the message content, colors, and assigned roles of an existing Discord embed message.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-2">
              {/* Pick from known deployed decks */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Pick Existing Deployed Deck
                </label>
                <select
                  value={editSelectedMessageId}
                  onChange={(e) => {
                    const pickedId = e.target.value;
                    setEditSelectedMessageId(pickedId);
                    const match = groupedDecks.find((d) => d.messageId === pickedId);
                    if (match) {
                      loadExistingMessage(pickedId, match.channelId);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white text-sm focus:outline-none focus:border-discord-blurple cursor-pointer"
                >
                  <option value="">-- Choose from deployed decks ({groupedDecks.length}) --</option>
                  {groupedDecks.map((deck) => {
                    const ch = channels.find((c) => c.id === deck.channelId);
                    return (
                      <option key={deck.messageId} value={deck.messageId}>
                        #{ch?.name || deck.channelId} • Msg {deck.messageId} ({deck.roles.length} roles)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Or manual message ID input */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Or Type Message ID Manually
                </label>
                <input
                  type="text"
                  value={editSelectedMessageId}
                  onChange={(e) => setEditSelectedMessageId(e.target.value.trim())}
                  placeholder="Paste Discord Message ID..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white text-sm focus:outline-none focus:border-discord-blurple font-mono text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => loadExistingMessage(editSelectedMessageId, editChannelId)}
                  disabled={!editSelectedMessageId || isFetchingEditMessage}
                  className="w-full py-2.5 rounded-xl bg-discord-blurple hover:bg-discord-blurple/90 text-white font-semibold text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isFetchingEditMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Load Embed"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Edit Form (Only shown when message is loaded) */}
          {editLoaded && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Controls */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg">Modify Embed & Roles</h3>
                      <p className="text-xs text-zinc-400">
                        Editing Message <strong className="text-white font-mono">{editSelectedMessageId}</strong> in channel <strong className="text-white font-mono">#{channels.find((c) => c.id === editChannelId)?.name || editChannelId}</strong>
                      </p>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-md bg-discord-blurple/20 text-discord-blurple font-mono font-bold">
                      {editRoles.length} / 25 Roles
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Embed Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value.slice(0, 256))}
                        className="w-full px-4 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white text-sm focus:outline-none focus:border-discord-blurple"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Embed Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value.slice(0, 4096))}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white text-sm focus:outline-none focus:border-discord-blurple"
                      />
                    </div>

                    {/* Color Swatches */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Embed Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setEditColor(c.hex)}
                            className={`w-7 h-7 rounded-lg transition cursor-pointer ${
                              editColor.toLowerCase() === c.hex.toLowerCase()
                                ? "ring-2 ring-white scale-110"
                                : "opacity-80 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer p-0 ml-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Edit Roles List */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Configured Roles ({editRoles.length}/25)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddEditRole}
                        disabled={editRoles.length >= 25}
                        className="text-xs px-2.5 py-1 rounded-lg bg-discord-blurple/20 text-discord-blurple hover:bg-discord-blurple/30 font-semibold transition cursor-pointer disabled:opacity-40"
                      >
                        + Add Role
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editRoles.map((r, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-discord-dark/70 border border-white/10 flex flex-col sm:flex-row items-center gap-2.5"
                        >
                          <div className="w-full sm:w-16">
                            <input
                              type="text"
                              value={r.emoji}
                              onChange={(e) =>
                                handleUpdateEditRole(idx, { emoji: e.target.value })
                              }
                              placeholder="⭐"
                              className="w-full px-2.5 py-2 rounded-lg bg-discord-dark border border-white/10 text-center text-white text-xs"
                            />
                          </div>

                          <div className="flex-1 w-full">
                            <RoleSelect
                              roles={roles}
                              selectedRoleId={r.roleId}
                              onSelect={(roleId, roleName) =>
                                handleUpdateEditRole(idx, { roleId, roleName })
                              }
                              placeholder="Select role..."
                            />
                          </div>

                          <div className="w-full sm:w-28">
                            <select
                              value={r.buttonStyle}
                              onChange={(e) =>
                                handleUpdateEditRole(idx, {
                                  buttonStyle: e.target.value as any,
                                })
                              }
                              className="w-full px-2.5 py-2 rounded-lg bg-discord-dark border border-white/10 text-white text-xs cursor-pointer"
                            >
                              <option value="PRIMARY">Blurple</option>
                              <option value="SECONDARY">Grey</option>
                              <option value="SUCCESS">Green</option>
                              <option value="DANGER">Red</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveEditRole(idx)}
                            disabled={editRoles.length <= 1}
                            className="p-2 rounded-lg text-zinc-500 hover:text-discord-red transition cursor-pointer disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Action */}
                  <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                      onClick={handleUpdateExistingDeck}
                      disabled={updating}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating Discord Message...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          💾 Save & Update Discord Embed
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Side Simulator for Edit */}
              <div className="lg:col-span-5 sticky top-24 space-y-4">
                <div className="p-4 rounded-3xl bg-discord-card border border-white/10 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Live Embed Preview (Updating Msg {editSelectedMessageId})
                    </span>
                  </div>

                  <div className="bg-[#313338] rounded-2xl p-4 text-white space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-discord-blurple flex-shrink-0 relative">
                        <Image src="/pfp.png" alt="Paradox" fill className="object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Paradox</span>
                          <span className="text-[10px] bg-[#5865F2] text-white px-1.5 py-0.5 rounded font-bold">
                            BOT
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="rounded-lg bg-[#2B2D31] p-4 space-y-2 border-l-4"
                      style={{ borderLeftColor: editColor }}
                    >
                      <h4 className="font-bold text-base text-white">{editTitle}</h4>
                      <div className="text-sm text-[#DBDEE1]">
                        <DiscordMarkdown content={editDescription} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {editRoles.map((r, i) => (
                        <div
                          key={i}
                          className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 ${getDiscordButtonClass(
                            r.buttonStyle
                          )}`}
                        >
                          <span>{r.emoji}</span>
                          <span className="truncate">{r.roleName || `Role ${i + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VIEW & DELETE CREATED REACTION ROLES */}
      {/* ========================================================================= */}
      {activeTab === "view" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary & Global Action Bar */}
          <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-discord-blurple" />
                  Deployed Reaction Role Panels
                </h2>
                <p className="text-sm text-zinc-400">
                  Manage, edit, or delete existing reaction role decks deployed in your Discord server.
                </p>
              </div>

              {/* Bulk Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedDecks.length > 0 && (
                  <button
                    onClick={() => {
                      setDeleteTarget({
                        type: "selected",
                        count: selectedDecks.length,
                      });
                      setDeleteConfirmOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-discord-red/20 text-discord-red border border-discord-red/30 hover:bg-discord-red/30 text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedDecks.length})
                  </button>
                )}

                {groupedDecks.length > 0 && (
                  <button
                    onClick={() => {
                      setDeleteTarget({
                        type: "purge",
                        count: groupedDecks.length,
                      });
                      setDeleteConfirmOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-discord-red/10 text-zinc-400 hover:text-discord-red border border-white/10 hover:border-discord-red/30 text-xs font-semibold transition cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Delete All Decks
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Select All */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  {selectedDecks.length > 0 && selectedDecks.length === filteredDecks.length ? (
                    <CheckSquare className="w-4 h-4 text-discord-blurple" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500" />
                  )}
                  Select All
                </button>

                <span className="text-xs text-zinc-500">
                  Showing {filteredDecks.length} of {groupedDecks.length} message decks
                </span>
              </div>

              {/* Search Bar */}
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by role, channel, or message ID..."
                  className="w-full px-3.5 py-1.5 rounded-xl bg-discord-dark border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-discord-blurple"
                />
              </div>
            </div>
          </div>

          {/* Decks Grid / Table */}
          {filteredDecks.length === 0 ? (
            <div className="p-12 rounded-3xl bg-discord-card border border-white/10 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-discord-blurple/10 border border-discord-blurple/20 text-discord-blurple flex items-center justify-center mx-auto">
                <Smile className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Reaction Role Decks Found</h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  {searchQuery
                    ? "No reaction role decks matched your search query."
                    : "You haven't deployed any reaction role messages to Discord yet."}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={() => setActiveTab("create")}
                  className="px-6 py-2.5 rounded-xl bg-discord-blurple hover:bg-discord-blurple/90 text-white font-semibold text-sm transition cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-discord-blurple/20"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Deck
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDecks.map((deck) => {
                const channel = channels.find((c) => c.id === deck.channelId);
                const isSelected = selectedDecks.includes(deck.messageId);

                return (
                  <div
                    key={deck.messageId}
                    className={`p-5 rounded-3xl border transition space-y-4 select-none ${
                      isSelected
                        ? "bg-discord-blurple/5 border-discord-blurple shadow-lg shadow-discord-blurple/10"
                        : "bg-discord-card border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Header Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDeckSelection(deck.messageId)}
                          className="mt-0.5 text-zinc-500 hover:text-white transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-discord-blurple" />
                          ) : (
                            <Square className="w-5 h-5 text-zinc-600" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-base flex items-center gap-1.5">
                              <Hash className="w-4 h-4 text-zinc-400" />
                              {channel?.name || deck.channelId}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-discord-blurple/20 text-discord-blurple">
                              {deck.type}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              {deck.mode}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                            Msg ID: {deck.messageId}
                            <button
                              type="button"
                              onClick={() => copyToClipboard(deck.messageId, deck.messageId)}
                              className="text-zinc-500 hover:text-white transition"
                              title="Copy Message ID"
                            >
                              {copiedId === deck.messageId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </span>
                        </div>
                      </div>

                      {/* Quick Deck Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => loadExistingMessage(deck.messageId, deck.channelId)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-discord-blurple hover:text-white text-zinc-300 transition cursor-pointer"
                          title="Edit Embed"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget({
                              type: "single",
                              messageId: deck.messageId,
                            });
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-discord-red/20 text-zinc-400 hover:text-discord-red transition cursor-pointer"
                          title="Delete Deck"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Roles Badges in Deck */}
                    <div className="p-3 rounded-2xl bg-discord-dark/60 border border-white/5 space-y-2">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Assigned Roles ({deck.roles.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {deck.roles.map((r) => {
                          const matchingRole = roles.find((gr) => gr.id === r.roleId);
                          return (
                            <span
                              key={r.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-discord-card border border-white/10 text-white"
                              style={{
                                borderLeftColor: matchingRole?.color || undefined,
                                borderLeftWidth: matchingRole?.color ? "3px" : undefined,
                              }}
                            >
                              <span>{r.emoji}</span>
                              <span className="font-medium">{r.roleName}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={
          deleteTarget?.type === "purge"
            ? "Purge All Reaction Roles?"
            : deleteTarget?.type === "selected"
            ? `Delete ${deleteTarget.count} Selected Decks?`
            : "Delete Reaction Role Deck?"
        }
        message={
          deleteTarget?.type === "purge"
            ? "Are you sure you want to delete ALL reaction roles from this server? This will remove all database mappings."
            : deleteTarget?.type === "selected"
            ? `Are you sure you want to delete the ${deleteTarget.count} selected reaction role decks?`
            : `Are you sure you want to delete reaction role deck ${deleteTarget?.messageId}?`
        }
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        isLoading={isDeleting}
        isDestructive={true}
        onConfirm={executeDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
