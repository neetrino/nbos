import type { useTranslations } from 'next-intl';
import type { FilterConfig } from '@/components/shared';
import { getLeadSource, getLeadStage } from '@/features/crm/constants/leadPipeline';
import { getDealStage } from '@/features/crm/constants/dealPipeline';
import {
  CRM_RESPONSIBLE_ME,
  CRM_RESPONSIBLE_ME_ASSISTANT,
  CRM_RESPONSIBLE_ME_SELLER,
} from '@/features/crm/filters/crm-responsible-filter';

export type CrmTranslate = ReturnType<typeof useTranslations<'crm'>>;

export function crmMessage(
  t: CrmTranslate,
  key: string,
  values?: Record<string, string | number | Date>,
): string {
  return t(key as never, values as never);
}

const LEAD_STAGE_KEYS = [
  'NEW',
  'DIDNT_GET_THROUGH',
  'CONTACT_ESTABLISHED',
  'MQL',
  'ON_HOLD',
  'SPAM',
  'SQL',
] as const;

const LEAD_SOURCE_KEYS = ['MARKETING', 'SALES', 'PARTNER', 'CLIENT'] as const;
const SALES_CHANNEL_KEYS = [
  'COLD_CALL',
  'COLD_DM_IG',
  'COLD_DM_FB',
  'COLD_DM_LINKEDIN',
  'COLD_EMAIL',
  'NETWORKING',
] as const;
const DEAL_STAGE_KEYS = [
  'START_CONVERSATION',
  'DISCUSS_NEEDS',
  'SEND_OFFER',
  'GET_ANSWER',
  'DEPOSIT_AND_CONTRACT',
  'FAILED',
  'WON',
] as const;
const DEAL_TYPE_KEYS = ['PRODUCT', 'EXTENSION', 'MAINTENANCE', 'OUTSOURCE'] as const;
const PRODUCT_CATEGORY_KEYS = ['CODE', 'WORDPRESS', 'SHOPIFY', 'MARKETING', 'OTHER'] as const;
const PRODUCT_TYPE_KEYS = [
  'BUSINESS_CARD_WEBSITE',
  'COMPANY_WEBSITE',
  'MOBILE_APP',
  'WEB_APP',
  'CRM',
  'ECOMMERCE',
  'SAAS',
  'LANDING',
  'ERP',
  'LOGO',
  'BRANDING',
  'DESIGN',
  'SEO',
  'PPC',
  'SMM',
  'OTHER',
] as const;
const PAYMENT_TYPE_KEYS = ['CLASSIC', 'SUBSCRIPTION'] as const;
const TAX_STATUS_KEYS = ['TAX', 'TAX_FREE'] as const;

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

export function translateLeadStageLabel(
  t: CrmTranslate,
  key: string,
  part: 'label' | 'short' = 'label',
): string {
  if (isOneOf(key, LEAD_STAGE_KEYS)) {
    return crmMessage(t, `stages.lead.${key}.${part}`);
  }
  const stage = getLeadStage(key);
  return part === 'short' ? (stage?.shortLabel ?? key) : (stage?.label ?? key);
}

export function translateLeadSourceLabel(t: CrmTranslate, value: string): string {
  if (isOneOf(value, LEAD_SOURCE_KEYS)) {
    return crmMessage(t, `catalogs.source.${value}`);
  }
  return getLeadSource(value)?.label ?? value;
}

export function translateSalesChannelLabel(t: CrmTranslate, value: string): string {
  if (isOneOf(value, SALES_CHANNEL_KEYS)) {
    return crmMessage(t, `catalogs.salesChannel.${value}`);
  }
  return value;
}

export function translateDealStageLabel(
  t: CrmTranslate,
  key: string,
  part: 'label' | 'short' = 'label',
): string {
  if (isOneOf(key, DEAL_STAGE_KEYS)) {
    return crmMessage(t, `stages.deal.${key}.${part}`);
  }
  const stage = getDealStage(key);
  return part === 'short' ? (stage?.shortLabel ?? key) : (stage?.label ?? key);
}

export function translateDashboardDealStageLabel(t: CrmTranslate, key: string): string {
  if (isOneOf(key, DEAL_STAGE_KEYS)) {
    return crmMessage(t, `dashboard.dealStages.${key}`);
  }
  return getDealStage(key)?.label ?? key;
}

export function translateDealTypeLabel(t: CrmTranslate, value: string | null | undefined): string {
  if (value && isOneOf(value, DEAL_TYPE_KEYS)) {
    return crmMessage(t, `catalogs.dealType.${value}`);
  }
  return value?.trim() ? value : t('dealSheet.typeNotSet');
}

