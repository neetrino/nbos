export type CredentialTab = 'all' | 'personal' | 'department' | 'secret' | 'project';

const TAB_ALIASES: Record<string, CredentialTab> = {
  all: 'all',
  personal: 'personal',
  my: 'personal',
  department: 'department',
  team: 'department',
  secret: 'secret',
  project: 'project',
};

/** Maps vault tab query params (legacy + canon names) to internal tab filter. */
export function normalizeCredentialTab(tab?: string): CredentialTab | undefined {
  if (!tab?.trim()) return undefined;
  return TAB_ALIASES[tab.trim().toLowerCase()];
}
