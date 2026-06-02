"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import KPICard from "@/components/finance/KPICard";
import IntelligencePanel from "@/components/IntelligencePanel";
import RevExpChart from "@/components/finance/RevExpChart";
import ProfitBarChart from "@/components/finance/ProfitBarChart";
import ForecastVsActual from "@/components/finance/ForecastVsActual";
import ReceivablesPanel from "@/components/finance/ReceivablesPanel";
import ClientRetainerBoard from "@/components/finance/ClientRetainerBoard";
import CashFlowCalendar from "@/components/finance/CashFlowCalendar";
import ExpenseBreakdown from "@/components/finance/ExpenseBreakdown";
import BreakEven from "@/components/finance/BreakEven";

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

interface LiveData {
  xeroConnected: boolean;
  lastUpdated: string;
  cashBalance: number;
  mrrBase: number;
  activeRetainers: number;
  ytdRevenue: number;
  ytdTarget: number;
  mayRevenue: number;
  mayExpenses: number;
  mayProfit: number;
  mayMargin: number;
  workingCapital: number;
  currentRatio: number;
  totalAssets: number;
  totalLiabilities: number;
  netEquity: number;
  totalOverdue: number;
  overdueByAge: { current: number; days30: number; days60: number; days90: number; days90plus: number };
  monthlyData: Array<{ month: string; revenue: number; expenses: number; profit: number; forecast: number }>;
  retainers: Array<{ client: string; value: number; status: string; dueDate: string }>;
  alerts: Array<{ type: string; message: string; detail: string }>;
  prevMonthRevenue: number;
}

export default function FinancePage() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch("/api/finance/live");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch live finance data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#D7DF23]/30 border-t-[#D7DF23] rounded-full animate-spin mx-auto" />
          <p className="text-[#D1D3D4]/40 text-sm">Loading live data...</p>
        </div>
      </div>
    );
  }

  // d is guaranteed non-null after loading
  const d = data!;
  const lastRefreshed = new Date(d.lastUpdated);
  const momChange = d.prevMonthRevenue > 0 ? ((d.mayRevenue - d.prevMonthRevenue) / d.prevMonthRevenue) * 100 : 0;
  const ytdPct = d.ytdTarget > 0 ? ((d.ytdRevenue / d.ytdTarget) * 100).toFixed(1) : "0";

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div>
          <h1 className="text-white font-semibold text-xl tracking-tight">Finance</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Entity Y · {d.xeroConnected ? "Live Xero + Sheets" : "Google Sheets"} · Last updated{" "}
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
          {d.alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3.5">
              <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-medium text-sm">{alert.message}</p>
                {alert.detail && (
                  <p className="text-amber-400/70 text-xs mt-0.5">{alert.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Section 2: KPI Strip ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Cash Balance */}
          <div className="bg-[#D7DF23]/10 border border-[#D7DF23]/30 rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Cash Balance</p>
            <div className="flex items-end gap-1">
              <DollarSign size={14} className="text-[#D7DF23] mb-0.5" />
              <p className="text-white text-2xl font-semibold leading-none">{fmt(d.cashBalance)}</p>
            </div>
            <p className="text-[#D7DF23]/70 text-xs mt-1.5">Available liquidity</p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Revenue (May)</p>
            <p className="text-white text-2xl font-semibold leading-none">{fmt(d.mayRevenue)}</p>
            <div className="flex items-center gap-1 mt-1.5">
              {momChange >= 0 ? (
                <ArrowUpRight size={12} className="text-emerald-400" />
              ) : (
                <ArrowDownRight size={12} className="text-red-400" />
              )}
              <p className={`text-xs font-medium ${momChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {momChange.toFixed(1)}% vs Apr
              </p>
            </div>
          </div>

          {/* YTD Revenue */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">YTD Revenue</p>
            <p className="text-white text-2xl font-semibold leading-none">{fmt(d.ytdRevenue)}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <ArrowDownRight size={12} className="text-amber-400" />
              <p className="text-amber-400 text-xs">vs target {fmt(d.ytdTarget)} | {ytdPct}%</p>
            </div>
          </div>

          {/* Net Profit May */}
          <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Net Profit (May)</p>
            <p className="text-emerald-400 text-2xl font-semibold leading-none">{fmt(d.mayProfit)}</p>
            <span className="inline-block mt-1.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded px-1.5 py-0.5">
              {d.mayProfit >= 0 ? "Profitable" : "Loss"}
            </span>
          </div>

          {/* MRR Base */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">MRR Base</p>
            <p className="text-white text-2xl font-semibold leading-none">{fmt(d.mrrBase)}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp size={11} className="text-white/40" />
              <p className="text-white/40 text-xs">{d.activeRetainers} active retainers</p>
            </div>
          </div>

          {/* Working Capital */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Working Capital</p>
            <p className="text-white text-2xl font-semibold leading-none">{fmt(d.workingCapital)}</p>
            <p className={`text-xs mt-1.5 ${d.currentRatio < 1 ? "text-amber-400" : "text-emerald-400"}`}>
              Ratio: {d.currentRatio.toFixed(2)} {d.currentRatio < 1 ? "⚠" : "✓"}
            </p>
          </div>
        </div>

        {/* ── Section 3: Charts — Rev/Exp | Forecast vs Actual ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RevExpChart />
          <ForecastVsActual />
        </div>

        {/* ── Section 4: Profit Bar | Break-even ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ProfitBarChart />
          <BreakEven />
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
            <KPICard label="Total Assets" value={fmt(d.totalAssets)} />
            <KPICard
              label="Total Liabilities"
              value={fmt(d.totalLiabilities)}
              trend="down"
              sub={`Current liabilities ${fmt(d.totalLiabilities)}`}
            />
            <KPICard
              label="Net Equity"
              value={fmt(d.netEquity)}
              trend={d.netEquity > 0 ? "up" : "down"}
            />
            <KPICard
              label="Current Ratio"
              value={d.currentRatio.toFixed(2)}
              sub={d.currentRatio < 1 ? "Warning: below 1.0" : "Healthy"}
              trend={d.currentRatio < 1 ? "down" : "up"}
            />
          </div>
        </div>

        {/* ── Section 7: AI Financial Advisor (full width) ── */}
        <IntelligencePanel
          module="finance"
          initialQuestion="Analyse Entity Y's financial position. What are the top 3 priorities for the finance team this week? Include specific numbers and recommended actions."
          quickQuestions={["What's our cash runway?", "Which invoices are most at risk?", "How can we improve our margin?", "When will we hit annual target?"]}
        />
      </div>
    </div>
  );
}
