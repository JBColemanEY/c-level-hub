import { NextResponse } from "next/server";
import { xero, getValidTokens } from "@/lib/xero-oauth";
import { getSheetData } from "@/lib/google-sheets";

// ── Fallback hardcoded data ──────────────────────────────────────────────────
const FALLBACK = {
  cashBalance: 1240000,
  mrrBase: 359000,
  activeRetainers: 19,
  ytdRevenue: 1720000,
  ytdTarget: 2030000,
  mayRevenue: 359000,
  mayExpenses: 250944,
  mayProfit: 108056,
  workingCapital: 384000,
  currentRatio: 0.60,
  totalOverdue: 1250000,
};

function safeNum(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

// ── Xero P&L row types ────────────────────────────────────────────────────────
interface XeroCell {
  value?: string | number;
  attributes?: Array<{ value?: string; id?: string }>;
}
interface XeroRow {
  rowType?: string;
  title?: string;
  cells?: XeroCell[];
  rows?: XeroRow[];
}

function flattenRows(rows: XeroRow[]): XeroRow[] {
  const result: XeroRow[] = [];
  for (const row of rows) {
    result.push(row);
    if (row.rows) result.push(...flattenRows(row.rows));
  }
  return result;
}

function findCellValue(rows: XeroRow[], titleMatch: string, colIndex = 1): number {
  for (const row of rows) {
    if (row.cells && String(row.cells[0]?.value ?? "").trim() === titleMatch) {
      return safeNum(row.cells[colIndex]?.value);
    }
  }
  return 0;
}

// Parse P&L report — returns per-column revenue/expenses/profit and header months
function parsePnLReport(report: any): {
  headers: string[];
  revenue: number[];
  expenses: number[];
  profit: number[];
} {
  const rows: XeroRow[] = report?.rows ?? [];
  const headers: string[] = [];
  const revenue: number[] = [];
  const expenses: number[] = [];
  const profit: number[] = [];

  // First row is Header with column names
  const headerRow = rows.find((r) => r.rowType === "Header");
  if (headerRow?.cells) {
    for (let i = 1; i < headerRow.cells.length; i++) {
      headers.push(String(headerRow.cells[i]?.value ?? ""));
    }
  }

  const numCols = headers.length;
  for (let i = 0; i < numCols; i++) {
    revenue.push(0);
    expenses.push(0);
    profit.push(0);
  }

  // Walk all rows recursively to find summary rows
  const flat = flattenRows(rows);
  for (const row of flat) {
    if (!row.cells || row.cells.length === 0) continue;
    const label = String(row.cells[0]?.value ?? "").trim();

    if (label === "Total Income" || label === "Total Trading Income") {
      for (let i = 0; i < numCols; i++) {
        revenue[i] = safeNum(row.cells[i + 1]?.value);
      }
    }
    if (label === "Total Operating Expenses" || label === "Total Less Operating Expenses") {
      for (let i = 0; i < numCols; i++) {
        expenses[i] = Math.abs(safeNum(row.cells[i + 1]?.value));
      }
    }
    if (label === "Net Profit" || label === "Net Loss") {
      for (let i = 0; i < numCols; i++) {
        profit[i] = safeNum(row.cells[i + 1]?.value);
      }
    }
  }

  return { headers, revenue, expenses, profit };
}

// Parse Balance Sheet — extract cash, assets, liabilities
function parseBalanceSheet(report: any): {
  cashBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  currentAssets: number;
  currentLiabilities: number;
} {
  const rows: XeroRow[] = report?.rows ?? [];
  const flat = flattenRows(rows);
  return {
    cashBalance: findCellValue(flat, "Bank") || findCellValue(flat, "Cash"),
    totalAssets: findCellValue(flat, "Total Assets"),
    totalLiabilities: findCellValue(flat, "Total Liabilities"),
    currentAssets: findCellValue(flat, "Total Current Assets"),
    currentLiabilities: findCellValue(flat, "Total Current Liabilities"),
  };
}

// ── Google Sheets helpers (supplemental only) ────────────────────────────────

async function getSheetsForecasts(): Promise<Record<string, number>> {
  try {
    const rows = await getSheetData("Forecasts vs Actuals!A1:N15");
    const forecastMap: Record<string, number> = {};
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;
      const monthLabel = row[0].trim().substring(0, 3);
      if (monthNames.includes(monthLabel)) {
        forecastMap[monthLabel] = safeNum(row[1]);
      }
    }
    return forecastMap;
  } catch {
    return {};
  }
}

