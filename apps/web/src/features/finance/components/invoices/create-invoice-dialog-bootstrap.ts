import { getApiErrorMessage } from '@/lib/api-errors';
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
  /** When opening manual invoice from Client Portfolio, pre-select project if allowed. */
  initialProjectId?: string | null;
  setError: (v: string | null) => void;
  setLoadError: (e: string | null) => void;
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
  void loadProjects(ctx.setProjects, ctx.setLoadError, ctx.setForm, ctx.initialProjectId?.trim());
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
  } catch (caught) {
    setSubscriptionDetail(null);
    setLoadError(getApiErrorMessage(caught, 'Subscription could not be loaded.'));
  } finally {
    setSubscriptionLoading(false);
  }
}

async function loadProjects(
  setProjects: (projects: Project[]) => void,
  setLoadError: (error: string | null) => void,
  setForm: ((f: CreateInvoiceFormState) => void) | undefined,
  preferredProjectId: string | undefined,
) {
  try {
    const data = await projectsApi.getAll({ pageSize: 100 });
    setProjects(data.items);
    setLoadError(null);
    if (setForm && preferredProjectId && data.items.some((p) => p.id === preferredProjectId)) {
      setForm({ ...getInitialInvoiceForm(), projectId: preferredProjectId });
    }
  } catch (caught) {
    setLoadError(getApiErrorMessage(caught, 'Projects could not be loaded.'));
  }
}
