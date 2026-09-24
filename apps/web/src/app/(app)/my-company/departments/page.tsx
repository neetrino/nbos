'use client';

import { useMemo } from 'react';
import { IntegratedSearchFilters, useModuleHeroSlots } from '@/components/shared';
import { EmployeeSheet } from '@/features/hr/components/EmployeeSheet';
import { DepartmentCreateDialog } from '@/features/hr/components/DepartmentCreateDialog';
import { useDepartmentsPage } from '@/features/hr/components/org-chart/use-departments-page';
import { OrgChartWorkspace } from '@/features/hr/components/org-chart/OrgChartWorkspace';

export default function DepartmentsPage() {
  const page = useDepartmentsPage();
  const { search, setSearch, submitSearch, t } = page;
  const heroSlots = useMemo(
    () => ({
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
    [search, setSearch, submitSearch, t],
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
        formDescription={page.createState.description}
        formParentId={page.createState.parentId}
        saving={page.createState.saving}
        onOpenChange={(open) =>
          page.setCreateState((prev) => ({ ...prev, open, ...(open ? {} : { saving: false }) }))
        }
        onNameChange={(name) => page.setCreateState((prev) => ({ ...prev, name }))}
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
      canEdit={page.canEdit}
      canAdd={page.canAdd}
      canDelete={page.canDelete}
      onRegisterFind={page.registerFind}
      onAddDepartment={page.openCreateDialog}
      onOpenEmployee={(id) => void page.openEmployee(id)}
      onDepartmentsChanged={page.refreshDepartments}
    />
  );
}
