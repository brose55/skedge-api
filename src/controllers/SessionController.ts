// controllers/SessionController.ts
import { Request, Response } from "express";
import config from "config";
import {
  createSession,
  findSessions,
  updateSession,
} from "../services/SessionService";
import { validatePassword } from "../services/UserService";
import { signJwt, verifyJwt } from "../utils/jwt";
import { getCookieOptions, getCookieNames } from "@/utils/cookie";
import { findPublicSessionsByUser } from "@/repos/sessions.repository";
import type { AccessRefreshPayload } from "@/types/tokens";
import { Session } from "@/models/session";

// POST /sessions  (login)
export async function createUserSessionHandler(req: Request, res: Response) {
  // 1) Validate credentials
  const result = await validatePassword(req.body);
  if (!result) return res.status(401).send("Invalid email or password");

  const { user, passwordVersion } = result;

  // 2) Create session
  const session: Session = await createSession(
    user._id,
    req.get("user-agent") || undefined
  );

  // 3) Issue tokens with { sub, pv, session }
  const accessToken = signJwt(
    { sub: user._id, pv: passwordVersion, session: session._id },
    { expiresIn: config.get("accessTokenTtl") }
  );

  const refreshToken = signJwt(
    { sub: user._id, pv: passwordVersion, session: session._id },
    { expiresIn: config.get("refreshTokenTtl") }
  );

  // 4) Set cookies (names + options come from helpers)
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

  // return tokens; TODO: optionally include the public user
  return res.status(201).send({ accessToken, refreshToken, user });
}

// GET /sessions  (list sessions for current user)
export async function getUserSessionHandler(_req: Request, res: Response) {
  // res.locals.user is a PublicUserDTO (set by deserializeUser)
  const userId = res.locals.user?._id as string | undefined;
  if (!userId) return res.sendStatus(401);

  // prevent caches from storing session listings
  res.setHeader("Cache-Control", "no-store");

  const sessions = await findPublicSessionsByUser(userId);
  return res.send(sessions ?? []);
}

// DELETE /sessions  (logout current session)

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
      const { session } = result.decoded as AccessRefreshPayload;
      sessionId = session;
    }
  }

  if (!sessionId && accessToken) {
    const result = verifyJwt(accessToken);
    if (result.valid && typeof result.decoded === "object") {
      const { session } = result.decoded as AccessRefreshPayload;
      sessionId = session;
    }
  }

  if (sessionId) {
    await updateSession({ _id: sessionId }, { valid: false });
  }

  const cookieOptions = getCookieOptions();
  res.clearCookie(names.access, cookieOptions);
  res.clearCookie(names.refresh, cookieOptions);

  return res.status(204).end();
}
