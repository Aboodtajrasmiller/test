# Security Specification for Skill Barter Platform

## Data Invariants
1. A user can only manage their own profile and notifications.
2. A trade can only be created by an authenticated user and must involve two valid users.
3. A user can only accept or decline a trade where they are the receiver.
4. A user can only review a trade they participated in.
5. PII (Email) must be protected; users should not be able to scan everyone's email.
6. Community posts can be viewed by anyone signed in, but only the owner can edit or delete them.

## The "Dirty Dozen" Payloads (Attack Vectors)

1. **Identity Spoofing**: Attempting to create a user profile with a different UID.
2. **PII Scraping**: Attempting a `list` query on `users` to fetch all emails.
3. **Ghost Field Injection**: Adding an `isAdmin: true` field to a user document.
4. **ID Poisoning**: Creating a trade with a 1MB string as the ID.
5. **State Shortcutting**: Updating a `pending` trade directly to `completed` without acceptance.
6. **Relational Orphan**: Creating a notification for a non-existent trade.
7. **Denial of Wallet**: Adding a 5MB string to a post's content field.
8. **Testimonial Injection**: Adding a testimonial to one's own profile acting as another user.
9. **Role Escalation**: Attempting to edit another user's `subscriptionPlan`.
10. **Unauthorized Status Change**: A sender trying to `accepted` their own trade request.
11. **Shadow Update**: Updating a post but injecting a fake `likes` count.
12. **Unverified Write**: Writing to the database with an unverified email account.

## Security Invariants to Implement
- `request.auth.token.email_verified == true` for all writes.
- `affectedKeys().hasOnly()` on all updates.
- Split PII: Emails should only be visible to the `isOwner()`.
- Boundary limits on all strings and arrays.
