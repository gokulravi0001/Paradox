"use client";

import React, { useState } from "react";
import { Shield, ChevronDown, RefreshCw, Search, AlertCircle, Check } from "lucide-react";

export interface DiscordRoleItem {
  id: string;
  name: string;
  color: string;
  position: number;
  managed: boolean;
  assignableByBot: boolean;
}

interface RoleSelectProps {
  roles: DiscordRoleItem[];
  selectedRoleId: string;
  onSelect: (roleId: string, roleName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  filterManaged?: boolean;
  className?: string;
}

export function RoleSelect({
  roles,
  selectedRoleId,
  onSelect,
  placeholder = "Select a Discord role...",
  disabled = false,
  onRefresh,
  refreshing = false,
  filterManaged = true,
  className = "",
}: RoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = roles
    .filter((r) => {
      if (filterManaged && r.managed) return false;
      if (!query.trim()) return true;
      return r.name.toLowerCase().includes(query.toLowerCase()) || r.id.includes(query);
    })
    .sort((a, b) => b.position - a.position);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

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
            {selectedRole ? (
              <>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      selectedRole.color !== "#000000" && selectedRole.color !== "#0"
                        ? selectedRole.color
                        : "#99aab5",
                  }}
                />
                <span className="font-medium text-white truncate">
                  @{selectedRole.name}
                </span>
                {!selectedRole.assignableByBot && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Above Bot
                  </span>
                )}
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
            title="Refresh roles list"
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
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search server roles..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-discord-dark border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple"
              />
            </div>

            <div className="overflow-y-auto space-y-0.5 divide-y divide-white/[0.03] pr-1">
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  {roles.length === 0 ? "No roles loaded" : "No matching roles found"}
                </div>
              ) : (
                filtered.map((r) => {
                  const isSelected = r.id === selectedRoleId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        onSelect(r.id, r.name);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                        isSelected
                          ? "bg-discord-blurple text-white font-semibold"
                          : "hover:bg-white/5 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              r.color !== "#000000" && r.color !== "#0"
                                ? r.color
                                : "#99aab5",
                          }}
                        />
                        <span className="truncate">@{r.name}</span>
                        {!r.assignableByBot && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                            Higher than bot
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
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
