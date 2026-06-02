import { XeroClient } from "xero-node";
import { createClient } from "@supabase/supabase-js";

export const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID!,
  clientSecret: process.env.XERO_CLIENT_SECRET!,
  redirectUris: [process.env.XERO_REDIRECT_URI || "https://c-level-hub-rho.vercel.app/api/auth/xero/callback"],
  scopes: ["openid", "profile", "email", "offline_access", "accounting.invoices.read", "accounting.contacts.read", "accounting.payments.read", "accounting.reports.balancesheet.read", "accounting.reports.profitandloss.read", "accounting.settings.read"],
});

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

export async function saveTokens(tokens: Record<string, unknown>) {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("xero_tokens").upsert({
      id: "default",
      token_data: tokens,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("Supabase saveTokens error:", error.message);
  } catch (e) {
    console.error("Failed to save tokens to Supabase:", e);
  }
}

export async function loadTokens(): Promise<Record<string, unknown> | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("xero_tokens")
      .select("token_data")
      .eq("id", "default")
      .single();
    if (error || !data) return null;
    return data.token_data as Record<string, unknown>;
  } catch {
    return null;
  }
}

// In-memory fallback (lost on restart, Supabase is the persistent store)
let memoryTokens: Record<string, unknown> | null = null;

export function setTokens(tokens: Record<string, unknown>) {
  memoryTokens = tokens;
  saveTokens(tokens).catch(console.error);
}

export function getTokens() {
  return memoryTokens;
}

export async function getValidTokens(): Promise<Record<string, unknown> | null> {
  let tokens = getTokens();
  if (!tokens) tokens = await loadTokens();
  if (!tokens) return null;

  try {
    const expiresAt = tokens.expires_at as number;
    const nowPlusFive = Math.floor(Date.now() / 1000) + 300;

    if (expiresAt && expiresAt < nowPlusFive) {
      await xero.setTokenSet(tokens as any);
      const newTokenSet = await xero.refreshToken();
      const newTokens = newTokenSet as unknown as Record<string, unknown>;
      memoryTokens = newTokens;
      await saveTokens(newTokens);
      return newTokens;
    }

    return tokens;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return tokens;
  }
}
