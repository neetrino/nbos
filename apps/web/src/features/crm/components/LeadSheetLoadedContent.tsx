'use client';

import type { KeyboardEvent, RefObject } from 'react';
import { useMemo } from 'react';
import { CheckSquare, History, LayoutGrid, Phone } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
} from '@/components/shared';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { buildLeadDetailSheetTabs } from './build-lead-detail-sheet-tabs';
import { LeadPipelineStages } from './LeadPipelineStages';
import { LEAD_STAGES } from '../constants/leadPipeline';
import type { Lead } from '@/lib/api/leads';
import { CRM_OPEN_LEAD_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import {
  LEAD_DETAIL_SHEET_RAIL_ANCHOR_CLASS,
  LEAD_DETAIL_SHEET_WIDTH_CLASS,
} from '@/features/crm/constants/lead-sheet-layout';
import { LEAD_SHEET_SECTION } from '@/features/shared/crm-sheet-section-ids';
import { LeadGeneralTab } from './LeadGeneralTab';
import type { LeadGeneralDraft } from './lead-general-form-state';
import { CrmSheetEntityHeader } from './CrmSheetEntityHeader';
import { getLeadDisplayTitle } from '../utils/crm-entity-display';
import { LEAD_ENTITY_VISUAL } from '@/lib/lead-entity-visual';
import { DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import { LeadSheetHeaderActions } from './LeadSheetHeaderActions';
import { LeadHistoryTab } from './LeadHistoryTab';
import { LeadCallsTab } from './LeadCallsTab';
import { LeadTasksTab } from './LeadTasksTab';

export const LEAD_SHEET_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'calls', label: 'Calls', icon: Phone },
  { value: 'history', label: 'History', icon: History },
  { value: 'task', label: 'Task', icon: CheckSquare },
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
  onMerged?: (lead: Lead) => void;
  onAttached: (lead: Lead) => void;
  onAttachedAndTrashed: () => void;
  onRefresh?: () => void;
  onTaskCreateOpenChange: (open: boolean) => void;
  taskListRefreshSignal: number;
}

export function LeadSheetLoadedContent(props: LeadSheetLoadedContentProps) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const { renderLead, isTrashView, generalDraft, gateRequiredFields } = props;
  const canCreateTask = !isTrashView && (!creatorReady || Boolean(creatorId));
  const detailSheetTabs = useMemo(
    () =>
      buildLeadDetailSheetTabs(LEAD_SHEET_TABS, {
        canCreateTask,
        onCreateTask: () => props.onTaskCreateOpenChange(true),
      }),
    [canCreateTask, props],
  );
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
      contentClassName={LEAD_DETAIL_SHEET_WIDTH_CLASS}
      railAnchorClassName={LEAD_DETAIL_SHEET_RAIL_ANCHOR_CLASS}
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
            onMerged={props.onMerged}
            onUpdated={props.onAttached}
            onTrashed={props.onAttachedAndTrashed}
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
          disabled={isTrashView}
          onStageClick={isTrashView ? () => {} : (key) => props.onStatusChange(renderLead.id, key)}
        />
      </div>

      <DetailSheetTabBar
        tabs={detailSheetTabs}
        activeTab={props.activeTab}
        onTabChange={(value) =>
          props.setActiveTab(value as (typeof LEAD_SHEET_TABS)[number]['value'])
        }
      />

      <ScrollArea className="min-h-0 min-w-0 flex-1">
        <div className="px-3 py-5 md:px-7">
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
            {props.activeTab === 'calls' && <LeadCallsTab leadId={renderLead.id} />}
            {props.activeTab === 'history' && <LeadHistoryTab />}
            {props.activeTab === 'task' ? (
              <LeadTasksTab
                lead={renderLead}
                onRefresh={props.onRefresh}
                onCreateOpenChange={props.onTaskCreateOpenChange}
                tasksRefreshSignal={props.taskListRefreshSignal}
              />
            ) : null}
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
