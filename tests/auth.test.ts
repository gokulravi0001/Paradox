import { describe, it, expect } from "vitest";
import { signSession, verifySession, generateOAuthState } from "@/lib/auth";

describe("Authentication & Session Security", () => {
  it("should generate cryptographically random state strings", () => {
    const state1 = generateOAuthState();
    const state2 = generateOAuthState();

    expect(state1).toHaveLength(48); // 24 bytes in hex
    expect(state2).toHaveLength(48);
    expect(state1).not.toBe(state2);
  });

  it("should sign and verify valid user session JWTs", () => {
    const mockUser = {
      id: "987654321098765432",
      username: "ServerAdmin",
      discriminator: "0001",
      avatar: "abcdef123456",
      accessToken: "mock_discord_access_token_xyz",
    };

    const token = signSession(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = verifySession(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.user.id).toBe(mockUser.id);
    expect(decoded?.user.username).toBe(mockUser.username);
  });

  it("should reject tampered or invalid JWT session tokens", () => {
    expect(verifySession("invalid.token.payload")).toBeNull();
    expect(verifySession("")).toBeNull();
  });
});
