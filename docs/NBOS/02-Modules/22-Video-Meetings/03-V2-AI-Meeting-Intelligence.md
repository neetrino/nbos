# Video Meetings V2 — AI Meeting Intelligence

**Status:** approved future direction; UNSCHEDULED, NOT V1.  
**Hard gate:** separately approved V2 plan **after** required AI Platform entry/runtime readiness. The currently planned AI Platform Phase 2 is not silently expanded by this file.

## User outcome

For a **completed, access-authorized and processing-permitted** V1 recording, NBOS creates reviewable speaker-attributed transcripts, a useful meeting summary, extracted decisions/open questions and **suggested** follow-up tasks. Employees approve/edit results before any business action.

| Capability          | V2 behavior                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Transcription       | Timestamped multilingual speech-to-text of separate participant audio                                                              |
| Speaker attribution | Prefer server-generated participant/track identity + time alignment; flag uncertain overlap, unverified names or shared microphone |
| AI summary          | Main discussion, decisions, open questions, action items with source/timestamp references                                          |
| Task proposals      | Suggested title/assignee/due date **only if supported by speech**; employee validates and triggers authorized Tasks action         |
| Corrections         | Human review/edit/approval, traceable source and revision                                                                          |
| Retrieval           | Access-scoped search and optional authorized Project AI context; no cross-customer leakage                                         |

## Pipeline

```text
V1 completed/private Drive media + timeline + participant mapping
  → re-check access, recording and V2 processing consent/retention
  → queue transcription per audio track (bounded concurrency)
  → timestamp-align segments, note missing audio and overlaps
  → model via AI Platform policy → evidence-linked summary + suggestions
  → employee review/correction and explicit approval
  → scoped derived artifacts in Video Meetings/Drive
  → optional domain-authorized Tasks creation
```

**Provider:** self-hosted faster-whisper/Whisper is a candidate after language/accuracy/cost benchmarks, not a decision that blocks V1. Self-hosting still incurs compute costs. A local diarization fallback does **not** establish real identity.

## Ownership and prohibitions

Video Meetings owns participant-time mapping/transcript presentation; Drive owns bytes/retention; AI Platform owns AI actor/capability, prompts, provider routing, usage/budgets, governance and audit; Tasks owns all resulting real tasks. Confidential source access must be rechecked at every derivative read. Meeting audio and prompts are untrusted sources; model output is not business truth.

No unreviewed business writes, external sending, customer commitments or automatic AI processing without its own approved legal/processing basis. Propagate source deletion/revocation to derived transcript/search indexes per approved policy.

## Go/no-go before V2 release

Require approved multilingual and overlap test thresholds, redaction, provider retention/residency, cost cap, transcript correction audit, and employee review. Verify revocation, wrong-speaker and invented-assignee/due-date negatives. Register future capability in [AI Platform](../21-AI-Platform/90-Future-Capabilities/02-Meeting-Intelligence.md); keep actual final behavior in this module after acceptance.
