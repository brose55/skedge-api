import { SessionModel } from "@/models/session";

/** Whitelisted public fields for sessions */
export const PUBLIC_SESSION_PROJECTION =
  "_id userAgent valid createdAt updatedAt" as const;

export type PublicSessionDTO = {
  _id: string;
  userAgent?: string;
  valid: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Safe-by-default read: current user's valid sessions, newest first */
export async function findPublicSessionsByUser(
  userId: string,
  opts?: { limit?: number }
): Promise<PublicSessionDTO[]> {
  return SessionModel.find({ userId, valid: true })
    .select(PUBLIC_SESSION_PROJECTION)
    .sort({ createdAt: -1 })
    .limit(opts?.limit ?? 50)
    .lean<PublicSessionDTO[]>()
    .exec();
}
