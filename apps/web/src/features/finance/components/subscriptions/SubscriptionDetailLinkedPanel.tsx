'use client';

import { Building2, FolderKanban, Handshake } from 'lucide-react';
import { DetailSheetEntityLinkGrid, DetailSheetSection } from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { InvoiceLinkedReadonlyField } from '@/features/finance/components/invoices/InvoiceLinkedReadonlyField';
import type { Subscription } from '@/lib/api/finance';

export function SubscriptionDetailLinkedPanel({ subscription }: { subscription: Subscription }) {
  const relations = useEntityRelations();

  return (
    <DetailSheetSection title="Linked" outlined>
      <DetailSheetEntityLinkGrid>
        <InvoiceLinkedReadonlyField
          label="Project"
          entityKind="project"
          value={subscription.projectId}
          selectionLabel={subscription.project.name}
          icon={<FolderKanban size={12} />}
          onOpen={() => relations.openEntity('project', subscription.projectId)}
        />
        {subscription.company ? (
          <InvoiceLinkedReadonlyField
            label="Company"
            entityKind="company"
            value={subscription.company.id}
            selectionLabel={subscription.company.name}
            icon={<Building2 size={12} />}
            onOpen={() => relations.openEntity('company', subscription.company!.id)}
          />
        ) : null}
        {subscription.partner ? (
          <InvoiceLinkedReadonlyField
            label="Partner"
            entityKind="partner"
            value={subscription.partner.id}
            selectionLabel={subscription.partner.name}
            icon={<Handshake size={12} />}
            onOpen={() => relations.openEntity('partner', subscription.partner!.id)}
          />
        ) : null}
      </DetailSheetEntityLinkGrid>
    </DetailSheetSection>
  );
}
