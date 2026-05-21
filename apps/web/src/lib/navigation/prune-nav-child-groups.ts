import { isNavChildGroup, isNavChildLink, type NavChildDefinition } from './nav-config';

/** Drop section headers that have no visible links before the next header. */
export function pruneNavChildGroups(children: NavChildDefinition[]): NavChildDefinition[] {
  const pruned: NavChildDefinition[] = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) {
      continue;
    }
    if (isNavChildLink(child)) {
      pruned.push(child);
      continue;
    }
    if (!isNavChildGroup(child)) {
      continue;
    }

    let hasLinkInSection = false;
    for (let j = i + 1; j < children.length; j++) {
      const next = children[j];
      if (!next) {
        continue;
      }
      if (isNavChildGroup(next)) {
        break;
      }
      if (isNavChildLink(next)) {
        hasLinkInSection = true;
        break;
      }
    }

    if (hasLinkInSection) {
      pruned.push(child);
    }
  }

  return pruned;
}
