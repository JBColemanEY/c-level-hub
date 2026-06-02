"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Megaphone,
  Settings,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Finance", href: "/finance", icon: TrendingUp, active: true },
  { label: "Operations", href: "/operations", icon: Settings },
  { label: "Sales & Marketing", href: "/sales", icon: Megaphone, soon: true },
  { label: "People", href: "/people", icon: Users, soon: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-[#2A292A] border-r border-[#D7DF23]/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#D7DF23]/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D7DF23] flex items-center justify-center text-[#2A292A] font-bold text-sm tracking-tight">
            EY
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Entity Y</p>
            <p className="text-[#D1D3D4]/50 text-xs">C-Suite Hub</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ label, href, icon: Icon, soon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={soon ? "#" : href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                isActive
                  ? "bg-[#D7DF23]/15 text-[#D7DF23] font-medium border-l-2 border-[#D7DF23]"
                  : "text-[#D1D3D4]/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
              } ${soon ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {soon && (
                <span className="text-[10px] bg-[#D7DF23]/10 text-[#D7DF23]/60 px-1.5 py-0.5 rounded font-medium">
                  Soon
                </span>
              )}
              {isActive && <ChevronRight size={14} className="text-[#D7DF23]/70" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#D7DF23]/10">
        <p className="text-[#D1D3D4]/20 text-[10px] text-center uppercase tracking-wider">
          Performance Marketing. Commercial Outcomes.
        </p>
      </div>
    </aside>
  );
}
