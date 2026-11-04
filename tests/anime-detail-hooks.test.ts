import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Anime Detail hook ordering", () => {
  it("creates the Relations memo before every loading or error early-return branch", () => {
    const source = readFileSync(resolve(process.cwd(), "app/anime/[id].tsx"), "utf8");
    const relationsMemo = source.indexOf("const relationGroups = useMemo(");
    const firstEarlyReturn = source.indexOf("if (invalidId)");

    expect(relationsMemo).toBeGreaterThan(-1);
    expect(firstEarlyReturn).toBeGreaterThan(-1);
    expect(relationsMemo).toBeLessThan(firstEarlyReturn);
  });

  it("keeps comments in the Details tab and the episode selector in the Episodes tab", () => {
    const source = readFileSync(resolve(process.cwd(), "app/anime/[id].tsx"), "utf8");
    const episodeSection = source.indexOf('<DotLabel>EPISODES</DotLabel>');
    const commentsSection = source.indexOf("<AnimeComments animeId={id} />");
    const detailsTab = source.indexOf('{detailTab === "details" ? (');

    expect(episodeSection).toBeGreaterThan(-1);
    expect(detailsTab).toBeGreaterThan(-1);
    expect(commentsSection).toBeGreaterThan(detailsTab);
    expect(episodeSection).toBeGreaterThan(commentsSection);
  });
});
