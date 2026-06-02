"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { RefreshCw, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import KPICard from "@/components/finance/KPICard";
import AIAdvisor from "@/components/finance/AIAdvisor";
import { FinanceDashboardData } from "@/lib/xero";

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData() {
    try {
      setRefreshing(true);
      const res = await fetch("/api/xero/finance");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Could not load financial data. Check Xero connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/40 text-sm">Connecting to Xero…</p>
        </div>
      </div>
    );
  }

  // Use hardcoded live data as fallback (from what we fetched earlier)
  const d: FinanceDashboardData = data ?? {
    org_name: "Entity Y",
    currency: "ZAR",
    last_refreshed: "2026-06-01T19:01:11Z",
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
        { account_name: "Accounting fees", current_balance: 0, comparison_balance: 3500 },
        { account_name: "Medical expenses", current_balance: 0, comparison_balance: 2252.17 },
        { account_name: "Bank Fees", current_balance: 0, comparison_balance: 2181.84 },
        { account_name: "Entertainment", current_balance: 0, comparison_balance: 3205.28 },
      ],
    },
    cash: {
      snapshot_date: "2026-05-31",
      cash_balance: 1243823.51,
      amount_owed: 1283105.21,
      amount_due: 0,
      working_capital: 384665.79,
    },
  };

  const isNetLoss = d.pnl.net_profit < 0;
  const currentRatio = d.position.current_assets / (d.position.current_liabilities || 1);
  const expenseChartData = d.pnl.expense_accounts.map((a) => ({
    name: a.account_name,
    value: a.comparison_balance || a.current_balance,
  }));
  const incomeChartData = d.pnl.income_accounts.map((a) => ({
    name: a.account_name,
    value: a.comparison_balance || a.current_balance,
  }));

  const COLORS = ["#8b5cf6", "#6366f1", "#a78bfa", "#7c3aed", "#c4b5fd"];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div>
          <h1 className="text-white font-semibold text-xl">Finance</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Live data · {d.org_name} · as of{" "}
            {new Date(d.last_refreshed).toLocaleString("en-ZA", {
              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-amber-300 text-sm">
          <AlertTriangle size={14} />
          {error} — Showing last known data.
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Alert banner for net loss */}
        {isNetLoss && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
            <TrendingDown size={16} className="text-red-400 shrink-0" />
            <div>
              <p className="text-red-300 font-medium text-sm">Net loss detected</p>
              <p className="text-red-400/70 text-xs mt-0.5">
                Last period: {fmt(Math.abs(d.pnl.net_profit))} loss. Expenses exceeded revenue by{" "}
                {((Math.abs(d.pnl.net_profit) / d.pnl.total_income) * 100).toFixed(1)}%.
              </p>
            </div>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            label="Cash Balance"
            value={fmt(d.cash.cash_balance)}
            sub="Available liquidity"
            highlight
          />
          <KPICard
            label="Working Capital"
            value={fmt(d.cash.working_capital)}
            sub={currentRatio < 1 ? "⚠ Current ratio < 1" : `Current ratio: ${currentRatio.toFixed(2)}`}
            trend={currentRatio >= 1 ? "up" : "down"}
          />
          <KPICard
            label="Net Equity"
            value={fmt(d.position.net_equity)}
            sub="Total assets minus liabilities"
            trend={d.position.net_equity > 0 ? "up" : "down"}
          />
          <KPICard
            label="Revenue (Last Period)"
            value={fmt(d.pnl.total_income)}
            sub={isNetLoss ? `Net loss: ${fmt(Math.abs(d.pnl.net_profit))}` : `Net profit: ${fmt(d.pnl.net_profit)}`}
            trend={isNetLoss ? "down" : "up"}
          />
        </div>

        {/* Balance sheet summary */}
        <div className="grid grid-cols-3 gap-4">
          <KPICard label="Total Assets" value={fmt(d.position.total_assets)} />
          <KPICard label="Total Liabilities" value={fmt(d.position.total_liabilities)} trend="down" />
          <KPICard label="Receivables" value={fmt(d.cash.amount_owed)} sub="Outstanding invoices" />
        </div>

        {/* Charts + AI */}
        <div className="grid grid-cols-5 gap-6">
          {/* Charts col */}
          <div className="col-span-2 space-y-6">
            {/* Income breakdown */}
            {incomeChartData.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <p className="text-white/70 text-sm font-medium">Revenue Streams</p>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={incomeChartData} barCategoryGap="30%">
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: "#0f0f17", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => fmt(Number(v))}
                      labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {incomeChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Expense breakdown */}
            {expenseChartData.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={14} className="text-red-400" />
                  <p className="text-white/70 text-sm font-medium">Expense Breakdown</p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={expenseChartData} layout="vertical" barCategoryGap="25%">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip
                      contentStyle={{ background: "#0f0f17", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => fmt(Number(v))}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {expenseChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* AI Advisor */}
          <div className="col-span-3" style={{ height: 560 }}>
            <AIAdvisor financialData={d} />
          </div>
        </div>
      </div>
    </div>
  );
}
