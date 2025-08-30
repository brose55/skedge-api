Great instincts. You’ve basically discovered a classic layering leak: your barrels are exporting persistence details (Mongoose models/types) into layers that should never see them. Moving to DTO-returning repos is the right fix—now let’s cleanly enforce it and de-tangle the structure.

Below is a pragmatic plan you can execute today, with concrete code and “guard rails” so it doesn’t regress.

---

# 1) Define clear boundaries (and keep models private)

Reshape the folders into feature-first modules with explicit public APIs:

```
src/
├─ modules/
│  ├─ user/
│  │  ├─ app/                 # use-cases/services (pure TS)
│  │  │  └─ user.service.ts
│  │  ├─ domain/              # DTOs + repository interface (no Mongoose)
│  │  │  ├─ user.dto.ts
│  │  │  └─ user.repo.ts
│  │  ├─ infra/               # Mongoose models + repo implementation (private)
│  │  │  ├─ user.model.ts
│  │  │  └─ user.repo.mongo.ts
│  │  ├─ http/                # controllers/routes/validators
│  │  │  ├─ user.controller.ts
│  │  │  └─ user.routes.ts
│  │  └─ index.ts             # <-- only safe exports from this module
│  └─ session/
│     └─ (same pattern)
├─ middleware/
├─ utils/
├─ schemas/                   # request/response zod schemas (can be per module)
├─ app.ts
```

**Key rule:** `infra/` must never be imported outside its module. Only `modules/*/index.ts` is public.

---

# 2) Make the “public API” of each module explicit

Example `modules/user/index.ts`:

```ts
// Only export what other layers are allowed to use:
export type { PublicUserDTO, PublicUserWithPv } from "./domain/user.dto";

export type { IUserRepository } from "./domain/user.repo";
export { makeUserService } from "./app/user.service";

// No infra exports here.
// If something needs wiring, expose a factory:
export { makeMongoUserRepository } from "./infra/user.repo.mongo";
```

This lets your app composition wire concrete repos, while controllers/services only depend on DTOs + interfaces.

---

# 3) Move DTOs + repo interfaces to `domain/`

Your `users.repository.ts` is doing the right thing, but split the interface and DTOs from the implementation:

```ts
// modules/user/domain/user.dto.ts
export const PUBLIC_USER_PROJECTION =
  "_id username email createdAt updatedAt" as const;

export type PublicUserDTO = {
  _id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUserWithPv = {
  user: PublicUserDTO;
  passwordVersion: number;
};
```

```ts
// modules/user/domain/user.repo.ts
import type { PublicUserDTO, PublicUserWithPv } from "./user.dto";

export interface IUserRepository {
  findPublicById(id: string): Promise<PublicUserDTO | null>;
  findWithSecretsByEmail(email: string): Promise<{
    _id: string;
    email: string;
    password: string;
    passwordVersion: number;
  } | null>;
  findPublicWithPvById(id: string): Promise<PublicUserWithPv | null>;
  // ...create/update ops that return DTOs only
}
```

---

# 4) Keep Mongoose inside `infra/` and map to DTOs

```ts
// modules/user/infra/user.repo.mongo.ts
import { UserModel } from "./user.model";
import type { IUserRepository } from "../domain/user.repo";
import {
  PUBLIC_USER_PROJECTION,
  type PublicUserDTO,
  type PublicUserWithPv,
} from "../domain/user.dto";

export function makeMongoUserRepository(): IUserRepository {
  return {
    async findPublicById(id) {
      const doc = await UserModel.findById(id)
        .select(PUBLIC_USER_PROJECTION)
        .lean()
        .exec();
      return doc ? mapPublic(doc) : null;
    },

    async findWithSecretsByEmail(email) {
      const doc = await UserModel.findOne({ email })
        .select("+password +passwordVersion")
        .lean()
        .exec();
      return doc
        ? {
            _id: String(doc._id),
            email: doc.email,
            password: doc.password,
            passwordVersion: doc.passwordVersion,
          }
        : null;
    },

    async findPublicWithPvById(id): Promise<PublicUserWithPv | null> {
      const doc = await UserModel.findById(id)
        .select(`${PUBLIC_USER_PROJECTION} +passwordVersion`)
        .lean()
        .exec();
      return doc
        ? { user: mapPublic(doc), passwordVersion: doc.passwordVersion }
        : null;
    },
  };
}

function mapPublic(doc: any): PublicUserDTO {
  return {
    _id: String(doc._id),
    username: doc.username,
    email: doc.email,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
```

