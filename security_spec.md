# Security Specification - Sindicato Patronal

## Data Invariants
1. A **Member** profile can only be created by an admin or automatically on first login (if allowed). 
2. A **Member** can only read their own profile and their own **Boletos**.
3. **Boletos** are read-only for members (only admins can create/update).
4. **Notifications** are read-only for all authenticated users.
5. **Suggestions** can be created by any authenticated user but only read/deleted by admins.
6. **Public Search** (if implemented in rules) must only allow non-PII lookups.

## The Dirty Dozen Payloads (Target: PERMISSION_DENIED)

1. **Identity Spoofing**: User A trying to update User B's member profile.
2. **PII Leak**: Unauthenticated user trying to list all emails in `members`.
3. **Ghost Write**: Authenticated user trying to create a `boleto` for themselves with `status: 'paid'`.
4. **Member Escalation**: Member trying to update their own `status` to `active` if it was `pending`.
5. **Unauthorized Announcement**: Member trying to create a global `notification`.
6. **Boleto Overwrite**: Member trying to delete one of their own `boletos`.
7. **Suggestion Snooping**: User A trying to read suggestions sent by User B.
8. **Invalid ID Poisoning**: Trying to create a document with a 2KB junk string as ID.
9. **Creation Timestamp Fake**: User trying to set `createdAt` to a date in the past instead of `request.time`.
10. **Shadow Field Injection**: Adding a field `isAdmin: true` to a suggestion payload.
11. **Relational Sync Bypass**: Creating a boleto that points to a non-existent member ID.
12. **Status Lock Break**: Trying to update a `boleto` that is already marked as `paid`.

## Red Team Conflict Report

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning | PII Isolation |
|------------|-------------------|-------------------|-------------------|---------------|
| members | blocked (isOwner) | blocked (hasOnly) | blocked (size) | isolated (owner) |
| boletos | blocked (readOnly) | blocked (readOnly) | blocked (size) | restricted |
| notifications | blocked (readOnly) | blocked (readOnly) | blocked (size) | public-auth |
| suggestions | blocked (writeOnly) | blocked (writeOnly) | blocked (size) | admin-only |
