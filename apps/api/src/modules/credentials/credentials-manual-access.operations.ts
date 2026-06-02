import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { CredentialsAccessContext } from './credentials-access';
import type { CredentialManualGrantInput } from './credential-manual-grant.types';
import { loadCredentialManualGrants, syncCredentialManualGrants } from './credential-manual-grants';
import { getAccessibleCredentialRow } from './credentials-secrets.operations';
import type { CredentialsRuntime } from './credentials-runtime';

const SHEET_AUDIT_PAGE_SIZE = 20;

function parseManualGrants(body: CredentialManualGrantInput[]): CredentialManualGrantInput[] {
  const seen = new Set<string>();
  const grants: CredentialManualGrantInput[] = [];
  for (const row of body) {
    const employeeId = row.employeeId?.trim();
    if (!employeeId || seen.has(employeeId)) continue;
    if (row.level !== 'VIEW' && row.level !== 'EDIT') {
      throw new BadRequestException('Manual grant level must be VIEW or EDIT');
    }
    seen.add(employeeId);
    grants.push({
      employeeId,
      level: row.level,
      expiresAt: row.expiresAt ?? null,
    });
  }
  return grants;
}

export async function listCredentialManualAccess(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
) {
  await getAccessibleCredentialRow(runtime, id, access);
  const grants = await loadCredentialManualGrants(runtime.prisma, id);
  return { grants };
}

export async function replaceCredentialManualAccess(
  runtime: CredentialsRuntime,
  id: string,
  body: CredentialManualGrantInput[],
  access: CredentialsAccessContext,
) {
  const row = await getAccessibleCredentialRow(runtime, id, access);
  const grants = parseManualGrants(body);
  await syncCredentialManualGrants(runtime.prisma, id, grants, access.employeeId);

  await runtime.auditService.log({
    entityType: 'credential',
    entityId: id,
    action: 'credential.manual_access_updated',
    userId: access.employeeId,
    projectId: row.projectId ?? undefined,
    changes: { count: grants.length },
  });

  return { grants: await loadCredentialManualGrants(runtime.prisma, id) };
}

export async function listCredentialSheetAudit(
  runtime: CredentialsRuntime,
  id: string,
  access: CredentialsAccessContext,
  page = 1,
) {
  await getAccessibleCredentialRow(runtime, id, access);
  return runtime.auditService.findByEntity('credential', id, {
    page,
    pageSize: SHEET_AUDIT_PAGE_SIZE,
  });
}
