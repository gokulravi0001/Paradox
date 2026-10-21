import { describe, it, expect } from "vitest";
import { validateDiscordEmbed, DISCORD_LIMITS } from "@/lib/validations";

describe("Discord Embed Validation Rules", () => {
  it("should validate a conforming embed successfully", () => {
    const validEmbed = {
      title: "Server Rules",
      description: "Please adhere to community standards.",
      color: "#5865F2",
      authorName: "Server Staff",
      footerText: "Page 1 of 1",
      fields: [
        { name: "Rule 1", value: "Be respectful.", inline: true },
        { name: "Rule 2", value: "No spamming.", inline: true },
      ],
    };

    const result = validateDiscordEmbed(validEmbed);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.totalChars).toBeGreaterThan(0);
  });

  it("should reject embed with title exceeding 256 characters", () => {
    const invalidTitle = "A".repeat(DISCORD_LIMITS.TITLE_MAX + 1);
    const result = validateDiscordEmbed({ title: invalidTitle });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Title exceeds"))).toBe(true);
  });

  it("should reject embed with description exceeding 4096 characters", () => {
    const invalidDesc = "D".repeat(DISCORD_LIMITS.DESCRIPTION_MAX + 5);
    const result = validateDiscordEmbed({ description: invalidDesc });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Description exceeds"))).toBe(true);
  });

  it("should reject embed exceeding 25 fields", () => {
    const tooManyFields = Array.from({ length: 26 }, (_, i) => ({
      name: `Field ${i}`,
      value: `Value ${i}`,
    }));

    const result = validateDiscordEmbed({ fields: tooManyFields });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Total fields exceed limit"))).toBe(true);
  });

  it("should reject embed with invalid hex color", () => {
    const result = validateDiscordEmbed({
      title: "Test",
      color: "not-a-color",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("valid hex code"))).toBe(true);
  });

  it("should reject embed where total character sum exceeds 6000", () => {
    // 3 fields each 1000 chars, description 3100 chars -> > 6000 chars
    const result = validateDiscordEmbed({
      description: "X".repeat(3100),
      fields: [
        { name: "F1", value: "V".repeat(1000) },
        { name: "F2", value: "V".repeat(1000) },
        { name: "F3", value: "V".repeat(1000) },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("exceeds Discord limit of 6000"))).toBe(true);
  });
});
