'use client';

import { EmployeeSheet } from '@/features/hr/components/EmployeeSheet';
import { DepartmentCreateDialog } from '@/features/hr/components/DepartmentCreateDialog';
import { DepartmentsListPanel } from '@/features/hr/components/DepartmentsListPanel';
import { OrgChartToolbar } from '@/features/hr/components/org-chart/OrgChartToolbar';
import { OrgChartWorkspace } from '@/features/hr/components/org-chart/OrgChartWorkspace';
import {
  patchCreateName,
  useDepartmentsPage,
} from '@/features/hr/components/org-chart/use-departments-page';

export default function DepartmentsPage() {
  const page = useDepartmentsPage();
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <DepartmentsPageBody page={page} />
      <OrgChartToolbar
        viewMode={page.viewMode}
        search={page.search}
        onSearchChange={page.setSearch}
        onSearchSubmit={page.submitSearch}
        onViewModeChange={page.setViewMode}
        onAdd={() => page.openCreateDialog(null)}
      />
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
    </div>
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
  if (page.viewMode === 'list') {
    return (
      <DepartmentsListPanel
        departments={page.departments}
        expandedId={page.listState.expandedId}
        expandedMembers={page.listState.members}
        loadingMembers={page.listState.loadingMembers}
        onToggleExpand={page.toggleExpand}
        onCreate={() => page.openCreateDialog(null)}
      />
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
