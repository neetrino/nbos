'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { IntegratedSearchFilters, useModuleHeroSlots } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { EmployeeSheet } from '@/features/hr/components/EmployeeSheet';
import { DepartmentCreateDialog } from '@/features/hr/components/DepartmentCreateDialog';
import {
  patchCreateName,
  useDepartmentsPage,
} from '@/features/hr/components/org-chart/use-departments-page';
import { OrgChartWorkspace } from '@/features/hr/components/org-chart/OrgChartWorkspace';
import { PermissionGate } from '@/lib/permissions';

export default function DepartmentsPage() {
  const page = useDepartmentsPage();
  const { search, setSearch, submitSearch, openCreateDialog, t } = page;
  const heroSlots = useMemo(
    () => ({
      leading: (
        <PermissionGate module="COMPANY" action="ADD">
          <Button type="button" className="shrink-0" onClick={() => openCreateDialog(null)}>
            <Plus className="size-4" aria-hidden />
            {t('orgChart.add')}
          </Button>
        </PermissionGate>
      ),
      search: (
        <div
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitSearch();
          }}
        >
          <IntegratedSearchFilters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t('orgChart.searchPlaceholder')}
          />
        </div>
      ),
    }),
    [openCreateDialog, search, setSearch, submitSearch, t],
  );
  useModuleHeroSlots(heroSlots);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <DepartmentsPageBody page={page} />
      <DepartmentsPageDialogs page={page} />
    </div>
  );
}

function DepartmentsPageDialogs({ page }: { page: ReturnType<typeof useDepartmentsPage> }) {
  return (
    <>
      <DepartmentCreateDialog
        open={page.createState.open}
        departments={page.departments}
        formName={page.createState.name}
        formSlug={page.createState.slug}
        formDescription={page.createState.description}
        formParentId={page.createState.parentId}
        saving={page.createState.saving}
        onOpenChange={(open) =>
          page.setCreateState((prev) => ({ ...prev, open, ...(open ? {} : { saving: false }) }))
        }
        onNameChange={(name) => page.setCreateState((prev) => patchCreateName(name, prev))}
        onSlugChange={(slug) => page.setCreateState((prev) => ({ ...prev, slug }))}
        onDescriptionChange={(description) =>
          page.setCreateState((prev) => ({ ...prev, description }))
        }
        onParentIdChange={(parentId) => page.setCreateState((prev) => ({ ...prev, parentId }))}
        onCreate={() => void page.handleCreate()}
      />
      <EmployeeSheet
        employee={page.selectedEmployee}
        open={page.selectedEmployee !== null}
        onOpenChange={(open) => {
          if (!open) page.setSelectedEmployee(null);
        }}
        canEdit={page.canEdit}
      />
    </>
  );
}

function DepartmentsPageBody({ page }: { page: ReturnType<typeof useDepartmentsPage> }) {
  if (page.loading) {
    return (
      <p className="text-muted-foreground p-8 pt-16 text-center text-sm">
        {page.t('deptAdmin.loading')}
      </p>
    );
  }
  return (
    <OrgChartWorkspace
      departments={page.departments}
      myDepartmentIds={page.myDepartmentIds}
      primaryDepartmentId={page.primaryDepartmentId}
      search={page.search}
      onRegisterFind={page.registerFind}
      onAddDepartment={page.openCreateDialog}
      onOpenEmployee={(id) => void page.openEmployee(id)}
    />
  );
}
