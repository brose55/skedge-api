// middleware/deserializeUser.ts
import { Request, Response, NextFunction } from "express";
import { get } from "lodash";
import config from "config";
import { reissueAccessToken } from "../services/SessionService";
import { verifyJwt } from "../utils/jwt";
import { getCookieNames, getCookieOptions } from "@/utils/cookie";
import { findPublicWithPvById } from "@/repos/users.repository";
import type { AccessRefreshPayload } from "@/types/tokens";

const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const names = getCookieNames();

  // Access token from cookie or Authorization: Bearer
  const accessToken =
    get(req, `cookies.${names.access}`) ||
    get(req, "headers.authorization", "").replace(/^Bearer\s/, "");

  // Refresh token from cookie or x-refresh header
  const refreshToken =
    get(req, `cookies.${names.refresh}`) ||
    (get(req, "headers.x-refresh") as string | undefined);

  // No tokens → unauthenticated passthrough
  if (!accessToken && !refreshToken) return next();

  // Try current access token
  if (accessToken) {
    const verification = verifyJwt(accessToken);

    if (verification.valid && typeof verification.decoded === "object") {
      const { sub, pv } = verification.decoded as AccessRefreshPayload;

      if (typeof sub === "string" && typeof pv === "number") {
        // Single query: public user + passwordVersion
        const record = await findPublicWithPvById(sub);
        if (record && record.passwordVersion === pv) {
          res.locals.user = record.user;
          return next();
        }
        // pv mismatch: treat as invalid; try refresh if available
        if (!refreshToken) return next();
      }
    }

    // Invalid/expired and no refresh token
    if (!refreshToken) return next();
  }

  // Refresh flow
  if (!refreshToken) return next();

  const newAccessToken = await reissueAccessToken({ refreshToken });
  if (!newAccessToken) return next();

  // Set the new access token (cookie + header)
  const cookieOptions = getCookieOptions();
  res.setHeader("x-access-token", newAccessToken);
  res.cookie(names.access, newAccessToken, {
    ...cookieOptions,
    maxAge: config.get<number>("accessTokenCookieTtl"),
  });

  // Verify the new access token and hydrate public user (single query again)
  const newVerification = verifyJwt(newAccessToken);
  if (newVerification.valid && typeof newVerification.decoded === "object") {
    const { sub, pv } = newVerification.decoded as AccessRefreshPayload;

    if (typeof sub === "string" && typeof pv === "number") {
      const record = await findPublicWithPvById(sub);
      if (record && record.passwordVersion === pv) {
        res.locals.user = record.user;
      }
    }
  }

  return next();
};

export default deserializeUser;
