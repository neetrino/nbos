import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import {
  CLICK_TO_CALL_IDEMPOTENCY_CONFLICT_CODE,
  CLICK_TO_CALL_IDEMPOTENCY_CONFLICT_MESSAGE,
  CLICK_TO_CALL_IN_PROGRESS_CODE,
  CLICK_TO_CALL_IN_PROGRESS_MESSAGE,
} from './click-to-call-idempotency';

export class ClickToCallInProgressException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.ACCEPTED,
        message: CLICK_TO_CALL_IN_PROGRESS_MESSAGE,
        code: CLICK_TO_CALL_IN_PROGRESS_CODE,
      },
      HttpStatus.ACCEPTED,
    );
  }
}

export class ClickToCallIdempotencyConflictException extends ConflictException {
  constructor() {
    super({
      message: CLICK_TO_CALL_IDEMPOTENCY_CONFLICT_MESSAGE,
      code: CLICK_TO_CALL_IDEMPOTENCY_CONFLICT_CODE,
    });
  }
}
