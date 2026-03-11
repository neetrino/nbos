'use client';

import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  User,
  Building2,
  Calendar,
  Clock,
  Archive,
  MessageCircle,
  CheckSquare,
  FileText,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EntitySheet, StatusBadge } from '@/components/shared';
import { getProjectType } from '../constants/projects';
import type { Project } from '@/lib/api/projects';

interface ProjectSheetProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
}

export function ProjectSheet({ project, open, onOpenChange, onDelete }: ProjectSheetProps) {
  const router = useRouter();

  if (!project) return null;

  const projType = getProjectType(project.type);

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={project.name}
      description={project.code}
      badge={
        <div className="flex gap-1.5">
          {projType && <StatusBadge label={projType.label} variant={projType.variant} />}
          {project.isArchived && <StatusBadge label="Archived" variant="gray" />}
        </div>
      }
      className="w-full sm:max-w-[640px]"
      footer={
        <div className="flex items-center justify-between">
          <div>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(project.id)}>
                <Trash2 size={14} />
                Delete
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              router.push(`/projects/${project.id}`);
            }}
          >
            Open Full View
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {project.description && (
            <section className="space-y-2">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Description
              </h4>
              <p className="text-foreground text-sm">{project.description}</p>
            </section>
          )}

          <section className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Project Details
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-muted-foreground">Type</div>
              <div>
                {projType && <StatusBadge label={projType.label} variant={projType.variant} />}
              </div>

              <div className="text-muted-foreground">Contact</div>
              <div className="flex items-center gap-1.5 font-medium">
                <User size={13} />
                {project.contact?.firstName} {project.contact?.lastName}
              </div>

              {project.company && (
                <>
                  <div className="text-muted-foreground">Company</div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Building2 size={13} />
                    {project.company.name}
                  </div>
                </>
              )}

              {project.deadline && (
                <>
                  <div className="text-muted-foreground">Deadline</div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar size={13} />
                    {new Date(project.deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </>
              )}

              <div className="text-muted-foreground">Created</div>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock size={13} />
                {new Date(project.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Summary
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <FolderKanban size={16} className="text-muted-foreground mx-auto" />
                <p className="mt-1 text-lg font-bold">{project._count.products}</p>
                <p className="text-muted-foreground text-[10px]">Products</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <FileText size={16} className="text-muted-foreground mx-auto" />
                <p className="mt-1 text-lg font-bold">{project._count.orders}</p>
                <p className="text-muted-foreground text-[10px]">Orders</p>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-3">
          <div className="border-border rounded-lg border border-dashed p-8 text-center">
            <CheckSquare size={32} className="text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground mt-2 text-sm">
              Products will be displayed here when connected to the API
            </p>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-4">
          <div className="space-y-3">
            {project.seller && (
              <div className="border-border flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                    {project.seller.firstName[0]}
                    {project.seller.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {project.seller.firstName} {project.seller.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">Seller</p>
                  </div>
                </div>
                <StatusBadge label="Seller" variant="amber" />
              </div>
            )}
            {project.pm && (
              <div className="border-border flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {project.pm.firstName[0]}
                    {project.pm.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {project.pm.firstName} {project.pm.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">Project Manager</p>
                  </div>
                </div>
                <StatusBadge label="PM" variant="blue" />
              </div>
            )}
            <div className="border-border flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  {project.contact?.firstName?.[0]}
                  {project.contact?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {project.contact?.firstName} {project.contact?.lastName}
                  </p>
                  <p className="text-muted-foreground text-xs">Client Contact</p>
                </div>
              </div>
              <StatusBadge label="Client" variant="green" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </EntitySheet>
  );
}
