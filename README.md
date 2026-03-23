# Skedge API

A REST API for **Skedge** - a scheduling assistant that takes a user's available time and a list of interests with priority levels, and generates a personalized schedule for them to follow.

Built as a portfolio project to demonstrate clean backend architecture in Node.js and TypeScript.

---

## What it does

A user tells Skedge:

- How much time they have
- What they want to do (interests like "python", "reading", "health")
- How important each interest is (`low`, `medium`, or `high` priority)

Skedge uses that input to generate a schedule tailored to their time and priorities.

---

## Tech stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (access + refresh token pattern) with bcrypt password hashing
- **Validation**: Zod
- **Testing**: Jest + Supertest + mongodb-memory-server
- **Logging**: Pino

---

## Architecture

The project follows a **feature module** structure with strict layering. Each feature (`user`, `session`, `interest`) is a self-contained module broken into four layers:

```
modules/
└── user/
    ├── domain/        # DTOs and repository interfaces - no DB, no HTTP
    ├── infra/         # Mongoose models and repository implementations
    ├── app/           # Business logic (services)
    └── http/          # Controllers, routes, and request validation
```

### Layer rules

```
Controller → Service → Repository → Database
```

- Controllers handle HTTP only - they never touch a database
- Services contain business logic - they depend on repository interfaces, not implementations
- Repositories handle all database access - they return DTOs, never raw Mongoose documents
- Nothing outside a module imports from its `infra/` folder

### Why this matters

Because services depend on **interfaces** rather than concrete implementations, the real MongoDB repository can be swapped for a fake in tests with no changes to service code:

```ts
// In production
const userService = makeUserService(userRepository); // real Mongoose repo

// In tests
const userService = makeUserService(fakeRepo); // in-memory fake, no DB needed
```

---

## Project structure

```
src/
├── modules/
│   ├── user/
│   │   ├── domain/
│   │   │   ├── user.dto.ts          # PublicUserDTO, NewUser, AuthResult
│   │   │   └── user.repo.ts         # IUserRepository interface
│   │   ├── infra/
│   │   │   ├── user.model.ts        # Mongoose schema + statics
│   │   │   ├── user.types.ts        # Mongoose-specific types
│   │   │   └── user.repo.mongo.ts   # IUserRepository implementation
│   │   ├── app/
│   │   │   ├── user.service.ts      # makeUserService factory
│   │   │   └── user.service.instance.ts
│   │   ├── http/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.routes.ts
│   │   │   └── user.schema.ts       # Zod request validation
│   │   ├── __tests__/
│   │   │   ├── user.service.test.ts       # Unit tests (no DB)
│   │   │   └── user.integration.test.ts   # Integration tests
│   │   └── index.ts                 # Public module surface
│   ├── session/                     # Same structure
│   └── interest/                    # Same structure
├── middleware/
│   ├── cors.ts
│   ├── deserialize-user.ts
│   ├── require-user.ts
│   └── validate-resource.ts
├── utils/
│   ├── connection.ts
│   ├── cookie.ts
│   ├── jwt.ts
│   ├── logger.ts
│   ├── password-validator.ts
│   └── server.ts
├── types/
│   └── tokens.ts
├── health.routes.ts
├── router.ts
└── app.ts
```

---

## API endpoints

### Health

| Method | Path      | Description         |
| ------ | --------- | ------------------- |
| GET    | `/health` | Server health check |

### Users

| Method | Path            | Auth | Description         |
| ------ | --------------- | ---- | ------------------- |
| POST   | `/api/users`    | No   | Register a new user |
| GET    | `/api/users/me` | Yes  | Get current user    |

### Sessions

| Method | Path            | Auth | Description                             |
| ------ | --------------- | ---- | --------------------------------------- |
| POST   | `/api/sessions` | No   | Login (returns access + refresh tokens) |
| GET    | `/api/sessions` | Yes  | List active sessions                    |
| DELETE | `/api/sessions` | Yes  | Logout (invalidates session)            |

