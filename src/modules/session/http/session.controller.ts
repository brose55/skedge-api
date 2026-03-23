import { Request, Response } from "express";
import config from "config";
import { sessionService } from "../app/session.service.instance";
import { signJwt, verifyJwt } from "@/utils/jwt";
import { getCookieOptions, getCookieNames } from "@/utils/cookie";
import type { AccessRefreshPayload } from "@/types/tokens";

export async function createUserSessionHandler(req: Request, res: Response) {
  const result = await sessionService.validatePassword(
    req.body.email,
    req.body.password,
  );
  if (!result) return res.status(401).send("Invalid email or password");

  const { user, passwordVersion } = result;

  const session = await sessionService.createSession(
    user._id,
    req.get("user-agent") || undefined,
  );

  const accessToken = signJwt(
    { sub: user._id, pv: passwordVersion, session: session._id },
    { expiresIn: config.get("accessTokenTtl") },
  );

  const refreshToken = signJwt(
    { sub: user._id, pv: passwordVersion, session: session._id },
    { expiresIn: config.get("refreshTokenTtl") },
  );

  const opts = getCookieOptions();
  const names = getCookieNames();

  res.cookie(names.access, accessToken, {
    ...opts,
    maxAge: config.get<number>("accessTokenCookieTtl"),
  });
  res.cookie(names.refresh, refreshToken, {
    ...opts,
    maxAge: config.get<number>("refreshTokenCookieTtl"),
  });

  return res.status(201).send({ accessToken, refreshToken, user });
}

export async function getUserSessionHandler(_req: Request, res: Response) {
  const userId = res.locals.user?._id as string | undefined;
  if (!userId) return res.sendStatus(401);

  res.setHeader("Cache-Control", "no-store");
  const sessions = await sessionService.findSessionsByUser(userId);
  return res.send(sessions ?? []);
}

export async function deleteUserSessionHandler(req: Request, res: Response) {
  const names = getCookieNames();

  const refreshToken =
    req.cookies?.[names.refresh] ||
    (req.headers["x-refresh"] as string | undefined);
  const accessToken =
    req.cookies?.[names.access] ||
    req.headers.authorization?.replace(/^Bearer\s/, "") ||
    undefined;

  let sessionId: string | null = null;

  if (refreshToken) {
    const result = verifyJwt(refreshToken);
    if (result.valid && typeof result.decoded === "object") {
      sessionId = (result.decoded as AccessRefreshPayload).session;
    }
  }

  if (!sessionId && accessToken) {
    const result = verifyJwt(accessToken);
    if (result.valid && typeof result.decoded === "object") {
      sessionId = (result.decoded as AccessRefreshPayload).session;
    }
  }

  if (sessionId) await sessionService.invalidateSession(sessionId);

  const cookieOptions = getCookieOptions();
  res.clearCookie(names.access, cookieOptions);
  res.clearCookie(names.refresh, cookieOptions);

  return res.status(204).end();
}
