import { FilterQuery } from "mongoose";
import { UserModel } from "@/models/user";
import type { User } from "@/models/user";
import type { CreateUserInput } from "../schemas/UserSchema";

import {
  findPublicById,
  findWithSecretsByEmail,
  type PublicUserDTO,
} from "@/repos/users.repository";

/** Create user → return PublicUserDTO (no secrets ever leave this layer) */
export async function createUser(
  input: CreateUserInput["body"]
): Promise<PublicUserDTO> {
  // Strip out passwordConfirmation before saving
  const { passwordConfirmation, ...userData } = input;

  const doc = await UserModel.create(userData);

  // Re-read via repo with the public projection (safe-by-default)
  const pub = await findPublicById(doc._id.toString());
  return pub!; // present immediately after create
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

  // Load secrets only here
  const candidate = await findWithSecretsByEmail(email);
  if (!candidate) return false;

  const ok = await candidate.comparePassword(password);
  if (!ok) return false;

  // Return a public view
  const pub = await findPublicById(candidate._id.toString());
  if (!pub) return false;

  return { user: pub, passwordVersion: candidate.passwordVersion! };
}
