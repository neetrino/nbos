import {
  parseOptionalAmount,
  type ClientServiceFormState,
} from './client-service-form-state';

const NAME_PLACEHOLDERS: Record<string, string> = {
  DOMAIN: 'example.com',
  HOSTING: 'Production hosting',
  SERVICE: 'Google Workspace',
  ACCOUNT: 'Apple Developer',
  LICENSE: 'License name',
};

export function clientServiceNamePlaceholder(type: string): string {
  return NAME_PLACEHOLDERS[type] ?? 'Service name';
}

export function applyProductToClientServiceForm(
  form: ClientServiceFormState,
  product: { id: string; projectId: string },
): ClientServiceFormState {
  return {
    ...form,
    productId: product.id,
    projectId: product.projectId,
  };
}

export function canSubmitClientServiceCreate(form: ClientServiceFormState): boolean {
  return (
    Boolean(form.productId.trim() && form.projectId.trim() && form.name.trim()) &&
    !Number.isNaN(parseOptionalAmount(form.ourCost)) &&
    !Number.isNaN(parseOptionalAmount(form.clientCharge))
  );
}
