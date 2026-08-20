# NBOS Platform Owner Security Architecture

## Purpose

Separate Platform Ownership from operational company roles.

NBOS must have two different concepts:

- Platform Owner / Founder — protected platform identity.
- CEO — strongest operational company role.

CEO manages the company. Founder owns the platform security root.

---

# Core Rule

Operational permissions:

```
RBAC / Roles / Permissions
```

Platform ownership:

```
Founder Identity / Sovereign Capabilities
```

Never use Owner and CEO as the same security entity.

Never use:

```
owner || ceo
```

for security-critical decisions.

---

# Current Problems

## Credential bypass

`CREDENTIALS_BYPASS_ROW_VISIBILITY` must not be a normal transferable permission.

Current risk:

1. User receives Owner or CEO role.
2. Role grants bypass permission.
3. User receives global credential visibility.

This creates a platform takeover path.

---

# Target Owner Model

Create a separate ownership model:

```
PlatformOwnership
- ownerEmployeeId
- createdAt
- transferredAt
- transferredByEmployeeId
```

Only one active Platform Owner exists.

Add production security anchor:

```
NBOS_FOUNDER_EMPLOYEE_ID=<employee_uuid>
```

Platform Owner validation:

```
Database ownership
+
Environment anchor
+
Employee identity
```

If ownership integrity fails:

- deny sovereign operations;
- create security audit event;
- fail closed.

---

# Owner Is Not A Role

Owner must not be assignable through RBAC.

Legacy role-owner may exist only for compatibility:

```
system=true
assignable=false
```

Security checks must use:

```
isPlatformOwner(employeeId)
```

Never:

```
role.slug === owner
```

---

# Sovereign Capabilities

These capabilities cannot be granted by:

- roles;
- permissions;
- custom roles;
- personal overrides;
- manual grants.

Only Platform Owner has them.

## Vault

Owner only:

- all credential visibility;
- all Secret credentials;
- OWNER_ONLY credentials;
- full vault export;
- sensitive credential restore;
- emergency vault access;
- master credential operations.

---

# CEO Model

CEO remains the strongest operational user.

CEO has:

- all projects;
- all project teams;
- Drive/company files;
- CRM;
- Leads;
- Deals;
- Contacts;
- Finance;
- Payroll;
- Bonuses;
- Reports;
- Dashboards;
- employee management except Founder;
- project management;
- operational settings.

CEO does not have:

- platform ownership;
- global vault bypass;
- ownership transfer;
- security root access.

---

# Credential Access Model

Credential scopes:

```
MY
TEAM
COMPANY
PROJECT
SECRET
```

Confidentiality levels:

```
NORMAL
RESTRICTED
OWNER_ONLY
```

CEO:

- Team: yes
- Company operational: yes
- Project NORMAL: yes
- Secret: explicit grant only
- OWNER_ONLY: no

Founder:

- all corporate credentials according to security rules.

---

# Remove Credential Bypass From RBAC

Replace permission-based bypass:

```
user.permissions.includes(CREDENTIALS_BYPASS_ROW_VISIBILITY)
```

with:

```
platformOwnershipService.isPlatformOwner(employeeId)
```

---

# Role Assignment Security

Create centralized policy:

```
canAssignRole(actor,targetRole)
```

Rules:

Founder:

- can assign CEO;
- can assign all operational roles.

CEO:

- can assign roles below CEO.
- cannot assign Founder.
- cannot create another CEO.

Other roles:

- cannot assign security-critical roles.

Apply policy to:

- employee creation;
- role changes;
- imports;
- admin actions.

---

# Founder Protection

Normal APIs cannot:

- delete Founder;
- terminate Founder;
- deactivate Founder;
- change Founder ownership;
- disable Founder security;
- reset Founder security access.

---

# Ownership Transfer

Ownership transfer must be a separate operation:

```
transferPlatformOwnership()
```

Requirements:

- current Founder authentication;
- step-up (account password);
- confirmation;
- active target employee;
- audit event;
- notification;
- session invalidation.

---

# Emergency Access

Remove permanent emergency bypass from CEO/Admin.

Emergency access flow:

```
Request
Reason
Scope
TTL
Founder approval
Temporary grant
Audit
```

---

# Step-up Authentication

Required for:

- secret reveal;
- vault export;
- ownership transfer;
- emergency access;
- security changes;
- master key rotation.

---

# Audit

Audit all sovereign operations:

```
actor
action
resource
time
IP/session
reason
result
```

Mandatory:

- credential reveal;
- export;
- emergency access;
- ownership transfer;
- security policy changes.

---

# Migration Plan

1. Create PlatformOwnership model.
2. Add Founder security anchor.
3. Create PlatformOwnershipService.
4. Add isPlatformOwner().
5. Remove credential bypass from RBAC.
6. Implement CEO credential policy.
7. Add OWNER_ONLY confidentiality.
8. Secure role assignment.
9. Protect Founder account.
10. Remove CEO permanent emergency access.
11. Update all places where Owner and CEO are mixed.
12. Add security regression tests.

---

# Acceptance Tests

Must verify:

1. Database role change to Owner does not create Founder.
2. Database role change to CEO does not create Founder.
3. Custom roles cannot create Founder access.
4. Finance/Admin cannot assign Founder.
5. CEO cannot assign Founder.
6. CEO cannot deactivate Founder.
7. CEO sees project operational credentials.
8. CEO cannot see personal credentials.
9. CEO cannot access OWNER_ONLY secrets.
10. Ownership mismatch fails closed.
11. Emergency access is audited.
12. Ownership transfer requires step-up (account password; product has no TOTP).
13. Old Founder loses sovereign access after transfer.

---

# Final Rule

Founder owns the platform.

CEO runs the company.

Operational access uses RBAC.

Security root uses Platform Owner identity.
