'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LeadSvyazatPickerList } from './LeadSvyazatPickerList';
import type { SvyazatSearchHit } from './lead-svyazat-search';

interface LeadSvyazatSearchDialogProps {
  open: boolean;
  title: string;
  description?: string;
  searchLabel: string;
  placeholder: string;
  query: string;
  hits: SvyazatSearchHit[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  applyLabel?: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  onApply: () => void;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
}

export function LeadSvyazatSearchDialog(props: LeadSvyazatSearchDialogProps) {
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]" forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description ?? t('svyazat.searchHint')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {props.children}
          <LeadSvyazatPickerList
            query={props.query}
            hits={props.hits}
            selectedId={props.selectedId}
            loading={props.loading}
            placeholder={props.placeholder}
            searchLabel={props.searchLabel}
            onQueryChange={props.onQueryChange}
            onSelect={props.onSelect}
            onApply={props.onApply}
          />
        </div>
        {props.error ? <p className="text-destructive text-sm">{props.error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            disabled={!props.selectedId || props.loading}
            onClick={props.onApply}
          >
            {props.applyLabel ?? t('svyazat.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
