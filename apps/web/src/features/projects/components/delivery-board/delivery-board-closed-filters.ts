import {
  getItemLabel,
  getItemLifecycle,
  getProjectId,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

export type ClosedResultFilter = 'ALL' | 'DONE' | 'CANCELLED';
export type ClosedDeadlineResultFilter = 'ALL' | 'ON_TIME' | 'LATE';

export interface DeliveryBoardClosedFiltersInput {
  search: string;
  projectId: string;
  ownerId: string;
  /** `ptype:${productType}` | `extsize:${size}` | '' */
  productLineKey: string;
  closedFrom: string;
  closedTo: string;
  deadlineResult: ClosedDeadlineResultFilter;
  result: ClosedResultFilter;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function getClosedAtDate(item: DeliveryBoardItem): Date | null {
  const iso = item.kind === 'PRODUCT' ? item.product.updatedAt : item.extension.updatedAt;
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function productDeadlineOnTime(closed: Date, deadlineIso: string): boolean {
  const dl = new Date(deadlineIso);
  if (Number.isNaN(dl.getTime())) return false;
  return closed.getTime() <= dl.getTime();
}

export function applyDeliveryBoardClosedFilters(
  items: DeliveryBoardItem[],
  f: DeliveryBoardClosedFiltersInput,
): DeliveryBoardItem[] {
  const q = normalize(f.search);
  return items.filter((item) => {
    const lc = getItemLifecycle(item);
    if (!lc?.isTerminal) return false;

    if (f.result !== 'ALL' && lc.resolution !== f.result) return false;

    if (f.projectId && getProjectId(item) !== f.projectId) return false;

    if (f.ownerId) {
      const oid = item.kind === 'PRODUCT' ? item.product.pm?.id : item.extension.assignee?.id;
      if (oid !== f.ownerId) return false;
    }

    if (f.productLineKey) {
      if (f.productLineKey.startsWith('ptype:')) {
        const t = f.productLineKey.slice('ptype:'.length);
        if (item.kind !== 'PRODUCT' || item.product.productType !== t) return false;
      } else if (f.productLineKey.startsWith('extsize:')) {
        const s = f.productLineKey.slice('extsize:'.length);
        if (item.kind !== 'EXTENSION' || item.extension.size !== s) return false;
      }
    }

    if (q) {
      const name = normalize(getItemLabel(item));
      const proj = item.kind === 'PRODUCT' ? item.product.project : item.extension.project;
      const projHay = proj ? normalize(`${proj.name} ${proj.code}`) : '';
      if (!name.includes(q) && !projHay.includes(q)) return false;
    }

    const closedAt = getClosedAtDate(item);
    if (f.closedFrom) {
      if (closedAt && dateKey(closedAt) < f.closedFrom) return false;
      if (!closedAt) return false;
    }
    if (f.closedTo) {
      if (closedAt && dateKey(closedAt) > f.closedTo) return false;
      if (!closedAt) return false;
    }

    if (f.deadlineResult !== 'ALL') {
      if (item.kind !== 'PRODUCT') return false;
      const deadline = item.product.deadline;
      if (!deadline || !closedAt) return false;
      const onTime = productDeadlineOnTime(closedAt, deadline);
      if (f.deadlineResult === 'ON_TIME' && !onTime) return false;
      if (f.deadlineResult === 'LATE' && onTime) return false;
    }

    return true;
  });
}

export interface ClosedFilterOptions {
  projects: Array<{ id: string; label: string }>;
  owners: Array<{ id: string; label: string }>;
  productLines: Array<{ value: string; label: string }>;
}

export function buildClosedFilterOptions(items: DeliveryBoardItem[]): ClosedFilterOptions {
  const projectMap = new Map<string, string>();
  const ownerMap = new Map<string, string>();
  const lines: Array<{ value: string; label: string }> = [];
  const seenLine = new Set<string>();

  for (const item of items) {
    const lc = getItemLifecycle(item);
    if (!lc?.isTerminal) continue;

    if (item.kind === 'PRODUCT') {
      const p = item.product.project;
      if (p && !projectMap.has(p.id)) {
        projectMap.set(p.id, `${p.name} (${p.code})`);
      }
      const pm = item.product.pm;
      if (pm && !ownerMap.has(pm.id)) {
        ownerMap.set(pm.id, `${pm.firstName} ${pm.lastName}`);
      }
      const pk = `ptype:${item.product.productType}`;
      if (!seenLine.has(pk)) {
        seenLine.add(pk);
        lines.push({ value: pk, label: `Product · ${item.product.productType}` });
      }
    } else {
      const p = item.extension.project;
      if (p && !projectMap.has(p.id)) {
        projectMap.set(p.id, `${p.name} (${p.code})`);
      }
      const a = item.extension.assignee;
      if (a && !ownerMap.has(a.id)) {
        ownerMap.set(a.id, `${a.firstName} ${a.lastName}`);
      }
      const ek = `extsize:${item.extension.size}`;
      if (!seenLine.has(ek)) {
        seenLine.add(ek);
        lines.push({ value: ek, label: `Extension · ${item.extension.size}` });
      }
    }
  }

  lines.sort((a, b) => a.label.localeCompare(b.label));

  return {
    projects: [...projectMap.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    owners: [...ownerMap.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    productLines: lines,
  };
}

/** Deadline vs close proxy for table column (products only). */
export function getClosedDeadlineOutcomeLabel(item: DeliveryBoardItem): string {
  if (item.kind !== 'PRODUCT') return '—';
  const deadline = item.product.deadline;
  const closed = getClosedAtDate(item);
  if (!deadline || !closed) return '—';
  return productDeadlineOnTime(closed, deadline) ? 'On time' : 'Late';
}
