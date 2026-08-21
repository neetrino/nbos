import type { AtsWebhookPayload } from './ats.types';
import { isInboundPayload, normalizeAtsState } from './ats-call-realtime.phase';
import { ATS_STATE_START, ATS_STATE_STATUS } from './ats.constants';

export type CallLifecycleEmployee = {
  firstName: string;
  lastName: string;
} | null;

export type CallLifecycleEmployees = {
  initiatedByEmployeeId: string | null;
  responsibleEmployeeId: string | null;
  answeredEmployeeId: string | null;
  initiatedByEmployee: CallLifecycleEmployee;
  responsibleEmployee: CallLifecycleEmployee;
  answeredEmployee: CallLifecycleEmployee;
};

export function resolveLifecycleTarget(
  payload: AtsWebhookPayload,
  call: CallLifecycleEmployees,
): { employeeId: string; name: string | null } | null {
  if (isInboundPayload(payload) && normalizeAtsState(payload.state) === ATS_STATE_START) {
    return toTarget(call.responsibleEmployeeId, call.responsibleEmployee);
  }
  if (isInboundPayload(payload) && normalizeAtsState(payload.state) === ATS_STATE_STATUS) {
    return toTarget(call.answeredEmployeeId, call.answeredEmployee);
  }
  return (
    toTarget(call.initiatedByEmployeeId, call.initiatedByEmployee) ??
    toTarget(call.answeredEmployeeId, call.answeredEmployee) ??
    toTarget(call.responsibleEmployeeId, call.responsibleEmployee)
  );
}

function toTarget(
  employeeId: string | null,
  person: CallLifecycleEmployee,
): { employeeId: string; name: string | null } | null {
  if (!employeeId) return null;
  return { employeeId, name: formatPersonName(person) };
}

export function formatPersonName(
  person: { firstName: string; lastName: string } | null | undefined,
): string | null {
  if (!person) return null;
  const name = `${person.firstName} ${person.lastName}`.trim();
  return name.length > 0 ? name : null;
}
