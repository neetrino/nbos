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

export const NO_PERMISSION_ROLE = 'none';

const ORG_SEAT_KINDS: readonly OrgSeatKind[] = ['HEAD', 'DEPUTY', 'STANDARD'];

function isOrgSeatKind(value: string): value is OrgSeatKind {
  return (ORG_SEAT_KINDS as readonly string[]).includes(value);
}

export type OrgSeatForm = {
  departmentId: string;
  title: string;
  description: string;
  kind: OrgSeatKind;
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
  departments,
  roles,
  canMapRole,
}: FieldProps & {
  seat: OrgSeat | null;
  departments: DepartmentItem[];
  roles: RoleItem[];
  canMapRole: boolean;
}) {
  // The API rejects kind and permission-role changes while a seat is occupied.
  const occupied = (seat?.assignments.length ?? 0) > 0;
  return (
    <>
      <DepartmentField form={form} setForm={setForm} seat={seat} departments={departments} />
      <TitleField form={form} setForm={setForm} />
      <KindField form={form} setForm={setForm} locked={occupied} />
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
  departments,
}: FieldProps & { seat: OrgSeat | null; departments: DepartmentItem[] }) {
  const t = useTranslations('hr.rolesSeats');
  return (
    <div className="space-y-2">
      <Label htmlFor="seat-department">{t('fields.department')}</Label>
      <Select
        value={form.departmentId}
        disabled={Boolean(seat)}
        onValueChange={(departmentId) => {
          if (departmentId) setForm({ ...form, departmentId });
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

function KindField({ form, setForm, locked }: FieldProps & { locked: boolean }) {
  const t = useTranslations('hr.rolesSeats');
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
          <ClosedSelectLabel label={t(`kinds.${form.kind}`)} />
        </SelectTrigger>
        <SelectContent>
          {ORG_SEAT_KINDS.map((kind) => (
            <SelectItem key={kind} value={kind}>
              {t(`kinds.${kind}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <OccupiedHint locked={locked} />
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
