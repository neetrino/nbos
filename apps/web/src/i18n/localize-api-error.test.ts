import { describe, expect, it } from 'vitest';
import { ApiError, CALENDAR_MEETING_CONFLICT_CODE } from '@/lib/api-errors';
import ruCommon from '../messages/ru/common.json';
import ruForms from '../messages/ru/forms.json';
import { firstReleaseFormErrorCopy, localizeCaughtApiError } from './localize-api-error';

const ruCopy = firstReleaseFormErrorCopy(
  ruCommon.permissionDenied,
  ruForms.task.createError,
  ruForms.errors.validation,
  ruForms.meeting.validation.overlapReason,
  ruForms.errors.network,
);

describe('localizeCaughtApiError', () => {
  it('shows the Russian permission copy for 403', () => {
    const error = new ApiError('No permission: TASKS.ADD', { statusCode: 403 });
    expect(localizeCaughtApiError(error, ruCopy)).toBe('У вас нет права на это действие.');
  });

  it('shows the Russian validation copy for field errors', () => {
    const error = new ApiError('Title is required', {
      statusCode: 400,
      errors: [{ field: 'title', message: 'Title is required' }],
    });
    expect(localizeCaughtApiError(error, ruCopy)).toBe(
      'Проверьте выделенные поля и попробуйте снова.',
    );
  });

  it('shows the Russian overlap copy for a meeting conflict code', () => {
    const error = new ApiError('Overlaps existing meeting', {
      statusCode: 409,
      code: CALENDAR_MEETING_CONFLICT_CODE,
    });
    expect(localizeCaughtApiError(error, ruCopy)).toBe(
      'Этот интервал пересекается с другой встречей. Укажите причину, чтобы всё равно запланировать.',
    );
  });

  it('shows a safe Russian fallback for an unknown server error', () => {
    const error = new ApiError('ECONNRESET from upstream calendar adapter', { statusCode: 500 });
    expect(localizeCaughtApiError(error, ruCopy)).toBe(
      'Не удалось создать задачу. Попробуйте снова.',
    );
  });

  it('shows the Russian network copy when the request never reached the API', () => {
    const error = new ApiError('Network Error');
    expect(localizeCaughtApiError(error, ruCopy)).toBe(
      'Не удалось связаться с сервером. Проверьте соединение и попробуйте снова.',
    );
  });
});
