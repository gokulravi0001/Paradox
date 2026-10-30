"use client";

import React, { useState } from "react";
import {
  Sparkles,
  User,
  Image as ImageIcon,
  AtSign,
  Landmark,
  Users,
  Hash,
  Check,
  ChevronDown,
} from "lucide-react";
import { DiscordChannelItem, getChannelIcon } from "./ChannelSelect";

export interface QuickTagItem {
  tag: string;
  label: string;
  icon?: React.ReactNode;
  category?: "user" | "server" | "media";
  desc?: string;
}

export interface QuickTagsBarProps {
  onInsert: (tag: string) => void;
  channels?: DiscordChannelItem[];
  variant?: "all" | "user" | "server" | "media-url" | "compact";
  className?: string;
  activeValue?: string;
}

export function QuickTagsBar({
  onInsert,
  channels = [],
  variant = "all",
  className = "",
  activeValue,
}: QuickTagsBarProps) {
  const [lastInserted, setLastInserted] = useState<string | null>(null);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");

  function handleTagClick(tag: string) {
    onInsert(tag);
    setLastInserted(tag);
    setTimeout(() => {
      setLastInserted(null);
    }, 1200);
  }

  // Preset for image / URL fields (Thumbnail, Banner, Author Icon)
  if (variant === "media-url") {
    return (
      <div className={`flex items-center flex-wrap gap-1.5 pt-1 ${className}`}>
        <span className="text-[10px] text-zinc-500 font-medium mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-discord-blurple" />
          Quick Insert:
        </span>
        <button
          type="button"
          onClick={() => handleTagClick("{user.avatar}")}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono transition cursor-pointer ${
            activeValue === "{user.avatar}" || activeValue === "{user.pfp}"
              ? "bg-discord-blurple text-white border border-discord-blurple shadow-sm"
              : "bg-discord-dark hover:bg-white/10 text-discord-blurple border border-discord-blurple/30 hover:border-discord-blurple"
          }`}
          title="Dynamic member profile picture URL"
        >
          {lastInserted === "{user.avatar}" ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <ImageIcon className="w-3 h-3" />
          )}
          <span>{"{user.avatar}"}</span>
          <span className="text-[9px] font-sans opacity-70">(Member PFP)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTagClick("{server.icon}")}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono transition cursor-pointer ${
            activeValue === "{server.icon}"
              ? "bg-emerald-600 text-white border border-emerald-500 shadow-sm"
              : "bg-discord-dark hover:bg-white/10 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400"
          }`}
          title="Dynamic server icon URL"
        >
          {lastInserted === "{server.icon}" ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Landmark className="w-3 h-3" />
          )}
          <span>{"{server.icon}"}</span>
          <span className="text-[9px] font-sans opacity-70">(Server Icon)</span>
        </button>
      </div>
    );
  }

  const tags: QuickTagItem[] = [
    {
      tag: "{user.avatar}",
      label: "Member PFP",
      icon: <ImageIcon className="w-3 h-3 text-discord-blurple" />,
      desc: "Dynamic avatar URL of the member",
    },
    {
      tag: "{user.mention}",
      label: "User Mention",
      icon: <AtSign className="w-3 h-3 text-sky-400" />,
      desc: "Mentions @User in chat",
    },
    {
      tag: "{user.name}",
      label: "Username",
      icon: <User className="w-3 h-3 text-indigo-400" />,
      desc: "User display username",
    },
    {
      tag: "{server.name}",
      label: "Server Name",
      icon: <Landmark className="w-3 h-3 text-emerald-400" />,
      desc: "Server guild title",
    },
    {
      tag: "{server.member_count}",
      label: "Member Count",
      icon: <Users className="w-3 h-3 text-amber-400" />,
      desc: "Current member count",
    },
    {
      tag: "{server.icon}",
      label: "Server Icon",
      icon: <ImageIcon className="w-3 h-3 text-teal-400" />,
      desc: "Server icon image link",
    },
  ];

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(channelSearch.toLowerCase()) || c.id.includes(channelSearch)
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center flex-wrap gap-1.5">
        <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1 uppercase tracking-wider mr-0.5">
          <Sparkles className="w-3 h-3 text-discord-blurple" />
          Tags:
        </span>

        {tags.map((item) => {
          const isInserted = lastInserted === item.tag;
          return (
            <button
              key={item.tag}
              type="button"
              onClick={() => handleTagClick(item.tag)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer select-none ${
                isInserted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500 scale-95"
                  : "bg-discord-dark/90 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 hover:border-discord-blurple/50 shadow-sm"
              }`}
              title={`${item.label} (${item.desc}) - Click to insert`}
            >
              {isInserted ? (
                <Check className="w-3 h-3 text-emerald-400 animate-in zoom-in" />
              ) : (
                item.icon
              )}
              <span className="font-semibold">{item.tag}</span>
              {isInserted ? (
                <span className="text-[9px] font-sans text-emerald-400 font-bold">Added!</span>
              ) : (
                <span className="text-[9px] font-sans text-zinc-400 font-medium">({item.label})</span>
              )}
            </button>
          );
        })}

        {/* Quick Channel Mention Pill */}
        {channels.length > 0 && (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowChannelPicker((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono bg-discord-dark/90 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 hover:border-discord-blurple/50 shadow-sm cursor-pointer transition select-none"
              title="Pick a channel to mention (#channel-name)"
            >
              <Hash className="w-3 h-3 text-discord-blurple" />
              <span className="font-semibold">{"<#channel>"}</span>
              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${showChannelPicker ? "rotate-180" : ""}`} />
            </button>

            {showChannelPicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowChannelPicker(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 z-50 w-64 p-2 rounded-xl bg-discord-card border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1 pb-1.5 border-b border-white/5 mb-1.5">
                    Select Channel to Mention
                  </div>
                  <input
                    type="text"
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    placeholder="Search channel..."
                    autoFocus
                    className="w-full px-2 py-1 text-xs rounded-lg bg-discord-dark border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple mb-1.5"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {filteredChannels.length === 0 ? (
                      <div className="text-[11px] text-zinc-500 text-center py-2">
                        No channels found
                      </div>
                    ) : (
                      filteredChannels.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            handleTagClick(`<#${c.id}>`);
                            setShowChannelPicker(false);
                          }}
                          className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-discord-dark text-xs text-left text-zinc-300 hover:text-white cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {getChannelIcon(c.type)}
                            <span className="truncate">#{c.name}</span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500">Insert</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
