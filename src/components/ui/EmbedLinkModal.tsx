"use client";

import React, { useState } from "react";
import { Link2, ExternalLink, X, Plus, Sparkles, Check } from "lucide-react";

interface EmbedLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdownLink: string) => void;
  defaultText?: string;
  defaultUrl?: string;
}

export function EmbedLinkModal({
  isOpen,
  onClose,
  onInsert,
  defaultText = "",
  defaultUrl = "",
}: EmbedLinkModalProps) {
  const [text, setText] = useState(defaultText);
  const [url, setUrl] = useState(defaultUrl);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedText = text.trim();
    let trimmedUrl = url.trim();

    if (!trimmedText) {
      setError("Please enter the clickable text.");
      return;
    }
    if (!trimmedUrl) {
      setError("Please enter the link URL.");
      return;
    }

    // Auto-prepend https:// if protocol is missing
    if (!/^https?:\/\//i.test(trimmedUrl) && !trimmedUrl.startsWith("discord://")) {
      trimmedUrl = "https://" + trimmedUrl;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setError("Please enter a valid web URL (e.g. https://discord.gg/example).");
      return;
    }

    const markdown = `[${trimmedText}](<${trimmedUrl}>)`;
    onInsert(markdown);
    setText("");
    setUrl("");
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => {
          setError("");
          onClose();
        }}
      />
      <div className="relative w-full max-w-md p-5 rounded-2xl bg-[#1e1f22] border border-white/10 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#00a8fc]/20 text-[#00a8fc] border border-[#00a8fc]/30">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Clickable Blue Text Link</h3>
              <p className="text-[11px] text-zinc-400">
                Highlights your text in blue and opens the link when clicked (No embed card)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setError("");
              onClose();
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Option 1: Enter Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span>1. Enter Text (Highlighted in Blue)</span>
              <span className="text-[10px] text-zinc-500">What users see</span>
            </label>
            <input
              type="text"
              autoFocus
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Join Aura Tamil, Official Website, Read Rules..."
              className="w-full px-3.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#00a8fc] transition"
            />
          </div>

          {/* Option 2: Enter Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span>2. Enter Link (Destination URL)</span>
              <span className="text-[10px] text-zinc-500">Opens when clicked</span>
            </label>
            <div className="relative">
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError("");
                }}
                placeholder="https://discord.gg/aura or https://..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-discord-dark border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#00a8fc] font-mono transition"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 rounded-xl bg-discord-dark/70 border border-white/5 space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Discord Chat Preview (No Embed Card):
            </span>
            <div className="text-xs text-zinc-300">
              {text.trim() && url.trim() ? (
                <span>
                  Check out{" "}
                  <span className="text-[#00a8fc] underline cursor-pointer font-medium hover:text-[#38bdf8]">
                    {text.trim()}
                  </span>
                  !
                </span>
              ) : (
                <span className="text-zinc-500 italic">
                  Fill in the text and link above to see the blue clickable preview...
                </span>
              )}
            </div>
            {text.trim() && url.trim() && (
              <div className="text-[10px] font-mono text-emerald-400 truncate pt-1">
                Discord Markdown: [{text.trim()}](&lt;{url.trim()}&gt;)
              </div>
            )}
            <p className="text-[10px] text-zinc-500 italic">
              💡 Supports &lt;a href=&quot;link&quot;&gt;TEXT&lt;/a&gt; syntax! You can also type &lt;a href=&quot;...&quot;&gt;TEXT&lt;/a&gt; directly in any Discord channel.
            </p>
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setError("");
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || !url.trim()}
              className="px-4 py-2 rounded-xl bg-[#00a8fc] hover:bg-[#0094dd] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-[#00a8fc]/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Insert Blue Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
