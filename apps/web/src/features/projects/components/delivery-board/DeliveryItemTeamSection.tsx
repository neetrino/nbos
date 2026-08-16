'use client';

import { User } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import { RelationPickerChip } from '@/components/shared/relation-picker/RelationPickerChip';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import {
  DETAIL_SHEET_SECTION_TITLE_CLASS,
  RELATION_PICKER_EMPTY_TRIGGER_CLASS,
} from '@/components/shared/detail-sheet-classes';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct, ProductEmployee } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { useEmployeeSearchLoader } from './delivery-item-detail-employee-search';
import type {
  ExtensionPlanSnapshot,
  ProductPlanSnapshot,
} from './delivery-item-detail-planning-state';
import { deliveryStageGateFieldClass } from './delivery-stage-gate-highlight';

interface DeliveryItemTeamSectionProps {
  kind: 'PRODUCT' | 'EXTENSION';
  product: FullProduct | null;
  extension: FullExtension | null;
  productPlan: ProductPlanSnapshot | null;
  extensionPlan: ExtensionPlanSnapshot | null;
  onProductPlanChange: (next: ProductPlanSnapshot) => void;
  onExtensionPlanChange: (next: ExtensionPlanSnapshot) => void;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}

function personName(p: ProductEmployee | null | undefined): string {
  if (!p) return '';
  return `${p.firstName} ${p.lastName}`.trim();
}

function SellerReadOnlyRow({ seller }: { seller: ProductEmployee | null | undefined }) {
  const relations = useEntityRelations();
  const name = personName(seller);

  return (
    <div className="relative w-full min-w-0">
      <div className="text-foreground/85 mb-1.5 flex h-5 items-center gap-2 text-sm font-medium">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-muted-foreground/70 shrink-0">
            <User size={12} aria-hidden />
          </span>
          <span className="truncate">Seller</span>
        </div>
      </div>
      {name && seller ? (
        <RelationPickerChip
          label={name}
          subtitle={seller.email ?? null}
          entityKind="employee"
          onOpen={() => void relations.openEntity('employee', seller.id)}
        />
      ) : (
        <div
          className={cn(
            RELATION_PICKER_EMPTY_TRIGGER_CLASS,
            'pointer-events-none border-dashed italic',
          )}
        >
          Not assigned
        </div>
      )}
    </div>
  );
}

function ProductRolePicker({
  label,
  employeeId,
  employeeLabel,
  onSelect,
  onClear,
  onSearchEmployees,
  disabled,
  className,
}: {
  label: string;
  employeeId: string | null;
  employeeLabel: string;
  onSelect: (id: string, name: string) => void;
  onClear?: () => void;
  onSearchEmployees: (
    query: string,
  ) => Promise<Array<{ value: string; label: string; subtitle?: string }>>;
  disabled?: boolean;
  className?: string;
}) {
  const employeePicker = useRelationPickerActions('employee');

  return (
    <div className={className}>
      <RelationPickerField
        label={label}
        entityKind="employee"
        value={employeeId}
        selectionLabel={employeeLabel || null}
        placeholder="Choose…"
        icon={<User size={12} />}
        onSearch={onSearchEmployees}
        onSelect={(id, name) => onSelect(id, name)}
        onClear={onClear}
        disabled={disabled}
        {...employeePicker}
      />
    </div>
  );
}

export function DeliveryItemTeamSection({
  kind,
  product,
  extension,
  productPlan,
  extensionPlan,
  onProductPlanChange,
  onExtensionPlanChange,
  disabled = false,
  gateRequiredFields = new Set(),
}: DeliveryItemTeamSectionProps) {
  const searchEmployees = useEmployeeSearchLoader();
  const seller =
    kind === 'PRODUCT'
      ? product?.order?.deal?.seller
      : (extension?.order?.deal?.seller ?? undefined);

  const patchProduct = (partial: Partial<ProductPlanSnapshot>) => {
    if (!productPlan) return;
    onProductPlanChange({ ...productPlan, ...partial });
  };

  const patchExtension = (partial: Partial<ExtensionPlanSnapshot>) => {
    if (!extensionPlan) return;
    onExtensionPlanChange({ ...extensionPlan, ...partial });
  };

  return (
    <section className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <h3 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-3')}>
        <User size={13} aria-hidden />
        Team
      </h3>
      <div className="grid grid-cols-2 items-start gap-3">
        {kind === 'PRODUCT' && productPlan ? (
          <>
            <ProductRolePicker
              label="Project manager"
              employeeId={productPlan.pmId}
              employeeLabel={productPlan.pmLabel}
              onSelect={(id, name) => patchProduct({ pmId: id, pmLabel: name })}
              onClear={() => patchProduct({ pmId: null, pmLabel: '' })}
              onSearchEmployees={searchEmployees}
              disabled={disabled}
            />
            <SellerReadOnlyRow seller={seller} />
            <ProductRolePicker
              label="Developer"
              employeeId={productPlan.developerId}
              employeeLabel={productPlan.developerLabel}
              onSelect={(id, name) => patchProduct({ developerId: id, developerLabel: name })}
              onClear={() => patchProduct({ developerId: null, developerLabel: '' })}
              onSearchEmployees={searchEmployees}
              disabled={disabled}
            />
            <ProductRolePicker
              label="Designer"
              employeeId={productPlan.designerId}
              employeeLabel={productPlan.designerLabel}
              onSelect={(id, name) => patchProduct({ designerId: id, designerLabel: name })}
              onClear={() => patchProduct({ designerId: null, designerLabel: '' })}
              onSearchEmployees={searchEmployees}
              disabled={disabled}
            />
            <ProductRolePicker
              label="Technical specialist"
              employeeId={productPlan.technicalSpecialistId}
              employeeLabel={productPlan.technicalSpecialistLabel}
              onSelect={(id, name) =>
                patchProduct({ technicalSpecialistId: id, technicalSpecialistLabel: name })
              }
              onClear={() =>
                patchProduct({ technicalSpecialistId: null, technicalSpecialistLabel: '' })
              }
              onSearchEmployees={searchEmployees}
              disabled={disabled}
            />
            <ProductRolePicker
              label="QA"
              employeeId={productPlan.qaLeadId}
              employeeLabel={productPlan.qaLeadLabel}
              onSelect={(id, name) => patchProduct({ qaLeadId: id, qaLeadLabel: name })}
              onClear={() => patchProduct({ qaLeadId: null, qaLeadLabel: '' })}
              onSearchEmployees={searchEmployees}
              disabled={disabled}
            />
          </>
        ) : null}

        {kind === 'EXTENSION' && extensionPlan ? (
          <>
            <ProductRolePicker
              label="Owner"
              employeeId={extensionPlan.assignedTo}
              employeeLabel={extensionPlan.assigneeLabel}
              onSelect={(id, name) => patchExtension({ assignedTo: id, assigneeLabel: name })}
              onClear={
                gateRequiredFields.has('assignedTo')
                  ? undefined
                  : () => patchExtension({ assignedTo: null, assigneeLabel: '' })
              }
              onSearchEmployees={searchEmployees}
              disabled={disabled}
              className={deliveryStageGateFieldClass(gateRequiredFields, 'assignedTo')}
            />
            <SellerReadOnlyRow seller={seller} />
          </>
        ) : null}
      </div>
    </section>
  );
}
