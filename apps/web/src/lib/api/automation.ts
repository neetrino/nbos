import { api } from '../api';

export type AutomationRuleCatalogEntry = {
  code: string;
  trigger: string;
  description: string;
  module: string;
};

export type AutomationRulesCatalog = {
  automationRules: AutomationRuleCatalogEntry[];
  blueprintProductTypes: string[];
};

export const automationApi = {
  async getRulesCatalog(): Promise<AutomationRulesCatalog> {
    const resp = await api.get<AutomationRulesCatalog>('/api/automation/rules-catalog');
    return resp.data;
  },
};
