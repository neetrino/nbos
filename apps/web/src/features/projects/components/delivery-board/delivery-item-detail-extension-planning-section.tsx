'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ClipboardList, Package, Tag } from 'lucide-react';
import { DetailSheetCollapsibleSection, EntityNotesField, InlineField } from '@/components/shared';
import type { FullExtension } from '@/lib/api/extensions';
import { formsProductTypeKey } from '@/features/projects/constants/projects';
import { cn } from '@/lib/utils';
import type { ExtensionPlanSnapshot } from './delivery-item-detail-planning-state';
import { deliveryStageGateFieldClass } from './delivery-stage-gate-highlight';
import { DeliveryItemLanguagesMultiselect } from './DeliveryItemLanguagesMultiselect';

function ExtensionPlanProductLine({ extension }: { extension: FullExtension }) {
  const t = useTranslations('deliveryBoard');
  const tForms = useTranslations('forms');
  const line = extension.product.productType ?? '';
  const typeLabel = line ? tForms(formsProductTypeKey(line) as never) : extension.product.name;
  return (
    <div className="text-muted-foreground flex items-start gap-2 text-sm">
      <Tag size={14} className="mt-0.5 shrink-0 opacity-70" />
      <span>
        <span className="text-foreground font-medium">{t('plan.productLine')} </span>
        {typeLabel}
      </span>
    </div>
  );
}

function ExtensionPlanFields({
  extension,
  draft,
  disabled,
  gateRequiredFields,
  stageChecklist,
  onDraftChange,
}: {
  extension: FullExtension;
  draft: ExtensionPlanSnapshot;
  disabled: boolean;
  gateRequiredFields: ReadonlySet<string>;
  stageChecklist?: ReactNode;
  onDraftChange: (next: ExtensionPlanSnapshot) => void;
}) {
  const t = useTranslations('deliveryBoard');
  const patchDraft = (partial: Partial<ExtensionPlanSnapshot>) => {
    onDraftChange({ ...draft, ...partial });
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <InlineField
        variant="controlled"
        label={t('plan.extensionName')}
        value={draft.name}
        icon={<Package size={12} />}
        placeholder={t('sheet.namePlaceholder')}
        disabled={disabled}
        onValueChange={(v) => patchDraft({ name: v })}
      />
      <ExtensionPlanProductLine extension={extension} />
      <ExtensionPlanNotes
        extensionId={extension.id}
        description={draft.description}
        disabled={disabled}
        gateRequiredFields={gateRequiredFields}
        placeholder={t('plan.extensionNotesPlaceholder')}
        onDescriptionChange={(description) => patchDraft({ description })}
      />
      <ExtensionPlanLanguages
        languages={extension.product.languages ?? []}
        disabled={disabled}
        stageChecklist={stageChecklist}
      />
    </div>
  );
}

function ExtensionPlanNotes({
  extensionId,
  description,
  disabled,
  gateRequiredFields,
  placeholder,
  onDescriptionChange,
}: {
  extensionId: string;
  description: string;
  disabled: boolean;
  gateRequiredFields: ReadonlySet<string>;
  placeholder: string;
  onDescriptionChange: (description: string) => void;
}) {
  return (
    <div className={deliveryStageGateFieldClass(gateRequiredFields, 'description', '')}>
      <EntityNotesField
        entityType="generic"
        entityId={extensionId}
        value={description}
        onChange={(next) => onDescriptionChange(next ?? '')}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

function ExtensionPlanLanguages({
  languages,
  disabled,
  stageChecklist,
}: {
  languages: string[];
  disabled: boolean;
  stageChecklist?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3',
        stageChecklist ? 'sm:grid-cols-2 sm:items-start' : undefined,
      )}
    >
      <DeliveryItemLanguagesMultiselect value={languages} readOnly disabled={disabled} />
      {stageChecklist}
    </div>
  );
}

export function ExtensionPlanningSection({
  extension,
  draft,
  onDraftChange,
  disabled = false,
  gateRequiredFields = new Set<string>(),
  stageChecklist,
}: {
  extension: FullExtension;
  draft: ExtensionPlanSnapshot;
  onDraftChange: (next: ExtensionPlanSnapshot) => void;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
  /** Stage checklists trigger — sits beside Languages. */
  stageChecklist?: ReactNode;
}) {
  const t = useTranslations('deliveryBoard');
  const [sectionOpen, setSectionOpen] = useState(true);

  return (
    <DetailSheetCollapsibleSection
      title={t('plan.extensionTitle')}
      icon={<ClipboardList size={12} />}
      open={sectionOpen}
      onOpenChange={setSectionOpen}
      className="shadow-sm"
    >
      <ExtensionPlanFields
        extension={extension}
        draft={draft}
        disabled={disabled}
        gateRequiredFields={gateRequiredFields}
        stageChecklist={stageChecklist}
        onDraftChange={onDraftChange}
      />
    </DetailSheetCollapsibleSection>
  );
}
