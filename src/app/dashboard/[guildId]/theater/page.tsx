"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Zap,
  Shield,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
} from "lucide-react";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

interface VoiceChannel {
  id: string;
  name: string;
  type: number;
}

interface ActivityItem {
  key: string;
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export default function TheaterPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<VoiceChannel[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<string>("WATCH_TOGETHER");
  const [launching, setLaunching] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [activeInviteUrl, setActiveInviteUrl] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Web Theater Player State
  const [videoUrl, setVideoUrl] = useState<string>("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [ambientGlow, setAmbientGlow] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message }]);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/guilds/${guildId}/theater`);
        if (res.ok) {
          const data = await res.json();
          setChannels(data.channels || []);
          setActivities(data.activities || []);
          if (data.channels?.length > 0) {
            setSelectedChannelId(data.channels[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load theater data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (guildId) loadData();
  }, [guildId]);

  const handleLaunchActivity = async () => {
    if (!selectedChannelId) {
      addToast("error", "Please select a Voice Channel first.");
      return;
    }

    setLaunching(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/theater`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "launch",
          channelId: selectedChannelId,
          activityKey: selectedActivity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to launch activity");
      }

      setActiveInviteUrl(data.inviteUrl);
      addToast("success", `Launched ${data.activity}! Voice Channel bitrate elevated to HD.`);
      window.open(data.inviteUrl, "_blank");
    } catch (err: any) {
      addToast("error", err.message || "Failed to launch activity.");
    } finally {
      setLaunching(false);
    }
  };

  const handleOptimizeChannel = async () => {
    if (!selectedChannelId) {
      addToast("error", "Please select a Voice Channel first.");
      return;
    }

    setOptimizing(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/theater`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimize",
          channelId: selectedChannelId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to optimize channel");
      }

      addToast(
        "success",
        `Channel optimized! Bitrate bumped to ${Math.round(data.newBitrate / 1000)} kbps with Full Video Quality mode enabled.`
      );
    } catch (err: any) {
      addToast("error", err.message || "Failed to optimize voice channel.");
    } finally {
      setOptimizing(false);
    }
  };

  const handleLoadCustomVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setVideoUrl(inputUrl.trim());
    setIsPlaying(false);
    addToast("info", "Loaded video into Theater. Ready for playback!");
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleCopySyncLink = () => {
    const currentSeconds = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
    const url = new URL(window.location.href);
    url.searchParams.set("v", encodeURIComponent(videoUrl));
    url.searchParams.set("t", currentSeconds.toString());
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    addToast("success", `Sync link copied with timestamp ${currentSeconds}s! Share with friends in VC.`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1` : url;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-zinc-400">Loading Cinema Lounge...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-lg shadow-red-500/5">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                Cinema Lounge & Watch Party
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  HD Uncapped
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Stream movies, anime, and YouTube together in Discord VC without video quality downscaling, stuttering, or black screens.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOptimizeChannel}
            disabled={optimizing || channels.length === 0}
            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700/60 transition shadow-sm"
          >
            {optimizing ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
            <span>Optimize Bitrate & Quality</span>
          </button>

          <button
            onClick={handleLaunchActivity}
            disabled={launching || channels.length === 0}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition"
          >
            {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>Launch in Discord VC</span>
          </button>
        </div>
      </div>

      {/* Grid: Discord Launcher on Left, Anti-Degradation Guide on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discord Launcher Card */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400" />
              1-Click Discord Voice Channel Launcher
            </h2>
            <span className="text-[11px] text-zinc-400">Zero compression • Streams directly from source</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Channel Select */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target Voice Channel</label>
              {channels.length === 0 ? (
                <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  No voice channels found. Please ensure Paradox has permissions to view voice channels.
                </div>
              ) : (
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                >
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      🔊 {ch.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Target Activity Select */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Activity Player</label>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              >
                {activities.map((act) => (
                  <option key={act.key} value={act.key}>
                    {act.emoji} {act.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activities.map((act) => {
              const isSelected = selectedActivity === act.key;
              return (
                <button
                  key={act.key}
                  type="button"
                  onClick={() => setSelectedActivity(act.key)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-red-500/10 border-red-500/50 shadow-md shadow-red-500/10"
                      : "bg-zinc-800/40 border-zinc-700/40 hover:bg-zinc-800/80"
                  }`}
                >
                  <div className="text-xl mb-1.5">{act.emoji}</div>
                  <div className="text-xs font-semibold text-zinc-200">{act.name}</div>
                  <div className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{act.description}</div>
                </button>
              );
            })}
          </div>

