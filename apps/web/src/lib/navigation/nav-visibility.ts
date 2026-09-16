import {
  isNavChildGroup,
  isNavChildLink,
  type NavChildDefinition,
  type NavModuleDefinition,
  type PermissionRequirement,
} from './nav-config';
import { getPermissionClauses } from './permission-requirement';
import { pruneNavChildGroups } from './prune-nav-child-groups';

export type NavPermissionCan = (action: string, module: string) => boolean;

export function hasNavPermission(
  permission: PermissionRequirement | undefined,
  can: NavPermissionCan,
): boolean {
  if (!permission) return true;
  const clauses = getPermissionClauses(permission);
  if (clauses.length === 0) return false;
  return clauses.some((clause) => can(clause.action, clause.module));
}

function resolveChildPermission(
  child: NavChildDefinition,
  parentPermission: PermissionRequirement | undefined,
): PermissionRequirement | undefined {
  if (isNavChildGroup(child)) return undefined;
  return child.permission ?? parentPermission;
}

function isChildVisible(
  child: NavChildDefinition,
  parentPermission: PermissionRequirement | undefined,
  can: NavPermissionCan,
): boolean {
  if (isNavChildGroup(child)) return true;
  return hasNavPermission(resolveChildPermission(child, parentPermission), can);
}

export function getVisibleNavModules(
  can: NavPermissionCan,
  isLoading: boolean,
  definitions: NavModuleDefinition[],
): NavModuleDefinition[] {
  if (isLoading) {
    return definitions.filter((item) => item.permission === undefined);
  }

  return definitions.reduce<NavModuleDefinition[]>((items, item) => {
    const visibleChildren = item.children?.filter((child) =>
      isChildVisible(child, item.permission, can),
    );
    const prunedChildren =
      visibleChildren && visibleChildren.length > 0
        ? pruneNavChildGroups(visibleChildren)
        : undefined;
    const itemAllowed = hasNavPermission(item.permission, can);
    const visibleLinks = prunedChildren?.filter(isNavChildLink) ?? [];
    const hasVisibleChildren = visibleLinks.length > 0;
    const hasChildrenWithoutOwnPermission =
      item.children !== undefined && item.permission === undefined;

    if (!itemAllowed && !hasVisibleChildren) {
      return items;
    }

    if (hasChildrenWithoutOwnPermission && !hasVisibleChildren) {
      return items;
    }

    items.push({ ...item, children: hasVisibleChildren ? prunedChildren : undefined });
    return items;
  }, []);
}
