"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

// All months profitable once other income (VAT refunds, media) is included
const data = [
  { month: "Jan", profit: 2852, forecast: 19906 },
  { month: "Feb", profit: 24785, forecast: 19906 },
  { month: "Mar", profit: 96463, forecast: 33775 },
  { month: "Apr", profit: 23493, forecast: 60675 },
  { month: "May", profit: 108056, forecast: 86175 },
];

export default function ProfitBarChart() {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/60 text-xs uppercase tracking-wider">Monthly Net Profit — Jan–May 2026</p>
        <span className="text-[10px] text-emerald-400/70 border border-emerald-500/20 bg-emerald-500/10 rounded px-2 py-0.5">All months profitable</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} barCategoryGap="35%">
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
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
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
          <Bar dataKey="profit" name="Actual Profit" fill="#34d399" radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast Profit"
            stroke="#a78bfa"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={{ r: 3, fill: "#a78bfa", strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
