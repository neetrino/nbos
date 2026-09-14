'use client';

import { BriefcaseBusiness, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DepartmentItem } from '@/lib/api/employees';
import type { OrgSeat } from '@/lib/api/org-seats';
import { OrgSeatCard } from './OrgSeatCard';
import { ORG_SEAT_GRID_CLASS } from './org-seat-card.layout';

export function RolesSeatsHeader({
  canEdit,
  onCreate,
}: {
  canEdit: boolean;
  onCreate: () => void;
}) {
  const t = useTranslations('hr.rolesSeats');
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm">{t('description')}</p>
      </div>
      {canEdit ? (
        <Button onClick={onCreate}>
          <Plus className="mr-2 size-4" />
          {t('createSeat')}
        </Button>
      ) : null}
    </div>
  );
}

export function RolesSeatsDepartmentRail({
  departments,
  seats,
  selectedId,
  onSelect,
}: {
  departments: DepartmentItem[];
  seats: OrgSeat[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations('hr.rolesSeats');
  const counts = seatCountsByDepartment(seats);
  return (
    <Card className="h-fit p-2">
      <p className="text-muted-foreground px-2 py-2 text-xs font-semibold tracking-wide uppercase">
        {t('departments')}
      </p>
      <div className="space-y-1">
        {departments.map((department) => (
          <button
            key={department.id}
            type="button"
            className={cn(
              'hover:bg-muted flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
              selectedId === department.id && 'bg-primary/10 text-primary font-medium',
            )}
            onClick={() => onSelect(department.id)}
          >
            <span className="truncate">{department.name}</span>
            <span className="text-muted-foreground text-xs">{counts.get(department.id) ?? 0}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

export function RolesSeatsGrid({
  loading,
  seats,
  canEdit,
  canViewAccess,
  onEdit,
  onAssign,
  onArchive,
  onEnd,
  onViewAccess,
}: {
  loading: boolean;
  seats: OrgSeat[];
  canEdit: boolean;
  canViewAccess: boolean;
  onEdit: (seat: OrgSeat) => void;
  onAssign: (seat: OrgSeat) => void;
  onArchive: (seat: OrgSeat) => void;
  onEnd: (assignmentId: string) => void;
  onViewAccess: (employeeId: string) => void;
}) {
  const t = useTranslations('hr.rolesSeats');
  if (loading) return <p className="text-muted-foreground py-10 text-center">{t('loading')}</p>;
  if (seats.length === 0) return <EmptySeats />;
  return (
    <div className={ORG_SEAT_GRID_CLASS}>
      {seats.map((seat) => (
        <OrgSeatCard
          key={seat.id}
          seat={seat}
          canEdit={canEdit}
          canViewAccess={canViewAccess}
          onEdit={() => onEdit(seat)}
          onAssign={() => onAssign(seat)}
          onArchive={() => onArchive(seat)}
          onEndAssignment={onEnd}
          onViewAccess={onViewAccess}
        />
      ))}
    </div>
  );
}

function EmptySeats() {
  const t = useTranslations('hr.rolesSeats');
  return (
    <div className="border-border/80 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
      <BriefcaseBusiness className="text-muted-foreground mb-3 size-8" />
      <p className="font-medium">{t('emptyTitle')}</p>
      <p className="text-muted-foreground mt-1 text-sm">{t('emptyDescription')}</p>
    </div>
  );
}

function seatCountsByDepartment(seats: OrgSeat[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const seat of seats) counts.set(seat.departmentId, (counts.get(seat.departmentId) ?? 0) + 1);
  return counts;
}
