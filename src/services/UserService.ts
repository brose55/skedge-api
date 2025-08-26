import { FilterQuery } from "mongoose";
import { User, UserModel } from "@/models/user";
import { CreateUserInput } from "../schemas/UserSchema";
import {
  PUBLIC_USER_PROJECTION,
  type PublicUserDTO,
} from "../repos/users.repository";

// Create user → return PublicUserDTO (no secrets ever leave this layer)
export async function createUser(
  input: CreateUserInput["body"]
): Promise<PublicUserDTO> {
  // Strip out passwordConfirmation before saving
  const { passwordConfirmation, ...userData } = input;

  const doc = await UserModel.create(userData);

  // Re-read with the public projection to avoid leaking any hidden fields
  const pub = await UserModel.findById(doc._id)
    .select(PUBLIC_USER_PROJECTION)
    .lean<PublicUserDTO>()
    .exec();

  return pub!; // should exist immediately after create
}

/**
 * Validate credentials.
 * Returns:
 *  - false if invalid
 *  - { user, passwordVersion } if valid (for issuing JWT with pv)
 */
export async function validatePassword(params: {
  email: string;
  password: string;
}): Promise<false | { user: PublicUserDTO; passwordVersion: number }> {
  const { email, password } = params;

  // Need +password to compare, +passwordVersion for JWT pv
  const candidate = await UserModel.findOne({ email }).select(
    "+password +passwordVersion"
  );

  if (!candidate) return false;

  const ok = await candidate.comparePassword(password);
  if (!ok) return false;

  // Fetch a public view to return to callers (no secrets)
  const pub = await UserModel.findById(candidate._id)
    .select(PUBLIC_USER_PROJECTION)
    .lean<PublicUserDTO>()
    .exec();

  return { user: pub!, passwordVersion: candidate.passwordVersion! };
}

/** Public read helper used by controllers or other services */
export function findUser(
  query: FilterQuery<User>
): Promise<PublicUserDTO | null> {
  return UserModel.findOne(query)
    .select(PUBLIC_USER_PROJECTION)
    .lean<PublicUserDTO>()
    .exec();
}
