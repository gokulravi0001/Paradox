import { describe, it, expect } from "vitest";
import { hasManagePermission, DISCORD_PERMISSIONS } from "@/lib/discord";

describe("Discord Server Permission Checks", () => {
  it("should permit guild owner regardless of permissions bitfield", () => {
    expect(hasManagePermission("0", true)).toBe(true);
    expect(hasManagePermission("1048576", true)).toBe(true);
  });

  it("should permit user with ADMINISTRATOR permission (0x8)", () => {
    const adminPerm = DISCORD_PERMISSIONS.ADMINISTRATOR.toString();
    expect(hasManagePermission(adminPerm, false)).toBe(true);

    // Combined bitfield
    const combinedPerm = (
      DISCORD_PERMISSIONS.ADMINISTRATOR | DISCORD_PERMISSIONS.SEND_MESSAGES
    ).toString();
    expect(hasManagePermission(combinedPerm, false)).toBe(true);
  });

  it("should permit user with MANAGE_GUILD permission (0x20)", () => {
    const manageGuildPerm = DISCORD_PERMISSIONS.MANAGE_GUILD.toString();
    expect(hasManagePermission(manageGuildPerm, false)).toBe(true);

    const combinedPerm = (
      DISCORD_PERMISSIONS.MANAGE_GUILD | DISCORD_PERMISSIONS.VIEW_CHANNEL
    ).toString();
    expect(hasManagePermission(combinedPerm, false)).toBe(true);
  });

  it("should reject users lacking both ADMINISTRATOR and MANAGE_GUILD", () => {
    // Only SEND_MESSAGES (0x800) and VIEW_CHANNEL (0x400)
    const regularPerm = (
      DISCORD_PERMISSIONS.SEND_MESSAGES | DISCORD_PERMISSIONS.VIEW_CHANNEL
    ).toString();
    expect(hasManagePermission(regularPerm, false)).toBe(false);

    expect(hasManagePermission("0", false)).toBe(false);
  });

  it("should gracefully handle malformed permission bitstrings", () => {
    expect(hasManagePermission("not-a-number", false)).toBe(false);
    expect(hasManagePermission("", false)).toBe(false);
  });
});
