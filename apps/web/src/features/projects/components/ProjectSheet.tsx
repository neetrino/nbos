'use client';

import { useRouter } from 'next/navigation';
import { Building2, Clock, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EntitySheet, StatusBadge } from '@/components/shared';
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

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={project.name}
      description={project.code}
      badge={project.isArchived ? <StatusBadge label="Archived" variant="gray" /> : undefined}
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
          <TabsTrigger value="client">Client</TabsTrigger>
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
              Summary
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
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
              Orders
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <FileText size={16} className="text-muted-foreground mx-auto" />
                <p className="mt-1 text-lg font-bold">{project._count.orders}</p>
                <p className="text-muted-foreground text-[10px]">Orders</p>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="client" className="mt-4 space-y-4">
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
                <p className="text-muted-foreground text-xs">Contact</p>
              </div>
            </div>
            <StatusBadge label="Client" variant="green" />
          </div>
          {project.company && (
            <div className="border-border flex items-center gap-3 rounded-lg border p-3">
              <Building2 size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{project.company.name}</p>
                <p className="text-muted-foreground text-xs">Company</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </EntitySheet>
  );
}
