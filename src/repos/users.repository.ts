import { UserModel } from "@/models/user";
import type { User } from "@/models/user";
import type { AuthResult, NewUser, PublicUserDTO } from "@/types/user.dto";

// Whitelisted public fields
export const PUBLIC_USER_PROJECTION =
  "_id username email createdAt updatedAt" as const;

export async function createPublicUser(input: NewUser): Promise<PublicUserDTO> {
  const doc = await UserModel.create(input);

  // Re-read with a public projection (prevents leaking password)
  const pub = await UserModel.findById(doc._id)
    .select(PUBLIC_USER_PROJECTION)
    .lean<PublicUserDTO>()
    .exec();

  // Immediately after create, this should exist
  if (!pub) throw new Error("failed to load created user");
  return pub;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  return UserModel.authenticate(email, password);
}

/** Public read by id */
export async function findPublicById(
  id: string
): Promise<PublicUserDTO | null> {
  return UserModel.findById(id)
    .select(PUBLIC_USER_PROJECTION)
    .lean<PublicUserDTO>()
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
