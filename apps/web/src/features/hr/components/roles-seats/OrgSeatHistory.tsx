'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { orgSeatsApi, type SeatHistoryEntry } from '@/lib/api/org-seats';
import { ORG_SEAT_ACTION_LABEL_CLASS } from './org-seat-card.layout';

export function OrgSeatHistory({ seatId }: { seatId: string }) {
  const t = useTranslations('hr.rolesSeats');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SeatHistoryEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void orgSeatsApi
      .history(seatId)
      .then((next) => {
        if (!cancelled) setRows(next);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, seatId]);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        aria-label={t('historyTitle')}
        onClick={() => {
          setRows(null);
          setFailed(false);
          setOpen(true);
        }}
      >
        <History className="size-3.5" />
        <span className={ORG_SEAT_ACTION_LABEL_CLASS}>{t('historyShort')}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('historyTitle')}</DialogTitle>
            <DialogDescription>{t('historyDescription')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 space-y-3 overflow-auto text-sm">
            {failed
              ? t('loadFailed')
              : !rows
                ? t('loading')
                : rows.length === 0
                  ? t('historyEmpty')
                  : rows.map((row) => (
                      <p key={row.id}>
                        {row.employee.firstName} {row.employee.lastName}
                        <br />
                        {new Date(row.startsAt).toLocaleString(locale)} —{' '}
                        {row.endsAt
                          ? new Date(row.endsAt).toLocaleString(locale)
                          : t('historyOngoing')}
                      </p>
                    ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
