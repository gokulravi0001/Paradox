"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Shield,
  Clock,
} from "lucide-react";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

interface AuditLogItem {
  id: string;
  userId: string;
  action: string;
  details: string | null;
  createdAt: string;
}

export default function LogsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function addToast(type: ToastMessage["type"], message: string, title?: string) {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function loadLogs() {
    try {
      setRefreshing(true);
      const url =
        actionFilter !== "ALL"
          ? `/api/guilds/${guildId}/logs?action=${actionFilter}`
          : `/api/guilds/${guildId}/logs`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      addToast("error", "Failed to fetch audit logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (guildId) loadLogs();
  }, [guildId, actionFilter]);

  const filtered = logs.filter((log) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.userId.includes(q) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-discord-blurple/10 border border-discord-blurple/20 text-discord-blurple text-[11px] font-bold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Security & Audit Trails</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Dashboard Audit Logs
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track every configuration change, embed publication, and administrative action performed through the dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl bg-discord-dark hover:bg-white/5 border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-discord-blurple" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-discord-card border border-white/5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search logs by action, user ID, or payload details..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-discord-blurple"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-discord-dark border border-white/10 text-xs text-white focus:outline-none focus:border-discord-blurple"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE_REACTION_ROLE">Reaction Roles</option>
            <option value="PUBLISH_EMBED">Embeds</option>
            <option value="UPDATE_WELCOME_CONFIG">Welcome Config</option>
            <option value="UPDATE_GOODBYE_CONFIG">Goodbye Config</option>
            <option value="PUBLISH_RULES">Rules</option>
            <option value="PUBLISH_ANNOUNCEMENT">Announcements</option>
            <option value="START_GIVEAWAY">Giveaways</option>
            <option value="CREATE_EVENT">Events</option>
            <option value="UPDATE_SETTINGS">Server Settings</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="p-5 rounded-2xl bg-discord-card border border-white/5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-discord-blurple animate-spin" />
            <p className="text-xs text-zinc-400">Loading audit history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            No audit logs found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 text-zinc-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="pb-3 pl-3">Timestamp</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Admin User ID</th>
                  <th className="pb-3 pr-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition font-sans">
                    <td className="py-3.5 pl-3 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-discord-dark border border-white/10 font-bold text-white text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-discord-blurple" />
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 text-zinc-300 font-mono text-[11px]">
                      {log.userId}
                    </td>
                    <td className="py-3.5 pr-3 text-zinc-400 font-mono text-[11px] max-w-md truncate">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
