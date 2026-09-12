import { crmMessage, type CrmTranslate } from './crm-copy';

const WHATSAPP_ACTION_LABEL_KEYS: Record<string, string> = {
  'whatsapp-bind': 'dealSheet.whatsapp.bindGroup',
  'whatsapp-copy-id': 'dealSheet.whatsapp.copyId',
  'whatsapp-settings': 'dealSheet.whatsapp.settings',
  'whatsapp-resolve': 'dealSheet.whatsapp.resolve',
  'whatsapp-retry': 'dealSheet.whatsapp.retryCreate',
};

const WHATSAPP_ACTION_TITLE_KEYS: Record<string, string> = {
  'whatsapp-bind': 'dealSheet.whatsapp.bindExisting',
  'whatsapp-copy-id': 'dealSheet.whatsapp.copyIdTitle',
  'whatsapp-settings': 'dealSheet.whatsapp.settingsTitle',
};

export function translateDealWhatsAppActionLabel(
  t: CrmTranslate,
  actionId: string,
  fallback: string,
): string {
  if (fallback.startsWith('Creating')) return t('dealSheet.whatsapp.creatingGroup');
  if (actionId === 'whatsapp-group') return t('dealSheet.whatsapp.createGroup');
  const key = WHATSAPP_ACTION_LABEL_KEYS[actionId];
  return key ? crmMessage(t, key) : fallback;
}

export function translateDealWhatsAppActionTitle(
  t: CrmTranslate,
  actionId: string,
  fallback?: string,
): string | undefined {
  if (fallback?.startsWith('Creating')) return t('dealSheet.whatsapp.creatingGroup');
  const key = WHATSAPP_ACTION_TITLE_KEYS[actionId];
  return key ? crmMessage(t, key) : fallback;
}

export function translateDealWhatsAppDisabledTitle(
  t: CrmTranslate,
  fallback?: string,
): string | undefined {
  if (!fallback) return undefined;
  if (fallback.includes('in progress')) return t('dealSheet.whatsapp.creatingInProgress');
  if (fallback.includes('EXTENSION')) return t('dealSheet.whatsapp.extensionMaintenanceHint');
  if (fallback.includes('Contact')) return t('dealSheet.whatsapp.addContactFirst');
  if (fallback.includes('Product has not')) return t('dealSheet.whatsapp.productNotCreated');
  if (fallback.includes('Deal Won')) return t('dealSheet.whatsapp.openSettingsAfterWon');
  return fallback;
}

export function translateWhatsAppMissingLabel(
  t: CrmTranslate,
  bindingStatus?: string | null,
): string {
  if (bindingStatus === 'FAILED') return t('dealSheet.whatsapp.missingFailed');
  if (bindingStatus === 'PENDING' || bindingStatus === 'CREATING') {
    return t('dealSheet.whatsapp.missingPending');
  }
  if (bindingStatus === 'OUTCOME_UNKNOWN' || bindingStatus === 'NEEDS_RECONCILIATION') {
    return t('dealSheet.whatsapp.missingUnresolved');
  }
  return t('dealSheet.whatsapp.missingNotCreated');
}

export function translateWhatsAppMissingShortLabel(
  t: CrmTranslate,
  bindingStatus?: string | null,
): string {
  if (bindingStatus === 'FAILED') return t('dealSheet.whatsapp.shortFailed');
  if (bindingStatus === 'PENDING' || bindingStatus === 'CREATING') {
    return t('dealSheet.whatsapp.shortCreating');
  }
  if (bindingStatus === 'OUTCOME_UNKNOWN' || bindingStatus === 'NEEDS_RECONCILIATION') {
    return t('dealSheet.whatsapp.shortUnresolved');
  }
  return t('dealSheet.whatsapp.header');
}
