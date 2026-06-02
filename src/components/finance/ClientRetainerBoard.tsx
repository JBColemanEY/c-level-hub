"use client";

function fmt(n: number) {
  if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

type ClientStatus = "active" | "inactive" | "issues";
type RiskLevel = "anchor" | "stable" | "risk" | "ending" | "none";

interface Client {
  name: string;
  value: number;
  due?: string;
  status: ClientStatus;
  lifetime: number; // months
  risk: RiskLevel;
  note?: string;
  // short-term clients outside main retainers
  shortTerm?: boolean;
}

const clients: Client[] = [
  // Short-term (ending/at-risk) — sorted first by severity
  { name: "The Steam Bar", value: 25998, due: undefined, status: "active", lifetime: 4, risk: "ending", note: "4-month, started Jan — ENDING", shortTerm: true },
  // Main retainers sorted by value desc, at-risk flagged
  { name: "Wayfare Culture", value: 39500, due: "30th", status: "active", lifetime: 3, risk: "risk" },
  { name: "The Golf Locker", value: 38696, due: "20th", status: "active", lifetime: 3, risk: "risk" },
  { name: "EOME", value: 29980, due: "5th", status: "active", lifetime: 3, risk: "risk" },
  { name: "Zippy Press", value: 27720, due: "25th", status: "active", lifetime: 3, risk: "risk" },
  { name: "AVDMM", value: 27053, due: "1st", status: "active", lifetime: 3, risk: "risk" },
  { name: "Ergonomicsdirect", value: 25000, due: "25th", status: "active", lifetime: 24, risk: "anchor", note: "24-month anchor" },
  { name: "Met-al", value: 24000, due: "30th", status: "active", lifetime: 3, risk: "risk" },
  { name: "Robin Sprong", value: 13999, due: undefined, status: "active", lifetime: 6, risk: "risk", note: "6-month", shortTerm: true },
  { name: "Flying Brick", value: 16998, due: undefined, status: "active", lifetime: 8, risk: "stable", note: "8-month, started Feb", shortTerm: true },
  { name: "UDARKIE", value: 14998, due: undefined, status: "active", lifetime: 6, risk: "stable", note: "6-month", shortTerm: true },
  { name: "FlynPayLater", value: 18320, due: "25th", status: "active", lifetime: 3, risk: "risk" },
  { name: "Transformar", value: 17000, due: "20th", status: "active", lifetime: 4, risk: "risk" },
  { name: "Chin & Partners", value: 17000, due: "1st", status: "active", lifetime: 21, risk: "anchor", note: "21-month anchor" },
  { name: "St Leger & Viney", value: 16998, due: "15th", status: "active", lifetime: 8, risk: "stable" },
  { name: "The Silk Lady", value: 15500, due: "15th", status: "active", lifetime: 17, risk: "stable" },
  { name: "Black Elephant", value: 14999, due: "25th", status: "active", lifetime: 15, risk: "stable" },
  { name: "Rubyyes", value: 12999, due: "25th", status: "active", lifetime: 8, risk: "stable" },
  { name: "Cowgirlblues", value: 8000, due: "25th", status: "active", lifetime: 15, risk: "stable", note: "Reduced from R10K" },
  { name: "Uyuni Lighting", value: 8333, due: "1st", status: "active", lifetime: 14, risk: "stable" },
  { name: "Mr. Wattson", value: 8333, status: "active", lifetime: 3, risk: "stable" },
  { name: "Ekta Living", value: 8333, status: "active", lifetime: 3, risk: "stable" },
  { name: "PrideBet", value: 0, status: "issues", lifetime: 0, risk: "none", note: "R198,639 outstanding — 3 invoices overdue" },
  { name: "Nubiance", value: 0, status: "inactive", lifetime: 0, risk: "none" },
  { name: "TBAD", value: 0, status: "inactive", lifetime: 0, risk: "none" },
];

const riskConfig: Record<RiskLevel, { label: string; classes: string } | null> = {
  ending: { label: "Ending", classes: "bg-red-500/20 text-red-300 border-red-500/30" },
  risk: { label: "Churn Risk", classes: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  anchor: { label: "Anchor", classes: "bg-[#D7DF23]/15 text-[#D7DF23] border-[#D7DF23]/25" },
  stable: null,
  none: null,
};

const statusConfig: Record<ClientStatus, { label: string; classes: string }> = {
  active: { label: "Active", classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  inactive: { label: "Inactive", classes: "bg-white/[0.05] text-white/30 border-white/[0.08]" },
  issues: { label: "⚠ Payment Issues", classes: "bg-red-500/15 text-red-400 border-red-500/20" },
};

const activeTotal = clients
  .filter((c) => c.status === "active")
  .reduce((s, c) => s + c.value, 0);

const activeCount = clients.filter((c) => c.status === "active").length;

export default function ClientRetainerBoard() {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/60 text-xs uppercase tracking-wider">Client Retainer Board</p>
          <p className="text-white/40 text-xs mt-0.5">Monthly recurring revenue by client · includes short-term projects</p>
        </div>
        <div className="text-right">
          <p className="text-emerald-400 font-semibold text-lg">R{activeTotal.toLocaleString("en-ZA")}</p>
          <p className="text-white/40 text-xs">{activeCount} active clients / month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {clients.map((client) => {
          const sc = statusConfig[client.status];
          const rc = client.risk !== "none" ? riskConfig[client.risk] : null;
          const cardBg =
            client.risk === "ending"
              ? "bg-red-500/[0.07] border-red-500/25"
              : client.status === "inactive"
              ? "bg-white/[0.01] border-white/[0.04] opacity-50"
              : client.status === "issues"
              ? "bg-red-500/[0.05] border-red-500/20"
              : client.risk === "risk"
              ? "bg-amber-500/[0.04] border-amber-500/15 hover:border-amber-500/25 transition-colors"
              : client.risk === "anchor"
              ? "bg-[#D7DF23]/[0.04] border-[#D7DF23]/15 hover:border-[#D7DF23]/25 transition-colors"
              : "bg-white/[0.02] border-white/[0.06] hover:border-white/10 transition-colors";

          return (
            <div
              key={client.name}
              className={`rounded-lg border px-3 py-2.5 ${cardBg}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-white/80 text-xs font-medium truncate">{client.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {client.due && (
                      <p className="text-white/30 text-xs">Due {client.due}</p>
                    )}
                    {client.lifetime > 0 && (
                      <span className="text-white/20 text-[10px]">{client.lifetime}mo LT</span>
                    )}
                    {client.note && (
                      <span className="text-white/30 text-[10px] italic">{client.note}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {client.value > 0 ? (
                    <p className="text-white/90 text-sm font-semibold">{fmt(client.value)}</p>
                  ) : null}
                  {rc ? (
                    <span className={`text-[10px] font-medium border rounded px-1.5 py-0.5 block mt-0.5 ${rc.classes}`}>
                      {rc.label}
                    </span>
                  ) : (
                    <span className={`text-[10px] font-medium border rounded px-1.5 py-0.5 block mt-0.5 ${sc.classes}`}>
                      {sc.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap gap-6 text-xs">
        <div>
          <span className="text-white/40">Active MRR</span>
          <span className="text-emerald-400 font-semibold ml-2">R{activeTotal.toLocaleString("en-ZA")}</span>
        </div>
        <div>
          <span className="text-white/40">Anchor clients</span>
          <span className="text-[#D7DF23] font-semibold ml-2">Ergonomicsdirect + Chin &amp; Partners</span>
        </div>
        <div>
          <span className="text-white/40">⚠ At risk</span>
          <span className="text-amber-400 font-semibold ml-2">9 clients on 3-4 month contracts</span>
        </div>
        <div>
          <span className="text-white/40">PrideBet outstanding</span>
          <span className="text-red-400 font-semibold ml-2">R198,639</span>
        </div>
      </div>
    </div>
  );
}
