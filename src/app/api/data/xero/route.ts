import { NextResponse } from "next/server";
import { xero, getTokens } from "@/lib/xero-oauth";

export async function GET() {
  const tokens = getTokens();
  if (!tokens) {
    return NextResponse.json({ error: "Not authenticated with Xero", authUrl: "/api/auth/xero" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await xero.setTokenSet(tokens as any);
    await xero.updateTenants();
    const tenantId = xero.tenants[0]?.tenantId;
    if (!tenantId) throw new Error("No Xero tenant found");

    // Fetch P&L report
    const plResponse = await xero.accountingApi.getReportProfitAndLoss(tenantId);

    // Fetch balance sheet
    const bsResponse = await xero.accountingApi.getReportBalanceSheet(tenantId);

    return NextResponse.json({
      profitAndLoss: plResponse.body,
      balanceSheet: bsResponse.body,
      tenant: xero.tenants[0]?.tenantName,
    });
  } catch (error) {
    console.error("Xero data error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