export function translateDealTypeDescription(t: CrmTranslate, value: string): string {
  if (isOneOf(value, DEAL_TYPE_KEYS)) {
    return crmMessage(t, `catalogs.dealTypeDescription.${value}`);
  }
  return value;
}

export function translateProductCategoryLabel(t: CrmTranslate, value: string): string {
  if (isOneOf(value, PRODUCT_CATEGORY_KEYS)) {
    return crmMessage(t, `catalogs.productCategory.${value}`);
  }
  return value;
}

export function translateProductTypeLabel(t: CrmTranslate, value: string): string {
  if (isOneOf(value, PRODUCT_TYPE_KEYS)) {
    return crmMessage(t, `catalogs.productType.${value}`);
  }
  return value;
}

export function translatePaymentTypeLabel(t: CrmTranslate, value: string): string {
  if (isOneOf(value, PAYMENT_TYPE_KEYS)) {
    return crmMessage(t, `catalogs.paymentType.${value}`);
  }
  return value;
}

export function translateTaxStatusLabel(t: CrmTranslate, value: string): string {
  if (isOneOf(value, TAX_STATUS_KEYS)) {
    return crmMessage(t, `catalogs.taxStatus.${value}`);
  }
  return value;
}

export function translateBoardScopeLabel(t: CrmTranslate, value: string): string {
  if (value === 'ALL') return t('filters.boardScope.all');
  if (value === 'CLOSED') return t('filters.boardScope.closed');
  if (value === 'ACTIVE') return t('filters.boardScope.active');
  return value;
}

export function translateResponsibleOptionLabel(
  t: CrmTranslate,
  value: string,
  fallback: string,
): string {
  if (value === CRM_RESPONSIBLE_ME) return t('common.me');
  if (value === CRM_RESPONSIBLE_ME_SELLER) return t('common.meAsSeller');
  if (value === CRM_RESPONSIBLE_ME_ASSISTANT) return t('common.meAsAssistant');
  return fallback;
}

/** Translates filter chrome labels; keeps keys/values (boardScope, source, status, responsible, me). */
export function localizeLeadPipelineFilterConfigs(
  configs: FilterConfig[],
  t: CrmTranslate,
): FilterConfig[] {
  return configs.map((config) => localizeLeadFilterConfig(config, t));
}

function localizeLeadFilterConfig(config: FilterConfig, t: CrmTranslate): FilterConfig {
  if (config.key === 'boardScope') {
    return {
      ...config,
      label: t('filters.status'),
      options: config.options.map((option) => ({
        ...option,
        label: translateBoardScopeLabel(t, option.value),
      })),
    };
  }
  if (config.key === 'source') {
    return {
      ...config,
      label: t('filters.source'),
      options: config.options.map((option) => ({
        ...option,
        label: translateLeadSourceLabel(t, option.value),
      })),
    };
  }
  if (config.key === 'status') {
    return {
      ...config,
      label: t('filters.stage'),
      options: config.options.map((option) => ({
        ...option,
        label: translateLeadStageLabel(t, option.value),
      })),
    };
  }
  if (config.key === 'responsible') {
    return {
      ...config,
      label: t('filters.responsible'),
      options: config.options.map((option) => ({
        ...option,
        label: translateResponsibleOptionLabel(t, option.value, option.label),
      })),
    };
  }
  return config;
}

/** Translates deal filter chrome; keeps type/status/responsible values as codes. */
export function localizeDealPipelineFilterConfigs(
  configs: FilterConfig[],
  t: CrmTranslate,
): FilterConfig[] {
  return configs.map((config) => localizeDealFilterConfig(config, t));
}

function localizeDealFilterConfig(config: FilterConfig, t: CrmTranslate): FilterConfig {
  if (config.key === 'boardScope') {
    return {
      ...config,
      label: t('filters.status'),
      options: config.options.map((option) => ({
        ...option,
        label: translateBoardScopeLabel(t, option.value),
      })),
    };
  }
  if (config.key === 'type') {
    return {
      ...config,
      label: t('filters.type'),
      options: config.options.map((option) => ({
        ...option,
        label: translateDealTypeLabel(t, option.value),
      })),
    };
  }
  if (config.key === 'status') {
    return {
      ...config,
      label: t('filters.stage'),
      options: config.options.map((option) => ({
        ...option,
        label: translateDealStageLabel(t, option.value),
      })),
    };
  }
  if (config.key === 'responsible') {
    return {
      ...config,
      label: t('filters.responsible'),
      options: config.options.map((option) => ({
        ...option,
        label: translateResponsibleOptionLabel(t, option.value, option.label),
      })),
    };
  }
  return config;
}
