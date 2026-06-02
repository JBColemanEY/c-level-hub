import { NextResponse } from "next/server";
import { xero, loadTokens, getTokens } from "@/lib/xero-oauth";
import { getSheetData } from "@/lib/google-sheets";

// ── Fallback hardcoded data ──────────────────────────────────────────────────
const FALLBACK = {
  xeroConnected: false,
  lastUpdated: new Date().toISOString(),
  cashBalance: 1243823,
  mrrBase: 359000,
  activeRetainers: 19,
  ytdRevenue: 1723321,
  ytdTarget: 2030000,
  mayRevenue: 367764,
  mayExpenses: 393060,
  mayProfit: 108056,
  mayMargin: 21.6,
  workingCapital: 384665,
  currentRatio: 0.6,
  totalAssets: 2526928,
  totalLiabilities: 2112203,
  netEquity: 414725,
  totalOverdue: 1250000,
  overdueByAge: { current: 50000, days30: 200000, days60: 400000, days90: 400000, days90plus: 200000 },
  monthlyData: [
    { month: "Jan", revenue: 263004, expenses: 220000, profit: 43004, forecast: 320000 },
    { month: "Feb", revenue: 318764, expenses: 275000, profit: 43764, forecast: 350000 },
    { month: "Mar", revenue: 379801, expenses: 310000, profit: 69801, forecast: 380000 },
    { month: "Apr", revenue: 393988, expenses: 340000, profit: 53988, forecast: 385000 },
    { month: "May", revenue: 367764, expenses: 393060, profit: 108056, forecast: 385000 },
  ],
  retainers: [] as Array<{ client: string; value: number; status: string; dueDate: string }>,
  alerts: [
    { type: "warning", message: "May revenue below forecast by R17,236", detail: "Retainer revenue R367,764 vs R385,000 forecast (-4.5%)." },
    { type: "warning", message: "Annual target at risk", detail: "R1.72M of R2.03M YTD target achieved (84.9%)." },
    { type: "warning", message: "96% of receivables overdue", detail: "R1.25M at risk across 49 invoices." },
    { type: "warning", message: "Current ratio 0.60", detail: "Liquidity warning. Current liabilities exceed current assets by R859K." },
  ],
};

