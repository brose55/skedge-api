// modules/session/app/session.service.ts
import config from "config";
import type { ISessionRepository } from "../domain/session.repo";
import type { IUserRepository } from "../../user/domain/user.repo";
import type { PublicSessionDTO } from "../domain/session.dto";
import { signJwt, verifyJwt } from "@/utils/jwt";
import logger from "@/utils/logger";
import type { AccessRefreshPayload } from "@/types/tokens";

export function makeSessionService(deps: {
  sessions: ISessionRepository;
  users: IUserRepository;
}) {
  const { sessions, users } = deps;

  return {
    async createSession(
      userId: string,
      userAgent?: string,
    ): Promise<PublicSessionDTO> {
      return sessions.createSession({ userId, userAgent });
    },

    async findSessionsByUser(userId: string): Promise<PublicSessionDTO[]> {
      return sessions.findSessionsByUser(userId);
    },

    async invalidateSession(sessionId: string): Promise<void> {
      return sessions.invalidateSession(sessionId);
    },

    async validatePassword(email: string, password: string) {
      const outcome = await users.authenticateUser(email, password);
      if (!outcome.ok) {
        logger.info(
          { at: "session.validatePassword", email, reason: outcome.reason },
          "auth failed",
        );
        return false;
      }
      return { user: outcome.user, passwordVersion: outcome.passwordVersion };
    },

    async reissueAccessToken({
      refreshToken,
    }: {
      refreshToken: string;
    }): Promise<string | false> {
      const log = logger.child({
        svc: "SessionService",
        op: "reissueAccessToken",
      });

      const verification = verifyJwt(refreshToken);
      if (!verification.valid || typeof verification.decoded !== "object") {
        log.warn(
          { reason: "verify_failed", expired: verification.expired },
          "refresh token verification failed",
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
          "token missing session claim",
        );
        return false;
      }

      const userWithPv = await users.findPublicWithPvById(sub);
      if (!userWithPv) {
        log.warn(
          { reason: "user_not_found", sub, sessionId },
          "user not found",
        );
        return false;
      }

      if (
        typeof refreshPv === "number" &&
        refreshPv !== userWithPv.passwordVersion
      ) {
        log.warn(
          {
            reason: "pv_mismatch",
            sessionId,
            refreshPv,
            currentPv: userWithPv.passwordVersion,
          },
          "password version mismatch",
        );
        return false;
      }

      return signJwt(
        {
          sub: userWithPv.user._id,
          pv: userWithPv.passwordVersion,
          session: sessionId,
        },
        { expiresIn: config.get("accessTokenTtl") },
      );
    },
  };
}
