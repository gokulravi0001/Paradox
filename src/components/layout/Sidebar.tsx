"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Smile,
  Palette,
  UserCheck,
  UserX,
  Scroll,
  Megaphone,
  Calendar,
  Gift,
  Film,
  Clock,
  Pin,
  Settings,
  History,
  Workflow,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  Bot,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  guildId: string;
  guildName?: string;
  guildIcon?: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  guildId,
  guildName = "Server",
  guildIcon,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const navGroups = [
    {
      title: "Core",
      items: [
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
          badge: "Popular",
        },
        {
          name: "Embeds",
          href: `/dashboard/${guildId}/embeds`,
          icon: Palette,
          badge: "Visual",
        },
      ],
    },
    {
      title: "Community & Growth",
      items: [
        {
          name: "Welcome Messages",
          href: `/dashboard/${guildId}/welcome`,
          icon: UserCheck,
        },
        {
          name: "Goodbye Messages",
          href: `/dashboard/${guildId}/goodbye`,
          icon: UserX,
        },
        {
          name: "Rules",
          href: `/dashboard/${guildId}/rules`,
          icon: Scroll,
        },
        {
          name: "Announcements",
          href: `/dashboard/${guildId}/announcements`,
          icon: Megaphone,
        },
        {
          name: "Events",
          href: `/dashboard/${guildId}/events`,
          icon: Calendar,
        },
        {
          name: "Giveaways",
          href: `/dashboard/${guildId}/giveaways`,
          icon: Gift,
        },
      ],
    },
    {
      title: "Automation & Media",
      items: [
        {
          name: "Video Embeds",
          href: `/dashboard/${guildId}/video-embeds`,
          icon: Film,
          badge: "Fixer",
        },
        {
          name: "Auto Messages",
          href: `/dashboard/${guildId}/auto-messages`,
          icon: Clock,
        },
        {
          name: "Sticky Messages",
          href: `/dashboard/${guildId}/sticky-messages`,
          icon: Pin,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          name: "Server Settings",
          href: `/dashboard/${guildId}/settings`,
          icon: Settings,
        },
        {
          name: "Audit Logs",
          href: `/dashboard/${guildId}/logs`,
          icon: History,
        },
        {
          name: "Integrations",
          href: `/dashboard/${guildId}/integrations`,
          icon: Workflow,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#0f1015]/95 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out select-none ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <Link
            href={`/dashboard/${guildId}`}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-discord-blurple to-indigo-700 flex items-center justify-center shadow-lg shadow-discord-blurple/20 flex-shrink-0 group-hover:scale-105 transition">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-base tracking-tight">
                    PARADOX
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate max-w-[120px]">
                  {guildName}
                </p>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Server Indicator Pill */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-2 rounded-xl bg-discord-card border border-white/5 hover:border-white/10 transition group"
              title="Switch Server"
            >
              <div className="flex items-center gap-2.5 truncate">
                {guildIcon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${guildId}/${guildIcon}.png`}
                    alt=""
                    className="w-6 h-6 rounded-lg object-cover"
                    onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                    {guildName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-white truncate max-w-[125px]">
                  {guildName}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 group-hover:text-discord-blurple transition">
                Switch
              </span>
            </Link>
          </div>
        )}

        {/* Nav Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = (item as { exact?: boolean }).exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      title={collapsed ? item.name : undefined}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? "bg-discord-blurple text-white shadow-md shadow-discord-blurple/25 font-semibold"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon
                          className={`w-4 h-4 flex-shrink-0 transition ${
                            isActive
                              ? "text-white"
                              : "text-zinc-400 group-hover:text-white"
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </div>

                      {!collapsed && item.badge && !isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-400 group-hover:bg-discord-blurple/20 group-hover:text-discord-blurple transition">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Bot Connection Status */}
        <div className="p-3 border-t border-white/5 bg-[#0b0c0f]">
          {!collapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-discord-card border border-white/5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-semibold text-zinc-300">Bot Online</span>
              </div>
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-discord-blurple hover:underline flex items-center gap-1"
              >
                <span>Support</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          ) : (
            <div className="flex justify-center" title="Bot Connected">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
