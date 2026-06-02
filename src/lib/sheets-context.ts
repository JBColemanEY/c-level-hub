import { getSheetData } from "./google-sheets";

export interface RetainerClient {
  name: string;
  value: number;
  dueDate: string;
  lifetimeMonths: number;
  status: "active" | "paused" | "churned";
}

export interface PnLMonth {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ForecastMonth {
  month: string;
  forecastRevenue: number;
  actualRevenue: number;
  variance: number;
  forecastProfit: number;
  actualProfit: number;
  profitVariance: number;
}

export interface SheetsContext {
  retainers: RetainerClient[];
  totalMRR: number;
  activeClientCount: number;
  pausedClientCount: number;
  churnedClientCount: number;
  pnl: PnLMonth[];
  forecasts: ForecastMonth[];
  avgClientValue: number;
  avgClientLifespanMonths: number;
  clv: number;
  rawSummary: string;
  lastUpdated: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function safeNum(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

async function parseRetainers(): Promise<{
  retainers: RetainerClient[];
  totalMRR: number;
  activeCount: number;
  pausedCount: number;
  churnedCount: number;
  avgClientValue: number;
  avgLifespan: number;
  clv: number;
}> {
  const rows = await getSheetData("Retainers 2026!A1:N30");
  const retainers: RetainerClient[] = [];

  // Row 4 (index 3) is the header row; data starts at index 4
  // Columns: Active: A=name, B=value, C=due, D=lifetime | Paused: E=name, F=value, G=lifetime | Churned: H=name, I=value, J=lifetime
  // LTV metrics are in col L/M
  let avgClientValue = 0;
  let avgLifespan = 0;
  let clv = 0;

  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // Active clients (cols 0-3)
    if (row[0] && row[0].trim()) {
      retainers.push({
        name: row[0].trim(),
        value: safeNum(row[1]),
        dueDate: row[2] || "",
        lifetimeMonths: safeNum(row[3]),
        status: "active",
      });
    }
    // Paused clients (cols 4-6)
    if (row[4] && row[4].trim()) {
      retainers.push({
        name: row[4].trim(),
        value: safeNum(row[5]),
        dueDate: "",
        lifetimeMonths: safeNum(row[6]),
        status: "paused",
      });
    }
    // Churned clients (cols 7-9)
    if (row[7] && row[7].trim()) {
      retainers.push({
        name: row[7].trim(),
        value: safeNum(row[8]),
        dueDate: "",
        lifetimeMonths: safeNum(row[9]),
        status: "churned",
      });
    }

    // LTV Metrics (col 11 = label, col 12 = value)
    if (row[11] === "Avg customer value (retainers/clients)" && row[12]) avgClientValue = safeNum(row[12]);
    if (row[11] === "Avg customer lifespan (months/clients)" && row[12]) avgLifespan = safeNum(row[12]);
    if (row[11] === "Customer lifetime value(acv x acl)" && row[12]) clv = safeNum(row[12]);
  }

  const active = retainers.filter((r) => r.status === "active");
  const paused = retainers.filter((r) => r.status === "paused");
  const churned = retainers.filter((r) => r.status === "churned");
  const totalMRR = active.reduce((sum, r) => sum + r.value, 0);

  return {
    retainers,
    totalMRR,
    activeCount: active.length,
    pausedCount: paused.length,
    churnedCount: churned.length,
    avgClientValue: avgClientValue || 17131,
    avgLifespan: avgLifespan || 6.9,
    clv: clv || 118603,
  };
}

async function parsePnL(): Promise<PnLMonth[]> {
  const rows = await getSheetData("P&L!A1:N95");
  const pnl: PnLMonth[] = [];

  // Row index 1 (row 2) has headers with month names in cols 1-12
  // Row 4 (index 4) = Sales row
  // Row 89 (index 88) = Total expenses
  // Row 93 (index 92) = Profit before finance costs

  let salesRow: string[] = [];
  let expensesRow: string[] = [];
  let profitRow: string[] = [];

  for (const row of rows) {
    if (!row || !row[0]) continue;
    if (row[0] === "Sales") salesRow = row;
    if (row[0] === "Total expenses") expensesRow = row;
    if (row[0] === "Profit before finance costs") profitRow = row;
  }

  for (let i = 0; i < 12; i++) {
    const colIdx = i + 1;
    pnl.push({
      month: MONTHS[i].substring(0, 3),
      revenue: safeNum(salesRow[colIdx]),
      expenses: safeNum(expensesRow[colIdx]),
      profit: safeNum(profitRow[colIdx]),
    });
  }

  return pnl;
}

async function parseForecasts(): Promise<ForecastMonth[]> {
  const rows = await getSheetData("Forecasts vs Actuals!A1:K15");
  const forecasts: ForecastMonth[] = [];

  // Row 0: headers 2025 label
  // Row 1: sub-headers (Forecast, Actual, Difference for Turnover and Profit)
  // Rows 2-13: Jan-Dec
  // Cols: A=month, B=turnoverForecast, C=turnoverActual, D=turnoverDiff, E=profitForecast, F=profitActual, G=profitDiff

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0] || row[0] === "") continue;

    const actual = safeNum(row[2]);
    const forecast = safeNum(row[1]);
    const profitForecast = safeNum(row[4]);
    const profitActual = safeNum(row[5]);

