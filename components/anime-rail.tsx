import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import type { Anime } from "@/lib/types";
import { AnimeCard } from "@/components/anime-card";
import { nothing } from "@/components/nothing-ui";

export function AnimeRail({
  label,
  title,
  items,
  seeAllParams,
  light = false,
  ranked = false,
  seeAllLabel = "See all",
  showSeeAllIcon = false,
}: {
  label: string;
  title: string;
  items: Anime[];
  seeAllParams?: Record<string, string>;
  light?: boolean;
  ranked?: boolean;
  seeAllLabel?: string;
  showSeeAllIcon?: boolean;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          <Text
            style={[styles.title, light && styles.titleLight]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${title} catalog`}
          accessibilityHint="Double tap to browse the full catalog"
          onPress={() => {
            if (seeAllParams)
              router.push({
                pathname: "/search",
                params: seeAllParams,
              } as never);
            else router.push("/catalog" as never);
          }}
          style={({ pressed }) => [
            styles.browse,
            light && styles.browseLight,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.browseText, light && styles.browseTextLight]}>
            {seeAllLabel}
          </Text>
          {showSeeAllIcon ? (
            <ChevronRight size={14} color="#168BFF" strokeWidth={2.4} />
          ) : null}
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <AnimeCard
            anime={item}
            light={light}
            rank={ranked ? index + 1 : undefined}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews
        accessibilityHint="Swipe to see more items"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headingCopy: { gap: 2, flex: 1, paddingRight: 12 },
  label: {
    color: nothing.primary,
    fontFamily: nothing.mono,
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: nothing.white,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  titleLight: { color: "#102B50" },
  browse: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: nothing.raised,
    borderWidth: 1,
    borderColor: nothing.line,
  },
  browseLight: { backgroundColor: "#D9EEFF", borderColor: "#D6E8FA" },
  browseTextLight: { color: "#168BFF" },
  browseText: {
    color: nothing.muted,
    fontWeight: "600",
    fontSize: 11,
  },
  pressed: nothing.pressedSubtle,
  rail: { gap: 12, paddingRight: 18 },
});