> Note the **`mapPublic`** function. Centralize mapping so DTO shapes stay consistent.

---

# 5) Services depend on interfaces, not models

```ts
// modules/user/app/user.service.ts
import type { IUserRepository } from "../domain/user.repo";
import type { PublicUserDTO } from "../domain/user.dto";

export function makeUserService(deps: { users: IUserRepository }) {
  const { users } = deps;

  return {
    getPublicProfile(id: string): Promise<PublicUserDTO | null> {
      return users.findPublicById(id);
    },
    // other use-cases...
  };
}
```

Controllers only touch the service and zod schemas; they never see Mongoose.

---

# 6) Kill the leaky barrels (but do it safely)

### Remove these exports

```ts
// ❌ OLD (leaky)
// export { default as UserModel } from "./user.model";
// export type { User, UserMethods, UserDoc, UserModelType } from "./user.types";
```

Keep `UserModel` **unexported** outside `infra/`. If you still need some model-only helpers for infra, export them **inside** `infra/index.ts` and avoid re-exporting in the module root.

### Temporary shim (optional)

If you need a soft migration:

```ts
// modules/user/index.ts (temporary)
if (process.env.NODE_ENV !== "production") {
  console.warn(
    "[DEPRECATION] Importing models from modules/user is disallowed."
  );
}
// no model re-exports here — just the warning if people try to add them back
```

---

# 7) Enforce the boundary with lint rules

Add **eslint-plugin-import** and **eslint-plugin-boundaries**:

```js
// .eslintrc.cjs
module.exports = {
  // ...
  plugins: ["import", "boundaries"],
  settings: {
    "boundaries/elements": [
      { type: "module", pattern: "src/modules/*" },
      { type: "infra", pattern: "src/modules/*/infra/**" },
      { type: "domain", pattern: "src/modules/*/domain/**" },
      { type: "app", pattern: "src/modules/*/app/**" },
      { type: "http", pattern: "src/modules/*/http/**" },
    ],
  },
  rules: {
    // Do not import infra from outside the module
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/modules/*/infra/*"],
            message:
              "Do not import persistence layer directly. Depend on the module index or domain/app instead.",
          },
          {
            group: ["@/models/**"], // if any legacy path alias remains
            message:
              "Models are infra details. Import from the module service or repo interface.",
          },
        ],
      },
    ],
    // Optional stricter boundary policy
    "boundaries/element-types": [
      "error",
      {
        default: "allow",
        rules: [
          {
            from: ["module"],
            allow: ["module"], // through index.ts
          },
          {
            from: ["http"],
            disallow: ["infra"], // controllers can't see models
          },
          {
            from: ["app"],
            disallow: ["infra"],
          },
        ],
      },
    ],
  },
};
```

This is your **regression guard**: future code can’t sneak models into controllers/services.

---

# 8) Path aliases & build setup

In `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"]
    }
  }
}
```

Then always import through the module index:

```ts
import { makeUserService, makeMongoUserRepository } from "@modules/user";
```

---

# 9) Schema ↔ DTO alignment

- Keep **Zod** (or Valibot) schemas close to `http/` (request validation).
- Response schemas can live in `domain/` to describe DTOs, or you can export DTO types and derive zod via `zodType<PublicUserDTO>()` patterns.
- Avoid reusing Mongoose schemas for API responses—DTOs are the contract.

---

# 10) Tests

- **Unit tests** (fast): mock `IUserRepository` to test services/use-cases.
- **Integration tests** (slow): exercise `infra/` repo against an ephemeral Mongo (mongodb-memory-server) and verify mapping to DTOs.

