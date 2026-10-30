import React from "react";

/**
 * Lightweight safe Discord Markdown parser for Live Simulator Previews.
 * Supports:
 * - Blockquotes (`> `)
 * - Bold (`**text**`)
 * - Italics (`*text*` or `_text_`)
 * - Underline (`__text__`)
 * - Strikethrough (`~~text~~`)
 * - Inline Code (`` `code` ``)
 * - Discord Links (`[text](url)`)
 * - Line breaks
 */

function formatInline(text: string): React.ReactNode[] {
  // Tokenize string for markdown patterns
  // Order of matching: links, inline code, bold-italic, bold, underline, strikethrough, italic
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Regex for tokens:
  // [label](url)
  // `code`
  // ***bolditalic***
  // **bold**
  // __underline__
  // ~~strike~~
  // *italic*
  // _italic_
  // Match Discord markdown elements, HTML links, markdown links, channel mentions, member pings, and role pings
  const tokenRegex = /(<a\s+[^>]*href=["']?[^"'\s>]+["']?[^>]*>[\s\S]*?<\/a>|\[.*?\]\(<?https?:\/\/[^\s)>]+>?\)|`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|_[^_]+_|#[a-zA-Z0-9_\-]+|<#[0-9]+>|\{#[a-zA-Z0-9_\-]+\}|@[a-zA-Z0-9_\-]+|<@&?[0-9]+>)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    // HTML link format: <a href="link">TEXT</a>
    if (/^<a\s+/i.test(token)) {
      const htmlMatch = token.match(/<a\s+[^>]*href=["']?([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/a>/i);
      if (htmlMatch) {
        const url = htmlMatch[1];
        const label = htmlMatch[2];
        parts.push(
          <a
            key={key++}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a8fc] hover:underline"
          >
            {label}
          </a>
        );
        lastIndex = tokenRegex.lastIndex;
        continue;
      }
    }

    if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const closingBracket = token.indexOf("](");
      const label = token.slice(1, closingBracket);
      let url = token.slice(closingBracket + 2, -1).trim();
      if (url.startsWith("<") && url.endsWith(">")) {
        url = url.slice(1, -1).trim();
      }
      parts.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00a8fc] hover:underline"
        >
          {label}
        </a>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="px-1 py-0.5 rounded bg-[#1e1f22] text-[#e0e1e5] font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("***") && token.endsWith("***")) {
      parts.push(
        <strong key={key++} className="font-bold italic">
          {token.slice(3, -3)}
        </strong>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={key++} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("__") && token.endsWith("__")) {
      parts.push(
        <u key={key++} className="underline underline-offset-2">
          {token.slice(2, -2)}
        </u>
      );
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      parts.push(
        <del key={key++} className="line-through text-[#949ba4]">
          {token.slice(2, -2)}
        </del>
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      parts.push(
        <em key={key++} className="italic text-[#dbdee1]">
          {token.slice(1, -1)}
        </em>
      );
    } else if (
      token.startsWith("#") ||
      token.startsWith("<#") ||
      (token.startsWith("{#") && token.endsWith("}"))
    ) {
      const cleanLabel = token.replace(/[<>{}]/g, "").replace(/^#*/, "");
      parts.push(
        <span
          key={key++}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] bg-[#5865F2]/20 hover:bg-[#5865F2]/35 text-[#c9cdfb] hover:text-white font-medium text-[11px] transition select-none cursor-pointer"
          title={`Channel Ping: #${cleanLabel}`}
        >
          <span className="text-[#8e9afc] font-semibold text-[10px]">#</span>
          <span>{cleanLabel}</span>
        </span>
      );
    } else if (
      token.startsWith("@") ||
      token.startsWith("<@")
    ) {
      const cleanLabel = token.replace(/[<>@&]/g, "");
      parts.push(
        <span
          key={key++}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] bg-[#5865F2]/20 hover:bg-[#5865F2]/35 text-[#c9cdfb] hover:text-white font-medium text-[11px] transition select-none cursor-pointer"
          title={`Ping: @${cleanLabel}`}
        >
          <span className="text-[#8e9afc] font-semibold text-[10px]">@</span>
          <span>{cleanLabel}</span>
        </span>
      );
    } else {
      parts.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function DiscordMarkdown({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, idx) => {
        const isQuote = line.startsWith("> ");
        const lineContent = isQuote ? line.slice(2) : line;

        if (isQuote) {
          return (
            <div
              key={idx}
              className="flex border-l-4 border-[#4e5058] pl-2.5 my-1 text-[#b5bac1] italic"
            >
              <span>{formatInline(lineContent)}</span>
            </div>
          );
        }

        // Empty line
        if (lineContent.trim() === "") {
          return <div key={idx} className="h-1.5" />;
        }

        return <div key={idx}>{formatInline(lineContent)}</div>;
      })}
    </div>
  );
}
