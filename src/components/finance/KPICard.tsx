interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  highlight?: "lime" | "green" | "red" | "amber" | boolean;
  size?: "sm" | "default";
}

export default function KPICard({ label, value, sub, trend, highlight, size = "default" }: KPICardProps) {
  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-[#D1D3D4]/40";

  let cardClass = "bg-[#333332] border-[#D7DF23]/10 hover:border-[#D7DF23]/20";
  if (highlight === "lime" || highlight === true) {
    cardClass = "bg-[#D7DF23]/10 border-[#D7DF23]/30";
  } else if (highlight === "green") {
    cardClass = "bg-emerald-500/10 border-emerald-500/20";
  } else if (highlight === "red") {
    cardClass = "bg-red-500/10 border-red-500/20";
  } else if (highlight === "amber") {
    cardClass = "bg-amber-500/10 border-amber-500/20";
  }

  const padding = size === "sm" ? "p-4" : "p-5";
  const valueSize = size === "sm" ? "text-xl" : "text-2xl";

  return (
    <div className={`rounded-xl border transition-all ${cardClass} ${padding}`}>
      <p className="text-[#D1D3D4]/50 text-xs font-medium uppercase tracking-wider mb-3">{label}</p>
      <p className={`text-white ${valueSize} font-semibold`}>{value}</p>
      {sub && <p className={`text-xs mt-1.5 ${trendColor}`}>{sub}</p>}
    </div>
  );
}
