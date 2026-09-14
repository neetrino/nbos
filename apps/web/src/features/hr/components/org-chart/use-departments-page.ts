'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { slugFromDepartmentName } from '@/features/hr/components/DepartmentCreateDialog';
import {
  mergeDepartmentCardPreview,
  departmentsNeedCardHydration,
} from '@/features/hr/components/org-chart/org-chart-members';
import { overlayOrgSeats } from '@/features/hr/components/org-chart/org-chart-seats';
import type { OrgChartViewMode } from '@/features/hr/components/org-chart/OrgChartToolbar';
import {
  departmentsApi,
  employeesApi,
  type DepartmentItem,
  type DepartmentWithMembers,
  type Employee,
} from '@/lib/api/employees';
import { orgSeatsApi } from '@/lib/api/org-seats';
import { usePermission } from '@/lib/permissions';

export function useDepartmentsPage() {
  const t = useTranslations('hr');
  const { me, can } = usePermission();
  const findRef = useRef<() => void>(() => undefined);
  const requestIdRef = useRef(0);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<OrgChartViewMode>('chart');
  const [search, setSearch] = useState('');
  const [listState, setListState] = useState<ListExpandState>({
    expandedId: null,
    members: null,
    loadingMembers: false,
  });
  const [createState, setCreateState] = useState<CreateFormState>(emptyCreateForm);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const myDepartmentIds = useMemo(
    () => new Set((me?.departments ?? []).map((item) => item.departmentId)),
    [me?.departments],
  );
  const primaryDepartmentId =
    me?.departments.find((item) => item.isPrimary)?.departmentId ??
    me?.departments[0]?.departmentId ??
    null;

  const fetchDepartments = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    try {
      const [list, seats] = await Promise.all([departmentsApi.getAll(), orgSeatsApi.getAll()]);
      if (requestId !== requestIdRef.current) return;
      const hydrated = departmentsNeedCardHydration(list)
        ? await hydrateDepartmentCardMembers(list, t)
        : list;
      if (requestId !== requestIdRef.current) return;
      setDepartments(overlayOrgSeats(hydrated, Array.isArray(seats) ? seats : []));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      toast.error(err instanceof Error ? err.message : t('deptAdmin.loadFailed'));
      setDepartments([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchDepartments();
  }, [fetchDepartments]);

  const openCreateDialog = useCallback((parentId: string | null) => {
    setCreateState({ ...emptyCreateForm, open: true, parentId: parentId ?? '' });
  }, []);

  const registerFind = useCallback((finder: () => void) => {
    findRef.current = finder;
  }, []);

  return {
    t,
    departments,
    loading,
    viewMode,
    setViewMode,
    search,
    setSearch,
    listState,
    createState,
    setCreateState,
    selectedEmployee,
    setSelectedEmployee,
    canEdit: can('EDIT', 'COMPANY'),
    myDepartmentIds,
    primaryDepartmentId,
    registerFind,
    submitSearch: () => findRef.current(),
    openCreateDialog,
    toggleExpand: (dept: DepartmentItem) => void toggleDepartmentMembers(dept, setListState, t),
    handleCreate: () =>
      void submitCreateDepartment(createState, t, setCreateState, fetchDepartments),
    openEmployee: (id: string) => openEmployeeSheet(id, t, setSelectedEmployee),
  };
}

type ListExpandState = {
  expandedId: string | null;
  members: DepartmentWithMembers | null;
  loadingMembers: boolean;
};

type CreateFormState = {
  open: boolean;
  saving: boolean;
  name: string;
  slug: string;
  description: string;
  parentId: string;
};

const emptyCreateForm: CreateFormState = {
  open: false,
  saving: false,
  name: '',
  slug: '',
  description: '',
  parentId: '',
};

async function toggleDepartmentMembers(
  dept: DepartmentItem,
  setListState: Dispatch<SetStateAction<ListExpandState>>,
  t: ReturnType<typeof useTranslations>,
): Promise<void> {
  let shouldLoad = false;
  setListState((prev) => {
    if (prev.expandedId === dept.id) {
      return { expandedId: null, members: null, loadingMembers: false };
    }
    shouldLoad = true;
    return { expandedId: dept.id, members: null, loadingMembers: true };
  });
  if (!shouldLoad) return;
  try {
    const [detail, seats] = await Promise.all([
      departmentsApi.getById(dept.id),
      orgSeatsApi.getAll(dept.id),
    ]);
    const overlaySeats = Array.isArray(seats) ? seats : [];
    const members = {
      ...detail,
      members: overlayOrgSeats([detail], overlaySeats)[0]?.members ?? detail.members ?? [],
    };
    setListState((prev) =>
      prev.expandedId === dept.id ? { ...prev, members, loadingMembers: false } : prev,
    );
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('deptAdmin.membersLoadFailed'));
    setListState((prev) =>
      prev.expandedId === dept.id ? { ...prev, members: null, loadingMembers: false } : prev,
    );
  }
}

async function submitCreateDepartment(
  form: CreateFormState,
  t: ReturnType<typeof useTranslations>,
  setCreateState: Dispatch<SetStateAction<CreateFormState>>,
  fetchDepartments: () => Promise<void>,
): Promise<void> {
  if (!form.name.trim() || !form.slug.trim()) {
    toast.error(t('deptAdmin.nameSlugRequired'));
    return;
  }
  setCreateState((prev) => ({ ...prev, saving: true }));
  try {
    await departmentsApi.create({
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      parentId: form.parentId || undefined,
    });
    toast.success(t('deptAdmin.created'));
    setCreateState(emptyCreateForm);
    await fetchDepartments();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('deptAdmin.createFailed'));
    setCreateState((prev) => ({ ...prev, saving: false }));
  }
}

async function openEmployeeSheet(
  id: string,
  t: ReturnType<typeof useTranslations>,
  setSelectedEmployee: (employee: Employee | null) => void,
): Promise<void> {
  try {
    setSelectedEmployee(await employeesApi.getById(id));
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('deptAdmin.membersLoadFailed'));
  }
}

export function patchCreateName(name: string, prev: CreateFormState): CreateFormState {
  return { ...prev, name, slug: slugFromDepartmentName(name) };
}

async function hydrateDepartmentCardMembers(
  departments: DepartmentItem[],
  t: ReturnType<typeof useTranslations>,
): Promise<DepartmentItem[]> {
  if (departments.length === 0 || !departmentsNeedCardHydration(departments)) {
    return departments;
  }
  try {
    return await Promise.all(
      departments.map(async (department) => {
        if (!departmentsNeedCardHydration([department])) return department;
        return mergeDepartmentCardPreview(department, await departmentsApi.getById(department.id));
      }),
    );
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('deptAdmin.membersLoadFailed'));
    return departments;
  }
}
