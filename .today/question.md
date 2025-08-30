Hi chat, I'm making a portfolio project to set myself apart from other junior devs.

Here is my structure.

⋊> ~/N/s/src on main ⨯ tree 20:35:40
.
├── app.ts
├── controllers
│ ├── InterestController.ts
│ ├── SessionController.ts
│ └── UserController.ts
├── middleware
│ ├── cors.ts
│ ├── deserializeUser.ts
│ ├── requireUser.ts
│ └── validateResource.ts
├── models
│ ├── interest
│ │ ├── index.ts
│ │ ├── interest.model.ts
│ │ └── interest.types.ts
│ ├── session
│ │ ├── index.ts
│ │ ├── session.model.ts
│ │ └── session.types.ts
│ └── user
│ ├── index.ts
│ ├── user.model.ts
│ └── user.types.ts
├── repos
│ ├── sessions.repository.ts
│ └── users.repository.ts
├── routes
│ ├── api
│ │ ├── index.ts
│ │ ├── interest-routes.ts
│ │ ├── session-routes.ts
│ │ └── user-routes.ts
│ ├── home-routes.ts
│ └── index.ts
├── schemas
│ ├── InterestSchema.ts
│ ├── SessionSchema.ts
│ └── UserSchema.ts
├── services
│ ├── InterestServices.ts
│ ├── SessionService.ts
│ └── UserService.ts
├── **tests**
│ ├── interest.test.ts
│ └── user.test.ts
├── types
│ └── tokens.ts
└── utils
├── connection.ts
├── cookieNames.ts
├── cookie.ts
├── jwt.ts
├── logger.ts
├── passwordValidator.ts
└── server.ts

15 directories, 41 files

---

Now the problem is, that I added a bunch of dtos to users.repository.ts and sessions.repository.ts so that nobody can interact directly with the model. Ex:

```ts
import { UserModel } from "@/models/user";
import type { User } from "@/models/user";

/** Whitelisted public fields (projection) */
export const PUBLIC_USER_PROJECTION =
  "_id username email createdAt updatedAt" as const;

/** What the API is allowed to return for a User */
export type PublicUserDTO = Pick<
  User,
  "_id" | "username" | "email" | "createdAt" | "updatedAt"
>;

/** Public read by id */
export async function findPublicById(
  id: string
): Promise<PublicUserDTO | null> {
  return UserModel.findById(id)
    .select(PUBLIC_USER_PROJECTION)
    .lean<PublicUserDTO>()
    .exec();
}

/** Auth-only helper: explicitly opts into hidden fields. Do not serialize directly. */
export async function findWithSecretsByEmail(email: string) {
  return UserModel.findOne({ email })
    .select("+password +passwordVersion")
    .exec();
}

/** One-shot read: public user + passwordVersion (for deserializeUser) */
type PublicUserWithPvRow = Pick<
  User,
  "_id" | "username" | "email" | "createdAt" | "updatedAt" | "passwordVersion"
>;

export async function findPublicWithPvById(
  id: string
): Promise<{ user: PublicUserDTO; passwordVersion: number } | null> {
  const doc = await UserModel.findById(id)
    .select(`${PUBLIC_USER_PROJECTION} +passwordVersion`)
    .lean<PublicUserWithPvRow>()
    .exec();

  if (!doc) return null;

  const user: PublicUserDTO = {
    _id: doc._id,
    username: doc.username,
    email: doc.email,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  return { user, passwordVersion: doc.passwordVersion };
}
```

But now I have to clean up old barrels that exported the model and types to other parts of the app. Which I believe I made in the belief that I wouldn't need to import type on every file but still get zero runtime costs. Ex:

```ts
export { default as UserModel } from "./user.model";
export type { User, UserMethods, UserDoc, UserModelType } from "./user.types";
```

And it seems like I should restructure my app, because things are getting thrown all over the place with different naming styles. What do I do to clean this up?
