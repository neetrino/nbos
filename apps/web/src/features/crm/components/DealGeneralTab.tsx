'use client';

import { useCallback, useState } from 'react';
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
  Percent,
  Wallet,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineField, SearchField, StatusBadge } from '@/components/shared';
import { DEAL_TYPES, PRODUCT_TYPES, PAYMENT_TYPES, formatAmount } from '../constants/dealPipeline';
import { LEAD_SOURCES, SALES_CHANNELS, MARKETING_CHANNELS } from '../constants/leadPipeline';
import type { Deal } from '@/lib/api/deals';
import { contactsApi } from '@/lib/api/clients';
import { projectsApi } from '@/lib/api/projects';
import { partnersApi } from '@/lib/api/partners';

const PARTNER_PERCENT = 30;

interface DealGeneralTabProps {
  deal: Deal;
  onUpdate: (id: string, data: Partial<Deal>) => Promise<void>;
}

function computeFinance(deal: Deal) {
  const amount = Number(deal.amount ?? 0);
  const isSubscription = deal.paymentType === 'SUBSCRIPTION';
  const total = isSubscription ? amount * 12 : amount;

  const isFromPartner = deal.source === 'PARTNER';
  const partnerAmount = isFromPartner ? Math.round(total * (PARTNER_PERCENT / 100)) : 0;
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

export function DealGeneralTab({ deal, onUpdate }: DealGeneralTabProps) {
  const [isNewProject, setIsNewProject] = useState(false);
  const [linkedProjectName, setLinkedProjectName] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
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
                  deal.type === 'EXTENSION' ? 'blue' : deal.type === 'UPSELL' ? 'purple' : 'amber'
                }
              />
            }
            type="select"
            options={DEAL_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            icon={<Layers size={12} />}
            onSave={(v) => saveField('type', v)}
          />

          {deal.type === 'NEW_CLIENT' && (
            <InlineField
              label="Product Type"
              value={null}
              type="select"
              options={PRODUCT_TYPES.map((p) => ({ value: p.value, label: p.label }))}
              placeholder="Select product type..."
              icon={<Tag size={12} />}
              onSave={() => Promise.resolve()}
            />
          )}

          {isExtension && (
            <InlineField
              label="Extend Product"
              value={null}
              type="select"
              options={[]}
              placeholder="Select product to extend..."
              icon={<Layers size={12} />}
              onSave={() => Promise.resolve()}
            />
          )}
        </div>
      </section>

      {/* Finance */}
      <section className="rounded-2xl border border-stone-100 bg-gradient-to-br from-emerald-50/40 to-white p-5 dark:border-stone-800 dark:from-emerald-950/10 dark:to-transparent">
        <h4 className="text-muted-foreground mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase">
          <TrendingUp size={12} />
          Finance
        </h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InlineField
            label="Total"
            value={finance.total ? formatAmount(finance.total) : '—'}
            displayValue={
              finance.total > 0 ? (
                <span className="text-lg font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
                  {formatAmount(finance.total)}
                </span>
              ) : undefined
            }
            icon={<Wallet size={12} />}
            editable={false}
          />

          {finance.isFromPartner && (
            <InlineField
              label={`Partner ${PARTNER_PERCENT}%`}
              value={formatAmount(finance.partnerAmount)}
              displayValue={
                <span className="text-sm font-bold text-orange-500 tabular-nums dark:text-orange-400">
                  -{formatAmount(finance.partnerAmount)}
                </span>
              }
              icon={<Percent size={12} />}
              editable={false}
            />
          )}

          <InlineField
            label="Revenue (Profit)"
            value={finance.revenue ? formatAmount(finance.revenue) : '—'}
            displayValue={
              finance.revenue > 0 ? (
                <span className="text-sm font-bold text-sky-600 tabular-nums dark:text-sky-400">
                  {formatAmount(finance.revenue)}
                </span>
              ) : undefined
            }
            icon={<TrendingUp size={12} />}
            editable={false}
          />

          <InlineField
            label="To Receive"
            value={finance.toReceive ? formatAmount(finance.toReceive) : '—'}
            displayValue={
              <span
                className={`text-sm font-bold tabular-nums ${finance.toReceive > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}
              >
                {formatAmount(finance.toReceive)}
              </span>
            }
            icon={<Receipt size={12} />}
            editable={false}
          />
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
  );
}
