import config from "config";
import { FilterQuery, UpdateQuery } from "mongoose";
import { SessionModel, Session } from "@/models/session";
import { signJwt, verifyJwt } from "../utils/jwt";
import { UserModel } from "@/models/user"; // needed to read +passwordVersion
import type { AccessRefreshPayload } from "@/types/tokens";
import logger from "@/utils/logger";

export async function createSession(userId: string, userAgent?: string) {
  const session = await SessionModel.create({
    userId,
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
  const log = logger.child({ svc: "SessionService", op: "reissueAccessToken" });

  const verification = verifyJwt(refreshToken);
  if (!verification.valid || typeof verification.decoded !== "object") {
    log.warn(
      { reason: "verify_failed", expired: verification.expired },
      "refresh token verification failed"
    );
    return false;
  }

  const {
    session: sessionId,
    pv: refreshPv,
    sub,
  } = verification.decoded as AccessRefreshPayload;

  if (!sessionId) {
    log.warn(
      { reason: "missing_session", sub },
      "token missing `session` claim"
    );
    return false;
  }

  // Lean row typed from your Session type
  type SessionRow = Pick<Session, "_id" | "valid" | "userId">;

  const session = await SessionModel.findById(sessionId)
    .select("_id valid userId")
    .lean<SessionRow>()
    .exec();

  if (!session) {
    log.warn({ reason: "session_not_found", sessionId }, "session not found");
    return false;
  }
  if (!session.valid) {
    log.warn(
      { reason: "session_invalid", sessionId },
      "session marked invalid"
    );
    return false;
  }

  // Use session.userId; fall back to token sub if needed
  const userId = session.userId || sub;
  if (!userId) {
    log.warn(
      { reason: "user_unresolved", sessionId },
      "could not resolve userId from session"
    );
    return false;
  }

  // Read current passwordVersion (it's select:false → must opt in)
  const userWithPv = await UserModel.findById(userId).select(
    "+passwordVersion"
  );
  if (!userWithPv) {
    log.warn({ reason: "user_not_found", userId, sessionId }, "user not found");
    return false;
  }

  // Deny reissue if refresh pv doesn't match current pv
  if (
    typeof refreshPv === "number" &&
    refreshPv !== userWithPv.passwordVersion
  ) {
    log.warn(
      {
        reason: "pv_mismatch",
        userId: String(userWithPv._id),
        sessionId,
        refreshPv,
        currentPv: userWithPv.passwordVersion,
      },
      "password version mismatch; denying reissue"
    );
    return false;
  }

  const accessToken = signJwt(
    {
      sub: String(userWithPv._id),
      pv: userWithPv.passwordVersion,
      session: String(session._id),
    },
    { expiresIn: config.get("accessTokenTtl") }
  );

  log.info(
    { event: "access_reissued", userId: String(userWithPv._id), sessionId },
    "issued new access token from refresh"
  );

  return accessToken;
}
