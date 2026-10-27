"use client";

import React, { useState } from "react";
import { Hash, Volume2, Megaphone, MessageSquare, ChevronDown, RefreshCw, Search } from "lucide-react";

export interface DiscordChannelItem {
  id: string;
  name: string;
  type?: number; // 0 = text, 2 = voice, 4 = category, 5 = announcement, 15 = forum
  position?: number;
}

interface ChannelSelectProps {
  channels: DiscordChannelItem[];
  selectedChannelId: string;
  onSelect: (channelId: string, channelName: string) => void;
  filterTypes?: number[]; // e.g. [0, 5] for text & announcement
  placeholder?: string;
  disabled?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
  required?: boolean;
}

export function getChannelIcon(type?: number) {
  switch (type) {
    case 2:
      return <Volume2 className="w-4 h-4 text-emerald-400" />;
    case 5:
      return <Megaphone className="w-4 h-4 text-discord-blurple" />;
    case 15:
      return <MessageSquare className="w-4 h-4 text-amber-400" />;
    default:
      return <Hash className="w-4 h-4 text-zinc-400" />;
  }
}

export function ChannelSelect({
  channels,
  selectedChannelId,
  onSelect,
  filterTypes = [0, 5], // Default text & announcement channels
  placeholder = "Select a Discord channel...",
  disabled = false,
  onRefresh,
  refreshing = false,
  className = "",
}: ChannelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = channels
    .filter((c) => {
      // Ignore category channels (type 4)
      if (c.type === 4) return false;
      if (filterTypes.length > 0 && c.type !== undefined && !filterTypes.includes(c.type)) {
        return false;
      }
      if (!query.trim()) return true;
      return c.name.toLowerCase().includes(query.toLowerCase()) || c.id.includes(query);
    })
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-discord-dark border text-left text-sm transition cursor-pointer select-none ${
            isOpen
              ? "border-discord-blurple shadow-sm shadow-discord-blurple/20"
              : "border-white/10 hover:border-white/20"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {selectedChannel ? (
              <>
                {getChannelIcon(selectedChannel.type)}
                <span className="font-medium text-white truncate">
                  #{selectedChannel.name}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  ({selectedChannel.id})
                </span>
              </>
            ) : (
              <span className="text-zinc-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform ${
              isOpen ? "rotate-180 text-discord-blurple" : ""
            }`}
          />
        </button>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing || disabled}
            title="Refresh channel list"
            className="p-2.5 rounded-xl bg-discord-dark border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-discord-blurple" : ""}`} />
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 p-2 rounded-xl bg-discord-card border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search channels..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple"
                />
              </div>
              {onRefresh && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  disabled={refreshing}
                  title="Refresh server channels"
                  className="p-2 rounded-lg bg-discord-dark hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-discord-blurple" : ""}`} />
                </button>
              )}
            </div>

            <div className="overflow-y-auto space-y-0.5 divide-y divide-white/[0.03] pr-1">
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  {channels.length === 0 ? "No channels loaded from server" : "No matching channels"}
                </div>
              ) : (
                filtered.map((c) => {
                  const isSelected = c.id === selectedChannelId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelect(c.id, c.name);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                        isSelected
                          ? "bg-discord-blurple text-white font-semibold"
                          : "hover:bg-white/5 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {getChannelIcon(c.type)}
                        <span className="truncate">#{c.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono ${
                          isSelected ? "text-white/80" : "text-zinc-500"
                        }`}
                      >
                        {c.id}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
