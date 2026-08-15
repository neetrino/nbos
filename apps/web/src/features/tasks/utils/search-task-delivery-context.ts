import { productsApi, type Product } from '@/lib/api/products';
import { projectsApi, type Project } from '@/lib/api/projects';
import { tasksApi, type WorkSpace } from '@/lib/api/tasks';

export type TaskDeliveryContextKind = 'PROJECT' | 'PRODUCT' | 'WORK_SPACE';

export type TaskDeliveryContextOption = {
  /** Stable option id: `PROJECT:uuid` | `PRODUCT:uuid` | `WORK_SPACE:uuid`. */
  value: string;
  kind: TaskDeliveryContextKind;
  entityId: string;
  label: string;
  /** Parent project name when known (products / product work spaces). */
  contextLabel: string | null;
  /** Indent: 0 project/standalone WS, 1 product, 2 product work space. */
  nestLevel: 0 | 1 | 2;
};

const DEFAULT_PAGE_SIZE = 8;

export function encodeTaskDeliveryContextValue(
  kind: TaskDeliveryContextKind,
  entityId: string,
): string {
  return `${kind}:${entityId}`;
}

export function parseTaskDeliveryContextValue(
  value: string,
): { kind: TaskDeliveryContextKind; entityId: string } | null {
  const sep = value.indexOf(':');
  if (sep <= 0) return null;
  const kind = value.slice(0, sep);
  const entityId = value.slice(sep + 1).trim();
  if ((kind !== 'PROJECT' && kind !== 'PRODUCT' && kind !== 'WORK_SPACE') || !entityId) {
    return null;
  }
  return { kind, entityId };
}

/**
 * Higher = better match. Exact / prefix beat substring; no match → 0.
 * Also scores `contextLabel` (weaker) so parent context can surface a child.
 */
export function scoreTaskDeliveryContextMatch(
  option: Pick<TaskDeliveryContextOption, 'label' | 'contextLabel'>,
  query: string,
): number {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;

  const labelScore = scoreTextAgainstQuery(option.label, needle);
  const contextScore = option.contextLabel
    ? Math.floor(scoreTextAgainstQuery(option.contextLabel, needle) * 0.35)
    : 0;
  return Math.max(labelScore, contextScore);
}

function scoreTextAgainstQuery(text: string, needle: string): number {
  const hay = text.trim().toLowerCase();
  if (!hay) return 0;
  if (hay === needle) return 100;
  if (hay.startsWith(needle)) return 90;
  const words = hay.split(/[\s./_-]+/).filter(Boolean);
  if (words.some((word) => word === needle)) return 80;
  if (words.some((word) => word.startsWith(needle))) return 70;
  if (hay.includes(needle)) return 55;
  return 0;
}

/**
 * When the user typed a query: drop non-matches and sort best match first.
 * Empty query keeps the browse order from {@link buildTaskDeliveryContextOptions}.
 */
