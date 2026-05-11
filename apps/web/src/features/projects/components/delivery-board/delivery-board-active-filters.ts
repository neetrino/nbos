import {
  getItemLabel,
  getItemLifecycle,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

export type ActivePipelineWorkStatusFilter = 'ALL' | 'ACTIVE' | 'ON_HOLD';

export interface DeliveryBoardActiveFiltersInput {
  search: string;
  ownerId: string;
  workStatus: ActivePipelineWorkStatusFilter;
}

export interface ActiveFilterOptions {
  owners: Array<{ id: string; label: string }>;
}

export const DEFAULT_DELIVERY_BOARD_ACTIVE_FILTERS: DeliveryBoardActiveFiltersInput = {
  search: '',
  ownerId: '',
  workStatus: 'ALL',
};

export function hasActivePipelineFilters(f: DeliveryBoardActiveFiltersInput): boolean {
  return f.search.trim() !== '' || f.ownerId !== '' || f.workStatus !== 'ALL';
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** Items already limited to the active kanban pipeline (non-terminal, with stage). */
export function applyDeliveryBoardActiveFilters(
  items: DeliveryBoardItem[],
  f: DeliveryBoardActiveFiltersInput,
): DeliveryBoardItem[] {
  const q = normalize(f.search);
  return items.filter((item) => {
    const lc = getItemLifecycle(item);
    if (!lc?.isActive || lc.isTerminal || lc.stage == null) return false;

    if (f.workStatus === 'ACTIVE' && lc.workStatus !== 'ACTIVE') return false;
    if (f.workStatus === 'ON_HOLD' && lc.workStatus !== 'ON_HOLD') return false;

    if (f.ownerId) {
      const oid = item.kind === 'PRODUCT' ? item.product.pm?.id : item.extension.assignee?.id;
      if (oid !== f.ownerId) return false;
    }

    if (q) {
      const name = normalize(getItemLabel(item));
      const proj = item.kind === 'PRODUCT' ? item.product.project : item.extension.project;
      const projHay = proj ? normalize(`${proj.name} ${proj.code}`) : '';
      if (!name.includes(q) && !projHay.includes(q)) return false;
    }

    return true;
  });
}

export function buildActiveFilterOptions(items: DeliveryBoardItem[]): ActiveFilterOptions {
  const ownerMap = new Map<string, string>();

  for (const item of items) {
    const lc = getItemLifecycle(item);
    if (!lc?.isActive || lc.isTerminal || lc.stage == null) continue;

    if (item.kind === 'PRODUCT') {
      const pm = item.product.pm;
      if (pm && !ownerMap.has(pm.id)) {
        ownerMap.set(pm.id, `${pm.firstName} ${pm.lastName}`);
      }
    } else {
      const a = item.extension.assignee;
      if (a && !ownerMap.has(a.id)) {
        ownerMap.set(a.id, `${a.firstName} ${a.lastName}`);
      }
    }
  }

  return {
    owners: [...ownerMap.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}
