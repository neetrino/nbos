import type { FilterConfig } from '@/components/shared';
import { DEAL_STAGES, DEAL_TYPES } from '@/features/crm/constants/dealPipeline';
import { LEAD_SOURCES, LEAD_STAGES } from '@/features/crm/constants/leadPipeline';
import {
  BOARD_LIFECYCLE_SCOPE_OPTIONS,
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
} from '@/features/shared/board-lifecycle';
import {
  CRM_RESPONSIBLE_FILTER_KEY,
  buildCrmResponsibleFilterOptions,
  type CrmResponsibleEmployeeOption,
} from './crm-responsible-filter';

function boardScopeFilterConfig(): FilterConfig {
  return {
    key: 'boardScope',
    label: 'Status',
    includeAllOption: false,
    defaultOptionValue: DEFAULT_BOARD_LIFECYCLE_SCOPE,
    options: BOARD_LIFECYCLE_SCOPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  };
}

function responsibleFilterConfig(
  variant: 'lead' | 'deal',
  employees: readonly CrmResponsibleEmployeeOption[],
  meId: string | null,
): FilterConfig {
  return {
    key: CRM_RESPONSIBLE_FILTER_KEY,
    label: 'Responsible',
    options: buildCrmResponsibleFilterOptions(variant, employees, meId),
  };
}

export function buildLeadPipelineFilterConfigs(
  employees: readonly CrmResponsibleEmployeeOption[],
  meId: string | null,
): FilterConfig[] {
  return [
    boardScopeFilterConfig(),
    {
      key: 'source',
      label: 'Source',
      options: LEAD_SOURCES.map((source) => ({ value: source.value, label: source.label })),
    },
    {
      key: 'status',
      label: 'Stage',
      options: LEAD_STAGES.map((stage) => ({ value: stage.key, label: stage.label })),
    },
    responsibleFilterConfig('lead', employees, meId),
  ];
}

export function buildDealPipelineFilterConfigs(
  employees: readonly CrmResponsibleEmployeeOption[],
  meId: string | null,
): FilterConfig[] {
  return [
    boardScopeFilterConfig(),
    {
      key: 'type',
      label: 'Type',
      options: DEAL_TYPES.map((type) => ({ value: type.value, label: type.label })),
    },
    {
      key: 'status',
      label: 'Stage',
      options: DEAL_STAGES.map((stage) => ({ value: stage.key, label: stage.label })),
    },
    responsibleFilterConfig('deal', employees, meId),
  ];
}
