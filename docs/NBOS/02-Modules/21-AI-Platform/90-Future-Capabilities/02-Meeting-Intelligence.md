# Meeting Intelligence — Video Meetings V2

Status: APPROVED  
Target: Video Meetings V2, UNSCHEDULED; after AI Product Entry Gate and separate V2 go/no-go.  
Priority: HIGH  
Canon summary: Authorized meeting audio becomes speaker-attributed, timestamped transcripts, reviewable summaries and human-approved task suggestions without bypassing AI Platform policy.

## Goal

Integrate [Video Meetings V2](../../22-Video-Meetings/03-V2-AI-Meeting-Intelligence.md) into existing governed AI infrastructure. Not part of the current AI Platform Phase 2 release or Video Meetings V1.

## Requirements and boundaries

- Input: verified Drive V1 recording assets, individual participant audio/timing, current recording access and separately appropriate AI processing permission.
- Processing: policy/routing/budgets via existing AI Platform; provider-independent transcription candidate benchmark (self-hosted Whisper-family possible); align timestamps, overlap and missing segments, never claim biometric speaker verification.
- Output: permission-scoped transcript, evidenced summary/decisions/unresolved issues and **suggested** tasks; employee correction and explicit domain-authorized approval before any Task write.
- Ownership: Video Meetings owns session/track identity/transcript UI; Drive owns media and generated file lifecycle; AI Platform owns actor/model/policy/audit; Tasks/CRM/Projects own business state.
- Isolation: no cross-project/customer leakage, raw media access bypass or customer-facing AI send. Respect source deletion, revocation and approved retention.

## Readiness and canonization

Begin only after AI runtime gate and separately approved V2 implementation plan. Evaluate languages, speaker errors, unsupported assertions, privacy/cost and failure recovery before rollout. On verified V2 acceptance, move final behavior into normal owning-module canon and mark this future capability DONE; until then it remains design only.
