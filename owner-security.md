Read and analyze:
docs/NBOS/02-Modules/16-Settings-Admin/03-Platform-Owner-Security-Architecture.md

This document is the source of truth.

Perform a complete audit of the NBOS repository.

Find every place where:

- Owner and CEO are treated as the same entity;
- security permissions depend on roles;
- credentials bypass can be inherited through RBAC;
- role escalation is possible;
- platform ownership is not protected.

Create an implementation plan first.

After approval, implement the full architecture end-to-end.

Do not make partial fixes.
Do not only hide UI elements.
All security rules must be enforced on backend/domain level.

All acceptance tests from the document must pass.
