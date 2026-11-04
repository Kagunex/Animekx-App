import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";

import { useAnirakuAuth } from "@/providers/auth-provider";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useWatchHistory } from "@/hooks/use-watch-history";
import { useProviderSync } from "@/hooks/use-provider-sync";
import { tokenHealth } from "@/lib/provider-sync-contract";
import { deleteCurrentAccount } from "@/lib/account";
import { checkForAnimeKzUpdate, type AppRelease } from "@/lib/app-update";
import { downloadAndInstallAnimeKzUpdate } from "@/lib/android-app-installer";
import { AppIcon } from "@/components/app-icon";
import { Toggle } from "@/components/toggle";
import {
  PROVIDER_LABELS,
  ProviderMark,
  type SyncProvider,
} from "@/components/provider-mark";
import { useNsfwPreference } from "@/lib/nsfw-preference";
import { DotLabel, nothing, Signal } from "@/components/nothing-ui";
import { NativeScreen } from "@/components/screen";
import { t } from "@/lib/i18n";
import { AnimeKzLogoMark } from "@/components/animekz-logo";
import { useTheme, type ThemeMode } from "@/providers/theme-provider";

function resultSummary(
  result: {
    imported?: number;
    already?: number;
    exported?: number;
    skipped?: number;
    limited?: boolean;
  },
  mode: "import" | "export",
) {
  if (mode === "import")
    return `${result.imported || 0} IMPORTED · ${result.already || 0} ALREADY IN LIBRARY`;
  return `${result.exported || 0} EXPORTED · ${result.skipped || 0} ALREADY SYNCED${result.limited ? " · MORE REMAIN" : ""}`;
}

