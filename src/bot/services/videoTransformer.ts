export type VideoProviderId = "twitter" | "tiktok" | "instagram" | "reddit" | "bluesky" | "threads";

export interface VideoProviderInfo {
  id: VideoProviderId;
  name: string;
  badge: string;
  description: string;
  targetDomain: string;
  limitations: string[];
}

export const SUPPORTED_PROVIDERS: Record<VideoProviderId, VideoProviderInfo> = {
  twitter: {
    id: "twitter",
    name: "X (formerly Twitter)",
    badge: "Twitter / X",
    description: "Transforms x.com and twitter.com post links to fxtwitter.com for instant inline video playback in Discord.",
    targetDomain: "fxtwitter.com",
    limitations: [
      "Protected/private accounts cannot be embedded.",
      "Spaces or live broadcasts are not supported as video files.",
      "Subject to upstream X API rate limits and CDN changes.",
    ],
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    badge: "TikTok",
    description: "Transforms tiktok.com (desktop and vm.tiktok.com mobile links) to tiktxk.com for full playable video embeds.",
    targetDomain: "tiktxk.com",
    limitations: [
      "Private or region-locked TikTok videos cannot be previewed.",
      "Photo carousel posts may embed only the primary slide.",
      "Occasional platform rate-limiting during high traffic.",
    ],
  },
  instagram: {
    id: "instagram",
    name: "Instagram Reels & Posts",
    badge: "Instagram",
    description: "Transforms instagram.com/reel and /p/ links to fxinstagram.com so video reels play directly inside Discord chat.",
    targetDomain: "fxinstagram.com",
    limitations: [
      "Private Instagram account links cannot be resolved.",
      "Instagram Stories are not supported.",
      "Age-restricted content will not render inline previews.",
    ],
  },
  reddit: {
    id: "reddit",
    name: "Reddit Videos",
    badge: "Reddit",
    description: "Transforms reddit.com post links to rxddit.com, combining separated Reddit video and audio streams seamlessly.",
    targetDomain: "rxddit.com",
    limitations: [
      "NSFW subreddits may require age verification not supported by the embed proxy.",
      "Text-only or external link submissions do not contain video streams.",
    ],
  },
  bluesky: {
    id: "bluesky",
    name: "Bluesky Social",
    badge: "Bluesky",
    description: "Transforms bsky.app video and post links to bskyx.app for instant Discord video player preview.",
    targetDomain: "bskyx.app",
    limitations: ["Text-only posts without media do not require video transformation."],
  },
  threads: {
    id: "threads",
    name: "Meta Threads",
    badge: "Threads",
    description: "Transforms threads.net video posts to fixthreads.net for rich Discord media playback.",
    targetDomain: "fixthreads.net",
    limitations: ["Private threads profiles cannot be embedded."],
  },
};

export interface TransformedLink {
  originalUrl: string;
  transformedUrl: string;
  provider: VideoProviderId;
}

/**
 * Inspects a message string, identifies supported video URLs that are not suppressed,
 * and transforms them into embed-friendly URLs based on enabled providers.
 */
export function extractAndTransformVideoUrls(
  content: string,
  enabledProviders: string[] = ["twitter", "tiktok", "instagram", "reddit", "bluesky", "threads"]
): TransformedLink[] {
  if (!content || typeof content !== "string") return [];

  const results: TransformedLink[] = [];
  const activeProviders = new Set(enabledProviders);

  // Match URLs in the message that are NOT enclosed in <...> (which Discord uses to suppress embeds)
  const urlRegex = /(?<!<)\bhttps?:\/\/[^\s<>]+(?!\>)/gi;
  const matches = content.match(urlRegex);

  if (!matches) return [];

  for (const rawUrl of matches) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname;

      // 1. Twitter / X
      if (activeProviders.has("twitter")) {
        const isTwitter = host === "twitter.com" || host === "www.twitter.com" || host === "x.com" || host === "www.x.com";
        const isAlreadyTransformed = host.includes("fxtwitter") || host.includes("vxtwitter") || host.includes("fixupx");

        if (isTwitter && !isAlreadyTransformed) {
          const statusMatch = pathname.match(/^\/([a-zA-Z0-9_]+)\/status\/([0-9]+)/);
          if (statusMatch) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "fxtwitter.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "twitter",
            });
            continue;
          }
        }
      }

      // 2. TikTok
      if (activeProviders.has("tiktok")) {
        const isStandardTikTok = host === "tiktok.com" || host === "www.tiktok.com";
        const isShortTikTok = host === "vm.tiktok.com" || host === "vt.tiktok.com";
        const isAlreadyTransformed = host.includes("tiktxk") || host.includes("vxtiktok");

        if (!isAlreadyTransformed) {
          if (isStandardTikTok && (pathname.includes("/video/") || pathname.includes("/photo/"))) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "tiktxk.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "tiktok",
            });
            continue;
          } else if (isShortTikTok && pathname.length > 1) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "tiktxk.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "tiktok",
            });
            continue;
          }
        }
      }

      // 3. Instagram
      if (activeProviders.has("instagram")) {
        const isInstagram = host === "instagram.com" || host === "www.instagram.com";
        const isAlreadyTransformed = host.includes("fxinstagram") || host.includes("ddinstagram") || host.includes("vxinstagram");

        if (isInstagram && !isAlreadyTransformed) {
          const instaMatch = pathname.match(/^\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/);
          if (instaMatch) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "fxinstagram.com";
            transformed.search = ""; // Strip tracking parameters for clean embed
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "instagram",
            });
            continue;
          }
        }
      }

      // 4. Reddit
      if (activeProviders.has("reddit")) {
        const isReddit = host === "reddit.com" || host === "www.reddit.com" || host === "old.reddit.com";
        const isAlreadyTransformed = host.includes("rxddit");

        if (isReddit && !isAlreadyTransformed) {
          const redditMatch = pathname.match(/^\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)/);
          if (redditMatch) {
            const transformed = new URL(rawUrl);
            transformed.hostname = "rxddit.com";
            results.push({
              originalUrl: rawUrl,
              transformedUrl: transformed.toString(),
              provider: "reddit",
            });
            continue;
          }
        }
      }

      // 5. Bluesky
      if (activeProviders.has("bluesky")) {
        const isBluesky = host === "bsky.app" || host === "www.bsky.app";
        const isAlreadyTransformed = host.includes("bskyx.app") || host.includes("fxbsky");

        if (isBluesky && !isAlreadyTransformed && pathname.includes("/post/")) {
          const transformed = new URL(rawUrl);
          transformed.hostname = "bskyx.app";
          results.push({
            originalUrl: rawUrl,
            transformedUrl: transformed.toString(),
            provider: "bluesky",
          });
          continue;
        }
      }

      // 6. Threads
      if (activeProviders.has("threads")) {
        const isThreads = host === "threads.net" || host === "www.threads.net";
        const isAlreadyTransformed = host.includes("fixthreads");

        if (isThreads && !isAlreadyTransformed && pathname.includes("/post/")) {
          const transformed = new URL(rawUrl);
          transformed.hostname = "fixthreads.net";
          results.push({
            originalUrl: rawUrl,
            transformedUrl: transformed.toString(),
            provider: "threads",
          });
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  return results;
}
