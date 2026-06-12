'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Trash2 } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  DeleteConfirmDialog,
  DetailSheetSettingsMenu,
  useDeleteConfirm,
} from '@/components/shared';
import { projectsApi, type FullProject } from '@/lib/api/projects';
import { toast } from 'sonner';

function isProjectInTrash(project: FullProject): boolean {
  return project.trashedAt != null || project.isArchived;
}

export interface ProjectLifecycleActionsProps {
  project: FullProject;
  onProjectUpdated: (project: FullProject) => void;
}

export function ProjectLifecycleActions({
  project,
  onProjectUpdated,
}: ProjectLifecycleActionsProps) {
  const router = useRouter();
  const deleteConfirm = useDeleteConfirm();
  const [restoring, setRestoring] = useState(false);
  const inTrash = isProjectInTrash(project);

  const handleMoveToTrash = async () => {
    try {
      await projectsApi.moveToTrash(project.id);
      toast.success('Project moved to Trash');
      router.push('/projects');
    } catch {
      toast.error('Could not move project to Trash');
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await projectsApi.restore(project.id);
      onProjectUpdated(restored);
      toast.success('Project restored');
    } catch {
      toast.error('Could not restore project');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <DetailSheetSettingsMenu>
        {inTrash ? (
          <DropdownMenuItem disabled={restoring} onClick={() => void handleRestore()}>
            <RotateCcw />
            Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => deleteConfirm.request({ id: project.id, name: project.name })}
          >
            <Trash2 />
            Move to Trash
          </DropdownMenuItem>
        )}
      </DetailSheetSettingsMenu>

      <DeleteConfirmDialog
        level="simple"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title="Move project to Trash?"
        description="The project will be removed from active lists. Delivery data stays linked; restore from Trash later."
        onConfirm={() => {
          deleteConfirm.clear();
          void handleMoveToTrash();
        }}
      />
    </>
  );
}
