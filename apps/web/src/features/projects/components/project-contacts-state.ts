import { contactIdListsEqual } from '@nbos/shared';
import type { FullProject } from '@/lib/api/projects';
import { contactIdsAndLabelsFromRows } from '@/lib/entity-contact-list';

export type ProjectContactsDraft = {
  contactIds: string[];
  contactLabels: Record<string, string>;
  companyId: string | null;
  companyLabel: string | null;
};

export type ProjectContactsUpdatePayload = {
  contactIds?: string[];
  companyId?: string | null;
};

export function projectContactsDraftFromProject(project: FullProject): ProjectContactsDraft {
  const { contactIds, contactLabels } = contactIdsAndLabelsFromRows(
    project.contact,
    project.additionalContacts,
  );

  return {
    contactIds,
    contactLabels,
    companyId: project.company?.id ?? null,
    companyLabel: project.company?.name ?? null,
  };
}

export function buildProjectContactsPatch(
  snap: ProjectContactsDraft,
  draft: ProjectContactsDraft,
): ProjectContactsUpdatePayload {
  const out: ProjectContactsUpdatePayload = {};
  if (draft.companyId !== snap.companyId) out.companyId = draft.companyId;
  if (!contactIdListsEqual(draft.contactIds, snap.contactIds)) {
    out.contactIds = draft.contactIds;
  }
  return out;
}
