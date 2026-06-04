'use client';

import { RELATION_PICKER_CHIP_TRAILING_SELECT_CLASS } from '@/components/shared/detail-sheet-classes';
import { RelationPickerChip } from '@/components/shared/relation-picker/RelationPickerChip';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DriveGrantRow } from '@/lib/api/drive';
import { formatDriveLabel } from './drive-format';
import { driveGrantPermissionShortLabel } from './drive-grant-permission-label';
import { FILE_GRANT_PERMISSIONS } from './drive-grant-permissions';

const MANUAL_ACCESS_TRAILING_GAP_CLASS = 'flex items-center gap-2';

export function DriveManualAccessGrantRow({
  grant,
  disabled,
  onPermissionChange,
  onRevoke,
}: {
  grant: DriveGrantRow;
  disabled?: boolean;
  onPermissionChange: (grantId: string, permission: string) => void;
  onRevoke: (grantId: string) => void;
}) {
  const relations = useEntityRelations();
  const label = grant.granteeLabel ?? grant.granteeEmployeeId;

  return (
    <RelationPickerChip
      label={label}
      subtitle={grant.granteeEmail ?? null}
      entityKind="employee"
      disabled={disabled}
      onOpen={() => void relations.openEntity('employee', grant.granteeEmployeeId)}
      onClear={() => onRevoke(grant.id)}
      trailing={
        <span className={MANUAL_ACCESS_TRAILING_GAP_CLASS}>
          <Select
            value={grant.permission}
            disabled={disabled}
            onValueChange={(value) => {
              if (value) onPermissionChange(grant.id, value);
            }}
          >
            <SelectTrigger
              size="sm"
              className={RELATION_PICKER_CHIP_TRAILING_SELECT_CLASS}
              aria-label={`Access for ${label}`}
            >
              <SelectValue>{driveGrantPermissionShortLabel(grant.permission)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FILE_GRANT_PERMISSIONS.map((permission) => (
                <SelectItem key={permission} value={permission}>
                  {formatDriveLabel(permission)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </span>
      }
    />
  );
}
