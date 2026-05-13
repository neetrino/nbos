'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-errors';
import { partnersApi, type PartnerServiceTerm } from '@/lib/api/partners';
import { projectsApi, type Project } from '@/lib/api/projects';
import { PARTNER_OUTBOUND_PROJECT_PICKER_PAGE_SIZE } from '@/features/partners/constants/partner-outbound-projects';
import {
  PartnerOutboundServiceTermCreateForm,
  PAYMENT_MODEL_OPTIONS,
  SERVICE_TYPE_OPTIONS,
} from '@/features/partners/components/PartnerOutboundServiceTermCreateForm';
import { PartnerOutboundServiceTermsTable } from '@/features/partners/components/PartnerOutboundServiceTermsTable';

export function PartnerOutboundServicesCard(props: { partnerId: string; reloadKey?: number }) {
  const { partnerId, reloadKey = 0 } = props;
  const [rows, setRows] = useState<PartnerServiceTerm[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creatingFinanceId, setCreatingFinanceId] = useState<string | null>(null);
  const [form, setForm] = useState({
    projectId: 'none',
    serviceType: 'SEO',
    paymentModel: 'ONE_TIME',
    amount: '',
    billingStartDate: '',
    notes: '',
  });

  const canSubmit = useMemo(() => {
    const amount = Number(form.amount);
    return Number.isFinite(amount) && amount > 0;
  }, [form.amount]);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await partnersApi.listServiceTerms(partnerId);
      setRows(data);
    } catch (caught) {
      setRows([]);
      setError(getApiErrorMessage(caught, 'Outbound service terms could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    projectsApi
      .getAll({ page: 1, pageSize: PARTNER_OUTBOUND_PROJECT_PICKER_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setProjects(res.items);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setActionError(null);
    try {
      await partnersApi.createServiceTerm(partnerId, {
        projectId: form.projectId !== 'none' ? form.projectId : null,
        serviceType: form.serviceType as (typeof SERVICE_TYPE_OPTIONS)[number],
        paymentModel: form.paymentModel as (typeof PAYMENT_MODEL_OPTIONS)[number],
        amount: Number(form.amount),
        billingStartDate: form.billingStartDate || undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm({
        projectId: 'none',
        serviceType: 'SEO',
        paymentModel: 'ONE_TIME',
        amount: '',
        billingStartDate: '',
        notes: '',
      });
      await load();
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, 'Service term could not be created.'));
    } finally {
      setSaving(false);
    }
  };

  const createFinance = async (termId: string) => {
    if (creatingFinanceId) return;
    setCreatingFinanceId(termId);
    setActionError(null);
    try {
      await partnersApi.createFinanceFromServiceTerm(partnerId, termId);
      await load();
    } catch (caught) {
      setActionError(getApiErrorMessage(caught, 'Finance entry could not be created.'));
    } finally {
      setCreatingFinanceId(null);
    }
  };

  if (loading) {
    return (
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-sm">Loading outbound services…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void load()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Handshake size={16} className="text-muted-foreground" />
        <h2 className="text-foreground text-sm font-semibold">Outbound services</h2>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Terms where partner pays Neetrino. Create a service case, then generate Finance invoice or
        partner-service subscription from it.
      </p>

      {actionError ? (
        <p className="text-destructive mt-3 text-xs" role="alert">
          {actionError}
        </p>
      ) : null}

      <PartnerOutboundServiceTermCreateForm
        form={form}
        onFormChange={setForm}
        projects={projects}
        projectsLoading={projectsLoading}
        canSubmit={canSubmit}
        saving={saving}
        onSubmit={submit}
      />

      {rows.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">No outbound service terms yet.</p>
      ) : (
        <PartnerOutboundServiceTermsTable
          rows={rows}
          projectById={projectById}
          creatingFinanceId={creatingFinanceId}
          onCreateFinance={createFinance}
        />
      )}
    </div>
  );
}
