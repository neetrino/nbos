'use client';

import { User } from 'lucide-react';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared/detail-sheet-classes';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import { employeeAvatarUrl } from '@/features/hr/utils/employee-display';
import { cn } from '@/lib/utils';
import { useEmployeeSearchLoader } from './delivery-item-detail-employee-search';
import type {
  ExtensionPlanSnapshot,
  ProductPlanSnapshot,
} from './delivery-item-detail-planning-state';
import { ProductRolePicker, SellerReadOnlyRow } from './delivery-item-team-role-picker';
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
              employeeAvatar={productPlan.pmAvatar}
              onSelect={(id, name, avatar) =>
                patchProduct({ pmId: id, pmLabel: name, pmAvatar: employeeAvatarUrl({ avatar }) })
              }
              onClear={() => patchProduct({ pmId: null, pmLabel: '', pmAvatar: null })}
              onSearchEmployees={searchEmployees}
              disabled={disabled}
            />
            <SellerReadOnlyRow seller={seller} />
            <ProductRolePicker
              label="Developer Backend"
              employeeId={productPlan.developerId}
              employeeLabel={productPlan.developerLabel}
              employeeAvatar={productPlan.developerAvatar}
              onSelect={(id, name, avatar) =>
                patchProduct({
                  developerId: id,
                  developerLabel: name,
                  developerAvatar: employeeAvatarUrl({ avatar }),
                })
              }
              onClear={() =>
                patchProduct({ developerId: null, developerLabel: '', developerAvatar: null })
              }
              onSearchEmployees={searchEmployees}
              disabled={disabled}
            />
            <ProductRolePicker
              label="Developer Frontend"
              employeeId={productPlan.frontendDeveloperId}
              employeeLabel={productPlan.frontendDeveloperLabel}
              employeeAvatar={productPlan.frontendDeveloperAvatar}
              onSelect={(id, name, avatar) =>
                patchProduct({
                  frontendDeveloperId: id,
                  frontendDeveloperLabel: name,
                  frontendDeveloperAvatar: employeeAvatarUrl({ avatar }),
                })
              }
              onClear={() =>
                patchProduct({
                  frontendDeveloperId: null,
                  frontendDeveloperLabel: '',
                  frontendDeveloperAvatar: null,
                })
              }
              onSearchEmployees={searchEmployees}
              disabled={disabled}
            />
            <ProductRolePicker
              label="Designer"
              employeeId={productPlan.designerId}
              employeeLabel={productPlan.designerLabel}
              employeeAvatar={productPlan.designerAvatar}
              onSelect={(id, name, avatar) =>
                patchProduct({
                  designerId: id,
                  designerLabel: name,
                  designerAvatar: employeeAvatarUrl({ avatar }),
                })
              }
              onClear={() =>
                patchProduct({ designerId: null, designerLabel: '', designerAvatar: null })
              }
              onSearchEmployees={searchEmployees}
              disabled={disabled}
            />
            <ProductRolePicker
              label="Technical specialist"
              employeeId={productPlan.technicalSpecialistId}
              employeeLabel={productPlan.technicalSpecialistLabel}
              employeeAvatar={productPlan.technicalSpecialistAvatar}
              onSelect={(id, name, avatar) =>
                patchProduct({
                  technicalSpecialistId: id,
                  technicalSpecialistLabel: name,
                  technicalSpecialistAvatar: employeeAvatarUrl({ avatar }),
                })
              }
              onClear={() =>
                patchProduct({
                  technicalSpecialistId: null,
                  technicalSpecialistLabel: '',
                  technicalSpecialistAvatar: null,
                })
              }
              onSearchEmployees={searchEmployees}
              disabled={disabled}
            />
            <ProductRolePicker
              label="QA"
              employeeId={productPlan.qaLeadId}
              employeeLabel={productPlan.qaLeadLabel}
              employeeAvatar={productPlan.qaLeadAvatar}
              onSelect={(id, name, avatar) =>
                patchProduct({
                  qaLeadId: id,
                  qaLeadLabel: name,
                  qaLeadAvatar: employeeAvatarUrl({ avatar }),
                })
              }
              onClear={() => patchProduct({ qaLeadId: null, qaLeadLabel: '', qaLeadAvatar: null })}
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
              employeeAvatar={extensionPlan.assigneeAvatar}
              onSelect={(id, name, avatar) =>
                patchExtension({
                  assignedTo: id,
                  assigneeLabel: name,
                  assigneeAvatar: employeeAvatarUrl({ avatar }),
                })
              }
              onClear={
                gateRequiredFields.has('assignedTo')
                  ? undefined
                  : () =>
                      patchExtension({ assignedTo: null, assigneeLabel: '', assigneeAvatar: null })
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
