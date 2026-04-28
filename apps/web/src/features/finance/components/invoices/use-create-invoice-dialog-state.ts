import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import type { Project } from '@/lib/api/projects';
import { getInitialInvoiceForm, type CreateInvoiceFormState } from './create-invoice-dialog-utils';
import { bootstrapCreateInvoiceDialog } from './create-invoice-dialog-bootstrap';
import { runCreateInvoiceSubmit } from './run-create-invoice-submit';

export interface CreateInvoiceDialogOuterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void> | void;
  order?: Order | null;
  subscriptionId?: string | null;
}

export interface CreateInvoiceDialogState {
  form: CreateInvoiceFormState;
  setForm: (form: CreateInvoiceFormState) => void;
  projects: Project[];
  loading: boolean;
  error: string | null;
  loadError: string | null;
  subscriptionDetail: Subscription | null;
  subscriptionLoading: boolean;
  onOpenChange: (open: boolean) => void;
  handleSubmit: (event: FormEvent) => Promise<void>;
}

export function useCreateInvoiceDialogState({
  open,
  onOpenChange,
  onCreated,
  order,
  subscriptionId,
}: CreateInvoiceDialogOuterProps): CreateInvoiceDialogState {
  const [form, setForm] = useState(() => getInitialInvoiceForm(order));
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subscriptionDetail, setSubscriptionDetail] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    bootstrapCreateInvoiceDialog({
      open,
      order,
      subscriptionId,
      setError,
      setLoadError,
      setForm,
      setProjects,
      setSubscriptionDetail,
      setSubscriptionLoading,
    });
  }, [open, order, subscriptionId]);

  const handleSubmit = (event: FormEvent) =>
    runCreateInvoiceSubmit(event, {
      form,
      order,
      subscriptionDetail,
      setLoading,
      setError,
      onCreated,
      onOpenChange,
    });

  return {
    form,
    setForm,
    projects,
    loading,
    error,
    loadError,
    subscriptionDetail,
    subscriptionLoading,
    onOpenChange,
    handleSubmit,
  };
}
