'use client';

import { ROLE_UNITS_BREAKDOWN_CLASS } from './delivery-norms.constants';
import { replaceRoleUnitDraft, type RoleUnitDraftRow } from './role-units-draft';
import { RoleUnitField } from './role-unit-field';

export function RoleUnitsEditor({
  rows,
  disabled,
  onChange,
}: {
  rows: RoleUnitDraftRow[];
  disabled?: boolean;
  onChange: (next: RoleUnitDraftRow[]) => void;
}) {
  return (
    <fieldset className="contents" disabled={disabled}>
      <div className={ROLE_UNITS_BREAKDOWN_CLASS}>
        {rows.map((row) => (
          <div key={row.roleKey} className="py-2 first:pt-0 last:pb-0">
            <RoleUnitField
              row={row}
              disabled={disabled}
              onChange={(patch) => onChange(replaceRoleUnitDraft(rows, row.roleKey, patch))}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
