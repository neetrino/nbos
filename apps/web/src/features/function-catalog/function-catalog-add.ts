import { ApiError } from '@/lib/api-errors';
import {
  deliveryConfigurationsApi,
  type OperationalConfigurationDto,
} from '@/lib/api/delivery-configurations';
import { tierIdForAdd, type GradationSelectionState } from './function-catalog-gradation';

export type AddSelectionInput = {
  configurationId: string;
  functionIds: readonly string[];
  expectedRevision: number;
  reason?: string;
  gradationByFunctionId?: GradationSelectionState;
};

export type AddSelectionResult = {
  addedIds: string[];
  error: unknown | null;
};

export type AddFeatureOptions = {
  reason?: string;
  expectedRevision: number;
  tierId?: string;
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
      const configuration = await addFeature(
        input.configurationId,
        functionId,
        addFeatureOptions(input, functionId, revision),
      );
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

function addFeatureOptions(
  input: AddSelectionInput,
  functionId: string,
  expectedRevision: number,
): AddFeatureOptions {
  const options: AddFeatureOptions = { expectedRevision };
  if (input.reason) options.reason = input.reason;
  const tierId = tierIdForAdd(input.gradationByFunctionId ?? {}, functionId);
  if (tierId) options.tierId = tierId;
  return options;
}

type AddFeatureFn = (
  configurationId: string,
  functionId: string,
  options: AddFeatureOptions,
) => Promise<OperationalConfigurationDto>;

const defaultAddFeature: AddFeatureFn = (configurationId, functionId, options) =>
  deliveryConfigurationsApi.addFeature(configurationId, functionId, options);