export default function SettingsScreen() {
  const auth = useAnirakuAuth();
  const history = useWatchHistory();
  const bookmarks = useBookmarks();
  const sync = useProviderSync();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [availableRelease, setAvailableRelease] = useState<AppRelease | null>(
    null,
  );
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const installedVersion =
    Constants.nativeAppVersion || Constants.expoConfig?.version || "0.0.0";
  const nsfw = useNsfwPreference();
  const theme = useTheme();

  const [notifPrefs, setNotifPrefs] = useState({
    newEpisodes: true,
    commentReplies: true,
    systemAnnouncements: true,
  });

  useEffect(() => {
    AsyncStorage.getItem("aniraku.notificationprefs").then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setNotifPrefs({
            newEpisodes: parsed.newEpisodes ?? true,
            commentReplies: parsed.commentReplies ?? true,
            systemAnnouncements: parsed.systemAnnouncements ?? true,
          });
        } catch {
          /* corrupted storage — keep defaults */
        }
      }
    });
  }, []);

  const toggleNotifPref = (
    key: "newEpisodes" | "commentReplies" | "systemAnnouncements",
  ) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem("aniraku.notificationprefs", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!auth.loading && !auth.user) router.replace("/auth" as never);
  }, [auth.loading, auth.user]);

  if (auth.loading || !auth.user) {
    return (
      <NativeScreen tone="light">
        <View style={styles.redirectState}>
          <DotLabel>ACCOUNT REQUIRED</DotLabel>
          <Text style={styles.redirectTitle}>Opening account controls</Text>
          <Text style={styles.redirectCopy}>
            Settings are available after your verified Animekz session has been
            restored.
          </Text>
        </View>
      </NativeScreen>
    );
  }

  const checkForUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateMessage(null);
    setAvailableRelease(null);
    try {
      const result = await checkForAnimeKzUpdate(installedVersion, {
        force: true,
      });
      setAvailableRelease(result.available ? result.release : null);
      setUpdateMessage(
        result.available && result.release
          ? `V${result.release.version} IS READY TO INSTALL.`
          : "YOU ARE USING THE LATEST PUBLISHED BUILD.",
      );
    } catch (error) {
      setUpdateMessage(
        error instanceof Error
          ? error.message.toUpperCase()
          : "UPDATE STATUS IS UNAVAILABLE.",
      );
    } finally {
      setCheckingUpdate(false);
    }
  };

  const installAvailableRelease = async () => {
    if (!availableRelease) return;
    setInstallingUpdate(true);
    setUpdateMessage("DOWNLOADING VERIFIED APK.");
    try {
      await downloadAndInstallAnimeKzUpdate(availableRelease);
      setUpdateMessage("OPENING ANDROID INSTALLER.");
    } catch (error) {
      setUpdateMessage(
        error instanceof Error
          ? error.message.toUpperCase()
          : "THE UPDATE COULD NOT START.",
      );
    } finally {
      setInstallingUpdate(false);
    }
  };

  const connectProvider = async (provider: SyncProvider) => {
    try {
      setSyncMessage(null);
      const url = await sync.authorize.mutateAsync(provider);
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: "#F5FAFF",
        controlsColor: "#172B3A",
        showTitle: false,
      });
      setSyncMessage(
        `FINISH ${PROVIDER_LABELS[provider].toUpperCase()} APPROVAL IN BROWSER, THEN TAP REFRESH.`,
      );
    } catch (error) {
      setSyncMessage(
        error instanceof Error
          ? error.message.toUpperCase()
          : "PROVIDER CONNECTION COULD NOT START.",
      );
    }
  };

  const runTransfer = async (
    provider: SyncProvider,
    mode: "import" | "export",
  ) => {
    try {
      setSyncMessage(null);
      const result =
        mode === "import"
          ? await sync.importLibrary.mutateAsync(provider)
          : await sync.exportLibrary.mutateAsync(provider);
      setSyncMessage(resultSummary(result, mode));
    } catch (error) {
      setSyncMessage(
        error instanceof Error
          ? error.message.toUpperCase()
          : "LIBRARY TRANSFER COULD NOT COMPLETE.",
      );
    }
  };

  const clearHistory = () =>
    Alert.alert(
      "Clear watch history?",
      "This removes every synchronized history entry from your Animekz account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () =>
            void history.clear
              .mutateAsync()
              .catch((error) =>
                Alert.alert("Could not clear history", error.message),
              ),
        },
      ],
    );
  const clearBookmarks = () =>
    Alert.alert(
      "Clear saved titles?",
      "This removes every synchronized bookmark from your Animekz account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () =>
            void bookmarks.clear
              .mutateAsync()
              .catch((error) =>
                Alert.alert("Could not clear bookmarks", error.message),
              ),
        },
      ],
    );
  const deleteAccount = () =>
    Alert.alert(
      "Delete Animekz account?",
      "This permanently removes your profile, watch history, ratings, bookmarks, comments, notifications, preferences, and account. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () =>
            void deleteCurrentAccount()
              .then(() => router.replace("/(tabs)" as never))
              .catch((error) =>
                Alert.alert("Account not deleted", error.message),
              ),
        },
      ],
    );

  // Enabling adult content requires an explicit 18+ affirmation (one-time,
  // persisted). Disabling is always instant and never prompts.
  const requestNsfwChange = () => {
    if (nsfw.enabled) {
      nsfw.setEnabled(false);
      return;
    }
    if (nsfw.ageVerified) {
      nsfw.setEnabled(true);
      return;
    }
    Alert.alert(t("settings.nsfwAgeTitle"), t("settings.nsfwAgeMessage"), [
      { text: t("settings.nsfwAgeDecline"), style: "cancel" },
      {
        text: t("settings.nsfwAgeConfirm"),
        onPress: () =>
          void nsfw
            .verifyAge()
            .then(() => nsfw.setEnabled(true))
            .catch(() => {}),
      },
    ]);
  };

  return (
    <NativeScreen tone="light">
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close settings"
          onPress={() => router.back()}
          style={styles.close}
        >
          <AppIcon name="arrow-left" size={21} color={"#172B3A"} />
        </Pressable>
        <View style={styles.titleBlock}>
          <DotLabel>ACCOUNT / CONTROL ROOM</DotLabel>
          <Text style={styles.title}>{t("settings.title")}</Text>
          <Text style={styles.subtitle}>Customize your experience.</Text>
        </View>
        <AnimeKzLogoMark width={44} />
      </View>

      {/* ── Session ── */}
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <AppIcon name="account" size={18} color={"#71869A"} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>{auth.user.email}</Text>
          <Text style={styles.rowMeta}>VERIFIED SESSION</Text>
        </View>
        <Signal label="LIVE" tone="live" />
      </View>

      {/* ── Application ── */}
      <View style={styles.section}>
        <DotLabel>{t("settings.application")}</DotLabel>
      </View>
      <View style={styles.appInfoCard}>
        <AnimeKzLogoMark width={52} />
        <View style={styles.appInfoBody}>
          <Text style={styles.rowLabel}>AnimeKz v{installedVersion}</Text>
          <Text style={styles.rowMeta}>
            Build {Constants.nativeBuildVersion || "1"}
          </Text>
          <Text style={styles.rowMeta}>{updateMessage || "Up to date"}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={checkingUpdate}
          onPress={() => void checkForUpdate()}
          style={styles.rowAction}
        >
          <Text style={styles.rowActionText}>
            {checkingUpdate ? "..." : t("settings.check")}
          </Text>
        </Pressable>
      </View>
      {availableRelease ? (
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <AppIcon name="download" size={18} color={"#4BA3E8"} />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={installingUpdate}
            onPress={() => void installAvailableRelease()}
            style={styles.rowBody}
          >
            <Text style={[styles.rowLabel, { color: "#4BA3E8" }]}>
              {installingUpdate
                ? "PREPARING INSTALL"
                : `INSTALL V${availableRelease.version}`}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.section}>
        <DotLabel>APPEARANCE</DotLabel>
      </View>
      <View style={styles.appearanceRow}>
        {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
          <Pressable
            key={mode}
            accessibilityRole="button"
            accessibilityState={{ selected: theme.mode === mode }}
            onPress={() => theme.setMode(mode)}
            style={[
              styles.appearanceOption,
              theme.mode === mode && styles.appearanceOptionActive,
            ]}
          >
            <Text
              style={[
                styles.appearanceText,
                theme.mode === mode && styles.appearanceTextActive,
              ]}
            >
              {mode === "system"
                ? "System"
                : mode === "light"
                  ? "Light"
                  : "Dark"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert(
            "Language",
            "English is currently the available app language.",
          )
        }
        style={styles.row}
      >
        <View style={styles.rowIcon}>
          <AppIcon name="globe" size={18} color={"#71869A"} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>Language</Text>
        </View>
        <Text style={styles.rowMeta}>English</Text>
        <AppIcon name="chevron-right" size={18} color={"#71869A"} />
      </Pressable>

      {/* ── Content ── */}
      <View style={styles.section}>
        <DotLabel>{t("settings.content")}</DotLabel>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={requestNsfwChange}
        style={styles.row}
      >
        <View style={styles.rowIcon}>
          <AppIcon
            name="eye"
            size={18}
            color={nsfw.enabled ? "#4BA3E8" : "#71869A"}
          />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>{t("settings.nsfwContent")}</Text>
          <Text style={styles.rowMeta}>{t("settings.nsfwContentDetail")}</Text>
        </View>
        <Toggle
          enabled={nsfw.enabled}
          onToggle={requestNsfwChange}
          label={t("settings.nsfwContent")}
        />
      </Pressable>
      {nsfw.enabled ? (
        <View style={styles.row}>
          <View style={styles.rowIcon} />
          <Text style={styles.nsfwWarning}>{t("settings.nsfwWarning")}</Text>
        </View>
      ) : null}

      {/* ── Notifications ── */}
      <View style={styles.section}>
        <DotLabel>{t("settings.notifications")}</DotLabel>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => toggleNotifPref("newEpisodes")}
        style={styles.row}
      >
        <View style={styles.rowIcon}>
          <AppIcon
            name="bell"
            size={18}
            color={notifPrefs.newEpisodes ? "#4BA3E8" : "#71869A"}
          />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>{t("settings.newEpisodes")}</Text>
          <Text style={styles.rowMeta}>{t("settings.newEpisodesDetail")}</Text>
        </View>
        <Toggle
          enabled={notifPrefs.newEpisodes}
          onToggle={() => toggleNotifPref("newEpisodes")}
          label={t("settings.newEpisodes")}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => toggleNotifPref("commentReplies")}
        style={styles.row}
      >
        <View style={styles.rowIcon}>
          <AppIcon
            name="reply"
            size={18}
            color={notifPrefs.commentReplies ? "#4BA3E8" : "#71869A"}
          />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>{t("settings.commentReplies")}</Text>
          <Text style={styles.rowMeta}>
            {t("settings.commentRepliesDetail")}
          </Text>
        </View>
        <Toggle
          enabled={notifPrefs.commentReplies}
          onToggle={() => toggleNotifPref("commentReplies")}
          label={t("settings.commentReplies")}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => toggleNotifPref("systemAnnouncements")}
        style={styles.row}
      >
        <View style={styles.rowIcon}>
          <AppIcon
            name="information"
            size={18}
            color={notifPrefs.systemAnnouncements ? "#4BA3E8" : "#71869A"}
          />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>
            {t("settings.systemAnnouncements")}
          </Text>
          <Text style={styles.rowMeta}>
            {t("settings.systemAnnouncementsDetail")}
          </Text>
        </View>
        <Toggle
          enabled={notifPrefs.systemAnnouncements}
          onToggle={() => toggleNotifPref("systemAnnouncements")}
          label={t("settings.systemAnnouncements")}
        />
      </Pressable>

      {/* ── Library sync ── */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <DotLabel>{t("settings.librarySync")}</DotLabel>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSyncMessage(null);
              void sync.status.refetch();
            }}
            style={styles.refresh}
          >
            <AppIcon name="refresh" size={14} color={"#172B3A"} />
            <Text style={styles.refreshText}>{t("settings.refresh")}</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.lead}>
        The Animekz service connects your MAL and AniList libraries. Provider
        tokens never enter the app.
      </Text>

      {(["mal", "anilist"] as SyncProvider[]).map((provider) => {
        const item = sync.status.data?.[provider];
        const busy =
          sync.authorize.isPending ||
          sync.disconnect.isPending ||
          sync.importLibrary.isPending ||
          sync.exportLibrary.isPending;
        const connected = Boolean(item?.configured && item?.connected);
        return (
          <View key={provider}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <ProviderMark
                  provider={provider}
                  size={18}
                  muted={!connected}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{PROVIDER_LABELS[provider]}</Text>
                <Text style={styles.rowMeta}>
                  {connected
                    ? item?.username
                      ? `SYNCING AS ${item.username}`
                      : tokenHealth(item?.expires_at)
                    : item?.configured
                      ? "NOT CONNECTED"
                      : "NOT CONFIGURED"}
                </Text>
              </View>
              <Signal
                label={connected ? "LIVE" : "OFF"}
                tone={connected ? "live" : "muted"}
              />
            </View>
            {connected ? (
              <View style={styles.providerActions}>
                <Pressable
                  disabled={busy}
                  accessibilityRole="button"
                  onPress={() => void runTransfer(provider, "import")}
                  style={[styles.providerBtn, busy && styles.btnDisabled]}
                >
                  <Text style={styles.providerBtnText}>
                    {t("settings.import")}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={busy}
                  accessibilityRole="button"
                  onPress={() => void runTransfer(provider, "export")}
                  style={[styles.providerBtn, busy && styles.btnDisabled]}
                >
                  <Text style={styles.providerBtnText}>
                    {t("settings.export")}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={busy}
                  accessibilityRole="button"
                  onPress={() =>
                    void sync.disconnect
                      .mutateAsync(provider)
                      .then(() =>
                        setSyncMessage(
                          `${PROVIDER_LABELS[provider].toUpperCase()} DISCONNECTED.`,
                        ),
                      )
                      .catch((error) =>
                        setSyncMessage(error.message.toUpperCase()),
                      )
                  }
                  style={[
                    styles.providerBtn,
                    styles.disconnectBtn,
                    busy && styles.btnDisabled,
                  ]}
                >
                  <Text style={[styles.providerBtnText, styles.disconnectText]}>
                    {t("settings.disconnect")}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.providerActions}>
                <Pressable
                  disabled={!item?.configured || busy}
                  accessibilityRole="button"
                  onPress={() => void connectProvider(provider)}
                  style={[
                    styles.providerBtn,
                    styles.connectBtn,
                    (!item?.configured || busy) && styles.btnDisabled,
                  ]}
                >
                  <Text style={styles.connectBtnText}>
                    {busy
                      ? "OPENING LINK"
                      : `CONNECT ${PROVIDER_LABELS[provider].toUpperCase()}`}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}
      {sync.status.isPending ? (
        <Text style={styles.syncStatus}>CHECKING PROVIDER STATUS</Text>
      ) : sync.status.isError ? (
        <Text style={styles.syncError}>
          {sync.status.error instanceof Error
            ? sync.status.error.message.toUpperCase()
            : "SYNC STATUS UNAVAILABLE"}
        </Text>
      ) : null}
      {syncMessage ? (
        <Text style={styles.syncStatus}>{syncMessage}</Text>
      ) : null}
      <Text style={styles.footnote}>
        Connect in the browser while signed in, approve the provider, then
        return here and refresh.
      </Text>

      {/* ── Data ── */}
      <View style={styles.section}>
        <DotLabel>{t("settings.syncedLibrary")}</DotLabel>
      </View>
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <AppIcon name="history" size={18} color={"#71869A"} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={clearHistory}
          style={styles.rowBody}
        >
          <Text style={styles.rowLabel}>Clear watch history</Text>
          <Text style={styles.rowMeta}>
            Remove synced progress across your account
          </Text>
        </Pressable>
      </View>
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <AppIcon name="bookmark-remove-outline" size={18} color={"#71869A"} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={clearBookmarks}
          style={styles.rowBody}
        >
          <Text style={styles.rowLabel}>Clear saved titles</Text>
          <Text style={styles.rowMeta}>Remove all synced bookmarks</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert(
            "Data usage",
            "Video playback streams from your selected server and uses the device connection you choose. Lower playback quality in the player to reduce mobile data use.",
          )
        }
        style={styles.row}
      >
        <View style={styles.rowIcon}>
          <AppIcon name="download" size={18} color="#71869A" />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>Data Usage</Text>
        </View>
        <AppIcon name="chevron-right" size={18} color="#71869A" />
      </Pressable>

      {/* ── Support / Legal ── */}
      <View style={styles.section}>
        <DotLabel>{t("settings.supportLegal")}</DotLabel>
      </View>
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <AppIcon name="heart-outline" size={18} color={"#71869A"} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/support" as never)}
          style={styles.rowBody}
        >
          <Text style={styles.rowLabel}>Support Animekz</Text>
          <Text style={styles.rowMeta}>Patreon and optional USDT BEP20</Text>
        </Pressable>
      </View>
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <AppIcon name="shield" size={18} color={"#71869A"} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/legal" as never)}
          style={styles.rowBody}
        >
          <Text style={styles.rowLabel}>Privacy &amp; Security</Text>
          <Text style={styles.rowMeta}>
            Account controls and privacy details
          </Text>
        </Pressable>
        <AppIcon name="chevron-right" size={18} color="#71869A" />
      </View>
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <AppIcon name="file-document-outline" size={18} color={"#71869A"} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/legal" as never)}
          style={styles.rowBody}
        >
          <Text style={styles.rowLabel}>Legal information</Text>
          <Text style={styles.rowMeta}>
            Privacy, terms, copyright, and security
          </Text>
        </Pressable>
      </View>

      {/* ── Danger zone ── */}
      <View style={styles.section}>
        <DotLabel tone="signal">IRREVERSIBLE</DotLabel>
      </View>
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <AppIcon name="delete-forever-outline" size={18} color={"#4BA3E8"} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={deleteAccount}
          style={styles.rowBody}
        >
          <Text style={[styles.rowLabel, { color: "#4BA3E8" }]}>
            Delete account
          </Text>
          <Text style={styles.rowMeta}>
            Permanently erase your Animekz account
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert(
            "About AnimeKz",
            `AnimeKz v${installedVersion} · Build ${Constants.nativeBuildVersion || "1"}`,
          )
        }
        style={styles.row}
      >
        <View style={styles.rowIcon}>
          <AppIcon name="information" size={18} color="#71869A" />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>About AnimeKz</Text>
          <Text style={styles.rowMeta}>
            Version, build, and app information
          </Text>
        </View>
        <AppIcon name="chevron-right" size={18} color="#71869A" />
      </Pressable>
      <Text style={styles.footnote}>
        Deletion removes your synchronized data before removing your
        authentication record.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          Alert.alert("Sign out?", "You can sign in again at any time.", [
            { text: "Cancel", style: "cancel" },
            {
              text: t("settings.signOut"),
              style: "destructive",
              onPress: () =>
                void auth
                  .signOut()
                  .then(() => router.replace("/(tabs)" as never)),
            },
          ])
        }
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.btnDisabled,
        ]}
      >
        <AppIcon name="logout" size={18} color="#D92D20" />
        <Text style={styles.logoutText}>{t("settings.signOut")}</Text>
      </Pressable>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  redirectState: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 9,
  },
  redirectTitle: {
    color: "#172B3A",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  redirectCopy: {
    color: "#71869A",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 290,
  },

  top: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: 11 },
  close: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1, gap: 2 },
  subtitle: { color: "#71869A", fontSize: 13, marginTop: 2 },
  appInfoCard: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D5E7F5",
    backgroundColor: "#FFFFFF",
    shadowColor: "#172B3A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  appInfoBody: { flex: 1, gap: 3 },
  logoutButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 18,
    marginBottom: 12,
    borderRadius: 15,
    backgroundColor: "#FEF3F2",
  },
  logoutText: { color: "#D92D20", fontSize: 14, fontWeight: "800" },
  title: {
    color: "#172B3A",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.65,
  },

  section: { paddingTop: 18, paddingBottom: 4 },
  appearanceRow: { flexDirection: "row", gap: 8, paddingVertical: 6 },
  appearanceOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E7F5",
  },
  appearanceOptionActive: {
    backgroundColor: "rgba(75,163,232,0.18)",
    borderColor: nothing.primary,
  },
  appearanceText: { color: "#71869A", fontSize: 12, fontWeight: "700" },
  appearanceTextActive: { color: "#4BA3E8" },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#D5E7F5",
  },
  rowIcon: { width: 28, alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: { color: "#172B3A", fontSize: 14, fontWeight: "800" },
  rowMeta: { color: "#71869A", fontSize: 11, lineHeight: 15 },
  rowAction: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D5E7F5",
    borderRadius: 12,
    backgroundColor: "#EAF5FF",
  },
  rowActionText: {
    color: "#172B3A",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  lead: {
    color: "#71869A",
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  footnote: {
    color: "#71869A",
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
  },

  refresh: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#D5E7F5",
    borderRadius: 4,
  },
  refreshText: {
    color: "#172B3A",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  providerActions: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 40,
    paddingBottom: 10,
  },
  providerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#D5E7F5",
    borderRadius: 4,
  },
  providerBtnText: {
    color: "#172B3A",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  connectBtn: { backgroundColor: "#EAF5FF", borderColor: "#D5E7F5" },
  connectBtnText: {
    color: "#172B3A",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  disconnectBtn: { borderColor: "rgba(255,77,77,0.4)" },
  disconnectText: { color: "#4BA3E8" },
  btnDisabled: { opacity: 0.4 },

  syncStatus: {
    color: "#172B3A",
    fontWeight: "800",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.3,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  syncError: {
    color: "#4BA3E8",
    fontWeight: "800",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.3,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },

  nsfwWarning: {
    flex: 1,
    color: "#4BA3E8",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
});