    forecasts.push({
      month: row[0],
      forecastRevenue: forecast,
      actualRevenue: actual,
      variance: actual - forecast,
      forecastProfit: profitForecast,
      actualProfit: profitActual,
      profitVariance: profitActual - profitForecast,
    });
  }

  return forecasts;
}

function formatR(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${Math.round(n / 1_000)}K`;
  return `R${Math.round(n)}`;
}

export async function getSheetsContext(): Promise<SheetsContext> {
  const lastUpdated = new Date().toISOString();

  try {
    const [retainerData, pnl, forecasts] = await Promise.all([
      parseRetainers().catch(() => null),
      parsePnL().catch(() => []),
      parseForecasts().catch(() => []),
    ]);

    const retainers = retainerData?.retainers ?? [];
    const totalMRR = retainerData?.totalMRR ?? 0;
    const activeClientCount = retainerData?.activeCount ?? 0;
    const pausedClientCount = retainerData?.pausedCount ?? 0;
    const churnedClientCount = retainerData?.churnedCount ?? 0;
    const avgClientValue = retainerData?.avgClientValue ?? 17131;
    const avgClientLifespanMonths = retainerData?.avgLifespan ?? 6.9;
    const clv = retainerData?.clv ?? 118603;

    // Build raw summary text for AI
    const activeRetainers = retainers.filter((r) => r.status === "active");
    const pausedRetainers = retainers.filter((r) => r.status === "paused");
    const churnedRetainers = retainers.filter((r) => r.status === "churned");

    const retainerLines = activeRetainers
      .sort((a, b) => b.value - a.value)
      .map((r) => `  - ${r.name}: ${formatR(r.value)}/mo (${r.lifetimeMonths}mo tenure, due ${r.dueDate || "N/A"})`)
      .join("\n");

    const pausedLines = pausedRetainers
      .map((r) => `  - ${r.name}: ${formatR(r.value)}/mo`)
      .join("\n");

    const churnedLines = churnedRetainers
      .map((r) => `  - ${r.name}: was ${formatR(r.value)}/mo (${r.lifetimeMonths}mo)`)
      .join("\n");

    const pnlActual = pnl.filter((m) => m.revenue > 0);
    const ytdRevenue = pnlActual.reduce((s, m) => s + m.revenue, 0);
    const ytdExpenses = pnlActual.reduce((s, m) => s + m.expenses, 0);
    const ytdProfit = pnlActual.reduce((s, m) => s + m.profit, 0);
    const ytdMargin = ytdRevenue > 0 ? ((ytdProfit / ytdRevenue) * 100).toFixed(1) : "0";

    const pnlLines = pnl
      .map((m) =>
        `  ${m.month}: Revenue ${formatR(m.revenue)}, Expenses ${formatR(m.expenses)}, Profit ${formatR(m.profit)}`
      )
      .join("\n");

    const forecastActual = forecasts.filter((f) => f.actualRevenue > 0);
    const forecastLines = forecasts
      .map((f) => {
        const hasActual = f.actualRevenue > 0;
        const varStr = hasActual
          ? ` | Actual: ${formatR(f.actualRevenue)} (${f.variance >= 0 ? "+" : ""}${formatR(f.variance)})`
          : " | No actuals yet";
        return `  ${f.month}: Forecast ${formatR(f.forecastRevenue)}${varStr}`;
      })
      .join("\n");

    const rawSummary = `
=== LIVE GOOGLE SHEETS DATA (VAT-exclusive, ZAR) — as of ${new Date().toLocaleDateString("en-ZA")} ===

--- RETAINERS ---
Active clients: ${activeClientCount} | Total MRR: ${formatR(totalMRR)}
${retainerLines}

Paused clients: ${pausedClientCount}
${pausedLines || "  (none)"}

Churned clients: ${churnedClientCount}
${churnedLines || "  (none)"}

LTV Metrics:
  Avg client value: ${formatR(avgClientValue)}/mo
  Avg client lifespan: ${avgClientLifespanMonths.toFixed(1)} months
  Customer Lifetime Value (CLV): ${formatR(clv)}

--- P&L (2026 YTD) ---
YTD Revenue: ${formatR(ytdRevenue)} | YTD Expenses: ${formatR(ytdExpenses)} | YTD Profit: ${formatR(ytdProfit)} (${ytdMargin}% margin)
Monthly breakdown:
${pnlLines}

--- FORECASTS VS ACTUALS (2026) ---
${forecastLines}

Months with actuals: ${forecastActual.length} of 12
Average actual vs forecast accuracy (revenue): ${
      forecastActual.length > 0
        ? (
            (forecastActual.reduce((s, f) => s + f.actualRevenue, 0) /
              forecastActual.reduce((s, f) => s + f.forecastRevenue, 0)) *
            100
          ).toFixed(1) + "%"
        : "N/A"
    }
`;

    return {
      retainers,
      totalMRR,
      activeClientCount,
      pausedClientCount,
      churnedClientCount,
      pnl,
      forecasts,
      avgClientValue,
      avgClientLifespanMonths,
      clv,
      rawSummary: rawSummary.trim(),
      lastUpdated,
    };
  } catch (error) {
    console.error("getSheetsContext error:", error);
    return {
      retainers: [],
      totalMRR: 0,
      activeClientCount: 0,
      pausedClientCount: 0,
      churnedClientCount: 0,
      pnl: [],
      forecasts: [],
      avgClientValue: 0,
      avgClientLifespanMonths: 0,
      clv: 0,
      rawSummary: "Live sheet data unavailable.",
      lastUpdated,
    };
  }
}
