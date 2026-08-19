'use client';

import type { KeyboardEvent, RefObject } from 'react';
import { ArrowRight, Ban, RotateCcw, Trash2, LayoutGrid, History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
} from '@/components/shared';
import { LeadPipelineStages } from './LeadPipelineStages';
import { LEAD_STAGES } from '../constants/leadPipeline';
import type { Lead, LeadDuplicateLookupResult } from '@/lib/api/leads';
import { CRM_OPEN_LEAD_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import { LEAD_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import { LeadGeneralTab } from './LeadGeneralTab';
import type { LeadGeneralDraft } from './lead-general-form-state';
import { CrmSheetEntityHeader } from './CrmSheetEntityHeader';
import { getLeadDisplayTitle } from '../utils/crm-entity-display';
import { LEAD_ENTITY_VISUAL } from '@/lib/lead-entity-visual';
import { DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import { canOfferLeadMerge } from '@nbos/shared';
import { usePermission } from '@/lib/permissions';
import { LeadDuplicateBanner } from './LeadDuplicateBanner';
import { LeadSheetMergeControls } from './LeadSheetMergeControls';

export const LEAD_SHEET_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'history', label: 'History', icon: History },
] as const;

export interface LeadSheetLoadedContentProps {
  renderLead: Lead;
  open: boolean;
  isTrashView: boolean;
  activeTab: string;
  setActiveTab: (value: string) => void;
  editingName: boolean;
  nameValue: string;
  setNameValue: (value: string) => void;
  setEditingName: (value: boolean) => void;
  nameInputRef: RefObject<HTMLInputElement | null>;
  generalDraft: LeadGeneralDraft | null;
  generalDirty: boolean;
  generalError: string | null;
  gateRequiredFields: Set<string>;
  onConvertToDeal?: (lead: Lead) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onMoveToTrash?: (id: string) => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  patchGeneralDraft: (partial: Partial<LeadGeneralDraft>) => void;
  handleGeneralSave: () => void;
  handleGeneralCancel: () => void;
  phoneDuplicates: LeadDuplicateLookupResult | null;
  onDismissPhoneDuplicates: () => void;
  onOpenRelatedLead?: (id: string) => void;
  onMerged?: (lead: Lead) => void;
  mergeAbsorbedId: string | null;
  onMergeFromBanner: (id: string) => void;
  onConsumedMergeAbsorbed: () => void;
}

export function LeadSheetLoadedContent(props: LeadSheetLoadedContentProps) {
  const { me } = usePermission();
  const { renderLead, isTrashView, generalDraft, gateRequiredFields } = props;
  const canMerge = canOfferLeadMerge(me?.role.slug);
  const currentStage = LEAD_STAGES.find((s) => s.key === renderLead.status);
  const isTerminal = currentStage ? 'terminal' in currentStage : false;
  const leadVisual = LEAD_ENTITY_VISUAL;
  const headerTitle = generalDraft?.name?.trim() || getLeadDisplayTitle(renderLead);
  const LeadIcon = leadVisual.Icon;
  const nameGateRequired = gateRequiredFields.has('name');

  const startEditingName = () => {
    if (isTrashView) return;
    props.setNameValue(generalDraft?.name ?? renderLead.name ?? '');
    props.setEditingName(true);
  };

  const commitNameToDraft = () => {
    props.setEditingName(false);
    props.patchGeneralDraft({ name: props.nameValue.trim() || null });
  };

  const handleNameKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitNameToDraft();
    }
    if (e.key === 'Escape') {
      props.setEditingName(false);
      props.setNameValue(generalDraft?.name ?? renderLead.name ?? '');
    }
  };

  return (
    <EntityDetailSheetContent
      open={props.open}
      layout="full"
      width="medium"
      sourcePageHref={`/crm/leads?${CRM_OPEN_LEAD_QUERY}=${encodeURIComponent(renderLead.id)}`}
    >
      <CrmSheetEntityHeader
        title={headerTitle}
        entityLabel={leadVisual.label}
        EntityIcon={LeadIcon}
        headerIconClassName={leadVisual.headerIconClassName}
        headerBadgeClassName={leadVisual.headerBadgeClassName}
        editing={props.editingName}
        nameValue={props.nameValue}
        onNameValueChange={props.setNameValue}
        onCommitName={commitNameToDraft}
        onNameKeyDown={handleNameKeyDown}
        nameInputRef={props.nameInputRef}
        namePlaceholder="Inquiry title (product / service)…"
        titleEditHint="Click to edit inquiry title (product / service)"
        onStartEditing={startEditingName}
        titleClassName={cn(
          nameGateRequired && DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS,
          'rounded-lg',
        )}
        actions={
          <LeadSheetHeaderActions
            renderLead={renderLead}
            isTrashView={isTrashView}
            isTerminal={isTerminal}
            mergeAbsorbedId={props.mergeAbsorbedId}
            onConsumedMergeAbsorbed={props.onConsumedMergeAbsorbed}
            onMerged={props.onMerged}
            onConvertToDeal={props.onConvertToDeal}
            onRestore={props.onRestore}
            onPermanentDelete={props.onPermanentDelete}
            onMoveToTrash={props.onMoveToTrash}
            onStatusChange={props.onStatusChange}
          />
        }
      />

      <div className="shrink-0 pb-3">
        <LeadPipelineStages
          currentStatus={renderLead.status}
          onStageClick={isTrashView ? () => {} : (key) => props.onStatusChange(renderLead.id, key)}
        />
      </div>

      <DetailSheetTabBar
        tabs={LEAD_SHEET_TABS}
        activeTab={props.activeTab}
        onTabChange={(value) =>
          props.setActiveTab(value as (typeof LEAD_SHEET_TABS)[number]['value'])
        }
      />

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-5 py-4">
          {props.phoneDuplicates && props.onOpenRelatedLead ? (
            <div className="mb-4">
              <LeadDuplicateBanner
                result={props.phoneDuplicates}
                mode="phone-add"
                onOpen={props.onOpenRelatedLead}
                onMerge={canMerge ? props.onMergeFromBanner : undefined}
                onDismiss={props.onDismissPhoneDuplicates}
              />
            </div>
          ) : null}
          <DetailSheetTabPanel tabKey={props.activeTab}>
            {props.activeTab === 'general' && generalDraft ? (
              <LeadGeneralTab
                lead={renderLead}
                draft={generalDraft}
                patchDraft={props.patchGeneralDraft}
                formDisabled={isTrashView}
                gateRequiredFields={gateRequiredFields}
                sectionIds={{
                  contact: LEAD_SHEET_SECTION.CONTACT,
                  marketing: LEAD_SHEET_SECTION.MARKETING,
                  assignment: LEAD_SHEET_SECTION.ASSIGNMENT,
                  notes: LEAD_SHEET_SECTION.NOTES,
                }}
              />
            ) : null}
            {props.activeTab === 'history' && (
              <div className="text-muted-foreground py-12 text-center text-sm">
                History coming soon...
              </div>
            )}
          </DetailSheetTabPanel>
        </div>
      </ScrollArea>

      <DetailSheetFormFooter
        visible={!isTrashView && props.activeTab === 'general' && Boolean(generalDraft)}
        dirty={props.generalDirty}
        saving={false}
        errorMessage={props.generalError}
        onSave={props.handleGeneralSave}
        onCancel={props.handleGeneralCancel}
      />
    </EntityDetailSheetContent>
  );
}

