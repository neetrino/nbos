import { productsApi } from '@/lib/api/products';
import {
  buildDealExistingProductChangePatch,
  type DealGeneralDraft,
} from './deal-general-form-state';
import type { SearchOption } from './deal-general-tab.types';

const DEAL_PRODUCT_SEARCH_PAGE_SIZE = 8;

const projectByProductId = new Map<string, { projectId: string; projectName: string }>();

function rememberProductProject(product: {
  id: string;
  projectId: string;
  project?: { name: string } | null;
}): void {
  const projectName = product.project?.name;
  if (!projectName) return;
  projectByProductId.set(product.id, { projectId: product.projectId, projectName });
}

/** Global product search for extension/maintenance deals (project name as subtitle). */
export async function searchDealExistingProducts(query: string): Promise<SearchOption[]> {
  const data = await productsApi.getAll({
    pageSize: DEAL_PRODUCT_SEARCH_PAGE_SIZE,
    search: query.trim() || undefined,
  });
  return data.items.map((product) => {
    rememberProductProject(product);
    return {
      value: product.id,
      label: product.name,
      subtitle: product.project?.name,
    };
  });
}

/** Resolves project from the last search, then `getById` if the list item omitted it. */
export async function buildDealExistingProductSelectPatch(
  id: string,
  label: string,
): Promise<Partial<DealGeneralDraft>> {
  const cached = projectByProductId.get(id);
  if (cached) {
    return buildDealExistingProductChangePatch(id, label, cached.projectId, cached.projectName);
  }
  try {
    const product = await productsApi.getById(id);
    rememberProductProject(product);
    return buildDealExistingProductChangePatch(id, label, product.projectId, product.project.name);
  } catch {
    return { existingProductId: id, existingProductPickLabel: label };
  }
}
