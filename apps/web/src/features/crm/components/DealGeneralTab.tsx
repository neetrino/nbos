'use client';

import { useCallback, useState, useEffect } from 'react';
import {
  DollarSign,
  User,
  Calendar,
  Clock,
  MessageSquare,
  Link2,
  ExternalLink,
  Building2,
  CreditCard,
  Tag,
  FolderKanban,
  Layers,
  Sparkles,
  TrendingUp,
  Megaphone,
  Plus,
  Receipt,
  FileText,
  CheckSquare,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineField, SearchField, StatusBadge } from '@/components/shared';
import {
  DEAL_TYPES,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPES_BY_CATEGORY,
  PAYMENT_TYPES,
  formatAmount,
} from '../constants/dealPipeline';
import { LEAD_SOURCES, SALES_CHANNELS, MARKETING_CHANNELS } from '../constants/leadPipeline';
import type { Deal } from '@/lib/api/deals';
import { contactsApi, companiesApi } from '@/lib/api/clients';
import { projectsApi } from '@/lib/api/projects';
import { partnersApi } from '@/lib/api/partners';
import { invoicesApi, ordersApi } from '@/lib/api/finance';
import { tasksApi } from '@/lib/api/tasks';
import { systemListsApi } from '@/lib/api/systemLists';

const PARTNER_PERCENT = 30;

const TAX_STATUS_OPTIONS = [
  { value: 'TAX', label: 'Tax' },
  { value: 'TAX_FREE', label: 'Tax Free' },
] as const;

interface DealGeneralTabProps {
  deal: Deal;
  onUpdate: (id: string, data: Partial<Deal>) => Promise<void>;
  onRefresh?: () => void;
  onOpenTaskTab?: () => void;
}

function computeFinance(deal: Deal) {
  const amount = Number(deal.amount ?? 0);
  const isSubscription = deal.paymentType === 'SUBSCRIPTION';
  const total = isSubscription ? amount * 12 : amount;

  const isFromPartner = deal.source === 'PARTNER';
  const partnerAmount = isFromPartner ? Math.round(amount * (PARTNER_PERCENT / 100)) : 0;
  const revenue = total - partnerAmount;

  const paidInvoiceTotal = (deal.orders ?? []).reduce((sum, order) => {
    return (
      sum +
      (order.invoices ?? [])
        .filter((inv) => inv.status === 'PAID')
        .reduce((s, inv) => s + Number(inv.amount), 0)
    );
  }, 0);

  const toReceive = total - paidInvoiceTotal;

  return { total, partnerAmount, revenue, toReceive, isFromPartner };
}

