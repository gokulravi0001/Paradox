"use client";

import React, { useState } from "react";
import { Sparkles, User, Landmark, Hash, Gift, Calendar, Copy, Check, ChevronDown } from "lucide-react";
import { DiscordChannelItem, getChannelIcon } from "./ChannelSelect";

interface VariableMenuProps {
  channels?: DiscordChannelItem[];
  onInsert: (variable: string) => void;
  className?: string;
  label?: string;
}

export function VariableMenu({
  channels = [],
  onInsert,
  className = "",
  label = "Insert Variable",
}: VariableMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"user" | "server" | "channels" | "giveaway" | "event">("user");
  const [channelSearch, setChannelSearch] = useState("");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const userVars = [
    { tag: "{user.mention}", label: "User Mention", desc: "Mentions the user (@User)" },
    { tag: "{user.name}", label: "Username", desc: "User's display name or username" },
    { tag: "{user.id}", label: "User ID", desc: "Discord snowflake ID (e.g. 15478372...)" },
  ];

  const serverVars = [
    { tag: "{server.name}", label: "Server Name", desc: "Current Discord guild name" },
    { tag: "{server.member_count}", label: "Member Count", desc: "Total count of server members" },
    { tag: "{server.icon}", label: "Server Icon URL", desc: "Direct CDN image link to server icon" },
    { tag: "{server.id}", label: "Server ID", desc: "Discord server ID" },
  ];

  const giveawayVars = [
    { tag: "{giveaway.prize}", label: "Prize", desc: "Name of the prize being given away" },
    { tag: "{giveaway.winner_count}", label: "Winner Count", desc: "Number of lucky winners" },
    { tag: "{giveaway.ends_at}", label: "End Timestamp", desc: "Discord dynamic timestamp for end" },
  ];

  const eventVars = [
    { tag: "{event.name}", label: "Event Name", desc: "Title of scheduled event" },
    { tag: "{event.date}", label: "Event Date/Time", desc: "Formatted start time of event" },
    { tag: "{event.location}", label: "Event Location", desc: "Voice channel or location link" },
  ];

  function handleSelect(variable: string) {
    onInsert(variable);
    setCopiedVar(variable);
    setTimeout(() => {
      setCopiedVar(null);
      setIsOpen(false);
    }, 400);
  }

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(channelSearch.toLowerCase()) || c.id.includes(channelSearch)
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-discord-blurple/10 hover:bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30 text-xs font-semibold transition cursor-pointer"
        title="Insert dynamic server, user, or channel placeholders"
      >
        <Sparkles className="w-3.5 h-3.5 text-discord-blurple" />
        <span>{label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 p-3 rounded-2xl bg-discord-card border border-white/10 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-discord-blurple" />
                Dynamic Placeholders
              </span>
              <span className="text-[10px] text-zinc-500">Click to insert</span>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-discord-dark border border-white/5 mb-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("user")}
                className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                  activeTab === "user"
                    ? "bg-discord-blurple text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("server")}
                className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                  activeTab === "server"
                    ? "bg-discord-blurple text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Server
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("channels")}
                className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                  activeTab === "channels"
                    ? "bg-discord-blurple text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                #Channels
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("giveaway")}
                className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                  activeTab === "giveaway"
                    ? "bg-discord-blurple text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Gift
              </button>
            </div>

            {/* User Variables */}
            {activeTab === "user" && (
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {userVars.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleSelect(v.tag)}
                    className="w-full text-left p-2 rounded-xl bg-discord-dark/50 hover:bg-discord-dark border border-white/5 hover:border-discord-blurple/30 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-mono font-bold text-discord-blurple group-hover:text-blue-400">
                        {v.tag}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{v.desc}</div>
                    </div>
                    {copiedVar === v.tag ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition">
                        Insert
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Server Variables */}
            {activeTab === "server" && (
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {serverVars.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleSelect(v.tag)}
                    className="w-full text-left p-2 rounded-xl bg-discord-dark/50 hover:bg-discord-dark border border-white/5 hover:border-discord-blurple/30 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-mono font-bold text-emerald-400 group-hover:text-emerald-300">
                        {v.tag}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{v.desc}</div>
                    </div>
                    {copiedVar === v.tag ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition">
                        Insert
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Channels Variables (Multiple Channel Mentions) */}
            {activeTab === "channels" && (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  placeholder="Filter channels to mention..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple"
                />
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {filteredChannels.length === 0 ? (
                    <div className="py-4 text-center text-xs text-zinc-500">
                      No channels found
                    </div>
                  ) : (
                    filteredChannels.map((c) => {
                      const mentionTag = `<#${c.id}>`;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelect(mentionTag)}
                          className="w-full text-left p-2 rounded-xl bg-discord-dark/50 hover:bg-discord-dark border border-white/5 hover:border-discord-blurple/30 transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {getChannelIcon(c.type)}
                            <div>
                              <div className="text-xs font-semibold text-white truncate">
                                #{c.name}
                              </div>
                              <div className="text-[10px] font-mono text-zinc-500">
                                {mentionTag}
                              </div>
                            </div>
                          </div>
                          {copiedVar === mentionTag ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <span className="text-[10px] text-discord-blurple opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                              Mention
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Giveaway Variables */}
            {activeTab === "giveaway" && (
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {giveawayVars.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleSelect(v.tag)}
                    className="w-full text-left p-2 rounded-xl bg-discord-dark/50 hover:bg-discord-dark border border-white/5 hover:border-discord-blurple/30 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-mono font-bold text-amber-400 group-hover:text-amber-300">
                        {v.tag}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{v.desc}</div>
                    </div>
                    {copiedVar === v.tag ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition">
                        Insert
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
