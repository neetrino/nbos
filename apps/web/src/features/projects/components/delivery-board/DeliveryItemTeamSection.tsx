'use client';

import { User } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct, ProductEmployee } from '@/lib/api/products';
import { useEmployeeSearchLoader } from './delivery-item-detail-employee-search';
import type {
  ExtensionPlanSnapshot,
  ProductPlanSnapshot,
} from './delivery-item-detail-planning-state';
import { DeliveryTeamEmployeeChoiceDisplay } from './delivery-team-employee-display';
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
  const name = personName(seller);
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
        Seller
      </p>
      {name ? (
        <div className="border-border bg-background flex items-center gap-2.5 rounded-lg border px-2.5 py-2 shadow-sm">
          <DeliveryTeamEmployeeChoiceDisplay label={name} />
        </div>
      ) : (
        <div className="border-border bg-muted/20 text-muted-foreground rounded-lg border border-dashed px-2.5 py-2 text-xs italic">
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
  onClear: () => void;
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
    <section className="border-border bg-card/40 rounded-xl border p-4">
      <h3 className="text-muted-foreground mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase">
        <User size={13} className="opacity-70" aria-hidden />
        Team
      </h3>
      <div className="space-y-3">
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
              onClear={() => patchExtension({ assignedTo: null, assigneeLabel: '' })}
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
