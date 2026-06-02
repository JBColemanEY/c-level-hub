import { NextResponse } from "next/server";

const CLICKUP_TOKEN = process.env.CLICKUP_API_TOKEN!;
const HEADERS = { "Authorization": CLICKUP_TOKEN, "Content-Type": "application/json" };

const SPACES = {
  videoProd: "90124074875",
  paidMedia: "90124368632",
  email: "90124647767",
};

async function getSpaceFolders(spaceId: string) {
  const res = await fetch(`https://api.clickup.com/api/v2/space/${spaceId}/folder?archived=false`, { headers: HEADERS });
  const data = await res.json();
  return (data.folders || []) as any[];
}

async function getFolderLists(folderId: string) {
  const res = await fetch(`https://api.clickup.com/api/v2/folder/${folderId}/list?archived=false`, { headers: HEADERS });
  const data = await res.json();
  return (data.lists || []) as any[];
}

async function getListTasks(listId: string) {
  const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task?include_closed=true&subtasks=false`, { headers: HEADERS });
  const data = await res.json();
  return (data.tasks || []) as any[];
}

function getCurrentMonthFilter(lists: any[]) {
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthNames[now.getMonth()];
  const currentFullMonth = fullMonths[now.getMonth()];
  const currentYear = String(now.getFullYear()).slice(2);

  return lists.filter(l => {
    const name = l.name.toLowerCase();
    return (name.includes(currentMonth.toLowerCase()) || name.includes(currentFullMonth.toLowerCase())) && name.includes(currentYear);
  });
}

function isOverdue(task: any): boolean {
  if (!task.due_date) return false;
  if (isComplete(task)) return false;
  return Date.now() > parseInt(task.due_date);
}

function isDueToday(task: any): boolean {
  if (!task.due_date) return false;
  if (isComplete(task)) return false;
  const due = new Date(parseInt(task.due_date));
  const today = new Date();
  return due.toDateString() === today.toDateString();
}

function isDueSoon(task: any): boolean {
  if (!task.due_date) return false;
  if (isComplete(task)) return false;
  const due = parseInt(task.due_date);
  const in48h = Date.now() + 48 * 60 * 60 * 1000;
  return due > Date.now() && due <= in48h;
}

function isComplete(task: any): boolean {
  const s = task.status?.status?.toLowerCase();
  return s === "complete" || s === "closed" || s === "done";
}

export async function GET() {
  try {
    const now = new Date();

    const [vpFolders, pmFolders, emFolders] = await Promise.all([
      getSpaceFolders(SPACES.videoProd),
      getSpaceFolders(SPACES.paidMedia),
      getSpaceFolders(SPACES.email),
    ]);

    const clientMap: Record<string, { name: string; tasks: any[]; spaces: string[] }> = {};

    const processSpace = async (folders: any[], spaceName: string) => {
      for (const folder of folders) {
        if (folder.name === "SOPs" || folder.name.includes("SOP")) continue;
        const clientName = folder.name.trim();
        const lists = await getFolderLists(folder.id);
        const currentLists = getCurrentMonthFilter(lists);

        for (const list of currentLists) {
          const tasks = await getListTasks(list.id);
          if (!clientMap[clientName]) {
            clientMap[clientName] = { name: clientName, tasks: [], spaces: [] };
          }
          clientMap[clientName].tasks.push(...tasks.map((t: any) => ({ ...t, _space: spaceName, _list: list.name })));
          if (!clientMap[clientName].spaces.includes(spaceName)) {
            clientMap[clientName].spaces.push(spaceName);
          }
        }
      }
    };

    await processSpace(vpFolders, "Video Production");
    await processSpace(pmFolders, "Paid Media");
    await processSpace(emFolders, "Email Marketing");

    const clients = Object.values(clientMap).map(client => {
      const tasks = client.tasks;
      const total = tasks.length;
      const completed = tasks.filter(isComplete).length;
      const overdue = tasks.filter(isOverdue);
      const dueToday = tasks.filter(isDueToday);
      const dueSoon = tasks.filter(isDueSoon);
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;

      const completedOnTime = tasks.filter(t => {
        if (!isComplete(t)) return false;
        if (!t.due_date || !t.date_closed) return true;
        return parseInt(t.date_closed) <= parseInt(t.due_date);
      }).length;
      const slaCompliance = completed > 0 ? Math.round((completedOnTime / completed) * 100) : 100;

      const assigneeMap: Record<string, { name: string; total: number; overdue: number }> = {};
      tasks.forEach((t: any) => {
        (t.assignees || []).forEach((a: any) => {
          if (!assigneeMap[a.id]) assigneeMap[a.id] = { name: a.username || a.email || "Unknown", total: 0, overdue: 0 };
          assigneeMap[a.id].total++;
          if (isOverdue(t)) assigneeMap[a.id].overdue++;
        });
      });

      const status = overdue.length === 0 ? "healthy" : overdue.length <= 2 ? "at-risk" : "behind";

      return {
        name: client.name,
        spaces: client.spaces,
        total,
        completed,
        completionRate,
        slaCompliance,
        overdueCount: overdue.length,
        dueTodayCount: dueToday.length,
        dueSoonCount: dueSoon.length,
        status,
        overdueTasks: overdue.slice(0, 10).map(t => ({
          id: t.id,
          name: t.name,
          status: t.status?.status || "unknown",
          assignees: (t.assignees || []).map((a: any) => a.username || a.email),
          dueDate: t.due_date ? new Date(parseInt(t.due_date)).toLocaleDateString("en-AU") : null,
          daysOverdue: t.due_date ? Math.floor((Date.now() - parseInt(t.due_date)) / 86400000) : 0,
          space: t._space,
          list: t._list,
          url: t.url,
        })),
        dueTodayTasks: dueToday.slice(0, 10).map(t => ({
          id: t.id,
          name: t.name,
          status: t.status?.status || "unknown",
          assignees: (t.assignees || []).map((a: any) => a.username || a.email),
          space: t._space,
          url: t.url,
        })),
        dueSoonTasks: dueSoon.slice(0, 10).map(t => ({
          id: t.id,
          name: t.name,
          status: t.status?.status || "unknown",
          assignees: (t.assignees || []).map((a: any) => a.username || a.email),
          dueDate: t.due_date ? new Date(parseInt(t.due_date)).toLocaleDateString("en-AU") : null,
          space: t._space,
          url: t.url,
        })),
        assignees: Object.values(assigneeMap),
      };
    }).filter(c => c.total > 0).sort((a, b) => b.overdueCount - a.overdueCount);

    const allTasks = Object.values(clientMap).flatMap(c => c.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(isComplete).length;
    const overdueTasks = allTasks.filter(isOverdue).length;
    const dueTodayTasks = allTasks.filter(isDueToday).length;
    const dueSoonTasks = allTasks.filter(isDueSoon).length;
    const unassigned = allTasks.filter(t => !t.assignees || t.assignees.length === 0).length;
    const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const allCompleted = allTasks.filter(isComplete);
    const allOnTime = allCompleted.filter(t => {
      if (!t.due_date || !t.date_closed) return true;
      return parseInt(t.date_closed) <= parseInt(t.due_date);
    }).length;
    const slaScore = allCompleted.length > 0 ? Math.round((allOnTime / allCompleted.length) * 100) : 100;

    const globalAssignees: Record<string, { name: string; total: number; overdue: number; completed: number }> = {};
    allTasks.forEach((t: any) => {
      (t.assignees || []).forEach((a: any) => {
        const key = a.id;
        if (!globalAssignees[key]) globalAssignees[key] = { name: a.username || a.email || "Unknown", total: 0, overdue: 0, completed: 0 };
        globalAssignees[key].total++;
        if (isOverdue(t)) globalAssignees[key].overdue++;
        if (isComplete(t)) globalAssignees[key].completed++;
      });
    });

    // Top overdue tasks across all clients for overview
    const topOverdue = allTasks
      .filter(isOverdue)
      .sort((a, b) => (parseInt(a.due_date) || 0) - (parseInt(b.due_date) || 0))
      .slice(0, 15)
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        client: Object.values(clientMap).find(c => c.tasks.some(ct => ct.id === t.id))?.name || "Unknown",
        status: t.status?.status || "unknown",
        assignees: (t.assignees || []).map((a: any) => a.username || a.email),
        dueDate: t.due_date ? new Date(parseInt(t.due_date)).toLocaleDateString("en-AU") : null,
        daysOverdue: t.due_date ? Math.floor((Date.now() - parseInt(t.due_date)) / 86400000) : 0,
        space: t._space,
        url: t.url,
      }));

    return NextResponse.json({
      lastUpdated: new Date().toISOString(),
      month: now.toLocaleString("default", { month: "long", year: "numeric" }),
      slaScore,
      overallCompletion,
      totalTasks,
      completedTasks,
      overdueTasks,
      dueTodayTasks,
      dueSoonTasks,
      unassigned,
      totalClients: clients.length,
      healthyClients: clients.filter(c => c.status === "healthy").length,
      atRiskClients: clients.filter(c => c.status === "at-risk").length,
      behindClients: clients.filter(c => c.status === "behind").length,
      teamCapacity: Object.values(globalAssignees).sort((a, b) => b.total - a.total),
      topOverdue,
      clients,
    });
  } catch (error) {
    console.error("Operations live error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
