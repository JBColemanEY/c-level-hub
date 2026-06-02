"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

// Total income (retainer + other income: VAT refunds, media pass-throughs, etc.)
const data = [
  { month: "Jan", revenue: 303013, expenses: 300161, profit: 2852 },
  { month: "Feb", revenue: 343764, expenses: 318979, profit: 24785 },
  { month: "Mar", revenue: 434887, expenses: 338424, profit: 96463 },
  { month: "Apr", revenue: 393988, expenses: 370495, profit: 23493 },
  { month: "May", revenue: 501116, expenses: 393060, profit: 108056 },
];

export default function RevExpChart() {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
      <p className="text-white/60 text-xs uppercase tracking-wider mb-4">Total Income vs Expenses — Jan–May 2026</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
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
            cursor={{ stroke: "rgba(255,255,255,0.06)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingTop: 8 }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Total Income"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            name="Net Profit"
            stroke="#34d399"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={{ r: 3, fill: "#34d399", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
