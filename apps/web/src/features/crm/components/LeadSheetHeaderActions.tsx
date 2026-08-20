'use client';

import { ArrowRight, Ban, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetSettingsMenu } from '@/components/shared';
import type { Lead } from '@/lib/api/leads';
import { LeadSvyazatMenu } from './LeadSvyazatMenu';

export interface LeadSheetHeaderActionsProps {
  renderLead: Lead;
  isTrashView: boolean;
  isTerminal: boolean;
  onMerged?: (lead: Lead) => void;
  onUpdated: (lead: Lead) => void;
  onTrashed: () => void;
  onConvertToDeal?: (lead: Lead) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onMoveToTrash?: (id: string) => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}

export function LeadSheetHeaderActions(props: LeadSheetHeaderActionsProps) {
  const { renderLead, isTrashView } = props;
  return (
    <>
      {!isTrashView && props.onMerged ? (
        <LeadSvyazatMenu
          lead={renderLead}
          isTrashView={isTrashView}
          onMerged={props.onMerged}
          onUpdated={props.onUpdated}
          onTrashed={props.onTrashed}
        />
      ) : null}
      {!isTrashView && !props.isTerminal && renderLead.status === 'MQL' && props.onConvertToDeal ? (
        <Button type="button" size="sm" onClick={() => props.onConvertToDeal?.(renderLead)}>
          <ArrowRight size={14} className="mr-1" />
          Convert to Deal
        </Button>
      ) : null}
      {isTrashView && props.onRestore ? (
        <LeadSheetTrashMenu
          mergedIntoId={renderLead.mergedIntoId}
          leadId={renderLead.id}
          onRestore={props.onRestore}
          onPermanentDelete={props.onPermanentDelete}
        />
      ) : props.onMoveToTrash ? (
        <LeadSheetActiveMenu
          leadId={renderLead.id}
          status={renderLead.status}
          onMoveToTrash={props.onMoveToTrash}
          onStatusChange={props.onStatusChange}
        />
      ) : null}
    </>
  );
}

function LeadSheetTrashMenu({
  mergedIntoId,
  leadId,
  onRestore,
  onPermanentDelete,
}: {
  mergedIntoId?: string | null;
  leadId: string;
  onRestore: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
}) {
  return (
    <DetailSheetSettingsMenu>
      <DropdownMenuItem
        disabled={Boolean(mergedIntoId)}
        onClick={() => {
          if (mergedIntoId) return;
          onRestore(leadId);
        }}
      >
        <RotateCcw />
        {mergedIntoId ? 'Restore blocked (merged)' : 'Restore'}
      </DropdownMenuItem>
      {onPermanentDelete ? (
        <DropdownMenuItem variant="destructive" onClick={() => onPermanentDelete(leadId)}>
          <Trash2 />
          Delete permanently
        </DropdownMenuItem>
      ) : null}
    </DetailSheetSettingsMenu>
  );
}

function LeadSheetActiveMenu({
  leadId,
  status,
  onMoveToTrash,
  onStatusChange,
}: {
  leadId: string;
  status: string;
  onMoveToTrash: (id: string) => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  return (
    <DetailSheetSettingsMenu>
      <DropdownMenuItem variant="destructive" onClick={() => onMoveToTrash(leadId)}>
        <Trash2 />
        Move to Trash
      </DropdownMenuItem>
      {status !== 'SPAM' ? (
        <DropdownMenuItem onClick={() => void onStatusChange(leadId, 'SPAM')}>
          <Ban />
          Mark as Spam
        </DropdownMenuItem>
      ) : null}
    </DetailSheetSettingsMenu>
  );
}
