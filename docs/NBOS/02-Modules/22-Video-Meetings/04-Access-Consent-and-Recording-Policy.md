# Video Meetings — permissions, identity and consent

**Status:** mandatory V1 design. Exact legal notice wording, retention/deletion windows and default role assignments require explicit approval before production activation.

## Dedicated permissions

Do not reuse Calendar/ATS/Drive permissions as universal Video Meetings access. Define explicit capabilities `VIEW`, `CREATE`, `JOIN`, `HOST`, `MANAGE`, `RECORD`, `PLAY_RECORDING`, `MANAGE_LINKS` and restricted `EXPORT/DELETE` as required; reconcile exact permission naming with existing RBAC before migration.

- Employee host can manage only currently authorized meetings and records.
- Employee participant may join but does not automatically gain record/play/export rights.
- Guest uses single-room, least-privilege join only: no NBOS API/list, Drive, business entity details or recording playback. During an admitted live session the guest may read and send that room's persisted messages. After the session the guest cannot open the thread.
- Existing Drive visibility, business-object permissions and **meeting-specific restriction** must **all** pass before replay/export; multiple business links are navigation, not automatic media disclosure.
- Keep restricted media access even after post-meeting links; explicit grant with reason/audit is required to broaden access.

## Identity and invitation

Generate opaque LiveKit participant IDs on the backend; map to authenticated employees or unverified guests. Display-name is self-declared, **not** proof of Contact identity or biometric verification. Link to Contact only via separately verified and audited employee action.

Issue unpredictable expiring/revocable invitation secrets; store digests, rate-limit use and scope tokens to one meeting/room. Mint short-lived LiveKit connection tokens **only after backend eligibility/admission**. On revoke/rejoin, enforce effective live access and reconnection policy instead of trusting a still-open browser.

## Recording

The host starts and stops recording. Employees and guests are not asked for a separate consent step, and a missing consent row does not block capture or mute the participant. While a call is live and recording is off, the host sees a small reminder to turn it on.

Start still requires an authorized host, an active session, and a configured recorder. Persist start/stop, participant joins and track mapping as auditable history. V1 capture is not a blanket authorization for V2 AI processing.

## Confidentiality and operations

Private R2, least-privilege server keys, TLS, no public/permanent video URLs and no secrets in browser. Verify LiveKit webhooks with provider authenticity check, deduplicate and reconcile. Audit playback, export, link changes and consent. Limit recordings to authorized storage region and defined retention policy; before production approve actual notice language/legal requirements for operating jurisdictions and data subjects.

AI Platform grants never bypass recording-specific or Drive access.
