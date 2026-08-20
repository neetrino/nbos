# Auth V2 — implementation pointer

Canon (do not implement from this file):

- [`docs/NBOS/01-Platform-Overview/06-Authentication-and-Sessions.md`](docs/NBOS/01-Platform-Overview/06-Authentication-and-Sessions.md)
- UI: [`docs/NBOS/05-UI-Specifications/12-Account-Security-Sessions.md`](docs/NBOS/05-UI-Specifications/12-Account-Security-Sessions.md)
- Flags: [`docs/architecture/auth-session-v2-rollout.md`](docs/architecture/auth-session-v2-rollout.md)

Rules:

1. Extend existing Auth Session V2. Do not add a second login system.
2. Do not delete legacy JWT until the canon §18 wait is done.
3. Enable scheduler job 14 only together with V2 issue.
