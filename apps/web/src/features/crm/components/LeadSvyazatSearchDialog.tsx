'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LEAD_SVYAZAT_LABELS } from './lead-svyazat-labels';
import type { ReactNode } from 'react';
import type { SvyazatSearchHit } from './lead-svyazat-search';

interface LeadSvyazatSearchDialogProps {
  open: boolean;
  title: string;
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
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {props.children}
          <Label htmlFor="lead-svyazat-search">{props.searchLabel}</Label>
          <Input
            id="lead-svyazat-search"
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder={props.placeholder}
            autoComplete="off"
          />
          {props.loading ? <p className="text-muted-foreground text-xs">Searching…</p> : null}
          <ul className="max-h-56 space-y-1 overflow-auto">
            {props.hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  className="hover:bg-muted data-[selected=true]:bg-muted w-full rounded-md px-2 py-1.5 text-left text-sm"
                  data-selected={props.selectedId === hit.id}
                  onClick={() => props.onSelect(hit.id)}
                >
                  <span className="font-medium">{hit.title}</span>
                  {hit.subtitle ? (
                    <span className="text-muted-foreground block text-xs">{hit.subtitle}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {props.error ? <p className="text-destructive text-sm">{props.error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            {LEAD_SVYAZAT_LABELS.cancel}
          </Button>
          <Button
            type="button"
            disabled={!props.selectedId || props.loading}
            onClick={props.onApply}
          >
            {props.applyLabel ?? LEAD_SVYAZAT_LABELS.apply}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
