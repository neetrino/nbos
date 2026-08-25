'use client';

import { Clock, Cpu, RefreshCw, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { aiAdminApi, type AiModelView } from '@/lib/api/ai-admin';
import { AI_ADMIN_FOOTER_BAR_CLASS, AI_ADMIN_ICON_ACCENT_CLASS } from '../ai-admin-ui.constants';
import { formatTimestamp } from '../format';
import { applySelectValue } from '../select-value';
import { agentStateVariant } from '../status-badge-map';
import { aiAdminProviderGlyph } from './AiAdminProviderBrand';
import { AiAdminSection } from './AiAdminSection';

export function ModelCatalogCard(props: {
  model: AiModelView;
  onChanged: () => Promise<void>;
  onDisable: () => void;
}) {
  const { model } = props;
  return (
    <AiAdminSection
      icon={Cpu}
      glyph={aiAdminProviderGlyph(model.provider, 'size-4')}
      title={model.displayName}
      description={`${model.provider} · ${model.providerModelId}`}
      summary={model.evaluationStatus}
      collapsible
      defaultOpen={model.status === 'ACTIVE'}
      actions={<StatusBadge label={model.status} variant={agentStateVariant(model.status)} dot />}
    >
      <ModelCatalogCardMeta model={model} />
      <ModelEvaluationFields model={model} onChanged={props.onChanged} />
      <ModelCatalogCardActions
        model={model}
        onChanged={props.onChanged}
        onDisable={props.onDisable}
      />
    </AiAdminSection>
  );
}

function ModelCatalogCardMeta({ model }: { model: AiModelView }) {
  const metadataKeys = Object.keys(model.providerMetadata);
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Clock className={cn('size-3.5', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
          {formatTimestamp(model.discoveredAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw className={cn('size-3.5', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
          {formatTimestamp(model.lastSeenAt)}
        </span>
      </p>
      {metadataKeys.length > 0 ? (
        <p className="text-muted-foreground text-xs">Metadata: {metadataKeys.join(', ')}</p>
      ) : null}
      {model.suitabilityTags.length > 0 ? (
        <p className="flex items-center gap-1.5 text-xs">
          <Tag className={cn('size-3.5', AI_ADMIN_ICON_ACCENT_CLASS)} aria-hidden />
          {model.suitabilityTags.join(', ')}
        </p>
      ) : null}
    </div>
  );
}

function ModelEvaluationFields(props: { model: AiModelView; onChanged: () => Promise<void> }) {
  const { model } = props;
  return (
    <div className="mt-4 space-y-3">
      <div className="space-y-1.5">
        <Label>Evaluation</Label>
        <Select
          value={model.evaluationStatus}
          onValueChange={(value) =>
            applySelectValue(value, (next) => {
              if (next === model.evaluationStatus) return;
              void aiAdminApi
                .updateModel(model.id, {
                  evaluationStatus: next as AiModelView['evaluationStatus'],
                })
                .then(props.onChanged)
                .catch(() => toast.error('Evaluation status could not be saved.'));
            })
          }
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NOT_EVALUATED">NOT_EVALUATED</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="EVALUATED">EVALUATED</SelectItem>
            <SelectItem value="UNSUITABLE">UNSUITABLE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`model-notes-${model.id}`}>Notes</Label>
        <Input
          id={`model-notes-${model.id}`}
          defaultValue={model.notes ?? ''}
          onBlur={(event) => {
            const notes = event.target.value.trim() || null;
            if (notes === (model.notes ?? null)) return;
            void aiAdminApi
              .updateModel(model.id, { notes })
              .then(props.onChanged)
              .catch(() => toast.error('Notes could not be saved.'));
          }}
        />
      </div>
    </div>
  );
}

function ModelCatalogCardActions(props: {
  model: AiModelView;
  onChanged: () => Promise<void>;
  onDisable: () => void;
}) {
  const { model } = props;
  const showActivate = model.status !== 'ACTIVE' && model.status !== 'UNAVAILABLE';
  const showDisable = model.status === 'ACTIVE';
  if (!showActivate && !showDisable) return null;

  return (
    <div className={AI_ADMIN_FOOTER_BAR_CLASS}>
      {showActivate ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            void aiAdminApi
              .activateModel(model.id)
              .then(props.onChanged)
              .catch(() => toast.error('Activate failed.'))
          }
        >
          Activate
        </Button>
      ) : null}
      {showDisable ? (
        <Button type="button" size="sm" variant="outline" onClick={props.onDisable}>
          Disable
        </Button>
      ) : null}
    </div>
  );
}