Example test seam:

```ts
// __tests__/user.service.test.ts
const fakeRepo: IUserRepository = {
  findPublicById: async (id) => ({
    _id: id,
    username: "u",
    email: "e",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  findWithSecretsByEmail: async () => null,
  findPublicWithPvById: async () => null,
};

const svc = makeUserService({ users: fakeRepo });
// assertions...
```

---

# 11) Naming conventions (consistency cures chaos)

- Files: `user.repo.mongo.ts`, `user.repo.ts`, `user.dto.ts`, `user.service.ts`, `user.controller.ts`.
- Types:

  - `PublicUserDTO` (API-returnable)
  - `InternalUserRow` (if needed; not exported)
  - `UserDoc` (Mongoose doc type; **infra only**)

- Methods: `findPublicById`, `findWithSecretsByEmail`, `createUser`, `updateUserProfile`, etc. Prefer verbs + scope.

---

# 12) Step-by-step migration (low risk)

1. **Introduce the new structure** for one module (user).
2. **Stop exporting models** from that module’s barrels.
3. **Rewrite imports** to consume the module’s index/service/repo interface:

   - Quick codemod (ripgrep + sd):

     ```bash
     rg -l 'from ["\']@/models/user["\']' \
       | xargs sd 'from "@/models/user"' 'from "@modules/user"'
     ```

   - Then fix symbols per file (TS errors will point you to right API).

4. Add **lint rules** (above).
5. Repeat for **session** and **interest**.
6. Delete old `repos/*.repository.ts` if they move into `modules/*/infra/…`.

---

# 13) Your concrete example, cleaned

- `modules/user/domain/user.dto.ts` — keep your `PublicUserDTO` and `PublicUserWithPv` here.
- `modules/user/infra/user.repo.mongo.ts` — the code you posted, moved here, plus a mapper.
- **Delete** the old `models/user/index.ts` barrel or keep it private (no re-export).
- Controllers call `makeUserService({ users: makeMongoUserRepository() })`.

---

# 14) Optional: package boundary at project root

If you want a single import surface, create `src/modules/index.ts`:

```ts
export * as User from "./modules/user";
export * as Session from "./modules/session";
// ...
```

But still **do not** re-export infra symbols.

---

## TL;DR

- **Feature modules** with `domain/app/infra/http` subfolders.
- **DTOs + repo interfaces** live in `domain/`.
- **Mongoose models and repos** live in `infra/` and never leak.
- **Module index** re-exports only safe surface (DTOs, interfaces, factories, services).
- **Lint rules** enforce the boundary.
- **Mapping functions** normalize DB → DTO.
- **Codemod + TS errors** guide the migration.

If you want, paste your current `users.repository.ts` and one controller; I’ll refactor them into the module shape above so you’ve got drop-in files to move over.

---

You’ve got the gist. Let me sharpen the edges so it’s airtight.

## 1) One folder per **feature module**

`user/`, `session/`, `interest/` — each with:

- `domain/` → DTOs and repository **interfaces** (no Mongoose, no HTTP)
- `app/` → use-cases/services (pure TS that depend on domain interfaces)
- `infra/` → Mongoose model + repo **implementations** (DB details)
- `http/` → controller + routes + request/response **validation**
- `index.ts` → the module’s **public surface**

**Rule:** nothing outside the module imports from its `infra/`.

## 2) What does `index.ts` export?

From a module’s `index.ts`, export **only safe, stable things**:

- DTO types (what others may legally “know” about you)
- Repository **interfaces**
- Service/use-case factories (pure)
- Optionally the module’s `router` if your composition root wires routes per module

**Do not export** Mongoose models, `infra/` classes, or internal helpers.

Example (`modules/user/index.ts`):

```ts
export type { PublicUserDTO, PublicUserWithPv } from "./domain/user.dto";
export type { IUserRepository } from "./domain/user.repo";
export { makeUserService } from "./app/user.service";

// factory to build the concrete repo (still safe to expose as a factory)
export { makeMongoUserRepository } from "./infra/user.repo.mongo";

// no model exports
```

