import type { DeliveryCompensationErrorCode, DeliveryDesignMode } from './constants';

export type DesignModeAssignmentInput = {
  designMode: DeliveryDesignMode;
  designerAssigned: boolean;
  aiDesignerReview: boolean;
};

export function validateDesignModeAssignment(
  input: DesignModeAssignmentInput,
): DeliveryCompensationErrorCode | null {
  if (input.designMode === 'AI_DESIGN' && input.designerAssigned && !input.aiDesignerReview) {
    return 'AI_DESIGNER_REVIEW_REQUIRED';
  }
  return null;
}