async function getSheetsRetainers(): Promise<{
  retainers: Array<{ client: string; value: number; status: "active" | "paused" | "churned"; dueDate: string }>;
  totalMRR: number;
  activeCount: number;
  pausedCount: number;
}> {
  try {
    const rows = await getSheetData("Retainers 2026!A1:N50");
    const retainers: Array<{ client: string; value: number; status: "active" | "paused" | "churned"; dueDate: string }> = [];

    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      if (row[0]?.trim()) {
        retainers.push({ client: row[0].trim(), value: safeNum(row[1]), dueDate: row[2] || "", status: "active" });
      }
      if (row[4]?.trim()) {
        retainers.push({ client: row[4].trim(), value: safeNum(row[5]), dueDate: "", status: "paused" });
      }
      if (row[7]?.trim()) {
        retainers.push({ client: row[7].trim(), value: safeNum(row[8]), dueDate: "", status: "churned" });
      }
    }

    const active = retainers.filter((r) => r.status === "active");
    const paused = retainers.filter((r) => r.status === "paused");
    return {
      retainers,
      totalMRR: active.reduce((s, r) => s + r.value, 0),
      activeCount: active.length,
      pausedCount: paused.length,
    };
  } catch {
    return { retainers: [], totalMRR: 0, activeCount: 0, pausedCount: 0 };
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const lastUpdated = new Date().toISOString();
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // ── Step 1: Fetch Xero data (PRIMARY) ───────────────────────────────────
  let xeroConnected = false;
  let dataSource: "xero" | "sheets" | "fallback" = "fallback";

  let cashBalance = FALLBACK.cashBalance;
  let totalAssets = 0;
  let totalLiabilities = 0;
  let currentAssets = 0;
  let currentLiabilities = 0;
  let workingCapital = FALLBACK.workingCapital;
  let currentRatio = FALLBACK.currentRatio;
  let totalOverdue = FALLBACK.totalOverdue;
  const overdueByAge = {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    days90plus: 0,
  };
  const topDebtors: Array<{ name: string; amount: number; daysOverdue: number }> = [];

  // P&L from Xero
  let xeroMonthlyData: Array<{ month: string; revenue: number; expenses: number; profit: number; forecast: number }> = [];
  let ytdRevenue = FALLBACK.ytdRevenue;
  let currentMonthRevenue = FALLBACK.mayRevenue;
  let currentMonthExpenses = FALLBACK.mayExpenses;
  let currentMonthProfit = FALLBACK.mayProfit;

  try {
    const tokens = await getValidTokens();

    if (tokens) {
      await xero.setTokenSet(tokens as any);
      await xero.updateTenants();
      const tenantId = xero.tenants[0]?.tenantId;

      if (tenantId) {
        xeroConnected = true;

        const [plResult, bsResult, invResult] = await Promise.allSettled([
          xero.accountingApi.getReportProfitAndLoss(
            tenantId, undefined, undefined, undefined, undefined, undefined, "MONTH" as any
          ),
          xero.accountingApi.getReportBalanceSheet(tenantId),
          xero.accountingApi.getInvoices(
            tenantId,
            undefined, undefined, undefined, undefined, undefined, undefined,
            ["AUTHORISED", "SUBMITTED"] as any,
            undefined, undefined, undefined, undefined, undefined, undefined
          ),
        ]);

        // ── Parse P&L ──────────────────────────────────────────────────────
        if (plResult.status === "fulfilled") {
          const plReports = (plResult.value.body as any)?.reports ?? [];
          if (plReports.length > 0) {
            const parsed = parsePnLReport(plReports[0]);
            // Build monthly data array from Xero headers
            for (let i = 0; i < parsed.headers.length; i++) {
              const header = parsed.headers[i]; // e.g. "Jan 2026" or "1 Jan 2026"
              const monthAbbr = monthNames.find((m) =>
                header.toLowerCase().startsWith(m.toLowerCase())
              ) ?? header.substring(0, 3);
              xeroMonthlyData.push({
                month: monthAbbr,
                revenue: parsed.revenue[i] ?? 0,
                expenses: parsed.expenses[i] ?? 0,
                profit: parsed.profit[i] ?? 0,
                forecast: 0, // filled from Sheets below
              });
            }

            if (xeroMonthlyData.length > 0) {
              dataSource = "xero";
              const activeMonths = xeroMonthlyData.filter((m) => m.revenue > 0);
              ytdRevenue = activeMonths.reduce((s, m) => s + m.revenue, 0);
              const latest = activeMonths[activeMonths.length - 1];
              if (latest) {
                currentMonthRevenue = latest.revenue;
                currentMonthExpenses = latest.expenses;
                currentMonthProfit = latest.profit;
              }
            }
          }
        }

        // ── Parse Balance Sheet ────────────────────────────────────────────
        if (bsResult.status === "fulfilled") {
          const bsReports = (bsResult.value.body as any)?.reports ?? [];
          if (bsReports.length > 0) {
            const bs = parseBalanceSheet(bsReports[0]);
            if (bs.cashBalance > 0) cashBalance = bs.cashBalance;
            if (bs.totalAssets > 0) totalAssets = bs.totalAssets;
            if (bs.totalLiabilities > 0) totalLiabilities = bs.totalLiabilities;
            if (bs.currentAssets > 0 && bs.currentLiabilities > 0) {
              currentAssets = bs.currentAssets;
              currentLiabilities = bs.currentLiabilities;
              workingCapital = currentAssets - currentLiabilities;
              currentRatio = Math.round((currentAssets / currentLiabilities) * 100) / 100;
            }
          }
        }

        // ── Parse Invoices for receivables aging ───────────────────────────
        if (invResult.status === "fulfilled") {
          const invoices: any[] = (invResult.value.body as any)?.invoices ?? [];
          const now = new Date();

          // Build top debtors map
          const debtorMap: Record<string, { amount: number; daysOverdue: number }> = {};

          for (const inv of invoices) {
            const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.date);
            const ageDays = Math.floor((now.getTime() - due.getTime()) / 86400000);
            const amt = safeNum(inv.amountDue ?? 0);
            const contactName: string = inv.contact?.name ?? "Unknown";

            if (ageDays <= 0) overdueByAge.current += amt;
            else if (ageDays <= 30) overdueByAge.days1to30 += amt;
            else if (ageDays <= 60) overdueByAge.days31to60 += amt;
            else if (ageDays <= 90) overdueByAge.days61to90 += amt;
            else overdueByAge.days90plus += amt;

            if (ageDays > 0 && amt > 0) {
              if (!debtorMap[contactName]) {
                debtorMap[contactName] = { amount: 0, daysOverdue: ageDays };
              }
              debtorMap[contactName].amount += amt;
              debtorMap[contactName].daysOverdue = Math.max(
                debtorMap[contactName].daysOverdue,
                ageDays
              );
            }
          }

          totalOverdue =
            overdueByAge.days1to30 +
            overdueByAge.days31to60 +
            overdueByAge.days61to90 +
            overdueByAge.days90plus;

          // Top 5 debtors by amount
          Object.entries(debtorMap)
            .sort((a, b) => b[1].amount - a[1].amount)
            .slice(0, 5)
            .forEach(([name, d]) => {
              topDebtors.push({ name, amount: d.amount, daysOverdue: d.daysOverdue });
            });
        }
      }
    }
  } catch (err) {
    console.error("Xero error in /api/finance/live:", err);
  }

  // ── Step 2: Google Sheets (SUPPLEMENTAL — forecasts + retainers only) ────
  const [forecastMap, sheetsRetainers] = await Promise.all([
    getSheetsForecasts().catch(() => ({} as Record<string, number>)),
    getSheetsRetainers().catch(() => ({
      retainers: [] as Array<{ client: string; value: number; status: "active" | "paused" | "churned"; dueDate: string }>,
      totalMRR: 0,
      activeCount: 0,
      pausedCount: 0,
    })),
  ]);

  // Inject forecast into monthly data
  if (xeroMonthlyData.length > 0) {
    xeroMonthlyData = xeroMonthlyData.map((m) => ({
      ...m,
      forecast: forecastMap[m.month] ?? 0,
    }));
  } else {
    // No Xero P&L — build stub monthly array with forecasts only
    xeroMonthlyData = monthNames.map((m) => ({
      month: m,
      revenue: 0,
      expenses: 0,
      profit: 0,
      forecast: forecastMap[m] ?? 0,
    }));
  }

  // Retainer counts from Sheets
  const mrrBase = sheetsRetainers.totalMRR || FALLBACK.mrrBase;
  const activeRetainers = sheetsRetainers.activeCount || FALLBACK.activeRetainers;
  const pausedRetainers = sheetsRetainers.pausedCount || 0;
  const retainers = sheetsRetainers.retainers;

  // ── Step 3: Derived KPIs ─────────────────────────────────────────────────
  const ytdTarget = FALLBACK.ytdTarget;
  const currentMonthMargin =
    currentMonthRevenue > 0
      ? Math.round((currentMonthProfit / currentMonthRevenue) * 100 * 10) / 10
      : 0;

  const activeMonthsCount = xeroMonthlyData.filter((m) => m.revenue > 0).length || 5;
  const avgMonthlyRevenue = ytdRevenue / activeMonthsCount;

  // ── Step 4: Alert generation ─────────────────────────────────────────────
  const alerts: Array<{ type: "critical" | "warning" | "info"; title: string; detail: string }> = [];

  if (currentRatio < 0.8) {
    alerts.push({
      type: "critical",
      title: `Liquidity warning — current ratio ${currentRatio.toFixed(2)}`,
      detail: `Current assets ${fmt(currentAssets)} vs liabilities ${fmt(currentLiabilities)}. Working capital: ${fmt(workingCapital)}.`,
    });
  }

  if (totalOverdue > 500000) {
    alerts.push({
      type: "critical",
      title: `${fmt(totalOverdue)} in overdue receivables`,
      detail: `Receivables aging: 1-30d ${fmt(overdueByAge.days1to30)}, 31-60d ${fmt(overdueByAge.days31to60)}, 61-90d ${fmt(overdueByAge.days61to90)}, 90d+ ${fmt(overdueByAge.days90plus)}.`,
    });
  }

  if (ytdRevenue > 0 && ytdRevenue / ytdTarget < 0.85) {
    alerts.push({
      type: "warning",
      title: `YTD revenue at ${((ytdRevenue / ytdTarget) * 100).toFixed(0)}% of target`,
      detail: `${fmt(ytdRevenue)} of ${fmt(ytdTarget)} YTD target achieved.`,
    });
  }

  if (avgMonthlyRevenue > 0 && currentMonthRevenue < avgMonthlyRevenue * 0.9) {
    alerts.push({
      type: "warning",
      title: "Below average monthly revenue",
      detail: `Current month ${fmt(currentMonthRevenue)} vs avg ${fmt(avgMonthlyRevenue)}.`,
    });
  }

  if (currentMonthProfit > 0) {
    alerts.push({
      type: "info",
      title: `Month closed profitably at ${fmt(currentMonthProfit)}`,
      detail: `Margin: ${currentMonthMargin}%.`,
    });
  }

  return NextResponse.json({
    xeroConnected,
    dataSource,
    lastUpdated,
    cashBalance,
    mrrBase,
    activeRetainers,
    pausedRetainers,
    ytdRevenue,
    ytdTarget,
    currentMonthRevenue,
    currentMonthExpenses,
    currentMonthProfit,
    currentMonthMargin,
    workingCapital,
    currentRatio,
    totalAssets,
    totalLiabilities,
    totalOverdue,
    overdueByAge,
    monthlyData: xeroMonthlyData,
    retainers,
    alerts,
    topDebtors,
  });
}
