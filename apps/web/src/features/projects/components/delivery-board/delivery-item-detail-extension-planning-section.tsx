'use client';

import { Layers, Package, Sparkles, Tag } from 'lucide-react';
import { EntityNotesField, InlineField } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { FullExtension } from '@/lib/api/extensions';
import { EXTENSION_SIZES, getProductType } from '@/features/projects/constants/projects';
import type { ExtensionPlanSnapshot } from './delivery-item-detail-planning-state';
import { deliveryStageGateFieldClass } from './delivery-stage-gate-highlight';

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
    <section className="border-border bg-card/40 rounded-xl border p-4">
      <h3 className="text-muted-foreground mb-3 text-[10px] font-semibold tracking-wider uppercase">
        Extension plan
      </h3>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
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
        <div className="md:col-span-2">
          <ExtensionPlanProductLine extension={extension} />
        </div>
        <div
          className={cn(
            'md:col-span-2',
            deliveryStageGateFieldClass(gateRequiredFields, 'description', ''),
          )}
        >
          <EntityNotesField
            entityType="generic"
            entityId={extension.id}
            value={draft.description}
            onChange={(description) => patchDraft({ description: description ?? '' })}
            placeholder="Plan, acceptance criteria…"
            disabled={disabled}
          />
        </div>
      </div>
    </section>
  );
}