export function rankTaskDeliveryContextOptions(
  options: TaskDeliveryContextOption[],
  query: string,
): TaskDeliveryContextOption[] {
  const needle = query.trim();
  if (!needle) return options;

  return options
    .map((option) => ({ option, score: scoreTaskDeliveryContextMatch(option, needle) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const lenDiff = a.option.label.length - b.option.label.length;
      if (lenDiff !== 0) return lenDiff;
      return a.option.label.localeCompare(b.option.label);
    })
    .map((row) => ({
      ...row.option,
      // Flat relevance list — nest indent would look wrong after reordering.
      nestLevel: 0 as const,
    }));
}

/**
 * Scan-friendly hierarchy (browse / empty query):
 * Project → nested Products → nested product Work Spaces;
 * remaining standalone Work Spaces at the root.
 */
export function buildTaskDeliveryContextOptions(params: {
  projects: Project[];
  products: Product[];
  workSpaces: WorkSpace[];
  maxResults?: number;
}): TaskDeliveryContextOption[] {
  const maxResults = params.maxResults ?? DEFAULT_PAGE_SIZE * 3;
  const { projects, products, workSpaces } = params;
  const projectIds = new Set(projects.map((project) => project.id));
  const usedWorkspaceIds = new Set<string>();
  const options: TaskDeliveryContextOption[] = [];

  const push = (option: TaskDeliveryContextOption) => {
    if (options.length >= maxResults) return false;
    options.push(option);
    return true;
  };

  for (const project of projects) {
    if (
      !push({
        value: encodeTaskDeliveryContextValue('PROJECT', project.id),
        kind: 'PROJECT',
        entityId: project.id,
        label: project.name,
        contextLabel: null,
        nestLevel: 0,
      })
    ) {
      break;
    }
    for (const product of products) {
      if (product.projectId !== project.id) continue;
      if (
        !push({
          value: encodeTaskDeliveryContextValue('PRODUCT', product.id),
          kind: 'PRODUCT',
          entityId: product.id,
          label: product.name,
          contextLabel: project.name,
          nestLevel: 1,
        })
      ) {
        break;
      }
      for (const workspace of workSpaces) {
        if (workspace.productId !== product.id) continue;
        usedWorkspaceIds.add(workspace.id);
        if (
          !push({
            value: encodeTaskDeliveryContextValue('WORK_SPACE', workspace.id),
            kind: 'WORK_SPACE',
            entityId: workspace.id,
            label: workspace.name,
            contextLabel: product.name,
            nestLevel: 2,
          })
        ) {
          break;
        }
      }
    }
  }

  for (const product of products) {
    if (projectIds.has(product.projectId)) continue;
    const projectName = product.project?.name?.trim() || 'Project';
    projectIds.add(product.projectId);
    if (
      !push({
        value: encodeTaskDeliveryContextValue('PROJECT', product.projectId),
        kind: 'PROJECT',
        entityId: product.projectId,
        label: projectName,
        contextLabel: null,
        nestLevel: 0,
      })
    ) {
      break;
    }
    if (
      !push({
        value: encodeTaskDeliveryContextValue('PRODUCT', product.id),
        kind: 'PRODUCT',
        entityId: product.id,
        label: product.name,
        contextLabel: projectName,
        nestLevel: 1,
      })
    ) {
      break;
    }
    for (const workspace of workSpaces) {
      if (workspace.productId !== product.id) continue;
      usedWorkspaceIds.add(workspace.id);
      if (
        !push({
          value: encodeTaskDeliveryContextValue('WORK_SPACE', workspace.id),
          kind: 'WORK_SPACE',
          entityId: workspace.id,
          label: workspace.name,
          contextLabel: product.name,
          nestLevel: 2,
        })
      ) {
        break;
      }
    }
  }

  for (const workspace of workSpaces) {
    if (usedWorkspaceIds.has(workspace.id)) continue;
    const contextLabel =
      workspace.product?.name?.trim() ||
      workspace.project?.name?.trim() ||
      (workspace.type === 'STANDALONE_OPERATIONAL' ? 'Standalone' : null);
    if (
      !push({
        value: encodeTaskDeliveryContextValue('WORK_SPACE', workspace.id),
        kind: 'WORK_SPACE',
        entityId: workspace.id,
        label: workspace.name,
        contextLabel,
        nestLevel: 0,
      })
    ) {
      break;
    }
  }

  return options;
}

/** Parallel project + product + work space search for the unified context field. */
export async function searchTaskDeliveryContext(
  query: string,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<TaskDeliveryContextOption[]> {
  const search = query.trim() || undefined;
  const [projectRes, productRes, workSpaceRes] = await Promise.all([
    projectsApi.getAll({ pageSize, search }),
    productsApi.getAll({ pageSize, search }),
    tasksApi.getWorkSpaces({ pageSize, search }),
  ]);
  const built = buildTaskDeliveryContextOptions({
    projects: projectRes.items,
    products: productRes.items,
    workSpaces: workSpaceRes.items,
    maxResults: pageSize * 3,
  });
  return rankTaskDeliveryContextOptions(built, query);
}
