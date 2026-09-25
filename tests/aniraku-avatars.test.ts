import { describe, expect, it } from "vitest";
import { ANIRAKU_AVATARS, avatarUrl, defaultAvatar } from "../lib/aniraku-avatars";

describe("Aniraku main avatar library", () => {
  it("uses the public Anixen Avatars Supabase bucket", () => {
    expect(ANIRAKU_AVATARS).toHaveLength(27);

    expect(ANIRAKU_AVATARS[0].url).toContain(
      "/storage/v1/object/public/Anixen%20Avatars/01.png"
    );

    expect(avatarUrl("vegeta.png")).toBe(
      ANIRAKU_AVATARS.find((avatar) => avatar.name === "vegeta.png")?.url
    );
  });

  it("provides a deterministic non-empty fallback avatar for every profile seed", () => {
    expect(defaultAvatar(65)).toEqual(defaultAvatar(65));
    expect(defaultAvatar(-1).url).toMatch(/^https:\/\//);
  });
});
