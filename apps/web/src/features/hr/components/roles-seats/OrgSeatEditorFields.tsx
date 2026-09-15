'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { DepartmentItem, RoleItem } from '@/lib/api/employees';
import type { OrgSeat, OrgSeatKind } from '@/lib/api/org-seats';
import { isOrgSeatKind, seatKindOptions, type SeatKindOptions } from './org-seat-kind-options';

export const NO_PERMISSION_ROLE = 'none';

export type OrgSeatForm = {
  departmentId: string;
  title: string;
  description: string;
  kind: OrgSeatKind | '';
  roleId: string;
};

type FieldProps = {
  form: OrgSeatForm;
  setForm: (next: OrgSeatForm) => void;
};

export function OrgSeatEditorFields({
  form,
  setForm,
  seat,
  seats,
  departments,
  roles,
  canMapRole,
}: FieldProps & {
  seat: OrgSeat | null;
  seats: OrgSeat[];
  departments: DepartmentItem[];
  roles: RoleItem[];
  canMapRole: boolean;
}) {
  // The API rejects kind and permission-role changes while a seat is occupied.
  const occupied = (seat?.assignments.length ?? 0) > 0;
  const kindOptions = seatKindOptions(seats, form.departmentId, seat?.id);
  return (
    <>
      <DepartmentField
        form={form}
        setForm={setForm}
        seat={seat}
        seats={seats}
        departments={departments}
      />
      <TitleField form={form} setForm={setForm} />
      <KindField form={form} setForm={setForm} locked={occupied} options={kindOptions} />
      <PermissionRoleField
        form={form}
        setForm={setForm}
        roles={roles}
        canMapRole={canMapRole}
        locked={occupied}
      />
      <DescriptionField form={form} setForm={setForm} />
    </>
  );
}

function OccupiedHint({ locked }: { locked: boolean }) {
  const t = useTranslations('hr.rolesSeats');
  if (!locked) return null;
  return <p className="text-muted-foreground text-xs">{t('editor.lockedWhileOccupied')}</p>;
}

function DepartmentField({
  form,
  setForm,
  seat,
  seats,
  departments,
}: FieldProps & { seat: OrgSeat | null; seats: OrgSeat[]; departments: DepartmentItem[] }) {
  const t = useTranslations('hr.rolesSeats');
  return (
    <div className="space-y-2">
      <Label htmlFor="seat-department">{t('fields.department')}</Label>
      <Select
        value={form.departmentId}
        disabled={Boolean(seat)}
        onValueChange={(departmentId) => {
          if (!departmentId) return;
          const next = seatKindOptions(seats, departmentId, seat?.id);
          const kindAllowed = form.kind !== '' && next.kinds.includes(form.kind);
          setForm({ ...form, departmentId, kind: kindAllowed ? form.kind : '' });
        }}
      >
        <SelectTrigger id="seat-department">
          <ClosedSelectLabel
            label={
              departments.find((department) => department.id === form.departmentId)?.name ?? ''
            }
          />
        </SelectTrigger>
        <SelectContent>
          {departments.map((department) => (
            <SelectItem key={department.id} value={department.id}>
              {department.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TitleField({ form, setForm }: FieldProps) {
  const t = useTranslations('hr.rolesSeats');
  return (
    <div className="space-y-2">
      <Label htmlFor="seat-title">{t('fields.title')}</Label>
      <Input
        id="seat-title"
        value={form.title}
        maxLength={120}
        onChange={(event) => setForm({ ...form, title: event.target.value })}
      />
    </div>
  );
}

function KindField({
  form,
  setForm,
  locked,
  options,
}: FieldProps & { locked: boolean; options: SeatKindOptions }) {
  const t = useTranslations('hr.rolesSeats');
  const selectedKind = form.kind;
  const selectedKindLabel = isOrgSeatKind(selectedKind) ? t(`kinds.${selectedKind}`) : undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor="seat-kind">{t('fields.kind')}</Label>
      <Select
        value={form.kind}
        disabled={locked}
        onValueChange={(kind) => {
          if (kind && isOrgSeatKind(kind)) setForm({ ...form, kind });
        }}
      >
        <SelectTrigger id="seat-kind">
          <SelectValue placeholder={t('editor.kindPlaceholder')}>
            {selectedKindLabel ? () => selectedKindLabel : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.kinds.map((kind) => (
            <SelectItem key={kind} value={kind}>
              {t(`kinds.${kind}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {options.headTaken && !locked ? (
        <p className="text-muted-foreground text-xs">{t('editor.headTaken')}</p>
      ) : (
        <OccupiedHint locked={locked} />
      )}
    </div>
  );
}

function PermissionRoleField({
  form,
  setForm,
  roles,
  canMapRole,
  locked,
}: FieldProps & { roles: RoleItem[]; canMapRole: boolean; locked: boolean }) {
  const t = useTranslations('hr.rolesSeats');
  return (
    <div className="space-y-2">
      <Label htmlFor="seat-role">{t('fields.permissionRole')}</Label>
      <Select
        value={form.roleId}
        disabled={!canMapRole || locked}
        onValueChange={(roleId) => {
          if (roleId) setForm({ ...form, roleId });
        }}
      >
        <SelectTrigger id="seat-role">
          <ClosedSelectLabel label={permissionRoleLabel(form.roleId, roles, t)} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_PERMISSION_ROLE}>{t('noPermissionRole')}</SelectItem>
          {roles
            .filter((role) => role.assignable !== false)
            .map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <OccupiedHint locked={locked} />
    </div>
  );
}

function DescriptionField({ form, setForm }: FieldProps) {
  const t = useTranslations('hr.rolesSeats');
  return (
    <div className="space-y-2">
      <Label htmlFor="seat-description">{t('fields.description')}</Label>
      <Textarea
        id="seat-description"
        value={form.description}
        maxLength={1000}
        onChange={(event) => setForm({ ...form, description: event.target.value })}
      />
    </div>
  );
}

function ClosedSelectLabel({ label }: { label: string }) {
  return <SelectValue>{() => label}</SelectValue>;
}

function permissionRoleLabel(
  roleId: string,
  roles: readonly RoleItem[],
  t: ReturnType<typeof useTranslations>,
): string {
  if (roleId === NO_PERMISSION_ROLE) return t('noPermissionRole');
  return roles.find((role) => role.id === roleId)?.name ?? t('noPermissionRole');
}
