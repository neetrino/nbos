import type { PipelineStageConfig } from './PipelineStagesBar';

/** Minimal stage row for sheet / kanban pipeline headers (active + terminal). */
export interface SheetPipelineStageSource {
  key: string;
  label: string;
  shortLabel?: string;
}

/**
 * Maps module stage definitions to chevron bar segments.
 * Sheet headers must include terminal outcomes when the board has closed stages (Lead reference).
 */
export function toSheetPipelineStages(
  stages: readonly SheetPipelineStageSource[],
): PipelineStageConfig[] {
  return stages.map((stage) => ({
    key: stage.key,
    label: stage.label,
    shortLabel: stage.shortLabel ?? stage.label,
  }));
}
