import type { CredentialDetail } from '@/lib/api/credentials';

/** Short summary for manual-access block (no employee list). */
export function credentialInheritedAccessSummary(
  accessLevel: string,
  detail: CredentialDetail | null,
): string {
  const parts: string[] = [];
  if (accessLevel === 'PERSONAL') parts.push('Owner-only');
  if (accessLevel === 'DEPARTMENT') parts.push('Department policy');
  if (accessLevel === 'PROJECT_TEAM') parts.push('Project team');
  if (accessLevel === 'SECRET') parts.push('Secret + manual grants');
  if (accessLevel === 'ALL') parts.push('Broad role access');
  if (detail?.project?.name) parts.push(`Project: ${detail.project.name}`);
  parts.push('Role and team policies may also apply');
  return parts.join(' · ');
}