### Interests

| Method | Path                         | Auth | Description                |
| ------ | ---------------------------- | ---- | -------------------------- |
| GET    | `/api/interests`             | Yes  | Get user's interests       |
| PUT    | `/api/interests`             | Yes  | Create or update interests |
| DELETE | `/api/interests/:interestId` | Yes  | Delete an interest         |

---

## Auth flow

The API uses a dual-token auth pattern:

1. `POST /api/sessions` returns a short-lived **access token** and a long-lived **refresh token**
2. The access token is sent as a `Bearer` token or cookie on subsequent requests
3. When the access token expires, `deserializeUser` middleware automatically reissues a new one from the refresh token
4. Passwords are hashed with bcrypt and a `passwordVersion` field is stored - when a user changes their password, the version increments and all existing refresh tokens are invalidated

---

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB (or Docker)

### Installation

```bash
git clone https://github.com/yourusername/skedge-api.git
cd skedge-api
npm install
```

## Configuration

The project uses the `config` package. Copy the example config and fill in your values:

```bash
cp config/default.js.example config/default.js
```

Generate an RS256 key pair:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

Then paste the key contents into your config, replacing real newlines with `\n`.

`config/default.js.example`:

```js
module.exports = {
  port: 3000,
  dbUri: "mongodb://localhost:27017/skedge",
  saltWorkFactor: 10,
  accessTokenTtl: "15m",
  refreshTokenTtl: "1y",
  accessTokenCookieTtl: 900000,
  refreshTokenCookieTtl: 3.156e10,
  privateKey: "YOUR_RS256_PRIVATE_KEY",
  publicKey: "YOUR_RS256_PUBLIC_KEY",
  jwt: {
    issuer: "your-app-name",
    audience: "your-client-name",
  },
};
```

Make sure your `.gitignore` includes:

```
config/default.js
config/production.js
config/test.js
.env*
```

> **Never commit config files with real keys.** If they are already tracked, untrack them with `git rm --cached config/default.js` before `.gitignore` will take effect.

### Running locally

```bash
npm run dev
```

### Running tests

```bash
# All tests
npm test

# Unit tests only (no DB required)
npm test -- --testPathPattern="service.test"

# Integration tests only
npm test -- --testPathPattern="integration.test"
```

---

## Testing approach

The project has two levels of tests per module:

**Unit tests** - fast, no database. The repository is replaced with a typed fake so service logic can be tested in complete isolation:

```ts
const fakeRepo: IUserRepository = {
  findPublicById: async () => mockUser,
  // ...
};
const service = makeUserService(fakeRepo);
```

**Integration tests** - spin up a real in-memory MongoDB via `mongodb-memory-server` and hit the actual Express routes with Supertest. These test the full request/response cycle including middleware, validation, and database interaction.

---

## Key design decisions

**DTOs over raw documents** - the database layer never returns Mongoose documents to upper layers. Every repo method returns a plain DTO with only whitelisted fields, so sensitive fields like `password` and `passwordVersion` can never accidentally leak into a response.

**Repository interfaces** - services depend on `IUserRepository`, not `UserModel`. This is what makes unit testing without a database possible.

**Factory functions** - services are created with `makeUserService(repo)` rather than being singletons. The repo is injected, not imported. This is dependency injection without a DI container.

**Strict module boundaries** - nothing outside a module imports from its `infra/` folder. The module's `index.ts` is the only public surface, and it only exports DTOs, interfaces, routers, and factories.

## Reflections

This project started with a flat structure and leaky barrels exporting
Mongoose models directly into controllers. Refactoring it into feature
modules with strict layer boundaries taught me why architecture decisions
that feel like overhead early on pay off when the codebase grows,
particularly around testability and preventing accidental data leaks.

If I were starting over I'd establish the module structure from day one
rather than retrofitting it.
