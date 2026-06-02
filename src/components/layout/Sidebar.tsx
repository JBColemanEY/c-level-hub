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
  { label: "Operations", href: "/operations", icon: Settings, soon: true },
  { label: "Sales & Marketing", href: "/sales", icon: Megaphone, soon: true },
  { label: "People", href: "/people", icon: Users, soon: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-[#0a0a0f] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            EY
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Entity Y</p>
            <p className="text-white/40 text-xs">C-Suite Hub</p>
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
                  ? "bg-violet-500/15 text-violet-300 font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              } ${soon ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {soon && (
                <span className="text-[10px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded">
                  Soon
                </span>
              )}
              {isActive && <ChevronRight size={14} className="text-violet-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <p className="text-white/20 text-xs text-center">Entity Y · 2026</p>
      </div>
    </aside>
  );
}
