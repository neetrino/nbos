import {
  ATS_STATE_END,
  ATS_STATE_FINISH,
  ATS_STATE_INITIATED,
  ATS_STATE_START,
  ATS_STATE_STATUS,
} from './ats.constants';
import { normalizeAtsState } from './ats-call-realtime.phase';

/**
 * Canonical ATS Active Call order from 09-ATS-AM-Integration §2.2:
 * start → status (answered) → finish|end (terminal, absorbing).
 * `initiated` is NBOS-local (click-to-call) and ranks before provider start.
 */
const ATS_STATE_RANK: Readonly<Record<string, number>> = {
  [ATS_STATE_INITIATED]: 0,
  [ATS_STATE_START]: 1,
  [ATS_STATE_STATUS]: 2,
  [ATS_STATE_FINISH]: 3,
  [ATS_STATE_END]: 3,
};

const KNOWN_ATS_STATES = Object.keys(ATS_STATE_RANK);

export function isKnownAtsState(state: string | null | undefined): boolean {
  const normalized = normalizeAtsState(state);
  return normalized.length > 0 && normalized in ATS_STATE_RANK;
}

export function atsStateRank(state: string | null | undefined): number | null {
  const normalized = normalizeAtsState(state);
  if (!normalized) return null;
  return normalized in ATS_STATE_RANK ? ATS_STATE_RANK[normalized] : null;
}

export function isTerminalAtsState(state: string | null | undefined): boolean {
  const normalized = normalizeAtsState(state);
  return normalized === ATS_STATE_FINISH || normalized === ATS_STATE_END;
}

/** Predecessor stored states that may advance to `incoming` (excludes same state). */
export function predecessorStatesFor(incoming: string): string[] {
  const incomingRank = atsStateRank(incoming);
  if (incomingRank == null) return [];
  return KNOWN_ATS_STATES.filter((state) => {
    const rank = ATS_STATE_RANK[state];
    return rank != null && rank < incomingRank;
  });
}

export function knownAtsStates(): readonly string[] {
  return KNOWN_ATS_STATES;
}

export function normalizeIncomingState(state: string): string {
  return normalizeAtsState(state);
}
