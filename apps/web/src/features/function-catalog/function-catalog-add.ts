import { ApiError } from '@/lib/api-errors';
import {
  deliveryConfigurationsApi,
  type OperationalConfigurationDto,
} from '@/lib/api/delivery-configurations';

export type AddSelectionInput = {
  configurationId: string;
  functionIds: readonly string[];
  expectedRevision: number;
  reason?: string;
};

export type AddSelectionResult = {
  addedIds: string[];
  error: unknown | null;
};

/**
 * Adds the picked functions one by one. Each accepted change creates the next revision, so the
 * revision returned by the server is carried into the following call; sending a stale one would be
 * rejected as a conflict. A failure stops the run and reports what was already accepted, because
 * money for those lines is already planned and must not be retried blindly.
 */
export async function addSelectedCatalogFunctions(
  input: AddSelectionInput,
  addFeature: AddFeatureFn = defaultAddFeature,
): Promise<AddSelectionResult> {
  const addedIds: string[] = [];
  let revision = input.expectedRevision;
  for (const functionId of input.functionIds) {
    try {
      const configuration = await addFeature(input.configurationId, functionId, {
        reason: input.reason,
        expectedRevision: revision,
      });
      addedIds.push(functionId);
      revision = configuration.expectedRevision;
    } catch (caught) {
      return { addedIds, error: caught };
    }
  }
  return { addedIds, error: null };
}

export function addFeatureErrorCode(caught: unknown): string | undefined {
  return caught instanceof ApiError ? caught.code : undefined;
}

type AddFeatureFn = (
  configurationId: string,
  functionId: string,
  options: { reason?: string; expectedRevision: number },
) => Promise<OperationalConfigurationDto>;

const defaultAddFeature: AddFeatureFn = (configurationId, functionId, options) =>
  deliveryConfigurationsApi.addFeature(configurationId, functionId, options);
