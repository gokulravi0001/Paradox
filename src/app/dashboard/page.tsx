"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  ExternalLink,
  LogOut,
  Search,
  Server,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";

interface GuildItem {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  botInstalled: boolean;
  inviteUrl: string;
}

interface UserProfile {
  id: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
}

export default function DashboardServerPicker() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [guilds, setGuilds] = useState<GuildItem[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "installed" | "invite">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch user info
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          router.push("/api/auth/login");
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        // Fetch user guilds
        const guildsRes = await fetch("/api/guilds");
        if (!guildsRes.ok) {
          const errData = await guildsRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load servers.");
        }
        const guildsData = await guildsRes.json();
        setGuilds(guildsData.guilds || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const filteredGuilds = guilds.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (tab === "installed") return g.botInstalled;
    if (tab === "invite") return !g.botInstalled;
    return true;
  });

  const installedCount = guilds.filter((g) => g.botInstalled).length;

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-[#08090d]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-discord-blurple to-indigo-700 flex items-center justify-center shadow-md shadow-discord-blurple/20 group-hover:scale-105 transition">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
              <span>PARADOX</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-discord-blurple/15 text-discord-blurple border border-discord-blurple/30">
                SERVERS
              </span>
            </span>
          </Link>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-discord-card/80 px-3 py-1.5 rounded-full border border-white/5">
                {user.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                    alt=""
                    className="w-6 h-6 rounded-full border border-white/10 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://cdn.discordapp.com/embed/avatars/0.png";
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-discord-blurple flex items-center justify-center text-xs font-bold text-white">
                    {user.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-white">{user.username}</span>
              </div>

              <a
                href="/api/auth/logout"
                title="Sign Out"
                className="p-2 rounded-xl text-zinc-400 hover:text-discord-red hover:bg-discord-red/10 transition"
              >
                <LogOut className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-150">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-discord-blurple/10 border border-discord-blurple/20 text-discord-blurple text-[11px] font-bold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Server Selection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Select a Discord Server
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Choose a server where you have administrative access to open its live configuration dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-discord-card border border-white/5 text-zinc-300 font-semibold">
              {installedCount} Bot Active
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-discord-card border border-white/5 text-zinc-400">
              {guilds.length} Total Manageable
            </span>
          </div>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-discord-card border border-white/5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search server names..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-discord-dark border border-white/5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                tab === "all" ? "bg-discord-blurple text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              All ({guilds.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("installed")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                tab === "installed" ? "bg-discord-blurple text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              Installed ({installedCount})
            </button>
            <button
              type="button"
              onClick={() => setTab("invite")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                tab === "invite" ? "bg-discord-blurple text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              Available ({guilds.length - installedCount})
            </button>
          </div>
        </div>

        {/* Server Cards Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-discord-blurple animate-spin" />
            <p className="text-xs text-zinc-400 font-semibold">Fetching your Discord servers...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-discord-red text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredGuilds.length === 0 ? (
          <div className="py-20 text-center space-y-3 p-8 rounded-3xl bg-discord-card border border-white/5">
            <Server className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-white">No servers found</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Make sure you have &apos;Manage Server&apos; or &apos;Administrator&apos; permissions on Discord to configure bot settings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuilds.map((guild) => (
              <div
                key={guild.id}
                className="p-5 rounded-2xl bg-discord-card border border-white/5 hover:border-white/15 transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {guild.icon ? (
                    <img
                      src={guild.icon}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-discord-blurple to-indigo-700 flex items-center justify-center font-bold text-white text-base shadow-md flex-shrink-0">
                      {guild.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-discord-blurple transition">
                      {guild.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {guild.botInstalled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Installed
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Not Installed</span>
                      )}
                      {guild.owner && (
                        <span className="text-[10px] font-semibold text-amber-400">Owner</span>
                      )}
                    </div>
                  </div>
                </div>

                {guild.botInstalled ? (
                  <Link
                    href={`/dashboard/${guild.id}`}
                    className="w-full py-2.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-discord-blurple/20 cursor-pointer"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <a
                    href={guild.inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Invite Bot</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
