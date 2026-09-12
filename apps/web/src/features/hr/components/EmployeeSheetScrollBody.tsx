'use client';

import { Building2, Calendar, Mail, Phone, Send, User } from 'lucide-react';
import {
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetOptionalDescription,
  DetailSheetSection,
  InlineField,
} from '@/components/shared';
import { EMPLOYEE_LEVELS, EMPLOYEE_STATUSES } from '@/features/hr/constants/hr';
import {
  TEAM_SHEET_BODY_CLASS,
  TEAM_SHEET_FIELD_GRID_CLASS,
  TEAM_SHEET_SECTION_CLASS,
} from '@/features/hr/constants/team-sheet-layout';
import type { RoleItem } from '@/lib/api/employees';
import type { EmployeeGeneralDraft } from './employee-general-form-state';
import { useTranslations } from 'next-intl';

export interface EmployeeSheetScrollBodyProps {
  employeeId: string;
  draft: EmployeeGeneralDraft;
  patchDraft: (partial: Partial<EmployeeGeneralDraft>) => void;
  roles: RoleItem[];
  saving: boolean;
  canEditPersonal: boolean;
  canEditHr: boolean;
  generalError: string | null;
}

export function EmployeeSheetScrollBody({
  employeeId,
  draft,
  patchDraft,
  roles,
  saving,
  canEditPersonal,
  canEditHr,
  generalError,
}: EmployeeSheetScrollBodyProps) {
  const t = useTranslations('hr.form');
  const tEmp = useTranslations('hr.employment');
  const tStatus = useTranslations('hr.status');
  const tLevel = useTranslations('hr.level');
  const tForms = useTranslations('forms');
  const levelOptions = EMPLOYEE_LEVELS.map((l) => ({
    value: l.value,
    label: tLevel(l.value),
  }));
  const statusOptions = EMPLOYEE_STATUSES.filter(
    (s) => s.value !== 'TERMINATED' || draft.status === 'TERMINATED',
  ).map((s) => ({ value: s.value, label: tStatus(s.value) }));
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));
  const lockPersonal = saving || !canEditPersonal;
  const lockHr = saving || !canEditHr;

  return (
    <div className={`${TEAM_SHEET_BODY_CLASS} ${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS}`}>
      {generalError ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {generalError}
        </p>
      ) : null}

      <DetailSheetSection
        title={t('profile')}
        icon={<User size={12} />}
        className={TEAM_SHEET_SECTION_CLASS}
      >
        <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
          <InlineField
            variant="controlled"
            label={t('firstName')}
            type="text"
            value={draft.firstName}
            placeholder={t('firstName')}
            icon={<User size={12} />}
            disabled={lockPersonal}
            onValueChange={(v) => patchDraft({ firstName: v })}
          />
          <InlineField
            variant="controlled"
            label={t('lastName')}
            type="text"
            value={draft.lastName}
            placeholder={t('lastName')}
            icon={<User size={12} />}
            disabled={lockPersonal}
            onValueChange={(v) => patchDraft({ lastName: v })}
          />
          <InlineField
            variant="controlled"
            label={t('birthday')}
            type="date"
            value={draft.birthday || null}
            icon={<Calendar size={12} />}
            disabled={lockPersonal}
            onValueChange={(v) => patchDraft({ birthday: v ?? '' })}
          />
          <InlineField
            variant="controlled"
            label={t('level')}
            type="select"
            value={draft.level || undefined}
            options={levelOptions}
            placeholder={t('selectLevel')}
            disabled={lockHr}
            onValueChange={(v) => patchDraft({ level: v ?? '' })}
          />
          <InlineField
            variant="controlled"
            label={t('position')}
            type="text"
            value={draft.position}
            placeholder={t('positionPlaceholder')}
            icon={<Building2 size={12} />}
            disabled={lockHr}
            className="col-span-2"
            onValueChange={(v) => patchDraft({ position: v })}
          />
        </div>
      </DetailSheetSection>

      <DetailSheetSection
        title={t('contacts')}
        icon={<Mail size={12} />}
        className={TEAM_SHEET_SECTION_CLASS}
      >
        <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
          <InlineField
            variant="controlled"
            label={t('email')}
            type="email"
            value={draft.email}
            placeholder={t('emailPlaceholder')}
            icon={<Mail size={12} />}
            disabled={lockHr}
            className="col-span-2"
            onValueChange={(v) => patchDraft({ email: v })}
          />
          <InlineField
            variant="controlled"
            label={t('phone')}
            type="phone"
            value={draft.phone}
            placeholder="+1 …"
            icon={<Phone size={12} />}
            disabled={lockPersonal}
            onValueChange={(v) => patchDraft({ phone: v })}
          />
          <InlineField
            variant="controlled"
            label={t('sipId')}
            type="text"
            value={draft.sipId}
            placeholder="3126107"
            icon={<Phone size={12} />}
            disabled={lockPersonal}
            onValueChange={(v) => patchDraft({ sipId: v })}
          />
          <InlineField
            variant="controlled"
            label={t('telegram')}
            type="text"
            value={draft.telegram}
            placeholder="@username"
            icon={<Send size={12} />}
            disabled={lockPersonal}
            className="col-span-2"
            onValueChange={(v) => patchDraft({ telegram: v })}
          />
        </div>
      </DetailSheetSection>

      <DetailSheetSection
        title={t('employment')}
        icon={<Calendar size={12} />}
        className={TEAM_SHEET_SECTION_CLASS}
      >
        <div className={TEAM_SHEET_FIELD_GRID_CLASS}>
          <InlineField
            variant="controlled"
            label={tEmp('status')}
            type="select"
            value={draft.status}
            options={statusOptions}
            disabled={lockHr}
            onValueChange={(v) => patchDraft({ status: v ?? draft.status })}
          />
          <InlineField
            variant="controlled"
            label={tEmp('hireDate')}
            type="date"
            value={draft.hireDate || null}
            placeholder={tForms('datePicker.selectDate')}
            icon={<Calendar size={12} />}
            disabled={lockHr}
            onValueChange={(v) => patchDraft({ hireDate: v ?? '' })}
          />
          <InlineField
            variant="controlled"
            label={tEmp('platformRole')}
            type="select"
            value={draft.roleId}
            options={roleOptions}
            disabled={lockHr}
            className="col-span-2"
            onValueChange={(v) => patchDraft({ roleId: v ?? draft.roleId })}
          />
        </div>
      </DetailSheetSection>

      <DetailSheetOptionalDescription
        entityType="generic"
        entityId={employeeId}
        value={draft.notes}
        onChange={(notes) => patchDraft({ notes: notes ?? '' })}
        disabled={lockHr}
      />
    </div>
  );
}
