'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, Package, Sparkles, Tag, User } from 'lucide-react';
import { InlineField, SearchField } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { FullExtension, UpdateExtensionData } from '@/lib/api/extensions';
import { extensionsApi } from '@/lib/api/extensions';
import { EXTENSION_SIZES, getProductType } from '@/features/projects/constants/projects';
import { useEmployeeSearchLoader } from './delivery-item-detail-employee-search';

type ExtensionPlanSnapshot = {
  name: string;
  size: string;
  assignedTo: string | null;
  assigneeLabel: string;
  description: string;
};

function snapshotFromExtension(e: FullExtension): ExtensionPlanSnapshot {
  return {
    name: e.name,
    size: e.size,
    assignedTo: e.assignedTo,
    assigneeLabel: e.assignee ? `${e.assignee.firstName} ${e.assignee.lastName}` : '',
    description: e.description ?? '',
  };
}

function buildExtensionPatch(
  snap: ExtensionPlanSnapshot,
  draft: ExtensionPlanSnapshot,
): UpdateExtensionData | null {
  const patch: UpdateExtensionData = {};

  const resolvedName = draft.name.trim() || snap.name;
  if (resolvedName !== snap.name) {
    patch.name = resolvedName;
  }

  if (draft.size !== snap.size) {
    patch.size = draft.size;
  }

  if (draft.assignedTo !== snap.assignedTo) {
    patch.assignedTo = draft.assignedTo;
  }

  const nextDesc = draft.description;
  if (nextDesc !== snap.description) {
    patch.description = nextDesc.trim() ? nextDesc : null;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

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
  onSaved,
}: {
  extension: FullExtension;
  onSaved: () => void;
}) {
  const searchEmployees = useEmployeeSearchLoader();
  const [snap, setSnap] = useState<ExtensionPlanSnapshot>(() => snapshotFromExtension(extension));
  const [draft, setDraft] = useState<ExtensionPlanSnapshot>(() => snapshotFromExtension(extension));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = snapshotFromExtension(extension);
    setSnap(next);
    setDraft(next);
  }, [extension.id, extension.updatedAt]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(snap), [draft, snap]);

  const handleCancel = useCallback(() => {
    setDraft(snap);
  }, [snap]);

  const handleSave = useCallback(async () => {
    const patch = buildExtensionPatch(snap, draft);
    if (!patch) return;
    setSaving(true);
    try {
      await extensionsApi.update(extension.id, patch);
      onSaved();
    } finally {
      setSaving(false);
    }
  }, [snap, draft, extension.id, onSaved]);

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
          disabled={saving}
          onValueChange={(v) => setDraft((d) => ({ ...d, name: v }))}
        />
        <InlineField
          variant="controlled"
          label="Size"
          type="select"
          value={draft.size}
          options={EXTENSION_SIZES.map((s) => ({ value: s.value, label: s.label }))}
          icon={<Layers size={12} />}
          disabled={saving}
          onValueChange={(v) => {
            if (v) setDraft((d) => ({ ...d, size: v }));
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
            setDraft((d) => ({ ...d, assignedTo: id, assigneeLabel: label }));
          }}
          onClear={() => {
            setDraft((d) => ({ ...d, assignedTo: null, assigneeLabel: '' }));
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
            disabled={saving}
            onValueChange={(v) => setDraft((d) => ({ ...d, description: v }))}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!dirty || saving}
          onClick={() => void handleSave()}
        >
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!dirty || saving}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </section>
  );
}
