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
import { DETAIL_SHEET_SECTION_STRETCH_CLASS } from '@/components/shared';
import { projectsApi, type FullProject } from '@/lib/api/projects';
import { cn } from '@/lib/utils';
import { applyProjectContactsRelationCreated } from './apply-project-contacts-relation-created';
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
  className?: string;
}

export function ProjectContactsSection({
  project,
  onProjectUpdated,
  embedded = false,
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
      className={cn(
        !embedded && [
          DETAIL_SHEET_SECTION_STRETCH_CLASS,
          'bg-card border-border space-y-4 rounded-xl border p-5',
        ],
        saving && 'opacity-70',
        className,
      )}
    >
      {!embedded && <h3 className="text-sm font-semibold">Client contacts</h3>}
      <div className={cn('flex flex-col gap-3', !embedded && 'flex-1 gap-4')}>
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
