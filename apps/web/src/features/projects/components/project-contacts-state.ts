import type { FullProject } from '@/lib/api/projects';

export type ProjectContactsDraft = {
  contactId: string;
  contactLabel: string;
  companyId: string | null;
  companyLabel: string | null;
  additionalContactIds: string[];
  additionalContactLabels: Record<string, string>;
};

export type ProjectContactsUpdatePayload = {
  contactId?: string;
  companyId?: string | null;
  additionalContactIds?: string[];
};

export function projectContactsDraftFromProject(project: FullProject): ProjectContactsDraft {
  const labels: Record<string, string> = {};
  const additionalContactIds: string[] = [];
  for (const row of project.additionalContacts ?? []) {
    const contact = row.contact;
    additionalContactIds.push(contact.id);
    labels[contact.id] = `${contact.firstName} ${contact.lastName}`.trim();
  }

  return {
    contactId: project.contact.id,
    contactLabel: `${project.contact.firstName} ${project.contact.lastName}`.trim(),
    companyId: project.company?.id ?? null,
    companyLabel: project.company?.name ?? null,
    additionalContactIds,
    additionalContactLabels: labels,
  };
}

export function buildProjectContactsPatch(
  snap: ProjectContactsDraft,
  draft: ProjectContactsDraft,
): ProjectContactsUpdatePayload {
  const out: ProjectContactsUpdatePayload = {};
  if (draft.contactId !== snap.contactId) out.contactId = draft.contactId;
  if (draft.companyId !== snap.companyId) out.companyId = draft.companyId;
  if (!contactIdSetsEqual(draft.additionalContactIds, snap.additionalContactIds)) {
    out.additionalContactIds = draft.additionalContactIds;
  }
  return out;
}

function contactIdSetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, index) => id === sortedB[index]);
}
