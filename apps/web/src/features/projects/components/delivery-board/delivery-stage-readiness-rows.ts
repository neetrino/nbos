import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { ChecklistStageProgress, DeliveryLifecycleProjection } from '@/lib/api/projects';

export interface StageReadinessRow {
  key: string;
  label: string;
  done: boolean;
}

const CLOSED_TASK = new Set(['DONE', 'ON_HOLD', 'COMPLETED']);
const CLOSED_TICKET = new Set(['RESOLVED', 'CLOSED']);
const CLOSED_EXTENSION = new Set(['DONE', 'LOST']);

function countOpenTasks(tasks: { status: string }[]): number {
  return tasks.filter((t) => !CLOSED_TASK.has(t.status)).length;
}

function countOpenTickets(tickets: { status: string }[]): number {
  return tickets.filter((t) => !CLOSED_TICKET.has(t.status)).length;
}

export function buildProductStageReadinessRows(
  product: FullProduct,
  lifecycle: DeliveryLifecycleProjection | undefined,
  checklist: ChecklistStageProgress | null | undefined,
): StageReadinessRow[] {
  if (!lifecycle || lifecycle.isTerminal || !lifecycle.stage) return [];
  const stage = lifecycle.stage;
  const rows: StageReadinessRow[] = [];

  if (stage === 'STARTING') {
    rows.push({ key: 'deadline', label: 'Deadline set', done: Boolean(product.deadline) });
  } else if (stage === 'DEVELOPMENT' || stage === 'QA') {
    const open = countOpenTasks(product.tasks ?? []);
    rows.push({ key: 'tasks', label: 'No open Work Space tasks', done: open === 0 });
  } else if (stage === 'TRANSFER') {
    const invoices = product.order?.invoices ?? [];
    const unpaid = invoices.filter((i) => i.moneyStatus !== 'PAID').length;
    const orderOk =
      !product.order?.status || ['FULLY_PAID', 'CLOSED'].includes(product.order.status);
    const extOpen = (product.extensions ?? []).filter(
      (e) => !CLOSED_EXTENSION.has(e.status),
    ).length;
    rows.push(
      { key: 'ext', label: 'No open extensions', done: extOpen === 0 },
      { key: 'tasks', label: 'No open tasks', done: countOpenTasks(product.tasks ?? []) === 0 },
      {
        key: 'tickets',
        label: 'No open tickets',
        done: countOpenTickets(product.tickets ?? []) === 0,
      },
      {
        key: 'accept',
        label: 'Client acceptance recorded',
        done: Boolean(product.clientAcceptedAt),
      },
      { key: 'order', label: 'Order financially closed', done: orderOk },
      { key: 'inv', label: 'No unpaid invoices', done: unpaid === 0 },
    );
  }

  if (checklist && checklist.total > 0) {
    const completedChecklists = checklist.completedChecklists ?? 0;
    const totalChecklists = checklist.totalChecklists ?? 0;
    rows.push({
      key: 'checklist',
      label:
        totalChecklists > 0
          ? `Stage checklist (${completedChecklists}/${totalChecklists} complete, ${checklist.completed}/${checklist.total} reviewed)`
          : `Stage checklist (${checklist.completed}/${checklist.total})`,
      done:
        totalChecklists > 0
          ? completedChecklists >= totalChecklists
          : checklist.completed >= checklist.total,
    });
  }

  return rows;
}

export function buildExtensionStageReadinessRows(
  extension: FullExtension,
  lifecycle: DeliveryLifecycleProjection | undefined,
  checklist: ChecklistStageProgress | null | undefined,
): StageReadinessRow[] {
  if (!lifecycle || lifecycle.isTerminal || !lifecycle.stage) return [];
  const stage = lifecycle.stage;
  const rows: StageReadinessRow[] = [];

  if (stage === 'STARTING') {
    rows.push(
      {
        key: 'desc',
        label: 'Scope & notes filled',
        done: Boolean(extension.description?.trim()),
      },
      { key: 'owner', label: 'Owner assigned', done: Boolean(extension.assignedTo) },
    );
  } else if (stage === 'DEVELOPMENT' || stage === 'QA') {
    const open = countOpenTasks(extension.tasks ?? []);
    rows.push({ key: 'tasks', label: 'No open Work Space tasks', done: open === 0 });
  } else if (stage === 'TRANSFER') {
    const invoices = extension.order?.invoices ?? [];
    const unpaid = invoices.filter((i) => i.moneyStatus !== 'PAID').length;
    const orderOk =
      !extension.order?.status || ['FULLY_PAID', 'CLOSED'].includes(extension.order.status);
    rows.push(
      { key: 'tasks', label: 'No open tasks', done: countOpenTasks(extension.tasks ?? []) === 0 },
      { key: 'order', label: 'Order financially closed', done: orderOk },
      { key: 'inv', label: 'No unpaid invoices', done: unpaid === 0 },
    );
  }

  if (checklist && checklist.total > 0) {
    const completedChecklists = checklist.completedChecklists ?? 0;
    const totalChecklists = checklist.totalChecklists ?? 0;
    rows.push({
      key: 'checklist',
      label:
        totalChecklists > 0
          ? `Stage checklist (${completedChecklists}/${totalChecklists} complete, ${checklist.completed}/${checklist.total} reviewed)`
          : `Stage checklist (${checklist.completed}/${checklist.total})`,
      done:
        totalChecklists > 0
          ? completedChecklists >= totalChecklists
          : checklist.completed >= checklist.total,
    });
  }

  return rows;
}
