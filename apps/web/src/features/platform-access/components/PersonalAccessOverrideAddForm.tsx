'use client';

import { Plus } from 'lucide-react';
import type { AccessScopeMode, PlatformAccessAction, PlatformResourceFamily } from '@nbos/shared';
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
import {
  ACCESS_POLICY_FAMILIES,
  ACCESS_POLICY_LEVEL_OPTIONS,
  ACCESS_POLICY_SCOPE_OPTIONS,
  formatResourceFamilyLabel,
} from '../constants';
import { isRiskyPersonalOverride } from '../utils/access-policy-risk';

export interface PersonalAccessOverrideAddFormProps {
  addFamily: PlatformResourceFamily;
  addLevel: PlatformAccessAction;
  addScope: AccessScopeMode;
  addReason: string;
  availableFamilies: PlatformResourceFamily[];
  saving: boolean;
  onFamilyChange: (family: PlatformResourceFamily) => void;
  onLevelChange: (level: PlatformAccessAction) => void;
  onScopeChange: (scope: AccessScopeMode) => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
}

export function PersonalAccessOverrideAddForm({
  addFamily,
  addLevel,
  addScope,
  addReason,
  availableFamilies,
  saving,
  onFamilyChange,
  onLevelChange,
  onScopeChange,
  onReasonChange,
  onSubmit,
}: PersonalAccessOverrideAddFormProps) {
  const familyOptions = availableFamilies.length > 0 ? availableFamilies : ACCESS_POLICY_FAMILIES;

  return (
    <div className="border-border bg-muted/30 grid gap-3 rounded-xl border p-4 md:grid-cols-2 lg:grid-cols-5">
      <div>
        <Label>Resource family</Label>
        <Select
          value={addFamily}
          onValueChange={(v) => onFamilyChange(v as PlatformResourceFamily)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {familyOptions.map((family) => (
              <SelectItem key={family} value={family}>
                {formatResourceFamilyLabel(family)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Level</Label>
        <Select value={addLevel} onValueChange={(v) => onLevelChange(v as PlatformAccessAction)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCESS_POLICY_LEVEL_OPTIONS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Scope</Label>
        <Select value={addScope} onValueChange={(v) => onScopeChange(v as AccessScopeMode)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCESS_POLICY_SCOPE_OPTIONS.map((scope) => (
              <SelectItem key={scope} value={scope}>
                {scope}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label>
          Reason
          {isRiskyPersonalOverride(addLevel, addScope) ? ' (required)' : ''}
        </Label>
        <Input
          className="mt-1"
          value={addReason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Why this override is needed"
        />
      </div>
      <div className="flex items-end">
        <Button type="button" disabled={saving} onClick={onSubmit}>
          <Plus size={16} aria-hidden />
          Add / update
        </Button>
      </div>
    </div>
  );
}
