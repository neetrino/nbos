import { dealsApi } from '@/lib/api/deals';
import { invoicesApi } from '@/lib/api/finance';
import { supportApi } from '@/lib/api/support';
import { tasksApi } from '@/lib/api/tasks';
import type { DashboardData, PriorityCard } from './dashboard-control-registry';

export async function loadDashboardControlData(): Promise<DashboardData> {
  const [dealsRes, invoicesRes, tasksRes, ticketsRes] = await Promise.allSettled([
    dealsApi.getAll({ pageSize: 200 }),
    invoicesApi.getAll({ pageSize: 200 }),
    tasksApi.getAll({ pageSize: 200 }),
    supportApi.getAll({ pageSize: 200 }),
  ]);
  const deals = dealsRes.status === 'fulfilled' ? dealsRes.value.items : [];
  const invoices = invoicesRes.status === 'fulfilled' ? invoicesRes.value.items : [];
  const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value.items : [];
  const tickets = ticketsRes.status === 'fulfilled' ? ticketsRes.value.items : [];
  const today = new Date().toISOString().split('T')[0] ?? '';
  const openTasks = tasks.filter((task: { status: string }) => task.status !== 'DONE');
  const dueTodayTasks = openTasks.filter(
    (task: { dueDate: string | null }) => task.dueDate && task.dueDate.startsWith(today),
  );
  const openDeals = deals.filter(
    (deal: { status: string }) => deal.status !== 'CLOSED_WON' && deal.status !== 'CLOSED_LOST',
  );
  const pendingInvoices = invoices.filter(
    (invoice: { status: string }) =>
      invoice.status === 'WAITING' || invoice.status === 'CREATE_INVOICE',
  );
  const openTickets = tickets.filter(
    (ticket: { status: string }) => !['RESOLVED', 'CLOSED'].includes(ticket.status),
  );
  return {
    dueTodayTasks: dueTodayTasks.length,
    openTasks: openTasks.length,
    openDeals: openDeals.length,
    pendingInvoices: pendingInvoices.length,
    openTickets: openTickets.length,
    criticalTickets: openTickets.filter((ticket: { priority: string }) => ticket.priority === 'P1')
      .length,
  };
}

export function buildPriorityCards(data: DashboardData | null): PriorityCard[] {
  if (!data) return [];
  return [
    data.criticalTickets > 0
      ? {
          title: `${data.criticalTickets} critical support ticket${data.criticalTickets === 1 ? '' : 's'}`,
          context: 'P1 tickets should be reviewed today.',
          href: '/support',
          severity: 'critical',
          source: 'Support',
        }
      : null,
    data.dueTodayTasks > 0
      ? {
          title: `${data.dueTodayTasks} task${data.dueTodayTasks === 1 ? '' : 's'} due today`,
          context: "Open your task board and clear today's work.",
          href: '/tasks',
          severity: 'high',
          source: 'Tasks',
        }
      : null,
    data.pendingInvoices > 0
      ? {
          title: `${data.pendingInvoices} pending invoice${data.pendingInvoices === 1 ? '' : 's'}`,
          context: 'Finance has invoice work waiting for action.',
          href: '/finance/invoices',
          severity: 'high',
          source: 'Finance',
        }
      : null,
  ].filter((item): item is PriorityCard => item !== null);
}
