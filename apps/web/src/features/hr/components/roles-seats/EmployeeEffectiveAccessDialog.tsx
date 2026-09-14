'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { orgSeatsApi, type EmployeeEffectiveAccess } from '@/lib/api/org-seats';

interface AccessRequestState {
  employeeId: string;
  access: EmployeeEffectiveAccess | null;
  failed: boolean;
}

export function EmployeeEffectiveAccessDialog({
  employeeId,
  onOpenChange,
}: {
  employeeId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('hr.rolesSeats');
  const [requestState, setRequestState] = useState<AccessRequestState | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    void orgSeatsApi
      .getEmployeeEffectiveAccess(employeeId)
      .then((next) => {
        if (!cancelled) {
          setRequestState({ employeeId, access: next, failed: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequestState({ employeeId, access: null, failed: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const visibleState = requestState?.employeeId === employeeId ? requestState : null;

  return (
    <Dialog open={employeeId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            {t('access.title')}
          </DialogTitle>
          <DialogDescription>{t('access.description')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <AccessContent
            access={visibleState?.access ?? null}
            failed={visibleState?.failed ?? false}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function AccessContent({
  access,
  failed,
}: {
  access: EmployeeEffectiveAccess | null;
  failed: boolean;
}) {
  const t = useTranslations('hr.rolesSeats');
  if (failed) return <p className="text-destructive text-sm">{t('access.loadFailed')}</p>;
  if (!access) return <p className="text-muted-foreground text-sm">{t('loading')}</p>;
  return (
    <div className="space-y-5 pr-4">
      <div>
        <p className="font-medium">
          {access.employee.firstName} {access.employee.lastName}
        </p>
        <p className="text-muted-foreground text-sm">
          {t('access.permissionCount', {
            count: Object.keys(access.effectivePermissions).length,
          })}
        </p>
      </div>
      <section>
        <h4 className="mb-2 text-sm font-semibold">{t('access.seats')}</h4>
        {access.seats.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('access.noSeats')}</p>
        ) : (
          access.seats.map((assignment) => (
            <p key={assignment.id} className="text-sm">
              {assignment.seat.title} · {assignment.seat.department.name}
            </p>
          ))
        )}
      </section>
      <section>
        <h4 className="mb-2 text-sm font-semibold">{t('access.roleSources')}</h4>
        <div className="space-y-2">
          {access.roles.map((assignment) => (
            <div
              key={assignment.id}
              className="border-border/70 flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{assignment.role.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {assignment.seatAssignment?.seat.title ??
                    assignment.scopeDepartment?.name ??
                    t('access.membershipScope')}
                </p>
              </div>
              <Badge variant="outline">{t(`sources.${assignment.source}`)}</Badge>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h4 className="mb-2 text-sm font-semibold">{t('access.permissions')}</h4>
        {Object.entries(access.effectivePermissions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, scope]) => (
            <p key={key} className="text-xs">
              {key}: {scope}
            </p>
          ))}
      </section>
    </div>
  );
}
