import { createCanvas, loadImage, Image } from "@napi-rs/canvas";
import * as gifencModule from "gifenc";
const GIFEncoder = (gifencModule as any).GIFEncoder || (gifencModule as any).default;
const quantize = (gifencModule as any).quantize;
const applyPalette = (gifencModule as any).applyPalette;

/**
 * Validates a URL to prevent Server-Side Request Forgery (SSRF) and malicious host calls.
 */
export function validateImageUrl(urlStr: string): { valid: boolean; reason?: string } {
  try {
    const parsed = new URL(urlStr);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, reason: "Only HTTP and HTTPS image URLs are supported." };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, loopbacks, internal IPs, and cloud metadata endpoints
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "169.254.169.254" || // AWS/GCP/Azure instance metadata
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".onion")
    ) {
      return { valid: false, reason: "Access to private or local network addresses is prohibited." };
    }

    // Block standard private IPv4 ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const first = parseInt(ipMatch[1], 10);
      const second = parseInt(ipMatch[2], 10);

      if (
        first === 10 ||
        first === 127 ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168) ||
        (first === 169 && second === 254)
      ) {
        return { valid: false, reason: "Private network IP addresses are not permitted." };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: "Invalid URL format." };
  }
}

/**
 * Safely downloads an image buffer with size, type, and timeout validation.
 */
