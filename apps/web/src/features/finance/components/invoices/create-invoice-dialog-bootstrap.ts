import { subscriptionsApi, type Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import { projectsApi, type Project } from '@/lib/api/projects';
import {
  getInitialInvoiceForm,
  getInitialInvoiceFormFromSubscription,
  type CreateInvoiceFormState,
} from './create-invoice-dialog-utils';

interface BootstrapCtx {
  open: boolean;
  order?: Order | null;
  subscriptionId?: string | null;
  setError: (v: string | null) => void;
  setLoadError: (v: string | null) => void;
  setForm: (f: CreateInvoiceFormState) => void;
  setProjects: (p: Project[]) => void;
  setSubscriptionDetail: (s: Subscription | null) => void;
  setSubscriptionLoading: (v: boolean) => void;
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

  const sid = ctx.subscriptionId?.trim();
  if (sid) {
    ctx.setSubscriptionDetail(null);
    ctx.setForm(getInitialInvoiceForm());
    void loadSubscriptionById(
      sid,
      ctx.setSubscriptionDetail,
      ctx.setForm,
      ctx.setLoadError,
      ctx.setSubscriptionLoading,
    );
    return;
  }

  ctx.setSubscriptionDetail(null);
  ctx.setForm(getInitialInvoiceForm());
  void loadProjects(ctx.setProjects, ctx.setLoadError);
}

async function loadSubscriptionById(
  id: string,
  setSubscriptionDetail: (s: Subscription | null) => void,
  setForm: (f: CreateInvoiceFormState) => void,
  setLoadError: (e: string | null) => void,
  setSubscriptionLoading: (v: boolean) => void,
) {
  setSubscriptionLoading(true);
  try {
    const sub = await subscriptionsApi.getById(id);
    setSubscriptionDetail(sub);
    setForm(getInitialInvoiceFormFromSubscription(sub));
    setLoadError(null);
  } catch {
    setSubscriptionDetail(null);
    setLoadError('Subscription could not be loaded.');
  } finally {
    setSubscriptionLoading(false);
  }
}

async function loadProjects(
  setProjects: (projects: Project[]) => void,
  setLoadError: (error: string | null) => void,
) {
  try {
    const data = await projectsApi.getAll({ pageSize: 100 });
    setProjects(data.items);
  } catch {
    setLoadError('Projects could not be loaded.');
  }
}
