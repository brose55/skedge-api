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
