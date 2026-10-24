"use client";

import React from "react";
import { ExternalLink, Hash } from "lucide-react";
import { DiscordMarkdown } from "@/lib/discordMarkdown";

export interface EmbedFieldItem {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordButtonPreview {
  label: string;
  style?: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER" | "LINK";
  emoji?: string;
  url?: string;
  disabled?: boolean;
}

export interface DiscordPreviewProps {
  botName?: string;
  botAvatar?: string;
  content?: string; // Text message outside embed
  title?: string;
  description?: string;
  url?: string;
  color?: string;
  authorName?: string;
  authorIconUrl?: string;
  authorUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  footerText?: string;
  footerIconUrl?: string;
  timestamp?: boolean;
  fields?: EmbedFieldItem[];
  buttons?: DiscordButtonPreview[];
  channelMap?: Record<string, string>; // channelId -> channelName for resolving <#123>
}

export function DiscordPreview({
  botName = "Paradox",
  botAvatar = "https://cdn.discordapp.com/embed/avatars/0.png",
  content,
  title,
  description,
  url,
  color = "#5865F2",
  authorName,
  authorIconUrl,
  authorUrl,
  thumbnailUrl,
  imageUrl,
  footerText,
  footerIconUrl,
  timestamp = false,
  fields = [],
  buttons = [],
  channelMap = {},
}: DiscordPreviewProps) {
  // Helper to replace <#id> with channel names if available
  function formatMentions(text?: string) {
    if (!text) return "";
    return text.replace(/<#(\d+)>/g, (match, id) => {
      const name = channelMap[id];
      return name ? `\`#${name}\`` : match;
    });
  }

  const hasEmbed =
    title ||
    description ||
    authorName ||
    thumbnailUrl ||
    imageUrl ||
    footerText ||
    fields.length > 0;

  return (
    <div className="w-full rounded-2xl bg-[#313338] p-4 text-[#dbdee1] font-sans text-sm shadow-xl border border-white/5 select-none overflow-hidden">
      {/* Bot Message Header */}
      <div className="flex items-start gap-3.5">
        <img
          src={botAvatar}
          alt={botName}
          className="w-10 h-10 rounded-full flex-shrink-0 object-cover bg-[#1e1f22]"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://cdn.discordapp.com/embed/avatars/0.png";
          }}
        />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white hover:underline cursor-pointer">
              {botName}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#5865F2] text-white tracking-wide">
              BOT
            </span>
            <span className="text-[11px] text-[#949ba4]">
              Today at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Message Content Outside Embed */}
          {content && (
            <div className="text-sm text-[#dbdee1] leading-relaxed break-words whitespace-pre-wrap pt-0.5">
              <DiscordMarkdown content={formatMentions(content)} />
            </div>
          )}

          {/* Rich Discord Embed */}
          {hasEmbed && (
            <div
              className="mt-2 rounded-lg bg-[#2b2d31] border-l-4 p-3.5 max-w-xl space-y-3 shadow-md"
              style={{ borderLeftColor: color || "#5865F2" }}
            >
              {/* Author */}
              {authorName && (
                <div className="flex items-center gap-2">
                  {authorIconUrl && (
                    <img
                      src={authorIconUrl}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                    />
                  )}
                  {authorUrl ? (
                    <a
                      href={authorUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-white hover:underline"
                    >
                      {authorName}
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-white">{authorName}</span>
                  )}
                </div>
              )}

              {/* Title & Thumbnail Grid */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  {title && (
                    <h4 className="text-base font-bold text-white break-words">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#00a8fc] hover:underline"
                        >
                          {title}
                        </a>
                      ) : (
                        title
                      )}
                    </h4>
                  )}

                  {/* Description */}
                  {description && (
                    <div className="text-xs text-[#dbdee1] leading-relaxed break-words whitespace-pre-wrap">
                      <DiscordMarkdown content={formatMentions(description)} />
                    </div>
                  )}
                </div>

                {/* Thumbnail */}
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt=""
                    className="w-20 h-20 rounded-md object-cover flex-shrink-0 bg-black/20"
                    onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                  />
                )}
              </div>

              {/* Fields */}
              {fields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {fields.map((f, i) => (
                    <div
                      key={i}
                      className={f.inline ? "col-span-1" : "col-span-full"}
                    >
                      <div className="text-xs font-bold text-white break-words">{f.name}</div>
                      <div className="text-xs text-[#dbdee1] break-words whitespace-pre-wrap mt-0.5">
                        <DiscordMarkdown content={formatMentions(f.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Image */}
              {imageUrl && (
                <div className="pt-1">
                  <img
                    src={imageUrl}
                    alt=""
                    className="max-h-80 w-full object-cover rounded-md bg-black/20"
                    onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                  />
                </div>
              )}

              {/* Footer & Timestamp */}
              {(footerText || timestamp) && (
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04] text-[11px] text-[#949ba4]">
                  {footerIconUrl && (
                    <img
                      src={footerIconUrl}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                      onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                    />
                  )}
                  <span>
                    {footerText}
                    {footerText && timestamp && " • "}
                    {timestamp &&
                      new Date().toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Row Buttons */}
          {buttons.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {buttons.map((btn, idx) => {
                let btnClass = "bg-[#4e5058] hover:bg-[#6d6f78] text-white";
                if (btn.style === "PRIMARY") btnClass = "bg-[#5865F2] hover:bg-[#4752c4] text-white";
                if (btn.style === "SUCCESS") btnClass = "bg-[#248046] hover:bg-[#1a6334] text-white";
                if (btn.style === "DANGER") btnClass = "bg-[#da373c] hover:bg-[#a12828] text-white";
                if (btn.style === "LINK") btnClass = "bg-[#4e5058] hover:bg-[#6d6f78] text-white";

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={btn.disabled}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer shadow-sm ${btnClass}`}
                  >
                    {btn.emoji && <span>{btn.emoji}</span>}
                    <span>{btn.label}</span>
                    {btn.style === "LINK" && <ExternalLink className="w-3 h-3 text-white/70" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
