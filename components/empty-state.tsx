import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { nothing } from "@/components/nothing-ui";

type Props = {
  icon?: string;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ icon = "movie-open-outline", title, message, action }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <AppIcon name={icon as any} size={28} color={nothing.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <Text style={styles.btnText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon="magnify"
      title="Tidak ditemukan"
      message={`Tidak ada hasil untuk "${query}". Coba kata kunci lain atau jelajahi genre.`}
    />
  );
}

export function EmptyEpisodes() {
  return (
    <EmptyState
      icon="play"
      title="Belum ada episode"
      message="Episode akan muncul di sini setelah tersedia. Cek lagi nanti!"
    />
  );
}

export function EmptyLibrary() {
  return (
    <EmptyState
      icon="bookmark"
      title="Library masih kosong"
      message="Simpan anime favorit ke library untuk melacak apa yang kamu suka."
    />
  );
}

export function EmptyHistory() {
  return (
    <EmptyState
      icon="history"
      title="Belum ada riwayat"
      message="Mulai menonton anime untuk membangun riwayat di sini."
    />
  );
}

export function EmptySchedule() {
  return (
    <EmptyState
      icon="calendar"
      title="Tidak ada tayangan hari ini"
      message="Tidak ada episode terjadwal hari ini. Cek hari lain atau temukan anime baru."
    />
  );
}

export function EmptyComments() {
  return (
    <View style={styles.compact}>
      <AppIcon name="comment-outline" size={20} color={nothing.dim} />
      <Text style={styles.compactText}>Belum ada komentar. Mulai percakapan!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,122,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,122,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: {
    color: nothing.white,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  message: {
    color: nothing.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 280,
  },
  btn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: nothing.primary,
  },
  btnText: { color: nothing.white, fontSize: 13, fontWeight: "700" },
  pressed: nothing.pressed,
  compact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  compactText: { color: nothing.dim, fontSize: 12, fontWeight: "600" },
});
