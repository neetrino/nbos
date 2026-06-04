'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, StatusBadge } from '@/components/shared';
import type { TechnicalAssetDraft } from '@/features/projects/components/product-tabs/product-technical-state';
import { TECHNICAL_ASSET_TYPES } from '@/features/projects/components/product-tabs/product-technical-state';
import {
  formatTechnicalEnum,
  technicalAssetStatusVariant,
} from '@/features/projects/utils/product-technical-status';

interface ProductTechnicalAssetsPanelProps {
  items: Array<{ id: string; title: string; meta: string; status: string }>;
  search: string;
  assetDraft: TechnicalAssetDraft;
  saving: boolean;
  onAssetDraftChange: (draft: TechnicalAssetDraft) => void;
  onCreateAsset: () => void;
}

export function ProductTechnicalAssetsPanel({
  items,
  search,
  assetDraft,
  saving,
  onAssetDraftChange,
  onCreateAsset,
}: ProductTechnicalAssetsPanelProps) {
  const [showAdd, setShowAdd] = useState(false);

  if (items.length === 0 && !showAdd && !search.trim()) {
    return (
      <EmptyState
        title="No technical assets"
        description="Add hosting, repository, database, monitoring or domain dependencies."
        action={
          <Button type="button" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1.5 size-3.5" aria-hidden />
            Add asset
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="mr-1.5 size-3.5" aria-hidden />
          Add asset
        </Button>
      </div>

      {showAdd ? (
        <AssetAddForm
          draft={assetDraft}
          saving={saving}
          onChange={onAssetDraftChange}
          onCreate={() => {
            void onCreateAsset();
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      ) : null}

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No assets match your search.</p>
      ) : (
        <div className="divide-border divide-y rounded-xl border">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-muted-foreground truncate text-xs">{item.meta}</p>
              </div>
              <StatusBadge
                label={formatTechnicalEnum(item.status)}
                variant={technicalAssetStatusVariant(
                  item.status as Parameters<typeof technicalAssetStatusVariant>[0],
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssetAddForm({
  draft,
  saving,
  onChange,
  onCreate,
  onCancel,
}: {
  draft: TechnicalAssetDraft;
  saving: boolean;
  onChange: (draft: TechnicalAssetDraft) => void;
  onCreate: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-muted/30 border-border space-y-3 rounded-xl border p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name">
          <Input
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder="Production DB"
          />
        </Field>
        <Field label="Type">
          <Select
            value={draft.type}
            onValueChange={(type) =>
              onChange({ ...draft, type: type as TechnicalAssetDraft['type'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TECHNICAL_ASSET_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {formatTechnicalEnum(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Provider">
          <Input
            value={draft.provider}
            onChange={(event) => onChange({ ...draft, provider: event.target.value })}
            placeholder="Hetzner"
          />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={saving || !draft.name.trim()} onClick={onCreate}>
          Save asset
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {children}
    </div>
  );
}
