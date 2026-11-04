import AsyncStorage from "@react-native-async-storage/async-storage";

export const ANIMEKZ_GITHUB_REPO = "Kagunex/Animekx-App";
export const ANIMEKZ_LATEST_RELEASE_URL =
  `https://api.github.com/repos/${ANIMEKZ_GITHUB_REPO}/releases/latest`;

// v2 deliberately abandons cached release metadata from the old Aniraku repo.
export const UPDATE_CHECK_CACHE_KEY =
  "animekz.update.latest-release.v2";

export const UPDATE_CHECK_TTL_MS = 12 * 60 * 60 * 1000;

export type AppRelease = {
  version: string;
  name: string;
  releaseUrl: string;
  downloadUrl: string;
  assetName: string;
  assetSize: number;
  publishedAt?: string;
};

type CachedRelease = {
  fetchedAt: number;
  release: AppRelease;
};

const RELEASE_TAG = /^v(\d+\.\d+\.\d+)$/;
const APK_ASSET = /^animekx-v(\d+\.\d+\.\d+)-(universal|arm64|arm32)\.apk$/i;

export function normalizeVersion(value?: string | null) {
  const match = String(value ?? "").trim().match(/^v?(\d+\.\d+\.\d+)$/i);
  return match?.[1] ?? "0.0.0";
}

export function compareVersions(
  left?: string | null,
  right?: string | null,
) {
  const a = normalizeVersion(left).split(".").map(Number);
  const b = normalizeVersion(right).split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }

  return 0;
}

function trustedReleaseUrl(value: string, version: string) {
  try {
    const url = new URL(value);
    return url.origin === "https://github.com" &&
      url.pathname === `/${ANIMEKZ_GITHUB_REPO}/releases/tag/v${version}`;
  } catch {
    return false;
  }
}

function trustedDownloadUrl(value: string, assetName: string, version: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.origin === "https://github.com" &&
      url.pathname === `/${ANIMEKZ_GITHUB_REPO}/releases/download/v${version}/${assetName}`;
  } catch {
    return false;
  }
}

export function trustedAnimeKzApkAsset(
  value: unknown,
  expectedVersion?: string,
) {
  const asset = value as {
    name?: unknown;
    size?: unknown;
    browser_download_url?: unknown;
    content_type?: unknown;
  } | null;

  const name = typeof asset?.name === "string" ? asset.name.trim() : "";
  const size = Number(asset?.size);
  const downloadUrl = typeof asset?.browser_download_url === "string"
    ? asset.browser_download_url.trim()
    : "";
  const assetMatch = name.match(APK_ASSET);
  const version = assetMatch?.[1] ?? "";
  const expected = expectedVersion ? normalizeVersion(expectedVersion) : null;
  const isAndroidPackage = !asset?.content_type ||
    asset.content_type === "application/vnd.android.package-archive" ||
    asset.content_type === "application/octet-stream";

  return version !== "" &&
    (expected === null || version === expected) &&
    trustedDownloadUrl(downloadUrl, name, version) &&
    isAndroidPackage &&
    Number.isSafeInteger(size) &&
    size > 0
    ? { name, size, downloadUrl }
    : null;
}

function isTrustedAnimeKzRelease(value: unknown): value is AppRelease {
  const release = value as Partial<AppRelease> | null;
  const version = normalizeVersion(release?.version);
  if (!release || version === "0.0.0" || version !== release.version) return false;

  const trustedAsset = trustedAnimeKzApkAsset({
    name: release.assetName,
    size: release.assetSize,
    browser_download_url: release.downloadUrl,
  }, version);

  return Boolean(
    trustedAsset &&
    trustedReleaseUrl(String(release.releaseUrl ?? ""), version) &&
    trustedAsset.name === release.assetName &&
    trustedAsset.size === release.assetSize &&
    typeof release.name === "string" &&
    release.name.length > 0,
  );
}

export function parseGitHubRelease(payload: unknown): AppRelease | null {
  const record = payload as {
    tag_name?: unknown;
    name?: unknown;
    html_url?: unknown;
    published_at?: unknown;
    assets?: unknown;
  } | null;

  const tag = typeof record?.tag_name === "string" ? record.tag_name.trim() : "";
  const version = tag.match(RELEASE_TAG)?.[1] ?? "";
  const releaseUrl = typeof record?.html_url === "string" ? record.html_url.trim() : "";
  const assets = Array.isArray(record?.assets)
    ? record.assets
        .map((asset) => trustedAnimeKzApkAsset(asset, version))
        .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset))
    : [];
  const preferredAsset = assets.find((asset) => /-universal\.apk$/i.test(asset.name)) ?? assets[0];

  if (
    !version ||
    !trustedReleaseUrl(releaseUrl, version) ||
    !preferredAsset
  ) {
    return null;
  }

  const release: AppRelease = {
    version,
    name: `AnimeKz v${version}`,
    releaseUrl,
    downloadUrl: preferredAsset.downloadUrl,
    assetName: preferredAsset.name,
    assetSize: preferredAsset.size,
    publishedAt: typeof record?.published_at === "string" ? record.published_at : undefined,
  };

  return isTrustedAnimeKzRelease(release) ? release : null;
}

export function isReleaseNewer(
  installedVersion?: string | null,
  releaseVersion?: string | null,
) {
  return compareVersions(releaseVersion, installedVersion) > 0;
}

export function updateDismissalKey(releaseVersion: string) {
  return `animekz.update.dismissed:${normalizeVersion(releaseVersion)}`;
}

export async function getLatestAnimeKzRelease(options?: {
  force?: boolean;
  fetcher?: typeof fetch;
  now?: number;
}): Promise<AppRelease | null> {
  const now = options?.now ?? Date.now();

  if (!options?.force) {
    const cached = await AsyncStorage.getItem(UPDATE_CHECK_CACHE_KEY).catch(() => null);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CachedRelease;
        const cacheAge = now - parsed.fetchedAt;
        if (
          Number.isFinite(parsed.fetchedAt) &&
          cacheAge >= 0 &&
          cacheAge < UPDATE_CHECK_TTL_MS &&
          isTrustedAnimeKzRelease(parsed.release)
        ) {
          return parsed.release;
        }
      } catch {
        // Invalid or stale cache entries are ignored and replaced by GitHub.
      }
    }
  }

  const response = await (options?.fetcher ?? fetch)(ANIMEKZ_LATEST_RELEASE_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!response.ok) {
    throw new Error("AnimeKz update information is unavailable right now.");
  }

  const release = parseGitHubRelease(await response.json());
  if (release) {
    void AsyncStorage.setItem(
      UPDATE_CHECK_CACHE_KEY,
      JSON.stringify({ fetchedAt: now, release }),
    ).catch(() => {});
  }

  return release;
}

export async function checkForAnimeKzUpdate(
  installedVersion: string,
  options?: {
    force?: boolean;
    fetcher?: typeof fetch;
    now?: number;
  },
) {
  const release = await getLatestAnimeKzRelease(options);
  return {
    release,
    available: Boolean(release && isReleaseNewer(installedVersion, release.version)),
  };
}
