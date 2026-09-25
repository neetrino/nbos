'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import {
  DetailSheetFormFooter,
  DetailSheetSection,
  EntityDetailSheetContent,
  InlineField,
} from '@/components/shared';
import {
  checklistTemplatesApi,
  type ChecklistTemplateListItem,
  type CreateDeliveryStageChecklistRuleBody,
  type DeliveryChecklistTarget,
  type DeliveryStageCanon,
} from '@/lib/api/checklist-templates';
import { toast } from 'sonner';
import { DELIVERY_STAGES, FILTER_ANY, TARGETS } from './delivery-stage-rule-options';
import { StageRuleOptionalFiltersSection } from './stage-rule-optional-filters-section';
import {
  TEAM_SHEET_BODY_CLASS,
  TEAM_SHEET_HEADER_CLASS,
} from '@/features/hr/constants/team-sheet-layout';

type Draft = {
  target: DeliveryChecklistTarget;
  deliveryStage: DeliveryStageCanon;
  templateId: string;
  priority: string;
  filterCategory: string;
  filterType: string;
};

const EMPTY_DRAFT: Draft = {
  target: 'PRODUCT',
  deliveryStage: 'DEVELOPMENT',
  templateId: '',
  priority: '0',
  filterCategory: FILTER_ANY,
  filterType: FILTER_ANY,
};

export function StageRuleCreateSheet({
  open,
  templates,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  templates: ChecklistTemplateListItem[];
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const published = useMemo(
    () => templates.filter((item) => item.status === 'ACTIVE' && item.activeVersionId),
    [templates],
  );

  useEffect(() => {
    if (!open) return;
    setDraft(EMPTY_DRAFT);
    setError(null);
  }, [open]);

  const save = async () => {
    if (!draft.templateId) {
      setError('Choose a published checklist.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await checklistTemplatesApi.createStageRule(ruleBody(draft));
      toast.success('Rule created');
      onOpenChange(false);
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create rule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="auxiliary"
        sourcePageHref="/my-company/checklist-stage-rules"
      >
        <StageRuleCreateBody
          draft={draft}
          published={published}
          saving={saving}
          error={error}
          dirty={isDraftDirty(draft)}
          onChange={(next) => setDraft((current) => ({ ...current, ...next }))}
          onSave={() => void save()}
          onCancel={() => {
            setDraft(EMPTY_DRAFT);
            setError(null);
          }}
        />
      </EntityDetailSheetContent>
    </Sheet>
  );
}

function StageRuleCreateBody({
  draft,
  published,
  saving,
  error,
  dirty,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Draft;
  published: ChecklistTemplateListItem[];
  saving: boolean;
  error: string | null;
  dirty: boolean;
  onChange: (next: Partial<Draft>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={TEAM_SHEET_HEADER_CLASS}>
        <h2 className="truncate text-base font-semibold">New delivery rule</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          A published checklist starts when a delivery item enters this stage.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={TEAM_SHEET_BODY_CLASS}>
          <StageRuleCreateFields
            draft={draft}
            published={published}
            saving={saving}
            onChange={onChange}
          />
        </div>
      </div>
      <DetailSheetFormFooter
        visible
        dirty={dirty}
        saving={saving}
        errorMessage={error}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
}

function StageRuleCreateFields({
  draft,
  published,
  saving,
  onChange,
}: {
  draft: Draft;
  published: ChecklistTemplateListItem[];
  saving: boolean;
  onChange: (next: Partial<Draft>) => void;
}) {
  return (
    <div className="space-y-4">
      <DetailSheetSection title="When it starts" outlined>
        <div className="grid gap-3">
          <InlineField
            variant="controlled"
            type="select"
            label="Applies to"
            value={draft.target}
            options={TARGETS.map((item) => ({ value: item.value, label: item.label }))}
            disabled={saving}
            onValueChange={(target) => onChange({ target: target as DeliveryChecklistTarget })}
          />
          <InlineField
            variant="controlled"
            type="select"
            label="Delivery stage"
            value={draft.deliveryStage}
            options={DELIVERY_STAGES.map((item) => ({ value: item.value, label: item.label }))}
            disabled={saving}
            onValueChange={(deliveryStage) =>
              onChange({ deliveryStage: deliveryStage as DeliveryStageCanon })
            }
          />
          <InlineField
            variant="controlled"
            type="select"
            label="Checklist"
            value={draft.templateId}
            placeholder="Published checklist"
            options={published.map((item) => ({ value: item.id, label: item.name }))}
            disabled={saving}
            onValueChange={(templateId) => onChange({ templateId })}
          />
          <InlineField
            variant="controlled"
            label="Priority"
            value={draft.priority}
            disabled={saving}
            onValueChange={(priority) => onChange({ priority })}
          />
          <p className="text-muted-foreground text-xs">
            {published.length} published checklists. Lower priority runs first.
          </p>
        </div>
      </DetailSheetSection>
      <DetailSheetSection title="Filters" outlined>
        <StageRuleOptionalFiltersSection
          target={draft.target}
          filterCategory={draft.filterCategory}
          setFilterCategory={(filterCategory) => onChange({ filterCategory })}
          filterType={draft.filterType}
          setFilterType={(filterType) => onChange({ filterType })}
        />
      </DetailSheetSection>
    </div>
  );
}

function isDraftDirty(draft: Draft): boolean {
  return (
    draft.target !== EMPTY_DRAFT.target ||
    draft.deliveryStage !== EMPTY_DRAFT.deliveryStage ||
    draft.templateId !== EMPTY_DRAFT.templateId ||
    draft.priority !== EMPTY_DRAFT.priority ||
    draft.filterCategory !== EMPTY_DRAFT.filterCategory ||
    draft.filterType !== EMPTY_DRAFT.filterType
  );
}

function ruleBody(draft: Draft): CreateDeliveryStageChecklistRuleBody {
  const priority = Number.parseInt(draft.priority, 10);
  return {
    target: draft.target,
    deliveryStage: draft.deliveryStage,
    checklistTemplateId: draft.templateId,
    priority: Number.isFinite(priority) ? priority : 0,
    ...(draft.target === 'PRODUCT'
      ? {
          ...(draft.filterCategory !== FILTER_ANY
            ? { filterProductCategory: draft.filterCategory }
            : {}),
          ...(draft.filterType !== FILTER_ANY ? { filterProductType: draft.filterType } : {}),
        }
      : {}),
  };
}
