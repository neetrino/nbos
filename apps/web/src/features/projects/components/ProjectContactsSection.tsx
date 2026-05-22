'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, User } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useCompanyRelationSearch,
  useContactRelationSearch,
  useRelationPickerActions,
  useRegisterRelationCreated,
  type RelationCreatedEvent,
} from '@/components/shared/relation-picker';
import { projectsApi, type FullProject } from '@/lib/api/projects';
import { applyProjectContactsRelationCreated } from './apply-project-contacts-relation-created';
import {
  buildProjectContactsPatch,
  projectContactsDraftFromProject,
  type ProjectContactsDraft,
} from './project-contacts-state';

interface ProjectContactsSectionProps {
  project: FullProject;
  onProjectUpdated: (project: FullProject) => void;
}

export function ProjectContactsSection({ project, onProjectUpdated }: ProjectContactsSectionProps) {
  const [draft, setDraft] = useState<ProjectContactsDraft>(() =>
    projectContactsDraftFromProject(project),
  );
  const [saving, setSaving] = useState(false);

  const mainContactPicker = useRelationPickerActions('contact', 'project-main-contact');
  const additionalContactPicker = useRelationPickerActions('contact', 'project-additional-contact');
  const companyPicker = useRelationPickerActions('company', 'project-company');
  const contactSearch = useContactRelationSearch();
  const companySearch = useCompanyRelationSearch();

  useEffect(() => {
    setDraft(projectContactsDraftFromProject(project));
  }, [project]);

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

  useRegisterRelationCreated(handleRelationCreated);

  return (
    <div
      className={`bg-card border-border space-y-4 rounded-xl border p-5 ${saving ? 'opacity-70' : ''}`}
    >
      <h3 className="text-sm font-semibold">Client contacts</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <RelationPickerField
          label="Main contact"
          entityKind="contact"
          value={draft.contactId}
          selectionLabel={draft.contactLabel}
          placeholder="Search contacts…"
          icon={<User size={12} />}
          onSearch={contactSearch}
          onSelect={(id, label) => {
            const additionalContactIds = draft.additionalContactIds.filter((cid) => cid !== id);
            const additionalContactLabels = { ...draft.additionalContactLabels };
            delete additionalContactLabels[id];
            patchDraft({
              contactId: id,
              contactLabel: label,
              additionalContactIds,
              additionalContactLabels,
            });
          }}
          {...mainContactPicker}
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
      <RelationPickerField
        label="Additional contacts"
        entityKind="contact"
        multiple
        value={draft.additionalContactIds}
        selectionLabels={draft.additionalContactLabels}
        placeholder="Add other people on this project…"
        icon={<User size={12} />}
        onSearch={contactSearch}
        onChange={(ids, labels) =>
          patchDraft({ additionalContactIds: ids, additionalContactLabels: labels })
        }
        {...additionalContactPicker}
      />
    </div>
  );
}
