'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared';
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
import { departmentsApi } from '@/lib/api/employees';
import type { DepartmentItem, DepartmentWithMembers } from '@/lib/api/employees';
import { toast } from 'sonner';
import { PermissionGate } from '@/lib/permissions';

const DEPT_ROLE_LABELS: Record<string, string> = {
  HEAD: 'Head',
  DEPUTY: 'Deputy',
  MEMBER: 'Member',
};

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function DepartmentsPage() {
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
      const msg = err instanceof Error ? err.message : 'Failed to load departments';
      toast.error(msg);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const fetchMembers = useCallback(async (id: string) => {
    setLoadingMembers(true);
    try {
      const data = await departmentsApi.getById(id);
      setExpandedMembers(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load members';
      toast.error(msg);
      setExpandedMembers(null);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  function toggleExpand(dept: DepartmentItem) {
    if (expandedId === dept.id) {
      setExpandedId(null);
      setExpandedMembers(null);
    } else {
      setExpandedId(dept.id);
      fetchMembers(dept.id);
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
      toast.error('Name and slug are required');
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
      toast.success('Department created');
      setDialogOpen(false);
      fetchDepartments();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create department';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const rootDepts = departments.filter((d) => !d.parentId);
  const getChildren = (parentId: string) => departments.filter((d) => d.parentId === parentId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Departments" description="Manage company departments and their members">
        <PermissionGate module="COMPANY" action="ADD">
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 size-4" />
            Create Department
          </Button>
        </PermissionGate>
      </PageHeader>

      {loading ? (
        <div className="text-muted-foreground border-border rounded-lg border p-8 text-center">
          Loading departments...
        </div>
      ) : departments.length === 0 ? (
        <div className="text-muted-foreground border-border flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12">
          <Building2 className="size-12" />
          <p>No departments yet</p>
          <PermissionGate module="COMPANY" action="ADD">
            <Button variant="outline" onClick={openCreateDialog}>
              <Plus className="mr-2 size-4" />
              Create Department
            </Button>
          </PermissionGate>
        </div>
      ) : (
        <div className="border-border rounded-lg border">
          {rootDepts.map((dept) => (
            <DepartmentRow
              key={dept.id}
              department={dept}
              allDepartments={departments}
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
            <DialogTitle>Create Department</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g. engineering"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="parent">Parent Department (optional)</Label>
              <Select
                value={formParentId || 'none'}
                onValueChange={(v) => setFormParentId(v === 'none' || !v ? '' : v)}
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DepartmentRowProps {
  department: DepartmentItem;
  allDepartments: DepartmentItem[];
  getChildren: (parentId: string) => DepartmentItem[];
  expandedId: string | null;
  expandedMembers: DepartmentWithMembers | null;
  loadingMembers: boolean;
  onToggleExpand: (dept: DepartmentItem) => void;
  depth?: number;
}

function DepartmentRow({
  department,
  allDepartments,
  getChildren,
  expandedId,
  expandedMembers,
  loadingMembers,
  onToggleExpand,
  depth = 0,
}: DepartmentRowProps) {
  const children = getChildren(department.id);
  const isExpanded = expandedId === department.id;
  const memberCount = department._count?.members ?? 0;

  return (
    <div className="border-border border-b last:border-b-0">
      <div
        className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
        onClick={() => onToggleExpand(department)}
      >
        <span className="text-muted-foreground shrink-0">
          {children.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )
          ) : (
            <span className="inline-block w-4" />
          )}
        </span>
        <Building2 className="text-muted-foreground size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{department.name}</span>
            <span className="text-muted-foreground text-sm">{department.slug}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {department.parent && <span>Parent: {department.parent.name}</span>}
            <span>•</span>
            <span>{memberCount} members</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div
          className="bg-muted/30 border-border border-t"
          style={{ paddingLeft: `${16 + (depth + 1) * 24}px` }}
        >
          {loadingMembers ? (
            <div className="text-muted-foreground py-4 text-sm">Loading members...</div>
          ) : expandedMembers?.members && expandedMembers.members.length > 0 ? (
            <div className="flex flex-col gap-1 py-3 pr-4">
              {expandedMembers.members.map((m) => (
                <div
                  key={m.id}
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-md px-3 py-2"
                >
                  <Users className="text-muted-foreground size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    {m.employee.firstName} {m.employee.lastName}
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {DEPT_ROLE_LABELS[m.deptRole] ?? m.deptRole}
                  </Badge>
                  {m.isPrimary && (
                    <Badge variant="outline" className="shrink-0">
                      Primary
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-4 text-sm">No members in this department</div>
          )}
        </div>
      )}

      {children.map((child) => (
        <DepartmentRow
          key={child.id}
          department={child}
          allDepartments={allDepartments}
          getChildren={getChildren}
          expandedId={expandedId}
          expandedMembers={expandedMembers}
          loadingMembers={loadingMembers}
          onToggleExpand={onToggleExpand}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
