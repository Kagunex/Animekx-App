import { describe, expect, it } from "vitest";
import { APP_CONFIG } from "../lib/app-config";

const apiBase = APP_CONFIG.apiBaseUrl;
const supabaseUrl = APP_CONFIG.supabaseUrl;
const supabaseAnonKey = APP_CONFIG.supabaseAnonKey;

describe("Aniraku production service configuration", () => {
  it("has valid production service configuration", () => {
    expect(apiBase).toMatch(/^https:\/\//);
    expect(supabaseUrl).toMatch(/^https:\/\/[^/]+\.supabase\.co$/);
    expect(supabaseAnonKey).toBeTruthy();
  });
});
