"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  ExternalLink,
  Layers,
  LayoutDashboard,
  LogOut,
  Settings,
  Smile,
  Video,
  Menu,
  X,
  AlertTriangle,
} from "lucide-react";

interface GuildData {
  id: string;
  name: string;
  icon: string | null;
  botInstalled: boolean;
  inviteUrl: string;
}

export default function GuildDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const guildId = params.guildId as string;

  const [guild, setGuild] = useState<GuildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadGuild() {
      try {
        const res = await fetch(`/api/guilds/${guildId}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/api/auth/login");
            return;
          }
          if (res.status === 403) {
            router.push("/dashboard?error=You+do+not+have+permission+to+manage+this+server.");
            return;
          }
          router.push("/dashboard");
          return;
        }

        const data = await res.json();
        setGuild(data.guild);
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    if (guildId) {
      loadGuild();
    }
  }, [guildId, router]);

  const navLinks = [
    {
      name: "Overview",
      href: `/dashboard/${guildId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Reaction Roles",
      href: `/dashboard/${guildId}/reaction-roles`,
      icon: Smile,
    },
    {
      name: "Embed Builder",
      href: `/dashboard/${guildId}/embeds`,
      icon: Layers,
    },
    {
      name: "Link-to-Video",
      href: `/dashboard/${guildId}/video-fixer`,
      icon: Video,
    },
    {
      name: "Server Settings",
      href: `/dashboard/${guildId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-discord-darkest text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-discord-darker border-b border-discord-card">
        <div className="flex items-center gap-3">
          {guild?.icon ? (
            <img src={guild.icon} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-discord-card flex items-center justify-center text-xs font-bold">
              {guild?.name?.slice(0, 2).toUpperCase() || "GU"}
            </div>
          )}
          <span className="font-bold text-sm truncate max-w-[180px]">{guild?.name || "Server"}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-discord-card text-slate-200"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-discord-darker border-r border-discord-card flex-shrink-0 flex flex-col z-30`}
      >
        {/* Top: Return to Servers */}
        <div className="p-4 border-b border-discord-card">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs text-discord-muted hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Servers
          </Link>

          {/* Current Server Badge */}
          <div className="mt-4 flex items-center gap-3">
            {guild?.icon ? (
              <img
                src={guild.icon}
                alt={guild.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-discord-card flex items-center justify-center font-bold text-sm text-discord-muted">
                {guild?.name
                  ? guild.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "SV"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-sm text-white truncate">{guild?.name || "Loading..."}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    guild?.botInstalled ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span className="text-[11px] text-discord-muted">
                  {guild?.botInstalled ? "Bot Connected" : "Bot Missing"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning if bot not installed */}
        {guild && !guild.botInstalled && (
          <div className="m-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" /> Bot Not In Server
            </div>
            <p className="text-[11px] text-amber-200/90 leading-tight">
              Bot features will not function until the bot is invited to this Discord server.
            </p>
            <a
              href={guild.inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:underline"
            >
              Invite Bot Now <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Nav Links */}
        <nav className="p-3 space-y-1 flex-1">
          {navLinks.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-discord-blurple text-white shadow-md shadow-discord-blurple/20"
                    : "text-discord-muted hover:text-slate-100 hover:bg-discord-card/50"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-discord-card text-xs text-discord-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-discord-blurple" />
            <span>Paradox Bot</span>
          </div>
          <a
            href="/api/auth/logout"
            className="hover:text-discord-red transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-discord-darkest overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
