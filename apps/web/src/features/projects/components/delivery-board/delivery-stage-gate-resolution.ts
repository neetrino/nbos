import type { DeliveryBoardStageGateBlocker } from './project-delivery-board-stage-gate';
import type { DeliveryBoardItem } from './project-delivery-board-model';
import type { DeliveryActiveStage } from './project-delivery-board-actions';

/** Captures a failed stage move so the UI can show a gate dialog and retry the same target. */
export interface DeliveryStageGateResolution {
  blocker: DeliveryBoardStageGateBlocker;
  item: DeliveryBoardItem;
  targetStage: DeliveryActiveStage;
}
