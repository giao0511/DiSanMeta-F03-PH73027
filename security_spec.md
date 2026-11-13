# Security Specification — DiSanMeta Firestore Rules

## 1. Data Invariants
1. **Default-Deny Catch-All**: No collection or subcollection is accessible unless explicitly permitted by a matching rule.
2. **Public vs Admin Data Isolation**: `admin_records`, `publication_rights`, `audit_logs`, and `admins` contain sensitive storage notes, non-public content, or internal PII/audit identities and are strictly restricted to verified administrators (`isAdmin()`).
3. **Public Record Projection Guard**: `public_records` can only be read (`get` / `list`) when `resource.data.isPubliclyPublished == true` (unless read by an admin), ensuring unpublished or revoked records are never exposed to anonymous/incognito queries.
4. **Bootstrapped & Verified Admin**: Admin access requires `request.auth != null && request.auth.token.email_verified == true` AND either the runtime bootstrapped admin email (`tuananh.tvta0112004@gmail.com`) or membership in `/admins/{request.auth.uid}`.
5. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps on write must match `request.time`, and `createdAt` is immutable on updates.
6. **Size & Type Validation**: Every string, array, and ID path parameter is bounded in length and type-checked via `isValid*` helper functions before any write.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated write to `/public_records/F03-00001`.
2. Signed-in non-admin user attempting to read `/admin_records/F03-00001`.
3. Signed-in user with `email_verified: false` spoofing the admin email to write to `/collections/f03-van-mieu`.
4. Anonymous user attempting `list` on `/public_records` without filtering `isPubliclyPublished == true` (or reading an unpublished doc).
5. Non-admin user attempting to add themselves to `/admins/{theirUid}`.
6. Admin attempting to inject a shadow/unknown key (`hackedFlag: true`) into `/admin_records/F03-00001`.
7. Admin attempting to write a 2KB document ID into `/sources/{oversizedId}`.
8. Admin attempting to spoof `createdByUid` to a different user's UID on create.
9. Admin attempting to forge a backdated `createdAt` timestamp instead of `request.time`.
10. Admin attempting to mutate immutable `createdAt` during an `update` on `/admin_records/F03-00001`.
11. Unauthenticated user attempting to read `/publication_rights` or `/audit_logs`.
12. Admin attempting to submit a `manifestationType` outside the allowed Vietnamese archival enum.
