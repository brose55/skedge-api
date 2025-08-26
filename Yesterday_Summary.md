You’re in great shape. You ended up with exactly **one meaningful static** (`User.authenticate`) and pushed everything else to where it belongs (schema config + service shaping). That’s the right call.

## What we’ve locked in

- **Normalization:** `lowercase: true`, `trim: true` on `email`.
- **Safe shaping:** return `PublicUserDTO` via **projection + `.lean()`** (and keep `select:false` + `toJSON/toObject` as a backstop).
- **Auth static:** `User.authenticate(email, password)` centralizes the sharp edges.
- **Password rotation/versioning:** include `pv` in JWT; reject when DB `passwordVersion` changes.
- **Indexes:** unique on `email` and `username` (and optional compound indexes for Session/Interest aligned to queries).

That resolves your original “do I actually need a static?” dilemma: **yes—just the auth static.** No DTO static needed.

## Quick sanity checklist (paste into your TODOs if you want)

- `User` type: `password` **required** (hooks/methods compile cleanly).
- `password` field: `select:false`; serializers strip it (defense-in-depth).
- JWT payload: minimal (`sub`, `session`, `pv`), not the full user.
- Services return `PublicUserDTO` via `.select({ ... }).lean<DTO>()`.
- Handle duplicate key (`E11000`) as HTTP 409.
- Use `FilterQuery<Doc>` / `UpdateQuery<Doc>` (not `Model<Doc>`).
- Align field names across schema/types (`user` vs `userId`).

## Nice-to-have (portfolio polish, optional)

- **Account lockout** counters after N failed logins (lives in the `authenticate` static).
- **Email verification** flag checked in `authenticate`.
- **Refresh token rotation** + reuse detection.
- **Session indexes:** `{ user: 1, valid: 1, createdAt: -1 }`; **Interest:** unique `{ userId:1, name:1 }`.
- **Prod indexing:** turn off `autoIndex` in prod; run `Model.syncIndexes()` in a startup/migration step.
- **Tests:**

  - `authenticate` success/failure paths,
  - duplicate email → 409,
  - serialization never leaks `password`,
  - JWT invalid after password change.

If you implement just the auth static + DTO projection + indexes + pv, you already look production-aware without pretending you’ve done enterprise work. That’s a strong portfolio story.