function safeNum(val: string | undefined | null): number {
  if (!val) return 0;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

// ── Xero helpers ─────────────────────────────────────────────────────────────

interface XeroReportRow {
  rowType?: string;
  title?: string;
  cells?: Array<{ value?: string | number }>;
  rows?: XeroReportRow[];
}

function findCellValue(rows: XeroReportRow[], titleMatch: string, colIndex = 1): number {
  for (const row of rows) {
    if (row.cells && row.cells[0]?.value === titleMatch) {
      return safeNum(String(row.cells[colIndex]?.value ?? "0"));
    }
    if (row.rows) {
      const found = findCellValue(row.rows, titleMatch, colIndex);
      if (found !== 0) return found;
    }
  }
  return 0;
}

function flattenRows(rows: XeroReportRow[]): XeroReportRow[] {
  const result: XeroReportRow[] = [];
  for (const row of rows) {
    result.push(row);
    if (row.rows) result.push(...flattenRows(row.rows));
  }
  return result;
}

// ── Google Sheets helpers ────────────────────────────────────────────────────

async function getSheetsPnL(): Promise<Array<{ month: string; revenue: number; expenses: number; profit: number; forecast: number }>> {
  try {
    const [pnlRows, forecastRows] = await Promise.all([
      getSheetData("P&L!A1:N95"),
      getSheetData("Forecasts vs Actuals!A1:K15"),
    ]);

    let salesRow: string[] = [];
    let expensesRow: string[] = [];
    let profitRow: string[] = [];

    for (const row of pnlRows) {
      if (!row || !row[0]) continue;
      if (row[0] === "Sales") salesRow = row;
      if (row[0] === "Total expenses") expensesRow = row;
      if (row[0] === "Profit before finance costs") profitRow = row;
    }

    // Build forecast map from Forecasts vs Actuals tab
    const forecastMap: Record<string, number> = {};
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (let i = 2; i < forecastRows.length; i++) {
      const row = forecastRows[i];
      if (!row || !row[0]) continue;
      const monthLabel = row[0].trim().substring(0, 3);
      forecastMap[monthLabel] = safeNum(row[1]);
    }

    const result = [];
    for (let i = 0; i < 12; i++) {
      const col = i + 1;
      const month = monthNames[i];
      result.push({
        month,
        revenue: safeNum(salesRow[col]),
        expenses: safeNum(expensesRow[col]),
        profit: safeNum(profitRow[col]),
        forecast: forecastMap[month] || 0,
      });
    }
    return result;
  } catch {
    return [];
  }
}

async function getSheetsRetainers(): Promise<{
  retainers: Array<{ client: string; value: number; status: string; dueDate: string }>;
  totalMRR: number;
  activeCount: number;
}> {
  try {
    const rows = await getSheetData("Retainers 2026!A1:N30");
    const retainers: Array<{ client: string; value: number; status: string; dueDate: string }> = [];

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
    const totalMRR = active.reduce((s, r) => s + r.value, 0);

    return { retainers, totalMRR, activeCount: active.length };
  } catch {
    return { retainers: [], totalMRR: 0, activeCount: 0 };
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const lastUpdated = new Date().toISOString();

  // ── Step 1: Google Sheets data (primary source) ──────────────────────────
  const [sheetsMonthly, sheetsRetainers] = await Promise.all([
    getSheetsPnL().catch(() => [] as ReturnType<typeof getSheetsPnL> extends Promise<infer T> ? T : never),
    getSheetsRetainers().catch(() => ({ retainers: [], totalMRR: 0, activeCount: 0 })),
  ]);

  // ── Step 2: Xero data ────────────────────────────────────────────────────
  let xeroConnected = false;
  let cashBalance = FALLBACK.cashBalance;
  let totalAssets = FALLBACK.totalAssets;
  let totalLiabilities = FALLBACK.totalLiabilities;
  let netEquity = FALLBACK.netEquity;
  let workingCapital = FALLBACK.workingCapital;
  let currentRatio = FALLBACK.currentRatio;
  let totalOverdue = FALLBACK.totalOverdue;
  const overdueByAge = { ...FALLBACK.overdueByAge };

  try {
    let tokens = getTokens();
    if (!tokens) tokens = await loadTokens();

    if (tokens) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await xero.setTokenSet(tokens as any);
      await xero.updateTenants();
      const tenantId = xero.tenants[0]?.tenantId;

      if (tenantId) {
        xeroConnected = true;

        const [bsResponse, invoicesResponse] = await Promise.allSettled([
          xero.accountingApi.getReportBalanceSheet(tenantId),
          xero.accountingApi.getInvoices(tenantId, undefined, undefined, undefined, undefined, undefined, undefined, ["AUTHORISED"], undefined, undefined, undefined, undefined, undefined, undefined),
        ]);

        // Parse Balance Sheet
        if (bsResponse.status === "fulfilled") {
          const bs = bsResponse.value.body;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const reports = (bs as any)?.reports ?? [];
          if (reports.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rows: XeroReportRow[] = reports[0]?.rows ?? [];
            const flat = flattenRows(rows);
            const cash = findCellValue(flat, "Bank");
            if (cash > 0) cashBalance = cash;
            const ta = findCellValue(flat, "Total Assets");
            if (ta > 0) totalAssets = ta;
            const tl = findCellValue(flat, "Total Liabilities");
            if (tl > 0) totalLiabilities = tl;
            const ne = findCellValue(flat, "Net Assets");
            if (ne !== 0) netEquity = ne;
            const ca = findCellValue(flat, "Total Current Assets");
            const cl = findCellValue(flat, "Total Current Liabilities");
            if (ca > 0 && cl > 0) {
              workingCapital = ca - cl;
              currentRatio = Math.round((ca / cl) * 100) / 100;
            }
          }
        }

        // Parse Invoices for receivables
        if (invoicesResponse.status === "fulfilled") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const invoices: any[] = (invoicesResponse.value.body as any)?.invoices ?? [];
          const now = new Date();
          let current = 0, d30 = 0, d60 = 0, d90 = 0, d90plus = 0;
          for (const inv of invoices) {
            const due = new Date(inv.dueDate ?? inv.date);
            const ageDays = Math.floor((now.getTime() - due.getTime()) / 86400000);
            const amt = safeNum(String(inv.amountDue ?? 0));
            if (ageDays <= 0) current += amt;
            else if (ageDays <= 30) d30 += amt;
            else if (ageDays <= 60) d60 += amt;
            else if (ageDays <= 90) d90 += amt;
            else d90plus += amt;
          }
          totalOverdue = d30 + d60 + d90 + d90plus;
          overdueByAge.current = current;
          overdueByAge.days30 = d30;
          overdueByAge.days60 = d60;
          overdueByAge.days90 = d90;
          overdueByAge.days90plus = d90plus;
        }
      }
    }
  } catch (err) {
    console.error("Xero error in /api/finance/live:", err);
  }

  // ── Step 3: Derive KPIs ─────────────────────────────────────────────────
  // Use Sheets monthly data if available, else fallback
  const monthlyData = (sheetsMonthly as Array<{ month: string; revenue: number; expenses: number; profit: number; forecast: number }>).length >= 5
    ? sheetsMonthly as Array<{ month: string; revenue: number; expenses: number; profit: number; forecast: number }>
    : FALLBACK.monthlyData;

  const activeMonths = monthlyData.filter((m) => m.revenue > 0);
  const latestMonth = activeMonths[activeMonths.length - 1] ?? monthlyData[4];
  const prevMonth = activeMonths[activeMonths.length - 2];

  const mayRevenue = latestMonth?.revenue ?? FALLBACK.mayRevenue;
  const mayExpenses = latestMonth?.expenses ?? FALLBACK.mayExpenses;
  const mayProfit = latestMonth?.profit ?? FALLBACK.mayProfit;
  const mayMargin = mayRevenue > 0 ? Math.round((mayProfit / mayRevenue) * 100 * 10) / 10 : FALLBACK.mayMargin;
  const ytdRevenue = activeMonths.reduce((s, m) => s + m.revenue, 0) || FALLBACK.ytdRevenue;
  const ytdTarget = FALLBACK.ytdTarget;

  const mrrBase = sheetsRetainers.totalMRR || FALLBACK.mrrBase;
  const activeRetainers = sheetsRetainers.activeCount || FALLBACK.activeRetainers;

  const retainers = sheetsRetainers.retainers.length > 0
    ? sheetsRetainers.retainers
    : FALLBACK.retainers;

  // ── Step 4: Build alerts ────────────────────────────────────────────────
  const alerts = [];
  const mayForecast = latestMonth?.forecast ?? 385000;
  const mayVariance = mayRevenue - mayForecast;
  if (mayVariance < 0) {
    alerts.push({
      type: "warning",
      message: `May revenue below forecast by R${Math.abs(mayVariance).toLocaleString("en-ZA")}`,
      detail: `Retainer revenue ${fmt(mayRevenue)} vs ${fmt(mayForecast)} forecast (${((mayVariance / mayForecast) * 100).toFixed(1)}%). Net profit: ${fmt(mayProfit)}.`,
    });
  }
  const ytdGap = ytdRevenue - ytdTarget;
  if (ytdGap < 0) {
    alerts.push({
      type: "warning",
      message: `Annual target at risk — R${fmt(Math.abs(ytdGap))} behind YTD forecast`,
      detail: `${fmt(ytdRevenue)} of ${fmt(ytdTarget)} YTD target achieved (${((ytdRevenue / ytdTarget) * 100).toFixed(1)}%).`,
    });
  }
  if (totalOverdue > 500000) {
    alerts.push({
      type: "warning",
      message: "High receivables overdue",
      detail: `${fmt(totalOverdue)} in overdue receivables requires immediate follow-up.`,
    });
  }
  if (currentRatio < 1) {
    alerts.push({
      type: "warning",
      message: `Current ratio ${currentRatio.toFixed(2)}`,
      detail: `Liquidity warning. Working capital: ${fmt(workingCapital)}.`,
    });
  }
  if (alerts.length === 0) alerts.push(...FALLBACK.alerts);

  return NextResponse.json({
    xeroConnected,
    lastUpdated,
    cashBalance,
    mrrBase,
    activeRetainers,
    ytdRevenue,
    ytdTarget,
    mayRevenue,
    mayExpenses,
    mayProfit,
    mayMargin,
    workingCapital,
    currentRatio,
    totalAssets,
    totalLiabilities,
    netEquity,
    totalOverdue,
    overdueByAge,
    monthlyData,
    retainers,
    alerts,
    prevMonthRevenue: prevMonth?.revenue ?? 393988,
  });
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}
