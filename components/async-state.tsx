import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { DotLabel, NothingButton, nothing } from "@/components/nothing-ui";

export function LoadingState({ label = "Memuat data anime..." }: { label?: string }) {
  return <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.loadingCard}><View style={styles.loadingMark}><View style={styles.markBack} /><View style={styles.markFront}><ActivityIndicator color="#3985F5" size="small" /></View></View><View style={styles.loadingCopy}><DotLabel tone="live">LOADING</DotLabel><Text style={styles.loadingText}>{label}</Text></View></View>;
}

export function ErrorState({ message, onRetry, retryLabel = "Coba Lagi", retryDisabled = false }: { message: string; onRetry: () => void; retryLabel?: string; retryDisabled?: boolean }) {
  const anilistOutage = /AniList is temporarily unavailable due to an upstream stability issue/i.test(message);
  const friendlyMessage = /api\.aniraku|backend|graphql|network request|failed to fetch/i.test(message) ? "Check your connection and try again." : message;
  return anilistOutage
    ? <View accessibilityRole="alert" style={[styles.container, styles.outageContainer]}><View style={styles.outageLine} /><DotLabel tone="signal">ANILIST TEMPORARILY UNAVAILABLE</DotLabel><Text style={styles.outageTitle}>Discovery is temporarily offline upstream.</Text><Text style={styles.text}>AniList has reported a stability issue. Your account and saved data are unaffected. Try again shortly; this notice clears automatically once AniList responds.</Text><NothingButton label="Coba Lagi" onPress={onRetry} variant="outline" disabled={retryDisabled} /></View>
    : <View style={styles.container}><View style={styles.errorLine} /><DotLabel tone="signal">GAGAL MEMUAT</DotLabel><Text style={styles.text}>{friendlyMessage}</Text><NothingButton label={retryLabel} onPress={onRetry} variant="outline" disabled={retryDisabled} /></View>;
}

export function EmptyState({ label, action }: { label: string; action?: { label: string; onPress: () => void } }) {
  return <View style={styles.container}><View style={styles.emptyLine} /><DotLabel>BELUM ADA DATA</DotLabel><Text style={styles.text}>{label}</Text>{action ? <NothingButton label={action.label} onPress={action.onPress} variant="outline" /> : null}</View>;
}

const styles = StyleSheet.create({
  container: { minHeight: 198, paddingVertical: 24, gap: 10, alignItems: "flex-start", justifyContent: "center" },
  loadingCard: { minHeight: 92, marginVertical: 10, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#C6DDF5", borderRadius: 18, backgroundColor: "rgba(255,255,255,0.92)", shadowColor: "#2878F0", shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.07, shadowRadius: 0, elevation: 1 },
  loadingMark: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  markBack: { position: "absolute", width: 40, height: 40, borderRadius: 12, backgroundColor: "#EAF4FF", borderWidth: 1, borderColor: "#B8D5F5", transform: [{ rotate: "-8deg" }] },
  markFront: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "rgba(255,255,255,0.92)", borderWidth: 1, borderColor: "#D7E8F9" },
  loadingCopy: { flex: 1, gap: 5 },
  loadingText: { color: "#172B45", fontSize: 14, fontWeight: "700", lineHeight: 20 },
  errorLine: { width: 24, height: 2, backgroundColor: nothing.red },
  outageContainer: { borderLeftWidth: 2, borderLeftColor: nothing.red, paddingLeft: 14 },
  outageLine: { width: 44, height: 2, backgroundColor: nothing.red },
  outageTitle: { color: nothing.white, maxWidth: 300, fontSize: 17, lineHeight: 22, fontWeight: "900" },
  emptyLine: { width: 24, height: 1, backgroundColor: nothing.line },
  text: { color: nothing.muted, maxWidth: 290, fontSize: 13, lineHeight: 19 },
});
