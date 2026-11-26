"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Film,
  Play,
  Pause,
  Upload,
  Link as LinkIcon,
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
  Trash2,
  FileVideo,
  Clapperboard,
  HardDrive,
  Calendar,
  X,
  Share2,
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

interface MovieItem {
  id: string;
  guildId: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string | null;
  fileSize: string | null;
  mimeType: string | null;
  duration: number | null;
  thumbnail: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

function formatBytes(bytesStr: string | null): string {
  if (!bytesStr) return "Direct Stream";
  const bytes = parseInt(bytesStr, 10);
  if (isNaN(bytes) || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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

  // Movie Library State
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [activeMovie, setActiveMovie] = useState<MovieItem | null>(null);
  const [streamingToVc, setStreamingToVc] = useState<string | null>(null);

  // Upload & Import Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<"upload" | "link">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Web Theater Player State
  const [videoUrl, setVideoUrl] = useState<string>(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  );
  const [inputUrl, setInputUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [ambientGlow, setAmbientGlow] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message }]);
  };

  const loadData = async () => {
    try {
      const [resTheater, resMovies] = await Promise.all([
        fetch(`/api/guilds/${guildId}/theater`),
        fetch(`/api/guilds/${guildId}/theater/movies`),
      ]);

      if (resTheater.ok) {
        const data = await resTheater.json();
        setChannels(data.channels || []);
        setActivities(data.activities || []);
        if (data.channels?.length > 0 && !selectedChannelId) {
          setSelectedChannelId(data.channels[0].id);
        }
      }

      if (resMovies.ok) {
        const data = await resMovies.json();
        setMovies(data.movies || []);
      }
    } catch (err) {
      console.error("Failed to load theater data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Stream a specific movie directly to the Voice Channel
  const handleStreamMovieToVC = async (movie: MovieItem) => {
    if (!selectedChannelId) {
      addToast("error", "Please select a Voice Channel first from the launcher dropdown.");
      return;
    }

    setStreamingToVc(movie.id);
    try {
      const res = await fetch(`/api/guilds/${guildId}/theater`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stream_movie",
          channelId: selectedChannelId,
          movieId: movie.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate stream in VC");
      }

      // Load into web player as well
      handlePlayMovieInTheater(movie);

      setActiveInviteUrl(data.inviteUrl);
      addToast(
        "success",
        `🍿 Streaming "${movie.title}" in VC! High-def uncapped audio & video locked.`
      );

      window.open(data.inviteUrl, "_blank");
    } catch (err: any) {
      addToast("error", err.message || "Failed to stream movie to VC.");
    } finally {
      setStreamingToVc(null);
    }
  };

  const handlePlayMovieInTheater = (movie: MovieItem) => {
    setActiveMovie(movie);
    // If it's a relative path, route through the streaming API endpoint for HTTP Range seeking
    if (!movie.fileUrl.startsWith("http")) {
      setVideoUrl(`/api/guilds/${guildId}/theater/stream/${movie.id}`);
    } else {
      setVideoUrl(movie.fileUrl);
    }
    setIsPlaying(true);
    addToast("info", `Now Playing: ${movie.title} in original source quality!`);
  };

  // Handle Video File Upload
  const handlePerformUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadTab === "upload") {
      if (!selectedFile) {
        addToast("error", "Please choose a video file to upload.");
        return;
      }

      setIsUploading(true);
      setUploadProgress(20);

      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", uploadTitle || selectedFile.name);
        formData.append("description", uploadDescription);

        const res = await fetch(`/api/guilds/${guildId}/theater/upload`, {
          method: "POST",
          body: formData,
        });

        setUploadProgress(85);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to upload video file");
        }

        addToast("success", `🎬 "${data.movie.title}" uploaded and stored in HD!`);
        setUploadModalOpen(false);
        setSelectedFile(null);
        setUploadTitle("");
        setUploadDescription("");

        // Reload library and play
        await loadData();
        if (data.movie) {
          handlePlayMovieInTheater(data.movie);
        }
      } catch (err: any) {
        addToast("error", err.message || "Upload failed");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else {
      // Link Import Tab
      if (!importUrl.trim()) {
        addToast("error", "Please enter a valid video or movie link.");
        return;
      }

      setIsUploading(true);
      try {
        const res = await fetch(`/api/guilds/${guildId}/theater/movies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: uploadTitle || "Imported Movie",
            description: uploadDescription,
            fileUrl: importUrl.trim(),
            mimeType: "video/mp4",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to import video link");
        }

        addToast("success", `🎬 "${data.movie.title}" added to server library!`);
        setUploadModalOpen(false);
        setImportUrl("");
        setUploadTitle("");
        setUploadDescription("");

        await loadData();
        if (data.movie) {
          handlePlayMovieInTheater(data.movie);
        }
      } catch (err: any) {
        addToast("error", err.message || "Import failed");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDeleteMovie = async (movieId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this movie from the server library?")) return;

    try {
      const res = await fetch(`/api/guilds/${guildId}/theater/movies?id=${movieId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        addToast("success", "Movie removed from library.");
        setMovies((prev) => prev.filter((m) => m.id !== movieId));
        if (activeMovie?.id === movieId) {
          setActiveMovie(null);
        }
      }
    } catch {
      addToast("error", "Failed to delete movie.");
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
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-sm font-medium text-zinc-400">Loading Cinema Lounge & Library...</p>
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
                  HD 1080p/4K Uncapped
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Upload and store movies on the server and stream them in Voice Channels in original source quality with zero degradation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Movie / Video</span>
          </button>

          <button
            onClick={handleOptimizeChannel}
            disabled={optimizing || channels.length === 0}
            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700/60 transition shadow-sm"
          >
            {optimizing ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Zap className="w-4 h-4 text-amber-400" />
            )}
            <span>Optimize VC Bitrate</span>
          </button>
        </div>
      </div>

      {/* Synchronized Cinema Screen Container */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Tv className="w-4 h-4 text-purple-400" />
              {activeMovie ? activeMovie.title : "Paradox Cinema Screen"}
              {activeMovie && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {formatBytes(activeMovie.fileSize)}
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeMovie?.description || "Streaming in original bitstream resolution with byte-range buffering."}
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
              <span>{copiedLink ? "Copied!" : "Copy Sync Link"}</span>
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center min-h-[360px] max-h-[640px]">
          {ambientGlow && (
            <div className="absolute inset-0 bg-gradient-to-tr from-red-950/20 via-purple-950/20 to-blue-950/20 blur-3xl pointer-events-none" />
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
                autoPlay={isPlaying}
                className="w-full max-h-[620px] object-contain mx-auto"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Server Movie Library (Uploaded & Stored Movies) */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-red-400" />
              Server Movie Library ({movies.length})
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Stored movies and video files ready to stream to Voice Channel members at full fidelity.
            </p>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/60 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Add Movie</span>
          </button>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30">
            <Film className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No movies uploaded yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
              Upload your first movie or paste a direct video link to stream it with friends in Discord VC.
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-md shadow-red-600/20"
            >
              Upload a Movie Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {movies.map((movie) => {
              const isSelected = activeMovie?.id === movie.id;
              const isStreamingThis = streamingToVc === movie.id;

              return (
                <div
                  key={movie.id}
                  onClick={() => handlePlayMovieInTheater(movie)}
                  className={`group relative rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10"
                      : "bg-zinc-800/30 border-zinc-800/80 hover:bg-zinc-800/60 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                        <FileVideo className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                          {formatBytes(movie.fileSize)}
                        </span>
                        <button
                          onClick={(e) => handleDeleteMovie(movie.id, e)}
                          title="Delete movie"
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-100 mt-3 group-hover:text-red-300 transition line-clamp-1">
                      {movie.title}
                    </h3>
                    {movie.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {movie.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(movie.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStreamMovieToVC(movie);
                      }}
                      disabled={isStreamingThis}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition"
                    >
                      {isStreamingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Radio className="w-3.5 h-3.5" />
                      )}
                      <span>Stream in VC</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: 1-Click Discord Launcher & Anti-Degradation Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discord Launcher Card */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400" />
              1-Click Voice Channel Activity Launcher
            </h2>
            <span className="text-[11px] text-zinc-400">Streams directly from source • Zero compression</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target Voice Channel</label>
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
            </div>

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

          <div className="flex gap-3">
            <button
              onClick={handleLaunchActivity}
              disabled={launching || channels.length === 0}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition"
            >
              {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>Launch Activity in Selected Voice Channel</span>
            </button>
          </div>

          {activeInviteUrl && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-300">Activity Ready in Discord VC!</p>
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

        {/* Zero Quality Loss Guide */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Zero Quality Loss Checklist
          </h2>
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center text-[10px]">1</span>
                Stream Directly via Server
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Using the Movie Library &amp; Watch Together streams the raw video file to each viewer in full 1080p/4K with zero screen-share compression.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px]">2</span>
                Fix Muffled Movie Audio
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                In Discord Voice &amp; Video settings, turn off <strong className="text-blue-300">Krisp Noise Suppression</strong> so background movie soundtracks and whisper dialogue stay clear.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload & Import Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12131a] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Film className="w-5 h-5 text-red-500" />
                Add Movie to Server Library
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs: File Upload vs Cloud Link */}
            <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setUploadTab("upload")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                  uploadTab === "upload"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Upload Video File
              </button>
              <button
                type="button"
                onClick={() => setUploadTab("link")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                  uploadTab === "link"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Paste Direct / Cloud Link
              </button>
            </div>

            <form onSubmit={handlePerformUpload} className="space-y-4">
              {uploadTab === "upload" ? (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Video File (MP4, MKV, WebM, MOV)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/x-matroska,video/quicktime,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!uploadTitle) {
                          setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700/80 hover:border-red-500/60 rounded-xl p-6 text-center cursor-pointer transition bg-zinc-900/40 hover:bg-zinc-900/80"
                  >
                    <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">{selectedFile.name}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{formatBytes(String(selectedFile.size))}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-zinc-300">Click to choose movie file from computer</p>
                        <p className="text-[11px] text-zinc-500 mt-1">MP4, MKV, WebM in original 1080p/4K resolution</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Direct Video Stream / Cloud URL
                  </label>
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://.../movie.mp4 or direct stream link"
                    className="w-full bg-zinc-800/60 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Supports direct MP4 links, Google Drive direct stream links, and HLS m3u8 streams.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Movie Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Inception (2010) [1080p BluRay]"
                  className="w-full bg-zinc-800/60 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Movie synopsis or notes for server members..."
                  className="w-full bg-zinc-800/60 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Uploading and processing movie...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition shadow-md shadow-red-600/20"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Save &amp; Store Movie</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