function LeadSheetHeaderActions(props: {
  renderLead: Lead;
  isTrashView: boolean;
  isTerminal: boolean;
  mergeAbsorbedId: string | null;
  onConsumedMergeAbsorbed: () => void;
  onMerged?: (lead: Lead) => void;
  onConvertToDeal?: (lead: Lead) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onMoveToTrash?: (id: string) => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const { renderLead, isTrashView } = props;
  return (
    <>
      {!isTrashView && props.onMerged ? (
        <LeadSheetMergeControls
          lead={renderLead}
          isTrashView={isTrashView}
          initialAbsorbedId={props.mergeAbsorbedId}
          onConsumedInitialAbsorbed={props.onConsumedMergeAbsorbed}
          onMerged={props.onMerged}
        />
      ) : null}
      {!isTrashView && !props.isTerminal && renderLead.status === 'MQL' && props.onConvertToDeal ? (
        <Button type="button" size="sm" onClick={() => props.onConvertToDeal?.(renderLead)}>
          <ArrowRight size={14} className="mr-1" />
          Convert to Deal
        </Button>
      ) : null}
      {isTrashView && props.onRestore ? (
        <DetailSheetSettingsMenu>
          <DropdownMenuItem
            disabled={Boolean(renderLead.mergedIntoId)}
            onClick={() => {
              if (renderLead.mergedIntoId) return;
              props.onRestore?.(renderLead.id);
            }}
          >
            <RotateCcw />
            {renderLead.mergedIntoId ? 'Restore blocked (merged)' : 'Restore'}
          </DropdownMenuItem>
          {props.onPermanentDelete ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => props.onPermanentDelete?.(renderLead.id)}
            >
              <Trash2 />
              Delete permanently
            </DropdownMenuItem>
          ) : null}
        </DetailSheetSettingsMenu>
      ) : props.onMoveToTrash ? (
        <DetailSheetSettingsMenu>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => props.onMoveToTrash?.(renderLead.id)}
          >
            <Trash2 />
            Move to Trash
          </DropdownMenuItem>
          {renderLead.status !== 'SPAM' ? (
            <DropdownMenuItem onClick={() => void props.onStatusChange(renderLead.id, 'SPAM')}>
              <Ban />
              Mark as Spam
            </DropdownMenuItem>
          ) : null}
        </DetailSheetSettingsMenu>
      ) : null}
    </>
  );
}
