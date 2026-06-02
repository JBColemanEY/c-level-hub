"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TrendingUp, Settings, Megaphone, Users, ArrowRight, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import IntelligencePanel from "@/components/IntelligencePanel";

const TODAY = new Date("2026-06-02").toLocaleDateString("en-ZA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

interface LiveData {
  cashBalance: number;
  mrrBase: number;
  activeRetainers: number;
  ytdRevenue: number;
  ytdTarget: number;
  currentMonthMargin: number;
  currentMonthProfit: number;
  totalOverdue: number;
  alerts: Array<{ type: string; title: string; detail: string }>;
  lastUpdated: string;
}

const STATIC_ALERTS = [
  {
    type: "critical",
    title: "90+ day receivables: R1,020,086 at write-off risk",
    detail: "PrideBet: R198,639 across 3 invoices. Immediate escalation required.",
  },
  {
    type: "warning",
    title: "31–60 day bucket: R67,324 approaching critical",
    detail: "4 clients at risk. Follow up this week before they age further.",
  },
  {
    type: "warning",
    title: "Break-even buffer: only R15,906 (4.4%)",
    detail: "Losing 1 mid-size client puts Entity Y in the red. No margin for churn.",
  },
  {
    type: "positive",
    title: "May profitable: R108,056 net profit (21.6% margin)",
    detail: "Best month YTD. MRR base holding at R359K across 19 active retainers.",
  },
];

const MODULES_BASE = [
  {
    label: "Finance",
    description: "P&L, cash flow, balance sheet · AI-powered CFO insights",
    href: "/finance",
    icon: TrendingUp,
    live: true,
  },
  {
    label: "Operations",
    description: "Projects, capacity, delivery performance",
    href: "/operations",
    icon: Settings,
    live: false,
  },
  {
    label: "Sales & Marketing",
    description: "Pipeline, campaigns, revenue attribution",
    href: "/sales",
    icon: Megaphone,
    live: false,
  },
  {
    label: "People",
    description: "Team, performance, culture",
    href: "/people",
    icon: Users,
    live: false,
  },
];

export default function Home() {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch("/api/finance/live");
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
      }
    } catch (e) {
      console.error("Failed to fetch live data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Build KPIs from live data or fallback
  const kpis = liveData
    ? [
        { label: "Cash", value: fmt(liveData.cashBalance), sub: "Available liquidity", color: "text-[#D7DF23]" },
        { label: "MRR", value: fmt(liveData.mrrBase), sub: `${liveData.activeRetainers} active retainers`, color: "text-white" },
        {
          label: "YTD Progress",
          value: `${(liveData.ytdRevenue / liveData.ytdTarget * 100).toFixed(1)}%`,
          sub: `vs ${fmt(liveData.ytdTarget)} target`,
          color: "text-amber-400",
        },
        {
          label: "Cur Month Margin",
          value: `${liveData.currentMonthMargin}%`,
          sub: `Net profit ${fmt(liveData.currentMonthProfit)}`,
          color: "text-emerald-400",
        },
        { label: "Overdue AR", value: fmt(liveData.totalOverdue), sub: "Receivables overdue", color: "text-red-400" },
        { label: "BE Buffer", value: "R15.9K", sub: "4.4% — thin", color: "text-amber-400" },
      ]
    : [
        { label: "Cash", value: "R1.24M", sub: "Available liquidity", color: "text-[#D7DF23]" },
        { label: "MRR", value: "R359K", sub: "19 active retainers", color: "text-white" },
        { label: "YTD Progress", value: "84.7%", sub: "vs R2.03M target", color: "text-amber-400" },
        { label: "May Margin", value: "30.1%", sub: "Net profit R108K", color: "text-emerald-400" },
        { label: "Overdue AR", value: "R1.25M", sub: "96% of receivables", color: "text-red-400" },
        { label: "BE Buffer", value: "R15.9K", sub: "4.4% — thin", color: "text-amber-400" },
      ];

  // Use live alerts if available and non-empty, else static
  const alerts =
    liveData && liveData.alerts && liveData.alerts.length > 0
      ? liveData.alerts.map((a) => ({ ...a, type: a.type === "info" ? "positive" : a.type }))
      : STATIC_ALERTS;

  // Finance module metrics
  const financeMetrics = liveData
    ? [
        `MRR ${fmt(liveData.mrrBase)}`,
        `Cash ${fmt(liveData.cashBalance)}`,
        `Margin ${liveData.currentMonthMargin}%`,
      ]
    : ["MRR R359K", "Cash R1.24M", "May +R108K"];

  const modules = MODULES_BASE.map((m) =>
    m.label === "Finance" ? { ...m, metrics: financeMetrics } : { ...m, metrics: [] as string[] }
  );

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Good morning, John.</h1>
          <p className="text-[#D1D3D4]/50 text-sm mt-1">{TODAY} · Entity Y C-Suite Hub</p>
        </div>
        <div className="flex items-center gap-3">
          {liveData && (
            <span className="text-xs text-[#D1D3D4]/30">
              Updated {new Date(liveData.lastUpdated).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {loading && <RefreshCw size={14} className="text-[#D1D3D4]/30 animate-spin" />}
          <span className="text-xs text-[#D1D3D4]/30 border border-white/[0.06] rounded-full px-3 py-1">
            All figures VAT-exclusive · ZAR
          </span>
        </div>
      </div>

      {/* Priority Alerts */}
      <div className="space-y-2">
        <p className="text-[#D1D3D4]/40 text-xs uppercase tracking-wider font-medium">Priority Alerts</p>
        {loading && !liveData ? (
          <div className="h-24 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
        ) : (
          alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl px-5 py-3.5 border ${
                alert.type === "critical"
                  ? "bg-red-500/10 border-red-500/20"
                  : alert.type === "positive"
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-amber-500/10 border-amber-500/20"
              }`}
            >
              {alert.type === "positive" ? (
                <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${alert.type === "critical" ? "text-red-400" : "text-amber-400"}`} />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  alert.type === "critical" ? "text-red-300" : alert.type === "positive" ? "text-emerald-300" : "text-amber-300"
                }`}>{alert.title}</p>
                <p className={`text-xs mt-0.5 ${
                  alert.type === "critical" ? "text-red-400/70" : alert.type === "positive" ? "text-emerald-400/70" : "text-amber-400/70"
                }`}>{alert.detail}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Business Vitals KPI Strip */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 transition-opacity ${loading && !liveData ? "opacity-50" : ""}`}>
            <p className="text-[#D1D3D4]/40 text-xs font-medium uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className={`text-xl font-semibold leading-none ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[#D1D3D4]/30 text-xs mt-1.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* AI Strategic Brief */}
      <IntelligencePanel
        module="overview"
        initialQuestion="Give me a C-suite morning brief for Entity Y. What are the top 3 things I need to know and act on today? Be specific with numbers."
        quickQuestions={["What's our biggest risk this week?", "Cash runway?", "Revenue outlook for June?", "Which clients need attention?"]}
      />

      {/* Department Cards */}
      <div>
        <p className="text-[#D1D3D4]/40 text-xs uppercase tracking-wider font-medium mb-3">Departments</p>
        <div className="grid grid-cols-2 gap-4">
          {modules.map(({ label, description, href, icon: Icon, live, metrics }) => (
            <Link
              key={label}
              href={live ? href : "#"}
              className={`group relative rounded-2xl border p-6 transition-all ${
                live
                  ? "border-[#D7DF23]/20 hover:border-[#D7DF23]/40 bg-white/[0.02] hover:bg-[#D7DF23]/5 cursor-pointer"
                  : "border-white/[0.04] bg-white/[0.01] cursor-not-allowed opacity-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                live ? "bg-[#D7DF23]/20" : "bg-white/[0.05]"
              }`}>
                <Icon size={18} className={live ? "text-[#D7DF23]" : "text-white/40"} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-medium">{label}</p>
                {live ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    Live
                  </span>
                ) : (
                  <span className="text-[10px] bg-white/5 text-white/30 border border-white/10 px-1.5 py-0.5 rounded-full">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-white/40 text-sm">{description}</p>
              {metrics.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {metrics.map((m) => (
                    <span key={m} className="text-[10px] text-[#D7DF23]/60 bg-[#D7DF23]/5 border border-[#D7DF23]/10 rounded px-2 py-0.5">
                      {m}
                    </span>
                  ))}
                </div>
              )}
              {live && (
                <ArrowRight
                  size={16}
                  className="absolute top-6 right-6 text-white/20 group-hover:text-[#D7DF23] transition-colors"
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
