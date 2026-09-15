'use client';

import { InlineField } from '@/components/shared';
import type { AiModelView } from '@/lib/api/ai-admin';

export function ModelSelect(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  models: AiModelView[];
}) {
  const options = props.models.map((model) => ({
    value: model.id,
    label: `${model.provider} / ${model.displayName}`,
  }));

  return (
    <InlineField
      variant="controlled"
      label={props.label}
      type="select"
      value={props.value}
      options={options}
      placeholder="ACTIVE models only"
      onValueChange={(value) => value && props.onChange(value)}
    />
  );
}
