// Xero OAuth helper — token management
import { XeroClient } from "xero-node";

export const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID!,
  clientSecret: process.env.XERO_CLIENT_SECRET!,
  redirectUris: [process.env.XERO_REDIRECT_URI || "https://c-level-hub-rho.vercel.app/api/auth/xero/callback"],
  scopes: ["openid", "profile", "email", "offline_access", "accounting.invoices.read", "accounting.contacts.read", "accounting.payments.read", "accounting.reports.balancesheet.read", "accounting.reports.profitandloss.read", "accounting.settings.read"],
});

// Token store — in production use a DB; for now use env/memory
let tokenSet: Record<string, unknown> | null = null;

export function setTokens(tokens: Record<string, unknown>) {
  tokenSet = tokens;
}

export function getTokens() {
  return tokenSet;
}
