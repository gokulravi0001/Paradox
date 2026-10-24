"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ChevronRight,
  LogOut,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Shield,
  Layers,
} from "lucide-react";

interface NavbarProps {
  guildId: string;
  guildName?: string;
  collapsed?: boolean;
  onOpenMobile?: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  avatar?: string;
}

export function Navbar({
  guildId,
  guildName = "Server",
  collapsed = false,
  onOpenMobile,
}: NavbarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch {
        // no-op
      }
    }
    fetchMe();
  }, []);

  // Compute page title from path
  const segments = pathname.split("/").filter(Boolean);
  const currentSection = segments[segments.length - 1];
  const sectionTitle =
    currentSection === guildId
      ? "Overview"
      : currentSection
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

  return (
    <header
      className={`h-16 fixed top-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 bg-[#0c0d12]/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ${
        collapsed ? "left-0 lg:left-20" : "left-0 lg:left-64"
      }`}
    >
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white bg-discord-card border border-white/5 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <Link
            href="/dashboard"
            className="hover:text-white transition flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-discord-blurple" />
            <span>Servers</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <Link
            href={`/dashboard/${guildId}`}
            className="text-zinc-300 hover:text-white transition truncate max-w-[120px] sm:max-w-[200px]"
          >
            {guildName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="font-bold text-white text-xs">{sectionTitle}</span>
        </div>
      </div>

      {/* Right: Docs, Support, User Profile */}
      <div className="flex items-center gap-3">
        <a
          href="/privacy"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-discord-card hover:bg-white/5 border border-white/5 text-xs text-zinc-400 hover:text-white transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-discord-blurple" />
          <span>Docs</span>
        </a>

        {user ? (
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/5">
            {user.avatar ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                alt=""
                className="w-8 h-8 rounded-full border border-white/10 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://cdn.discordapp.com/embed/avatars/0.png";
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center font-bold text-xs text-white">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white truncate max-w-[100px]">
                {user.username}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">Admin</div>
            </div>

            <a
              href="/api/auth/logout"
              title="Logout"
              className="p-2 rounded-xl text-zinc-400 hover:text-discord-red hover:bg-discord-red/10 transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <a
            href="/api/auth/login"
            className="px-3.5 py-1.5 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white font-bold text-xs transition shadow-sm"
          >
            Login with Discord
          </a>
        )}
      </div>
    </header>
  );
}
