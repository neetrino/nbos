'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { aiAdminApi, type AiModelPolicyView, type AiModelView } from '@/lib/api/ai-admin';
import { ModelSelect } from './PolicyModelSelect';

export function PolicyCandidateEditor(props: {
  policy: AiModelPolicyView;
  eligible: AiModelView[];
  onChanged: () => void;
}) {
  const primary = props.policy.candidates.find((item) => item.role === 'PRIMARY');
  const fallbacks = props.policy.candidates
    .filter((item) => item.role === 'FALLBACK')
    .slice()
    .sort((left, right) => left.priority - right.priority);
  const [primaryId, setPrimaryId] = useState(primary?.modelId ?? '');
  const [fallbackIds, setFallbackIds] = useState<string[]>(
    fallbacks.map((item) => item.modelId).filter(Boolean),
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const candidates =
      props.policy.mode === 'FIXED'
        ? [{ modelId: primaryId, role: 'PRIMARY' as const, priority: 0 }]
        : [
            { modelId: primaryId, role: 'PRIMARY' as const, priority: 0 },
            ...fallbackIds
              .filter((id) => id && id !== primaryId)
              .map((modelId, index) => ({
                modelId,
                role: 'FALLBACK' as const,
                priority: (index + 1) * 10,
              })),
          ];
    setSaving(true);
    try {
      await aiAdminApi.replacePolicyCandidates(props.policy.id, candidates);
      props.onChanged();
    } catch {
      toast.error('Candidate update failed. Use only ACTIVE models.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <ModelSelect
        label="Primary model"
        value={primaryId}
        onChange={setPrimaryId}
        models={props.eligible}
      />
      {props.policy.mode === 'PRIMARY_FALLBACK'
        ? fallbackIds.map((fallbackId, index) => (
            <ModelSelect
              key={`fallback-${index}`}
              label={`Fallback ${index + 1}`}
              value={fallbackId}
              onChange={(value) =>
                setFallbackIds((current) =>
                  current.map((item, itemIndex) => (itemIndex === index ? value : item)),
                )
              }
              models={props.eligible.filter((model) => model.id !== primaryId)}
            />
          ))
        : null}
      {props.policy.mode === 'PRIMARY_FALLBACK' ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setFallbackIds((current) => [...current, ''])}
          >
            Add fallback
          </Button>
          {fallbackIds.length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setFallbackIds((current) => current.slice(0, -1))}
            >
              Remove last fallback
            </Button>
          ) : null}
        </div>
      ) : null}
      <Button type="button" size="sm" disabled={!primaryId || saving} onClick={() => void save()}>
        Save candidates
      </Button>
    </div>
  );
}
