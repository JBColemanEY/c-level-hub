"use client";

function fmt(n: number) {
  if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

type ClientStatus = "active" | "inactive" | "issues";

interface Client {
  name: string;
  value: number;
  due?: string;
  status: ClientStatus;
}

const clients: Client[] = [
  { name: "Wayfare Culture", value: 39500, due: "30th", status: "active" },
  { name: "The Golf Locker", value: 38696, due: "20th", status: "active" },
  { name: "EOME", value: 29980, due: "5th", status: "active" },
  { name: "Zippy Press", value: 27720, due: "25th", status: "active" },
  { name: "AVDMM", value: 27053, due: "1st", status: "active" },
  { name: "Ergonomicsdirect", value: 25000, due: "25th", status: "active" },
  { name: "Met-al", value: 24000, due: "30th", status: "active" },
  { name: "FlynPayLater", value: 18320, due: "25th", status: "active" },
  { name: "Chin & Partners", value: 17000, due: "1st", status: "active" },
  { name: "Transformar", value: 17000, due: "20th", status: "active" },
  { name: "The Silk Lady", value: 15500, due: "15th", status: "active" },
  { name: "Black Elephant", value: 14999, due: "25th", status: "active" },
  { name: "Rubyyes", value: 12999, due: "25th", status: "active" },
  { name: "St Leger & Viney", value: 16998, due: "15th", status: "active" },
  { name: "Uyuni Lighting", value: 8333, due: "1st", status: "active" },
  { name: "Mr. Wattson", value: 8333, status: "active" },
  { name: "Ekta Living", value: 8333, status: "active" },
  { name: "Cowgirlblues", value: 8000, due: "25th", status: "active" },
  { name: "Nubiance", value: 0, status: "inactive" },
  { name: "TBAD", value: 0, status: "inactive" },
  { name: "PrideBet", value: 0, status: "issues" },
];

const statusConfig: Record<ClientStatus, { label: string; classes: string }> = {
  active: { label: "Active", classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  inactive: { label: "Inactive", classes: "bg-white/[0.05] text-white/30 border-white/[0.08]" },
  issues: { label: "⚠ Payment Issues", classes: "bg-red-500/15 text-red-400 border-red-500/20" },
};

const activeTotal = clients
  .filter((c) => c.status === "active")
  .reduce((s, c) => s + c.value, 0);

export default function ClientRetainerBoard() {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/60 text-xs uppercase tracking-wider">Client Retainer Board</p>
          <p className="text-white/40 text-xs mt-0.5">Monthly recurring revenue by client</p>
        </div>
        <div className="text-right">
          <p className="text-emerald-400 font-semibold text-lg">R{activeTotal.toLocaleString("en-ZA")}</p>
          <p className="text-white/40 text-xs">19 active clients / month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {clients.map((client) => {
          const sc = statusConfig[client.status];
          return (
            <div
              key={client.name}
              className={`rounded-lg border px-3 py-2.5 flex items-center justify-between gap-2 ${
                client.status === "inactive"
                  ? "bg-white/[0.01] border-white/[0.04] opacity-50"
                  : client.status === "issues"
                  ? "bg-red-500/[0.05] border-red-500/20"
                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/10 transition-colors"
              }`}
            >
              <div className="min-w-0">
                <p className="text-white/80 text-xs font-medium truncate">{client.name}</p>
                {client.due && (
                  <p className="text-white/30 text-xs">Due {client.due}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {client.value > 0 ? (
                  <p className="text-white/90 text-sm font-semibold">{fmt(client.value)}</p>
                ) : null}
                <span className={`text-[10px] font-medium border rounded px-1.5 py-0.5 ${sc.classes}`}>
                  {sc.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] flex gap-6 text-xs">
        <div>
          <span className="text-white/40">Active MRR</span>
          <span className="text-emerald-400 font-semibold ml-2">R{activeTotal.toLocaleString("en-ZA")}</span>
        </div>
        <div>
          <span className="text-white/40">Clients</span>
          <span className="text-white/70 font-semibold ml-2">19 active · 2 inactive · 1 flagged</span>
        </div>
      </div>
    </div>
  );
}
