"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Gift,
  Plus,
  Trash2,
  Trophy,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { RoleSelect, DiscordRoleItem } from "@/components/ui/RoleSelect";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

interface GiveawayItem {
  id: string;
  channelId: string;
  messageId: string | null;
  prize: string;
  description: string | null;
  winnersCount: number;
  endsAt: string;
  status: string;
  requiredRoleId: string | null;
  createdAt: string;
}

export default function GiveawaysPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [roles, setRoles] = useState<DiscordRoleItem[]>([]);
  const [giveaways, setGiveaways] = useState<GiveawayItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form State
  const [channelId, setChannelId] = useState("");
  const [prize, setPrize] = useState("Discord Nitro (1 Month)");
  const [description, setDescription] = useState(
    "React with the button below to participate in our server giveaway!"
  );
  const [winnersCount, setWinnersCount] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [requiredRoleId, setRequiredRoleId] = useState("");

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
        const [channelsRes, rolesRes, giveawaysRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/roles`),
          fetch(`/api/guilds/${guildId}/giveaways`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
        }

        if (rolesRes.ok) {
          const rData = await rolesRes.json();
          setRoles(rData.roles || []);
        }

        if (giveawaysRes.ok) {
          const gData = await giveawaysRes.json();
          setGiveaways(gData.giveaways || []);
        }
      } catch {
        addToast("error", "Failed to load giveaways");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) init();
  }, [guildId]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId || !prize.trim()) {
      addToast("warning", "Destination channel and prize name are required.", "Missing fields");
      return;
    }

    try {
      setStarting(true);
      const res = await fetch(`/api/guilds/${guildId}/giveaways`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          prize,
          description,
          winnersCount,
          durationMinutes,
          requiredRoleId: requiredRoleId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start giveaway");

      setGiveaways((prev) => [data.giveaway, ...prev]);
      addToast("success", `Giveaway for "${prize}" started on Discord!`, "Launched");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error launching giveaway");
    } finally {
      setStarting(false);
    }
  }

  async function handleEnd(id: string) {
    try {
      const res = await fetch(`/api/guilds/${guildId}/giveaways`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "END" }),
      });
      if (res.ok) {
        setGiveaways((prev) =>
          prev.map((g) => (g.id === id ? { ...g, status: "ENDED" } : g))
        );
        addToast("info", "Giveaway ended.");
      }
    } catch {
      addToast("error", "Failed to end giveaway");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this giveaway record?")) return;

    try {
      const res = await fetch(`/api/guilds/${guildId}/giveaways?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setGiveaways((prev) => prev.filter((g) => g.id !== id));
        addToast("info", "Giveaway record deleted.");
      }
    } catch {
      addToast("error", "Failed to delete giveaway");
    }
  }

  const calculatedEnd = new Date(Date.now() + durationMinutes * 60 * 1000);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-discord-blurple animate-spin" />
        <p className="text-xs text-zinc-400">Loading giveaways module...</p>
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
            <Gift className="w-3.5 h-3.5" />
            <span>Community Rewards</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Giveaway Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Host automated giveaways with interactive enter buttons, role prerequisites, and live countdowns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Create Giveaway */}
        <form onSubmit={handleStart} className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-discord-blurple" />
              <span>Launch a New Giveaway</span>
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Destination Channel</label>
              <ChannelSelect
                channels={channels}
                selectedChannelId={channelId}
                onSelect={(id) => setChannelId(id)}
                placeholder="Choose giveaway channel..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Prize Name</label>
              <input
                type="text"
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                placeholder="e.g. Discord Nitro or Steam Giftcard"
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Number of Winners</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={winnersCount}
                  onChange={(e) => setWinnersCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Duration (Minutes)</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                >
                  <option value={10}>10 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={360}>6 Hours</option>
                  <option value={720}>12 Hours</option>
                  <option value={1440}>24 Hours (1 Day)</option>
                  <option value={4320}>3 Days</option>
                  <option value={10080}>1 Week</option>
                </select>
              </div>
            </div>

            {/* Role Requirement */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">
                Required Role to Enter (Optional)
              </label>
              <RoleSelect
                roles={roles}
                selectedRoleId={requiredRoleId}
                onSelect={(id) => setRequiredRoleId(id)}
                placeholder="No prerequisite role (Anyone can enter)"
              />
            </div>

            <button
              type="submit"
              disabled={starting}
              className="w-full py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-discord-blurple/20 cursor-pointer disabled:opacity-50"
            >
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              <span>Launch Giveaway on Discord</span>
            </button>
          </div>

          {/* Active Giveaways List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Server Giveaways ({giveaways.length})
            </h3>

            {giveaways.length === 0 ? (
              <div className="p-8 rounded-2xl bg-discord-card border border-white/5 text-center text-xs text-zinc-500">
                No active or previous giveaways. Launch your first giveaway above!
              </div>
            ) : (
              giveaways.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-xl bg-discord-card border border-white/5 hover:border-white/10 transition flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        {g.prize}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          g.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {g.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                      <span>{g.winnersCount} Winner{g.winnersCount > 1 ? "s" : ""}</span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        Ends: {new Date(g.endsAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {g.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => handleEnd(g.id)}
                        className="px-2.5 py-1 rounded-lg bg-discord-dark hover:bg-white/5 border border-white/5 text-[11px] font-semibold text-zinc-300 hover:text-white transition"
                      >
                        End Now
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      className="p-1 rounded text-zinc-500 hover:text-discord-red transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </form>

        {/* Right Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-discord-blurple" />
              Live Giveaway Message Preview
            </span>
          </div>

          <DiscordPreview
            botName="Paradox"
            title={`🎉 GIVEAWAY: ${prize}`}
            description={[
              description || "Click the button below to enter the giveaway!",
              "",
              `• **Winners:** ${winnersCount}`,
              `• **Ends:** ${calculatedEnd.toLocaleString()}`,
              requiredRoleId ? `• **Requirement:** Must have Role` : null,
            ]
              .filter(Boolean)
              .join("\n")}
            color="#5865F2"
            buttons={[
              {
                label: "Enter Giveaway",
                emoji: "🎉",
                style: "PRIMARY",
              },
            ]}
            footerText="Paradox Giveaways • Good Luck!"
            timestamp={true}
          />
        </div>
      </div>
    </div>
  );
}
