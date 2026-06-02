"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Users, TrendingUp, ChevronDown, ExternalLink } from "lucide-react";
import KPICard from "@/components/finance/KPICard";
import IntelligencePanel from "@/components/IntelligencePanel";

interface OverdueTask {
  id: string;
  name: string;
  client?: string;
  status: string;
  assignees: string[];
  dueDate: string | null;
  daysOverdue: number;
  space: string;
  url: string;
  list?: string;
}

interface DueTodayTask {
  id: string;
  name: string;
  status: string;
  assignees: string[];
  space: string;
  url: string;
}

interface DueSoonTask {
  id: string;
  name: string;
  status: string;
  assignees: string[];
  dueDate: string | null;
  space: string;
  url: string;
}

interface ClientData {
  name: string;
  spaces: string[];
  total: number;
  completed: number;
  completionRate: number;
  slaCompliance: number;
  overdueCount: number;
  dueTodayCount: number;
  dueSoonCount: number;
  status: "healthy" | "at-risk" | "behind";
  overdueTasks: OverdueTask[];
  dueTodayTasks: DueTodayTask[];
  dueSoonTasks: DueSoonTask[];
  assignees: { name: string; total: number; overdue: number }[];
}

interface OpsData {
  lastUpdated: string;
  month: string;
  slaScore: number;
  overallCompletion: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  dueSoonTasks: number;
  unassigned: number;
  totalClients: number;
  healthyClients: number;
  atRiskClients: number;
  behindClients: number;
  teamCapacity: { name: string; total: number; overdue: number; completed: number }[];
  topOverdue: OverdueTask[];
  clients: ClientData[];
}

function StatusDot({ status }: { status: string }) {
  if (status === "healthy") return <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />;
  if (status === "at-risk") return <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />;
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />;
}

