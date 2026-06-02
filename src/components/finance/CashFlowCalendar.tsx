"use client";

function fmtK(n: number) {
  if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n}`;
}

const cashflowGroups = [
  {
    date: "1st",
    clients: ["Chin & Partners", "Uyuni Lighting", "AVDMM"],
    amount: 52386,
  },
  {
    date: "5th",
    clients: ["EOME"],
    amount: 29980,
  },
  {
    date: "15th",
    clients: ["The Silk Lady", "St Leger & Viney"],
    amount: 32498,
  },
  {
    date: "20th",
    clients: ["The Golf Locker", "Transformar"],
    amount: 55696,
  },
  {
    date: "25th",
    clients: ["Black Elephant", "Cowgirlblues", "Rubyyes", "FlynPayLater", "Zippy Press"],
    amount: 101438,
  },
  {
    date: "30th",
    clients: ["Wayfare Culture", "Met-al"],
    amount: 63500,
  },
];

const total = cashflowGroups.reduce((s, g) => s + g.amount, 0);

export default function CashFlowCalendar() {
  let cumulative = 0;
  const maxAmount = Math.max(...cashflowGroups.map((g) => g.amount));

  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/60 text-xs uppercase tracking-wider">Cash Flow Calendar</p>
          <p className="text-white/40 text-xs mt-0.5">Expected retainer receipts this month</p>
        </div>
        <div className="text-right">
          <p className="text-violet-400 font-semibold text-lg">{fmtK(total)}</p>
          <p className="text-white/40 text-xs">expected this month</p>
        </div>
      </div>

      <div className="space-y-3">
        {cashflowGroups.map((group) => {
          cumulative += group.amount;
          const barPct = (group.amount / maxAmount) * 100;
          const cumPct = Math.round((cumulative / total) * 100);

          return (
            <div key={group.date} className="flex items-start gap-3">
              {/* Date pin */}
              <div className="w-10 shrink-0 text-center">
                <div className="bg-violet-500/20 border border-violet-500/30 rounded-lg py-1.5">
                  <p className="text-violet-300 text-xs font-bold">{group.date}</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white/60 text-xs truncate">{group.clients.join(", ")}</p>
                  <p className="text-white/90 text-sm font-semibold shrink-0 ml-2">{fmtK(group.amount)}</p>
                </div>
                <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <p className="text-white/25 text-xs mt-0.5">{fmtK(cumulative)} cumulative ({cumPct}%)</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Total expected inflow</span>
          <span className="text-emerald-400 font-semibold">{fmtK(total)} / month</span>
        </div>
        <p className="text-white/25 text-xs mt-1">
          Note: excludes Nubiance, TBAD (inactive) and PrideBet (payment issues)
        </p>
      </div>
    </div>
  );
}
