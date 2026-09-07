'use client';

import { useState } from 'react';
import { CircleDot, FolderKanban, Layers, Tag } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetCollapsibleSection,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { useProjectRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import {
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
} from '@/features/finance/constants/client-services';
import {
  EXPENSE_SHEET_FIELD_CELL_CLASS,
  EXPENSE_SHEET_FIELD_ROW_2_CLASS,
} from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import type { Project } from '@/lib/api/projects';
import { projectDisplayName } from '@/lib/format/project-product-display';
import { ClientServiceProviderField } from './ClientServiceProviderField';

interface ClientServiceGeneralBasicsSectionProps {
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  projects: Project[];
  formDisabled: boolean;
}

export function ClientServiceGeneralBasicsSection({
  draft,
  patchDraft,
  projects,
  formDisabled,
}: ClientServiceGeneralBasicsSectionProps) {
  const [open, setOpen] = useState(true);
  const searchProjects = useProjectRelationSearch();
  const projectPicker = useRelationPickerActions('project');
  const linkedProject = projects.find((p) => p.id === draft.projectId);

  return (
    <DetailSheetCollapsibleSection
      title="Basics"
      icon={<Tag size={12} />}
      open={open}
      onOpenChange={setOpen}
    >
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <RelationPickerField
          label="Project"
          entityKind="project"
          value={draft.projectId || null}
          selectionLabel={projectDisplayName(linkedProject)}
          placeholder="Search projects…"
          icon={<FolderKanban size={12} />}
          disabled={formDisabled}
          className="w-full min-w-0"
          onSearch={searchProjects}
          onSelect={(id) => patchDraft({ projectId: id })}
          {...projectPicker}
        />
        <ClientServiceBasicsTypeStatusRow
          draft={draft}
          formDisabled={formDisabled}
          patchDraft={patchDraft}
        />
        <ClientServiceProviderField
          providerName={draft.provider}
          disabled={formDisabled}
          onProviderChange={(provider) => patchDraft({ provider })}
        />
      </div>
    </DetailSheetCollapsibleSection>
  );
}

function ClientServiceBasicsTypeStatusRow({
  draft,
  formDisabled,
  patchDraft,
}: Omit<ClientServiceGeneralBasicsSectionProps, 'projects'>) {
  return (
    <div className={EXPENSE_SHEET_FIELD_ROW_2_CLASS}>
      <InlineField
        variant="controlled"
        label="Type"
        type="select"
        value={draft.type}
        options={CLIENT_SERVICE_TYPES.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        icon={<Layers size={12} />}
        disabled={formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(type) => type && patchDraft({ type })}
      />
      <InlineField
        variant="controlled"
        label="Status"
        type="select"
        value={draft.status}
        options={CLIENT_SERVICE_STATUSES.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        icon={<CircleDot size={12} />}
        disabled={formDisabled}
        className={EXPENSE_SHEET_FIELD_CELL_CLASS}
        onValueChange={(status) => status && patchDraft({ status })}
      />
    </div>
  );
}
