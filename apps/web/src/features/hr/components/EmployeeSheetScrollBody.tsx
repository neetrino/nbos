'use client';

import { Building2, Calendar, Mail, Phone, Send, User } from 'lucide-react';
import { DetailSheetSection, EntityNotesSection, InlineField } from '@/components/shared';
import { EMPLOYEE_LEVELS, EMPLOYEE_STATUSES } from '@/features/hr/constants/hr';
import {
  TEAM_SHEET_BODY_CLASS,
  TEAM_SHEET_FIELD_GRID_CLASS,
  TEAM_SHEET_SECTION_CLASS,
} from '@/features/hr/constants/team-sheet-layout';
import type { RoleItem } from '@/lib/api/employees';
import type { EmployeeGeneralDraft } from './employee-general-form-state';

export interface EmployeeSheetScrollBodyProps {
  employeeId: string;
  draft: EmployeeGeneralDraft;
  patchDraft: (partial: Partial<EmployeeGeneralDraft>) => void;
  roles: RoleItem[];
  saving: boolean;
  canEdit: boolean;
  generalError: string | null;
}

export function EmployeeSheetScrollBody({
  employeeId,
  draft,
  patchDraft,
  roles,
  saving,
  canEdit,
  generalError,
}: EmployeeSheetScrollBodyProps) {
  const levelOptions = EMPLOYEE_LEVELS.map((l) => ({ value: l.value, label: l.label }));
  const statusOptions = EMPLOYEE_STATUSES.map((s) => ({ value: s.value, label: s.label }));
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <div className={TEAM_SHEET_BODY_CLASS}>
      {generalError ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {generalError}
        </p>
      ) : null}

      <DetailSheetSection
        title="Profile"
        icon={<User size={12} />}
        className={TEAM_SHEET_SECTION_CLASS}
      >
        <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
          <InlineField
            variant="controlled"
            label="First name"
            type="text"
            value={draft.firstName}
            placeholder="First name"
            icon={<User size={12} />}
            disabled={saving || !canEdit}
            onValueChange={(v) => patchDraft({ firstName: v })}
          />
          <InlineField
            variant="controlled"
            label="Last name"
            type="text"
            value={draft.lastName}
            placeholder="Last name"
            icon={<User size={12} />}
            disabled={saving || !canEdit}
            onValueChange={(v) => patchDraft({ lastName: v })}
          />
          <InlineField
            variant="controlled"
            label="Position / seat"
            type="text"
            value={draft.position}
            placeholder="e.g. Senior Developer"
            icon={<Building2 size={12} />}
            disabled={saving || !canEdit}
            onValueChange={(v) => patchDraft({ position: v })}
          />
          <InlineField
            variant="controlled"
            label="Level"
            type="select"
            value={draft.level || undefined}
            options={levelOptions}
            placeholder="Select level"
            disabled={saving || !canEdit}
            onValueChange={(v) => patchDraft({ level: v ?? '' })}
          />
        </div>
      </DetailSheetSection>

      <DetailSheetSection
        title="Contacts"
        icon={<Mail size={12} />}
        className={TEAM_SHEET_SECTION_CLASS}
      >
        <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
          <InlineField
            variant="controlled"
            label="Email"
            type="email"
            value={draft.email}
            placeholder="name@company.com"
            icon={<Mail size={12} />}
            disabled={saving || !canEdit}
            onValueChange={(v) => patchDraft({ email: v })}
          />
          <InlineField
            variant="controlled"
            label="Phone"
            type="phone"
            value={draft.phone}
            placeholder="+1 …"
            icon={<Phone size={12} />}
            disabled={saving || !canEdit}
            onValueChange={(v) => patchDraft({ phone: v })}
          />
          <InlineField
            variant="controlled"
            label="Telegram"
            type="text"
            value={draft.telegram}
            placeholder="@username"
            icon={<Send size={12} />}
            disabled={saving || !canEdit}
            onValueChange={(v) => patchDraft({ telegram: v })}
          />
        </div>
      </DetailSheetSection>

      <DetailSheetSection
        title="Employment"
        icon={<Calendar size={12} />}
        className={TEAM_SHEET_SECTION_CLASS}
      >
        <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
          <InlineField
            variant="controlled"
            label="Status"
            type="select"
            value={draft.status}
            options={statusOptions}
            disabled={saving || !canEdit}
            onValueChange={(v) => patchDraft({ status: v ?? draft.status })}
          />
          <InlineField
            variant="controlled"
            label="Platform role"
            type="select"
            value={draft.roleId}
            options={roleOptions}
            disabled={saving || !canEdit}
            onValueChange={(v) => patchDraft({ roleId: v ?? draft.roleId })}
          />
          <InlineField
            variant="controlled"
            label="Hire date"
            type="date"
            value={draft.hireDate || null}
            icon={<Calendar size={12} />}
            disabled={saving || !canEdit}
            onValueChange={(v) => patchDraft({ hireDate: v ?? '' })}
          />
        </div>
      </DetailSheetSection>

      <EntityNotesSection
        entityType="generic"
        entityId={employeeId}
        value={draft.notes}
        onChange={(notes) => patchDraft({ notes: notes ?? '' })}
        placeholder="HR notes — visible to HR and leadership"
        disabled={saving || !canEdit}
      />
    </div>
  );
}
