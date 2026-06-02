"use client";

import { useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import KPICard from "@/components/finance/KPICard";
import AIAdvisor from "@/components/finance/AIAdvisor";
import RevExpChart from "@/components/finance/RevExpChart";
import ProfitBarChart from "@/components/finance/ProfitBarChart";
import ForecastVsActual from "@/components/finance/ForecastVsActual";
import ReceivablesPanel from "@/components/finance/ReceivablesPanel";
import ClientRetainerBoard from "@/components/finance/ClientRetainerBoard";
import CashFlowCalendar from "@/components/finance/CashFlowCalendar";
import ExpenseBreakdown from "@/components/finance/ExpenseBreakdown";
import BreakEven from "@/components/finance/BreakEven";
import ChurnAnalysis from "@/components/finance/ChurnAnalysis";
import { FinanceDashboardData } from "@/lib/xero";

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

// Hardcoded comprehensive dataset — Entity Y, May 2026
const STATIC_DATA: FinanceDashboardData = {
  org_name: "Entity Y",
  currency: "ZAR",
  last_refreshed: "2026-06-02T08:00:00Z",
  position: {
    snapshot_date: "2026-05-31",
    total_assets: 2526928,
    total_liabilities: 2112203,
    net_equity: 414725,
    cash_balance: 1243823,
    current_assets: 1283105,
    current_liabilities: 2142263,
  },
  pnl: {
    period: { start_date: "2026-05-01", end_date: "2026-05-31" },
    // May total income includes: retainer R367,764 + VAT R75,429 + media R51,773 + refunds R6,150 = R501,116
    total_income: 501116,
    total_expenses: 393060,
    gross_profit: 501116,
    net_profit: 108056,
    income_accounts: [
      { account_name: "Retainer Revenue", current_balance: 367764, comparison_balance: 393988 },
      { account_name: "VAT Refunds", current_balance: 75429, comparison_balance: 0 },
      { account_name: "Media Pass-through", current_balance: 51773, comparison_balance: 0 },
      { account_name: "Client Refunds", current_balance: 6150, comparison_balance: 0 },
    ],
    expense_accounts: [
      { account_name: "Salaries", current_balance: 90000, comparison_balance: 90000 },
      { account_name: "Paid Media Contractors", current_balance: 41290, comparison_balance: 47500 },
      { account_name: "Content Contractors", current_balance: 40000, comparison_balance: 40000 },
      { account_name: "Email Contractors", current_balance: 28000, comparison_balance: 28000 },
      { account_name: "Management Fees", current_balance: 26828, comparison_balance: 0 },
      { account_name: "Software", current_balance: 27834, comparison_balance: 26000 },
      { account_name: "Media Spend (pass-through)", current_balance: 55103, comparison_balance: 0 },
      { account_name: "Sales Contractors", current_balance: 15000, comparison_balance: 15000 },
      { account_name: "Designers", current_balance: 15000, comparison_balance: 15000 },
      { account_name: "Commissions", current_balance: 8130, comparison_balance: 0 },
      { account_name: "Insurance", current_balance: 4631, comparison_balance: 4631 },
      { account_name: "Medical Aid", current_balance: 2240, comparison_balance: 2240 },
      { account_name: "Accountant", current_balance: 7000, comparison_balance: 7000 },
      { account_name: "Entertainment", current_balance: 3000, comparison_balance: 3000 },
      { account_name: "Office / Other", current_balance: 4000, comparison_balance: 4000 },
    ],
  },
  cash: {
    snapshot_date: "2026-05-31",
    cash_balance: 1243823,
    amount_owed: 1355203,
    amount_due: 0,
    working_capital: 384665,
  },
};

// YTD figures (retainer revenue only for consistency with forecast comparison)
const YTD_RETAINER = 263004 + 318764 + 379801 + 393988 + 367764; // 1,723,321
const APR_REVENUE = 393988;
const MAY_REVENUE = 367764;
const MOM_CHANGE = ((MAY_REVENUE - APR_REVENUE) / APR_REVENUE) * 100; // -6.6%
const YTD_TARGET = 2030000;

export default function FinancePage() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed] = useState(new Date("2026-06-02T08:00:00Z"));

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }

  const d = STATIC_DATA;

  // Rich AI context string with all corrected figures
  const enrichedData: FinanceDashboardData = {
    ...d,
    org_name: `Entity Y — May 2026 Financial Summary:
INCOME: May retainer revenue R367,764 (-6.6% MoM vs Apr R393,988). May total income R501,116 (includes VAT refunds R75,429 + media pass-through R51,773 + client refunds R6,150). May expenses R393,060. May NET PROFIT: R108,056 (21.6% margin on total income).
YTD 2026 P&L: Jan profit R2,852 | Feb R24,785 | Mar R96,463 | Apr R23,493 | May R108,056. YTD retainer revenue R1,723,321 vs YTD forecast target R2,030,000 — BEHIND by R306,679 (-15.1%). Annual target R5,030,000, 34.2% achieved.
BALANCE SHEET: Cash R1.24M | Total assets R2.53M | Total liabilities R2.11M | Net equity R414,725. Current ratio 0.60 WARNING — current liabilities R2.14M exceed current assets R1.28M by R859K.
RECEIVABLES: Total R1.355M | 96% overdue — 0-30 days R108,898 | 31-60 days R67,324 | 61-90 days R50,017 | 90+ days R1,020,086. PrideBet alone R198,639 (3 invoices overdue).
MRR: 19 active retainers = R359,764/month base. Plus short-term: The Steam Bar R25,998 (ENDING NOW — 4mo from Jan), Flying Brick R16,998, UDARKIE R14,998, Robin Sprong R13,999. BREAK-EVEN: fixed costs ~R343,858/mo — buffer only R15,906 (4.4%). Losing 1 mid-size client goes negative.
CHURN: 2025 MRR R381,909 → 2026 R359,764 (-R22,145/mo). Churned: Luxity R41K, Piffany R25K, African Jacquard R15K, ECape Moringa R10K + 5 others. AT-RISK: 9 clients on 3-4 month contracts = R196,949 MRR at risk. Key anchors: Ergonomicsdirect (24-month) and Chin & Partners (21-month).
MAY BUDGET VARIANCE: Paid media contractors under budget by R6,210. Management fees R26,828 and commissions R8,130 were unbudgeted overages. Software R27,834.
LTV metrics: avg customer value R17,131/month | avg lifespan 6.9 months | LTV R118,603.`,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div>
          <h1 className="text-white font-semibold text-xl tracking-tight">Finance</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Entity Y · Management Accounts + Xero · as of{" "}
            {lastRefreshed.toLocaleString("en-ZA", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Section 1: Alert Banners ── */}
        <div className="space-y-2">
          {/* Revenue below forecast (not a loss — this is correct) */}
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3.5">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-amber-300 font-medium text-sm">May revenue below forecast by R17,236</p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                Retainer revenue R367,764 vs R385,000 forecast (-4.5%). Total income R501,116 including VAT refunds and media pass-throughs. Net profit: <span className="text-emerald-400 font-medium">R108,056</span>.
              </p>
            </div>
          </div>
          {/* Annual target at risk */}
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3.5">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm">
              <span className="font-medium">Annual target at risk — R307K behind YTD forecast after 5 months</span>
              <span className="text-amber-400/70 ml-1">R1.72M of R2.03M YTD target achieved (84.9%). Annual target: R5.03M.</span>
            </p>
          </div>
          {/* Receivables overdue */}
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3.5">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm">
              <span className="font-medium">96% of receivables overdue</span>
              <span className="text-amber-400/70 ml-1">— R1.25M at risk across 49 invoices. PrideBet alone R198,639 (3 invoices). Immediate follow-up required.</span>
            </p>
          </div>
          {/* Liquidity warning */}
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3.5">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm">
              <span className="font-medium">Current ratio 0.60</span>
              <span className="text-amber-400/70 ml-1">— Liquidity warning. Current liabilities exceed current assets by R859K. Working capital: R384K.</span>
            </p>
          </div>
        </div>

        {/* ── Section 2: KPI Strip ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Cash Balance */}
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Cash Balance</p>
            <div className="flex items-end gap-1">
              <DollarSign size={14} className="text-violet-400 mb-0.5" />
              <p className="text-white text-2xl font-semibold leading-none">R1.24M</p>
            </div>
            <p className="text-violet-300/70 text-xs mt-1.5">Available liquidity</p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Revenue (May)</p>
            <p className="text-white text-2xl font-semibold leading-none">R367K</p>
            <div className="flex items-center gap-1 mt-1.5">
              <ArrowDownRight size={12} className="text-red-400" />
              <p className="text-red-400 text-xs font-medium">
                {MOM_CHANGE.toFixed(1)}% vs Apr
              </p>
            </div>
          </div>

          {/* YTD Revenue */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">YTD Revenue</p>
            <p className="text-white text-2xl font-semibold leading-none">{fmt(YTD_RETAINER)}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <ArrowDownRight size={12} className="text-amber-400" />
              <p className="text-amber-400 text-xs">vs target {fmt(YTD_TARGET)} | -15.1%</p>
            </div>
          </div>

          {/* Net Profit May */}
          <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Net Profit (May)</p>
            <p className="text-emerald-400 text-2xl font-semibold leading-none">R108K</p>
            <span className="inline-block mt-1.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded px-1.5 py-0.5">
              Profitable
            </span>
          </div>

          {/* MRR Base */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">MRR Base</p>
            <p className="text-white text-2xl font-semibold leading-none">R359K</p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp size={11} className="text-white/40" />
              <p className="text-white/40 text-xs">19 active retainers</p>
            </div>
          </div>

          {/* Working Capital */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Working Capital</p>
            <p className="text-white text-2xl font-semibold leading-none">R384K</p>
            <p className="text-amber-400 text-xs mt-1.5">Ratio: 0.60 ⚠</p>
          </div>
        </div>

        {/* ── Section 3: Charts — Rev/Exp | Forecast vs Actual ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RevExpChart />
          <ForecastVsActual />
        </div>

        {/* ── Section 4: Profit Bar | Break-even | Churn Analysis ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ProfitBarChart />
          <BreakEven />
          <ChurnAnalysis />
        </div>

        {/* ── Section 5: Client Retainer Board (full width) ── */}
        <ClientRetainerBoard />

        {/* ── Section 6: Cash Flow Calendar | Expense Breakdown | Receivables ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <CashFlowCalendar />
          <ExpenseBreakdown />
          <ReceivablesPanel />
        </div>

        {/* ── Balance Sheet Summary ── */}
        <div>
          <p className="text-white/60 text-xs uppercase tracking-wider mb-3">Balance Sheet — May 2026</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="Total Assets" value={fmt(d.position.total_assets)} />
            <KPICard
              label="Total Liabilities"
              value={fmt(d.position.total_liabilities)}
              trend="down"
              sub="Current liabilities R2.14M"
            />
            <KPICard
              label="Net Equity"
              value={fmt(d.position.net_equity)}
              trend={d.position.net_equity > 0 ? "up" : "down"}
            />
            <KPICard
              label="Current Ratio"
              value="0.60"
              sub="Warning: below 1.0"
              trend="down"
            />
          </div>
        </div>

        {/* ── Section 7: AI Financial Advisor (full width) ── */}
        <div style={{ height: 580 }}>
          <AIAdvisor financialData={enrichedData} />
        </div>
      </div>
    </div>
  );
}
