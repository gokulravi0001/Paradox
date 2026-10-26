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
  Crown,
  Shield,
  Zap,
} from "lucide-react";

interface GuildItem {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  isAdmin?: boolean;
  canManage?: boolean;
  botInstalled: boolean;
  inviteUrl: string;
}

interface UserProfile {
  id: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
}

type FilterTab = "all" | "owned" | "admin" | "installed" | "available";

export default function DashboardServerPicker() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [guilds, setGuilds] = useState<GuildItem[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("owned");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch authenticated user profile
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          router.push("/api/auth/login");
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        // 2. Fetch user's manageable & owned guilds
        const guildsRes = await fetch("/api/guilds");
        if (!guildsRes.ok) {
          const errData = await guildsRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load servers.");
        }
        const guildsData = await guildsRes.json();
        const serverList: GuildItem[] = guildsData.guilds || [];
        setGuilds(serverList);

        // If the user owns servers, set the default view to Owned servers
        const hasOwned = serverList.some((g) => g.owner);
        if (hasOwned) {
          setTab("owned");
        } else {
          setTab("all");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Counts
  const ownedCount = guilds.filter((g) => g.owner).length;
  const adminCount = guilds.filter((g) => g.isAdmin || g.owner).length;
  const installedCount = guilds.filter((g) => g.botInstalled).length;

  // Filtered list based on active tab and search query
  const filteredGuilds = guilds.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (tab === "owned") return g.owner;
    if (tab === "admin") return g.isAdmin || g.owner;
    if (tab === "installed") return g.botInstalled;
    if (tab === "available") return !g.botInstalled;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 flex flex-col font-sans selection:bg-[#5865F2] selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-[#08090d]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5865F2] to-indigo-700 flex items-center justify-center shadow-md shadow-[#5865F2]/20 group-hover:scale-105 transition">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
              <span>PARADOX</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/30 uppercase tracking-wider">
                Servers
              </span>
            </span>
          </Link>

          {/* User Profile in Top Bar */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-zinc-900/80 px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm">
                {user.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`}
                    alt={user.username}
                    className="w-6 h-6 rounded-full border border-white/10 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://cdn.discordapp.com/embed/avatars/0.png";
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#5865F2] flex items-center justify-center text-xs font-bold text-white">
                    {user.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-white">{user.username}</span>
                {ownedCount > 0 && (
                  <span
                    className="flex items-center gap-0.5 text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20"
                    title={`Owner of ${ownedCount} server${ownedCount > 1 ? "s" : ""}`}
                  >
                    <Crown className="w-2.5 h-2.5 fill-amber-400" />
                    <span>{ownedCount}</span>
                  </span>
                )}
              </div>

              <a
                href="/api/auth/logout"
                title="Sign Out"
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-150">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold mb-2">
              <Crown className="w-3.5 h-3.5 fill-amber-400" />
              <span>Administrator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Your Discord Servers
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Select any server you own or administer to configure reaction roles, rich embeds, and member onboarding.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 fill-amber-400" />
              <span>{ownedCount} Owned</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{installedCount} Bot Active</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400">
              {guilds.length} Total Manageable
            </span>
          </div>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-white/5 backdrop-blur-xl">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by server name..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#5865F2]"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-white/5 text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setTab("owned")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                tab === "owned"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Crown className={`w-3 h-3 ${tab === "owned" ? "fill-amber-400 text-amber-400" : ""}`} />
              <span>Owned by You ({ownedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("installed")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                tab === "installed"
                  ? "bg-[#5865F2] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Bot Active ({installedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("admin")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                tab === "admin"
                  ? "bg-[#5865F2] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Admin Access ({adminCount})
            </button>

            <button
              type="button"
              onClick={() => setTab("all")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                tab === "all"
                  ? "bg-[#5865F2] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All ({guilds.length})
            </button>
          </div>
        </div>

        {/* Server Cards Display */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#5865F2] animate-spin" />
            <p className="text-xs text-zinc-400 font-semibold">Loading your Discord servers...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredGuilds.length === 0 ? (
          <div className="py-20 text-center space-y-3 p-8 rounded-3xl bg-zinc-900/40 border border-white/5">
            <Server className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-white">No servers found in this category</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {tab === "owned"
                ? "You don't own any servers on this Discord account. Try switching to the 'All' tab to view servers you administer."
                : "Make sure you have Administrator or Manage Server permissions on Discord."}
            </p>
            {tab !== "all" && (
              <button
                type="button"
                onClick={() => setTab("all")}
                className="mt-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition cursor-pointer"
              >
                Show All Manageable Servers
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGuilds.map((guild) => {
              const isOwner = guild.owner;
              return (
                <div
                  key={guild.id}
                  className={`p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between space-y-4 group relative overflow-hidden ${
                    isOwner
                      ? "bg-gradient-to-b from-amber-500/5 via-zinc-900/80 to-zinc-900 border border-amber-500/30 hover:border-amber-400/60 shadow-lg shadow-amber-500/5"
                      : "bg-zinc-900/60 border border-white/5 hover:border-white/20 shadow-md"
                  }`}
                >
                  {/* Subtle top indicator for owned servers */}
                  {isOwner && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/15 border-b border-l border-amber-500/30 rounded-bl-xl text-[10px] font-extrabold text-amber-300 flex items-center gap-1">
                      <Crown className="w-3 h-3 fill-amber-400" />
                      <span>Owner</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3.5 min-w-0 pt-1">
                    {/* Server Icon */}
                    {guild.icon ? (
                      <img
                        src={guild.icon}
                        alt={guild.name}
                        className="w-13 h-13 rounded-2xl object-cover border border-white/10 shadow-md flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://cdn.discordapp.com/embed/avatars/0.png";
                        }}
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#5865F2] to-indigo-700 flex items-center justify-center font-black text-white text-base shadow-md flex-shrink-0">
                        {guild.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Server Info */}
                    <div className="min-w-0 flex-1 pr-12">
                      <h3 className="text-sm font-bold text-white truncate group-hover:text-[#5865F2] transition">
                        {guild.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Bot Status */}
                        {guild.botInstalled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                            Not Added
                          </span>
                        )}

                        {/* Permission Badge */}
                        {isOwner ? (
                          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5 fill-amber-400" />
                            <span>Server Owner</span>
                          </span>
                        ) : guild.isAdmin ? (
                          <span className="text-[10px] font-semibold text-sky-400 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5 text-sky-400" />
                            <span>Admin</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">Manager</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {guild.botInstalled ? (
                      <Link
                        href={`/dashboard/${guild.id}`}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                          isOwner
                            ? "bg-[#5865F2] hover:bg-indigo-600 text-white shadow-lg shadow-[#5865F2]/25"
                            : "bg-[#5865F2] hover:bg-indigo-600 text-white shadow-md shadow-[#5865F2]/20"
                        }`}
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
                        <span>Add Bot to Server</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
