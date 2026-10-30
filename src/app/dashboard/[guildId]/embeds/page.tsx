"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  Palette,
  Hash,
  Shield,
  User,
  Image as ImageIcon,
  HelpCircle,
  Copy,
  Check,
  Calendar,
  Gift,
  Megaphone,
  UserCheck,
  UserX,
  Scroll,
  Smile,
  RefreshCw,
  Clock,
  ChevronDown,
  Search,
  Sliders,
  X,
  ArrowRight,
  Link2,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { DiscordRoleItem } from "@/components/ui/RoleSelect";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { EmbedLinkModal } from "@/components/ui/EmbedLinkModal";
import { DiscordMarkdown } from "@/lib/discordMarkdown";
import { DISCORD_LIMITS } from "@/lib/validations";

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

type EmbedCategory =
  | "welcome"
  | "goodbye"
  | "announcement"
  | "rules"
  | "event"
  | "giveaway"
  | "verify"
  | "custom";

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

const SAMPLE_USER_AVATAR = "https://cdn.discordapp.com/embed/avatars/1.png";
const SAMPLE_SERVER_ICON = "https://cdn.discordapp.com/embed/avatars/0.png";
const BOT_AVATAR = "/pfp.png";

// Helper presets for each category
const EMBED_PRESETS: Record<
  EmbedCategory,
  {
    name: string;
    title: string;
    description: string;
    color: string;
    authorName: string;
    authorIconUrl: string;
    thumbnailUrl: string;
    imageUrl: string;
    footerText: string;
    footerIconUrl: string;
    fields: EmbedField[];
    helpTips: {
      title: string;
      desc: string;
      tags: string[];
      recommendations: string[];
    };
  }
