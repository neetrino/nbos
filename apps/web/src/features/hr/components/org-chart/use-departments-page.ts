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
import { uniqueDepartmentSlug } from '@/features/hr/components/department-slug';
import {
  mergeDepartmentCardPreview,
  departmentsNeedCardHydration,
} from '@/features/hr/components/org-chart/org-chart-members';
import { overlayOrgSeats } from '@/features/hr/components/org-chart/org-chart-seats';
import {
  departmentsApi,
  employeesApi,
  type DepartmentItem,
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
  const [search, setSearch] = useState('');
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
  const submitSearch = useCallback(() => {
    findRef.current();
  }, []);

  return {
    t,
    departments,
    loading,
    search,
    setSearch,
    createState,
    setCreateState,
    selectedEmployee,
    setSelectedEmployee,
    canEdit: can('EDIT', 'COMPANY'),
    myDepartmentIds,
    primaryDepartmentId,
    registerFind,
    submitSearch,
    openCreateDialog,
    refreshDepartments: () => void fetchDepartments(),
    handleCreate: () =>
      void submitCreateDepartment(
        createState,
        departments.map((department) => department.slug),
        t,
        setCreateState,
        fetchDepartments,
      ),
    openEmployee: (id: string) => openEmployeeSheet(id, t, setSelectedEmployee),
  };
}

type CreateFormState = {
  open: boolean;
  saving: boolean;
  name: string;
  description: string;
  parentId: string;
};

const emptyCreateForm: CreateFormState = {
  open: false,
  saving: false,
  name: '',
  description: '',
  parentId: '',
};

async function submitCreateDepartment(
  form: CreateFormState,
  takenSlugs: readonly string[],
  t: ReturnType<typeof useTranslations>,
  setCreateState: Dispatch<SetStateAction<CreateFormState>>,
  fetchDepartments: () => Promise<void>,
): Promise<void> {
  if (!form.name.trim()) {
    toast.error(t('deptAdmin.nameSlugRequired'));
    return;
  }
  setCreateState((prev) => ({ ...prev, saving: true }));
  try {
    await departmentsApi.create({
      name: form.name.trim(),
      slug: uniqueDepartmentSlug(form.name, takenSlugs),
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