export async function fetchSafeImageBuffer(urlStr: string, maxSizeBytes = 8 * 1024 * 1024): Promise<Buffer> {
  const check = validateImageUrl(urlStr);
  if (!check.valid) {
    throw new Error(check.reason || "Invalid or untrusted image URL.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(urlStr, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AuraTamil-Bot/1.0 (+https://discord.gg)",
        Accept: "image/png,image/jpeg,image/webp,image/gif,*/*",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to download image (HTTP ${res.status}: ${res.statusText}).`);
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (!contentType.startsWith("image/")) {
      throw new Error(`URL did not return an image (Content-Type: ${contentType || "unknown"}).`);
    }

    const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
    if (contentLength > maxSizeBytes) {
      throw new Error(`Image size exceeds the 8 MB maximum limit.`);
    }

    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (buffer.length > maxSizeBytes) {
      throw new Error(`Image size exceeds the 8 MB maximum limit.`);
    }

    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Converts a static image into a genuine animated GIF with AURA TAMIL styled effects.
 */
export async function makeImageIntoGif(
  imageBuffer: Buffer,
  style: "pulse" | "zoom" | "glow" | "scanline" = "pulse"
): Promise<Buffer> {
  const img: Image = await loadImage(imageBuffer);

  // Constrain resolution for fast GIF encoding and compact Discord file sizes
  const targetMax = 380;
  let targetWidth = img.width;
  let targetHeight = img.height;

  if (targetWidth > targetMax || targetHeight > targetMax) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight / targetWidth) * targetMax);
      targetWidth = targetMax;
    } else {
      targetWidth = Math.round((targetWidth / targetHeight) * targetMax);
      targetHeight = targetMax;
    }
  }

  // Ensure dimensions are even numbers (better for GIF encoders)
  targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth + 1;
  targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;

  const frameCount = 12;
  const frameDelay = 85; // ~12 fps
  const gif = GIFEncoder();

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < frameCount; i++) {
    const progress = i / frameCount;
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // Dark sleek background
    ctx.fillStyle = "#0c0a14";
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    if (style === "zoom") {
      // Cinematic subtle zoom in and out
      const scale = 1.0 + Math.sin(progress * Math.PI) * 0.08;
      const w = targetWidth * scale;
      const h = targetHeight * scale;
      const x = (targetWidth - w) / 2;
      const y = (targetHeight - h) / 2;

      ctx.save();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      // Subtle glowing vignette border
      const grad = ctx.createRadialGradient(
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.35,
        targetWidth / 2,
        targetHeight / 2,
        targetWidth * 0.55
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(124, 58, 237, 0.45)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (style === "glow" || style === "pulse") {
      // AURA TAMIL Neon Purple & Crimson Red Glow
      const glowIntensity = Math.sin(progress * Math.PI * 2);
      const blur = 10 + Math.abs(glowIntensity) * 14;
      const glowColor = glowIntensity > 0 ? "rgba(147, 51, 234, 0.75)" : "rgba(239, 68, 68, 0.75)";

      // Draw base image centered
      const pad = 8;
      ctx.drawImage(img, pad, pad, targetWidth - pad * 2, targetHeight - pad * 2);

      // Draw animated glowing border
      ctx.save();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = blur;
      ctx.strokeRect(pad, pad, targetWidth - pad * 2, targetHeight - pad * 2);
      ctx.restore();
    } else if (style === "scanline") {
      // Futuristic holographic scanline
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const scanY = Math.floor(progress * targetHeight);
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanGrad.addColorStop(0, "rgba(168, 85, 247, 0)");
      scanGrad.addColorStop(0.5, "rgba(239, 68, 68, 0.55)");
      scanGrad.addColorStop(1, "rgba(168, 85, 247, 0)");

      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 20, targetWidth, 40);

      // Very subtle grid lines
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      for (let y = 0; y < targetHeight; y += 4) {
        ctx.fillRect(0, y, targetWidth, 1);
      }
    }

    const { data } = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, targetWidth, targetHeight, { palette, delay: frameDelay });
  }

  gif.finish();
  return Buffer.from(gif.bytes());
}

/**
 * Wraps text into lines that fit within a maximum width.
 */
function wrapText(
  ctx: any,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export interface QuoteCardOptions {
  text: string;
  author?: string;
  authorTag?: string;
  avatarBuffer?: Buffer;
  avatarUrl?: string;
  bgBuffer?: Buffer;
  serverName?: string;
  timestamp?: string;
}

/**
 * Generates an iconic Make-It-A-Quote photo (PNG Buffer) with the user's avatar fading into black
 * and italicized/cursive quote text, matching the famous Discord quote bot style.
 */
export async function generateQuoteCard(options: QuoteCardOptions): Promise<Buffer> {
  const width = 1024;
  const height = 537;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Solid pitch-black background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  // Resolve avatar buffer if URL provided
  let avatarImg: Image | null = null;
  let avBuffer = options.avatarBuffer;
  if (!avBuffer && options.avatarUrl) {
    try {
      avBuffer = await fetchSafeImageBuffer(options.avatarUrl);
    } catch {}
  }
  if (avBuffer) {
    try {
      avatarImg = await loadImage(avBuffer);
    } catch {
      avatarImg = null;
    }
  }

  let textCenterX = width / 2;
  let maxTextWidth = 580;

  if (avatarImg) {
    // Scale avatar to fill canvas height
    const scale = height / avatarImg.height;
    const avWidth = Math.round(avatarImg.width * scale);
    ctx.drawImage(avatarImg, 0, 0, avWidth, height);

    // Gradient fade from avatar into pure black
    const fadeStart = Math.min(200, avWidth * 0.42);
    const fadeEnd = Math.min(480, Math.max(avWidth, 380));

    const grad = ctx.createLinearGradient(fadeStart, 0, fadeEnd, 0);
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(0.3, "rgba(0, 0, 0, 0.4)");
    grad.addColorStop(0.65, "rgba(0, 0, 0, 0.82)");
    grad.addColorStop(0.9, "rgba(0, 0, 0, 0.98)");
    grad.addColorStop(1, "#000000");

    ctx.fillStyle = grad;
    ctx.fillRect(fadeStart, 0, width - fadeStart, height);

    // Ensure right side is 100% black
    ctx.fillStyle = "#000000";
    ctx.fillRect(fadeEnd, 0, width - fadeEnd, height);

    // Subtle edge vignette
    const topVignette = ctx.createLinearGradient(0, 0, 0, 50);
    topVignette.addColorStop(0, "rgba(0, 0, 0, 0.5)");
    topVignette.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = topVignette;
    ctx.fillRect(0, 0, fadeEnd, 50);

    const botVignette = ctx.createLinearGradient(0, height - 50, 0, height);
    botVignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    botVignette.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    ctx.fillStyle = botVignette;
    ctx.fillRect(0, height - 50, fadeEnd, 50);

    textCenterX = (fadeEnd + width) / 2;
    maxTextWidth = Math.min(520, width - fadeEnd - 50);
  }

  // Quoted Text Layout
  const cleanText = options.text.trim();
  let fontSize = 42;
  if (cleanText.length > 250) fontSize = 22;
  else if (cleanText.length > 140) fontSize = 26;
  else if (cleanText.length > 80) fontSize = 32;
  else if (cleanText.length > 35) fontSize = 38;

  ctx.font = `italic ${fontSize}px "Segoe Script", "Lucida Handwriting", "Brush Script MT", Georgia, cursive, serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";

  const lineHeight = fontSize * 1.4;
  const lines = wrapText(ctx, cleanText, maxTextWidth);

  const totalTextHeight = lines.length * lineHeight;
  const authorBlockHeight = 38;
  const startY = Math.max(80, (height - (totalTextHeight + authorBlockHeight)) / 2 + fontSize * 0.8);

  lines.forEach((line, index) => {
    ctx.fillText(line, textCenterX, startY + index * lineHeight);
  });

  // Author details below text: display strictly as @user.mention and remove username line below
  const mentionHandle = options.authorTag?.replace(/^@+/, "").trim();
  let rawAuthor = options.author?.replace(/<@!?\d+>/g, "").replace(/^@+/, "").trim() || "";

  // Prefer authorTag (Discord username/handle) so it matches @user.mention and never renders as tofu boxes
  let displayAuthor = "";
  if (mentionHandle) {
    displayAuthor = `@${mentionHandle}`;
  } else if (rawAuthor) {
    // Normalize stylized Unicode (NFKD) so fancy font glyphs decompose into readable ASCII
    const normalized = rawAuthor.normalize("NFKD").trim();
    displayAuthor = `@${normalized}`;
  } else {
    displayAuthor = "@Anonymous";
  }

  const authorY = startY + (lines.length - 1) * lineHeight + 48;

  ctx.font = '22px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = "#E5E7EB";
  ctx.fillText(`- ${displayAuthor}`, textCenterX, authorY);

  // Watermark in bottom-right corner (normalize stylized Unicode so glyphs do not render as □ boxes)
  let watermarkText = (options.serverName || "A U R A   T A M I L")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
  if (!watermarkText) watermarkText = "A U R A   T A M I L";
  ctx.textAlign = "right";
  ctx.font = '14px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = "#555555";
  ctx.fillText(watermarkText, width - 25, height - 25);

  return canvas.toBuffer("image/png");
}

/**
 * Generates an animated Quote GIF with the user's avatar and pulsing glow.
 */
export async function generateAnimatedQuoteCard(options: QuoteCardOptions): Promise<Buffer> {
  const width = 800;
  const height = 420;
  const frameCount = 10;
  const frameDelay = 100;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const gif = GIFEncoder();

  let avatarImg: Image | null = null;
  let avBuffer = options.avatarBuffer;
  if (!avBuffer && options.avatarUrl) {
    try {
      avBuffer = await fetchSafeImageBuffer(options.avatarUrl);
    } catch {}
  }
  if (avBuffer) {
    try {
      avatarImg = await loadImage(avBuffer);
    } catch {
      avatarImg = null;
    }
  }

  let textCenterX = width / 2;
  let maxTextWidth = 460;
  let fadeEnd = 360;

  for (let f = 0; f < frameCount; f++) {
    const progress = f / frameCount;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    if (avatarImg) {
      const scale = height / avatarImg.height;
      const avWidth = Math.round(avatarImg.width * scale);
      ctx.drawImage(avatarImg, 0, 0, avWidth, height);

      const fadeStart = Math.min(150, avWidth * 0.42);
      fadeEnd = Math.min(380, Math.max(avWidth, 300));

      const grad = ctx.createLinearGradient(fadeStart, 0, fadeEnd, 0);
      grad.addColorStop(0, "rgba(0, 0, 0, 0)");
      grad.addColorStop(0.35, "rgba(0, 0, 0, 0.45)");
      grad.addColorStop(0.7, "rgba(0, 0, 0, 0.85)");
      grad.addColorStop(1, "#000000");

      ctx.fillStyle = grad;
      ctx.fillRect(fadeStart, 0, width - fadeStart, height);

      ctx.fillStyle = "#000000";
      ctx.fillRect(fadeEnd, 0, width - fadeEnd, height);

      textCenterX = (fadeEnd + width) / 2;
      maxTextWidth = Math.min(420, width - fadeEnd - 40);
    }

    const pulse = Math.sin(progress * Math.PI * 2);

    // Quoted text
    const cleanText = options.text.trim();
    let fontSize = 34;
    if (cleanText.length > 200) fontSize = 18;
    else if (cleanText.length > 100) fontSize = 22;
    else if (cleanText.length > 40) fontSize = 28;

    ctx.font = `italic ${fontSize}px "Segoe Script", "Lucida Handwriting", "Brush Script MT", Georgia, cursive, serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";

    const lineHeight = fontSize * 1.4;
    const lines = wrapText(ctx, cleanText, maxTextWidth);

    const totalTextHeight = lines.length * lineHeight;
    const authorBlockHeight = 35;
    const startY = Math.max(60, (height - (totalTextHeight + authorBlockHeight)) / 2 + fontSize * 0.8);

    lines.forEach((line, index) => {
      ctx.fillText(line, textCenterX, startY + index * lineHeight);
    });

    // Author with subtle neon pulse: display strictly as @user.mention and remove username line below
    const mentionHandle = options.authorTag?.replace(/^@+/, "").trim();
    let rawAuthor = options.author?.replace(/<@!?\d+>/g, "").replace(/^@+/, "").trim() || "";

    let displayAuthor = "";
    if (mentionHandle) {
      displayAuthor = `@${mentionHandle}`;
    } else if (rawAuthor) {
      const normalized = rawAuthor.normalize("NFKD").trim();
      displayAuthor = `@${normalized}`;
    } else {
      displayAuthor = "@Anonymous";
    }

    const authorY = startY + (lines.length - 1) * lineHeight + 42;

    ctx.save();
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = pulse > 0 ? "#E5E7EB" : "#D1D5DB";
    ctx.shadowColor = pulse > 0 ? "rgba(168, 85, 247, 0.8)" : "rgba(239, 68, 68, 0.8)";
    ctx.shadowBlur = 4 + Math.abs(pulse) * 6;
    ctx.fillText(`- ${displayAuthor}`, textCenterX, authorY);
    ctx.restore();

    // Watermark in bottom-right corner
    let watermarkText = (options.serverName || "A U R A   T A M I L")
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "")
      .trim();
    if (!watermarkText) watermarkText = "A U R A   T A M I L";
    ctx.textAlign = "right";
    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = "#444444";
    ctx.fillText(watermarkText, width - 20, height - 20);

    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize(data, 128);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, width, height, { palette, delay: frameDelay });
  }

  gif.finish();
  return Buffer.from(gif.bytes());
}

/**
 * Draws AURA TAMIL deep dark purple & red obsidian background.
 */
function drawAuraBackground(ctx: any, width: number, height: number) {
  // Base dark background
  ctx.fillStyle = "#0a0813";
  ctx.fillRect(0, 0, width, height);

  // Purple ambient glow on top-left
  const purpleGlow = ctx.createRadialGradient(0, 0, 50, 0, 0, width * 0.7);
  purpleGlow.addColorStop(0, "rgba(124, 58, 237, 0.28)");
  purpleGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = purpleGlow;
  ctx.fillRect(0, 0, width, height);

  // Crimson red ambient glow on bottom-right
  const redGlow = ctx.createRadialGradient(width, height, 50, width, height, width * 0.7);
  redGlow.addColorStop(0, "rgba(220, 38, 38, 0.24)");
  redGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = redGlow;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draws a rounded rectangle path.
 */
function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
