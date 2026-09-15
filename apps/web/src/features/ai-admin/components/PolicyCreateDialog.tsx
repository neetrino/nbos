'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { CreateFormDialog, FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { aiAdminApi, type AiModelView } from '@/lib/api/ai-admin';
import { AI_ADMIN_POLICY_MODES, type AiAdminPolicyMode } from '../constants';
import { ModelSelect } from './PolicyModelSelect';

const POLICY_MODE_LABELS: Record<AiAdminPolicyMode, string> = {
  FIXED: 'Fixed',
  PRIMARY_FALLBACK: 'Primary + fallback',
};

export function PolicyCreateDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligible: AiModelView[];
  onCreated: () => void;
}) {
  return <PolicyCreateDialogSession key={props.open ? 'open' : 'closed'} {...props} />;
}

function PolicyCreateDialogSession({
  open,
  onOpenChange,
  eligible,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligible: AiModelView[];
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<AiAdminPolicyMode>('FIXED');
  const [primaryId, setPrimaryId] = useState('');
  const [fallbackId, setFallbackId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(primaryId) &&
    (mode !== 'PRIMARY_FALLBACK' || Boolean(fallbackId)) &&
    !submitting;
  const modeOptions = AI_ADMIN_POLICY_MODES.map((item) => ({
    value: item,
    label: POLICY_MODE_LABELS[item],
  }));

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create policy"
      description="Fixed uses one model. Primary + fallback tries a fallback when the primary is unavailable."
      submitting={submitting}
      canSubmit={canSubmit}
      submitLabel="Create"
      submittingLabel="Creating..."
      cancelLabel="Cancel"
      onSubmit={(event) =>
        void submitPolicy({
          event,
          name,
          mode,
          primaryId,
          fallbackId,
          setSubmitting,
          onCreated,
          onOpenChange,
        })
      }
    >
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label="Name"
          type="text"
          value={name}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={setName}
        />
        <InlineField
          variant="controlled"
          label="Mode"
          type="select"
          value={mode}
          options={modeOptions}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(value) => value && setMode(value as AiAdminPolicyMode)}
        />
      </FormFieldRow>
      <FormFieldRow>
        <div className={FORM_FIELD_CELL_CLASS}>
          <ModelSelect
            label="Primary model"
            value={primaryId}
            onChange={setPrimaryId}
            models={eligible}
          />
        </div>
        {mode === 'PRIMARY_FALLBACK' ? (
          <div className={FORM_FIELD_CELL_CLASS}>
            <ModelSelect
              label="Fallback model"
              value={fallbackId}
              onChange={setFallbackId}
              models={eligible}
            />
          </div>
        ) : null}
      </FormFieldRow>
    </CreateFormDialog>
  );
}

async function submitPolicy(options: {
  event: FormEvent;
  name: string;
  mode: AiAdminPolicyMode;
  primaryId: string;
  fallbackId: string;
  setSubmitting: (submitting: boolean) => void;
  onCreated: () => void;
  onOpenChange: (open: boolean) => void;
}): Promise<void> {
  options.event.preventDefault();
  const candidates =
    options.mode === 'FIXED'
      ? [{ modelId: options.primaryId, role: 'PRIMARY' as const, priority: 0 }]
      : [
          { modelId: options.primaryId, role: 'PRIMARY' as const, priority: 0 },
          { modelId: options.fallbackId, role: 'FALLBACK' as const, priority: 10 },
        ];
  options.setSubmitting(true);
  try {
    await aiAdminApi.createPolicy({ name: options.name.trim(), mode: options.mode, candidates });
    options.onCreated();
    options.onOpenChange(false);
  } catch {
    toast.error('Policy create failed. Use only ACTIVE models.');
  } finally {
    options.setSubmitting(false);
  }
}
