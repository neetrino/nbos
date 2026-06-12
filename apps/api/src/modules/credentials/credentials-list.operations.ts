import type { CredentialQueryParams } from './credential-domain.types';
import { buildCredentialListWhere } from './credential-list-where';
import {
  findCredentialListPageRecentFirst,
  findCredentialListPageStandard,
} from './credential-list-page';
import { normalizeCredentialListSort } from './credential-list-sort';
import type { CredentialsRuntime } from './credentials-runtime';
import type { CredentialsAccessContext } from './credentials-access';

export async function findAllCredentials(
  runtime: CredentialsRuntime,
  params: CredentialQueryParams,
  access?: CredentialsAccessContext,
) {
  const where = await buildCredentialListWhere(runtime, params);
  const isTrashList = params.scope === 'trash' || (params.includeArchived ?? false);
  const sort = normalizeCredentialListSort(params.sort, isTrashList);

  if (sort === 'recent' && access?.employeeId) {
    return findCredentialListPageRecentFirst(runtime, access, where, params);
  }

  return findCredentialListPageStandard(runtime, where, sort, params, isTrashList);
}
