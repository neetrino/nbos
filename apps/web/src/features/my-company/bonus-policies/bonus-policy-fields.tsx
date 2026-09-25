'use client';

import { InlineField } from '@/components/shared';
import { BONUS_POLICY_TEMPLATE_OPTIONS } from '@/features/my-company/bonus-policies/bonus-policy-template-options';
import type { BonusPolicyRow, BonusPolicyStatus } from '@/lib/api/bonus-policies';
import type { BonusPolicyDraft } from './bonus-policy-draft';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function BonusPolicyFields({
  policy,
  draft,
  saving,
  onChange,
}: {
  policy: BonusPolicyRow | null;
  draft: BonusPolicyDraft;
  saving: boolean;
  onChange: (next: Partial<BonusPolicyDraft>) => void;
}) {
  const creating = policy == null;
  const hint = BONUS_POLICY_TEMPLATE_OPTIONS.find(
    (option) => option.value === draft.templateCode,
  )?.hint;

  return (
    <div className="grid gap-3">
      <InlineField
        variant="controlled"
        label="Name"
        value={draft.name}
        placeholder="Delivery manual Q2"
        disabled={saving}
        onValueChange={(name) => onChange({ name })}
      />
      <BonusCalculationField
        creating={creating}
        templateCode={draft.templateCode}
        saving={saving}
        onChange={onChange}
      />
      {hint ? <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p> : null}
      {creating ? null : (
        <InlineField
          variant="controlled"
          type="select"
          label="Status"
          value={draft.status}
          options={STATUS_OPTIONS}
          disabled={saving}
          onValueChange={(status) => onChange({ status: status as BonusPolicyStatus })}
        />
      )}
      <InlineField
        variant="controlled"
        label="Applies to"
        value={draft.scope}
        placeholder="Company"
        disabled={saving}
        onValueChange={(scope) => onChange({ scope })}
      />
      <InlineField
        variant="controlled"
        type="textarea"
        label="Notes"
        value={draft.notes}
        disabled={saving}
        onValueChange={(notes) => onChange({ notes })}
      />
    </div>
  );
}

function BonusCalculationField({
  creating,
  templateCode,
  saving,
  onChange,
}: {
  creating: boolean;
  templateCode: string;
  saving: boolean;
  onChange: (next: Partial<BonusPolicyDraft>) => void;
}) {
  const label = 'How the bonus is calculated';
  if (!creating) {
    const current =
      BONUS_POLICY_TEMPLATE_OPTIONS.find((option) => option.value === templateCode)?.label ??
      templateCode;
    return (
      <InlineField
        variant="controlled"
        label={label}
        value={current}
        disabled
        onValueChange={() => undefined}
      />
    );
  }
  return (
    <InlineField
      variant="controlled"
      type="select"
      label={label}
      value={templateCode}
      options={BONUS_POLICY_TEMPLATE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      disabled={saving}
      onValueChange={(next) => onChange({ templateCode: next })}
    />
  );
}
