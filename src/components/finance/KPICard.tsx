interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
}

export default function KPICard({ label, value, sub, trend, highlight }: KPICardProps) {
  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-white/40";

  return (
    <div
      className={`rounded-xl p-5 border transition-all ${
        highlight
          ? "bg-violet-500/10 border-violet-500/30"
          : "bg-white/[0.03] border-white/[0.06] hover:border-white/10"
      }`}
    >
      <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">{label}</p>
      <p className="text-white text-2xl font-semibold">{value}</p>
      {sub && <p className={`text-xs mt-1.5 ${trendColor}`}>{sub}</p>}
    </div>
  );
}
