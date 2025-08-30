# skedge-api

Email normalization – Ensured all emails are stored consistently in lowercase and without extra whitespace by using Mongoose’s built-in schema options (lowercase: true, trim: true). This prevents duplicate accounts like Alice@GMAIL.com vs alice@gmail.com and enforces uniqueness at the database level.

Safe data shaping & minimal JWT claims – Tokens contain only the minimal claims required (sub, session, passwordVersion) instead of the full user object. The User schema hides password by default (select: false) and a toJSON transform strips sensitive fields from API responses. This prevents credential leakage via tokens, logs, and JSON responses.

Safe data shaping & leakage prevention – User passwords are hidden at the model level (select: false). A lightweight toJSON/toObject transform strips the field on serialization as a defense-in-depth measure.

Minimal JWT claims – Tokens include only sub (user id), session, and passwordVersion to reduce exposure and support server-side invalidation after password changes.

Email normalization – Enforced lowercase/trim on emails at the schema level to guarantee uniqueness and prevent duplicates like Alice@GMAIL.com vs alice@gmail.com.

Nice. You only need small README tweaks to reflect what we actually shipped (no fluff). Here are drop-in replacements/additions.

### Cookies & CORS

This app works in two deployment modes:

1. **Same-site (recommended)**  
   SPA and API are served from the same site (e.g., behind Caddy).

   - Cookies: `SameSite=Lax`, `Secure` (in prod), `HttpOnly`
   - CORS: add your site origin to `cors.origins`

2. **Cross-site** (e.g., Netlify SPA → `api.example.com`)
   - Cookies: `SameSite=None`, `Secure`, `HttpOnly`
   - CORS: list the SPA origin(s) in `cors.origins`
   - Client must send credentials (`fetch: { credentials: "include" }`, Axios: `{ withCredentials: true }`)

All behavior is **config-driven**:

- Cookie attributes: `cookie.*`
- Allowed origins: `cors.origins` (array; with `credentials: true`, wildcards are not allowed)

**Polish (prod):** when `cookie.hostPrefix: true`, cookies are named `__Host-accessToken` / `__Host-refreshToken` (requires HTTPS, `path="/"`, and **no** `domain`).  
**Note:** Cookies are set/cleared via helpers (`getCookieOptions()` / `getCookieNames()`), so the **exact same attributes** are used when clearing, ensuring reliable deletion.

### 🔑 Authentication & Sessions

- **Token payload**: both access and refresh tokens carry `{ sub, pv, session }`  
  (`sub` = user id, `pv` = passwordVersion, `session` = session id).  
  We use a shared type for consumers:
  ```ts
  // src/types/tokens.ts
  export type AccessRefreshPayload = JwtPayload & {
    sub: string;
    pv: number;
    session: string;
  };
  ```

````

* **Password rotation (`pv`)**: `deserializeUser` compares token `pv` vs DB `passwordVersion`.
  Mismatch → token rejected (old tokens die when password changes).

* **Centralized authentication** – User.authenticate(email, password) normalizes input, explicitly selects the password hash (schema uses select:false), verifies credentials, and returns a safe DTO. The method always yields a typed AuthResult ({ ok:true, user,… } or { ok:false, reason }), giving a single point to add lockout, email-verification checks, or transparent re-hashing as security policies evolve.

* **Session id**: per-device revoke. Logout/invalidations operate on the `session` claim.
  `res.locals.user` is **public user DTO only**; session id is **not** stored there.

* **GET /sessions**: returns `200 []` when none, and sets `Cache-Control: no-store`.

* **Session model**: standardized on `userId` (not `user`) across queries and documents.

### 🔐 JWT hardening

- **Algorithm lock**: tokens are signed with RS256 and verified with `{ algorithms: ["RS256"] }`.
- **Issuer/Audience**: tokens include and are verified against `jwt.issuer` and `jwt.audience`.
- **Clock tolerance**: `jwt.clockTolerance = 5` seconds to smooth boundary expirations.
- **PEM normalization**: keys are normalized to handle real newlines or `\n`-escaped envs.
- **Verification result**: helpers return a discriminated union for easy branching:

```ts
  type VerifyJwtSuccess = { valid: true; expired: false; decoded: string | JwtPayload };
  type VerifyJwtFailure = { valid: false; expired: boolean; decoded: null; error?: unknown };
  export type VerifyJwtResult = VerifyJwtSuccess | VerifyJwtFailure;
````

- **Usage pattern**:

  ```ts
  const result = verifyJwt(token);
  if (result.valid && typeof result.decoded === "object") {
    const { sub, pv, session } = result.decoded as AccessRefreshPayload;
    // ...
  }
  ```

### 🪵 Logging

- Refresh → access reissue logs with Pino (no secrets). Failures include reasons like
  `verify_failed`, `session_not_found`, `session_invalid`, `pv_mismatch`; success logs `access_reissued`.
