import { supabase } from "@/lib/supabase";
import { APP_CONFIG } from "@/lib/app-config";

/**
 * Library debugging helper.
 *
 * Every Supabase read on the My List page (bookmarks, watch history,
 * notifications) funnels its failures through here so the real cause
 * (network, expired JWT, RLS, missing table, unreadable response) is
 * visible in adb logcat / metro logs instead of a bare "Could not load
 * your library." message.
 *
 * Logged values are safe to share: the user id is truncated and tokens
 * are never logged (only their presence).
 */
type DiagnosticsPayload = {
  scope: string;
  kind: "network" | "postgrest" | "auth" | "unknown";
  code?: string;
  message?: string;
  hint?: string;
  details?: string;
  table?: string;
  restUrl?: string;
  supabaseUrl: string;
  auth: {
    hasSession: boolean;
    hasAccessToken: boolean;
    tokenProvider?: string;
    sessionUserId?: string;
  };
  requestUserId?: string;
};

function maskId(id: string | null | undefined) {
  return id ? `${id.slice(0, 8)}…` : undefined;
}

function classifyError(error: unknown): DiagnosticsPayload["kind"] {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (
    error instanceof TypeError ||
    /network request|failed to fetch|internet connection|timed?\s?out|fetch failed/i.test(message)
  ) {
    return "network";
  }
  if (/jwt|token|session|401|auth/i.test(message)) return "auth";
  const code = (error as { code?: string } | undefined)?.code;
  if (typeof code === "string" && /^(PGRST|42P|425|426|23|20)/.test(code)) {
    return "postgrest";
  }
  return "unknown";
}

export async function logLibraryFailure(
  scope: string,
  error: unknown,
  context: { table?: string; userId?: string | null } = {},
) {
  const payload: Partial<DiagnosticsPayload> & Record<string, unknown> = {
    scope,
    supabaseUrl: APP_CONFIG.supabaseUrl || "(missing)",
  };
  if (context.table) {
    payload.table = context.table;
    payload.restUrl = `${(APP_CONFIG.supabaseUrl || "").replace(/\/$/, "")}/rest/v1/${context.table}`;
  }
  payload.requestUserId = maskId(context.userId);
  if (typeof error === "string") {
    payload.message = error;
  } else {
    const detail = error as
      | { message?: string; code?: string; hint?: string; details?: string }
      | undefined;
    payload.message = detail?.message;
    payload.code = detail?.code;
    payload.hint = detail?.hint;
    payload.details = detail?.details;
  }
  payload.kind = classifyError(error);
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    payload.auth = {
      hasSession: Boolean(session),
      hasAccessToken: Boolean(session?.access_token),
      tokenProvider: session?.user?.app_metadata?.provider,
      sessionUserId: maskId(session?.user?.id),
    };
    if (
      context.userId &&
      session?.user &&
      session.user.id !== context.userId
    ) {
      payload.requestUserId = `${maskId(context.userId)} (mismatch with session ${payload.auth.sessionUserId})`;
    }
  } catch (sessionError) {
    const detail = sessionError as { message?: string } | undefined;
    payload.auth = { hasSession: false, hasAccessToken: false };
    payload.code = `${payload.code ?? "-"}|session-read:${detail?.message ?? "unknown"}`;
  }
  console.warn(
    `[animekz:library] ${scope} failed — kind=${payload.kind} code=${payload.code ?? "-"}`,
    JSON.stringify(payload, null, 2),
    error,
  );
}

/**
 * UI-safe single-line explanation for the retry dialog. Matches the
 * friendlyMessage rules in async-state (network errors keep their own copy).
 */
export function libraryErrorMessage(error: unknown): string {
  const kind = classifyError(error);
  const code = (error as { code?: string } | undefined)?.code;
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (kind === "network")
    return "Could not reach the library server. Check your connection and try again.";
  if (kind === "auth" || code === "PGRST301" || /jwt|expired/i.test(message))
    return "Your session has expired. Tap retry to refresh it and reload.";
  if (code === "42501") {
    return "The server denied access to this library data. Sign out and sign in again to refresh permissions.";
  }
  if (code === "42P01" || code === "PGRST205") {
    return "The library database is not available on the server.";
  }
  return message || "Could not load your library.";
}

/**
 * Retry must actually fix the most common failure (expired access token)
 * before the request re-fires. Reads the session so supabase-js refreshes
 * the token if needed; failures are non-fatal.
 */
export async function refreshLibrarySession() {
  try {
    const { error } = await supabase.auth.getSession();
    if (error)
      void logLibraryFailure("library:session-refresh", error, {});
  } catch (sessionError) {
    void logLibraryFailure("library:session-refresh-unreadable", sessionError, {});
  }
}