export function DealGeneralTab({ deal, onUpdate, onRefresh, onOpenTaskTab }: DealGeneralTabProps) {
  const [isNewProject, setIsNewProject] = useState(false);
  const [linkedProjectName, setLinkedProjectName] = useState<string | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [productTypeOptions, setProductTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >(PRODUCT_TYPES.map((p) => ({ value: p.value, label: p.label })));

  useEffect(() => {
    systemListsApi
      .getOptionsByKey('PRODUCT_TYPE')
      .then((opts) => setProductTypeOptions(opts.map((o) => ({ value: o.code, label: o.label }))))
      .catch(() => {
        /* keep PRODUCT_TYPES fallback */
      });
  }, []);

  const filteredProductTypeOptions = (() => {
    const category = deal.productCategory;
    if (!category) return productTypeOptions;
    const allowed = PRODUCT_TYPES_BY_CATEGORY[category] ?? [];
    if (allowed.length === 0) return productTypeOptions;
    return productTypeOptions.filter((opt) => allowed.includes(opt.value) || opt.value === 'OTHER');
  })();

  const firstOrder = deal.orders?.[0];
  const projectId = deal.projectId ?? firstOrder?.projectId;
  const taxStatus = deal.taxStatus ?? 'TAX';

  const canCreateInvoice =
    deal.amount != null &&
    Number(deal.amount) > 0 &&
    deal.paymentType &&
    deal.projectId &&
    deal.type &&
    taxStatus &&
    (taxStatus !== 'TAX' || !!deal.companyId);

  const saveField = async (field: string, value: string | number | null) => {
    const payload: Record<string, unknown> = {};
    if (field === 'amount') {
      payload[field] = typeof value === 'string' ? (value ? Number(value) : null) : value;
    } else {
      payload[field] = value || null;
    }
    await onUpdate(deal.id, payload as Partial<Deal>);
  };

  const saveMultipleFields = async (fields: Record<string, string | null>) => {
    await onUpdate(deal.id, fields as Partial<Deal>);
  };

  const searchProjects = useCallback(async (query: string) => {
    const data = await projectsApi.getAll({ pageSize: 5, search: query || undefined });
    return data.items.map((p) => ({ value: p.id, label: p.name, subtitle: p.code }));
  }, []);

  const searchContacts = useCallback(async (query: string) => {
    const data = await contactsApi.getAll({ pageSize: 5, search: query || undefined });
    return data.items.map((c) => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName}`,
      subtitle: c.email ?? undefined,
    }));
  }, []);

  const searchPartners = useCallback(async (query: string) => {
    const data = await partnersApi.getAll({ pageSize: 5, search: query || undefined });
    return data.items.map((p) => ({ value: p.id, label: p.name }));
  }, []);

  const searchCompanies = useCallback(async (query: string) => {
    const data = await companiesApi.getAll({
      pageSize: 10,
      ...(query && { search: query }),
    });
    return data.items.map((c) => ({ value: c.id, label: c.name }));
  }, []);

  const dealTypeLabel = DEAL_TYPES.find((t) => t.value === deal.type)?.label ?? deal.type;
  const isExtension = deal.type === 'EXTENSION';
  const finance = computeFinance(deal);

  const sourceLabel = LEAD_SOURCES.find((s) => s.value === deal.source)?.label ?? deal.source;

  const whereOptions = (() => {
    if (deal.source === 'SALES')
      return SALES_CHANNELS.map((c) => ({ value: c.value, label: c.label }));
    if (deal.source === 'MARKETING')
      return MARKETING_CHANNELS.map((c) => ({ value: c.value, label: c.label }));
    return [];
  })();

  const handleCreateInvoice = async () => {
    const amount = Number(invoiceAmount);
    if (!amount || amount <= 0 || !canCreateInvoice || !projectId) return;
    setCreatingInvoice(true);
    try {
      let orderId = firstOrder?.id;
      if (!orderId) {
        const orderType =
          deal.type === 'EXTENSION'
            ? 'EXTENSION'
            : deal.paymentType === 'SUBSCRIPTION'
              ? 'SUBSCRIPTION'
              : 'PRODUCT';
        const newOrder = await ordersApi.create({
          projectId: deal.projectId!,
          dealId: deal.id,
          type: orderType,
          paymentType: deal.paymentType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'CLASSIC',
          totalAmount: amount,
          taxStatus: taxStatus,
        });
        orderId = newOrder.id;
      }
      const projectIdForInvoice = firstOrder?.projectId ?? deal.projectId;
      if (!projectIdForInvoice) return;
      await invoicesApi.create({
        orderId,
        projectId: projectIdForInvoice,
        amount,
        type: deal.paymentType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'DEVELOPMENT',
        ...(taxStatus === 'TAX' && deal.companyId && { companyId: deal.companyId }),
      });
      setShowInvoiceForm(false);
      setInvoiceAmount('');
      onRefresh?.();
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleCreateTask = async () => {
    const title = taskTitle.trim();
    if (!title || !projectId || !deal.seller?.id) return;
    setCreatingTask(true);
    try {
      const links: Array<{ entityType: string; entityId: string }> = [
        { entityType: 'DEAL', entityId: deal.id },
      ];
      if (projectId) {
        links.push({ entityType: 'PROJECT', entityId: projectId });
      }
      await tasksApi.create({
        title,
        creatorId: deal.seller.id,
        description: `Deal: ${deal.code} — ${deal.name ?? ''}`.trim(),
        links,
      });
      setShowTaskForm(false);
      setTaskTitle('');
      onOpenTaskTab?.();
      onRefresh?.();
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left column — main fields */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Deal Info */}
        <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
          <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
            <Tag size={12} />
            Deal Info
          </h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <InlineField
              label="Cost"
              value={deal.amount}
              displayValue={
                deal.amount != null ? (
                  <span className="text-lg font-extrabold text-amber-600 tabular-nums dark:text-amber-400">
                    {formatAmount(deal.amount)}
                  </span>
                ) : undefined
              }
              type="number"
              placeholder="Enter amount..."
              icon={<DollarSign size={12} />}
              onSave={(v) => saveField('amount', v)}
            />

            <InlineField
              label="Payment Type"
              value={deal.paymentType}
              displayValue={
                deal.paymentType ? (
                  <span className="text-foreground text-sm font-medium">
                    {PAYMENT_TYPES.find((p) => p.value === deal.paymentType)?.label ??
                      deal.paymentType}
                  </span>
                ) : undefined
              }
              type="select"
              options={PAYMENT_TYPES.map((p) => ({ value: p.value, label: p.label }))}
              placeholder="Select payment type..."
              icon={<CreditCard size={12} />}
              onSave={(v) => saveField('paymentType', v)}
            />

            <InlineField
              label="Tax Status"
              value={deal.taxStatus ?? 'TAX'}
              displayValue={
                <span className="text-foreground text-sm font-medium">
                  {TAX_STATUS_OPTIONS.find((t) => t.value === (deal.taxStatus ?? 'TAX'))?.label ??
                    deal.taxStatus ??
                    'TAX'}
                </span>
              }
              type="select"
              options={TAX_STATUS_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
              placeholder="Tax / Tax Free"
              icon={<Receipt size={12} />}
              onSave={(v) => saveField('taxStatus', v)}
            />

            <SearchField
              label="Project"
              value={linkedProjectName}
              displayValue={
                isNewProject ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <Sparkles size={13} />
                    New Project
                  </span>
                ) : linkedProjectName ? (
                  <span className="text-foreground text-sm font-medium">{linkedProjectName}</span>
                ) : undefined
              }
              placeholder="Search projects..."
              icon={<FolderKanban size={12} />}
              onSearch={searchProjects}
              onSave={async (v, label) => {
                await saveField('projectId', v);
                setLinkedProjectName(label);
                setIsNewProject(false);
              }}
              newBadge={
                !isNewProject ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 border-emerald-200 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                    onClick={() => {
                      setIsNewProject(true);
                      setLinkedProjectName(null);
                    }}
                  >
                    <Sparkles size={12} />
                    New Project
                  </Button>
                ) : undefined
              }
            />

            <InlineField
              label="Deal Type"
              value={deal.type}
              displayValue={
                <StatusBadge
                  label={dealTypeLabel}
                  variant={
                    deal.type === 'EXTENSION'
                      ? 'blue'
                      : deal.type === 'OUTSOURCE'
                        ? 'purple'
                        : deal.type === 'MAINTENANCE'
                          ? 'teal'
                          : 'amber'
                  }
                />
              }
              type="select"
              options={DEAL_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              icon={<Layers size={12} />}
              onSave={(v) => saveField('type', v)}
            />

            {(deal.type === 'PRODUCT' || deal.type === 'OUTSOURCE') && (
              <InlineField
                label="Product Category"
                value={deal.productCategory ?? null}
                displayValue={
                  deal.productCategory ? (
                    <StatusBadge
                      label={
                        PRODUCT_CATEGORIES.find((c) => c.value === deal.productCategory)?.label ??
                        deal.productCategory
                      }
                      variant="purple"
                    />
                  ) : undefined
                }
                type="select"
                options={PRODUCT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                placeholder="Select category..."
                icon={<Layers size={12} />}
                onSave={async (v) => {
                  await saveMultipleFields({ productCategory: v as string, productType: null });
                }}
              />
            )}

            {(deal.type === 'PRODUCT' || deal.type === 'OUTSOURCE') && deal.productCategory && (
              <InlineField
                label="Product Type"
                value={deal.productType ?? null}
                displayValue={
                  deal.productType ? (
                    <span className="text-foreground text-sm font-medium">
                      {productTypeOptions.find((p) => p.value === deal.productType)?.label ??
                        deal.productType}
                    </span>
                  ) : undefined
                }
                type="select"
                options={filteredProductTypeOptions}
                placeholder="Select product type..."
                icon={<Tag size={12} />}
                onSave={(v) => saveField('productType', v)}
              />
            )}

            {isExtension && (
              <InlineField
                label="Extend Deal"
                value={null}
                type="select"
                options={[]}
                placeholder="Select deal to extend..."
                icon={<Layers size={12} />}
                onSave={() => Promise.resolve()}
              />
            )}

            {(deal.taxStatus ?? 'TAX') === 'TAX' && (
              <SearchField
                label="Company"
                value={deal.companyId ?? null}
                displayValue={
                  deal.company ? (
                    <span className="text-foreground text-sm font-medium">{deal.company.name}</span>
                  ) : undefined
                }
                placeholder="Search company..."
                icon={<Building2 size={12} />}
                onSearch={searchCompanies}
                onSave={(v) => saveField('companyId', v)}
              />
            )}
          </div>
        </section>

        {/* Marketing */}
        <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-violet-50/40 to-white p-5 dark:border-stone-800 dark:from-violet-950/10 dark:to-transparent">
          <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
            <Megaphone size={12} />
            Marketing
          </h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <InlineField
              label="From"
              value={deal.source}
              displayValue={
                deal.source ? (
                  <span className="text-foreground text-sm font-medium">{sourceLabel}</span>
                ) : undefined
              }
              type="select"
              options={LEAD_SOURCES.map((s) => ({ value: s.value, label: s.label }))}
              placeholder="Select source..."
              icon={<Megaphone size={12} />}
              onSave={async (v) => {
                await saveMultipleFields({
                  source: v as string,
                  sourceDetail: null,
                  sourcePartnerId: null,
                  sourceContactId: null,
                });
              }}
            />

            {(deal.source === 'SALES' || deal.source === 'MARKETING') && (
              <InlineField
                label="Where?"
                value={deal.sourceDetail}
                displayValue={
                  deal.sourceDetail ? (
                    <span className="text-foreground text-sm font-medium">
                      {whereOptions.find((o) => o.value === deal.sourceDetail)?.label ??
                        deal.sourceDetail}
                    </span>
                  ) : undefined
                }
                type="select"
                options={whereOptions}
                placeholder="Select channel..."
                icon={<ExternalLink size={12} />}
                onSave={(v) => saveField('sourceDetail', v)}
              />
            )}

            {deal.source === 'PARTNER' && (
              <SearchField
                label="Which Partner?"
                value={deal.sourcePartner?.name ?? null}
                displayValue={
                  deal.sourcePartner ? (
                    <span className="text-foreground text-sm font-medium">
                      {deal.sourcePartner.name}
                    </span>
                  ) : undefined
                }
                placeholder="Search partners..."
                icon={<Building2 size={12} />}
                onSearch={searchPartners}
                onSave={async (v) => {
                  await saveField('sourcePartnerId', v);
                }}
              />
            )}

            {deal.source === 'CLIENT' && (
              <SearchField
                label="Which Client?"
                value={
                  deal.sourceContact
                    ? `${deal.sourceContact.firstName} ${deal.sourceContact.lastName}`
                    : null
                }
                displayValue={
                  deal.sourceContact ? (
                    <span className="text-foreground text-sm font-medium">
                      {deal.sourceContact.firstName} {deal.sourceContact.lastName}
                    </span>
                  ) : undefined
                }
                placeholder="Search contacts..."
                icon={<User size={12} />}
                onSearch={searchContacts}
                onSave={async (v) => {
                  await saveField('sourceContactId', v);
                }}
              />
            )}
          </div>
        </section>

        {/* Contact & Team */}
        <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
          <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
            <User size={12} />
            Contact & Team
          </h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <SearchField
              label="Contact"
              value={deal.contact?.id ?? null}
              displayValue={
                deal.contact ? (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {deal.contact.firstName[0]}
                      {deal.contact.lastName[0]}
                    </div>
                    <div>
                      <p className="text-foreground text-sm leading-tight font-medium">
                        {deal.contact.firstName} {deal.contact.lastName}
                      </p>
                      {deal.contact.email && (
                        <p className="text-muted-foreground text-[11px]">{deal.contact.email}</p>
                      )}
                    </div>
                  </div>
                ) : undefined
              }
              placeholder="Search contacts..."
              icon={<User size={12} />}
              onSearch={searchContacts}
              onSave={(v, _label) => saveField('contactId', v)}
            />

            <InlineField
              label="Seller"
              value={deal.seller ? `${deal.seller.firstName} ${deal.seller.lastName}` : ''}
              displayValue={
                deal.seller ? (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      {deal.seller.firstName[0]}
                      {deal.seller.lastName[0]}
                    </div>
                    <span className="text-foreground text-sm font-medium">
                      {deal.seller.firstName} {deal.seller.lastName}
                    </span>
                  </div>
                ) : undefined
              }
              editable={false}
              icon={<Building2 size={12} />}
            />

            <InlineField
              label="Created"
              value={new Date(deal.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              icon={<Calendar size={12} />}
              editable={false}
            />

            <InlineField
              label="Last Updated"
              value={new Date(deal.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              icon={<Clock size={12} />}
              editable={false}
            />
          </div>
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
          <InlineField
            label="Notes"
            value={deal.notes}
            type="textarea"
            placeholder="Add notes about this deal..."
            icon={<MessageSquare size={12} />}
            onSave={(v) => saveField('notes', v)}
          />
        </section>

        {/* Source Lead */}
        {deal.lead && (
          <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-stone-50/80 to-white p-5 dark:border-stone-800 dark:from-stone-900/30 dark:to-transparent">
            <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
              <Link2 size={12} />
              Source Lead
            </h4>
            <div className="flex items-center gap-3 rounded-xl border border-stone-100 p-3 transition-colors hover:bg-stone-50/50 dark:border-stone-800 dark:hover:bg-stone-900/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <User size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{deal.lead.contactName}</p>
                <p className="text-muted-foreground text-xs">{deal.lead.code}</p>
              </div>
              <ExternalLink size={14} className="text-muted-foreground" />
            </div>
          </section>
        )}
      </div>

      {/* Right column — Finance + Actions */}
      <div className="flex w-72 shrink-0 flex-col gap-4">
        {/* Finance block (green) */}
        <section className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-transparent">
          <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
            <TrendingUp size={12} />
            Finance
          </h4>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                {finance.total > 0 ? formatAmount(finance.total) : '—'}
              </span>
            </div>
            {finance.isFromPartner && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Partner {PARTNER_PERCENT}%</span>
                <span className="font-bold text-orange-500 tabular-nums dark:text-orange-400">
                  -{formatAmount(finance.partnerAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-bold text-sky-600 tabular-nums dark:text-sky-400">
                {finance.revenue > 0 ? formatAmount(finance.revenue) : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">To Receive</span>
              <span
                className={`font-bold tabular-nums ${finance.toReceive > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}
              >
                {formatAmount(finance.toReceive)}
              </span>
            </div>
          </div>
        </section>

        {/* Actions block (dark) — Create Invoice + Create Task */}
        <section className="rounded-2xl border-2 border-stone-300 bg-stone-100/80 p-4 dark:border-stone-600 dark:bg-stone-800/50">
          <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
            <FileText size={12} />
            Actions
          </h4>
          <div className="space-y-3">
            {/* Create Invoice: only when Cost, Payment Type, Project, Deal Type, Tax Status (and Company if Tax) filled */}
            {canCreateInvoice ? (
              showInvoiceForm ? (
                <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                  <label className="text-muted-foreground block text-[11px] font-medium">
                    Invoice amount (AMD)
                  </label>
                  <input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="Amount..."
                    className="text-foreground w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-emerald-400 dark:border-stone-700 dark:bg-stone-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateInvoice();
                      if (e.key === 'Escape') setShowInvoiceForm(false);
                    }}
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="gap-1"
                      disabled={creatingInvoice || !invoiceAmount || Number(invoiceAmount) <= 0}
                      onClick={handleCreateInvoice}
                    >
                      <Check size={12} />
                      Create
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowInvoiceForm(false);
                        setInvoiceAmount('');
                      }}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                  onClick={() => setShowInvoiceForm(true)}
                >
                  <Plus size={14} />
                  Create Invoice
                </Button>
              )
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-1.5 border-stone-300 text-stone-500 dark:border-stone-600 dark:text-stone-400"
                disabled
                title="Fill required: Cost, Payment Type, Project, Deal Type, Tax Status; if Tax then Company"
              >
                <Plus size={14} />
                Create Invoice
              </Button>
            )}

            {/* Create Task */}
            {projectId && deal.seller && (
              <>
                {showTaskForm ? (
                  <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-800 dark:bg-sky-950/20">
                    <label className="text-muted-foreground block text-[11px] font-medium">
                      Task title
                    </label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Title..."
                      className="text-foreground w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-sky-400 dark:border-stone-700 dark:bg-stone-900"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTask();
                        if (e.key === 'Escape') setShowTaskForm(false);
                      }}
                    />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="gap-1"
                        disabled={creatingTask || !taskTitle.trim()}
                        onClick={handleCreateTask}
                      >
                        <Check size={12} />
                        Create
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowTaskForm(false);
                          setTaskTitle('');
                        }}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-1.5 border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/30"
                    onClick={() => setShowTaskForm(true)}
                  >
                    <CheckSquare size={14} />
                    Create Task
                  </Button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
