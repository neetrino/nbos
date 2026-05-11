'use client';

import { Layers, Package, Sparkles, Tag, User } from 'lucide-react';
import { InlineField, SearchField } from '@/components/shared';
import type { FullExtension } from '@/lib/api/extensions';
import { EXTENSION_SIZES, getProductType } from '@/features/projects/constants/projects';
import { useEmployeeSearchLoader } from './delivery-item-detail-employee-search';
import type { ExtensionPlanSnapshot } from './delivery-item-detail-planning-state';

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
}: {
  extension: FullExtension;
  draft: ExtensionPlanSnapshot;
  onDraftChange: (next: ExtensionPlanSnapshot) => void;
  disabled?: boolean;
}) {
  const searchEmployees = useEmployeeSearchLoader();

  const patchDraft = (partial: Partial<ExtensionPlanSnapshot>) => {
    onDraftChange({ ...draft, ...partial });
  };

  return (
    <section className="border-border bg-card/40 rounded-xl border p-5">
      <h3 className="text-muted-foreground mb-4 text-[11px] font-semibold tracking-wider uppercase">
        Extension plan
      </h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
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
        <SearchField
          selectionMode="stage"
          label="Owner"
          value={draft.assignedTo}
          displayValue={
            draft.assigneeLabel ? (
              <span className="text-foreground font-medium">{draft.assigneeLabel}</span>
            ) : undefined
          }
          placeholder="Assign…"
          icon={<User size={12} />}
          onSearch={searchEmployees}
          onStageSelect={(id, label) => {
            patchDraft({ assignedTo: id, assigneeLabel: label });
          }}
          onClear={() => {
            patchDraft({ assignedTo: null, assigneeLabel: '' });
          }}
        />
        <div className="md:col-span-2">
          <ExtensionPlanProductLine extension={extension} />
        </div>
        <div className="md:col-span-2">
          <InlineField
            variant="controlled"
            label="Scope & notes"
            type="textarea"
            value={draft.description}
            icon={<Sparkles size={12} />}
            placeholder="Plan, acceptance criteria…"
            disabled={disabled}
            onValueChange={(v) => patchDraft({ description: v })}
          />
        </div>
      </div>
    </section>
  );
}
