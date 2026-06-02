"use client";

import { AlertTriangle } from "lucide-react";

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

// Aging buckets derived from data
const aging = [
  { label: "Current (0–30 days)", amount: 108898, color: "#34d399", pct: 8 },
  { label: "31–60 days", amount: 117365, color: "#fbbf24", pct: 9 },
  { label: "61–90 days", amount: 1083543, color: "#f97316", pct: 80 },
  { label: "90+ days", amount: 45397, color: "#f87171", pct: 3 },
];

const total = 1355203;

export default function ReceivablesPanel() {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 h-full">
      <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Receivables Aging</p>
      <p className="text-white text-2xl font-semibold mb-0.5">{fmt(total)}</p>
      <p className="text-white/40 text-xs mb-5">51 invoices outstanding</p>

      <div className="space-y-3 mb-5">
        {aging.map((bucket) => (
          <div key={bucket.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-white/60 text-xs">{bucket.label}</span>
              <span className="text-white/80 text-xs font-medium">{fmt(bucket.amount)}</span>
            </div>
            <div className="w-full bg-white/[0.05] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${bucket.pct}%`, backgroundColor: bucket.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Stacked bar visual */}
      <div className="flex h-3 rounded-full overflow-hidden mb-5">
        {aging.map((b) => (
          <div
            key={b.label}
            style={{ width: `${b.pct}%`, backgroundColor: b.color }}
            title={`${b.label}: ${fmt(b.amount)}`}
          />
        ))}
      </div>

      {/* PrideBet callout */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-xs font-semibold mb-1">PrideBet Entertainment Ghana</p>
            <p className="text-red-400/80 text-xs leading-relaxed">
              3 invoices · R198,639 total<br />
              R81,298 — due 8 Jun<br />
              R67,324 — 19 days overdue<br />
              R50,017 — 49 days overdue
            </p>
            <p className="text-red-400/60 text-xs mt-2">⚠ Account flagged: payment issues</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Total overdue</span>
          <span className="text-red-400 font-medium">R1,246,305 (96%)</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-white/40">Invoices overdue</span>
          <span className="text-red-400 font-medium">49 of 51</span>
        </div>
      </div>
    </div>
  );
}
