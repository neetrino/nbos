import { useCallback, useEffect, useState } from 'react';
import { isStageGateApiError, type ApiFieldError } from '@/lib/api-errors';
import { extensionsApi, type Extension } from '@/lib/api/extensions';
import type {
  DeliveryLifecycleAction,
  DeliveryLifecycleActionPayload,
} from '@/features/projects/components/DeliveryLifecycleActionDialog';

const EXTENSION_STAGE_BY_STATUS: Record<string, 'STARTING' | 'DEVELOPMENT' | 'QA' | 'TRANSFER'> = {
  NEW: 'STARTING',
  DEVELOPMENT: 'DEVELOPMENT',
  QA: 'QA',
  TRANSFER: 'TRANSFER',
};

export interface ExtensionBlocker {
  extensionId: string;
  projectId: string;
  extensionName: string;
  message: string;
  errors: ApiFieldError[];
}

export function useExtensionsTabState(projectId: string) {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [blocker, setBlocker] = useState<ExtensionBlocker | null>(null);

  const fetchExtensions = useFetchExtensions(projectId, statusFilter, setExtensions, setLoading);
  const handleStatusChange = useExtensionStatusChange(setExtensions, setBlocker);
  const handleLifecycleAction = useExtensionLifecycleAction(setExtensions, setBlocker);

  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  return {
    extensions,
    loading,
    statusFilter,
    setStatusFilter,
    blocker,
    clearBlocker: () => setBlocker(null),
    handleStatusChange,
    handleLifecycleAction,
  };
}

function useFetchExtensions(
  projectId: string,
  statusFilter: string | null,
  setExtensions: (extensions: Extension[]) => void,
  setLoading: (loading: boolean) => void,
) {
  return useCallback(async () => {
    setLoading(true);
    try {
      const data = await extensionsApi.getAll({
        projectId,
        pageSize: 50,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setExtensions(data.items);
    } catch {
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, setExtensions, setLoading, statusFilter]);
}

function useExtensionStatusChange(
  setExtensions: (updater: (current: Extension[]) => Extension[]) => void,
  setBlocker: (blocker: ExtensionBlocker | null) => void,
) {
  return useCallback(
    async (extension: Extension, newStatus: string) => {
      try {
        const stage = EXTENSION_STAGE_BY_STATUS[newStatus];
        const updated = await updateExtensionDeliveryStatus(extension, newStatus, stage);
        setExtensions((current) => replaceExtension(current, updated));
        setBlocker(null);
      } catch (error) {
        setBlocker(toExtensionBlocker(error, extension));
      }
    },
    [setBlocker, setExtensions],
  );
}

async function updateExtensionDeliveryStatus(
  extension: Extension,
  newStatus: string,
  stage: 'STARTING' | 'DEVELOPMENT' | 'QA' | 'TRANSFER' | undefined,
) {
  if (stage) return extensionsApi.moveStage(extension.id, { stage });
  if (newStatus === 'DONE') return extensionsApi.complete(extension.id);
  return extensionsApi.updateStatus(extension.id, newStatus);
}

function useExtensionLifecycleAction(
  setExtensions: (updater: (current: Extension[]) => Extension[]) => void,
  setBlocker: (blocker: ExtensionBlocker | null) => void,
) {
  return useCallback(
    async (
      extension: Extension,
      action: DeliveryLifecycleAction | 'resume',
      payload?: DeliveryLifecycleActionPayload,
    ) => {
      try {
        const updated = await updateExtensionLifecycle(extension, action, payload);
        setExtensions((current) => replaceExtension(current, updated));
        setBlocker(null);
      } catch (error) {
        setBlocker(toExtensionBlocker(error, extension));
      }
    },
    [setBlocker, setExtensions],
  );
}

async function updateExtensionLifecycle(
  extension: Extension,
  action: DeliveryLifecycleAction | 'resume',
  payload?: DeliveryLifecycleActionPayload,
) {
  if (action === 'resume') return extensionsApi.resume(extension.id);
  if (action === 'pause') {
    return extensionsApi.pause(extension.id, {
      reason: payload?.reason ?? '',
      onHoldUntil: payload?.onHoldUntil ?? '',
    });
  }
  return extensionsApi.cancel(extension.id, { reason: payload?.reason ?? '' });
}

function replaceExtension(extensions: Extension[], updated: Extension) {
  return extensions.map((extension) =>
    extension.id === updated.id ? { ...extension, ...updated } : extension,
  );
}

function toExtensionBlocker(error: unknown, extension: Extension): ExtensionBlocker {
  if (isStageGateApiError(error)) {
    return {
      extensionId: extension.id,
      projectId: extension.projectId,
      extensionName: extension.name,
      message: error.message,
      errors: error.errors,
    };
  }

  return {
    extensionId: extension.id,
    projectId: extension.projectId,
    extensionName: extension.name,
    message: 'Extension status could not be updated. Check readiness and try again.',
    errors: [],
  };
}
