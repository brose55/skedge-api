/**
 * Public user access layer: use these functions from services.
 * Never import UserModel in services.
 * All responses MUST be either:
 *  - a public read using PUBLIC_USER_PROJECTION (lean),
 *  - or a DTO created via toPublicUser().
 */

import UserModel from "../models/user/user.model";

/** Whitelisted public fields (projection) */
export const PUBLIC_USER_PROJECTION =
  "_id username email createdAt updatedAt" as const;

/** What the API is allowed to return for a User */
export type PublicUserDTO = {
  _id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Optional: centralized DTO builder if you ever load full docs */
export function toPublicUser(u: any): PublicUserDTO {
  return {
    _id: String(u._id),
    username: u.username,
    email: u.email,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

/** Safe-by-default reads */
export async function findPublicById(
  id: string
): Promise<PublicUserDTO | null> {
  return UserModel.findById(id)
    .select(PUBLIC_USER_PROJECTION)
    .lean<PublicUserDTO>()
    .exec();
}

// TODO: make this specific or get rid of it
export async function findPublicOne(cond: any): Promise<PublicUserDTO | null> {
  return UserModel.findOne(cond)
    .select(PUBLIC_USER_PROJECTION)
    .lean<PublicUserDTO>()
    .exec();
}

/** Auth-only helpers explicitly opt into hidden fields and never return them */
export async function findWithSecretsByEmail(email: string) {
  return UserModel.findOne({ email })
    .select("+password +passwordVersion")
    .exec(); // callers must NOT serialize this directly
}
