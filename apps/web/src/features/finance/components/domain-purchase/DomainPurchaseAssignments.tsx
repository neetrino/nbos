'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { RelationPickerField } from '@/components/shared';
import {
  useEmployeeRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import { getApiErrorMessage } from '@/lib/api-errors';
import { productsApi, type FullProduct, type ProductEmployee } from '@/lib/api/products';

interface DomainPurchaseAssignmentsProps {
  product: FullProduct | null;
  onProductUpdated: (product: FullProduct) => void;
}

export function DomainPurchaseAssignments({
  product,
  onProductUpdated,
}: DomainPurchaseAssignmentsProps) {
  const t = useClientServicesT();
  const searchEmployees = useEmployeeRelationSearch();
  const employeePicker = useRelationPickerActions('employee');
  const seller = product?.order?.deal?.seller ?? null;
  const tech = product?.technicalSpecialist ?? null;

  const assignTech = useCallback(
    async (technicalSpecialistId: string, label: string) => {
      if (!product) return;
      try {
        await productsApi.update(product.id, { technicalSpecialistId });
        onProductUpdated({
          ...product,
          technicalSpecialistId,
          technicalSpecialist: {
            id: technicalSpecialistId,
            firstName: label,
            lastName: '',
          },
        });
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, t('domainPurchase.partialFailure')));
      }
    },
    [onProductUpdated, product, t],
  );

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <RelationPickerField
        label={t('domainPurchase.sales')}
        entityKind="employee"
        value={seller?.id ?? null}
        selectionLabel={personName(seller)}
        readOnly
        onSearch={async () => []}
        onSelect={() => undefined}
      />
      <RelationPickerField
        label={t('domainPurchase.tech')}
        entityKind="employee"
        value={tech?.id ?? product?.technicalSpecialistId ?? null}
        selectionLabel={personName(tech)}
        placeholder={t('domainPurchase.tech')}
        onSearch={searchEmployees}
        onSelect={(id, label) => void assignTech(id, label)}
        {...employeePicker}
      />
    </div>
  );
}

function personName(person: ProductEmployee | null): string | null {
  if (!person) return null;
  const name = `${person.firstName} ${person.lastName}`.trim();
  return name || null;
}
