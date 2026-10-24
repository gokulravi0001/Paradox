"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Workflow,
  Plus,
  ExternalLink,
  Key,
  Copy,
  Check,
  CheckCircle2,
  Bell,
  Sparkles,
} from "lucide-react";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";

interface IntegrationCard {
  id: string;
  name: string;
  category: string;
  desc: string;
  icon: string;
  status: "CONNECTED" | "AVAILABLE";
}

export default function IntegrationsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedKey, setCopiedKey] = useState(false);

  function addToast(type: ToastMessage["type"], message: string, title?: string) {
    setToasts((prev) => [...prev, { id: Math.random().toString(), type, message, title }]);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const integrations: IntegrationCard[] = [
    {
      id: "twitch",
      name: "Twitch Live Stream Alerts",
      category: "Streaming",
      desc: "Post instant notifications whenever a server streamer goes live on Twitch.",
      icon: "🟣",
      status: "AVAILABLE",
    },
    {
      id: "youtube",
      name: "YouTube Channel Feed",
      category: "Content",
      desc: "Automatically post new video uploads and live premiere notifications.",
      icon: "🔴",
      status: "AVAILABLE",
    },
    {
      id: "github",
      name: "GitHub Repository Pings",
      category: "Developer",
      desc: "Stream commit updates, pull requests, and release announcements.",
      icon: "🐙",
      status: "AVAILABLE",
    },
    {
      id: "webhooks",
      name: "Custom Discord Webhooks",
      category: "Automation",
      desc: "Connect Zapier, Make, or custom API endpoints directly to server channels.",
      icon: "⚡",
      status: "AVAILABLE",
    },
  ];

  function handleCopyKey() {
    navigator.clipboard.writeText(`pdx_live_${guildId}_${Math.random().toString(36).substring(2, 10)}`);
    setCopiedKey(true);
    addToast("success", "API Token copied to clipboard!", "Copied");
    setTimeout(() => setCopiedKey(false), 2000);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-discord-blurple/10 border border-discord-blurple/20 text-discord-blurple text-[11px] font-bold mb-2">
            <Workflow className="w-3.5 h-3.5" />
            <span>External Connections</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Integrations & Webhooks
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Connect your Discord server with third-party platforms for automated alerts, live streams, and developer webhooks.
          </p>
        </div>
      </div>

      {/* API Key Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-discord-card to-discord-dark border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Server Dashboard API Key</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Read / Write
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Use this secret key to authenticate custom scripts and integrations with your server&apos;s bot data.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="password"
            readOnly
            value={`pdx_live_${guildId}_${"•".repeat(24)}`}
            className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-400"
          />
          <button
            type="button"
            onClick={handleCopyKey}
            className="px-4 py-2 rounded-xl bg-discord-blurple hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey ? "Copied" : "Copy Token"}</span>
          </button>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-discord-card border border-white/5 hover:border-white/10 transition space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2.5 rounded-xl bg-discord-dark border border-white/5">
                  {item.icon}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.name}</h4>
                  <span className="text-[10px] font-semibold text-discord-blurple">
                    {item.category}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">
                {item.status}
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>

            <div className="pt-2 flex items-center justify-between border-t border-white/5">
              <button
                type="button"
                onClick={() => addToast("info", `${item.name} setup guide initiated.`)}
                className="text-xs font-semibold text-discord-blurple hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Configure Integration</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
