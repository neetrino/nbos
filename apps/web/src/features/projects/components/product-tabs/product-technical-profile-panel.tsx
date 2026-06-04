'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TechnicalProductProfileResponse } from '@/lib/api/technical';
import type { TechnicalProfileDraft } from '@/features/projects/components/product-tabs/product-technical-state';

interface ProductTechnicalProfilePanelProps {
  data: TechnicalProductProfileResponse;
  draft: TechnicalProfileDraft;
  saving: boolean;
  onDraftChange: (draft: TechnicalProfileDraft) => void;
  onSave: () => void;
}

export function ProductTechnicalProfilePanel({
  data,
  draft,
  saving,
  onDraftChange,
  onSave,
}: ProductTechnicalProfilePanelProps) {
  return (
    <div className="space-y-4">
      {!data.readiness.isReadyForTransfer && data.readiness.blockers.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          {data.readiness.blockers.map((blocker) => (
            <li key={blocker.code}>
              <span className="font-medium">{blocker.label}:</span> {blocker.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Production URL">
          <Input
            value={draft.productionUrl}
            onChange={(event) => onDraftChange({ ...draft, productionUrl: event.target.value })}
            placeholder="https://"
          />
        </Field>
        <Field label="Repository URL">
          <Input
            value={draft.repositoryUrl}
            onChange={(event) => onDraftChange({ ...draft, repositoryUrl: event.target.value })}
            placeholder="https://github.com/…"
          />
        </Field>
        <Field label="Hosting provider">
          <Input
            value={draft.hostingProvider}
            onChange={(event) => onDraftChange({ ...draft, hostingProvider: event.target.value })}
            placeholder="Vercel, Hetzner…"
          />
        </Field>
      </div>

      <div className="text-muted-foreground grid gap-2 text-xs sm:grid-cols-3">
        <SummaryItem label="Environments" value={String(data.readiness.summary.environmentCount)} />
        <SummaryItem label="Assets" value={String(data.readiness.summary.assetCount)} />
        <SummaryItem
          label="Credential links"
          value={String(data.readiness.summary.credentialLinkedCount)}
        />
      </div>

      <Button type="button" size="sm" disabled={saving} onClick={() => void onSave()}>
        Save profile
      </Button>
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg px-3 py-2">
      <p>{label}</p>
      <p className="text-foreground font-semibold tabular-nums">{value}</p>
    </div>
  );
}
