'use client';

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
import type {
  TechnicalBackupPolicyDraft,
  TechnicalDeployDraft,
} from '@/features/projects/components/product-tabs/product-technical-state';
import {
  TECHNICAL_BACKUP_STATUSES,
  TECHNICAL_DEPLOY_STATUSES,
  TECHNICAL_ENVIRONMENT_KINDS,
} from '@/features/projects/components/product-tabs/product-technical-state';
import { formatTechnicalEnum } from '@/features/projects/utils/product-technical-status';

interface ProductTechnicalOpsPanelProps {
  deployDraft: TechnicalDeployDraft;
  backupDraft: TechnicalBackupPolicyDraft;
  lastDeployAt: string | null;
  saving: boolean;
  onDeployChange: (draft: TechnicalDeployDraft) => void;
  onBackupChange: (draft: TechnicalBackupPolicyDraft) => void;
  onRecordDeploy: () => void;
  onSaveBackupPolicy: () => void;
}

export function ProductTechnicalOpsPanel({
  deployDraft,
  backupDraft,
  lastDeployAt,
  saving,
  onDeployChange,
  onBackupChange,
  onRecordDeploy,
  onSaveBackupPolicy,
}: ProductTechnicalOpsPanelProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="border-border space-y-3 rounded-xl border p-3">
        <div>
          <h3 className="text-sm font-semibold">Deploy</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Last deploy: {lastDeployAt ? new Date(lastDeployAt).toLocaleString() : 'not recorded'}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Status"
            value={deployDraft.status}
            options={TECHNICAL_DEPLOY_STATUSES}
            onChange={(status) =>
              onDeployChange({ ...deployDraft, status: status as TechnicalDeployDraft['status'] })
            }
          />
          <SelectField
            label="Environment"
            value={deployDraft.environment}
            options={TECHNICAL_ENVIRONMENT_KINDS}
            onChange={(environment) =>
              onDeployChange({
                ...deployDraft,
                environment: environment as TechnicalDeployDraft['environment'],
              })
            }
          />
          <TextField
            label="Version"
            value={deployDraft.version}
            onChange={(version) => onDeployChange({ ...deployDraft, version })}
          />
          <TextField
            label="Notes"
            value={deployDraft.notes}
            onChange={(notes) => onDeployChange({ ...deployDraft, notes })}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => void onRecordDeploy()}
        >
          Record deploy
        </Button>
      </section>

      <section className="border-border space-y-3 rounded-xl border p-3">
        <h3 className="text-sm font-semibold">Backup policy</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Status"
            value={backupDraft.backupStatus}
            options={TECHNICAL_BACKUP_STATUSES}
            onChange={(backupStatus) =>
              onBackupChange({
                ...backupDraft,
                backupStatus: backupStatus as TechnicalBackupPolicyDraft['backupStatus'],
              })
            }
          />
          <TextField
            label="Policy name"
            value={backupDraft.policyName}
            onChange={(policyName) => onBackupChange({ ...backupDraft, policyName })}
          />
          <TextField
            label="RPO (hours)"
            value={backupDraft.rpoHours}
            onChange={(rpoHours) => onBackupChange({ ...backupDraft, rpoHours })}
          />
          <TextField
            label="RTO (hours)"
            value={backupDraft.rtoHours}
            onChange={(rtoHours) => onBackupChange({ ...backupDraft, rtoHours })}
          />
          <TextField
            label="Restore test (days)"
            value={backupDraft.restoreTestCadenceDays}
            onChange={(restoreTestCadenceDays) =>
              onBackupChange({ ...backupDraft, restoreTestCadenceDays })
            }
          />
          <TextField
            label="Notes"
            value={backupDraft.notes}
            onChange={(notes) => onBackupChange({ ...backupDraft, notes })}
          />
        </div>
        <Button type="button" size="sm" disabled={saving} onClick={() => void onSaveBackupPolicy()}>
          Save backup policy
        </Button>
      </section>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {formatTechnicalEnum(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
