import { companiesApi, contactsApi } from '@/lib/api/clients';
import { dealsApi } from '@/lib/api/deals';
import { expensesApi, invoicesApi } from '@/lib/api/finance';
import { leadsApi } from '@/lib/api/leads';
import { partnersApi } from '@/lib/api/partners';
import { productsApi } from '@/lib/api/products';
import { projectsApi } from '@/lib/api/projects';
import { supportApi } from '@/lib/api/support';
import { tasksApi } from '@/lib/api/tasks';
import type { DriveLibraryKey } from './drive-options';

const LIST_PARAMS = { page: 1, pageSize: 60 } as const;

export type DriveLibraryEntityRow = {
  id: string;
  label: string;
  entityType: string;
};

/** Merges API rows with pinned rows (e.g. deep-linked project) without duplicates. */
export function mergeDriveLibraryEntityRows(
  base: DriveLibraryEntityRow[],
  pinned?: readonly DriveLibraryEntityRow[],
): DriveLibraryEntityRow[] {
  if (!pinned?.length) return base;
  const map = new Map<string, DriveLibraryEntityRow>();
  for (const row of pinned) {
    map.set(`${row.entityType}:${row.id}`, row);
  }
  for (const row of base) {
    const k = `${row.entityType}:${row.id}`;
    if (!map.has(k)) map.set(k, row);
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

const isSystemEntityLibrary = (key: DriveLibraryKey): boolean =>
  ['deals', 'projects', 'products', 'clients', 'finance', 'partners', 'tasks', 'support'].includes(
    key,
  );

export async function loadDriveLibraryEntityRows(
  libraryKey: DriveLibraryKey,
): Promise<DriveLibraryEntityRow[]> {
  if (!isSystemEntityLibrary(libraryKey)) return [];

  switch (libraryKey) {
    case 'deals': {
      const [deals, leads] = await Promise.all([
        dealsApi.getAll(LIST_PARAMS),
        leadsApi.getAll(LIST_PARAMS),
      ]);
      const dealRows = deals.items.map((d) => ({
        id: d.id,
        label: `${d.code} — ${d.name?.trim() || 'Deal'}`,
        entityType: 'DEAL',
      }));
      const leadRows = leads.items.map((l) => ({
        id: l.id,
        label: `${l.code} — ${l.contactName || l.name || 'Lead'}`,
        entityType: 'LEAD',
      }));
      return [...dealRows, ...leadRows].sort((a, b) => a.label.localeCompare(b.label));
    }
    case 'projects': {
      const data = await projectsApi.getAll(LIST_PARAMS);
      return data.items.map((p) => ({
        id: p.id,
        label: `${p.code} — ${p.name}`,
        entityType: 'PROJECT',
      }));
    }
    case 'products': {
      const data = await productsApi.getAll(LIST_PARAMS);
      return data.items.map((p) => ({
        id: p.id,
        label: p.project ? `${p.name} (${p.project.code})` : p.name,
        entityType: 'PRODUCT',
      }));
    }
    case 'clients': {
      const [companies, contacts] = await Promise.all([
        companiesApi.getAll(LIST_PARAMS),
        contactsApi.getAll(LIST_PARAMS),
      ]);
      const companyRows = companies.items.map((c) => ({
        id: c.id,
        label: `Company: ${c.name}`,
        entityType: 'COMPANY',
      }));
      const contactRows = contacts.items.map((c) => ({
        id: c.id,
        label: `Contact: ${c.firstName} ${c.lastName}`,
        entityType: 'CONTACT',
      }));
      return [...companyRows, ...contactRows].sort((a, b) => a.label.localeCompare(b.label));
    }
    case 'finance': {
      const [inv, exp] = await Promise.all([
        invoicesApi.getAll(LIST_PARAMS),
        expensesApi.getAll({ ...LIST_PARAMS, activeBoard: true }),
      ]);
      const invRows = inv.items.map((i) => ({
        id: i.id,
        label: `Invoice ${i.code}`,
        entityType: 'INVOICE',
      }));
      const expRows = exp.items.map((e) => ({
        id: e.id,
        label: `Expense: ${e.name}`,
        entityType: 'EXPENSE',
      }));
      return [...invRows, ...expRows].sort((a, b) => a.label.localeCompare(b.label));
    }
    case 'partners': {
      const data = await partnersApi.getAll(LIST_PARAMS);
      return data.items.map((p) => ({
        id: p.id,
        label: p.name,
        entityType: 'PARTNER',
      }));
    }
    case 'tasks': {
      const [taskData, wsData] = await Promise.all([
        tasksApi.getAll(LIST_PARAMS),
        tasksApi.getWorkSpaces(LIST_PARAMS),
      ]);
      const taskRows = taskData.items.map((t) => ({
        id: t.id,
        label: `${t.code} — ${t.title}`,
        entityType: 'TASK',
      }));
      const wsRows = wsData.items.map((w) => ({
        id: w.id,
        label: `Workspace: ${w.name}`,
        entityType: 'WORK_SPACE',
      }));
      return [...taskRows, ...wsRows].sort((a, b) => a.label.localeCompare(b.label));
    }
    case 'support': {
      const data = await supportApi.getAll(LIST_PARAMS);
      return data.items.map((t) => ({
        id: t.id,
        label: `${t.code} — ${t.title}`,
        entityType: 'SUPPORT_TICKET',
      }));
    }
    default:
      return [];
  }
}
