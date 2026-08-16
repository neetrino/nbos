'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, User } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useCompanyRelationSearch,
  useContactRelationSearch,
  useRelationPickerActions,
  useRegisterRelationCreated,
  type RelationCreatedEvent,
} from '@/components/shared/relation-picker';
import { DETAIL_SHEET_SECTION_STRETCH_CLASS } from '@/components/shared';
import { projectsApi, type FullProject } from '@/lib/api/projects';
import { cn } from '@/lib/utils';
import { applyProjectContactsRelationCreated } from './apply-project-contacts-relation-created';
import { ProjectCompanyCard } from './ProjectCompanyCard';
import { ProjectContactCard, type ProjectContactCardModel } from './ProjectContactCard';
import {
  buildProjectContactsPatch,
  projectContactsDraftFromProject,
  type ProjectContactsDraft,
} from './project-contacts-state';

interface ProjectContactsSectionProps {
  project: FullProject;
  onProjectUpdated: (project: FullProject) => void;
  /** Render inside {@link ProjectInfoPanel} without card chrome. */
  embedded?: boolean;
  /** Embedded contact cards layout. Default: stack (About project). */
  contactLayout?: 'stack' | 'grid';
  /** Show linked contact cards. Default true. */
  showContactCards?: boolean;
  /** Show search / create contact field. Default true. */
  showContactSearch?: boolean;
  /** Show company card / search. Default true. */
  showCompany?: boolean;
  className?: string;
}

function buildContactCards(
  project: FullProject,
  draft: ProjectContactsDraft,
): ProjectContactCardModel[] {
  const emailById = new Map<string, string | null>();
  for (const row of project.additionalContacts ?? []) {
    emailById.set(row.contact.id, row.contact.email);
  }

  return draft.contactIds.map((id) => ({
    id,
    name: draft.contactLabels[id] ?? id,
    email: emailById.get(id) ?? null,
    isPrimary: project.contact?.id === id,
  }));
}

