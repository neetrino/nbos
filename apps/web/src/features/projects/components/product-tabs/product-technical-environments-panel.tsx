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
import type { TechnicalEnvironmentDraft } from '@/features/projects/components/product-tabs/product-technical-state';
import { TECHNICAL_ENVIRONMENT_KINDS } from '@/features/projects/components/product-tabs/product-technical-state';
import {
  formatTechnicalEnum,
  technicalHealthVariant,
} from '@/features/projects/utils/product-technical-status';
import type { TechnicalHealthStatus } from '@/lib/api/technical';

interface ProductTechnicalEnvironmentsPanelProps {
  items: Array<{ id: string; title: string; meta: string; status: string }>;
  search: string;
  envDraft: TechnicalEnvironmentDraft;
  saving: boolean;
  onEnvDraftChange: (draft: TechnicalEnvironmentDraft) => void;
  onCreateEnvironment: () => void;
}

export function ProductTechnicalEnvironmentsPanel({
  items,
  search,
  envDraft,
  saving,
  onEnvDraftChange,
  onCreateEnvironment,
}: ProductTechnicalEnvironmentsPanelProps) {
  const [showAdd, setShowAdd] = useState(false);

  if (items.length === 0 && !showAdd && !search.trim()) {
    return (
      <EmptyState
        title="No environments"
        description="Add Production, Staging or Development environments for this product."
        action={
          <Button type="button" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1.5 size-3.5" aria-hidden />
            Add environment
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
          Add environment
        </Button>
      </div>

      {showAdd ? (
        <EnvironmentAddForm
          draft={envDraft}
          saving={saving}
          onChange={onEnvDraftChange}
          onCreate={() => {
            void onCreateEnvironment();
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      ) : null}

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No environments match your search.</p>
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
                variant={technicalHealthVariant(item.status as TechnicalHealthStatus)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EnvironmentAddForm({
  draft,
  saving,
  onChange,
  onCreate,
  onCancel,
}: {
  draft: TechnicalEnvironmentDraft;
  saving: boolean;
  onChange: (draft: TechnicalEnvironmentDraft) => void;
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
          />
        </Field>
        <Field label="Kind">
          <Select
            value={draft.kind}
            onValueChange={(kind) =>
              onChange({ ...draft, kind: kind as TechnicalEnvironmentDraft['kind'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TECHNICAL_ENVIRONMENT_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {formatTechnicalEnum(kind)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="URL">
          <Input
            value={draft.url}
            onChange={(event) => onChange({ ...draft, url: event.target.value })}
            placeholder="https://"
          />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={saving || !draft.name.trim()} onClick={onCreate}>
          Save environment
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
