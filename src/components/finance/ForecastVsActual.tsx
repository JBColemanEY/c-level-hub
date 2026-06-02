"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

const data = [
  { month: "Jan", forecast: 300000, actual: 263004 },
  { month: "Feb", forecast: 310000, actual: 318764 },
  { month: "Mar", forecast: 330000, actual: 379801 },
  { month: "Apr", forecast: 360000, actual: 393988 },
  { month: "May", forecast: 385000, actual: 367764 },
];

const ANNUAL_TARGET = 5030000;
const YTD_ACTUAL = 1723321;
const YTD_TARGET = 2030000;
const BEHIND_BY = YTD_TARGET - YTD_ACTUAL; // 306,679
const PCT_OF_ANNUAL = ((YTD_ACTUAL / ANNUAL_TARGET) * 100).toFixed(1);

export default function ForecastVsActual() {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-white/60 text-xs uppercase tracking-wider">Forecast vs Actual Revenue</p>
        <span className="text-[10px] text-amber-400/80 border border-amber-500/20 bg-amber-500/10 rounded px-2 py-0.5">
          R{(BEHIND_BY / 1000).toFixed(0)}K behind YTD target
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="25%" barGap={3}>
          <XAxis
            dataKey="month"
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => fmt(Number(v))}
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <Tooltip
            contentStyle={{
              background: "#0d0d1a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => fmt(Number(v))}
            labelStyle={{ color: "rgba(255,255,255,0.6)" }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingTop: 8 }} />
          <Bar dataKey="forecast" name="Forecast" fill="rgba(255,255,255,0.12)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="actual" name="Actual" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Annual target progress */}
      <div>
        <div className="flex justify-between text-xs text-white/50 mb-1.5">
          <span>Annual Target Progress</span>
          <span className="text-white/70 font-medium">{fmt(YTD_ACTUAL)} of {fmt(ANNUAL_TARGET)} ({PCT_OF_ANNUAL}%)</span>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-2">
          <div
            className="bg-violet-500 h-2 rounded-full relative"
            style={{ width: `${PCT_OF_ANNUAL}%` }}
          />
        </div>
        {/* Target marker at ~40.4% (YTD target / annual) */}
        <div className="relative w-full mt-1" style={{ height: 16 }}>
          <div
            className="absolute flex flex-col items-center"
            style={{ left: `${((YTD_TARGET / ANNUAL_TARGET) * 100).toFixed(1)}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-px h-2 bg-amber-400/60" />
            <span className="text-[9px] text-amber-400/70 whitespace-nowrap">YTD target {fmt(YTD_TARGET)}</span>
          </div>
        </div>
        <p className="text-amber-400 text-xs font-medium mt-1">
          Behind YTD forecast by R{(BEHIND_BY / 1000).toFixed(0)}K — annual target at risk after 5 months
        </p>
      </div>
    </div>
  );
}
