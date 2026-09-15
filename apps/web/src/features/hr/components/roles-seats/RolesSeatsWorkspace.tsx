'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { departmentsApi, rolesApi, type DepartmentItem, type RoleItem } from '@/lib/api/employees';
import {
  orgSeatsApi,
  type CreateOrgSeatPayload,
  type OrgSeat,
  type UpdateOrgSeatPayload,
} from '@/lib/api/org-seats';
import { usePermission } from '@/lib/permissions';
import { EmployeeEffectiveAccessDialog } from './EmployeeEffectiveAccessDialog';
import { OrgSeatAssignmentDialog } from './OrgSeatAssignmentDialog';
import { OrgSeatEditorDialog } from './OrgSeatEditorDialog';
import {
  RolesSeatsDepartmentRail,
  RolesSeatsGrid,
  RolesSeatsHeader,
} from './RolesSeatsWorkspaceView';

export function RolesSeatsWorkspace() {
  const t = useTranslations('hr.rolesSeats');
  const { can } = usePermission();
  const [data, setData] = useState<WorkspaceData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [editor, setEditor] = useState<{ open: boolean; seat: OrgSeat | null }>({
    open: false,
    seat: null,
  });
  const [assignmentSeat, setAssignmentSeat] = useState<OrgSeat | null>(null);
  const [endingAssignmentId, setEndingAssignmentId] = useState<string | null>(null);
  const [accessEmployeeId, setAccessEmployeeId] = useState<string | null>(null);
  const canEdit = can('EDIT', 'COMPANY');
  const canMapRole = can('EDIT', 'SETTINGS_RBAC');
  const canViewAccess = can('VIEW', 'SETTINGS_RBAC');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [departments, seats, roles] = await Promise.all([
        departmentsApi.getAll(),
        orgSeatsApi.getAll(),
        canMapRole ? rolesApi.getAll() : Promise.resolve([]),
      ]);
      setData({ departments, seats, roles });
      setSelectedDepartmentId((current) => current || canonicalRootId(departments));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t, canMapRole]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedSeats = useMemo(
    () => data.seats.filter((seat) => seat.departmentId === selectedDepartmentId),
    [data.seats, selectedDepartmentId],
  );

  async function saveSeat(payload: CreateOrgSeatPayload | UpdateOrgSeatPayload): Promise<void> {
    try {
      if (editor.seat) await orgSeatsApi.update(editor.seat.id, payload);
      else await orgSeatsApi.create(payload as CreateOrgSeatPayload);
      toast.success(t(editor.seat ? 'updated' : 'created'));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveFailed'));
      throw error;
    }
  }

  async function assignEmployee(employeeId: string): Promise<void> {
    if (!assignmentSeat) return;
    const fallbackKey = endingAssignmentId ? 'endFailed' : 'assignFailed';
    try {
      if (endingAssignmentId) await orgSeatsApi.endAssignment(endingAssignmentId);
      else await orgSeatsApi.assign(assignmentSeat.id, { employeeId });
      toast.success(t(endingAssignmentId ? 'ended' : 'assigned'));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(fallbackKey));
      throw error;
    }
  }

  function endAssignment(assignmentId: string): void {
    const seat = data.seats.find((item) =>
      item.assignments.some((assignment) => assignment.id === assignmentId),
    );
    if (!seat) return;
    setEndingAssignmentId(assignmentId);
    setAssignmentSeat(seat);
  }

  async function archiveSeat(seat: OrgSeat): Promise<void> {
    if (!window.confirm(t('confirmArchive', { seat: seat.title }))) return;
    try {
      await orgSeatsApi.archive(seat.id);
      toast.success(t('archived'));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('archiveFailed'));
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <RolesSeatsHeader canEdit={canEdit} onCreate={() => setEditor({ open: true, seat: null })} />
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <RolesSeatsDepartmentRail
          departments={data.departments}
          seats={data.seats}
          selectedId={selectedDepartmentId}
          onSelect={setSelectedDepartmentId}
        />
        <RolesSeatsGrid
          loading={loading}
          seats={selectedSeats}
          canEdit={canEdit}
          canViewAccess={canViewAccess}
          onEdit={(seat) => setEditor({ open: true, seat })}
          onAssign={(seat) => {
            setEndingAssignmentId(null);
            setAssignmentSeat(seat);
          }}
          onArchive={(seat) => void archiveSeat(seat)}
          onEnd={(id) => void endAssignment(id)}
          onViewAccess={setAccessEmployeeId}
        />
      </div>
      <OrgSeatEditorDialog
        open={editor.open}
        seat={editor.seat}
        seats={data.seats}
        defaultDepartmentId={selectedDepartmentId}
        departments={data.departments}
        roles={data.roles}
        canMapRole={canMapRole}
        onOpenChange={(open) => setEditor((current) => ({ ...current, open }))}
        onSave={saveSeat}
      />
      <OrgSeatAssignmentDialog
        seat={assignmentSeat}
        ending={endingAssignmentId !== null}
        canViewAccess={canViewAccess}
        onOpenChange={(open) => {
          if (!open) setAssignmentSeat(null);
        }}
        onAssign={assignEmployee}
      />
      <EmployeeEffectiveAccessDialog
        employeeId={accessEmployeeId}
        onOpenChange={(open) => {
          if (!open) setAccessEmployeeId(null);
        }}
      />
    </div>
  );
}

type WorkspaceData = {
  departments: DepartmentItem[];
  seats: OrgSeat[];
  roles: RoleItem[];
};

const EMPTY_DATA: WorkspaceData = { departments: [], seats: [], roles: [] };

function canonicalRootId(departments: DepartmentItem[]): string {
  return (
    departments.find((department) => department.parentId === null)?.id ?? departments[0]?.id ?? ''
  );
}
