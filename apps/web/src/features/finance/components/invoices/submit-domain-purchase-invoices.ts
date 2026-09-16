import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { clientServicesApi } from '@/lib/api/client-services';
import { invoicesApi, type Invoice } from '@/lib/api/finance';
import {
  canSubmitDomainPurchase,
  toDomainOperationPayload,
  type DomainPurchaseDraft,
} from '@/features/finance/components/domain-purchase/domain-purchase-form';

export async function submitDomainPurchaseInvoices(params: {
  productId: string;
  draft: DomainPurchaseDraft;
  fallbackError: string;
  invoicesCreatedLabel: string;
  partialFailureLabel: string;
}): Promise<Invoice | null> {
  if (!params.productId || !canSubmitDomainPurchase(params.draft, true)) {
    throw new Error(params.fallbackError);
  }
  const result = await clientServicesApi.startDomainOperation(
    toDomainOperationPayload(params.productId, params.draft, true),
  );
  const failed = result.items.filter((item) => item.status === 'failed');
  const invoiceIds = result.items
    .map((item) => item.invoiceId)
    .filter((id): id is string => Boolean(id));
  if (failed.length > 0) {
    toast.error(
      failed.map((item) => item.message ?? item.domainName).join(' ') || params.partialFailureLabel,
    );
  } else {
    toast.success(params.invoicesCreatedLabel);
  }
  const firstId = invoiceIds[0];
  if (!firstId) return null;
  return invoicesApi.getById(firstId);
}

export function domainInvoiceSubmitErrorMessage(caught: unknown, fallback: string): string {
  return getApiErrorMessage(caught, fallback);
}
