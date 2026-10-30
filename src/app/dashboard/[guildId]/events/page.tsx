"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  Loader2,
  Volume2,
  ExternalLink,
} from "lucide-react";
import { ChannelSelect, DiscordChannelItem } from "@/components/ui/ChannelSelect";
import { DiscordPreview } from "@/components/ui/DiscordPreview";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  voiceChannelId: string | null;
  channelId: string | null;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  status: string;
}

export default function EventsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [channels, setChannels] = useState<DiscordChannelItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form State
  const [title, setTitle] = useState("🎮 Community Game Night");
  const [description, setDescription] = useState(
    "Join us for our weekly community gaming tournament and voice chat hangouts!"
  );
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [locationType, setLocationType] = useState<"voice" | "custom">("voice");
  const [voiceChannelId, setVoiceChannelId] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [announcementChannelId, setAnnouncementChannelId] = useState("");
  const [imageUrl, setImageUrl] = useState("https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif");
  const [announceNow, setAnnounceNow] = useState(true);

  function addToast(type: ToastMessage["type"], message: string, title?: string) {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    // Default start date to tomorrow at 7:00 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    setStartsAt(tomorrow.toISOString().slice(0, 16));

    async function init() {
      try {
        setLoading(true);
        const [channelsRes, eventsRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}/channels`),
          fetch(`/api/guilds/${guildId}/events`),
        ]);

        if (channelsRes.ok) {
          const cData = await channelsRes.json();
          setChannels(cData.channels || []);
        }

        if (eventsRes.ok) {
          const eData = await eventsRes.json();
          setEvents(eData.events || []);
        }
      } catch {
        addToast("error", "Failed to load events");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) init();
  }, [guildId]);

  async function refreshChannels() {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/guilds/${guildId}/channels`);
      if (res.ok) {
        const cData = await res.json();
        setChannels(cData.channels || []);
        addToast("success", "Channels refreshed from Discord!");
      }
    } catch {
      addToast("error", "Failed to refresh channels.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !startsAt) {
      addToast("warning", "Event title and start date are required.", "Missing fields");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch(`/api/guilds/${guildId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          voiceChannelId: locationType === "voice" ? voiceChannelId : null,
          location: locationType === "custom" ? customLocation : null,
          channelId: announcementChannelId || null,
          imageUrl: imageUrl || null,
          announceNow,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");

      setEvents((prev) => [...prev, data.event]);
      addToast("success", "Event scheduled successfully!", "Created");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Error creating event");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to cancel this event?")) return;

    try {
      const res = await fetch(`/api/guilds/${guildId}/events?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        addToast("info", "Event removed.");
      }
    } catch {
      addToast("error", "Failed to remove event");
    }
  }

  const voiceChannels = channels.filter((c) => c.type === 2);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-discord-blurple animate-spin" />
        <p className="text-xs text-zinc-400">Loading events module...</p>
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
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Scheduled Activities</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Events Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Organize server tournaments, voice hangouts, and community events with auto-announcements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Event Creation */}
        <form onSubmit={handleCreate} className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-discord-card border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-discord-blurple" />
              <span>Schedule New Community Event</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🏆 Valorant Community Tournament"
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details, prize pool, tournament rules, etc..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple leading-relaxed"
              />
            </div>

            {/* Date / Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">End Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                />
              </div>
            </div>

            {/* Location: Voice Channel or Custom */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Event Location</label>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setLocationType("voice")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    locationType === "voice"
                      ? "bg-discord-blurple text-white"
                      : "bg-discord-dark text-zinc-400 hover:text-white"
                  }`}
                >
                  🔊 Voice Channel
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType("custom")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    locationType === "custom"
                      ? "bg-discord-blurple text-white"
                      : "bg-discord-dark text-zinc-400 hover:text-white"
                  }`}
                >
                  📍 Custom Link / Location
                </button>
              </div>

              {locationType === "voice" ? (
                <ChannelSelect
                  channels={voiceChannels.length > 0 ? voiceChannels : channels}
                  selectedChannelId={voiceChannelId}
                  onSelect={(id) => setVoiceChannelId(id)}
                  onRefresh={refreshChannels}
                  refreshing={refreshing}
                  filterTypes={[2]}
                  placeholder="Select a voice channel..."
                />
              ) : (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g. Stage Channel or Twitch.tv/..."
                  className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
                />
              )}
            </div>

            {/* Event Banner */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Event Banner URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://.../event-cover.gif"
                className="w-full px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
              />
            </div>

            {/* Auto Announce Toggle & Channel */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  Broadcast Announcement on Create
                </span>
                <input
                  type="checkbox"
                  checked={announceNow}
                  onChange={(e) => setAnnounceNow(e.target.checked)}
                  className="w-4 h-4 rounded bg-discord-dark border-white/20 text-discord-blurple cursor-pointer"
                />
              </div>

              {announceNow && (
                <ChannelSelect
                  channels={channels}
                  selectedChannelId={announcementChannelId}
                  onSelect={(id) => setAnnouncementChannelId(id)}
                  onRefresh={refreshChannels}
                  refreshing={refreshing}
                  placeholder="Select channel to post announcement..."
                />
              )}
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-discord-blurple/20 cursor-pointer disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
              <span>Schedule Event</span>
            </button>
          </div>

          {/* Scheduled Events List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Upcoming Events ({events.length})
            </h3>

            {events.length === 0 ? (
              <div className="p-8 rounded-2xl bg-discord-card border border-white/5 text-center text-xs text-zinc-500">
                No events currently scheduled. Create one above!
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl bg-discord-card border border-white/5 hover:border-white/10 transition flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{ev.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30 font-bold">
                        {ev.status}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2">{ev.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-[11px] text-zinc-500 flex-wrap pt-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ev.startsAt).toLocaleString()}
                      </span>
                      {(ev.voiceChannelId || ev.location) && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <MapPin className="w-3.5 h-3.5" />
                          {ev.voiceChannelId ? `Voice Channel` : ev.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-discord-red hover:bg-discord-red/10 transition cursor-pointer"
                    title="Cancel event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              Live Event Card Preview
            </span>
          </div>

          <DiscordPreview
            botName="Paradox"
            title={`📅 Event: ${title}`}
            description={description}
            color="#5865F2"
            fields={[
              {
                name: "⏰ Start Time",
                value: startsAt ? new Date(startsAt).toLocaleString() : "TBD",
                inline: true,
              },
              {
                name: "📍 Location",
                value:
                  locationType === "voice"
                    ? voiceChannelId
                      ? `#${channels.find((c) => c.id === voiceChannelId)?.name || "Voice"}`
                      : "Voice Channel"
                    : customLocation || "Discord Server",
                inline: true,
              },
            ]}
            imageUrl={imageUrl}
            footerText="Community Events • Paradox"
            timestamp={true}
          />
        </div>
      </div>
    </div>
  );
}
