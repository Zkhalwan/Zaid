# Security Specification & Threat Model

## 1. Data Invariants
1. **User Profile (`/users/{userId}`)**:
   - Only the authenticated user matching `userId` can read or write their own profile document.
   - User profile ID cannot be modified or impersonated.
   - Required fields: `id`, `displayName`, `email`. Max lengths strictly enforced.
2. **User Favorites (`/users/{userId}/favorites/{toolId}`)**:
   - Belongs to parent user `/users/{userId}`.
   - Only the authenticated user `request.auth.uid == userId` can list, get, create, or delete their favorites.
   - `toolId` must match path ID and cannot exceed 64 chars.
   - `userId` must match `request.auth.uid`.
3. **Custom Prompts (`/users/{userId}/custom_prompts/{promptId}`)**:
   - Belongs to parent user `/users/{userId}`.
   - Only `request.auth.uid == userId` can read, create, update, or delete.
   - `userId` in payload must strictly match `request.auth.uid`.
   - Content size bounded: `title` <= 150 chars, `prompt` <= 5000 chars.
4. **Tool Reviews (`/tool_reviews/{reviewId}`)**:
   - Read is public (`allow read: if true`).
   - Create is restricted to authenticated users with matching `userId == request.auth.uid`.
   - Update and Delete are restricted to the author (`resource.data.userId == request.auth.uid`).
   - `rating` must be an integer or float between 1 and 5.
   - `comment` bounded between 3 and 1500 chars.
   - Immutability: `userId` and `toolId` cannot be mutated on update.

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated Profile Read**: `GET /users/victim-uid` without auth token -> EXPECT PERMISSION_DENIED.
2. **Cross-User Profile Write**: User `attacker` writing to `/users/victim` -> EXPECT PERMISSION_DENIED.
3. **Ghost Field Injection**: Adding `{ isAdmin: true }` to `/users/{userId}` -> EXPECT PERMISSION_DENIED.
4. **Oversized String Bomb**: Writing a 2MB comment string to `/tool_reviews/{reviewId}` -> EXPECT PERMISSION_DENIED.
5. **Rating Boundary Violation**: Writing `rating: 99` or `rating: -5` -> EXPECT PERMISSION_DENIED.
6. **Author Spoofing**: User `attacker` posting review with `userId: "admin-uid"` -> EXPECT PERMISSION_DENIED.
7. **Malicious Review Tampering**: User `attacker` editing a review authored by `user-123` -> EXPECT PERMISSION_DENIED.
8. **Immutability Breach**: Updating `toolId` or `userId` in existing review -> EXPECT PERMISSION_DENIED.
9. **Path Poisoning**: Document IDs with illegal characters or > 128 characters -> EXPECT PERMISSION_DENIED.
10. **Cross-Tenant Favorite Listing**: User `attacker` listing `/users/victim/favorites` -> EXPECT PERMISSION_DENIED.
11. **Orphaned Prompt Creation**: Writing custom prompt with mismatched `userId` -> EXPECT PERMISSION_DENIED.
12. **Catch-All Default Bypass**: Writing to arbitrary undefined collection `/secrets/config` -> EXPECT PERMISSION_DENIED.
