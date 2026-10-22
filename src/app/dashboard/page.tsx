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

  const filteredGuilds = guilds.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-discord-darkest text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-discord-card bg-discord-darker/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/pfp.png"
              alt="Paradox"
              className="w-9 h-9 rounded-xl object-cover shadow-md shadow-discord-blurple/25 border border-white/10 ring-1 ring-white/10"
            />
            <span className="font-extrabold text-lg text-white">
              Paradox <span className="text-discord-blurple text-xs font-semibold">Dashboard</span>
            </span>
          </Link>

          {/* User profile dropdown & logout */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-discord-card/70 px-3 py-1.5 rounded-full border border-white/5">
                {user.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`}
                    alt={user.username}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-discord-blurple flex items-center justify-center text-xs font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-white hidden sm:inline">
                  {user.username}
                </span>
              </div>

              <a
                href="/api/auth/logout"
                className="p-2 rounded-lg bg-discord-card hover:bg-discord-card/80 text-discord-muted hover:text-discord-red transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Title & Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Select a Server</h1>
            <p className="text-sm text-discord-muted mt-1">
              Showing servers where you possess <span className="text-slate-200 font-medium">Administrator</span> or{" "}
              <span className="text-slate-200 font-medium">Manage Server</span> permissions.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-discord-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search servers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-discord-card border border-white/5 text-sm text-white placeholder-discord-muted focus:outline-none focus:border-discord-blurple transition"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl border border-discord-red/40 bg-discord-red/10 text-discord-red flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-discord-card/50 border border-white/5 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-discord-card" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-discord-card rounded w-3/4" />
                    <div className="h-3 bg-discord-card rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-discord-card rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Servers Grid */}
        {!loading && filteredGuilds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuilds.map((guild) => (
              <div
                key={guild.id}
                className="p-5 rounded-2xl bg-discord-card border border-white/5 hover:border-discord-blurple/30 transition flex flex-col justify-between space-y-5"
              >
                <div className="flex items-center gap-4">
                  {/* Guild Icon */}
                  {guild.icon ? (
                    <img
                      src={guild.icon}
                      alt={guild.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-white/10 flex-shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-discord-dark flex items-center justify-center font-bold text-lg text-discord-muted border border-white/5 flex-shrink-0">
                      {guild.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-base truncate" title={guild.name}>
                      {guild.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      {guild.botInstalled ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Installed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Not in Server
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  {guild.botInstalled ? (
                    <Link
                      href={`/dashboard/${guild.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-medium text-sm transition flex items-center justify-center gap-2 shadow-md shadow-discord-blurple/20"
                    >
                      <span>Manage Settings</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <a
                      href={guild.inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-discord-dark hover:bg-discord-card border border-white/10 text-white font-medium text-sm transition flex items-center justify-center gap-2"
                    >
                      <span>Invite Bot</span>
                      <ExternalLink className="w-4 h-4 text-discord-muted" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredGuilds.length === 0 && (
          <div className="p-12 rounded-2xl bg-discord-card border border-white/5 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-discord-dark flex items-center justify-center mx-auto text-discord-muted">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No Servers Found</h3>
            <p className="text-xs text-discord-muted">
              {search
                ? `No servers match "${search}". Try clearing your search filter.`
                : "We couldn't find any Discord servers where your account possesses 'Manage Server' or 'Administrator' rights."}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-discord-card py-6 text-center text-xs text-discord-muted">
        <div className="flex justify-center gap-6">
          <Link href="/terms" className="hover:text-white transition">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-white transition">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
