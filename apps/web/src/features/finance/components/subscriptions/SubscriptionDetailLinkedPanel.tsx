'use client';

import { Building2, FolderKanban, Handshake } from 'lucide-react';
import { DetailSheetSection, EntityNavPillLink } from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import type { Subscription } from '@/lib/api/finance';

export function SubscriptionDetailLinkedPanel({ subscription }: { subscription: Subscription }) {
  const relations = useEntityRelations();

  return (
    <DetailSheetSection title="Linked">
      <div className="flex flex-col items-start gap-2">
        <EntityNavPillLink
          href={`/projects/${subscription.projectId}`}
          label={subscription.project.name}
          icon={FolderKanban}
          opensPage
        />
        {subscription.company ? (
          <EntityNavPillLink
            label={subscription.company.name}
            icon={Building2}
            onOpen={() => relations.openEntity('company', subscription.company!.id)}
          />
        ) : null}
        {subscription.partner ? (
          <EntityNavPillLink
            label={subscription.partner.name}
            icon={Handshake}
            onOpen={() => relations.openEntity('partner', subscription.partner!.id)}
          />
        ) : null}
      </div>
    </DetailSheetSection>
  );
}
