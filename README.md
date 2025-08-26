# skedge-api

Email normalization – Ensured all emails are stored consistently in lowercase and without extra whitespace by using Mongoose’s built-in schema options (lowercase: true, trim: true). This prevents duplicate accounts like Alice@GMAIL.com vs alice@gmail.com and enforces uniqueness at the database level.

Safe data shaping & minimal JWT claims – Tokens contain only the minimal claims required (sub, session, passwordVersion) instead of the full user object. The User schema hides password by default (select: false) and a toJSON transform strips sensitive fields from API responses. This prevents credential leakage via tokens, logs, and JSON responses.

Safe data shaping & leakage prevention – User passwords are hidden at the model level (select: false). A lightweight toJSON/toObject transform strips the field on serialization as a defense-in-depth measure.

Minimal JWT claims – Tokens include only sub (user id), session, and passwordVersion to reduce exposure and support server-side invalidation after password changes.

Email normalization – Enforced lowercase/trim on emails at the schema level to guarantee uniqueness and prevent duplicates like Alice@GMAIL.com vs alice@gmail.com.

Got it 👍 — here’s a short, dev-facing note you can drop into your README under **Authentication / Sessions**. It explains the `passwordVersion` check _and_ reminds future-you (or a teammate) about session id usage:

---

### 🔑 Authentication & Sessions

1. **Password rotation (`passwordVersion`)**

   - Every access/refresh token includes a `pv` claim (the user’s current `passwordVersion`).
   - On each request, `deserializeUser` compares the token’s `pv` against the DB.
   - If they differ (e.g. after a password change), the token is rejected → user must log in again.
   - This makes old tokens auto-expire whenever a password changes.

2. **Session id usage**

   - Access/refresh tokens also include a `session` claim (the Mongo `_id` of the session document).
   - `res.locals.user` is **always a public user DTO** (never secrets, never the session id).
   - 👉 If you need the session id (e.g. for logout, session invalidation), **decode the token and read `decoded.session`**. Do **not** expect `res.locals.user.session`.
   - Example (logout):

     ```ts
     const { decoded } = verifyJwt(refreshToken);
     const sessionId =
       decoded && typeof decoded === "object" ? (decoded as any).session : null;
     if (sessionId) await updateSession({ _id: sessionId }, { valid: false });
     ```

3. **Tokens**

   - **Access tokens** are short-lived and checked on every request.
   - **Refresh tokens** are long-lived, tied to a session, and can be used to issue new access tokens.
   - Both carry `{ sub, pv, session }`.

---

Would you like me to also add a little **flow diagram** (signup → login → request → refresh → logout) so it’s super clear where `pv` and `session` are checked?

### Security considerations

- Passwords are stored with `select: false` at the schema level so they’re never fetched accidentally.
- In flows that explicitly request `+password` (e.g., authentication), the document is never logged or returned. A safe re-fetch is used if a response payload is needed.
