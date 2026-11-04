import { describe, expect, it } from "vitest";
import { ANIMEKZ_LATEST_RELEASE_URL, compareVersions, isReleaseNewer, normalizeVersion, parseGitHubRelease, trustedAnimeKzApkAsset, updateDismissalKey } from "../lib/app-update";

describe("AnimeKz direct-distribution update logic", () => {
  it("normalizes and compares release tags without treating a suffix as a newer build", () => {
    expect(normalizeVersion("v1.0.1")).toBe("1.0.1");
    expect(normalizeVersion("v5.8.10 — unrelated app")).toBe("0.0.0");
    expect(normalizeVersion("v5.8.10.2")).toBe("0.0.0");
    expect(compareVersions("1.0.1", "1.0.0")).toBe(1);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
    expect(isReleaseNewer("1.0.0", "v1.0.1")).toBe(true);
    expect(isReleaseNewer("1.0.0", "v1.0.0")).toBe(false);
    expect(isReleaseNewer("1.0.1", "v1.0.0")).toBe(false);
  });

  it("uses the AnimeKz repo and only accepts matching APK assets from its release", () => {
    expect(ANIMEKZ_LATEST_RELEASE_URL).toBe("https://api.github.com/repos/Kagunex/Animekx-App/releases/latest");
    const asset = { name: "animekx-v1.0.1-universal.apk", size: 88_000_000, content_type: "application/vnd.android.package-archive", browser_download_url: "https://github.com/Kagunex/Animekx-App/releases/download/v1.0.1/animekx-v1.0.1-universal.apk" };
    expect(trustedAnimeKzApkAsset(asset, "1.0.1")).toMatchObject({ name: "animekx-v1.0.1-universal.apk", size: 88_000_000 });
    expect(trustedAnimeKzApkAsset({ ...asset, browser_download_url: "https://example.com/animekx-v1.0.1-universal.apk" }, "1.0.1")).toBeNull();
    expect(trustedAnimeKzApkAsset({ ...asset, name: "aniraku-v1.0.1-universal.apk" }, "1.0.1")).toBeNull();
    expect(trustedAnimeKzApkAsset({ ...asset, name: "animekx-v1.0.0-universal.apk" }, "1.0.1")).toBeNull();
    expect(parseGitHubRelease({ tag_name: "v1.0.1", name: "AnimeKz v1.0.1", html_url: "https://github.com/Kagunex/Animekx-App/releases/tag/v1.0.1", assets: [asset] })).toMatchObject({ version: "1.0.1", assetName: "animekx-v1.0.1-universal.apk", name: "AnimeKz v1.0.1" });
    expect(parseGitHubRelease({ tag_name: "v5.8.10.2", html_url: "https://github.com/Aniraku/Aniraku-App/releases/tag/v5.8.10.2", assets: [asset] })).toBeNull();
    expect(parseGitHubRelease({ tag_name: "v1.0.1" })).toBeNull();
    expect(updateDismissalKey("v1.0.1")).toBe("animekz.update.dismissed:1.0.1");
  });
});