## 3) “sessions interacts with PublicUserDTO” — how to do that?

There are three clean options; pick based on coupling you’re OK with.

### Option A (simple & fine): Import the **User module’s DTO** from `@modules/user`

- `session` module depends on the _contract_ of `user` (its DTO type), not its infra.
- This is OK and common. It creates a directional dependency `session → user` at the **domain level** only.

```ts
// modules/session/domain/session.dto.ts
import type { PublicUserDTO } from "@modules/user";

export type SessionViewDTO = {
  sessionId: string;
  user: PublicUserDTO; // explicit: session exposes a user view
  createdAt: Date;
  expiresAt: Date;
};
```

**When to choose:** you want to return a session and a _canonical_ view of the user together.

### Option B (more decoupled): Session returns only `userId`

- Keep `session` DTO independent:

  ```ts
  export type PublicSessionDTO = {
    sessionId: string;
    userId: string;
    createdAt: Date;
    expiresAt: Date;
  };
  ```

- A higher-level **composition/use-case** (in `app/` of either module or a “composition” module) resolves `userId → PublicUserDTO` by calling the user service.

**When to choose:** you want modules maximally independent and avoid domain-level cross-imports.

### Option C (shared kernel/contracts): Extract cross-cutting identities

- Create `src/shared/contracts/identity.ts` with `UserId`/`PublicUserDTO` (no DB, no HTTP).
- Both modules depend on `shared/contracts` instead of each other.

**When to choose:** multiple modules need the same identity/view, or you fear circular deps.

> Practically: Option A is perfectly fine for most apps. If you ever smell a cycle or over-coupling, refactor to B or C.

## 4) Zod/validation placement

- Request validation schemas live in each module’s `http/`.
- Response schemas: either derive from DTOs or colocate in `domain/` as the **contract**.
- Don’t reuse Mongoose schemas for API responses.

## 5) Composition/wiring (no leaks)

At the app’s composition root:

```ts
// app.ts (or a dedicated container)
import {
  makeUserService,
  makeMongoUserRepository as makeUserRepo,
} from "@modules/user";
import {
  makeSessionService,
  makeMongoSessionRepository as makeSessionRepo,
} from "@modules/session";

const userRepo = makeUserRepo();
const userService = makeUserService({ users: userRepo });

const sessionRepo = makeSessionRepo();
const sessionService = makeSessionService({
  sessions: sessionRepo,
  users: userRepo /* or userService */,
});
```

Controllers import only their module’s service + HTTP schemas.

## 6) Lint guardrails (so it stays clean)

- Block imports of `infra/` from outside its module.
- Encourage imports from module roots (`@modules/user`) rather than deep paths.

```js
// .eslintrc
"no-restricted-imports": ["error", {
  "patterns": [
    { "group": ["@modules/*/infra/*"], "message": "Do not import infra directly." }
  ]
}]
```

## 7) Naming consistency

- `user.dto.ts`, `user.repo.ts` (interface), `user.repo.mongo.ts` (impl),
  `user.service.ts`, `user.controller.ts`, `user.routes.ts`.
- DTOs are the _only_ shapes that cross modules.

---

### Direct answers to your questions

- **“every model will be its own folder, further broken down by app/domain/infra/http?”**
  Yes — every **feature** (user, session, interest) gets that structure.

- **“With an index.ts barrel that exports what, only the dtos?”**
  Export DTOs **and** repo interfaces **and** service factories (and optionally the router). **Do not export** models/infra.

- **“sessions interacts with PublicUserDTO, so that would have to be in the user barrel?”**
  Yes, if you choose Option A. Import `PublicUserDTO` from `@modules/user`.
  If you want less coupling, use Option B (return `userId` only) or Option C (shared contracts).

If you want, I can sketch your `session` module two ways (A and B) so you can see the trade-offs concretely with your DTOs and one controller.
