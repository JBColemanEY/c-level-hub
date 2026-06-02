// Initiates Xero OAuth flow
import { NextResponse } from "next/server";
import { xero } from "@/lib/xero-oauth";

export async function GET() {
  const consentUrl = await xero.buildConsentUrl();
  return NextResponse.redirect(consentUrl);
}
