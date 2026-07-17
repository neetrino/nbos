'use client';

import { ClipboardList, Layers, Package, Tag } from 'lucide-react';
import { EntityNotesField, InlineField } from '@/components/shared';
import type { FullExtension } from '@/lib/api/extensions';
import { EXTENSION_SIZES, getProductType } from '@/features/projects/constants/projects';
import type { ExtensionPlanSnapshot } from './delivery-item-detail-planning-state';
import { deliveryStageGateFieldClass } from './delivery-stage-gate-highlight';
import { DeliveryItemLanguagesMultiselect } from './DeliveryItemLanguagesMultiselect';

function ExtensionPlanProductLine({ extension }: { extension: FullExtension }) {
  const line = extension.product.productType ?? '';
  return (
    <div className="text-muted-foreground flex items-start gap-2 text-sm">
      <Tag size={14} className="mt-0.5 shrink-0 opacity-70" />
      <span>
        <span className="text-foreground font-medium">Product line: </span>
        {(getProductType(line)?.label ?? line) || extension.product.name}
      </span>
    </div>
  );
}

export function ExtensionPlanningSection({
  extension,
  draft,
  onDraftChange,
  disabled = false,
  gateRequiredFields = new Set<string>(),
}: {
  extension: FullExtension;
  draft: ExtensionPlanSnapshot;
  onDraftChange: (next: ExtensionPlanSnapshot) => void;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}) {
  const patchDraft = (partial: Partial<ExtensionPlanSnapshot>) => {
    onDraftChange({ ...draft, ...partial });
  };

  return (
    <section className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <h3 className="text-primary mb-3 flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
        <ClipboardList size={13} aria-hidden />
        Extension plan
      </h3>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <InlineField
            variant="controlled"
            label="Extension name"
            value={draft.name}
            icon={<Package size={12} />}
            placeholder="Name…"
            disabled={disabled}
            onValueChange={(v) => patchDraft({ name: v })}
          />
          <InlineField
            variant="controlled"
            label="Size"
            type="select"
            value={draft.size}
            options={EXTENSION_SIZES.map((s) => ({ value: s.value, label: s.label }))}
            icon={<Layers size={12} />}
            disabled={disabled}
            onValueChange={(v) => {
              if (v) patchDraft({ size: v });
            }}
          />
        </div>
        <ExtensionPlanProductLine extension={extension} />
        <div className={deliveryStageGateFieldClass(gateRequiredFields, 'description', '')}>
          <EntityNotesField
            entityType="generic"
            entityId={extension.id}
            value={draft.description}
            onChange={(description) => patchDraft({ description: description ?? '' })}
            placeholder="Plan, acceptance criteria…"
            disabled={disabled}
          />
        </div>
        <DeliveryItemLanguagesMultiselect
          value={extension.product.languages ?? []}
          readOnly
          disabled={disabled}
        />
      </div>
    </section>
  );
}
