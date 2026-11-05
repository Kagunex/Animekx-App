import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAnirakuAuth } from "@/providers/auth-provider";
import { useWatchStats } from "@/hooks/use-watch-stats";
import { useBookmarks } from "@/hooks/use-bookmarks";
import {
  ANIRAKU_AVATARS,
  avatarUrl,
  defaultAvatar,
} from "@/lib/aniraku-avatars";
import { AvatarImage } from "@/components/avatar-image";
import {
  DotLabel,
  NothingButton,
  nothing,
  Signal,
} from "@/components/nothing-ui";
import { AnimeKzLogoMark } from "@/components/animekz-logo";
import { NativeScreen } from "@/components/screen";
import { AppIcon } from "@/components/app-icon";
import { ProfileSkeleton } from "@/components/skeleton";

function ProfileHeader() {
  return (
    <View style={styles.profileHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={styles.headerButton}
      >
        <AppIcon name="arrow-left" size={20} color="#172B3A" />
      </Pressable>
      <View style={styles.headerCopy}>
        <DotLabel tone="muted">ANIMEKZ ACCOUNT</DotLabel>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Settings"
        onPress={() => router.push("/settings" as never)}
        style={styles.headerButton}
      >
        <AppIcon name="cog-outline" size={20} color="#172B3A" />
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const auth = useAnirakuAuth();
  const stats = useWatchStats();
  const bookmarks = useBookmarks();
  const [showAvatars, setShowAvatars] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  if (auth.loading)
    return (
      <NativeScreen tone="light">
        <ProfileHeader />
        <ProfileSkeleton />
      </NativeScreen>
    );
  if (!auth.user)
    return (
      <NativeScreen tone="light">
        <ProfileHeader />
        <View style={styles.guestHero}>
          <AnimeKzLogoMark width={140} />
          <View style={styles.guestCopy}>
            <Text style={styles.overline}>YOUR ANIME, EVERYWHERE</Text>
            <Text style={styles.title}>Save your progress and favorites.</Text>
            <Text style={styles.copy}>
              Save favorites, continue watching, rate episodes, and keep your
              preferences on every device.
            </Text>
          </View>
          <NothingButton
            label="Sign In / Create Account"
            onPress={() => router.push("/auth" as never)}
          />
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/support" as never)}
            style={styles.guestSupportLink}
          >
            <Text style={styles.guestSupportText}>Support Animekz</Text>
          </Pressable>
        </View>
        <View style={styles.guestFoot}>
          <View style={styles.footRule} />
          <Text style={styles.footText}>
            You can browse and watch as a guest. Sign in whenever you want to
            keep your place.
          </Text>
        </View>
      </NativeScreen>
    );
  const username =
    auth.profile?.username ||
    auth.user.user_metadata?.username ||
    auth.user.email?.split("@")[0] ||
    "Animekz member";
  const displayName = auth.profile?.display_name || username;
  const avatar =
    avatarUrl(auth.profile?.avatar_url) ||
    defaultAvatar(username.charCodeAt(0)).url;
  const selected = (url: string, name: string) =>
    auth.profile?.avatar_url === url ||
    Boolean(auth.profile?.avatar_url?.endsWith(name));
  const chooseAvatar = (url: string) => {
    setAvatarMessage(null);
    void auth
      .updateProfile({ avatar_url: url })
      .then(() => setAvatarMessage("Avatar updated"))
      .catch(() => setAvatarMessage("Could not save your avatar. Try again."));
  };
  return (
    <NativeScreen tone="light">
      <View pointerEvents="none" style={styles.geoShape} />
      <ProfileHeader />
      <View style={styles.profileHero}>
        <AvatarImage uri={avatar} name={displayName} size={62} />
        <View style={styles.identity}>
          <Text style={styles.overline}>YOUR PROFILE</Text>
          <Text style={styles.title}>{displayName}</Text>
          <Text style={styles.email} numberOfLines={1}>
            @{username} · {auth.user.email}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose avatar"
          onPress={() => setShowAvatars((value) => !value)}
          style={styles.avatarEdit}
        >
          <AppIcon
            name="account-edit-outline"
            size={18}
            color={nothing.black}
          />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowAvatars((value) => !value)}
        style={[
          styles.avatarCommand,
          showAvatars && styles.avatarCommandActive,
        ]}
      >
        <View>
          <DotLabel tone={showAvatars ? "live" : "muted"}>
            PROFILE AVATAR
          </DotLabel>
          <Text style={styles.avatarCommandTitle}>Choose your avatar</Text>
          <Text style={styles.avatarCommandCopy}>
            Choose an avatar for your account.
          </Text>
        </View>
        <AppIcon
          name={showAvatars ? "chevron-up" : "chevron-down"}
          size={22}
          color={"#172B3A"}
        />
      </Pressable>
      {showAvatars ? (
        <View style={styles.avatarPanel}>
          {avatarMessage ? (
            <Text style={styles.avatarMessage}>{avatarMessage}</Text>
          ) : null}
          <View style={styles.avatarGrid}>
            {ANIRAKU_AVATARS.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Choose avatar ${item.id + 1}`}
                onPress={() => chooseAvatar(item.url)}
                style={[
                  styles.avatarChoice,
                  selected(item.url, item.name) && styles.avatarChoiceActive,
                ]}
              >
                <AvatarImage uri={item.url} name={item.name} fill />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.statsSection}>
        <DotLabel tone="signal">YOUR STATS</DotLabel>
        <Text style={styles.statsHeading}>Your anime activity</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.uniqueAnimeWatched}</Text>
            <Text style={styles.statLabel}>Anime Watched</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {bookmarks.bookmarks.data?.length ?? 0}
            </Text>
            <Text style={styles.statLabel}>My List</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
        {stats.favoriteAnime.length ? (
          <View style={styles.favSection}>
            <DotLabel>TOP ANIME</DotLabel>
            <View style={styles.favList}>
              {stats.favoriteAnime.map((item) => (
                <Pressable
                  key={item.animeId}
                  accessibilityRole="button"
                  onPress={() => router.push(`/anime/${item.animeId}` as never)}
                  style={({ pressed }) => [
                    styles.favRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.favTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.favMeta}>{item.episodes} EP watched</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>
      <View style={styles.commandGrid}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/library" as never)}
          style={({ pressed }) => [styles.command, pressed && styles.pressed]}
        >
          <AppIcon
            name="bookmark-multiple-outline"
            size={24}
            color={"#172B3A"}
          />
          <Text style={styles.commandTitle}>Library</Text>
          <Text style={styles.commandCopy}>History, saved anime, alerts</Text>
          <View style={styles.commandArrow}>
            <AppIcon name="arrow-top-right" size={18} color="#4BA3E8" />
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/settings" as never)}
          style={({ pressed }) => [styles.command, pressed && styles.pressed]}
        >
          <AppIcon name="cog-outline" size={24} color={"#172B3A"} />
          <Text style={styles.commandTitle}>Settings</Text>
          <Text style={styles.commandCopy}>Account and playback</Text>
          <View style={styles.commandArrow}>
            <AppIcon name="arrow-top-right" size={18} color="#4BA3E8" />
          </View>
        </Pressable>
      </View>
      <View style={styles.profileActions}>
        <Pressable
          onPress={() => setShowAvatars(true)}
          style={styles.profileAction}
        >
          <AppIcon name="account-edit-outline" size={18} color="#4BA3E8" />
          <Text style={styles.profileActionLabel}>Edit Profile</Text>
          <AppIcon name="chevron-right" size={18} color="#71869A" />
        </Pressable>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/auth",
              params: { mode: "forgot" },
            } as never)
          }
          style={styles.profileAction}
        >
          <AppIcon name="lock" size={18} color="#4BA3E8" />
          <Text style={styles.profileActionLabel}>Change Password</Text>
          <AppIcon name="chevron-right" size={18} color="#71869A" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/settings" as never)}
          style={styles.profileAction}
        >
          <AppIcon name="link-variant" size={18} color="#4BA3E8" />
          <Text style={styles.profileActionLabel}>Linked Accounts</Text>
          <AppIcon name="chevron-right" size={18} color="#71869A" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/support" as never)}
          style={styles.profileAction}
        >
          <AppIcon name="heart-outline" size={18} color="#4BA3E8" />
          <Text style={styles.profileActionLabel}>Help &amp; Support</Text>
          <AppIcon name="chevron-right" size={18} color="#71869A" />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/support" as never)}
        style={({ pressed }) => [
          styles.supportCommand,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.supportIcon}>
          <AppIcon name="heart-outline" size={21} color={nothing.black} />
        </View>
        <View style={styles.supportCopy}>
          <DotLabel tone="signal">COMMUNITY SUPPORT</DotLabel>
          <Text style={styles.supportTitle}>Support Me</Text>
          <Text style={styles.supportDetail}>
            Patreon and optional USDT BEP20
          </Text>
        </View>
        <AppIcon name="chevron-right" size={22} color={"#172B3A"} />
      </Pressable>
      <View style={styles.syncFoot}>
        <Signal label="UP TO DATE" tone="live" />
        <Text style={styles.copy}>
          Your saved anime and progress are ready wherever you sign in.
        </Text>
      </View>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E7F5",
  },
  headerCopy: { flex: 1, gap: 2 },
  headerTitle: { color: "#172B3A", fontSize: 24, fontWeight: "900" },
  geoShape: {
    position: "absolute",
    top: 98,
    right: -140,
    width: 300,
    height: 75,
    borderRadius: 38,
    backgroundColor: "rgba(115,184,255,0.10)",
    transform: [{ rotate: "-28deg" }],
  },
  profileActions: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D5E7F5",
    paddingHorizontal: 14,
    marginTop: 14,
  },
  profileAction: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#EAF5FF",
  },
  profileActionLabel: {
    flex: 1,
    color: "#172B3A",
    fontSize: 13,
    fontWeight: "700",
  },
  guestHero: {
    minHeight: 342,
    paddingVertical: 12,
    justifyContent: "space-between",
    gap: 18,
  },
  guestCopy: { gap: 9 },
  overline: {
    color: "#4BA3E8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    color: "#172B3A",
    fontSize: 29,
    fontWeight: "900",
    lineHeight: 34,
    letterSpacing: -0.9,
  },
  copy: { color: "#71869A", fontSize: 13, lineHeight: 19 },
  guestSupportLink: { minHeight: 30, justifyContent: "center" },
  guestSupportText: { color: "#71869A", fontSize: 13, fontWeight: "700" },
  guestFoot: { gap: 8 },
  footRule: { height: 1, backgroundColor: "#D5E7F5" },
  footText: { color: "#71869A", fontSize: 12, lineHeight: 18, maxWidth: 285 },
  profileHero: {
    minHeight: 132,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#D5E7F5",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#EAF5FF",
  },
  identity: { flex: 1, gap: 6 },
  email: { color: "#71869A", fontSize: 12 },
  avatarEdit: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF5FF",
    borderRadius: 19,
  },
  avatarCommand: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E7F5",
    borderBottomColor: "#D5E7F5",
  },
  avatarCommandActive: { borderBottomColor: "#4BA3E8" },
  avatarCommandTitle: {
    marginTop: 4,
    color: "#172B3A",
    fontSize: 16,
    fontWeight: "900",
  },
  avatarCommandCopy: { marginTop: 3, color: "#71869A", fontSize: 11 },
  avatarPanel: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E7F5",
    borderBottomColor: "#D5E7F5",
  },
  avatarMessage: {
    marginBottom: 10,
    color: "#4BA3E8",
    fontSize: 10,
    fontWeight: "800",
  },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  avatarChoice: {
    width: "20%",
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#EAF5FF",
  },
  avatarChoiceActive: { borderColor: "#4BA3E8" },
  avatarImage: { width: "100%", height: "100%" },
  statsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D5E7F5",
    gap: 12,
  },
  statsHeading: {
    color: "#172B3A",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1,
    minWidth: "29%",
    paddingVertical: 14,
    paddingHorizontal: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D5E7F5",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: "#172B3A",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  statLabel: {
    color: "#71869A",
    fontFamily: nothing.mono,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  favSection: { gap: 8, marginTop: 4 },
  favList: { gap: 0 },
  favRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D5E7F5",
  },
  favTitle: { flex: 1, color: "#172B3A", fontSize: 13, fontWeight: "800" },
  favMeta: {
    color: "#71869A",
    fontFamily: nothing.mono,
    fontSize: 10,
    fontWeight: "700",
  },
  commandGrid: { flexDirection: "row", gap: 12 },
  command: {
    flex: 1,
    minHeight: 142,
    padding: 14,
    justifyContent: "flex-end",
    gap: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D5E7F5",
    backgroundColor: "#FFFFFF",
    shadowColor: "#172B3A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  commandTitle: { color: "#172B3A", fontSize: 18, fontWeight: "900" },
  commandCopy: { color: "#71869A", fontSize: 11, lineHeight: 15 },
  commandArrow: { position: "absolute", top: 11, right: 11 },
  supportCommand: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E7F5",
  },
  supportIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#EAF5FF",
  },
  supportCopy: { flex: 1, gap: 3 },
  supportTitle: { color: "#172B3A", fontSize: 16, fontWeight: "900" },
  supportDetail: { color: "#71869A", fontSize: 11 },
  syncFoot: { gap: 7 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
