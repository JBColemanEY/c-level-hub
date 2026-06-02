"use client";

import { useState } from "react";
import {
  RefreshCw,
  TrendingDown,
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
import ReceivablesPanel from "@/components/finance/ReceivablesPanel";
import ClientRetainerBoard from "@/components/finance/ClientRetainerBoard";
import CashFlowCalendar from "@/components/finance/CashFlowCalendar";
import ExpenseBreakdown from "@/components/finance/ExpenseBreakdown";
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
    total_income: 367764,
    total_expenses: 393060,
    gross_profit: 367764,
    net_profit: -25296,
    income_accounts: [
      { account_name: "Retainer Revenue", current_balance: 367764, comparison_balance: 393988 },
    ],
    expense_accounts: [
      { account_name: "Staff / Contractors", current_balance: 279740, comparison_balance: 279740 },
      { account_name: "Software", current_balance: 26000, comparison_balance: 26000 },
      { account_name: "Occupancy", current_balance: 23004, comparison_balance: 23004 },
      { account_name: "General", current_balance: 11000, comparison_balance: 11000 },
      { account_name: "Marketing", current_balance: 7000, comparison_balance: 7000 },
      { account_name: "Phone / WiFi", current_balance: 2250, comparison_balance: 2250 },
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

const YTD_REVENUE = 263004 + 318764 + 379801 + 393988 + 367764; // 1,723,321
const APR_REVENUE = 393988;
const MAY_REVENUE = 367764;
const MOM_CHANGE = ((MAY_REVENUE - APR_REVENUE) / APR_REVENUE) * 100; // -6.6%

export default function FinancePage() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed] = useState(new Date("2026-06-02T08:00:00Z"));

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }

  const d = STATIC_DATA;

  // AI advisor gets a rich context string baked in
  const enrichedData: FinanceDashboardData = {
    ...d,
    org_name: "Entity Y — May 2026 | Cash: R1.24M | May Rev: R367K (-6.6% MoM) | May Net Loss: -R25K | YTD Rev: R1.72M | Receivables: R1.36M (96% overdue, R1.25M) | Working capital: R384K | Current ratio: 0.60 WARNING | MRR base: R359K from 19 active retainers | PrideBet: R198K outstanding, payment issues | Dec 2025 operating margin: 27%",
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
        {/* ── Alert Banners ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3.5">
            <TrendingDown size={15} className="text-red-400 shrink-0" />
            <div>
              <p className="text-red-300 font-medium text-sm">May net loss detected</p>
              <p className="text-red-400/70 text-xs mt-0.5">
                Expenses exceeded revenue by R25,296 — first loss month of 2026. Expenses up 6.1% while revenue fell 6.6% MoM.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3.5">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm">
              <span className="font-medium">96% of receivables overdue</span>
              <span className="text-amber-400/70 ml-1">— R1.24M at risk across 49 invoices. Immediate follow-up required.</span>
            </p>
          </div>
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3.5">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm">
              <span className="font-medium">Current ratio 0.60</span>
              <span className="text-amber-400/70 ml-1">— Liquidity warning. Current liabilities exceed current assets by R859K.</span>
            </p>
          </div>
        </div>

        {/* ── KPI Strip ── */}
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
            <p className="text-white text-2xl font-semibold leading-none">R1.72M</p>
            <div className="flex items-center gap-1 mt-1.5">
              <ArrowUpRight size={12} className="text-emerald-400" />
              <p className="text-emerald-400 text-xs">Jan–May 2026</p>
            </div>
          </div>

          {/* Net Profit May */}
          <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Net Profit (May)</p>
            <p className="text-red-400 text-2xl font-semibold leading-none">−R25K</p>
            <span className="inline-block mt-1.5 text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30 rounded px-1.5 py-0.5">
              Loss
            </span>
          </div>

          {/* Receivables */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Receivables</p>
            <p className="text-white text-2xl font-semibold leading-none">R1.28M</p>
            <p className="text-red-400 text-xs mt-1.5 font-medium">R1.24M overdue</p>
          </div>

          {/* Working Capital */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Working Capital</p>
            <p className="text-white text-2xl font-semibold leading-none">R384K</p>
            <p className="text-amber-400 text-xs mt-1.5">Ratio: 0.60 ⚠</p>
          </div>
        </div>

        {/* ── Charts + Receivables ── */}
        <div className="grid grid-cols-5 gap-5">
          {/* Left col — trend charts */}
          <div className="col-span-5 lg:col-span-3 space-y-4">
            <RevExpChart />
            <ProfitBarChart />
          </div>

          {/* Right col — receivables */}
          <div className="col-span-5 lg:col-span-2">
            <ReceivablesPanel />
          </div>
        </div>

        {/* ── Client Retainer Board ── */}
        <ClientRetainerBoard />

        {/* ── Cash Flow Calendar + Expense Breakdown ── */}
        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-5 lg:col-span-3">
            <CashFlowCalendar />
          </div>
          <div className="col-span-5 lg:col-span-2">
            <ExpenseBreakdown />
          </div>
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
              sub="vs R311K at Dec 2025"
            />
            <KPICard
              label="Net Equity"
              value={fmt(d.position.net_equity)}
              trend={d.position.net_equity > 0 ? "up" : "down"}
            />
            <KPICard
              label="Dec 2025 Op Margin"
              value="27%"
              sub="R891K operating profit"
              trend="up"
            />
          </div>
        </div>

        {/* ── AI Financial Advisor ── */}
        <div style={{ height: 580 }}>
          <AIAdvisor financialData={enrichedData} />
        </div>
      </div>
    </div>
  );
}
