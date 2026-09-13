'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DepartmentAdminRow } from '@/features/hr/components/DepartmentAdminRow';
import { departmentsApi } from '@/lib/api/employees';
import type { DepartmentItem, DepartmentWithMembers } from '@/lib/api/employees';
import { toast } from 'sonner';
import { PermissionGate } from '@/lib/permissions';

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function DepartmentsPage() {
  const t = useTranslations('hr');
  const tCommon = useTranslations('common');
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedMembers, setExpandedMembers] = useState<DepartmentWithMembers | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await departmentsApi.getAll();
      setDepartments(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('deptAdmin.loadFailed');
      toast.error(msg);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchDepartments();
  }, [fetchDepartments]);

  const fetchMembers = useCallback(
    async (id: string) => {
      setLoadingMembers(true);
      try {
        const data = await departmentsApi.getById(id);
        setExpandedMembers(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('deptAdmin.membersLoadFailed');
        toast.error(msg);
        setExpandedMembers(null);
      } finally {
        setLoadingMembers(false);
      }
    },
    [t],
  );

  function toggleExpand(dept: DepartmentItem) {
    if (expandedId === dept.id) {
      setExpandedId(null);
      setExpandedMembers(null);
    } else {
      setExpandedId(dept.id);
      void fetchMembers(dept.id);
    }
  }

  function openCreateDialog() {
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormParentId('');
    setDialogOpen(true);
  }

  function handleNameChange(name: string) {
    setFormName(name);
    setFormSlug(slugFromName(name));
  }

  async function handleCreate() {
    if (!formName.trim() || !formSlug.trim()) {
      toast.error(t('deptAdmin.nameSlugRequired'));
      return;
    }
    setSaving(true);
    try {
      await departmentsApi.create({
        name: formName.trim(),
        slug: formSlug.trim(),
        description: formDescription.trim() || undefined,
        parentId: formParentId || undefined,
      });
      toast.success(t('deptAdmin.created'));
      setDialogOpen(false);
      void fetchDepartments();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('deptAdmin.createFailed');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const rootDepts = departments.filter((d) => !d.parentId);
  const getChildren = (parentId: string) => departments.filter((d) => d.parentId === parentId);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title={t('deptAdmin.title')}
        trailing={
          <PermissionGate module="COMPANY" action="ADD">
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="mr-2 size-4" aria-hidden />
              {t('deptAdmin.create')}
            </Button>
          </PermissionGate>
        }
      />
      <p className="text-muted-foreground text-sm">{t('deptAdmin.subtitle')}</p>

      {loading ? (
        <div className="text-muted-foreground border-border rounded-lg border p-8 text-center">
          {t('deptAdmin.loading')}
        </div>
      ) : departments.length === 0 ? (
        <div className="text-muted-foreground border-border flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12">
          <Building2 className="size-12" />
          <p>{t('deptAdmin.empty')}</p>
          <PermissionGate module="COMPANY" action="ADD">
            <Button variant="outline" onClick={openCreateDialog}>
              <Plus className="mr-2 size-4" />
              {t('deptAdmin.create')}
            </Button>
          </PermissionGate>
        </div>
      ) : (
        <div className="border-border rounded-lg border">
          {rootDepts.map((dept) => (
            <DepartmentAdminRow
              key={dept.id}
              department={dept}
              getChildren={getChildren}
              expandedId={expandedId}
              expandedMembers={expandedMembers}
              loadingMembers={loadingMembers}
              onToggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deptAdmin.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t('deptAdmin.name')}</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t('deptAdmin.namePlaceholder')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">{t('deptAdmin.slug')}</Label>
              <Input
                id="slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder={t('deptAdmin.slugPlaceholder')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">{t('deptAdmin.description')}</Label>
              <Input
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('deptAdmin.descriptionPlaceholder')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="parent">{t('deptAdmin.parent')}</Label>
              <Select
                value={formParentId || 'none'}
                onValueChange={(v) => setFormParentId(v === 'none' || !v ? '' : v)}
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder={t('deptAdmin.none')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('deptAdmin.none')}</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={() => void handleCreate()} disabled={saving}>
              {saving ? tCommon('creating') : tCommon('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
