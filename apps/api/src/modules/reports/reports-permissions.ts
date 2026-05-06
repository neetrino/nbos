import type { ReportDefinition } from './reports.types';

type PermissionMap = Record<string, string>;

export function hasReportSourceAccess(
  definition: ReportDefinition,
  permissions: PermissionMap,
): boolean {
  return definition.requiredPermissions.every((requirement) => {
    const scope = permissions[toPermissionKey(requirement.module, requirement.action)];
    return typeof scope === 'string' && scope !== 'NONE';
  });
}

export function toPermissionKey(module: string, action: string): string {
  return `${module}_${action}`;
}