> = {
  welcome: {
    name: "Member Welcome Greeting",
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
    helpTips: {
      title: "Welcome Embed Features & Best Practices",
      desc: "Greet new members with personalized tags and auto-linking channel chips.",
      tags: ["{user.mention}", "{user.name}", "{user.avatar}", "{server.name}", "{server.member_count}", "{server.icon}"],
      recommendations: [
        "Use {user.avatar} as the thumbnail for instant personalization.",
        "Link your rules and role channels using the '+ Add Channel' button above description.",
        "Include {server.member_count} in footer to celebrate milestones.",
      ],
    },
  },
  goodbye: {
    name: "Member Farewell Notice",
    title: "Farewell, {user.name} 👋",
    description:
      "{user.mention} has left **{server.name}**.\n\nWe appreciate the time you spent with our community. Until next time!",
    color: "#ED4245",
    authorName: "Member Departure",
    authorIconUrl: "{server.icon}",
    thumbnailUrl: "{user.avatar}",
    imageUrl: "",
    footerText: "User ID: {user.id} • {server.member_count} members remaining",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "👥 Current Member Count", value: "{server.member_count} active members", inline: true },
      { name: "🆔 Account ID", value: "{user.id}", inline: true },
    ],
    helpTips: {
      title: "Goodbye Embed Features",
      desc: "Keep moderation and departure logs clean while tracking member stats.",
      tags: ["{user.name}", "{user.id}", "{user.avatar}", "{server.member_count}", "{server.name}"],
      recommendations: [
        "Include {user.id} so staff can audit departures.",
        "Set embed color to Crimson Red (#ED4245) or Grey for departure notices.",
        "Post goodbye embeds to a private staff log channel or designated departure channel.",
      ],
    },
  },
  announcement: {
    name: "Official Community Broadcast",
    title: "📢 Major Server Announcement & Roadmap Update",
    description:
      "Attention everyone! We are rolling out a major update to **{server.name}**.\n\nCheck out the full highlights below and let us know your thoughts in {#feedback}!",
    color: "#FEE75C",
    authorName: "Paradox Announcements",
    authorIconUrl: "{server.icon}",
    thumbnailUrl: "{server.icon}",
    imageUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2JvZTVocndobnIycmlpcXRvMXc2MHphZXcyejkyOW8xMWVlaGtwYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oKIPnAiaMCws8nOsE/giphy.gif",
    footerText: "Posted by Server Administration • {server.name}",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "🚀 What's New", value: "New channel organization and upgraded roles.", inline: false },
      { name: "🗓️ Effective Date", value: "Active immediately across all channels.", inline: true },
      { name: "💬 Discuss", value: "Leave feedback in {#general}", inline: true },
    ],
    helpTips: {
      title: "Announcement Embed Features",
      desc: "Broadcast important updates with bold headlines and banner media.",
      tags: ["{server.name}", "{server.icon}", "{date}", "{time}"],
      recommendations: [
        "Add a banner GIF or image URL to maximize engagement.",
        "Use message content outside the embed for role pings like @everyone or @Announcements.",
        "Keep the title concise and bold with relevant emojis.",
      ],
    },
  },
  rules: {
    name: "Server Code of Conduct & Rules",
    title: "📜 Server Rules & Community Guidelines",
    description:
      "Welcome to **{server.name}**! By participating in this community, you agree to abide by these guidelines and Discord's Terms of Service at all times.\n\nStaff reserves the right to enforce rules at their discretion.",
    color: "#57F287",
    authorName: "{server.name} Guidelines",
    authorIconUrl: "{server.icon}",
    thumbnailUrl: "{server.icon}",
    imageUrl: "",
    footerText: "Violations may lead to warnings, mutes, or bans.",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "1. Be Respectful & Kind", value: "No harassment, hate speech, toxicity, or discriminatory remarks.", inline: false },
      { name: "2. No Spam or Self-Promotion", value: "Unsolicited DMs and server invites are strictly prohibited.", inline: false },
      { name: "3. Appropriate Channel Usage", value: "Keep discussions and media within their designated channels.", inline: false },
      { name: "4. Follow Discord ToS", value: "All members must comply with Discord Community Guidelines.", inline: false },
    ],
    helpTips: {
      title: "Rules Embed Features",
      desc: "Create clean, readable guidelines with non-inline numbered fields.",
      tags: ["{server.name}", "{server.icon}"],
      recommendations: [
        "Keep rule fields non-inline (unchecked inline) for clear stacked reading.",
        "Set color to Emerald Green (#57F287) or Electric Blue (#5865F2).",
        "Pin this embed in your #rules channel and link to Reaction Roles for verification.",
      ],
    },
  },
  event: {
    name: "Scheduled Event Announcement",
    title: "🎉 Community Game Night & Voice Stage",
    description:
      "Get ready for our upcoming community hangout in **{server.name}**!\n\nJoin us in voice & stage for games, music, and exclusive prizes!",
    color: "#06B6D4",
    authorName: "Events Team",
    authorIconUrl: "{server.icon}",
    thumbnailUrl: "{server.icon}",
    imageUrl: "",
    footerText: "RSVP by reacting below! • {server.name}",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "🗓️ Date & Time", value: "Saturday @ 8:00 PM EST", inline: true },
      { name: "📍 Location", value: "Stage Channel & Voice Lounge", inline: true },
      { name: "🏆 Prizes", value: "Exclusive Event Role + Discord Nitro", inline: true },
    ],
    helpTips: {
      title: "Event Announcement Features",
      desc: "Promote stage shows, gaming sessions, and live voice gatherings.",
      tags: ["{event.name}", "{event.date}", "{event.location}", "{server.name}"],
      recommendations: [
        "Use Discord relative timestamps like <t:TIMESTAMP:F> for automatic timezones.",
        "Mention the stage/voice channel using '+ Add Channel'.",
        "Ping the @Events role in message content outside the embed.",
      ],
    },
  },
  giveaway: {
    name: "Discord Nitro & Perks Giveaway",
    title: "🎁 Discord Nitro Celebration Giveaway!",
    description:
      "We are hosting a special giveaway to celebrate our community in **{server.name}**!\n\nClick the button or react below to enter. Good luck to all participants!",
    color: "#EB459E",
    authorName: "Paradox Giveaways",
    authorIconUrl: "{server.icon}",
    thumbnailUrl: "https://cdn.discordapp.com/emojis/847055048227094558.gif",
    imageUrl: "",
    footerText: "Must be a verified member of {server.name} to win!",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "🏆 Prize", value: "1 Month Discord Nitro Boost", inline: true },
      { name: "👥 Winners", value: "2 Lucky Members", inline: true },
      { name: "⏰ Duration", value: "Ends in 48 Hours", inline: true },
      { name: "👑 Hosted By", value: "Server Management", inline: false },
    ],
    helpTips: {
      title: "Giveaway Embed Features",
      desc: "Celebrate milestones with high-visibility prize announcements.",
      tags: ["{giveaway.prize}", "{giveaway.winner_count}", "{server.name}"],
      recommendations: [
        "Use Neon Pink (#EB459E) or Gold (#FEE75C) for high click-through rates.",
        "Specify the exact prize and entry requirements in the fields.",
        "Add a celebration GIF in the thumbnail or banner.",
      ],
    },
  },
  verify: {
    name: "Verification & Role Access",
    title: "🛡️ Server Verification & Role Selection",
    description:
      "To unlock full channel access in **{server.name}**, please verify yourself and select your notification roles below!\n\n1. Read our code of conduct in {#rules-and-info}.\n2. Click the button below to confirm agreement and get verified.",
    color: "#8B5CF6",
    authorName: "Security Gateway",
    authorIconUrl: "{server.icon}",
    thumbnailUrl: "{server.icon}",
    imageUrl: "",
    footerText: "Protected by Paradox Security • {server.name}",
    footerIconUrl: "{server.icon}",
    fields: [
      { name: "🔓 Verification", value: "Grants access to community channels.", inline: true },
      { name: "🎭 Notification Roles", value: "Pick up announcement pings in {#roles}.", inline: true },
    ],
    helpTips: {
      title: "Verification Embed Features",
      desc: "Gate server access with rules confirmation and onboarding steps.",
      tags: ["{server.name}", "{user.mention}", "{server.icon}"],
      recommendations: [
        "Pair this embed with the Reaction Roles Studio for interactive button verification.",
        "Set color to Royal Purple (#8B5CF6) for security authority.",
        "Reference rules and roles channels using the '+ Add Channel' tool.",
      ],
    },
  },
  custom: {
    name: "Custom Blank Embed",
    title: "Custom Message Title",
    description: "Write your custom message description here. You can use markdown and placeholder tags freely!",
    color: "#5865F2",
    authorName: "",
    authorIconUrl: "",
    thumbnailUrl: "",
    imageUrl: "",
    footerText: "",
    footerIconUrl: "",
    fields: [],
    helpTips: {
      title: "Custom Embed Freedom",
      desc: "Design any embed from scratch with custom fields, colors, and author tags.",
      tags: ["{user.name}", "{user.avatar}", "{server.name}", "{server.icon}"],
      recommendations: [
        "Use the 3 '+' buttons above description to quickly insert channels, roles, and tags.",
        "Use the PFP & Icon Bar to apply user avatars or server logos in 1-click.",
      ],
    },
  },
};

function EmbedBuilderContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  // Query parameter for initial category
  const initialType = (searchParams.get("type") as EmbedCategory) || "welcome";

  // Server Data
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [roles, setRoles] = useState<DiscordRoleItem[]>([]);
  const [templates, setTemplates] = useState<EmbedTemplate[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [selectedChannelName, setSelectedChannelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Category / Mode
  const [selectedCategory, setSelectedCategory] = useState<EmbedCategory>(
    EMBED_PRESETS[initialType] ? initialType : "welcome"
  );

  // Form Fields
  const [templateName, setTemplateName] = useState(EMBED_PRESETS.welcome.name);
  const [title, setTitle] = useState(EMBED_PRESETS.welcome.title);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState(EMBED_PRESETS.welcome.description);
  const [color, setColor] = useState(EMBED_PRESETS.welcome.color);
  const [authorName, setAuthorName] = useState(EMBED_PRESETS.welcome.authorName);
  const [authorUrl, setAuthorUrl] = useState("");
  const [authorIconUrl, setAuthorIconUrl] = useState(EMBED_PRESETS.welcome.authorIconUrl);
  const [footerText, setFooterText] = useState(EMBED_PRESETS.welcome.footerText);
  const [footerIconUrl, setFooterIconUrl] = useState(EMBED_PRESETS.welcome.footerIconUrl);
  const [timestamp, setTimestamp] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState(EMBED_PRESETS.welcome.thumbnailUrl);
  const [imageUrl, setImageUrl] = useState(EMBED_PRESETS.welcome.imageUrl);
  const [fields, setFields] = useState<EmbedField[]>(EMBED_PRESETS.welcome.fields);

  // Message Content Outside Embed (e.g. @everyone pings)
  const [outsideContent, setOutsideContent] = useState("");

  // Welcome Embed Specific Channel States
  const [autoWelcomeEnabled, setAutoWelcomeEnabled] = useState(true);
  const [welcomeRulesChannelId, setWelcomeRulesChannelId] = useState("");
  const [welcomeRolesChannelId, setWelcomeRolesChannelId] = useState("");
  const [welcomeChatChannelId, setWelcomeChatChannelId] = useState("");

  // Edit Existing Message State
  const [publishMode, setPublishMode] = useState<"new" | "edit">("new");
  const [editMessageId, setEditMessageId] = useState("");
  const [fetchingMessage, setFetchingMessage] = useState(false);

  // Active 3-Plus Dropdown States
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Add Channel Field State
  const [showAddChannelFieldDropdown, setShowAddChannelFieldDropdown] = useState(false);
  const [channelFieldSearch, setChannelFieldSearch] = useState("");

  // Embed Link Modal State
  const [showEmbedLinkModal, setShowEmbedLinkModal] = useState(false);
  const [targetFieldForModal, setTargetFieldForModal] = useState<number | null>(null);

  // Ref to description textarea for precise cursor insertion
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Action status
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function addToast(type: "success" | "error" | "warning" | "info", message: string, toastTitle?: string) {
    setToasts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        message,
        title: toastTitle,
      },
    ]);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // Load server channels, roles, saved templates, and welcome config
  async function loadData() {
    try {
      setRefreshing(true);
      const [cRes, rRes, tRes, wRes] = await Promise.all([
        fetch(`/api/guilds/${guildId}/channels`),
        fetch(`/api/guilds/${guildId}/roles`),
        fetch(`/api/guilds/${guildId}/embeds`),
        fetch(`/api/guilds/${guildId}/welcome`),
      ]);

      let loadedChannels: DiscordChannelItem[] = [];
      if (cRes.ok) {
        const cJson = await cRes.json();
        loadedChannels = cJson.channels || [];
        setChannels(loadedChannels);
        if (loadedChannels.length > 0 && !selectedChannelId) {
          setSelectedChannelId(loadedChannels[0].id);
          setSelectedChannelName(loadedChannels[0].name);
        }
      }
      if (rRes.ok) {
        const rJson = await rRes.json();
        setRoles(rJson.roles || []);
      }
      if (tRes.ok) {
        const tJson = await tRes.json();
        setTemplates(tJson.embeds || []);
      }
      if (wRes.ok) {
        const wJson = await wRes.json();
        if (wJson.config?.welcomeChannelId) {
          if (selectedCategory === "welcome" || initialType === "welcome") {
            setSelectedChannelId(wJson.config.welcomeChannelId);
            const match = loadedChannels.find((c) => c.id === wJson.config.welcomeChannelId);
            if (match) setSelectedChannelName(match.name);
          }
        }
        if (wJson.config?.welcomeEnabled !== undefined) {
          setAutoWelcomeEnabled(wJson.config.welcomeEnabled);
        }
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Failed to fetch server data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Helper: auto-replaces referenced channels in Welcome description and fields with native Discord pings
  function handleSelectMentionedChannel(type: "rules" | "roles" | "chat", chId: string, chName: string) {
    if (type === "rules") {
      setWelcomeRulesChannelId(chId);
      setDescription((prev) =>
        prev.replace(/<#\d+>|\{#rules[^}]*\}|\{#rules-and-info\}/g, `<#${chId}>`)
      );
      setFields((prev) =>
        prev.map((f) =>
          f.name.toLowerCase().includes("rule")
            ? { ...f, value: `Visit <#${chId}>` }
            : f
        )
      );
      addToast("success", `Connected rules channel: #${chName} (ping)`);
    } else if (type === "roles") {
      setWelcomeRolesChannelId(chId);
      setDescription((prev) =>
        prev.replace(/<#\d+>|\{#roles[^}]*\}/g, `<#${chId}>`)
      );
      setFields((prev) =>
        prev.map((f) =>
          f.name.toLowerCase().includes("role")
            ? { ...f, value: `Head to <#${chId}>` }
            : f
        )
      );
      addToast("success", `Connected reaction roles channel: #${chName} (ping)`);
    } else if (type === "chat") {
      setWelcomeChatChannelId(chId);
      setDescription((prev) =>
        prev.replace(/<#\d+>|\{#general[^}]*\}|\{#chat[^}]*\}/g, `<#${chId}>`)
      );
      setFields((prev) =>
        prev.map((f) =>
          f.name.toLowerCase().includes("chat")
            ? { ...f, value: `Say hi in <#${chId}>` }
            : f
        )
      );
      addToast("success", `Connected general chat channel: #${chName} (ping)`);
    }
  }

  useEffect(() => {
    loadData();
  }, [guildId]);

  // If query parameter changes, apply preset
  useEffect(() => {
    if (initialType && EMBED_PRESETS[initialType]) {
      applyCategoryPreset(initialType);
    }
  }, [initialType]);

  // Apply category preset
  function applyCategoryPreset(cat: EmbedCategory) {
    setSelectedCategory(cat);
    const p = EMBED_PRESETS[cat];
    if (!p) return;
    setTemplateName(p.name);
    setTitle(p.title);
    setDescription(p.description);
    setColor(p.color);
    setAuthorName(p.authorName);
    setAuthorIconUrl(p.authorIconUrl);
    setThumbnailUrl(p.thumbnailUrl);
    setImageUrl(p.imageUrl);
    setFooterText(p.footerText);
    setFooterIconUrl(p.footerIconUrl);
    setFields(p.fields);
    addToast("info", `Applied ${p.name} template.`);
  }

  // -------------------------------------------------------------
  // Insertion Helper: Inserts string at cursor in description textarea
  // -------------------------------------------------------------
  function insertIntoDescription(textToInsert: string) {
    const textarea = descTextareaRef.current;
    if (!textarea) {
      setDescription((prev) => prev + " " + textToInsert);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prevVal = description;
    const before = prevVal.substring(0, start);
    const after = prevVal.substring(end);

    const newVal = before + textToInsert + after;
    setDescription(newVal);

    // Reposition cursor right after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 50);

    addToast("success", `Inserted ${textToInsert}`);
  }

  // -------------------------------------------------------------
  // Field Management & Channel Selectors
  // -------------------------------------------------------------
  const textChannels = channels.filter(
    (c) => c.type === 0 || c.type === 5 || c.type === undefined
  );

  function addField() {
    if (fields.length >= DISCORD_LIMITS.FIELDS_MAX) {
      addToast("warning", `Maximum ${DISCORD_LIMITS.FIELDS_MAX} fields allowed by Discord.`);
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
    const isRule = chName.includes("rule");
    const isRole = chName.includes("role");
    const isAnnounce = chName.includes("announc");
    const isChat = chName.includes("chat") || chName.includes("general");
    const icon = isRule ? "📜" : isRole ? "🎭" : isAnnounce ? "📢" : isChat ? "💬" : "🔗";
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

  // -------------------------------------------------------------
  // Save Embed Template
  // -------------------------------------------------------------
  async function handleSaveTemplate() {
    try {
      setSaving(true);
      const payload = {
        name: templateName.trim() || "Untitled Embed",
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        color,
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

      const res = await fetch(`/api/guilds/${guildId}/embeds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to save template");
      }

      addToast("success", `Saved template "${templateName}"!`);
      await loadData();
    } catch (err: any) {
      console.error(err);
      addToast("error", err.message || "Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------------------------
  // Publish Embed to Discord (or Edit existing message)
  // -------------------------------------------------------------
  async function handlePublishEmbed() {
    if (!selectedChannelId) {
      addToast("error", "Please select a destination channel.");
      return;
    }

    if (publishMode === "edit" && !editMessageId.trim()) {
      addToast("error", "Please provide a valid Discord Message ID to edit.");
      return;
    }

    try {
      setPublishing(true);
      const payload = {
        channelId: selectedChannelId,
        messageId: publishMode === "edit" ? editMessageId.trim() : undefined,
        content: outsideContent.trim() || undefined,
        embed: {
          name: templateName,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          url: url.trim() || undefined,
          color,
          authorName: authorName.trim() || undefined,
          authorUrl: authorUrl.trim() || undefined,
          authorIconUrl: authorIconUrl.trim() || undefined,
          footerText: footerText.trim() || undefined,
          footerIconUrl: footerIconUrl.trim() || undefined,
          timestamp,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          fields,
        },
      };

      const res = await fetch(`/api/guilds/${guildId}/embeds/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to publish embed to Discord");
      }

      // If Welcome category and automated welcome is enabled, also sync with bot's auto-welcome system
      if (selectedCategory === "welcome" && autoWelcomeEnabled && selectedChannelId) {
        await fetch(`/api/guilds/${guildId}/welcome`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            welcomeEnabled: true,
            welcomeChannelId: selectedChannelId,
            welcomeMessage: outsideContent || undefined,
            welcomeEmbed: JSON.stringify({
              title,
              description,
              color,
              authorName,
              authorIconUrl,
              thumbnailUrl,
              imageUrl,
              footerText,
              footerIconUrl,
              fields,
            }),
          }),
        }).catch(() => null);
      }

      addToast(
        "success",
        publishMode === "edit"
          ? `Successfully updated message ${editMessageId} in #${selectedChannelName}!`
          : selectedCategory === "welcome" && autoWelcomeEnabled
          ? `Published embed to #${selectedChannelName} & activated automated welcome for new members!`
          : `Successfully published embed to #${selectedChannelName}!`
      );
    } catch (err: any) {
      console.error(err);
      addToast("error", err.message || "Failed to publish embed to Discord.");
    } finally {
      setPublishing(false);
    }
  }

  // -------------------------------------------------------------
  // Fetch Existing Message for Editing
  // -------------------------------------------------------------
  async function handleFetchExistingMessage() {
    if (!editMessageId.trim() || !selectedChannelId) {
      addToast("error", "Please provide both destination channel and Message ID.");
      return;
    }

    try {
      setFetchingMessage(true);
      const res = await fetch(
        `/api/guilds/${guildId}/embeds/fetch-message?channelId=${selectedChannelId}&messageId=${editMessageId.trim()}`
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to fetch message from Discord");
      }

      const json = await res.json();
      const msg = json.message;

      if (msg.content) {
        setOutsideContent(msg.content);
      }

      if (msg.embeds && msg.embeds.length > 0) {
        const emb = msg.embeds[0];
        setTitle(emb.title || "");
        setDescription(emb.description || "");
        if (emb.color !== undefined) {
          setColor(`#${emb.color.toString(16).padStart(6, "0")}`);
        }
        if (emb.author) {
          setAuthorName(emb.author.name || "");
          setAuthorUrl(emb.author.url || "");
          setAuthorIconUrl(emb.author.icon_url || "");
        }
        if (emb.footer) {
          setFooterText(emb.footer.text || "");
          setFooterIconUrl(emb.footer.icon_url || "");
        }
        if (emb.thumbnail) {
          setThumbnailUrl(emb.thumbnail.url || "");
        }
        if (emb.image) {
          setImageUrl(emb.image.url || "");
        }
        if (emb.fields && Array.isArray(emb.fields)) {
          setFields(
            emb.fields.map((f: any) => ({
              name: f.name,
              value: f.value,
              inline: !!f.inline,
            }))
          );
        }
        addToast("success", `Loaded message ${editMessageId.trim()} into the editor!`);
      } else {
        addToast("warning", "The fetched message exists but does not contain an embed.");
      }
    } catch (err: any) {
      console.error(err);
      addToast("error", err.message || "Failed to load message.");
    } finally {
      setFetchingMessage(false);
    }
  }

  // -------------------------------------------------------------
  // Preview Helpers (Resolves user avatar and server icon for live simulator)
  // -------------------------------------------------------------
  function resolvePreviewMedia(urlStr?: string | null) {
    if (!urlStr) return "";
    if (urlStr.includes("{user.avatar}") || urlStr.includes("{user.pfp}")) return SAMPLE_USER_AVATAR;
    if (urlStr.includes("{server.icon}")) return SAMPLE_SERVER_ICON;
    return urlStr;
  }

  function resolvePreviewText(text?: string | null) {
    if (!text) return "";
    let res = text
      .replace(/{user\.name}/g, "Alex")
      .replace(/{user\.mention}/g, "@Alex")
      .replace(/{user\.id}/g, "1547837282109624462")
      .replace(/{server\.name}/g, "Paradox Community")
      .replace(/{server\.member_count}/g, "1,248")
      .replace(/{giveaway\.prize}/g, "Discord Nitro Boost")
      .replace(/{giveaway\.winner_count}/g, "2")
      .replace(/{event\.name}/g, "Community Hangout")
      .replace(/{event\.date}/g, "Saturday @ 8:00 PM EST")
      .replace(/{event\.location}/g, "Stage Channel");

    // Replace native channel mentions <#123456> with #channel-name
    res = res.replace(/<#(\d+)>/g, (match, id) => {
      const ch = channels.find((c) => c.id === id);
      return ch ? `#${ch.name}` : match;
    });

    // Replace channel mention tags {#channel-name} with #channel-name
    res = res.replace(/\{#([a-zA-Z0-9_\-]+)\}/g, "#$1");
    return res;
  }

  const totalCharacters =
    (title?.length || 0) +
    (description?.length || 0) +
    (authorName?.length || 0) +
    (footerText?.length || 0) +
    fields.reduce((acc, f) => acc + (f.name?.length || 0) + (f.value?.length || 0), 0);

  const activeHelper = EMBED_PRESETS[selectedCategory]?.helpTips;

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/5">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                Visual Embeds Studio
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  Pro Builder
                </span>
              </h1>
              <p className="text-sm text-zinc-400">
                Design custom Discord embeds with live preview, avatar/server PFP tools, and channel/role chips.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action & Refresh */}
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${guildId}/reaction-roles`}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-discord-card border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition text-xs font-semibold"
          >
            <Smile className="w-4 h-4 text-amber-400" />
            Reaction Roles Studio
          </Link>

          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-discord-card border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Sync
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EMBED TEMPLATE PRESETS HUB (Welcome, Goodbye, Announcement, Rules, Event, Giveaway, etc.) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Choose Embed Type & Purpose:
          </span>
          <span className="text-xs text-zinc-500">
            Clicking an option loads tailored content & helpful feature tools
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { id: "welcome", label: "Welcome", icon: UserCheck, color: "text-indigo-400", border: "border-indigo-500/30" },
            { id: "goodbye", label: "Goodbye", icon: UserX, color: "text-rose-400", border: "border-rose-500/30" },
            { id: "announcement", label: "Announcement", icon: Megaphone, color: "text-amber-400", border: "border-amber-500/30" },
            { id: "rules", label: "Rules", icon: Scroll, color: "text-emerald-400", border: "border-emerald-500/30" },
            { id: "event", label: "Event", icon: Calendar, color: "text-cyan-400", border: "border-cyan-500/30" },
            { id: "giveaway", label: "Giveaway", icon: Gift, color: "text-pink-400", border: "border-pink-500/30" },
            { id: "verify", label: "Verify & Roles", icon: Shield, color: "text-purple-400", border: "border-purple-500/30" },
            { id: "custom", label: "Custom", icon: Sliders, color: "text-zinc-400", border: "border-white/10" },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = selectedCategory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => applyCategoryPreset(item.id as EmbedCategory)}
                className={`p-3 rounded-2xl border transition flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer select-none ${
                  isSelected
                    ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/10 ring-1 ring-purple-500/50"
                    : "bg-discord-card border-white/5 hover:border-white/15 text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-xs font-bold truncate w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FEATURE HELPER BANNER FOR SELECTED EMBED TYPE */}
      {activeHelper && (
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 mt-0.5 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                {activeHelper.title}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {activeHelper.desc}
              </p>
            </div>
          </div>

          {/* Quick Recommended Tags to Click */}
          <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] text-zinc-400 font-semibold mr-1">Recommended Tags:</span>
            {activeHelper.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertIntoDescription(tag)}
                className="text-xs px-2 py-0.5 rounded-md bg-purple-500/15 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 font-mono transition cursor-pointer"
                title={`Click to insert ${tag}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN 2-COLUMN LAYOUT: EDITOR (LEFT) / LIVE DISCORD SIMULATOR (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: EMBED BUILDER FORM */}
        <div className="lg:col-span-7 space-y-6">
          {/* Destination Channel & Publishing Mode */}
          <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-discord-blurple" />
                  {selectedCategory === "welcome"
                    ? "🎯 Welcome Destination Channel"
                    : selectedCategory === "goodbye"
                    ? "👋 Goodbye / Logs Channel"
                    : selectedCategory === "announcement"
                    ? "📢 Announcement Channel"
                    : selectedCategory === "rules"
                    ? "📜 Rules Channel"
                    : selectedCategory === "event"
                    ? "📅 Event Channel"
                    : selectedCategory === "giveaway"
                    ? "🎁 Giveaway Channel"
                    : "📍 Destination Discord Channel"}
                </span>
                <p className="text-xs text-zinc-400">
                  {selectedCategory === "welcome"
                    ? "Choose the Discord channel where new members will be greeted with this welcome embed (e.g. #welcome or #joins)."
                    : "Select which channel receives this embed or toggle Edit Mode for existing messages."}
                </p>
              </div>

              {/* Mode Toggle: New Message vs Edit Existing */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-discord-dark border border-white/10 select-none">
                <button
                  type="button"
                  onClick={() => setPublishMode("new")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    publishMode === "new"
                      ? "bg-discord-blurple text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Publish New
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode("edit")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    publishMode === "edit"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Edit Existing
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className={publishMode === "edit" ? "sm:col-span-6" : "sm:col-span-12"}>
                <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                  <span>
                    {selectedCategory === "welcome" ? "Welcome Channel" : "Target Discord Channel"}{" "}
                    <span className="text-rose-400">*</span>
                  </span>
                  {selectedChannelName && (
                    <span className="text-xs font-mono text-discord-blurple">
                      #{selectedChannelName}
                    </span>
                  )}
                </label>
                <ChannelSelect
                  channels={channels}
                  selectedChannelId={selectedChannelId}
                  placeholder={
                    selectedCategory === "welcome"
                      ? "Choose welcome channel (e.g. #welcome)..."
                      : "Select destination channel..."
                  }
                  onSelect={(id, name) => {
                    setSelectedChannelId(id);
                    setSelectedChannelName(name);
                  }}
                  onRefresh={loadData}
                  refreshing={refreshing}
                />
              </div>

              {publishMode === "edit" && (
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Message ID to Edit
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editMessageId}
                      onChange={(e) => setEditMessageId(e.target.value.trim())}
                      placeholder="Paste Discord Message ID..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleFetchExistingMessage}
                      disabled={fetchingMessage || !editMessageId}
                      className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer flex-shrink-0"
                    >
                      {fetchingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Automated Server Welcome Toggle (when Welcome category is active) */}
            {selectedCategory === "welcome" && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/25 flex items-center justify-between gap-4 mt-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <span>🌟 Auto-Welcome on Member Join</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                      Automated
                    </span>
                  </span>
                  <p className="text-xs text-zinc-300">
                    Automatically post this welcome embed into #{selectedChannelName || "welcome"} whenever a new member joins your Discord server.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoWelcomeEnabled(!autoWelcomeEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 flex-shrink-0 ${
                    autoWelcomeEnabled ? "bg-discord-blurple" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      autoWelcomeEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Optional Outside Content (pings like @everyone) */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Message Text Outside Embed (Optional)</span>
                <span className="text-[11px] text-zinc-500">e.g. @everyone or announcement pings</span>
              </label>
              <input
                type="text"
                value={outsideContent}
                onChange={(e) => setOutsideContent(e.target.value)}
                placeholder="Hey @everyone! Check out this new update below..."
                className="w-full px-4 py-2 rounded-xl bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* MENTIONED CHANNELS PICKER FOR WELCOME EMBED */}
          {selectedCategory === "welcome" && (
            <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Connect Channels Mentioned in Welcome Embed
                </span>
                <p className="text-xs text-zinc-400">
                  Select your server channels below to automatically update the channel chips in the welcome description and fields.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Rules Channel Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300 block">
                    📜 Rules Channel
                  </label>
                  <ChannelSelect
                    channels={channels}
                    selectedChannelId={welcomeRulesChannelId}
                    placeholder="Pick rules channel..."
                    onSelect={(id, name) => handleSelectMentionedChannel("rules", id, name)}
                    onRefresh={loadData}
                    refreshing={refreshing}
                  />
                </div>

                {/* Roles Channel Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300 block">
                    🎭 Reaction Roles Channel
                  </label>
                  <ChannelSelect
                    channels={channels}
                    selectedChannelId={welcomeRolesChannelId}
                    placeholder="Pick roles channel..."
                    onSelect={(id, name) => handleSelectMentionedChannel("roles", id, name)}
                    onRefresh={loadData}
                    refreshing={refreshing}
                  />
                </div>

                {/* General Chat Channel Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300 block">
                    💬 General Chat Channel
                  </label>
                  <ChannelSelect
                    channels={channels}
                    selectedChannelId={welcomeChatChannelId}
                    placeholder="Pick general chat..."
                    onSelect={(id, name) => handleSelectMentionedChannel("chat", id, name)}
                    onRefresh={loadData}
                    refreshing={refreshing}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. DEDICATED PROFILE PICTURE (PFP) & ICON BAR */}
          {/* ========================================================================= */}
          <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                Profile Picture (PFP) & Media Bar
              </span>
              <p className="text-xs text-zinc-400">
                Easily apply the member's profile picture or your server icon to the author or thumbnail in 1 click.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Member Avatar Pill */}
              <div className="p-3.5 rounded-2xl bg-discord-dark/70 border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-discord-blurple relative flex-shrink-0">
                    <img src={SAMPLE_USER_AVATAR} alt="User" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Member Avatar</h4>
                    <span className="text-[10px] text-zinc-400 font-mono">{"{user.avatar}"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorIconUrl("{user.avatar}");
                      addToast("success", "Set {user.avatar} as Author Icon");
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-purple-600 hover:text-white text-zinc-300 text-[11px] font-semibold transition text-center cursor-pointer"
                  >
                    Author Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailUrl("{user.avatar}");
                      addToast("success", "Set {user.avatar} as Thumbnail");
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-purple-600 hover:text-white text-zinc-300 text-[11px] font-semibold transition text-center cursor-pointer"
                  >
                    Thumbnail
                  </button>
                </div>
              </div>

              {/* Server Icon Pill */}
              <div className="p-3.5 rounded-2xl bg-discord-dark/70 border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl overflow-hidden bg-emerald-600 relative flex-shrink-0">
                    <img src={SAMPLE_SERVER_ICON} alt="Server" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Server Icon</h4>
                    <span className="text-[10px] text-zinc-400 font-mono">{"{server.icon}"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorIconUrl("{server.icon}");
                      addToast("success", "Set {server.icon} as Author Icon");
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-purple-600 hover:text-white text-zinc-300 text-[11px] font-semibold transition text-center cursor-pointer"
                  >
                    Author Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailUrl("{server.icon}");
                      addToast("success", "Set {server.icon} as Thumbnail");
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-purple-600 hover:text-white text-zinc-300 text-[11px] font-semibold transition text-center cursor-pointer"
                  >
                    Thumbnail
                  </button>
                </div>
              </div>

              {/* Paradox Bot Icon Pill */}
              <div className="p-3.5 rounded-2xl bg-discord-dark/70 border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-discord-blurple relative flex-shrink-0">
                    <Image src={BOT_AVATAR} alt="Bot" fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Bot Avatar</h4>
                    <span className="text-[10px] text-zinc-400 font-mono">Paradox /pfp.png</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorIconUrl(BOT_AVATAR);
                      addToast("success", "Set Paradox Bot Icon as Author");
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-purple-600 hover:text-white text-zinc-300 text-[11px] font-semibold transition text-center cursor-pointer"
                  >
                    Author Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFooterIconUrl(BOT_AVATAR);
                      addToast("success", "Set Paradox Bot Icon as Footer");
                    }}
                    className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-purple-600 hover:text-white text-zinc-300 text-[11px] font-semibold transition text-center cursor-pointer"
                  >
                    Footer Icon
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. EMBED CONTENT & THE 3 PLUS SYMBOLS ABOVE DESCRIPTION */}
          {/* ========================================================================= */}
          <div className="p-6 rounded-3xl bg-discord-card border border-white/10 shadow-xl space-y-6">
            {/* Color Swatches & Template Title */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Embed Accent Color
                </label>
                <span className="text-xs font-mono text-zinc-400">{color}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`w-8 h-8 rounded-xl transition cursor-pointer flex items-center justify-center ${
                      color.toLowerCase() === c.hex.toLowerCase()
                        ? "ring-2 ring-white scale-110 shadow-lg"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {color.toLowerCase() === c.hex.toLowerCase() && (
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    )}
                  </button>
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-xl bg-transparent border-0 cursor-pointer p-0 ml-1"
                />
              </div>
            </div>

            {/* Author Section */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                Author Header (Optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Author Name (e.g. {server.name})..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  value={authorIconUrl}
                  onChange={(e) => setAuthorIconUrl(e.target.value)}
                  placeholder="Author Icon URL or {user.avatar}..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Title Section */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Embed Title
                </label>
                <span className="text-xs text-zinc-500">{title.length}/256</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 256))}
                placeholder="Give your embed a prominent title..."
                className="w-full px-4 py-3 rounded-2xl bg-discord-dark border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* DESCRIPTION SECTION WITH THE 3 PLUS SYMBOLS ABOVE IT */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              {/* THE 3 PLUS SYMBOLS TOOLBAR (Channels, Roles, Tags) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-discord-dark/90 p-2.5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 ml-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Insert Tools:
                </span>

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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-discord-blurple/20 hover:bg-discord-blurple/30 text-discord-blurple border border-discord-blurple/40 text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <Hash className="w-3.5 h-3.5" />
                      <span>Add Channel</span>
                    </button>

                    {showChannelDropdown && (
                      <div className="absolute left-0 mt-2 w-64 p-2.5 rounded-2xl bg-[#1e1f22] border border-white/15 shadow-2xl z-50 space-y-2 animate-in fade-in duration-100">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-discord-blurple" />
                            Select Channel to Insert
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={loadData}
                              disabled={refreshing}
                              title="Refresh channels from Discord"
                              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-discord-blurple" : ""}`} />
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

                        <input
                          type="text"
                          value={channelSearch}
                          onChange={(e) => setChannelSearch(e.target.value)}
                          placeholder="Search channels..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-white text-xs focus:outline-none"
                        />

                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {channels
                            .filter((c) =>
                              c.name.toLowerCase().includes(channelSearch.toLowerCase())
                            )
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  insertIntoDescription(`<#${c.id}>`);
                                  setShowChannelDropdown(false);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left text-xs text-zinc-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                                <span className="truncate">{c.name}</span>
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
                      <div className="absolute left-0 mt-2 w-64 p-2.5 rounded-2xl bg-[#1e1f22] border border-white/15 shadow-2xl z-50 space-y-2 animate-in fade-in duration-100">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                            Select Role to Insert
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowRoleDropdown(false)}
                            className="text-zinc-500 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={roleSearch}
                          onChange={(e) => setRoleSearch(e.target.value)}
                          placeholder="Search server roles..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-white text-xs focus:outline-none"
                        />

                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {roles
                            .filter((r) =>
                              r.name.toLowerCase().includes(roleSearch.toLowerCase())
                            )
                            .map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  insertIntoDescription(`{@${r.name}}`);
                                  setShowRoleDropdown(false);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left text-xs text-zinc-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: r.color || "#99aab5" }}
                                />
                                <span className="truncate">{r.name}</span>
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

                        {/* Event & Giveaway Tags */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                            🎁 Event & Giveaway Tags:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {["{giveaway.prize}", "{giveaway.winner_count}", "{event.name}", "{event.date}", "{event.location}"].map((t) => (
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

                        {/* Markdown helpers */}
                        <div className="space-y-1 border-t border-white/10 pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                            📝 Formatting:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { label: "Bold", tag: "**text**" },
                              { label: "Italic", tag: "*text*" },
                              { label: "Underline", tag: "__text__" },
                              { label: "Quote", tag: "> " },
                              { label: "Code", tag: "`code`" },
                            ].map((m) => (
                              <button
                                key={m.label}
                                type="button"
                                onClick={() => {
                                  insertIntoDescription(m.tag);
                                  setShowTagDropdown(false);
                                }}
                                className="text-[11px] px-2 py-0.5 rounded bg-discord-dark hover:bg-white/15 text-zinc-300 border border-white/5 transition cursor-pointer"
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. PLUS EMBED LINK TOOL */}
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

              {/* Textarea */}
              <div className="space-y-1">
                <textarea
                  ref={descTextareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 4096))}
                  rows={5}
                  placeholder="Describe your announcement, rules, or welcome message..."
                  className="w-full px-4 py-3 rounded-2xl bg-discord-dark border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 leading-relaxed font-sans resize-y"
                />
                <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                  <span>Supports Discord markdown, variables, and channel mentions</span>
                  <span>{description.length}/4096</span>
                </div>

                {/* 1-Click Server Channel Quick Chips */}
                {textChannels.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 px-1">
                    <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                      <Hash className="w-3 h-3 text-indigo-400" />
                      Quick Insert Channel:
                    </span>
                    {textChannels.slice(0, 7).map((c) => (
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
                      onClick={loadData}
                      disabled={refreshing}
                      className="text-[10px] p-1 rounded-md text-zinc-500 hover:text-white transition"
                      title="Refresh channels"
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Fields Section (Inline / Stacked) */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Embed Fields ({fields.length}/{DISCORD_LIMITS.FIELDS_MAX})</span>
                  {selectedCategory === "welcome" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                      Welcome Channels
                    </span>
                  )}
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

                  {/* Add Channel Field with Searchable Dropdown */}
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
                              onClick={loadData}
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

                  {/* 3. ADD LINK FIELD BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetFieldForModal(-1);
                      setShowEmbedLinkModal(true);
                    }}
                    disabled={fields.length >= DISCORD_LIMITS.FIELDS_MAX}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add a new field containing a clickable link: [Text](URL)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Add Link Field</span>
                  </button>
                </div>
              </div>

              {/* Welcome Embed Quick Channel Field Shortcuts */}
              {selectedCategory === "welcome" && (
                <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Welcome Guide Channel Fields
                    </span>
                    <span className="text-[10px] text-indigo-300">
                      1-click add guidance channels for new members
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addQuickWelcomeField("rules", "📜 Read Rules", "Visit {#rules}")}
                      className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer font-medium"
                    >
                      + 📜 Rules Channel Field
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuickWelcomeField("roles", "🎭 Pick Roles", "Head to {#roles}")}
                      className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 transition flex items-center gap-1 cursor-pointer font-medium"
                    >
                      + 🎭 Roles Channel Field
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuickWelcomeField("general", "💬 Say Hi", "Say hi in {#general}")}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer font-medium"
                    >
                      + 💬 Chat Channel Field
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
              )}

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
                              onClick={loadData}
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

            {/* Thumbnail, Banner & Footer */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                Images & Footer
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                    Thumbnail Image URL (Top Right)
                  </label>
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="e.g. {user.avatar} or image URL..."
                    className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                    Large Main Banner Image URL
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://media.giphy.com/.../giphy.gif"
                    className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value.slice(0, 2048))}
                    placeholder="Footer text or {server.name}..."
                    className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                    Footer Icon URL
                  </label>
                  <input
                    type="text"
                    value={footerIconUrl}
                    onChange={(e) => setFooterIconUrl(e.target.value)}
                    placeholder="{server.icon} or icon URL..."
                    className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={saving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save as Template
              </button>

              <button
                type="button"
                onClick={handlePublishEmbed}
                disabled={publishing}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 transition cursor-pointer flex items-center justify-center gap-2 select-none"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing to Discord...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {publishMode === "edit"
                      ? "💾 Update Discord Message"
                      : "🚀 Publish Embed to Channel"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY REAL-TIME DISCORD SIMULATOR */}
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
                #{selectedChannelName || "select-channel"}
              </span>
            </div>

            {/* Discord Chat Simulator */}
            <div className="bg-[#313338] rounded-2xl p-4 text-white space-y-3 shadow-inner">
              {/* Bot Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-discord-blurple flex-shrink-0 relative">
                  <Image src={BOT_AVATAR} alt="Paradox" fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">Paradox</span>
                    <span className="text-[10px] bg-[#5865F2] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      BOT
                    </span>
                    <span className="text-[11px] text-[#949BA4]">Today at 12:00 PM</span>
                  </div>

                  {/* Outside Message Content (if any) */}
                  {outsideContent && (
                    <p className="text-sm text-[#DBDEE1] mt-1 break-words">
                      {outsideContent}
                    </p>
                  )}
                </div>
              </div>

              {/* Embed Box with Color Strip */}
              <div
                className="ml-0 sm:ml-12 rounded-lg bg-[#2B2D31] p-4 space-y-3 border-l-4 transition-colors"
                style={{ borderLeftColor: color }}
              >
                {/* Author Info */}
                {authorName && (
                  <div className="flex items-center gap-2">
                    {authorIconUrl && (
                      <img
                        src={resolvePreviewMedia(authorIconUrl)}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as any).style.display = "none";
                        }}
                      />
                    )}
                    <span className="text-xs font-bold text-white hover:underline cursor-pointer">
                      {resolvePreviewText(authorName)}
                    </span>
                  </div>
                )}

                {/* Title & Thumbnail Grid */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    {title && (
                      <h3 className="font-bold text-base text-white hover:underline cursor-pointer">
                        {resolvePreviewText(title)}
                      </h3>
                    )}

                    {description && (
                      <div className="text-sm text-[#DBDEE1] leading-relaxed break-words">
                        <DiscordMarkdown content={resolvePreviewText(description)} />
                      </div>
                    )}
                  </div>

                  {thumbnailUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-discord-dark flex-shrink-0 border border-white/5">
                      <img
                        src={resolvePreviewMedia(thumbnailUrl)}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Fields */}
                {fields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {fields.map((f, i) => (
                      <div
                        key={i}
                        className={`space-y-0.5 ${
                          f.inline ? "col-span-1" : "col-span-1 sm:col-span-3"
                        }`}
                      >
                        <span className="text-xs font-bold text-white block">
                          {resolvePreviewText(f.name)}
                        </span>
                        <div className="text-xs text-[#DBDEE1] break-words">
                          <DiscordMarkdown content={resolvePreviewText(f.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Large Image Banner */}
                {imageUrl && (
                  <div className="rounded-lg overflow-hidden max-h-56 relative border border-white/5">
                    <img
                      src={imageUrl}
                      alt="Banner"
                      className="w-full object-cover max-h-56"
                      onError={(e) => {
                        (e.target as any).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Footer & Timestamp */}
                {(footerText || timestamp) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[11px] text-[#949BA4]">
                    {footerIconUrl && (
                      <img
                        src={resolvePreviewMedia(footerIconUrl)}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as any).style.display = "none";
                        }}
                      />
                    )}
                    <span>{resolvePreviewText(footerText)}</span>
                    {footerText && timestamp && <span>•</span>}
                    {timestamp && <span>Today at 12:00 PM</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Character Count Budget Meter */}
            <div className="p-3 rounded-2xl bg-discord-dark border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Discord Character Budget:</span>
                <span className={totalCharacters > 6000 ? "text-rose-400 font-bold" : "text-white"}>
                  {totalCharacters} / 6000 chars
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    totalCharacters > 6000 ? "bg-rose-500" : "bg-purple-500"
                  }`}
                  style={{ width: `${Math.min(100, (totalCharacters / 6000) * 100)}%` }}
                />
              </div>
            </div>
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

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function EmbedBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      }
    >
      <EmbedBuilderContent />
    </Suspense>
  );
}
