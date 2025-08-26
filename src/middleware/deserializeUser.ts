// middleware/deserializeUser.ts
import { Request, Response, NextFunction } from "express";
import { get } from "lodash";
import config from "config";
import { reissueAccessToken } from "../services/SessionService";
import { verifyJwt } from "../utils/jwt";
import { UserModel } from "@/models/user";
import { PUBLIC_USER_PROJECTION } from "@/repos/users.repository";

const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Access token from cookie or Authorization: Bearer
  const accessToken =
    get(req, "cookies.accessToken") ||
    get(req, "headers.authorization", "").replace(/^Bearer\s/, "");

  // Refresh token from cookie or x-refresh header
  const refreshToken =
    get(req, "cookies.refreshToken") ||
    (get(req, "headers.x-refresh") as string | undefined);

  // No tokens means unauthenticated, passthrough
  if (!accessToken && !refreshToken) return next();

  // Try current access token
  if (accessToken) {
    const { decoded, expired } = verifyJwt(accessToken);

    if (
      decoded &&
      typeof decoded === "object" &&
      "sub" in decoded &&
      "pv" in decoded
    ) {
      const { sub, pv } = decoded as { sub: string; pv: number };

      // Check current passwordVersion in DB
      const fresh = await UserModel.findById(sub).select("+passwordVersion");
      if (fresh && fresh.passwordVersion === pv) {
        // Hydrate a public view for downstream handlers
        const pub = await UserModel.findById(sub)
          .select(PUBLIC_USER_PROJECTION)
          .lean()
          .exec();

        res.locals.user = pub;
        return next();
      }
      // pv mismatch: treat as invalid; continue to refresh (if present)
      if (!refreshToken) return next();
    }

    // Invalid/expired token and no refresh: move on
    if (!refreshToken) return next();
  }

  // Try refresh flow
  if (!refreshToken) return next();

  const newAccessToken = await reissueAccessToken({ refreshToken });
  if (!newAccessToken) return next();

  // Set the new access token (cookie + header)
  res.setHeader("x-access-token", newAccessToken);
  res.cookie("accessToken", newAccessToken, {
    maxAge: config.get<number>("accessTokenCookieTtl"),
    httpOnly: true,
    domain: config.get<string>("domain"),
    path: "/",
    sameSite: "strict",
    secure: false, // set true in prod
  });

  // Verify the new access token and hydrate public user
  const { decoded: decodedNew } = verifyJwt(newAccessToken);
  if (
    decodedNew &&
    typeof decodedNew === "object" &&
    "sub" in decodedNew &&
    "pv" in decodedNew
  ) {
    const { sub, pv } = decodedNew as { sub: string; pv: number };
    const fresh = await UserModel.findById(sub).select("+passwordVersion");
    if (fresh && fresh.passwordVersion === pv) {
      const pub = await UserModel.findById(sub)
        .select(PUBLIC_USER_PROJECTION)
        .lean()
        .exec();
      res.locals.user = pub;
    }
  }

  return next();
};

export default deserializeUser;
