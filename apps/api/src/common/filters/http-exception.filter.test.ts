import { describe, it, expect, vi } from 'vitest';
import { GlobalExceptionFilter } from './http-exception.filter';
import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';

function createMockHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({}),
      }),
    } as unknown as ArgumentsHost,
    status,
    json,
  };
}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  it('handles HttpException', () => {
    const { host, status, json } = createMockHost();
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Not Found',
      }),
    );
  });

  it('handles HttpException with object response', () => {
    const { host, status, json } = createMockHost();
    const exception = new HttpException(
      { message: 'Validation failed', error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Validation failed',
        error: 'Bad Request',
      }),
    );
  });

  it('forwards conflicts from ConflictException object response', () => {
    const { host, json } = createMockHost();
    const conflicts = [
      { code: 'PARTICIPANT_OVERLAP', meetingId: 'm1', meetingTitle: 'Busy', detail: 'Overlap' },
    ];
    const exception = new ConflictException({
      message: 'Meeting overlaps with existing scheduled meetings.',
      code: 'CALENDAR_MEETING_CONFLICT',
      conflicts,
    });
    filter.catch(exception, host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        code: 'CALENDAR_MEETING_CONFLICT',
        conflicts,
      }),
    );
  });

  it('handles generic Error', () => {
    const { host, status, json } = createMockHost();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    filter.catch(new Error('something broke'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'something broke',
      }),
    );
    consoleSpy.mockRestore();
  });

  it('handles unknown exception', () => {
    const { host, status, json } = createMockHost();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    filter.catch('string error', host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
    consoleSpy.mockRestore();
  });

  it('includes timestamp in response', () => {
    const { host, json } = createMockHost();
    filter.catch(new HttpException('test', 400), host);
    const call = json.mock.calls[0][0];
    expect(call.timestamp).toBeDefined();
    expect(new Date(call.timestamp).getTime()).not.toBeNaN();
  });
});
