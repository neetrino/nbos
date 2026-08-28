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
import { AiAdminProviderBrand } from './AiAdminProviderBrand';

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
              <span className="flex min-w-0 items-center gap-2">
                <AiAdminProviderBrand provider={model.provider} className="size-3.5" />
                <span className="truncate">
                  {model.provider} / {model.displayName}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
