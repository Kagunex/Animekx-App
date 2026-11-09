import type { Anime } from "@/lib/types";

/**
 * Image resolution system for Animekz.
 *
 * Every anime owns exactly two artworks sourced from the data provider:
 * - posterImage: portrait cover used for rails, cards and the detail info card.
 * - bannerImage: landscape artwork used by Trending hero and Detail background.
 *
 * Resolvers always key off the anime object itself (matched by anime id via
 * the query layer), never array positions, so artwork can never be swapped
 * between titles.
 */
export function posterImageOf(
  anime: Pick<Anime, "coverImage"> | undefined | null,
): string {
  if (!anime?.coverImage) return "";
  return anime.coverImage.extraLarge || anime.coverImage.large || "";
}

export function bannerImageOf(
  anime: Pick<Anime, "bannerImage"> | undefined | null,
): string {
  return anime?.bannerImage || "";
}

/**
 * Landscape artwork with a safe fallback: if the provider only ships a
 * portrait poster, the caller can fall back to the SAME anime's poster
 * (rendered blurred or contained, never as a full-bleed stretched crop).
 */
export function landscapeArtworkOf(anime: Anime | undefined | null): string {
  return bannerImageOf(anime) || posterImageOf(anime);
}

export function animeStatusChipLabel(
  anime: Pick<Anime, "status"> | undefined | null,
): string | null {
  const status = anime?.status;
  if (status === "RELEASING") return "Ongoing";
  if (status === "FINISHED") return "Completed";
  if (status === "NOT_YET_RELEASED") return "Upcoming";
  return status ? status.replace(/_/g, " ") : null;
}
