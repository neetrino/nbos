import { getApiErrorMessage } from '@/lib/api-errors';
import { subscriptionsApi, type Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import {
  getInitialInvoiceForm,
  getInitialInvoiceFormFromSubscription,
  type CreateInvoiceFormState,
  type CreateInvoiceHiddenContext,
} from './create-invoice-dialog-utils';

interface BootstrapCtx {
  open: boolean;
  order?: Order | null;
  subscriptionId?: string | null;
  hiddenContext?: CreateInvoiceHiddenContext;
  defaultForm?: CreateInvoiceFormState;
  setError: (v: string | null) => void;
  setLoadError: (e: string | null) => void;
  setForm: (f: CreateInvoiceFormState) => void;
  setSubscriptionDetail: (s: Subscription | null) => void;
  setSubscriptionLoading: (v: boolean) => void;
  loadErrorFallback?: string;
}

export function bootstrapCreateInvoiceDialog(ctx: BootstrapCtx): void {
  if (!ctx.open) return;
  ctx.setError(null);
  ctx.setLoadError(null);

  if (ctx.order) {
    ctx.setSubscriptionDetail(null);
    ctx.setForm(getInitialInvoiceForm(ctx.order));
    return;
  }

  const sid = ctx.subscriptionId?.trim() || ctx.hiddenContext?.subscriptionId?.trim();
  if (sid) {
    ctx.setSubscriptionDetail(null);
    ctx.setForm(getInitialInvoiceForm());
    void loadSubscriptionById(
      sid,
      ctx.setSubscriptionDetail,
      ctx.setForm,
      ctx.setLoadError,
      ctx.setSubscriptionLoading,
      ctx.loadErrorFallback,
    );
    return;
  }

  ctx.setSubscriptionDetail(null);
  ctx.setForm(ctx.defaultForm ?? getInitialInvoiceForm());
}

async function loadSubscriptionById(
  id: string,
  setSubscriptionDetail: (s: Subscription | null) => void,
  setForm: (f: CreateInvoiceFormState) => void,
  setLoadError: (e: string | null) => void,
  setSubscriptionLoading: (v: boolean) => void,
  loadErrorFallback = 'Subscription could not be loaded.',
) {
  setSubscriptionLoading(true);
  try {
    const sub = await subscriptionsApi.getById(id);
    setSubscriptionDetail(sub);
    setForm(getInitialInvoiceFormFromSubscription(sub));
    setLoadError(null);
  } catch (caught) {
    setSubscriptionDetail(null);
    setLoadError(getApiErrorMessage(caught, loadErrorFallback));
  } finally {
    setSubscriptionLoading(false);
  }
}
