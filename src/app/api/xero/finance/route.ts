import { NextResponse } from "next/server";

// This endpoint returns the latest Xero snapshot.
// In production, connect this to your Xero MCP bridge or Xero API OAuth flow.
// For now it returns the seeded live data pulled at build/start time.
export async function GET() {
  return NextResponse.json({
    org_name: "Entity Y",
    currency: "ZAR",
    last_refreshed: new Date().toISOString(),
    position: {
      snapshot_date: "2026-05-31",
      total_assets: 2526928.72,
      total_liabilities: 2112203.19,
      net_equity: 414725.53,
      cash_balance: 1243823.51,
      current_assets: 1283105.21,
      current_liabilities: 2142262.93,
    },
    pnl: {
      period: { start_date: "2026-04-30", end_date: "2026-05-30" },
      total_income: 349326.32,
      total_expenses: 351522.23,
      gross_profit: 349326.32,
      net_profit: -2195.91,
      income_accounts: [
        { account_name: "Sales", current_balance: 0, comparison_balance: 291403.73 },
        { account_name: "Other Revenue", current_balance: 0, comparison_balance: 57922.59 },
      ],
      expense_accounts: [
        { account_name: "Advertising", current_balance: 0, comparison_balance: 75267.77 },
        { account_name: "Entertainment", current_balance: 0, comparison_balance: 3205.28 },
        { account_name: "Accounting fees", current_balance: 0, comparison_balance: 3500 },
        { account_name: "Medical expenses", current_balance: 0, comparison_balance: 2252.17 },
        { account_name: "Bank Fees", current_balance: 0, comparison_balance: 2181.84 },
      ],
    },
    cash: {
      snapshot_date: "2026-05-31",
      cash_balance: 1243823.51,
      amount_owed: 1283105.21,
      amount_due: 0,
      working_capital: 384665.79,
    },
  });
}
