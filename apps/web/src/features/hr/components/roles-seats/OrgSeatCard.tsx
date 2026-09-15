'use client';

import type { ReactNode } from 'react';
import { Archive, BriefcaseBusiness, Pencil, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { OrgSeat } from '@/lib/api/org-seats';
import { OrgSeatHistory } from './OrgSeatHistory';
import {
  ORG_SEAT_ACTION_LABEL_CLASS,
  ORG_SEAT_ACTIONS_CLASS,
  ORG_SEAT_ASSIGNEE_ROW_CLASS,
  ORG_SEAT_CARD_CONTAINER_CLASS,
} from './org-seat-card.layout';

export function OrgSeatCard({
  seat,
  canEdit,
  canViewAccess,
  onEdit,
  onAssign,
  onArchive,
  onEndAssignment,
  onViewAccess,
}: {
  seat: OrgSeat;
  canEdit: boolean;
  canViewAccess: boolean;
  onEdit: () => void;
  onAssign: () => void;
  onArchive: () => void;
  onEndAssignment: (assignmentId: string) => void;
  onViewAccess: (employeeId: string) => void;
}) {
  const t = useTranslations('hr.rolesSeats');
  const assignment = seat.assignments[0];
  return (
    <Card
      className={cn('border-border/70 bg-card/90 overflow-hidden', ORG_SEAT_CARD_CONTAINER_CLASS)}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="text-primary size-4 shrink-0" aria-hidden />
            <h3 className="truncate text-sm font-semibold" title={seat.title}>
              {seat.title}
            </h3>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{t(`kinds.${seat.kind}`)}</Badge>
            {seat.defaultPermissionRole ? (
              <Badge variant="outline">
                <ShieldCheck className="mr-1 size-3" aria-hidden />
                {seat.defaultPermissionRole.name}
              </Badge>
            ) : null}
          </div>
        </div>
        {canEdit ? (
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label={t('actions.edit')}>
            <Pencil className="size-4" />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {assignment ? (
          <AssignedEmployee
            seat={seat}
            canEdit={canEdit}
            canViewAccess={canViewAccess}
            onEnd={() => onEndAssignment(assignment.id)}
            onViewAccess={() => onViewAccess(assignment.employeeId)}
          />
        ) : (
          <VacantSeat
            seatId={seat.id}
            canEdit={canEdit}
            onAssign={onAssign}
            onArchive={onArchive}
          />
        )}
      </CardContent>
    </Card>
  );
}

function AssignedEmployee({
  seat,
  canEdit,
  canViewAccess,
  onEnd,
  onViewAccess,
}: {
  seat: OrgSeat;
  canEdit: boolean;
  canViewAccess: boolean;
  onEnd: () => void;
  onViewAccess: () => void;
}) {
  const employee = seat.assignments[0]?.employee;
  if (!employee) return null;
  const initials = `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`;
  return (
    <div className={cn('bg-muted/35 rounded-lg border px-3 py-2.5', ORG_SEAT_ASSIGNEE_ROW_CLASS)}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-9">
          <AvatarImage src={employee.avatar ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-muted-foreground truncate text-xs">{seat.title}</p>
        </div>
      </div>
      <SeatCardActions
        seatId={seat.id}
        canEdit={canEdit}
        canViewAccess={canViewAccess}
        onEnd={onEnd}
        onViewAccess={onViewAccess}
      />
    </div>
  );
}

function VacantSeat({
  seatId,
  canEdit,
  onAssign,
  onArchive,
}: {
  seatId: string;
  canEdit: boolean;
  onAssign: () => void;
  onArchive: () => void;
}) {
  const t = useTranslations('hr.rolesSeats');
  return (
    <div
      className={cn(
        'border-border/80 rounded-lg border border-dashed px-3 py-2.5',
        ORG_SEAT_ASSIGNEE_ROW_CLASS,
      )}
    >
      <p className="text-muted-foreground text-sm">{t('vacant')}</p>
      <div className={ORG_SEAT_ACTIONS_CLASS}>
        <OrgSeatHistory seatId={seatId} />
        {canEdit ? (
          <>
            <SeatActionButton
              label={t('actions.assign')}
              onClick={onAssign}
              icon={<UserPlus className="size-3.5" />}
            />
            <SeatActionButton
              label={t('actions.archive')}
              onClick={onArchive}
              variant="ghost"
              icon={<Archive className="size-3.5" />}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function SeatCardActions({
  seatId,
  canEdit,
  canViewAccess,
  onEnd,
  onViewAccess,
}: {
  seatId: string;
  canEdit: boolean;
  canViewAccess: boolean;
  onEnd: () => void;
  onViewAccess: () => void;
}) {
  const t = useTranslations('hr.rolesSeats');
  return (
    <div className={ORG_SEAT_ACTIONS_CLASS}>
      <OrgSeatHistory seatId={seatId} />
      {canViewAccess ? (
        <SeatActionButton
          label={t('actions.access')}
          onClick={onViewAccess}
          icon={<ShieldCheck className="size-3.5" />}
        />
      ) : null}
      {canEdit ? (
        <SeatActionButton
          label={t('actions.end')}
          onClick={onEnd}
          variant="ghost"
          icon={<UserMinus className="size-3.5" />}
        />
      ) : null}
    </div>
  );
}

function SeatActionButton({
  label,
  icon,
  onClick,
  variant = 'outline',
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'outline' | 'ghost';
}) {
  return (
    <Button variant={variant} size="sm" onClick={onClick} aria-label={label}>
      {icon}
      <span className={ORG_SEAT_ACTION_LABEL_CLASS}>{label}</span>
    </Button>
  );
}
