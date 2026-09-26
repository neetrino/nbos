# Video Meetings — permissions, identity and consent

**Status:** mandatory V1 design. Exact legal notice wording, retention/deletion windows and default role assignments require explicit approval before production activation.

## Dedicated permissions

Do not reuse Calendar/ATS/Drive permissions as universal Video Meetings access. Define explicit capabilities `VIEW`, `CREATE`, `JOIN`, `HOST`, `MANAGE`, `RECORD`, `PLAY_RECORDING`, `MANAGE_LINKS` and restricted `EXPORT/DELETE` as required; reconcile exact permission naming with existing RBAC before migration.

- Employee host can manage only currently authorized meetings and records.
- Employee participant may join but does not automatically gain record/play/export rights.
- Guest uses single-room, least-privilege join only: no NBOS API/list, Drive, business entity details or recording playback.
- Existing Drive visibility, business-object permissions and **meeting-specific restriction** must **all** pass before replay/export; multiple business links are navigation, not automatic media disclosure.
- Keep restricted media access even after post-meeting links; explicit grant with reason/audit is required to broaden access.

## Identity and invitation

Generate opaque LiveKit participant IDs on the backend; map to authenticated employees or unverified guests. Display-name is self-declared, **not** proof of Contact identity or biometric verification. Link to Contact only via separately verified and audited employee action.

Issue unpredictable expiring/revocable invitation secrets; store digests, rate-limit use and scope tokens to one meeting/room. Mint short-lived LiveKit connection tokens **only after backend eligibility/admission**. On revoke/rejoin, enforce effective live access and reconnection policy instead of trusting a still-open browser.

## Recording consent

1. Show accessible recording notice and record notice version **before** capture. Get explicit consent from **each participant who will be recorded**.
2. Start recording only if an authorized host requests it, service capacity exists and all present participants have confirmed required consent.
3. A late or reconnecting participant must accept the in-progress notice **before** sending capturable media; on decline deny recorded entry or pause/stop capture under a clearly implemented policy.
4. On consent withdrawal **stop/suspend capture immediately** and record the transition; resuming requires valid consent by every then-participating person.
5. Persist consent, revocation, start/stop, participant joins and track mapping as auditable history. Prior captured data follows approved deletion/retention policy; do not pretend revocation automatically erased the past.
6. V1 recording consent is **not** a blanket authorization for V2 AI processing. Define separate processing basis and policies at V2 rollout.

If server-side consent state is unknown, deny recording instead of guessing.

## Confidentiality and operations

Private R2, least-privilege server keys, TLS, no public/permanent video URLs and no secrets in browser. Verify LiveKit webhooks with provider authenticity check, deduplicate and reconcile. Audit playback, export, link changes and consent. Limit recordings to authorized storage region and defined retention policy; before production approve actual notice language/legal requirements for operating jurisdictions and data subjects.

AI Platform grants never bypass recording-specific or Drive access.