          {activeInviteUrl && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-300">Activity Ready in Discord VC!</p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">Share this invite link with anyone in your server:</p>
                <code className="text-[11px] font-mono text-zinc-200 mt-1 block">{activeInviteUrl}</code>
              </div>
              <a
                href={activeInviteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                Join Now
              </a>
            </div>
          )}
        </div>

        {/* Anti-Degradation Guide */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Zero Quality Loss Checklist
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Follow these essential tips so Discord never throttles your movie stream or displays a black screen.
          </p>

          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center text-[10px]">1</span>
                Fix Black Screen (DRM)
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                In Chrome/Brave/Edge: Go to <strong className="text-zinc-300">Settings → System</strong> and turn <strong className="text-red-400">OFF</strong> &ldquo;Use graphics acceleration when available&rdquo;.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px]">2</span>
                Fix Muffled Movie Audio
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                In Discord <strong className="text-zinc-300">Settings → Voice &amp; Video</strong>: Set Noise Suppression to <strong className="text-blue-400">None/Standard</strong> so Krisp doesn&rsquo;t cut movie soundtracks.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px]">3</span>
                Share Window (Not Screen)
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Always share the specific <strong className="text-purple-300">Application Window</strong> instead of Entire Screen to get native 60fps and zero resolution scaling.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Web Companion Theater (Synchronized Player) */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Tv className="w-4 h-4 text-purple-400" />
              Paradox Web Theater (Synchronized Lounge)
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Watch direct movie files (MP4, MKV, m3u8) or YouTube links together with synced timestamps.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAmbientGlow(!ambientGlow)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                ambientGlow
                  ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                  : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              Ambient Lighting
            </button>

            <button
              onClick={handleCopySyncLink}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 text-xs font-semibold border border-zinc-700/60 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Copied!" : "Share Sync Link"}</span>
            </button>
          </div>
        </div>

        {/* Video URL Input Form */}
        <form onSubmit={handleLoadCustomVideo} className="flex gap-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste direct movie URL (https://.../movie.mp4, .m3u8) or YouTube link..."
            className="flex-1 bg-zinc-800/60 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition"
          >
            Load Video
          </button>
        </form>

        {/* Video Screen Container with Ambient Glow */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center min-h-[360px] max-h-[620px]">
          {ambientGlow && (
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-red-900/10 to-blue-900/20 blur-3xl pointer-events-none" />
          )}

          {isYouTube ? (
            <iframe
              src={getYouTubeEmbedUrl(videoUrl)}
              className="w-full aspect-video z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative w-full z-10">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full max-h-[600px] object-contain mx-auto"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          )}
        </div>

        {/* Quick Sample Links */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[11px] font-semibold text-zinc-500">Quick Test Samples:</span>
          <button
            onClick={() => setVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")}
            className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 border border-zinc-700/40"
          >
            🐰 Big Buck Bunny (4K MP4)
          </button>
          <button
            onClick={() => setVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4")}
            className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 border border-zinc-700/40"
          >
            🐘 Elephant&rsquo;s Dream (HD MP4)
          </button>
          <button
            onClick={() => setVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4")}
            className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 border border-zinc-700/40"
          >
            🚀 Tears of Steel (Sci-Fi HD)
          </button>
        </div>
      </div>
    </div>
  );
}
