'use client';

import { Download, Loader2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';

interface WalletSheetHeaderProps {
  bonusSubmitting: boolean;
  salarySubmitting: boolean;
  projectBreakdownSubmitting: boolean;
  canExportBonuses: boolean;
  canExportSalary: boolean;
  canExportProjects: boolean;
  onExportBonusesCsv: () => void;
  onExportSalaryCsv: () => void;
  onExportProjectBreakdownCsv: () => void;
}

export function WalletSheetHeader({
  bonusSubmitting,
  salarySubmitting,
  projectBreakdownSubmitting,
  canExportBonuses,
  canExportSalary,
  canExportProjects,
  onExportBonusesCsv,
  onExportSalaryCsv,
  onExportProjectBreakdownCsv,
}: WalletSheetHeaderProps) {
  const t = useTranslations('account.wallet');
  const anyExport = canExportBonuses || canExportSalary || canExportProjects;

  return (
    <div className="border-border shrink-0 border-b px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-foreground text-lg font-semibold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{t('subtitle')}</p>
        </div>
        {anyExport ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button
                  {...props}
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0"
                >
                  <MoreHorizontal size={16} aria-hidden />
                  <span className="sr-only">{t('exportAria')}</span>
                </Button>
              )}
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                disabled={bonusSubmitting || !canExportBonuses}
                onClick={onExportBonusesCsv}
              >
                {bonusSubmitting ? (
                  <Loader2 size={14} className="mr-2 animate-spin" aria-hidden />
                ) : (
                  <Download size={14} className="mr-2 opacity-70" aria-hidden />
                )}
                {t('exportBonusesCsv')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={salarySubmitting || !canExportSalary}
                onClick={onExportSalaryCsv}
              >
                {salarySubmitting ? (
                  <Loader2 size={14} className="mr-2 animate-spin" aria-hidden />
                ) : (
                  <Download size={14} className="mr-2 opacity-70" aria-hidden />
                )}
                {t('exportPayrollCsv')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={projectBreakdownSubmitting || !canExportProjects}
                onClick={onExportProjectBreakdownCsv}
              >
                {projectBreakdownSubmitting ? (
                  <Loader2 size={14} className="mr-2 animate-spin" aria-hidden />
                ) : (
                  <Download size={14} className="mr-2 opacity-70" aria-hidden />
                )}
                {t('exportProjectsCsv')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}
