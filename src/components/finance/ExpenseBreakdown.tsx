"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

const data = [
  { name: "Staff / Contractors", value: 279740 },
  { name: "Software", value: 26000 },
  { name: "Occupancy", value: 23004 },
  { name: "General", value: 11000 },
  { name: "Marketing", value: 7000 },
  { name: "Phone / WiFi", value: 2250 },
];

const COLORS = ["#D7DF23", "#063F34", "#2A292A", "#D1D3D4", "#6b7280", "#9ca3af"];

export default function ExpenseBreakdown() {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
      <p className="text-white/60 text-xs uppercase tracking-wider mb-4">Expense Breakdown — Monthly Avg</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" barCategoryGap="25%">
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#2A292A",
              border: "1px solid rgba(215,223,35,0.2)",
              borderRadius: "8px",
              fontSize: 12,
            }}
            formatter={(v) => fmt(Number(v))}
            labelStyle={{ color: "#D1D3D4" }}
            itemStyle={{ color: "#D7DF23" }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
