import type { Project } from '@/lib/api/projects';

export function buildProjectsHubCsvRows(projects: Project[]): string[][] {
  const header = ['Code', 'Name', 'Trash', 'Client', 'Company', 'Orders'];
  const rows = projects.map((p) => [
    p.code,
    p.name,
    p.trashedAt != null ? 'yes' : 'no',
    `${p.contact?.firstName ?? ''} ${p.contact?.lastName ?? ''}`.trim(),
    p.company?.name ?? '',
    String(p._count.orders),
  ]);
  return [header, ...rows];
}
