import { get } from "lodash";
import { FilterQuery, UpdateQuery } from "mongoose";
import { SessionModel, Session } from "@/models/session";
import { signJwt, verifyJwt } from "../utils/jwt";
import { UserModel } from "@/models/user"; // needed to read +passwordVersion
import config from "config";

export async function createSession(userId: string, userAgent?: string) {
  const session = await SessionModel.create({
    user: userId,
    ...(userAgent ? { userAgent } : {}),
  });
  return session.toJSON();
}

export async function findSessions(query: FilterQuery<Session>) {
  return SessionModel.find(query).lean();
}

export async function updateSession(
  query: FilterQuery<Session>,
  update: UpdateQuery<Session>
) {
  return SessionModel.updateOne(query, update);
}

/**
 * Reissue a short-lived access token from a valid refresh token.
 * - Verifies refresh token and session
 * - Loads current passwordVersion
 * - (Optionally) denies reissue if refresh's pv != current pv
 * - Signs a new access token with { sub, pv, session }
 */
export async function reissueAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}): Promise<string | false> {
  const { decoded } = verifyJwt(refreshToken);
  if (!decoded || typeof decoded !== "object") return false;

  const sessionId = get(decoded, "session");
  if (!sessionId) return false;

  const session = await SessionModel.findById(sessionId);
  if (!session || !session.valid) return false;

  // Session schema might store `user` or `userId`; support both.
  const userId = (session as any).user ?? (session as any).userId;
  if (!userId) return false;

  // Read current passwordVersion (it's select:false → must opt in)
  const userWithPv = await UserModel.findById(userId).select(
    "+passwordVersion"
  );
  if (!userWithPv) return false;

  // Optional: if your refresh token payload also includes pv, reject on mismatch
  const refreshPv = get(decoded, "pv");
  if (
    typeof refreshPv === "number" &&
    refreshPv !== userWithPv.passwordVersion
  ) {
    // Password changed since refresh token was issued → deny reissue
    return false;
  }

  // Issue a new access token carrying the latest pv
  const accessToken = signJwt(
    {
      sub: userWithPv._id,
      pv: userWithPv.passwordVersion,
      session: session._id,
    },
    { expiresIn: config.get("accessTokenTtl") }
  );

  return accessToken;
}
