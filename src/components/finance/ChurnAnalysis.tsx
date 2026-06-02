"use client";

import { AlertTriangle, TrendingDown } from "lucide-react";

const churned = [
  { name: "Luxity", monthly: 41000 },
  { name: "Piffany Copenhagen", monthly: 25000 },
  { name: "African Jacquard", monthly: 14998 },
  { name: "ECape Moringa", monthly: 10000 },
  { name: "Pupsak", monthly: 5000 },
  { name: "iGoda Incubator", monthly: 0 },
  { name: "Zorora", monthly: 0 },
  { name: "Umbiie", monthly: 0 },
  { name: "Nicholas & Co", monthly: 0 },
  { name: "Kimberley Diamond", monthly: 0 },
];

// 3-4 month contracts that started ~Jan-Mar 2026 — ending or expired soon
const atRisk = [
  { name: "The Steam Bar", value: 25998, note: "4-month, started Jan — ENDING NOW", severity: "ending" as const },
  { name: "The Golf Locker", value: 38696, note: "3-month contract", severity: "risk" as const },
  { name: "Wayfare Culture", value: 39500, note: "3-month contract", severity: "risk" as const },
  { name: "EOME", value: 29980, note: "3-month contract", severity: "risk" as const },
  { name: "AVDMM", value: 27053, note: "3-month contract", severity: "risk" as const },
  { name: "Zippy Press", value: 27720, note: "3-month contract", severity: "risk" as const },
  { name: "Met-al", value: 24000, note: "3-month contract", severity: "risk" as const },
  { name: "FlynPayLater", value: 18320, note: "3-month contract", severity: "risk" as const },
  { name: "Transformar", value: 17000, note: "4-month contract", severity: "risk" as const },
  { name: "Robin Sprong", value: 13999, note: "6-month, started ~Jan", severity: "risk" as const },
];

const AT_RISK_MRR = atRisk.reduce((s, c) => s + c.value, 0);
const MRR_2025 = 381909;
const MRR_2026 = 359764;
const MRR_LOST = MRR_2025 - MRR_2026;

function fmt(n: number) {
  if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n}`;
}

export default function ChurnAnalysis() {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 space-y-5">
      <p className="text-white/60 text-xs uppercase tracking-wider">Churn Analysis</p>

      {/* MRR comparison */}
      <div className="flex items-start gap-3 bg-red-500/[0.06] border border-red-500/20 rounded-lg px-4 py-3">
        <TrendingDown size={14} className="text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-red-300 font-medium text-sm">Base MRR declined year-on-year</p>
          <p className="text-white/50 text-xs mt-0.5">
            2025 MRR: R{MRR_2025.toLocaleString("en-ZA")} → 2026 MRR: R{MRR_2026.toLocaleString("en-ZA")}
            <span className="text-red-400 font-medium ml-1">−R{MRR_LOST.toLocaleString("en-ZA")}/month</span>
          </p>
        </div>
      </div>

      {/* Churned clients */}
      <div>
        <p className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">Churned from 2025</p>
        <div className="space-y-1">
          {churned.filter(c => c.monthly > 0).map((c) => (
            <div key={c.name} className="flex justify-between text-xs">
              <span className="text-white/60">{c.name}</span>
              <span className="text-red-400 font-medium">−{fmt(c.monthly)}/mo</span>
            </div>
          ))}
          <div className="flex justify-between text-xs text-white/30 pt-1 border-t border-white/[0.05]">
            <span>+ 5 others (iGoda, Zorora, Umbiie, Nicholas & Co, Kimberley Diamond)</span>
            <span>-</span>
          </div>
        </div>
      </div>

      {/* At-risk clients */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={12} className="text-amber-400" />
          <p className="text-amber-400 text-xs font-medium uppercase tracking-wider">Churn Risk — Short-term Contracts</p>
        </div>
        <div className="space-y-1">
          {atRisk.map((c) => (
            <div key={c.name} className={`flex justify-between items-center text-xs rounded px-2 py-1 ${
              c.severity === "ending" ? "bg-red-500/10 border border-red-500/20" : "bg-amber-500/[0.05]"
            }`}>
              <div>
                <span className={c.severity === "ending" ? "text-red-300 font-medium" : "text-white/60"}>{c.name}</span>
                <span className={`ml-2 text-[10px] ${c.severity === "ending" ? "text-red-400" : "text-amber-500/70"}`}>
                  {c.note}
                </span>
              </div>
              <span className={`font-medium ${c.severity === "ending" ? "text-red-400" : "text-amber-400"}`}>
                {fmt(c.value)}/mo
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <p className="text-amber-300 text-xs font-semibold">R{AT_RISK_MRR.toLocaleString("en-ZA")} MRR at risk from short-term contracts</p>
          <p className="text-amber-400/60 text-[10px] mt-0.5">Renewing or converting these to longer terms is a top retention priority</p>
        </div>
      </div>
    </div>
  );
}
