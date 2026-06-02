'use client';

import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CREDENTIAL_CRITICALITIES } from '@/features/credentials/constants/credentials';
import { StatusBadge } from '@/components/shared';

export interface CredentialFormSettingsPanelProps {
  criticality: string;
  onCriticalityChange: (value: string) => void;
  nextRotationAt: string;
  onNextRotationAtChange: (value: string) => void;
  readOnly?: boolean;
}

export function CredentialFormSettingsPanel({
  criticality,
  onCriticalityChange,
  nextRotationAt,
  onNextRotationAtChange,
  readOnly = false,
}: CredentialFormSettingsPanelProps) {
  const critMeta = CREDENTIAL_CRITICALITIES.find((c) => c.value === criticality);

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground text-xs">
        Criticality and rotation are auto-assigned on create. Override here when needed.
      </p>
      <div className="grid gap-2">
        <Label>Criticality</Label>
        {readOnly && critMeta ? (
          <StatusBadge label={critMeta.label} variant={critMeta.variant} />
        ) : (
          <Select
            value={criticality}
            onValueChange={(v) => onCriticalityChange(v ?? criticality)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CREDENTIAL_CRITICALITIES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cred-settings-rotation">Next rotation</Label>
        <NbosDatePicker
          id="cred-settings-rotation"
          value={nextRotationAt}
          onChange={onNextRotationAtChange}
          disabled={readOnly}
          aria-label="Next rotation"
        />
      </div>
    </div>
  );
}
