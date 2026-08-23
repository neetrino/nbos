import { describe, expect, it } from 'vitest';
import {
  canDismissProviderDialog,
  isActiveRequestGeneration,
  shouldApplyProviderSaveSuccess,
  startRequestGeneration,
} from './provider-request-generation';

describe('provider request generation', () => {
  it('ignores a stale completion after a newer request starts', () => {
    const first = startRequestGeneration(0);
    const second = startRequestGeneration(first);
    expect(isActiveRequestGeneration(first, second)).toBe(false);
    expect(isActiveRequestGeneration(second, second)).toBe(true);
  });

  it('blocks dismiss while a write is pending', () => {
    expect(canDismissProviderDialog(true)).toBe(false);
    expect(canDismissProviderDialog(false)).toBe(true);
  });

  it('does not apply a stale Save after close/reopen bumped the generation', () => {
    const inFlight = startRequestGeneration(0);
    const afterClose = startRequestGeneration(inFlight);
    expect(shouldApplyProviderSaveSuccess(inFlight, afterClose)).toBe(false);
    expect(shouldApplyProviderSaveSuccess(afterClose, afterClose)).toBe(true);
  });

  it('ignores an overlapping older Save so only the current generation can close the draft', () => {
    const firstSave = startRequestGeneration(0);
    const secondSave = startRequestGeneration(firstSave);
    expect(shouldApplyProviderSaveSuccess(firstSave, secondSave)).toBe(false);
    expect(shouldApplyProviderSaveSuccess(secondSave, secondSave)).toBe(true);
  });
});
