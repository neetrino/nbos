'use client';

import { Layers, Package, Sparkles, Tag, User } from 'lucide-react';
import { InlineField, SearchField } from '@/components/shared';
import type { FullExtension } from '@/lib/api/extensions';
import { extensionsApi } from '@/lib/api/extensions';
import { EXTENSION_SIZES, getProductType } from '@/features/projects/constants/projects';
import {
  type EmployeeSearchFn,
  useEmployeeSearchLoader,
} from './delivery-item-detail-employee-search';

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

function ExtensionPlanCoreFields({
  extension,
  patchExtension,
  searchEmployees,
}: {
  extension: FullExtension;
  patchExtension: (data: Parameters<typeof extensionsApi.update>[1]) => Promise<void>;
  searchEmployees: EmployeeSearchFn;
}) {
  return (
    <>
      <InlineField
        label="Extension name"
        value={extension.name}
        icon={<Package size={12} />}
        placeholder="Name…"
        onSave={(v) => void patchExtension({ name: v?.trim() || extension.name })}
      />
      <InlineField
        label="Size"
        type="select"
        value={extension.size}
        options={EXTENSION_SIZES.map((s) => ({ value: s.value, label: s.label }))}
        icon={<Layers size={12} />}
        onSave={async (v) => {
          if (v) await patchExtension({ size: v });
        }}
      />
      <SearchField
        label="Owner"
        value={extension.assignedTo}
        displayValue={
          extension.assignee ? (
            <span className="text-foreground font-medium">
              {extension.assignee.firstName} {extension.assignee.lastName}
            </span>
          ) : undefined
        }
        placeholder="Assign…"
        icon={<User size={12} />}
        onSearch={searchEmployees}
        onSave={async (id) => {
          await patchExtension({ assignedTo: id });
        }}
        onClear={async () => {
          await patchExtension({ assignedTo: null });
        }}
      />
      <ExtensionPlanProductLine extension={extension} />
    </>
  );
}

function ExtensionPlanNotes({
  extension,
  patchExtension,
}: {
  extension: FullExtension;
  patchExtension: (data: Parameters<typeof extensionsApi.update>[1]) => Promise<void>;
}) {
  return (
    <div className="md:col-span-2">
      <InlineField
        label="Scope & notes"
        type="textarea"
        value={extension.description ?? ''}
        icon={<Sparkles size={12} />}
        placeholder="Plan, acceptance criteria…"
        onSave={async (v) => {
          await patchExtension({ description: v });
        }}
      />
    </div>
  );
}

export function ExtensionPlanningSection({
  extension,
  onSaved,
}: {
  extension: FullExtension;
  onSaved: () => void;
}) {
  const searchEmployees = useEmployeeSearchLoader();

  async function patchExtension(data: Parameters<typeof extensionsApi.update>[1]) {
    await extensionsApi.update(extension.id, data);
    onSaved();
  }

  return (
    <section className="border-border bg-card/40 rounded-xl border p-5">
      <h3 className="text-muted-foreground mb-4 text-[11px] font-semibold tracking-wider uppercase">
        Extension plan
      </h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <ExtensionPlanCoreFields
          extension={extension}
          patchExtension={patchExtension}
          searchEmployees={searchEmployees}
        />
        <ExtensionPlanNotes extension={extension} patchExtension={patchExtension} />
      </div>
    </section>
  );
}
