import { getApiErrorMessage } from '@/lib/api-errors';
import { deliveryConfigurationsApi } from '@/lib/api/delivery-configurations';
import {
  buildReplaceEmployeeBody,
  isReplacementConflictError,
  type ReplacementSubmitInput,
} from './replace-assignee-form';

export async function submitEmployeeReplacement(input: {
  configurationId: string;
  form: ReplacementSubmitInput;
  fallback: string;
  reloadPlan: () => Promise<void>;
}): Promise<'replaced' | 'conflict' | { error: string }> {
  const body = buildReplaceEmployeeBody(input.form);
  if (!body) {
    return { error: input.fallback };
  }
  try {
    await deliveryConfigurationsApi.replaceEmployee(input.configurationId, body);
    return 'replaced';
  } catch (caught) {
    if (isReplacementConflictError(caught)) {
      await input.reloadPlan();
      return 'conflict';
    }
    return { error: getApiErrorMessage(caught, input.fallback) };
  }
}
