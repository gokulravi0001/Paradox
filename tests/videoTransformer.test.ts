import { describe, it, expect } from "vitest";
import { extractAndTransformVideoUrls } from "@/bot/services/videoTransformer";

describe("Link-to-Video URL Transformation Engine", () => {
  it("should transform Twitter/X URLs to fxtwitter.com", () => {
    const content = "Look at this video: https://twitter.com/jack/status/20 and also https://x.com/elonmusk/status/123456789";
    const result = extractAndTransformVideoUrls(content, ["twitter"]);

    expect(result).toHaveLength(2);
    expect(result[0].transformedUrl).toBe("https://fxtwitter.com/jack/status/20");
    expect(result[1].transformedUrl).toBe("https://fxtwitter.com/elonmusk/status/123456789");
  });

  it("should transform standard and short TikTok URLs to tiktxk.com", () => {
    const content = "Check out https://www.tiktok.com/@user/video/7123456789012345678 and https://vm.tiktok.com/ZM8abc123/";
    const result = extractAndTransformVideoUrls(content, ["tiktok"]);

    expect(result).toHaveLength(2);
    expect(result[0].transformedUrl).toBe("https://tiktxk.com/@user/video/7123456789012345678");
    expect(result[1].transformedUrl).toBe("https://tiktxk.com/ZM8abc123/");
  });

  it("should transform Instagram Reel URLs to ddinstagram.com", () => {
    const content = "Reel here: https://www.instagram.com/reel/C123456789/?utm_source=ig_web_copy_link";
    const result = extractAndTransformVideoUrls(content, ["instagram"]);

    expect(result).toHaveLength(1);
    expect(result[0].transformedUrl).toContain("ddinstagram.com/reel/C123456789/");
  });

  it("should transform Reddit video post URLs to rxddit.com", () => {
    const content = "Reddit clip: https://www.reddit.com/r/gaming/comments/17xyz/awesome_play/";
    const result = extractAndTransformVideoUrls(content, ["reddit"]);

    expect(result).toHaveLength(1);
    expect(result[0].transformedUrl).toContain("rxddit.com/r/gaming/comments/17xyz/");
  });

  it("should ignore URLs wrapped in <...> (Discord embed suppression)", () => {
    const content = "Do not fix this link: <https://twitter.com/user/status/12345> thanks";
    const result = extractAndTransformVideoUrls(content, ["twitter"]);

    expect(result).toHaveLength(0);
  });

  it("should ignore already transformed URLs", () => {
    const content = "Already converted: https://fxtwitter.com/user/status/123 and https://ddinstagram.com/reel/xyz";
    const result = extractAndTransformVideoUrls(content, ["twitter", "instagram"]);

    expect(result).toHaveLength(0);
  });

  it("should respect disabled providers", () => {
    const content = "https://twitter.com/user/status/123 and https://tiktok.com/@user/video/456";
    // Only enable tiktok
    const result = extractAndTransformVideoUrls(content, ["tiktok"]);

    expect(result).toHaveLength(1);
    expect(result[0].provider).toBe("tiktok");
  });

  it("should ignore regular unsupported URLs", () => {
    const content = "Check https://github.com and https://google.com";
    const result = extractAndTransformVideoUrls(content, ["twitter", "tiktok", "instagram", "reddit"]);

    expect(result).toHaveLength(0);
  });
});