function SpaceBadge({ space }: { space: string }) {
  const colors: Record<string, string> = {
    "Video Production": "bg-purple-500/15 text-purple-300 border-purple-500/20",
    "Paid Media": "bg-blue-500/15 text-blue-300 border-blue-500/20",
    "Email Marketing": "bg-[#D7DF23]/10 text-[#D7DF23] border-[#D7DF23]/20",
  };
  const cls = colors[space] || "bg-white/10 text-white/60 border-white/10";
  const short = space === "Video Production" ? "Video" : space === "Paid Media" ? "Paid Media" : "Email";
  return <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${cls}`}>{short}</span>;
}

function slaColor(score: number) {
  if (score >= 90) return "green";
  if (score >= 70) return "amber";
  return "red";
}

export default function OperationsPage() {
  const [data, setData] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/operations/live");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const clientData = data?.clients.find(c => c.name === selectedClient);

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Operations</h1>
            <p className="text-[#D1D3D4]/50 text-sm mt-0.5">
              {data ? `${data.month} · SLA & delivery health` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className="text-[#D1D3D4]/30 text-xs">
                Updated {new Date(data.lastUpdated).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-[#333332] hover:bg-[#3d3d3b] border border-[#D7DF23]/15 text-[#D1D3D4]/70 hover:text-white rounded-lg px-3 py-2 text-sm transition-all disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            {/* Client selector */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-[#333332] hover:bg-[#3d3d3b] border border-[#D7DF23]/25 text-white rounded-lg px-4 py-2 text-sm transition-all min-w-[180px] justify-between"
              >
                <span className="truncate">{selectedClient === "all" ? "All Clients" : selectedClient}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[#2A292A] border border-[#D7DF23]/15 rounded-xl shadow-xl z-50 min-w-[220px] py-1 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedClient("all"); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedClient === "all" ? "text-[#D7DF23] bg-[#D7DF23]/10" : "text-[#D1D3D4]/70 hover:text-white hover:bg-white/5"}`}
                  >
                    All Clients
                  </button>
                  {data?.clients.map(c => (
                    <button
                      key={c.name}
                      onClick={() => { setSelectedClient(c.name); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${selectedClient === c.name ? "text-[#D7DF23] bg-[#D7DF23]/10" : "text-[#D1D3D4]/70 hover:text-white hover:bg-white/5"}`}
                    >
                      <StatusDot status={c.status} />
                      <span className="flex-1 truncate">{c.name}</span>
                      {c.overdueCount > 0 && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-medium">{c.overdueCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && !data && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-3">
              <RefreshCw size={32} className="animate-spin text-[#D7DF23] mx-auto" />
              <p className="text-[#D1D3D4]/50 text-sm">Fetching ClickUp data across all spaces…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0" />
            <div>
              <p className="text-red-300 font-medium text-sm">Failed to load operations data</p>
              <p className="text-red-400/60 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {data && selectedClient === "all" && (
          <>
            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <KPICard
                label="SLA Score"
                value={`${data.slaScore}%`}
                sub={data.slaScore >= 90 ? "On target" : data.slaScore >= 70 ? "Needs attention" : "Below target"}
                highlight={slaColor(data.slaScore) as any}
              />
              <KPICard
                label="Completion Rate"
                value={`${data.overallCompletion}%`}
                sub={`${data.completedTasks} of ${data.totalTasks} tasks`}
                highlight={data.overallCompletion >= 80 ? "green" : data.overallCompletion >= 60 ? "amber" : "red"}
              />
              <KPICard
                label="Overdue Tasks"
                value={String(data.overdueTasks)}
                sub={`Across ${data.behindClients + data.atRiskClients} clients`}
                highlight={data.overdueTasks === 0 ? "green" : data.overdueTasks <= 5 ? "amber" : "red"}
              />
              <KPICard
                label="Due Today"
                value={String(data.dueTodayTasks)}
                sub="Need attention now"
                highlight={data.dueTodayTasks > 0 ? "amber" : undefined}
              />
              <KPICard
                label="At Risk (48h)"
                value={String(data.dueSoonTasks)}
                sub="Due within 48 hours"
              />
              <KPICard
                label="Unassigned"
                value={String(data.unassigned)}
                sub="Tasks with no owner"
                highlight={data.unassigned > 3 ? "amber" : undefined}
              />
            </div>

            {/* 3-col grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Client Health Board */}
              <div className="bg-[#333332] rounded-xl border border-[#D7DF23]/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-[#D7DF23]/10 flex items-center justify-between">
                  <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                    <CheckCircle size={15} className="text-[#D7DF23]" />
                    Client Health
                  </h2>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-emerald-400">{data.healthyClients} healthy</span>
                    <span className="text-amber-400">{data.atRiskClients} at risk</span>
                    <span className="text-red-400">{data.behindClients} behind</span>
                  </div>
                </div>
                <div className="divide-y divide-[#D7DF23]/5 max-h-96 overflow-y-auto">
                  {data.clients.length === 0 && (
                    <p className="text-[#D1D3D4]/40 text-sm px-5 py-8 text-center">No client data for current month</p>
                  )}
                  {data.clients.map(client => (
                    <button
                      key={client.name}
                      onClick={() => setSelectedClient(client.name)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors text-left"
                    >
                      <StatusDot status={client.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{client.name}</p>
                        <p className="text-[#D1D3D4]/40 text-xs">{client.completionRate}% complete · {client.total} tasks</p>
                      </div>
                      {client.overdueCount > 0 && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-semibold shrink-0">
                          {client.overdueCount} overdue
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overdue Tasks */}
              <div className="bg-[#333332] rounded-xl border border-[#D7DF23]/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-[#D7DF23]/10">
                  <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                    <AlertTriangle size={15} className="text-red-400" />
                    Overdue Tasks
                    {data.overdueTasks > 0 && (
                      <span className="ml-1 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-semibold">{data.overdueTasks}</span>
                    )}
                  </h2>
                </div>
                <div className="divide-y divide-[#D7DF23]/5 max-h-96 overflow-y-auto">
                  {data.topOverdue.length === 0 && (
                    <p className="text-[#D1D3D4]/40 text-sm px-5 py-8 text-center">No overdue tasks</p>
                  )}
                  {data.topOverdue.map(task => (
                    <div key={task.id} className="px-5 py-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-white text-xs font-medium truncate">{task.name}</p>
                            {task.url && (
                              <a href={task.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[#D1D3D4]/30 hover:text-[#D7DF23]">
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                          <p className="text-[#D1D3D4]/40 text-[11px]">
                            {task.client} · {task.assignees.join(", ") || "Unassigned"}
                          </p>
                        </div>
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-semibold shrink-0 whitespace-nowrap">
                          {task.daysOverdue}d
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Capacity */}
              <div className="bg-[#333332] rounded-xl border border-[#D7DF23]/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-[#D7DF23]/10">
                  <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Users size={15} className="text-[#D7DF23]" />
                    Team Capacity
                  </h2>
                </div>
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {data.teamCapacity.length === 0 && (
                    <p className="text-[#D1D3D4]/40 text-sm text-center py-4">No assignee data</p>
                  )}
                  {data.teamCapacity.map((member, i) => {
                    const completionPct = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-xs font-medium truncate flex-1 mr-2">{member.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {member.overdue > 0 && (
                              <span className="text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded">{member.overdue} overdue</span>
                            )}
                            <span className="text-[#D1D3D4]/40 text-xs">{member.total} tasks</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-[#2A292A] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#D7DF23] transition-all"
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                        <p className="text-[#D1D3D4]/30 text-[10px] mt-0.5">{completionPct}% complete</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Advisor */}
            <IntelligencePanel
              module="Operations"
              initialQuestion={`Analyse our operations health for ${data.month}. SLA Score: ${data.slaScore}%, Completion: ${data.overallCompletion}%, Overdue: ${data.overdueTasks} tasks, ${data.behindClients} clients behind. What are the key risks and what actions should we prioritise this week?`}
            />
          </>
        )}

        {/* Per-client view */}
        {data && selectedClient !== "all" && clientData && (
          <>
            {/* Client header */}
            <div className="flex items-center gap-4">
              <StatusDot status={clientData.status} />
              <div>
                <h2 className="text-xl font-bold text-white">{clientData.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {clientData.spaces.map(s => <SpaceBadge key={s} space={s} />)}
                </div>
              </div>
            </div>

            {/* Client KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <KPICard
                label="SLA Compliance"
                value={`${clientData.slaCompliance}%`}
                sub="Completed on time"
                highlight={slaColor(clientData.slaCompliance) as any}
              />
              <KPICard
                label="Completion Rate"
                value={`${clientData.completionRate}%`}
                sub={`${clientData.completed} of ${clientData.total} tasks`}
                highlight={clientData.completionRate >= 80 ? "green" : clientData.completionRate >= 60 ? "amber" : "red"}
              />
              <KPICard
                label="Overdue"
                value={String(clientData.overdueCount)}
                sub="Tasks past due date"
                highlight={clientData.overdueCount === 0 ? "green" : clientData.overdueCount <= 2 ? "amber" : "red"}
              />
              <KPICard
                label="Due Today"
                value={String(clientData.dueTodayCount)}
                sub="Need action today"
                highlight={clientData.dueTodayCount > 0 ? "amber" : undefined}
              />
              <KPICard
                label="At Risk (48h)"
                value={String(clientData.dueSoonCount)}
                sub="Due within 48 hours"
              />
            </div>

            {/* 2-col grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overdue tasks */}
              <div className="bg-[#333332] rounded-xl border border-[#D7DF23]/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-[#D7DF23]/10">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-400" />
                    Overdue Tasks
                    {clientData.overdueCount > 0 && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-semibold">{clientData.overdueCount}</span>
                    )}
                  </h3>
                </div>
                <div className="divide-y divide-[#D7DF23]/5">
                  {clientData.overdueTasks.length === 0 && (
                    <p className="text-emerald-400/60 text-sm px-5 py-6 flex items-center gap-2">
                      <CheckCircle size={14} /> No overdue tasks
                    </p>
                  )}
                  {clientData.overdueTasks.map(task => (
                    <div key={task.id} className="px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-white text-sm font-medium truncate">{task.name}</p>
                            {task.url && (
                              <a href={task.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[#D1D3D4]/30 hover:text-[#D7DF23]">
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <SpaceBadge space={task.space} />
                            <span className="text-[#D1D3D4]/40 text-[11px]">
                              {task.assignees.join(", ") || "Unassigned"}
                            </span>
                            {task.dueDate && (
                              <span className="text-[#D1D3D4]/30 text-[11px]">Due {task.dueDate}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-1 rounded font-semibold shrink-0">
                          {task.daysOverdue}d overdue
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Due today + soon */}
              <div className="space-y-4">
                <div className="bg-[#333332] rounded-xl border border-[#D7DF23]/10 overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#D7DF23]/10">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                      <Clock size={14} className="text-amber-400" />
                      Due Today
                    </h3>
                  </div>
                  <div className="divide-y divide-[#D7DF23]/5">
                    {clientData.dueTodayTasks.length === 0 && (
                      <p className="text-[#D1D3D4]/30 text-sm px-5 py-4">Nothing due today</p>
                    )}
                    {clientData.dueTodayTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{task.name}</p>
                          <p className="text-[#D1D3D4]/40 text-xs">{task.assignees.join(", ") || "Unassigned"}</p>
                        </div>
                        <SpaceBadge space={task.space} />
                        {task.url && (
                          <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-[#D1D3D4]/30 hover:text-[#D7DF23]">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#333332] rounded-xl border border-[#D7DF23]/10 overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#D7DF23]/10">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                      <TrendingUp size={14} className="text-[#D7DF23]" />
                      Due Soon (48h)
                    </h3>
                  </div>
                  <div className="divide-y divide-[#D7DF23]/5">
                    {clientData.dueSoonTasks.length === 0 && (
                      <p className="text-[#D1D3D4]/30 text-sm px-5 py-4">Nothing due in 48 hours</p>
                    )}
                    {clientData.dueSoonTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{task.name}</p>
                          <p className="text-[#D1D3D4]/40 text-xs">{task.dueDate} · {task.assignees.join(", ") || "Unassigned"}</p>
                        </div>
                        <SpaceBadge space={task.space} />
                        {task.url && (
                          <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-[#D1D3D4]/30 hover:text-[#D7DF23]">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Assignee breakdown */}
            {clientData.assignees.length > 0 && (
              <div className="bg-[#333332] rounded-xl border border-[#D7DF23]/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-[#D7DF23]/10">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Users size={14} className="text-[#D7DF23]" />
                    Assignee Breakdown
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
                  {clientData.assignees.map((a, i) => (
                    <div key={i} className="bg-[#2A292A] rounded-lg p-4">
                      <p className="text-white text-sm font-medium truncate mb-1">{a.name}</p>
                      <p className="text-[#D1D3D4]/50 text-xs">{a.total} tasks assigned</p>
                      {a.overdue > 0 && (
                        <p className="text-red-400 text-xs mt-0.5">{a.overdue} overdue</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Advisor */}
            <IntelligencePanel
              module="Operations"
              initialQuestion={`Analyse delivery health for client "${clientData.name}" in ${data.month}. SLA: ${clientData.slaCompliance}%, Completion: ${clientData.completionRate}%, Overdue tasks: ${clientData.overdueCount}. ${clientData.overdueTasks.length > 0 ? `Overdue tasks include: ${clientData.overdueTasks.slice(0, 3).map(t => t.name).join(", ")}.` : ""} What should we prioritise to get back on track?`}
            />
          </>
        )}

        {/* Client selected but not found */}
        {data && selectedClient !== "all" && !clientData && (
          <div className="bg-[#333332] rounded-xl border border-[#D7DF23]/10 p-8 text-center">
            <p className="text-[#D1D3D4]/50 text-sm">No data found for {selectedClient} in the current month.</p>
          </div>
        )}
      </div>
    </div>
  );
}
