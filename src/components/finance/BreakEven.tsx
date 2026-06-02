"use client";

import { AlertTriangle } from "lucide-react";

const FIXED_COSTS = 343858;
const CURRENT_MRR = 359764;
const BUFFER = CURRENT_MRR - FIXED_COSTS; // 15,906
const BUFFER_PCT = ((BUFFER / CURRENT_MRR) * 100).toFixed(1);
const FILL_PCT = Math.min((FIXED_COSTS / CURRENT_MRR) * 100, 100).toFixed(1);

function fmt(n: number) {
  if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

export default function BreakEven() {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-white/60 text-xs uppercase tracking-wider">Break-even Analysis</p>
        <AlertTriangle size={13} className="text-amber-400" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-white/50">Monthly fixed base</span>
          <span className="text-white/80 font-medium">{fmt(FIXED_COSTS)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/50">Current base MRR</span>
          <span className="text-emerald-400 font-medium">{fmt(CURRENT_MRR)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/50">Buffer above break-even</span>
          <span className="text-amber-400 font-semibold">{fmt(BUFFER)} ({BUFFER_PCT}%)</span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-white/30 mb-1">
          <span>Fixed costs</span>
          <span>MRR</span>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-3 relative overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-red-500 relative"
            style={{ width: `${FILL_PCT}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/20 mt-0.5">
          <span>R0</span>
          <span>{fmt(FIXED_COSTS)} fixed</span>
          <span>{fmt(CURRENT_MRR)} MRR</span>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
        <p className="text-amber-300 text-xs font-medium">Dangerously thin margin</p>
        <p className="text-amber-400/70 text-[10px] mt-0.5">
          Losing 1 mid-size client (~R25K/mo) puts you in the red. Only {BUFFER_PCT}% buffer above break-even.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/[0.02] rounded-lg p-2.5">
          <p className="text-white/30 mb-0.5">Avg LTV</p>
          <p className="text-white/80 font-semibold">R118,603</p>
        </div>
        <div className="bg-white/[0.02] rounded-lg p-2.5">
          <p className="text-white/30 mb-0.5">Avg MRR/client</p>
          <p className="text-white/80 font-semibold">R17,131</p>
        </div>
      </div>
    </div>
  );
}
