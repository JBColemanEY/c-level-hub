import { NextRequest, NextResponse } from "next/server";
import { xero, saveTokens } from "@/lib/xero-oauth";

export async function GET(req: NextRequest) {
  const url = req.url;
  try {
    const tokenSet = await xero.apiCallback(url);
    await saveTokens(tokenSet as unknown as Record<string, unknown>);
    await xero.updateTenants();
    return NextResponse.redirect(new URL("/finance?xero=connected", req.url));
  } catch (error) {
    console.error("Xero callback error:", error);
    return NextResponse.redirect(new URL("/finance?xero=error", req.url));
  }
}
