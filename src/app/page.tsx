import Link from "next/link";
import { TrendingUp, Settings, Megaphone, Users, ArrowRight } from "lucide-react";

const MODULES = [
  {
    label: "Finance",
    description: "P&L, cash flow, balance sheet · AI-powered CFO insights",
    href: "/finance",
    icon: TrendingUp,
    color: "from-violet-500 to-indigo-600",
    live: true,
  },
  {
    label: "Operations",
    description: "Projects, capacity, delivery performance",
    href: "/operations",
    icon: Settings,
    color: "from-slate-500 to-slate-700",
    live: false,
  },
  {
    label: "Sales & Marketing",
    description: "Pipeline, campaigns, revenue attribution",
    href: "/sales",
    icon: Megaphone,
    color: "from-slate-500 to-slate-700",
    live: false,
  },
  {
    label: "People",
    description: "Team, performance, culture",
    href: "/people",
    icon: Users,
    color: "from-slate-500 to-slate-700",
    live: false,
  },
];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-white">Good morning, Entity Y.</h1>
        <p className="text-white/40 mt-2">Your C-Suite Hub — every department, one view.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        {MODULES.map(({ label, description, href, icon: Icon, color, live }) => (
          <Link
            key={label}
            href={live ? href : "#"}
            className={`group relative rounded-2xl border p-6 transition-all ${
              live
                ? "border-white/10 hover:border-violet-500/40 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer"
                : "border-white/[0.04] bg-white/[0.01] cursor-not-allowed opacity-50"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white font-medium">{label}</p>
              {live && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                  Live
                </span>
              )}
              {!live && (
                <span className="text-[10px] bg-white/5 text-white/30 border border-white/10 px-1.5 py-0.5 rounded-full">
                  Coming soon
                </span>
              )}
            </div>
            <p className="text-white/40 text-sm">{description}</p>
            {live && (
              <ArrowRight
                size={16}
                className="absolute top-6 right-6 text-white/20 group-hover:text-violet-400 transition-colors"
              />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