export function ProjectContactsSection({
  project,
  onProjectUpdated,
  embedded = false,
  contactLayout = 'stack',
  showContactCards = true,
  showContactSearch = true,
  showCompany = true,
  className,
}: ProjectContactsSectionProps) {
  const [draft, setDraft] = useState<ProjectContactsDraft>(() =>
    projectContactsDraftFromProject(project),
  );
  const [saving, setSaving] = useState(false);

  const contactsPicker = useRelationPickerActions('contact', 'project-contacts');
  const companyPicker = useRelationPickerActions('company', 'project-company');
  const contactSearch = useContactRelationSearch();
  const companySearch = useCompanyRelationSearch();

  useEffect(() => {
    setDraft(projectContactsDraftFromProject(project));
  }, [project]);

  const contactCards = useMemo(() => buildContactCards(project, draft), [project, draft]);

  const persistDraft = useCallback(
    async (next: ProjectContactsDraft) => {
      const snap = projectContactsDraftFromProject(project);
      const patch = buildProjectContactsPatch(snap, next);
      if (Object.keys(patch).length === 0) return;
      setSaving(true);
      try {
        const updated = await projectsApi.update(project.id, patch);
        onProjectUpdated(updated);
      } finally {
        setSaving(false);
      }
    },
    [project, onProjectUpdated],
  );

  const patchDraft = useCallback(
    (partial: Partial<ProjectContactsDraft>) => {
      setDraft((prev) => {
        const next = { ...prev, ...partial };
        void persistDraft(next);
        return next;
      });
    },
    [persistDraft],
  );

  const handleRelationCreated = useCallback(
    (event: RelationCreatedEvent) => {
      setDraft((prev) => {
        const next = applyProjectContactsRelationCreated(prev, event);
        void persistDraft(next);
        return next;
      });
    },
    [persistDraft],
  );

  const handleRemoveContact = useCallback(
    async (contactId: string) => {
      const nextIds = draft.contactIds.filter((id) => id !== contactId);
      const nextLabels = { ...draft.contactLabels };
      delete nextLabels[contactId];
      const next = { ...draft, contactIds: nextIds, contactLabels: nextLabels };
      setDraft(next);
      await persistDraft(next);
    },
    [draft, persistDraft],
  );

  const handleRemoveCompany = useCallback(async () => {
    const next = { ...draft, companyId: null, companyLabel: null };
    setDraft(next);
    await persistDraft(next);
  }, [draft, persistDraft]);

  useRegisterRelationCreated(handleRelationCreated);

  if (embedded) {
    const companyBlock = showCompany ? (
      draft.companyId && draft.companyLabel ? (
        <ProjectCompanyCard
          companyId={draft.companyId}
          name={draft.companyLabel}
          disabled={saving}
          onRemove={handleRemoveCompany}
        />
      ) : (
        <RelationPickerField
          label=""
          entityKind="company"
          selectionDisplay="none"
          value={draft.companyId}
          selectionLabel={draft.companyLabel}
          placeholder="Search company…"
          icon={<Building2 size={12} />}
          disabled={saving}
          onSearch={companySearch}
          onSelect={(id, label) => patchDraft({ companyId: id, companyLabel: label })}
          onClear={() => patchDraft({ companyId: null, companyLabel: null })}
          {...companyPicker}
        />
      )
    ) : null;

    const contactSearchBlock = showContactSearch ? (
      <RelationPickerField
        label=""
        entityKind="contact"
        multiple
        selectionDisplay="none"
        value={draft.contactIds}
        selectionLabels={draft.contactLabels}
        placeholder="Search or create contact…"
        icon={<User size={12} />}
        disabled={saving}
        onSearch={contactSearch}
        onChange={(ids, labels) => patchDraft({ contactIds: ids, contactLabels: labels })}
        {...contactsPicker}
      />
    ) : null;

    const contactCardsBlock =
      showContactCards && contactCards.length > 0 ? (
        <div
          className={cn('gap-2', contactLayout === 'grid' ? 'grid grid-cols-2' : 'flex flex-col')}
        >
          {contactCards.map((contact) => (
            <ProjectContactCard
              key={contact.id}
              contact={contact}
              disabled={saving}
              onRemove={handleRemoveContact}
            />
          ))}
        </div>
      ) : null;

    /** Product Contacts column (grid): company → search → cards. About project (stack): cards → search → company. */
    const isProductContactsColumn = contactLayout === 'grid';

    return (
      <div className={cn('flex flex-col gap-3', saving && 'opacity-70', className)}>
        {isProductContactsColumn ? (
          <>
            {companyBlock}
            {contactSearchBlock}
            {contactCardsBlock}
          </>
        ) : (
          <>
            {contactCardsBlock}
            {contactSearchBlock}
            {companyBlock}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        DETAIL_SHEET_SECTION_STRETCH_CLASS,
        'bg-card border-border space-y-4 rounded-xl border p-5',
        saving && 'opacity-70',
        className,
      )}
    >
      <h3 className="text-sm font-semibold">Client contacts</h3>
      <div className="flex flex-1 flex-col gap-4">
        <RelationPickerField
          label="Contacts"
          entityKind="contact"
          multiple
          value={draft.contactIds}
          selectionLabels={draft.contactLabels}
          placeholder="Search or create contact…"
          icon={<User size={12} />}
          onSearch={contactSearch}
          onChange={(ids, labels) => patchDraft({ contactIds: ids, contactLabels: labels })}
          {...contactsPicker}
        />
        <RelationPickerField
          label="Company"
          entityKind="company"
          value={draft.companyId}
          selectionLabel={draft.companyLabel}
          placeholder="Search company…"
          icon={<Building2 size={12} />}
          onSearch={companySearch}
          onSelect={(id, label) => patchDraft({ companyId: id, companyLabel: label })}
          onClear={() => patchDraft({ companyId: null, companyLabel: null })}
          {...companyPicker}
        />
      </div>
    </div>
  );
}
