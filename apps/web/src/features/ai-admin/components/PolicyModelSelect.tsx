'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AiModelView } from '@/lib/api/ai-admin';
import { applySelectValue } from '../select-value';

export function ModelSelect(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  models: AiModelView[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{props.label}</Label>
      <Select
        value={props.value}
        onValueChange={(value) => applySelectValue(value, props.onChange)}
      >
        <SelectTrigger>
          <SelectValue placeholder="ACTIVE models only" />
        </SelectTrigger>
        <SelectContent>
          {props.models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.provider} / {model.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
